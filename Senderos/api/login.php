<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Método no permitido'
    ], 405);
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

    /*
     * config.php ya inició la sesión, no se vuelve a llamar session_start().
     * Se regenera el ID para evitar fijación de sesión.
     *
     * Fase E: el carrito del invitado se resguarda antes de regenerar y se
     * vuelve a fusionar después (fusionarCarritos() está en auth.php): nadie
     * pierde lo que tenía en el carrito al iniciar sesión.
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

    /*
     * Fase E: se restituye el carrito del invitado (por unión, sin duplicar).
     */
    $_SESSION['carrito'] = fusionarCarritos(
        isset($_SESSION['carrito']) && is_array($_SESSION['carrito'])
            ? $_SESSION['carrito']
            : null,
        $carritoInvitado
    );

    /*
     * "Recordarme" alarga de verdad la cookie de sesión PHP a SESION_DIAS.
     * La sesión del servidor ya dura SESION_DIAS por config.php.
     */
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
        'mensaje' => 'Inicio de sesión correcto',
        'usuario' => $usuario
    ]);

} catch (Throwable $e) {

    error_log('Senderos login: ' . $e->getMessage());

    jsonResponse([
        'ok' => false,
        'mensaje' => 'Error al iniciar sesión'
    ], 500);
}
