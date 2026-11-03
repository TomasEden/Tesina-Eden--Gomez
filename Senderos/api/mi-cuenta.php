<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

/*
 * ═══════════════════════════════════════════════════════════
 * Senderos — mi-cuenta.php
 * Consulta y modificación segura de datos personales.
 *
 * Acciones (por ?accion=):
 *   datos     GET          → datos actuales del usuario
 *   guardar   POST         → valida cambios y genera el desafío
 *                           de verificación (código al correo)
 *   confirmar POST {codigo}→ aplica los cambios pendientes
 *   reenviar  POST         → reenvía el código
 *   cancelar  POST         → cancela la operación pendiente
 *
 * El identificador del usuario SIEMPRE sale de la sesión
 * autenticada: nunca de parámetros del navegador.
 *
 * El cambio de correo exige DOS verificaciones: la dirección
 * actual (email_actual) y la nueva (email_nuevo). La base no
 * se toca hasta que ambas sean satisfactorias.
 * ═══════════════════════════════════════════════════════════
 */

$usuario = requireLogin();

$usuarioId = (int)$usuario['id'];
$accion = (string)($_GET['accion'] ?? 'datos');

/* ── DATOS ACTUALES ──────────────────────────────────────── */

if ($accion === 'datos' && $_SERVER['REQUEST_METHOD'] === 'GET') {

    try {
        $db = getDB();

        $stmt = $db->prepare("
            SELECT
                nombre,
                apellido,
                email,
                telefono,
                nacimiento,
                rol
            FROM usuarios
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$usuarioId]);

        $datos = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$datos) {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'No se encontró tu cuenta'
            ], 404);
        }

        /* Estado de la verificación de la cuenta. */
        $desafioLogin = verifDesafioActivo($usuarioId, VERIF_TIPO_LOGIN);

        jsonResponse([
            'ok' => true,
            'usuario' => [
                'nombre' => (string)$datos['nombre'],
                'apellido' => (string)$datos['apellido'],
                'email' => (string)$datos['email'],
                'telefono' => (string)$datos['telefono'],
                'nacimiento' => $datos['nacimiento'] !== null ? (string)$datos['nacimiento'] : null,
                'rol' => (string)$datos['rol']
            ],
            'seguridad' => [
                'verificacion_activa' => true,
                'proteccion' => 'Verificación por correo electrónico en dos pasos'
            ]
        ]);

    } catch (Throwable $e) {
        error_log('Senderos mi-cuenta datos: ' . $e->getMessage());
        jsonResponse(['ok' => false, 'mensaje' => 'No se pudieron cargar tus datos'], 500);
    }
}

/* ── EL RESTO REQUIERE POST ──────────────────────────────── */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'mensaje' => 'Método no permitido'], 405);
}

$data = getJsonInput();

/* ═══════════════════════════════════════════════════════════
   GUARDAR: valida y genera el desafío de verificación
   ═══════════════════════════════════════════════════════════
 */

if ($accion === 'guardar') {

    try {
        $db = getDB();

        $stmt = $db->prepare("
            SELECT nombre, apellido, email, telefono
            FROM usuarios
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$usuarioId]);

        $actual = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$actual) {
            jsonResponse(['ok' => false, 'mensaje' => 'No se encontró tu cuenta'], 404);
        }

        $campos = isset($data['campos']) && is_array($data['campos'])
            ? $data['campos']
            : [];

        $nuevoNombre = array_key_exists('nombre', $campos)
            ? trim((string)$campos['nombre'])
            : (string)$actual['nombre'];

        $nuevoApellido = array_key_exists('apellido', $campos)
            ? trim((string)$campos['apellido'])
            : (string)$actual['apellido'];

        $nuevoTelefono = array_key_exists('telefono', $campos)
            ? trim((string)$campos['telefono'])
            : (string)$actual['telefono'];

        $nuevoEmail = array_key_exists('email', $campos)
            ? trim((string)$campos['email'])
            : (string)$actual['email'];

        /* ── Validaciones ── */

        if ($nuevoNombre === '' || mb_strlen($nuevoNombre) > 100) {
            jsonResponse(['ok' => false, 'campo' => 'nombre', 'mensaje' => 'Ingresá un nombre válido (máximo 100 caracteres).'], 422);
        }

        if ($nuevoApellido === '' || mb_strlen($nuevoApellido) > 100) {
            jsonResponse(['ok' => false, 'campo' => 'apellido', 'mensaje' => 'Ingresá un apellido válido (máximo 100 caracteres).'], 422);
        }

        if ($nuevoTelefono === '' || mb_strlen($nuevoTelefono) > 40) {
            jsonResponse(['ok' => false, 'campo' => 'telefono', 'mensaje' => 'Ingresá un teléfono válido (máximo 40 caracteres).'], 422);
        }

        if (!preg_match('/^[0-9+\-\s()]{6,40}$/', $nuevoTelefono)) {
            jsonResponse(['ok' => false, 'campo' => 'telefono', 'mensaje' => 'El teléfono solo puede contener números, espacios y los símbolos + - ( ).'], 422);
        }

        $emailCambia = strcasecmp($nuevoEmail, (string)$actual['email']) !== 0;

        if ($emailCambia) {
            if (!filter_var($nuevoEmail, FILTER_VALIDATE_EMAIL) || mb_strlen($nuevoEmail) > 190) {
                jsonResponse(['ok' => false, 'campo' => 'email', 'mensaje' => 'Ingresá un email válido.'], 422);
            }

            /* Comprueba que el correo nuevo no pertenezca a otra cuenta. */
            $stmt = $db->prepare("
                SELECT id
                FROM usuarios
                WHERE email = ? AND id <> ?
                LIMIT 1
            ");

            $stmt->execute([$nuevoEmail, $usuarioId]);

            if ($stmt->fetch()) {
                jsonResponse(['ok' => false, 'campo' => 'email', 'mensaje' => 'Ya existe una cuenta con ese email.'], 409);
            }
        }

        /* ── Comparación con los datos actuales ── */

        $cambios = [];

        if ($nuevoNombre !== (string)$actual['nombre']) {
            $cambios['nombre'] = $nuevoNombre;
        }

        if ($nuevoApellido !== (string)$actual['apellido']) {
            $cambios['apellido'] = $nuevoApellido;
        }

        if ($nuevoTelefono !== (string)$actual['telefono']) {
            $cambios['telefono'] = $nuevoTelefono;
        }

        if ($emailCambia) {
            $cambios['email'] = $nuevoEmail;
        }

        if (!$cambios) {
            jsonResponse([
                'ok' => false,
                'codigo' => 'sin_cambios',
                'mensaje' => 'No detectamos cambios para guardar.'
            ], 400);
        }

        /* ── Se limpian desafíos previos y se genera el nuevo ── */

        verifLimpiarVencidos();

        /*
         * Si cambia el correo, el flujo comienza verificando la
         * dirección ACTUAL (email_actual). Los demás campos se
         * guardan como pendientes junto con el correo nuevo y se
         * aplican recién al final, cuando ambas verificaciones
         * sean correctas.
         */
        $tipo = $emailCambia ? VERIF_TIPO_EMAIL_ACTUAL : VERIF_TIPO_PERFIL;

        $emailDestino = $emailCambia
            ? (string)$actual['email']
            : (string)$actual['email'];

        $desafio = verifCrearDesafio($usuarioId, $tipo, $emailDestino, [
            'cambios' => $cambios
        ]);

        if (!$desafio['ok']) {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'Se superó el límite de códigos solicitados. Esperá unos minutos.'
            ], 429);
        }

        try {
            mailEnviarVerificacion(
                $tipo,
                $emailDestino,
                (string)$actual['nombre'],
                $desafio['codigo'],
                $emailCambia ? ['email_nuevo' => $nuevoEmail] : []
            );
        } catch (SenderosMailException $e) {
            verifCancelarActivo($usuarioId, $tipo);

            jsonResponse([
                'ok' => false,
                'mensaje' => 'No pudimos enviar el código de verificación. Intentá de nuevo en unos minutos.'
            ], 502);
        }

        /* Se guarda el estado del desafío en la sesión del usuario. */
        $_SESSION['cuenta_pendiente'] = [
            'desafio_id' => (int)$desafio['desafio_id'],
            'tipo' => $tipo,
            'email_enmascarado' => enmascararEmail($emailDestino),
            'email_nuevo' => $emailCambia ? $nuevoEmail : null,
            'creado_en' => time()
        ];

        $desafioActivo = verifDesafioActivo($usuarioId, $tipo);

        jsonResponse([
            'ok' => true,
            'requiere_verificacion' => true,
            'mensaje' => $emailCambia
                ? 'Enviamos un código a tu correo actual para confirmar el cambio.'
                : 'Enviamos un código de verificación a tu correo electrónico.',
            'email_enmascarado' => enmascararEmail($emailDestino),
            'expira_en' => $desafioActivo ? (string)$desafioActivo['expira_en'] : null,
            'paso' => $tipo
        ]);

    } catch (Throwable $e) {
        error_log('Senderos mi-cuenta guardar: ' . $e->getMessage());
        jsonResponse(['ok' => false, 'mensaje' => 'No se pudo procesar la solicitud'], 500);
    }
}

/* ═══════════════════════════════════════════════════════════
   CONFIRMAR: valida el código y aplica los cambios
   ═══════════════════════════════════════════════════════════
 */

if ($accion === 'confirmar') {

    $pendiente = isset($_SESSION['cuenta_pendiente']) && is_array($_SESSION['cuenta_pendiente'])
        ? $_SESSION['cuenta_pendiente']
        : null;

    if (!$pendiente) {
        jsonResponse([
            'ok' => false,
            'codigo' => 'sin_desafio',
            'mensaje' => 'No hay ninguna operación pendiente.'
        ], 409);
    }

    $desafioId = (int)($pendiente['desafio_id'] ?? 0);
    $desafio = verifDesafioPorId($desafioId);

    if (
        !$desafio ||
        (int)$desafio['usuario_id'] !== $usuarioId
    ) {
        unset($_SESSION['cuenta_pendiente']);
        jsonResponse([
            'ok' => false,
            'codigo' => 'sin_desafio',
            'mensaje' => 'La operación ya no está disponible.'
        ], 409);
    }

    $codigo = (string)($data['codigo'] ?? '');

    $validacion = verifValidarCodigo($desafio, $codigo);

    if (!$validacion['ok']) {
        $mensajes = [
            'vencido' => 'El código venció. Volvé a guardar para recibir uno nuevo.',
            'usado' => 'Este código ya fue utilizado.',
            'cancelado' => 'La operación fue cancelada.',
            'intentos' => 'Se superó el límite de intentos. Volvé a guardar.',
            'incorrecto' => 'El código ingresado es incorrecto.'
        ];

        $motivo = (string)$validacion['motivo'];

        if (in_array($motivo, ['vencido', 'usado', 'cancelado', 'intentos'], true)) {
            unset($_SESSION['cuenta_pendiente']);
        }

        jsonResponse([
            'ok' => false,
            'codigo' => $motivo,
            'mensaje' => $mensajes[$motivo] ?? 'El código ingresado no es válido.'
        ], in_array($motivo, ['incorrecto'], true) ? 422 : 409);
    }

    try {
        $db = getDB();

        $datosPendientes = json_decode((string)$desafio['datos_pendientes'], true);

        if (!is_array($datosPendientes) || !isset($datosPendientes['cambios']) || !is_array($datosPendientes['cambios'])) {
            unset($_SESSION['cuenta_pendiente']);
            jsonResponse(['ok' => false, 'mensaje' => 'Los datos pendientes no son válidos. Volvé a intentar.'], 409);
        }

        $cambios = $datosPendientes['cambios'];

        $tipoDesafio = (string)$desafio['tipo'];

        /* ── Flujo de cambio de correo: paso 1 correcto ── */

        if ($tipoDesafio === VERIF_TIPO_EMAIL_ACTUAL) {

            $emailNuevo = (string)($pendiente['email_nuevo'] ?? ($cambios['email'] ?? ''));

            if ($emailNuevo === '' || !filter_var($emailNuevo, FILTER_VALIDATE_EMAIL)) {
                unset($_SESSION['cuenta_pendiente']);
                jsonResponse(['ok' => false, 'mensaje' => 'El correo nuevo no es válido.'], 409);
            }

            /* Reconfirma que el correo siga libre antes del segundo paso. */
            $stmt = $db->prepare("
                SELECT id
                FROM usuarios
                WHERE email = ? AND id <> ?
                LIMIT 1
            ");

            $stmt->execute([$emailNuevo, $usuarioId]);

            if ($stmt->fetch()) {
                unset($_SESSION['cuenta_pendiente']);
                jsonResponse(['ok' => false, 'campo' => 'email', 'mensaje' => 'Ya existe una cuenta con ese email. El cambio no se aplicó.'], 409);
            }

            /* Se genera el segundo desafío hacia la dirección NUEVA. */
            $desafio2 = verifCrearDesafio($usuarioId, VERIF_TIPO_EMAIL_NUEVO, $emailNuevo, [
                'cambios' => $cambios,
                'email_nuevo' => $emailNuevo
            ]);

            if (!$desafio2['ok']) {
                unset($_SESSION['cuenta_pendiente']);
                jsonResponse(['ok' => false, 'mensaje' => 'No se pudo generar el segundo código. Volvé a intentar.'], 429);
            }

            try {
                mailEnviarVerificacion(
                    VERIF_TIPO_EMAIL_NUEVO,
                    $emailNuevo,
                    (string)$usuario['nombre'],
                    $desafio2['codigo']
                );
            } catch (SenderosMailException $e) {
                unset($_SESSION['cuenta_pendiente']);
                jsonResponse([
                    'ok' => false,
                    'mensaje' => 'No pudimos enviar el código al correo nuevo. El cambio no se aplicó.'
                ], 502);
            }

            $_SESSION['cuenta_pendiente'] = [
                'desafio_id' => (int)$desafio2['desafio_id'],
                'tipo' => VERIF_TIPO_EMAIL_NUEVO,
                'email_enmascarado' => enmascararEmail($emailNuevo),
                'email_nuevo' => $emailNuevo,
                'creado_en' => time()
            ];

            jsonResponse([
                'ok' => true,
                'requiere_verificacion' => true,
                'paso' => VERIF_TIPO_EMAIL_NUEVO,
                'mensaje' => 'Primer correo verificado. Enviamos un segundo código a la dirección nueva.',
                'email_enmascarado' => enmascararEmail($emailNuevo)
            ]);
        }

        /* ── Flujo de cambio de correo: paso 2 correcto ── */

        if ($tipoDesafio === VERIF_TIPO_EMAIL_NUEVO) {

            $emailNuevo = (string)($pendiente['email_nuevo'] ?? ($cambios['email'] ?? ''));

            if ($emailNuevo === '' || !filter_var($emailNuevo, FILTER_VALIDATE_EMAIL)) {
                unset($_SESSION['cuenta_pendiente']);
                jsonResponse(['ok' => false, 'mensaje' => 'El correo nuevo no es válido.'], 409);
            }

            /* Verificación final de unicidad (pudo cambiar entre pasos). */
            $stmt = $db->prepare("
                SELECT id
                FROM usuarios
                WHERE email = ? AND id <> ?
                LIMIT 1
            ");

            $stmt->execute([$emailNuevo, $usuarioId]);

            if ($stmt->fetch()) {
                unset($_SESSION['cuenta_pendiente']);
                jsonResponse(['ok' => false, 'campo' => 'email', 'mensaje' => 'Ya existe una cuenta con ese email. El cambio no se aplicó.'], 409);
            }

            $emailAnterior = (string)$usuario['email'];

            /* ── Aplicación de TODOS los cambios en una transacción ── */

            $db->beginTransaction();

            try {
                $set = [];
                $valores = [];

                foreach (['nombre', 'apellido', 'telefono'] as $campo) {
                    if (array_key_exists($campo, $cambios)) {
                        $set[] = "`{$campo}` = ?";
                        $valores[] = (string)$cambios[$campo];
                    }
                }

                if ($emailNuevo !== $emailAnterior) {
                    $set[] = "`email` = ?";
                    $valores[] = $emailNuevo;
                }

                if ($set) {
                    $valores[] = $usuarioId;

                    $stmt = $db->prepare("
                        UPDATE usuarios
                        SET " . implode(', ', $set) . "
                        WHERE id = ?
                    ");

                    $stmt->execute($valores);
                }

                $db->commit();
            } catch (Throwable $eTrans) {
                $db->rollBack();
                throw $eTrans;
            }

            unset($_SESSION['cuenta_pendiente']);

            /* Notificación de seguridad a la dirección ANTERIOR. */
            try {
                mailEnviarVerificacion(
                    'email_cambio_ok',
                    $emailAnterior,
                    (string)$usuario['nombre'],
                    '',
                    ['email_nuevo' => $emailNuevo]
                );
            } catch (SenderosMailException $eMail) {
                /* El cambio ya se aplicó: el fallo de la notificación
                   se registra pero no se revierte la operación. */
                error_log('Senderos mi-cuenta notificación cambio email: ' . $eMail->getMessage());
            }

            /* Se actualizan los datos de la sesión autenticada. */
            $_SESSION['email'] = $emailNuevo;
            $_SESSION['usuario']['email'] = $emailNuevo;

            foreach (['nombre', 'apellido', 'telefono'] as $campo) {
                if (array_key_exists($campo, $cambios)) {
                    $_SESSION[$campo] = (string)$cambios[$campo];
                    $_SESSION['usuario'][$campo] = (string)$cambios[$campo];
                }
            }

            jsonResponse([
                'ok' => true,
                'mensaje' => 'Tu correo electrónico fue actualizado y notificado por seguridad.',
                'email' => $emailNuevo
            ]);
        }

        /* ── Flujo simple (sin cambio de correo) ── */

        if ($tipoDesafio === VERIF_TIPO_PERFIL) {

            $db->beginTransaction();

            try {
                $set = [];
                $valores = [];

                foreach (['nombre', 'apellido', 'telefono'] as $campo) {
                    if (array_key_exists($campo, $cambios)) {
                        $set[] = "`{$campo}` = ?";
                        $valores[] = (string)$cambios[$campo];
                    }
                }

                if ($set) {
                    $valores[] = $usuarioId;

                    $stmt = $db->prepare("
                        UPDATE usuarios
                        SET " . implode(', ', $set) . "
                        WHERE id = ?
                    ");

                    $stmt->execute($valores);
                }

                $db->commit();
            } catch (Throwable $eTrans) {
                $db->rollBack();
                throw $eTrans;
            }

            unset($_SESSION['cuenta_pendiente']);

            foreach (['nombre', 'apellido', 'telefono'] as $campo) {
                if (array_key_exists($campo, $cambios)) {
                    $_SESSION[$campo] = (string)$cambios[$campo];
                    $_SESSION['usuario'][$campo] = (string)$cambios[$campo];
                }
            }

            jsonResponse([
                'ok' => true,
                'mensaje' => 'Tus datos fueron actualizados correctamente.'
            ]);
        }

        unset($_SESSION['cuenta_pendiente']);
        jsonResponse(['ok' => false, 'mensaje' => 'Tipo de operación no reconocido.'], 409);

    } catch (Throwable $e) {
        error_log('Senderos mi-cuenta confirmar: ' . $e->getMessage());
        jsonResponse(['ok' => false, 'mensaje' => 'No se pudieron aplicar los cambios'], 500);
    }
}

/* ═══════════════════════════════════════════════════════════
   REENVIAR
   ═══════════════════════════════════════════════════════════
 */

if ($accion === 'reenviar') {

    $pendiente = isset($_SESSION['cuenta_pendiente']) && is_array($_SESSION['cuenta_pendiente'])
        ? $_SESSION['cuenta_pendiente']
        : null;

    if (!$pendiente) {
        jsonResponse(['ok' => false, 'codigo' => 'sin_desafio', 'mensaje' => 'No hay ninguna operación pendiente.'], 409);
    }

    $desafio = verifDesafioPorId((int)($pendiente['desafio_id'] ?? 0));

    if (!$desafio || (int)$desafio['usuario_id'] !== $usuarioId) {
        unset($_SESSION['cuenta_pendiente']);
        jsonResponse(['ok' => false, 'codigo' => 'sin_desafio', 'mensaje' => 'La operación ya no está disponible.'], 409);
    }

    $resultado = verifReenviar($desafio);

    if (!$resultado['ok']) {
        $mensaje = 'No es posible reenviar el código ahora.';

        switch ((string)$resultado['motivo']) {
            case 'espera':
                $espera = (int)($resultado['espera_seg'] ?? CODIGO_REENVIO_ESPERA_SEG);
                $mensaje = 'Esperá ' . $espera . ' segundos antes de pedir otro código.';
                break;
            case 'reenvios_max':
                $mensaje = 'Se agotaron los reenvíos. Volvé a guardar los cambios.';
                unset($_SESSION['cuenta_pendiente']);
                break;
            default:
                $mensaje = 'La operación ya no está disponible.';
                unset($_SESSION['cuenta_pendiente']);
        }

        jsonResponse(['ok' => false, 'codigo' => (string)$resultado['motivo'], 'mensaje' => $mensaje], 429);
    }

    try {
        $datosPendientes = json_decode((string)$desafio['datos_pendientes'], true);
        $emailNuevo = is_array($datosPendientes) ? (string)($datosPendientes['cambios']['email'] ?? '') : '';

        mailEnviarVerificacion(
            (string)$desafio['tipo'],
            (string)$desafio['email_destino'],
            (string)$usuario['nombre'],
            $resultado['codigo'],
            $emailNuevo !== '' ? ['email_nuevo' => $emailNuevo] : []
        );
    } catch (SenderosMailException $e) {
        jsonResponse(['ok' => false, 'mensaje' => 'No pudimos reenviar el código. Intentá de nuevo en unos minutos.'], 502);
    }

    $desafioNuevo = verifDesafioPorId((int)$desafio['id']);

    jsonResponse([
        'ok' => true,
        'mensaje' => 'Enviamos un código nuevo a tu correo.',
        'expira_en' => $desafioNuevo ? (string)$desafioNuevo['expira_en'] : null
    ]);
}

/* ═══════════════════════════════════════════════════════════
   CANCELAR
   ═══════════════════════════════════════════════════════════
 */

if ($accion === 'cancelar') {

    $pendiente = isset($_SESSION['cuenta_pendiente']) && is_array($_SESSION['cuenta_pendiente'])
        ? $_SESSION['cuenta_pendiente']
        : null;

    if ($pendiente) {
        $desafio = verifDesafioPorId((int)($pendiente['desafio_id'] ?? 0));

        if ($desafio && (int)$desafio['usuario_id'] === $usuarioId) {
            verifMarcarEstado((int)$desafio['id'], 'cancelado');
        }

        unset($_SESSION['cuenta_pendiente']);
    }

    jsonResponse([
        'ok' => true,
        'mensaje' => 'Operación cancelada. Tus datos no fueron modificados.'
    ]);
}

/* ── Acción desconocida ── */

jsonResponse(['ok' => false, 'mensaje' => 'Acción no válida'], 400);
