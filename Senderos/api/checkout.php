<?php

declare(strict_types=1);

/*
 * POST ../api/checkout.php (requiere login)
 * Crea el pedido + turnos en una transacción a partir del carrito de sesión.
 * Los servicios con igual fecha y hora se agrupan en un solo turno.
 *
 * Un pedido NUNCA mezcla productos y servicios: pago_grupo decide qué se
 * factura en este pedido y lo que queda afuera sigue en el carrito.
 *
 * Entrada JSON:
 * {
 *   "entrega": "retiro" | "envio",
 *   "direccion": "calle, número, ciudad...",
 *   "metodo_pago": "transferencia" | "debito" | "visa" | "mastercard" |
 *                   "cabal" | "naranja_x" | "amex",
 *   "tarjeta_ultimos4": "1234",   // obligatorio si metodo_pago es una tarjeta
 *   "pago_grupo": "productos" | "servicios",
 *   "turnos": { "<servicio_id>": {"fecha": "Y-m-d", "hora": "HH:MM"} }
 * }
 * "turnos" es opcional: si no viene, se usan fecha/hora guardadas en el carrito.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ofertas_lib.php';

header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Método no permitido'
    ], 405);
}

$usuario = requireLogin();
$data = getJsonInput();

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
    $metodosValidos = array_merge(['transferencia', 'debito'], $metodosTarjeta);

    if (!in_array($metodoPago, $metodosValidos, true)) {
        jsonResponse(['ok' => false, 'mensaje' => 'Elegí un método de pago válido: transferencia, débito o una tarjeta (Visa, Mastercard, Cabal, Naranja X o American Express).'], 400);
    }

    /* Tarjeta: solo se guardan los últimos 4 dígitos, nunca el número completo. */
    $ultimos4 = preg_replace('/\D/', '', (string)($data['tarjeta_ultimos4'] ?? ''));
    $metodoPagoGuardado = $metodoPago;

    if (in_array($metodoPago, $metodosTarjeta, true)) {
        if (strlen($ultimos4) !== 4) {
            jsonResponse(['ok' => false, 'mensaje' => 'Ingresá los últimos 4 dígitos de la tarjeta.'], 400);
        }

        $metodoPagoGuardado = $metodoPago . ' ****' . $ultimos4;
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

    /* Productos y servicios se pagan por separado: un pedido contiene
       solo productos o solo servicios, nunca ambos. Lo no elegido queda
       en el carrito para el próximo pago. */
    if ($tieneProductos && $tieneServicios) {
        if (!in_array($pagoGrupo, ['productos', 'servicios'], true)) {
            jsonResponse(['ok' => false, 'mensaje' => 'Tu carrito tiene productos y servicios. Elegí si pagás los productos o los servicios: no se mezclan en un mismo pedido.'], 400);
        }
    } elseif ($tieneProductos) {
        $pagoGrupo = 'productos';
    } else {
        $pagoGrupo = 'servicios';
    }

    $incluyeProductos = $pagoGrupo === 'productos';
    $incluyeServicios = $pagoGrupo === 'servicios';

    if (!$incluyeProductos && !$incluyeServicios) {
        jsonResponse(['ok' => false, 'mensaje' => 'Elegí qué incluye este pago: productos o servicios.'], 400);
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

    $costoEnvio = ($entrega === 'envio') ? (float)COSTO_ENVIO : 0.0; // CONFIRMAR con Claudia

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
    $stmt = $db->prepare('INSERT INTO pedidos (usuario_id, total, estado, metodo_pago, entrega, direccion_envio, pago_grupo) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        (int)$usuario['id'],
        $total,
        'pendiente',
        $metodoPagoGuardado,
        $entrega,
        $direccion !== '' ? $direccion : null,
        $pagoGrupo
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

    jsonResponse([
        'ok' => true,
        'mensaje' => 'Pedido registrado. Coordinamos el pago por WhatsApp.',
        'pedido_id' => $pedidoId,
        'total' => $total,
        'subtotal_productos' => $subtotalProductos,
        'subtotal_servicios' => $subtotalServicios,
        'costo_envio' => round($costoEnvio, 2),
        'entrega' => $entrega,
        'metodo_pago' => $metodoPagoGuardado,
        'pago_grupo' => $pagoGrupo,
        'turnos' => $turnoIds
    ], 201);
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
