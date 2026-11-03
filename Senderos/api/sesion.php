<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

/* Solo lectura: informa el estado de la sesión actual. */
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse([
        'ok' => false,
        'error' => 'Método no permitido'
    ], 405);
}

$actual = usuarioActual();

if ($actual === null) {
    jsonResponse([
        'ok' => true,
        'logueado' => false,
        'usuario' => null
    ]);
}

jsonResponse([
    'ok' => true,
    'logueado' => true,
    'usuario' => $_SESSION['usuario'] ?? $actual
]);
