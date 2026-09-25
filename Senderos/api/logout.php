<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/*
 * Fase E — cierre de sesión SIN perder el carrito.
 *
 * El carrito vive en $_SESSION['carrito'] (ver api/carrito.php) y tiene que
 * sobrevivir al logout: si el invitado cierra sesión, sigue teniendo lo que
 * había elegido. Por eso:
 *   1. se resguarda el carrito,
 *   2. se limpia todo lo del usuario,
 *   3. se restaura el carrito (fusionarCarritos() vive en auth.php),
 *   4. se regenera el ID de sesión (evita fijación de sesión).
 *
 * NO se llama session_destroy() ni se borra la cookie: eso borraría el
 * carrito junto con los datos del usuario.
 */
$carrito = isset($_SESSION['carrito']) && is_array($_SESSION['carrito'])
    ? $_SESSION['carrito']
    : null;

$_SESSION = [];

if ($carrito !== null) {
    $_SESSION['carrito'] = fusionarCarritos(null, $carrito);
}

session_regenerate_id(true);

jsonResponse([
    'ok' => true,
    'mensaje' => 'Sesión cerrada correctamente'
]);
