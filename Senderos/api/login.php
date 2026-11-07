<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

/*
 * ═══════════════════════════════════════════════════════════
 * Senderos — login.php (verificación en dos pasos)
 *
 * Clientes: valida credenciales y, si son correctas, genera un
 * código de 6 dígitos que envía por correo. La sesión AUTENTICADA
 * NO se crea acá: solo se guarda el estado mínimo del desafío en
 * $_SESSION['verificacion_login']. La sesión definitiva se crea
 * en verificacion.php cuando el código es correcto.
 *
 * Administradores: ACCESO DIRECTO sin código. El correo del panel
 * es una cuenta de prueba que no recibe mensajes, por lo que el
 * 2FA dejaría el panel bloqueado. La sesión se crea en este mismo
 * archivo con las mismas claves que verificacion.php.
 * ═══════════════════════════════════════════════════════════
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Método no permitido'
    ], 405);
}

/* ── Anti fuerza bruta por IP ─────────────────────────────── */
if (loginFallasRecientes(ipCliente()) >= LOGIN_FALLAS_IP_MAX) {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Demasiados intentos fallidos. Esperá unos minutos y volvé a intentar.'
    ], 429);
}

$data = getJsonInput();

$email = trim((string)($data['email'] ?? ''));
$password = (string)($data['password'] ?? '');
$recordarme = !empty($data['recordarme']);

if ($email === '' || $password === '') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Completá el email y la contraseña'
    ], 400);
}

try {
    $db = getDB();

    $stmt = $db->prepare("
        SELECT
            id,
            nombre,
            apellido,
            email,
            password_hash,
            telefono,
            nacimiento,
            rol,
            activo
        FROM usuarios
        WHERE email = ?
        LIMIT 1
    ");

    $stmt->execute([$email]);

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || !password_verify($password, (string)$usuario['password_hash'])) {
        loginRegistrarFalla(ipCliente());

        jsonResponse([
            'ok' => false,
            'mensaje' => 'El email o la contraseña son incorrectos'
        ], 401);
    }

    if ((int)$usuario['activo'] !== 1) {
        jsonResponse([
            'ok' => false,
            'mensaje' => 'Esta cuenta está desactivada'
        ], 403);
    }

    unset($usuario['password_hash']);

    $usuarioId = (int)$usuario['id'];

    /*
     * ═══════════════════════════════════════════════════════
     * Administradores: ACCESO DIRECTO, sin verificación en dos
     * pasos.
     *
     * El correo del panel de administración es una cuenta de
     * prueba que no recibe mensajes, por lo que exigir el código
     * dejaría el panel bloqueado. La contraseña sigue siendo
     * obligatoria y se guarda con hash bcrypt.
     *
     * La sesión se crea con EXACTAMENTE las mismas claves que
     * genera verificacion.php, de modo que requireAdmin(),
     * sesion.php y el resto del panel funcionan igual.
     * ═══════════════════════════════════════════════════════
     */
    if ((string)$usuario['rol'] === 'admin') {

        /* Se resguarda el carrito del invitado antes de regenerar. */
        $carritoInvitado = isset($_SESSION['carrito']) && is_array($_SESSION['carrito'])
            ? $_SESSION['carrito']
            : null;

        /* Regeneración del ID de sesión (fijación de sesión). */
        session_regenerate_id(true);

        /* Claves que leen auth.php, pedidos.php y turnos.php. */
        $_SESSION['id'] = (int)$usuario['id'];
        $_SESSION['nombre'] = (string)$usuario['nombre'];
        $_SESSION['apellido'] = (string)$usuario['apellido'];
        $_SESSION['email'] = (string)$usuario['email'];
        $_SESSION['rol'] = (string)$usuario['rol'];

        /* Claves que lee sesion.php. */
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
            'requiere_verificacion' => false,
            'mensaje' => 'Sesión de administrador iniciada.',
            'usuario' => $usuario
        ]);
    }

    /* ── Clientes: verificación en dos pasos ──────────────── */

    /* Limpieza de desafíos vencidos (operación barata, hecha en cada creación). */
    verifLimpiarVencidos();

    /*
     * Se genera el código de verificación y se envía por correo real.
     * Si el envío falla NO se permite continuar: se informa el error y
     * el usuario puede reintentar de forma segura.
     */
    $desafio = verifCrearDesafio($usuarioId, VERIF_TIPO_LOGIN, (string)$usuario['email']);

    if (!$desafio['ok']) {
        $mensajeLimite = ($desafio['error'] === 'limite_usuario' || $desafio['error'] === 'limite_ip')
            ? 'Se superó el límite de códigos solicitados. Esperá unos minutos.'
            : 'No se pudo generar el código de verificación. Intentá de nuevo.';

        jsonResponse([
            'ok' => false,
            'mensaje' => $mensajeLimite
        ], 429);
    }

    try {
        mailEnviarVerificacion(
            VERIF_TIPO_LOGIN,
            (string)$usuario['email'],
            (string)$usuario['nombre'],
            $desafio['codigo']
        );
    } catch (SenderosMailException $e) {
        /* El envío falló: se invalida el desafío y se bloquea el acceso. */
        verifCancelarActivo($usuarioId, VERIF_TIPO_LOGIN);

        jsonResponse([
            'ok' => false,
            'mensaje' => 'No pudimos enviar el código de verificación a tu correo. Intentá de nuevo en unos minutos.'
        ], 502);
    }

    /*
     * Estado mínimo del desafío pendiente. NO se guarda la sesión del
     * usuario todavía: solo lo necesario para verificar el código.
     * El carrito del invitado permanece intacto en $_SESSION['carrito'].
     *
     * session_regenerate_id() acá cambia el ID sin destruir datos,
     * lo que dificulta la fijación de sesión mientras el desafío
     * está activo. La regeneración definitiva (con destrucción) se
     * hace al completar la verificación.
     */
    session_regenerate_id(true);

    $_SESSION['verificacion_login'] = [
        'desafio_id' => (int)$desafio['desafio_id'],
        'usuario_id' => $usuarioId,
        'recordarme' => $recordarme,
        'email_enmascarado' => enmascararEmail((string)$usuario['email']),
        'creado_en' => time()
    ];

    $expiraEn = null;

    $desafioActivo = verifDesafioActivo($usuarioId, VERIF_TIPO_LOGIN);

    if ($desafioActivo) {
        $expiraEn = (string)$desafioActivo['expira_en'];
    }

    jsonResponse([
        'ok' => true,
        'requiere_verificacion' => true,
        'mensaje' => 'Enviamos un código de verificación a tu correo electrónico.',
        'email_enmascarado' => enmascararEmail((string)$usuario['email']),
        'expira_en' => $expiraEn
    ]);

} catch (Throwable $e) {

    error_log('Senderos login: ' . $e->getMessage());

    jsonResponse([
        'ok' => false,
        'mensaje' => 'Error al iniciar sesión'
    ], 500);
}
