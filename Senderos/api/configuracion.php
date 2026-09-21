<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');
header('Content-Type: application/json; charset=utf-8');

$costoEnvio = defined('COSTO_ENVIO')
    ? COSTO_ENVIO
    : 800;

$ventanas = defined('HORARIO_VENTANAS')
    ? HORARIO_VENTANAS
    : [
        ['08:00', '12:30'],
        ['16:00', '20:00']
    ];

$diasCerrados = defined('DIAS_CERRADOS')
    ? DIAS_CERRADOS
    : [0];

$feriados = defined('FERIADOS')
    ? FERIADOS
    : [];

$pasoMin = defined('PASO_TURNO_MIN')
    ? PASO_TURNO_MIN
    : 30;

echo json_encode(
    [
        'ok' => true,
        'costoEnvio' => $costoEnvio,
        'ventanas' => $ventanas,
        'diasCerrados' => $diasCerrados,
        'feriados' => $feriados,
        'pasoMin' => $pasoMin
    ],
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES
);
