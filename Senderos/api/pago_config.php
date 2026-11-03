<?php

declare(strict_types=1);

/* Configuración pública de pagos: no expone credenciales ni datos bancarios. */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/pagos_lib.php';

header('Cache-Control: no-store');

jsonResponse([
    'ok' => true,
    'mercadopago' => [
        'enabled' => mpConfigurado(),
        'modo' => MP_ENABLED ? MP_MODE : 'deshabilitado'
    ]
]);
