<?php

declare(strict_types=1);

/*
 * ═══════════════════════════════════════════════════════════
 * Senderos — verificacion_lib.php
 * Núcleo del sistema de verificación en dos pasos por correo.
 *
 * Reglas implementadas:
 *  - Código numérico de 6 dígitos (string, conserva ceros iniciales).
 *  - Generación criptográficamente segura (random_int).
 *  - Validez de 5 minutos, un solo uso, máximo 5 intentos.
 *  - Un solo desafío activo por usuario+tipo: crear uno nuevo cancela
 *    el anterior.
 *  - Reenvío con espera de 60 s y máximo 5 reenvíos.
 *  - Límites por usuario y por IP para evitar abusos.
 *  - Solo se persiste un HMAC-SHA256 del código con clave del servidor.
 *  - El código NUNCA se devuelve por API, ni se registra en logs.
 * ═══════════════════════════════════════════════════════════
 */

/** Tipos de desafío válidos (columna `tipo` de la tabla verificaciones). */
const VERIF_TIPO_LOGIN = 'login';
const VERIF_TIPO_PERFIL = 'perfil';
const VERIF_TIPO_EMAIL_ACTUAL = 'email_actual';
const VERIF_TIPO_EMAIL_NUEVO = 'email_nuevo';

/**
 * Genera un código de 6 dígitos criptográficamente seguro.
 * Se devuelve como string para conservar los ceros iniciales.
 */
function verifGenerarCodigo(): string
{
    return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * HMAC-SHA256 del código, ligado al usuario y al tipo de operación.
 * Así un mismo código numérico nunca produce el mismo hash entre
 * usuarios ni entre flujos distintos (login ≠ perfil ≠ email).
 */
function verifHashCodigo(string $codigo, int $usuarioId, string $tipo): string
{
    return hash_hmac(
        'sha256',
        $tipo . '|' . $usuarioId . '|' . $codigo,
        hmacClave()
    );
}

/**
 * Comparación en tiempo constante de dos hashes.
 */
function verifCompararHash(string $esperado, string $recibido): bool
{
    return hash_equals($esperado, $recibido);
}

/* ═══════════════════════════════════════════
   Contador de solicitudes (anti-abuso)
   ═══════════════════════════════════════════ */

/**
 * Registra una solicitud con la clave dada (p. ej. "ip:1.2.3.4" o
 * "usuario:15") para poder limitar su frecuencia.
 */
function verifRegistrarSolicitud(string $clave): void
{
    try {
        $db = getDB();

        $stmt = $db->prepare("
            INSERT INTO verificaciones_rate (clave, creado_en)
            VALUES (?, NOW())
        ");

        $stmt->execute([$clave]);

        /* Limpieza oportunista de registros viejos (> 24 h). */
        $db->exec("
            DELETE FROM verificaciones_rate
            WHERE creado_en < NOW() - INTERVAL 1 DAY
            LIMIT 200
        ");
    } catch (Throwable $e) {
        error_log('Senderos verif rate: ' . $e->getMessage());
    }
}

/**
 * Devuelve cuántas registraciones tuvo la clave en la ventana indicada.
 */
function verifContarSolicitudes(string $clave, int $ventanaMin): int
{
    try {
        $db = getDB();

        $stmt = $db->prepare("
            SELECT COUNT(*)
            FROM verificaciones_rate
            WHERE clave = ?
              AND creado_en > NOW() - INTERVAL ? MINUTE
        ");

        $stmt->execute([$clave, $ventanaMin]);

        return (int)$stmt->fetchColumn();
    } catch (Throwable $e) {
        error_log('Senderos verif rate count: ' . $e->getMessage());

        /* Si el contador falla, no se bloquea el servicio por 1 minuto. */
        return 0;
    }
}

/* ═══════════════════════════════════════════
   Creación de desafíos
   ═══════════════════════════════════════════ */

/**
 * Crea (o reemplaza) el desafío activo de un usuario para un tipo de
 * operación y devuelve el código generado, SOLO para que el llamador lo
 * envíe por correo. Este valor jamás debe devolverse por API ni loguearse.
 *
 * Campos de $datosPendientes (opcional): cambios que el desafío autoriza,
 * guardados en el servidor para que el navegador no pueda alterarlos
 * después de emitir el código.
 *
 * Devuelve ['ok' => bool, 'codigo' => string|null, 'desafio_id' => int|null,
 *           'error' => string|null]
 */
function verifCrearDesafio(
    int $usuarioId,
    string $tipo,
    string $emailDestino,
    ?array $datosPendientes = null
): array {
    $tiposValidos = [
        VERIF_TIPO_LOGIN,
        VERIF_TIPO_PERFIL,
        VERIF_TIPO_EMAIL_ACTUAL,
        VERIF_TIPO_EMAIL_NUEVO
    ];

    if (!in_array($tipo, $tiposValidos, true)) {
        return ['ok' => false, 'codigo' => null, 'desafio_id' => null, 'error' => 'tipo_invalido'];
    }

    if ($usuarioId <= 0 || $emailDestino === '') {
        return ['ok' => false, 'codigo' => null, 'desafio_id' => null, 'error' => 'datos_invalidos'];
    }

    try {
        $db = getDB();

        /* Límite de creación por usuario e por IP en la última hora. */
        if (
            verifContarSolicitudes('usuario:' . $usuarioId, 60) >=
            CODIGO_DESAFIOS_USUARIO_HORA
        ) {
            return [
                'ok' => false,
                'codigo' => null,
                'desafio_id' => null,
                'error' => 'limite_usuario'
            ];
        }

        if (
            verifContarSolicitudes('ip:' . ipCliente(), 60) >=
            CODIGO_DESAFIOS_IP_HORA
        ) {
            return ['ok' => false, 'codigo' => null, 'desafio_id' => null, 'error' => 'limite_ip'];
        }

        $codigo = verifGenerarCodigo();

        $hash = verifHashCodigo($codigo, $usuarioId, $tipo);

        /*
         * Un solo desafío activo por usuario+tipo: el anterior queda
         * cancelado (invalidación al generar uno nuevo).
         */
        $stmt = $db->prepare("
            UPDATE verificaciones
            SET estado = 'cancelado'
            WHERE usuario_id = ?
              AND tipo = ?
              AND estado = 'pendiente'
        ");

        $stmt->execute([$usuarioId, $tipo]);

        $stmt = $db->prepare("
            INSERT INTO verificaciones
            (
                usuario_id,
                tipo,
                codigo_hash,
                email_destino,
                datos_pendientes,
                intentos,
                reenvios,
                estado,
                ip,
                creado_en,
                ultimo_envio,
                expira_en
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                0,
                0,
                'pendiente',
                ?,
                NOW(),
                NOW(),
                NOW() + INTERVAL ? MINUTE
            )
        ");

        $stmt->execute([
            $usuarioId,
            $tipo,
            $hash,
            $emailDestino,
            $datosPendientes !== null
                ? json_encode($datosPendientes, JSON_UNESCAPED_UNICODE)
                : null,
            ipCliente(),
            CODIGO_VALIDEZ_MIN
        ]);

        $desafioId = (int)$db->lastInsertId();

        verifRegistrarSolicitud('usuario:' . $usuarioId);
        verifRegistrarSolicitud('ip:' . ipCliente());

        return [
            'ok' => true,
            'codigo' => $codigo,
            'desafio_id' => $desafioId,
            'error' => null
        ];
    } catch (Throwable $e) {
        error_log('Senderos verif crear: ' . $e->getMessage());

        return ['ok' => false, 'codigo' => null, 'desafio_id' => null, 'error' => 'error_interno'];
    }
}

/* ═══════════════════════════════════════════
   Consulta y validación de desafíos
   ═══════════════════════════════════════════ */

/**
 * Busca el desafío activo (pendiente y no vencido) de un usuario para
 * un tipo dado. Si está vencido lo marca como tal y devuelve null.
 */
function verifDesafioActivo(int $usuarioId, string $tipo): ?array
{
    try {
        $db = getDB();

        $stmt = $db->prepare("
            SELECT *
            FROM verificaciones
            WHERE usuario_id = ?
              AND tipo = ?
              AND estado = 'pendiente'
            ORDER BY id DESC
            LIMIT 1
        ");

        $stmt->execute([$usuarioId, $tipo]);

        $desafio = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$desafio) {
            return null;
        }

        if (strtotime((string)$desafio['expira_en']) < time()) {
            verifMarcarEstado((int)$desafio['id'], 'vencido');
            return null;
        }

        return $desafio;
    } catch (Throwable $e) {
        error_log('Senderos verif activo: ' . $e->getMessage());
        return null;
    }
}

/**
 * Estado genérico de un desafío por id, sin filtrar por usuario.
 * El llamador SIEMPRE debe verificar la pertenencia (usuario_id).
 */
function verifDesafioPorId(int $id): ?array
{
    try {
        $db = getDB();

        $stmt = $db->prepare("
            SELECT *
            FROM verificaciones
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$id]);

        $desafio = $stmt->fetch(PDO::FETCH_ASSOC);

        return $desafio ?: null;
    } catch (Throwable $e) {
        error_log('Senderos verif por id: ' . $e->getMessage());
        return null;
    }
}

/**
 * Valida un código ingresado contra un desafío.
 *
 * Devuelve:
 *   ['ok' => true]  → código correcto (el desafío queda marcado 'usado')
 *   ['ok' => false, 'motivo' => 'vencido'|'usado'|'cancelado'|'intentos'|
 *                                'incorrecto']
 *
 * El desafío debe haber sido cargado y pertenecer al usuario correcto
 * por el llamador (nunca se toma el usuario desde parámetros del cliente).
 */
function verifValidarCodigo(array $desafio, string $codigo): array
{
    $estado = (string)$desafio['estado'];

    if ($estado === 'usado') {
        return ['ok' => false, 'motivo' => 'usado'];
    }

    if ($estado === 'cancelado') {
        return ['ok' => false, 'motivo' => 'cancelado'];
    }

    if ($estado !== 'pendiente') {
        return ['ok' => false, 'motivo' => 'vencido'];
    }

    if (strtotime((string)$desafio['expira_en']) < time()) {
        verifMarcarEstado((int)$desafio['id'], 'vencido');
        return ['ok' => false, 'motivo' => 'vencido'];
    }

    if ((int)$desafio['intentos'] >= CODIGO_INTENTOS_MAX) {
        verifMarcarEstado((int)$desafio['id'], 'vencido');
        return ['ok' => false, 'motivo' => 'intentos'];
    }

    /* El código llega como string: se normaliza a 6 dígitos. */
    $codigo = preg_replace('/\D+/', '', $codigo) ?? '';

    if (strlen($codigo) !== 6) {
        return ['ok' => false, 'motivo' => 'incorrecto'];
    }

    $hashCalculado = verifHashCodigo(
        $codigo,
        (int)$desafio['usuario_id'],
        (string)$desafio['tipo']
    );

    $esCorrecto = verifCompararHash(
        (string)$desafio['codigo_hash'],
        $hashCalculado
    );

    /*
     * Se registra el intento ANTES de responder: aunque el código sea
     * correcto el contador aumenta, evitando reutilización en blanco.
     */
    $db = getDB();

    $stmt = $db->prepare("
        UPDATE verificaciones
        SET intentos = intentos + 1
        WHERE id = ? AND estado = 'pendiente'
    ");

    $stmt->execute([(int)$desafio['id']]);

    if (!$esCorrecto) {
        return ['ok' => false, 'motivo' => 'incorrecto'];
    }

    /* Un solo uso: se invalida inmediatamente al aceptarse. */
    verifMarcarEstado((int)$desafio['id'], 'usado');

    return ['ok' => true, 'motivo' => null];
}

/**
 * Cambia el estado de un desafío. 'usado' registra además la fecha.
 */
function verifMarcarEstado(int $id, string $estado): void
{
    $estados = ['pendiente', 'usado', 'vencido', 'cancelado'];

    if (!in_array($estado, $estados, true)) {
        return;
    }

    try {
        $db = getDB();

        if ($estado === 'usado') {
            $stmt = $db->prepare("
                UPDATE verificaciones
                SET estado = 'usado', usado_en = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$id]);
        } else {
            $stmt = $db->prepare("
                UPDATE verificaciones
                SET estado = ?
                WHERE id = ?
            ");
            $stmt->execute([$estado, $id]);
        }
    } catch (Throwable $e) {
        error_log('Senderos verif estado: ' . $e->getMessage());
    }
}

/**
 * Cancela el desafío activo de un usuario para un tipo dado
 * (p. ej. al abortar un cambio de datos).
 */
function verifCancelarActivo(int $usuarioId, string $tipo): void
{
    try {
        $db = getDB();

        $stmt = $db->prepare("
            UPDATE verificaciones
            SET estado = 'cancelado'
            WHERE usuario_id = ?
              AND tipo = ?
              AND estado = 'pendiente'
        ");

        $stmt->execute([$usuarioId, $tipo]);
    } catch (Throwable $e) {
        error_log('Senderos verif cancelar: ' . $e->getMessage());
    }
}

/**
 * Marca un desafío como 'pendiente' otra vez para el reenvío, con
 * nuevo código, nueva expiración y contador de reenvíos +1.
 * Devuelve el nuevo código para el envío por correo.
 *
 * Devuelve ['ok' => bool, 'codigo' => string|null, 'motivo' => string|null]
 */
function verifReenviar(?array $desafio): array
{
    if (!$desafio) {
        return ['ok' => false, 'codigo' => null, 'motivo' => 'no_disponible'];
    }

    if ((string)$desafio['estado'] !== 'pendiente') {
        return ['ok' => false, 'codigo' => null, 'motivo' => 'no_disponible'];
    }

    if ((int)$desafio['reenvios'] >= CODIGO_REENVIO_MAX) {
        return ['ok' => false, 'codigo' => null, 'motivo' => 'reenvios_max'];
    }

    $ultimo = strtotime((string)$desafio['ultimo_envio']);

    if ($ultimo !== false && (time() - $ultimo) < CODIGO_REENVIO_ESPERA_SEG) {
        $espera = CODIGO_REENVIO_ESPERA_SEG - (time() - $ultimo);
        return [
            'ok' => false,
            'codigo' => null,
            'motivo' => 'espera',
            'espera_seg' => max(1, $espera)
        ];
    }

    try {
        $codigo = verifGenerarCodigo();

        $hash = verifHashCodigo(
            $codigo,
            (int)$desafio['usuario_id'],
            (string)$desafio['tipo']
        );

        $db = getDB();

        /*
         * El reenvío emite un código NUEVO: el anterior queda invalidado
         * (mismo hash cambiado) y la expiración se renueva.
         */
        $stmt = $db->prepare("
            UPDATE verificaciones
            SET codigo_hash = ?,
                reenvios = reenvios + 1,
                intentos = 0,
                ultimo_envio = NOW(),
                expira_en = NOW() + INTERVAL ? MINUTE
            WHERE id = ? AND estado = 'pendiente'
        ");

        $stmt->execute([
            $hash,
            CODIGO_VALIDEZ_MIN,
            (int)$desafio['id']
        ]);

        return ['ok' => true, 'codigo' => $codigo, 'motivo' => null];
    } catch (Throwable $e) {
        error_log('Senderos verif reenviar: ' . $e->getMessage());

        return ['ok' => false, 'codigo' => null, 'motivo' => 'error_interno'];
    }
}

/* ═══════════════════════════════════════════
   Bloqueo de logins por fuerza bruta
   ═══════════════════════════════════════════ */

/**
 * Cuenta los intentos de login fallidos recientes de una IP
 * usando el mismo contador de solicitudes.
 */
function loginFallasRecientes(string $ip): int
{
    return verifContarSolicitudes(
        'login_falla:' . $ip,
        LOGIN_FALLAS_IP_VENTANA_MIN
    );
}

/**
 * Registra un intento de login fallido para limitar fuerza bruta.
 */
function loginRegistrarFalla(string $ip): void
{
    verifRegistrarSolicitud('login_falla:' . $ip);
}

/**
 * Limpia desafíos vencidos con más de 24 h (llamado en cada creación).
 */
function verifLimpiarVencidos(): void
{
    try {
        $db = getDB();

        $db->exec("
            DELETE FROM verificaciones
            WHERE creado_en < NOW() - INTERVAL 1 DAY
            LIMIT 200
        ");
    } catch (Throwable $e) {
        error_log('Senderos verif limpieza: ' . $e->getMessage());
    }
}
