<?php

declare(strict_types=1);

/*
 * POST ../api/checkout.php (requiere login)
 * Crea el pedido + turnos en una transacción a partir del carrito de sesión.
 * Los servicios con igual fecha y hora se agrupan en un solo turno.
 *
 * pago_grupo = "todo" permite pagar productos y servicios juntos en un solo
 * pedido, manteniendo el desglose por grupo. También se conservan las opciones
 * "productos" y "servicios" para pagar solo una parte.
 *
 * Los métodos tarjeta_online, billetera, transferencia_qr y efectivo son
 * simulaciones locales claramente identificadas. No representan un cobro real
 * ni acreditan dinero. El servidor recibe solo la marca y los últimos 4 dígitos
 * de la tarjeta de prueba; nunca el número completo ni el CVV.
 *
 * Entrada JSON:
 * {
 *   "entrega": "retiro" | "envio",
 *   "direccion": "calle, número, ciudad...",
 *   "metodo_pago": "transferencia" | "debito" | "tarjeta" |
 *                   "mercadopago" | "tarjeta_online" | "billetera" |
 *                   "transferencia_qr" | "efectivo" |
 *                   "visa" | "mastercard" | "cabal" | "naranja_x" | "amex",
 *   "tarjeta_ultimos4": "1234",
 *   "tarjeta_marca": "visa",
 *   "tarjeta_tipo": "credito" | "debito" | "prepaga",
 *   "cuotas": 1 | 3 | 6 | 12,
 *   "billetera": "mercadopago" | "paypal" | "applepay" | "googlepay" | "samsungpay",
 *   "pago_grupo": "todo" | "productos" | "servicios",
 *   "turnos": { "<servicio_id>": {"fecha": "Y-m-d", "hora": "HH:MM"} },
 *   "checkout_token": "uuid"      // opcional, evita duplicados por reintentos
 * }
 * "turnos" es opcional: si no viene, se usan fecha/hora guardadas en el carrito.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ofertas_lib.php';
require_once __DIR__ . '/pagos_lib.php';

header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Método no permitido'
    ], 405);
}

$usuario = requireLogin();
$data = getJsonInput();

/* Idempotencia: si el navegador reintenta el mismo checkout (por ejemplo,
   porque se perdió la respuesta), devolvemos el pedido ya creado en esta
   sesión en lugar de registrar otro. No se persiste ningún dato sensible. */
$checkoutToken = trim((string)($data['checkout_token'] ?? ''));

if (!preg_match('/^[A-Za-z0-9._-]{8,100}$/', $checkoutToken)) {
    $checkoutToken = '';
} else {
    $checkoutsPrevios = $_SESSION['checkout_idempotencia'] ?? [];

    if (isset($checkoutsPrevios[$checkoutToken]) && is_array($checkoutsPrevios[$checkoutToken])) {
        jsonResponse($checkoutsPrevios[$checkoutToken], 200);
    }
}

try {
    $db = getDB();

    $entrega = strtolower(trim((string)($data['entrega'] ?? 'retiro')));
    $direccion = trim((string)($data['direccion'] ?? ''));
    $metodoPago = strtolower(trim((string)($data['metodo_pago'] ?? $data['metodoPago'] ?? '')));
    $turnosInput = $data['turnos'] ?? [];

    if (!is_array($turnosInput)) {
        $turnosInput = [];
    }

    if (!in_array($entrega, ['retiro', 'envio'], true)) {
        jsonResponse(['ok' => false, 'mensaje' => 'Elegí retiro en el local o envío a domicilio.'], 400);
    }

    $metodosTarjeta = ['visa', 'mastercard', 'cabal', 'naranja_x', 'amex'];
    $metodosBilletera = ['mercadopago', 'paypal', 'applepay', 'googlepay', 'samsungpay'];
    $metodosSimulados = ['billetera', 'transferencia_qr', 'efectivo'];
    $metodosValidos = array_merge(
        ['transferencia', 'debito', 'tarjeta', 'mercadopago', 'tarjeta_online'],
        $metodosTarjeta,
        $metodosSimulados
    );

    if (!in_array($metodoPago, $metodosValidos, true)) {
        jsonResponse(['ok' => false, 'mensaje' => 'Elegí un método de pago válido: transferencia, tarjeta, billetera, QR, efectivo, Mercado Pago o pago presencial.'], 400);
    }

    if ($metodoPago === 'mercadopago' && !mpConfigurado()) {
        jsonResponse(['ok' => false, 'mensaje' => 'Mercado Pago no está disponible en este momento.'], 503);
    }

    /* El sitio no pide ni almacena datos de tarjeta completos. Para la
       simulación de tarjeta online solo se conserva la marca, el tipo, las
       cuotas y los últimos 4 dígitos. El CVV nunca se envía al servidor. */
    $ultimos4 = preg_replace('/\D/', '', (string)($data['tarjeta_ultimos4'] ?? ''));
    $metodoPagoGuardado = $metodoPago;
    $pagoEstado = 'pendiente';
    $pagoProveedor = 'manual';
    $pagoReferencia = null;
    $pagoMetodoDetalle = null;

    if (in_array($metodoPago, $metodosTarjeta, true)) {
        if (strlen($ultimos4) !== 4) {
            jsonResponse(['ok' => false, 'mensaje' => 'Ingresá los últimos 4 dígitos de la tarjeta.'], 400);
        }

        $metodoPagoGuardado = $metodoPago . ' ****' . $ultimos4;
    }

    if ($metodoPago === 'tarjeta_online') {
        $marcaTarjeta = strtolower(trim((string)($data['tarjeta_marca'] ?? '')));
        $tipoTarjeta = strtolower(trim((string)($data['tarjeta_tipo'] ?? '')));
        $cuotasTarjeta = (int)($data['cuotas'] ?? 1);

        if (strlen($ultimos4) < 4) {
            jsonResponse(['ok' => false, 'mensaje' => 'Ingresá al menos los últimos 4 dígitos de la tarjeta.'], 400);
        }

        $ultimos4 = substr($ultimos4, -4);

        if (!in_array($marcaTarjeta, ['visa', 'mastercard', 'amex', 'cabal', 'naranja_x'], true)) {
            $marcaTarjeta = 'visa';
        }

        if (!in_array($tipoTarjeta, ['credito', 'debito', 'prepaga'], true)) {
            $tipoTarjeta = 'credito';
        }

        if (!in_array($cuotasTarjeta, [1, 3, 6, 12], true)) {
            $cuotasTarjeta = 1;
        }

        $tipoTarjetaTexto = ['credito' => 'Crédito', 'debito' => 'Débito', 'prepaga' => 'Prepaga'][$tipoTarjeta] ?? ucfirst($tipoTarjeta);
        $marcaTarjetaTexto = [
            'visa' => 'Visa',
            'mastercard' => 'Mastercard',
            'amex' => 'American Express',
            'cabal' => 'Cabal',
            'naranja_x' => 'Naranja X'
        ][$marcaTarjeta] ?? ucfirst($marcaTarjeta);

        $pagoEstado = 'aprobado';
        $pagoProveedor = 'tarjeta';
        $pagoReferencia = 'TARJETA-' . strtoupper(bin2hex(random_bytes(4)));
        $pagoMetodoDetalle = mb_substr(
            $tipoTarjetaTexto . ' ' . $marcaTarjetaTexto . ' · ****' . $ultimos4,
            0,
            60
        );
    }

    if ($metodoPago === 'billetera') {
        $billetera = strtolower(trim((string)($data['billetera'] ?? '')));

        if (!in_array($billetera, $metodosBilletera, true)) {
            jsonResponse(['ok' => false, 'mensaje' => 'Elegí una billetera virtual válida.'], 400);
        }

        $nombresBilletera = [
            'mercadopago' => 'Mercado Pago',
            'paypal' => 'PayPal',
            'applepay' => 'Apple Pay',
            'googlepay' => 'Google Pay',
            'samsungpay' => 'Samsung Pay'
        ];

        $pagoEstado = 'simulado';
        $pagoProveedor = 'simulacion';
        $pagoReferencia = 'SIM-WALLET-' . strtoupper(bin2hex(random_bytes(4)));
        $pagoMetodoDetalle = mb_substr($nombresBilletera[$billetera], 0, 60);
    }

    if ($metodoPago === 'transferencia_qr') {
        $pagoEstado = 'pendiente';
        $pagoProveedor = 'simulacion_qr';
        $pagoReferencia = 'QR-' . strtoupper(bin2hex(random_bytes(5)));
        $pagoMetodoDetalle = 'QR / débito inmediato (demostración)';
    }

    if ($metodoPago === 'efectivo') {
        $pagoEstado = 'pendiente';
        $pagoProveedor = 'simulacion_efectivo';
        $pagoReferencia = 'SEND-' . strtoupper(bin2hex(random_bytes(4)));
        $pagoMetodoDetalle = 'Cupón Pago Fácil / RapiPago (demostración)';
    }

    if ($metodoPago === 'mercadopago') {
        $pagoProveedor = 'mercadopago';
        $pagoMetodoDetalle = 'Mercado Pago Checkout Pro';
    }

    $pagoGrupo = strtolower(trim((string)($data['pago_grupo'] ?? 'todo')));

    if (!in_array($pagoGrupo, ['todo', 'servicios', 'productos'], true)) {
        $pagoGrupo = 'todo';
    }

    $carrito = $_SESSION['carrito'] ?? ['productos' => [], 'servicios' => []];
    $productosCant = is_array($carrito['productos'] ?? null) ? $carrito['productos'] : [];
    $serviciosCant = is_array($carrito['servicios'] ?? null) ? $carrito['servicios'] : [];

    if (!$productosCant && !$serviciosCant) {
        jsonResponse(['ok' => false, 'mensaje' => 'El carrito está vacío.'], 400);
    }

    $tieneProductos = !empty($productosCant);
    $tieneServicios = !empty($serviciosCant);

    /* "todo" permite un único pago con productos y turnos, manteniendo el
       desglose por grupo. Las opciones parciales siguen disponibles y lo no
       incluido queda en el carrito para el próximo pago. */
    if ($tieneProductos && $tieneServicios) {
        if (!in_array($pagoGrupo, ['todo', 'productos', 'servicios'], true)) {
            $pagoGrupo = 'todo';
        }
    } elseif ($tieneProductos) {
        $pagoGrupo = 'productos';
    } else {
        $pagoGrupo = 'servicios';
    }

    $incluyeProductos = in_array($pagoGrupo, ['todo', 'productos'], true);
    $incluyeServicios = in_array($pagoGrupo, ['todo', 'servicios'], true);

    if (!$incluyeProductos && !$incluyeServicios) {
        jsonResponse(['ok' => false, 'mensaje' => 'Elegí qué incluye este pago: todo junto, productos o servicios.'], 400);
    }

    if ($entrega === 'envio' && !$incluyeProductos) {
        $entrega = 'retiro';
    }

    if ($entrega === 'envio') {
        if (mb_strlen($direccion) < 8) {
            jsonResponse(['ok' => false, 'mensaje' => 'Contanos la dirección completa para el envío (calle, número y ciudad).'], 400);
        }
    } else {
        $direccion = '';
    }

    $costoEnvio = ($entrega === 'envio') ? (float)COSTO_ENVIO : 0.0;

    $db->beginTransaction();

    /* ── Productos: revalidar stock con bloqueo y calcular ofertas ── */
    $itemsPedido = [];
    $subtotalProductos = 0.0;
    $descuentoStock = [];

    if ($incluyeProductos) {
        $ids = array_values(array_filter(array_map('intval', array_keys($productosCant)), static fn($v) => $v > 0));

        $stmt = $db->prepare('SELECT id, nombre, precio, stock_cantidad FROM productos WHERE id = ? FOR UPDATE');

        foreach ($ids as $id) {
            $cantidad = (int)($productosCant[$id] ?? 0);

            if ($cantidad <= 0) {
                continue;
            }

            $stmt->execute([$id]);
            $prod = $stmt->fetch();

            if (!$prod) {
                $db->rollBack();
                jsonResponse(['ok' => false, 'mensaje' => 'Un producto del carrito ya no está disponible. Revisá el carrito.'], 409);
            }

            $stock = (int)$prod['stock_cantidad'];

            if ($stock < $cantidad) {
                $db->rollBack();
                jsonResponse(['ok' => false, 'mensaje' => 'No hay suficiente stock de "' . $prod['nombre'] . '". Quedan ' . $stock . ' unidades.'], 409);
            }

            $oferta = ofertaVigente($db, (string)$prod['nombre'], 'producto', (int)$prod['id']);
            $desglose = desgloseProducto((float)$prod['precio'], $cantidad, $oferta);
            $subtotalProductos += $desglose['subtotal'];

            $itemsPedido[] = [
                'producto_id' => (int)$prod['id'],
                'servicio_id' => null,
                'tipo' => 'producto',
                'nombre' => (string)$prod['nombre'],
                'precio' => $desglose['precio_final'],
                'cantidad' => $desglose['pagas']
            ];

            if ($desglose['gratis'] > 0) {
                $itemsPedido[] = [
                    'producto_id' => (int)$prod['id'],
                    'servicio_id' => null,
                    'tipo' => 'producto',
                    'nombre' => (string)$prod['nombre'] . ' (promo 2x1)',
                    'precio' => 0,
                    'cantidad' => $desglose['gratis']
                ];
            }

            $descuentoStock[(int)$prod['id']] = $cantidad;
        }
    }

    /* ── Servicios: datos reales del servidor + validación de agenda ── */
    $serviciosCheckout = [];
    $subtotalServicios = 0.0;
    $grupos = [];

    if ($incluyeServicios) {
        $ids = array_values(array_filter(array_map('intval', array_keys($serviciosCant)), static fn($v) => $v > 0));

        $stmt = $db->prepare('SELECT id, nombre, duracion, precio FROM servicios WHERE id = ? LIMIT 1');

        foreach ($ids as $id) {
            $stmt->execute([$id]);
            $serv = $stmt->fetch();

            if (!$serv) {
                $db->rollBack();
                jsonResponse(['ok' => false, 'mensaje' => 'Un servicio del carrito ya no está disponible. Revisá el carrito.'], 409);
            }

            $guardado = $serviciosCant[$id] ?? [];
            $override = $turnosInput[(string)$id] ?? $turnosInput[$id] ?? [];

            $fecha = trim((string)(is_array($override) ? ($override['fecha'] ?? '') : ''));
            $hora = trim((string)(is_array($override) ? ($override['hora'] ?? '') : ''));

            if ($fecha === '') {
                $fecha = trim((string)(is_array($guardado) ? ($guardado['fecha'] ?? '') : ''));
            }

            if ($hora === '') {
                $hora = trim((string)(is_array($guardado) ? ($guardado['hora'] ?? '') : ''));
            }

            $hora = substr($hora, 0, 5);

            if ($fecha === '' || $hora === '') {
                $db->rollBack();
                jsonResponse(['ok' => false, 'mensaje' => 'Elegí fecha y hora para "' . $serv['nombre'] . '".'], 400);
            }

            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha) || senderosHoraAMinutos($hora) === null) {
                $db->rollBack();
                jsonResponse(['ok' => false, 'mensaje' => 'La fecha u hora de "' . $serv['nombre'] . '" no es válida.'], 400);
            }

            if ($fecha < date('Y-m-d')) {
                $db->rollBack();
                jsonResponse(['ok' => false, 'mensaje' => 'La fecha de "' . $serv['nombre'] . '" ya pasó. Elegí otra.'], 400);
            }

            $oferta = ofertaVigente($db, (string)$serv['nombre'], 'servicio', (int)$serv['id']);
            $precioFinal = precioFinal((float)$serv['precio'], $oferta);
            $subtotalServicios += $precioFinal;

            $serviciosCheckout[] = [
                'id' => (int)$serv['id'],
                'nombre' => (string)$serv['nombre'],
                'duracion' => (int)$serv['duracion'],
                'precio' => $precioFinal,
                'fecha' => $fecha,
                'hora' => $hora
            ];

            $itemsPedido[] = [
                'producto_id' => null,
                'servicio_id' => (int)$serv['id'],
                'tipo' => 'servicio',
                'nombre' => (string)$serv['nombre'],
                'precio' => $precioFinal,
                'cantidad' => 1
            ];
        }

        /* Servicios con la misma fecha y hora se reservan juntos
           (un solo turno con varios servicios). */
        $intervalos = [];

        foreach ($serviciosCheckout as $s) {
            $ini = strtotime($s['fecha'] . ' ' . $s['hora']);
            $fin = $ini + max(1, (int)$s['duracion']) * 60;

            foreach ($intervalos as $prev) {
                /* Misma fecha y hora = reserva grupal, no es superposición. */
                if ($s['fecha'] === $prev['fecha'] && $s['hora'] === $prev['hora']) {
                    continue;
                }

                if ($s['fecha'] === $prev['fecha'] && $ini < $prev['fin'] && $fin > $prev['ini']) {
                    $db->rollBack();
                    jsonResponse(['ok' => false, 'mensaje' => 'Dos servicios del carrito se superponen. Elegí horarios distintos o la misma fecha y hora para reservarlos juntos.'], 409);
                }
            }

            $intervalos[] = ['fecha' => $s['fecha'], 'hora' => $s['hora'], 'ini' => $ini, 'fin' => $fin];
        }

        /* Agrupar por fecha+hora: cada grupo es un turno. */
        $grupos = [];

        foreach ($serviciosCheckout as $s) {
            $clave = $s['fecha'] . ' ' . $s['hora'];
            $grupos[$clave][] = $s;
        }

        /* Evitar superposición con turnos existentes + ventanas/días/feriados/paso. */
        $stmtOc = $db->prepare("SELECT horario, duracion_total FROM turnos WHERE fecha = ? AND estado <> 'cancelado'");

        $porFecha = [];

        foreach ($grupos as $clave => $grupo) {
            $fecha = $grupo[0]['fecha'];
            $duracionGrupo = 0;
            foreach ($grupo as $g) {
                $duracionGrupo = max($duracionGrupo, max(1, (int)$g['duracion']));
            }
            $porFecha[$fecha][] = ['hora' => $grupo[0]['hora'], 'duracion' => $duracionGrupo, 'nombres' => implode(', ', array_column($grupo, 'nombre'))];
        }

        foreach ($porFecha as $fecha => $lista) {
            $stmtOc->execute([$fecha]);
            $ocupados = [];

            foreach ($stmtOc->fetchAll() as $t) {
                $iniMin = senderosHoraAMinutos(substr((string)$t['horario'], 0, 5));

                if ($iniMin === null) {
                    continue;
                }

                $ocupados[] = ['inicio' => $iniMin, 'fin' => $iniMin + max(1, (int)$t['duracion_total'])];
            }

            /* Sumar los del mismo carrito para validar entre sí contra la grilla. */
            $ocupadosCarrito = $ocupados;

            foreach ($lista as $s) {
                [$okSlot, $errorSlot] = senderosSlotValido($fecha, $s['hora'], (int)$s['duracion'], $ocupadosCarrito);

                if (!$okSlot) {
                    $db->rollBack();
                    jsonResponse(['ok' => false, 'mensaje' => '"' . $s['nombres'] . '": ' . $errorSlot], 409);
                }

                $iniMin = senderosHoraAMinutos($s['hora']);
                $ocupadosCarrito[] = ['inicio' => $iniMin, 'fin' => $iniMin + max(1, (int)$s['duracion'])];
            }
        }
    }

    $subtotalProductos = round($subtotalProductos, 2);
    $subtotalServicios = round($subtotalServicios, 2);
    $total = round($subtotalProductos + $subtotalServicios + $costoEnvio, 2);

    /* ── Crear pedido ── */
    $stmt = $db->prepare(
        'INSERT INTO pedidos
         (usuario_id, total, estado, metodo_pago, entrega, direccion_envio, pago_grupo,
          pago_estado, pago_proveedor, pago_referencia, pago_metodo, pago_actualizado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
    );
    $stmt->execute([
        (int)$usuario['id'],
        $total,
        'pendiente',
        $metodoPagoGuardado,
        $entrega,
        $direccion !== '' ? $direccion : null,
        $pagoGrupo,
        $pagoEstado,
        $pagoProveedor,
        $pagoReferencia,
        $pagoMetodoDetalle
    ]);

    $pedidoId = (int)$db->lastInsertId();

    $stmtItem = $db->prepare('INSERT INTO pedido_items (pedido_id, producto_id, servicio_id, tipo, nombre, precio, cantidad) VALUES (?, ?, ?, ?, ?, ?, ?)');

    foreach ($itemsPedido as $it) {
        $stmtItem->execute([
            $pedidoId,
            $it['producto_id'],
            $it['servicio_id'],
            $it['tipo'],
            $it['nombre'],
            $it['precio'],
            max(1, (int)$it['cantidad'])
        ]);
    }

    /* ── Descontar stock (las unidades gratis también consumen stock) ── */
    $stmtStock = $db->prepare('UPDATE productos SET stock_cantidad = stock_cantidad - ? WHERE id = ?');

    foreach ($descuentoStock as $prodId => $cant) {
        $stmtStock->execute([$cant, $prodId]);
    }

    /* ── Crear un turno por grupo de fecha+hora ── */
    $turnoIds = [];
    $stmtTurno = $db->prepare('INSERT INTO turnos (usuario_id, fecha, horario, duracion_total, precio_total, servicios, estado, pedido_id, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

    foreach ($grupos as $grupo) {
        $serviciosJsonArr = [];
        $duracionGrupo = 0;
        $precioGrupo = 0.0;

        foreach ($grupo as $s) {
            $serviciosJsonArr[] = [
                'id' => $s['id'],
                'nombre' => $s['nombre'],
                'duracion' => $s['duracion'],
                'precio' => $s['precio']
            ];
            $duracionGrupo = max($duracionGrupo, max(1, (int)$s['duracion']));
            $precioGrupo += (float)$s['precio'];
        }

        $serviciosJson = json_encode($serviciosJsonArr, JSON_UNESCAPED_UNICODE);

        $stmtTurno->execute([
            (int)$usuario['id'],
            $grupo[0]['fecha'],
            $grupo[0]['hora'] . ':00',
            $duracionGrupo,
            round($precioGrupo, 2),
            $serviciosJson,
            'pendiente',
            $pedidoId,
            $metodoPagoGuardado
        ]);

        $turnoIds[] = (int)$db->lastInsertId();
    }

    /* ── Mercado Pago Checkout Pro ─────────────────────────────
       La preferencia se crea antes del commit: si Mercado Pago falla,
       se revierte el pedido y el carrito/stock quedan intactos. */
    $redirectUrl = '';

    if ($metodoPago === 'mercadopago') {
        $mpItems = [];

        foreach ($itemsPedido as $it) {
            $precio = round((float)$it['precio'], 2);
            $cantidad = max(1, (int)$it['cantidad']);

            if ($precio <= 0) {
                continue;
            }

            $mpItems[] = [
                'title' => mb_substr((string)$it['nombre'], 0, 250),
                'quantity' => $cantidad,
                'unit_price' => $precio,
                'currency_id' => MP_CURRENCY
            ];
        }

        if ($costoEnvio > 0) {
            $mpItems[] = [
                'title' => 'Envío a domicilio',
                'quantity' => 1,
                'unit_price' => round((float)$costoEnvio, 2),
                'currency_id' => MP_CURRENCY
            ];
        }

        if (!$mpItems) {
            $db->rollBack();
            jsonResponse(['ok' => false, 'mensaje' => 'No hay importe para cobrar con Mercado Pago.'], 400);
        }

        $externalReference = 'senderos-' . $pedidoId . '-' . bin2hex(random_bytes(8));

        $preferencia = [
            'items' => $mpItems,
            'external_reference' => $externalReference,
            'notification_url' => mpWebhookUrl(),
            'back_urls' => [
                'success' => mpBackUrl('success', $pedidoId),
                'pending' => mpBackUrl('pending', $pedidoId),
                'failure' => mpBackUrl('failure', $pedidoId)
            ],
            'statement_descriptor' => MP_STATEMENT_DESCRIPTOR,
            'metadata' => ['pedido_id' => $pedidoId]
        ];

        /* auto_return exige una back_url HTTPS. En local se omite para que
           Mercado Pago no rechace la preferencia. */
        if (str_starts_with(APP_URL, 'https://')) {
            $preferencia['auto_return'] = 'approved';
        }

        try {
            $preferenciaMp = mpCrearPreferencia($preferencia);
            $preferenciaId = trim((string)($preferenciaMp['id'] ?? ''));
            $redirectUrl = mpUrlPreferencia($preferenciaMp);

            if ($preferenciaId === '' || $redirectUrl === '') {
                throw new RuntimeException('Mercado Pago no devolvió una preferencia válida.');
            }
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            error_log('Checkout Mercado Pago: ' . $e->getMessage());

            jsonResponse([
                'ok' => false,
                'mensaje' => 'No se pudo iniciar el pago con Mercado Pago. El pedido no se registró y tu carrito sigue intacto.'
            ], 502);
        }

        $stmtPago = $db->prepare(
            'INSERT INTO pagos
             (pedido_id, proveedor, preferencia_id, external_reference, estado, monto, moneda)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmtPago->execute([
            $pedidoId,
            'mercadopago',
            $preferenciaId,
            $externalReference,
            'pendiente',
            $total,
            MP_CURRENCY
        ]);

        $stmt = $db->prepare(
            'UPDATE pedidos
             SET pago_referencia = ?, pago_proveedor = ?, pago_estado = ?, pago_actualizado_en = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$externalReference, 'mercadopago', 'pendiente', $pedidoId]);
    }

    $db->commit();

    /* Vaciar solo lo comprado: lo no incluido queda en el carrito. */
    $nuevoCarrito = ['productos' => [], 'servicios' => []];
    if (!$incluyeProductos) {
        $nuevoCarrito['productos'] = $productosCant;
    }
    if (!$incluyeServicios) {
        $nuevoCarrito['servicios'] = $serviciosCant;
    }
    $_SESSION['carrito'] = $nuevoCarrito;

    if ($metodoPago === 'mercadopago') {
        $mensajeCheckout = 'Pedido registrado. Te estamos redirigiendo a Mercado Pago.';
    } elseif ($metodoPago === 'tarjeta_online') {
        $mensajeCheckout = 'Pedido registrado. El pago con tarjeta fue aprobado.';
    } elseif ($metodoPago === 'billetera') {
        $mensajeCheckout = 'Pedido registrado. Pago con billetera simulado en modo demostración.';
    } elseif ($metodoPago === 'transferencia_qr') {
        $mensajeCheckout = 'Pedido registrado. Se generó un QR demostrativo; el pago queda pendiente.';
    } elseif ($metodoPago === 'efectivo') {
        $mensajeCheckout = 'Pedido registrado. Se generó un cupón demostrativo para abonar en efectivo.';
    } else {
        $mensajeCheckout = 'Pedido registrado. Coordinamos el pago por WhatsApp.';
    }

    $respuestaCheckout = [
        'ok' => true,
        'mensaje' => $mensajeCheckout,
        'pedido_id' => $pedidoId,
        'total' => $total,
        'subtotal_productos' => $subtotalProductos,
        'subtotal_servicios' => $subtotalServicios,
        'costo_envio' => round($costoEnvio, 2),
        'entrega' => $entrega,
        'metodo_pago' => $metodoPagoGuardado,
        'pago_grupo' => $pagoGrupo,
        'pago_estado' => $pagoEstado,
        'pago_proveedor' => $pagoProveedor,
        'pago_referencia' => $pagoReferencia,
        'pago_simulado' => in_array($metodoPago, $metodosSimulados, true),
        'turnos' => $turnoIds
    ];

    if ($redirectUrl !== '') {
        $respuestaCheckout['redirect_url'] = $redirectUrl;
    }

    if ($checkoutToken !== '') {
        $checkoutsPrevios = $_SESSION['checkout_idempotencia'] ?? [];
        $checkoutsPrevios[$checkoutToken] = $respuestaCheckout;

        if (count($checkoutsPrevios) > 10) {
            $checkoutsPrevios = array_slice($checkoutsPrevios, -10, null, true);
        }

        $_SESSION['checkout_idempotencia'] = $checkoutsPrevios;
    }

    jsonResponse($respuestaCheckout, 201);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }

    error_log('Error checkout.php: ' . $e->getMessage());

    jsonResponse([
        'ok' => false,
        'mensaje' => 'No se pudo registrar el pedido. Probá de nuevo.'
    ], 500);
}
