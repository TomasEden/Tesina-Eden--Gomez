<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

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
