<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

/*
 * ═══════════════════════════════════════════════════════════
 * Senderos — verificacion.php
 * Paso 2 del login: validación del código de 6 dígitos.
 *
 * Acciones (por ?accion=):
 *   verificar   POST {codigo}              → completa el login
 *   reenviar    POST {}                    → reenvía el código
 *   estado      GET                       → estado del desafío
 *   cancelar    POST {}                    → vuelve al login
 *
 * La sesión definitiva (id, rol, permisos) SOLO se crea aquí,
 * después de que el código sea correcto, no vencido y no usado.
 * ═══════════════════════════════════════════════════════════
 */

$accion = (string)($_GET['accion'] ?? 'verificar');

/* El desafío pendiente vive en la sesión: no se acepta usuario por parámetro. */
$pendiente = isset($_SESSION['verificacion_login']) && is_array($_SESSION['verificacion_login'])
    ? $_SESSION['verificacion_login']
    : null;

if ($pendiente === null) {
    jsonResponse([
        'ok' => false,
        'codigo' => 'sin_desafio',
        'mensaje' => 'No hay ninguna verificación pendiente. Ingresá tus datos nuevamente.'
    ], 409);
}

$usuarioId = (int)($pendiente['usuario_id'] ?? 0);
$desafioId = (int)($pendiente['desafio_id'] ?? 0);

if ($usuarioId <= 0 || $desafioId <= 0) {
    unset($_SESSION['verificacion_login']);
    jsonResponse([
        'ok' => false,
        'codigo' => 'sin_desafio',
        'mensaje' => 'La verificación no es válida. Ingresá tus datos nuevamente.'
    ], 409);
}

/* Carga el desafío y verifica que pertenezca al usuario de la sesión. */
$desafio = verifDesafioPorId($desafioId);

if (
    !$desafio ||
    (int)$desafio['usuario_id'] !== $usuarioId ||
    (string)$desafio['tipo'] !== VERIF_TIPO_LOGIN
) {
    unset($_SESSION['verificacion_login']);
    jsonResponse([
        'ok' => false,
        'codigo' => 'sin_desafio',
        'mensaje' => 'La verificación no es válida. Ingresá tus datos nuevamente.'
    ], 409);
}

/* ── ESTADO ──────────────────────────────────────────────── */

if ($accion === 'estado' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $vencido = (string)$desafio['estado'] !== 'pendiente' ||
        strtotime((string)$desafio['expira_en']) < time();

    jsonResponse([
        'ok' => true,
        'pendiente' => !$vencido,
        'email_enmascarado' => (string)($pendiente['email_enmascarado'] ?? ''),
        'expira_en' => (string)$desafio['expira_en'],
        'reenvios' => (int)$desafio['reenvios'],
        'ultimo_envio' => (string)$desafio['ultimo_envio']
    ]);
}

/* ── MÉTODO ──────────────────────────────────────────────── */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Método no permitido'
    ], 405);
}

$data = getJsonInput();

/* ── CANCELAR ────────────────────────────────────────────── */

if ($accion === 'cancelar') {
    verifMarcarEstado($desafioId, 'cancelado');
    unset($_SESSION['verificacion_login']);

    jsonResponse([
        'ok' => true,
        'mensaje' => 'Verificación cancelada'
    ]);
}

/* ── REENVIAR ────────────────────────────────────────────── */

if ($accion === 'reenviar') {
    $resultado = verifReenviar($desafio);

    if (!$resultado['ok']) {
        $mensaje = 'No es posible reenviar el código ahora.';

        switch ((string)$resultado['motivo']) {
            case 'espera':
                $espera = (int)($resultado['espera_seg'] ?? CODIGO_REENVIO_ESPERA_SEG);
                $mensaje = 'Esperá ' . $espera . ' segundos antes de pedir otro código.';
                break;
            case 'reenvios_max':
                $mensaje = 'Se agotaron los reenvíos de este código. Volvé a ingresar.';
                unset($_SESSION['verificacion_login']);
                break;
            default:
                $mensaje = 'La verificación ya no está disponible. Ingresá nuevamente.';
                unset($_SESSION['verificacion_login']);
        }

        jsonResponse([
            'ok' => false,
            'codigo' => (string)$resultado['motivo'],
            'mensaje' => $mensaje
        ], 429);
    }

    try {
        mailEnviarVerificacion(
            VERIF_TIPO_LOGIN,
            (string)$desafio['email_destino'],
            '',
            $resultado['codigo']
        );
    } catch (SenderosMailException $e) {
        jsonResponse([
            'ok' => false,
            'mensaje' => 'No pudimos reenviar el código. Intentá de nuevo en unos minutos.'
        ], 502);
    }

    $desafioNuevo = verifDesafioPorId($desafioId);

    jsonResponse([
        'ok' => true,
        'mensaje' => 'Enviamos un código nuevo a tu correo.',
        'expira_en' => $desafioNuevo ? (string)$desafioNuevo['expira_en'] : null
    ]);
}

/* ── VERIFICAR ───────────────────────────────────────────── */

if ($accion !== 'verificar') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Acción no válida'
    ], 400);
}

$codigo = (string)($data['codigo'] ?? '');

$validacion = verifValidarCodigo($desafio, $codigo);

if (!$validacion['ok']) {
    $mensajes = [
        'vencido' => 'El código venció. Solicitá uno nuevo.',
        'usado' => 'Este código ya fue utilizado. Solicitá uno nuevo.',
        'cancelado' => 'La verificación fue cancelada. Ingresá nuevamente.',
        'intentos' => 'Se superó el límite de intentos. Solicitá un código nuevo.',
        'incorrecto' => 'El código ingresado es incorrecto.'
    ];

    $motivo = (string)$validacion['motivo'];

    $status = in_array($motivo, ['vencido', 'usado', 'cancelado', 'intentos'], true)
        ? 409
        : 422;

    jsonResponse([
        'ok' => false,
        'codigo' => $motivo,
        'mensaje' => $mensajes[$motivo] ?? 'El código ingresado no es válido.'
    ], $status);
}

/*
 * ═══════════════════════════════════════════════════════════
 * Código correcto: se completa la autenticación.
 * ═══════════════════════════════════════════════════════════
 */

try {
    $db = getDB();

    /* Datos SIEMPRE verificados contra la base de datos. */
    $stmt = $db->prepare("
        SELECT
            id,
            nombre,
            apellido,
            email,
            telefono,
            nacimiento,
            rol,
            activo
        FROM usuarios
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$usuarioId]);

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || (int)$usuario['activo'] !== 1) {
        unset($_SESSION['verificacion_login']);
        jsonResponse([
            'ok' => false,
            'mensaje' => 'Esta cuenta no está disponible.'
        ], 403);
    }

    /* Se limpia el estado del desafío antes de crear la sesión. */
    $recordarme = !empty($pendiente['recordarme']);
    unset($_SESSION['verificacion_login']);

    /*
     * Regeneración definitiva del ID de sesión (fijación de sesión).
     * Se resguarda el carrito del invitado (Fase E) antes de regenerar.
     */
    $carritoInvitado = isset($_SESSION['carrito']) && is_array($_SESSION['carrito'])
        ? $_SESSION['carrito']
        : null;

    session_regenerate_id(true);

    /*
     * Claves que leen auth.php, pedidos.php y turnos.php
     * ($_SESSION['id'], ['rol'], etc.).
     */
    $_SESSION['id'] = (int)$usuario['id'];
    $_SESSION['nombre'] = (string)$usuario['nombre'];
    $_SESSION['apellido'] = (string)$usuario['apellido'];
    $_SESSION['email'] = (string)$usuario['email'];
    $_SESSION['rol'] = (string)$usuario['rol'];

    /*
     * Claves que lee sesion.php.
     */
    $_SESSION['usuario_id'] = (int)$usuario['id'];
    $_SESSION['usuario'] = $usuario;

    /* Se restituye el carrito del invitado (unión, sin duplicar). */
    $_SESSION['carrito'] = fusionarCarritos(
        isset($_SESSION['carrito']) && is_array($_SESSION['carrito'])
            ? $_SESSION['carrito']
            : null,
        $carritoInvitado
    );

    /* "Recordarme" alarga la cookie de sesión PHP a SESION_DIAS. */
    if ($recordarme) {
        $lifetime = SESION_DIAS * 86400;
        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            session_id(),
            time() + $lifetime,
            $params['path'] ?? '/',
            $params['domain'] ?? '',
            (bool)($params['secure'] ?? false),
            (bool)($params['httponly'] ?? true)
        );
    }

    jsonResponse([
        'ok' => true,
        'mensaje' => 'Verificación correcta. Bienvenida/o.',
        'usuario' => $usuario
    ]);

} catch (Throwable $e) {

    error_log('Senderos verificacion: ' . $e->getMessage());

    jsonResponse([
        'ok' => false,
        'mensaje' => 'No se pudo completar la verificación'
    ], 500);
}
