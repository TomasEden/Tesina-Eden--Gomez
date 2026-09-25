<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ofertas_lib.php';

header('Cache-Control: no-store');

function obtenerCarrito(): array
{
    if (!isset($_SESSION['carrito']) || !is_array($_SESSION['carrito'])) {
        $_SESSION['carrito'] = [
            'productos' => [],
            'servicios' => []
        ];
    }

    if (!isset($_SESSION['carrito']['productos']) || !is_array($_SESSION['carrito']['productos'])) {
        $_SESSION['carrito']['productos'] = [];
    }

    if (!isset($_SESSION['carrito']['servicios']) || !is_array($_SESSION['carrito']['servicios'])) {
        $_SESSION['carrito']['servicios'] = [];
    }

    return $_SESSION['carrito'];
}

function guardarCarrito(array $carrito): void
{
    $_SESSION['carrito'] = $carrito;
}

try {

    $method = $_SERVER['REQUEST_METHOD'];

    /*
     * GET
     * Devuelve el carrito con precios finales del servidor.
     * Limpia o ajusta solo los ítems borrados o sin stock y avisa.
     */
    if ($method === 'GET') {

        $carrito = obtenerCarrito();
        $db = getDB();
        $avisos = [];
        $cambio = false;

        $productos = [];
        $servicios = [];

        if (!empty($carrito['productos'])) {

            $ids = array_map(
                'intval',
                array_keys($carrito['productos'])
            );

            $ids = array_values(array_filter($ids, static fn($v) => $v > 0));

            if ($ids) {
                $placeholders = implode(
                    ',',
                    array_fill(0, count($ids), '?')
                );

                $stmt = $db->prepare("
                    SELECT
                        id,
                        nombre,
                        marca,
                        categoria,
                        descripcion,
                        precio,
                        stock_cantidad,
                        badge,
                        imagen
                    FROM productos
                    WHERE id IN ($placeholders)
                ");

                $stmt->execute($ids);
                $filas = [];

                foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $f) {
                    $filas[(int)$f['id']] = $f;
                }

                foreach ($carrito['productos'] as $idRaw => $cantRaw) {
                    $id = (int)$idRaw;
                    $cantidad = (int)$cantRaw;

                    if ($cantidad <= 0) {
                        unset($carrito['productos'][$idRaw]);
                        $cambio = true;
                        continue;
                    }

                    if (!isset($filas[$id])) {
                        unset($carrito['productos'][$idRaw]);
                        $cambio = true;
                        $avisos[] = 'Se quitó un producto del carrito porque ya no está disponible.';
                        continue;
                    }

                    $producto = $filas[$id];
                    $stock = (int)$producto['stock_cantidad'];

                    if ($stock <= 0) {
                        unset($carrito['productos'][$idRaw]);
                        $cambio = true;
                        $avisos[] = 'Se quitó "' . $producto['nombre'] . '" del carrito porque se quedó sin stock.';
                        continue;
                    }

                    if ($cantidad > $stock) {
                        $cantidad = $stock;
                        $carrito['productos'][$idRaw] = $cantidad;
                        $cambio = true;
                        $avisos[] = 'Ajustamos la cantidad de "' . $producto['nombre'] . '" al stock disponible (' . $stock . ').';
                    }

                    $precio = (float)$producto['precio'];
                    $oferta = ofertaVigente($db, (string)$producto['nombre'], 'producto', $id);
                    $desglose = desgloseProducto($precio, $cantidad, $oferta);

                    $producto['precio'] = $precio;
                    $producto['precio_final'] = $desglose['precio_final'];
                    $producto['oferta'] = ofertaResumen($oferta);
                    $producto['tiene_oferta'] = $oferta !== null && $desglose['precio_final'] < $precio;
                    $producto['cantidad'] = $cantidad;
                    $producto['stock_cantidad'] = $stock;
                    $producto['unidades_pagas'] = $desglose['pagas'];
                    $producto['unidades_gratis'] = $desglose['gratis'];
                    $producto['subtotal'] = $desglose['subtotal'];

                    $productos[] = $producto;
                }
            } else {
                $carrito['productos'] = [];
                $cambio = true;
            }
        }

        if (!empty($carrito['servicios'])) {

            $ids = array_map(
                'intval',
                array_keys($carrito['servicios'])
            );

            $ids = array_values(array_filter($ids, static fn($v) => $v > 0));

            if ($ids) {
                $placeholders = implode(
                    ',',
                    array_fill(0, count($ids), '?')
                );

                $stmt = $db->prepare("
                    SELECT
                        id,
                        nombre,
                        slug,
                        categoria,
                        descripcion,
                        duracion,
                        precio,
                        imagen,
                        badge,
                        badge_texto,
                        incluye
                    FROM servicios
                    WHERE id IN ($placeholders)
                ");

                $stmt->execute($ids);
                $filas = [];

                foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $f) {
                    $filas[(int)$f['id']] = $f;
                }

                foreach ($carrito['servicios'] as $idRaw => $datos) {
                    $id = (int)$idRaw;

                    if (!isset($filas[$id])) {
                        unset($carrito['servicios'][$idRaw]);
                        $cambio = true;
                        $avisos[] = 'Se quitó un servicio del carrito porque ya no está disponible.';
                        continue;
                    }

                    $servicio = $filas[$id];

                    if (!is_array($datos)) {
                        $datos = ['fecha' => null, 'hora' => null];
                        $carrito['servicios'][$idRaw] = $datos;
                        $cambio = true;
                    }

                    $precio = (float)$servicio['precio'];
                    $oferta = ofertaVigente($db, (string)$servicio['nombre'], 'servicio', $id);
                    $precioFinal = precioFinal($precio, $oferta);

                    $servicio['precio'] = $precio;
                    $servicio['precio_final'] = $precioFinal;
                    $servicio['oferta'] = ofertaResumen($oferta);
                    $servicio['tiene_oferta'] = $oferta !== null && $precioFinal < $precio;
                    $servicio['fecha'] = $datos['fecha'] ?? null;
                    $servicio['hora'] = $datos['hora'] ?? null;
                    $servicio['cantidad'] = 1;
                    $servicio['subtotal'] = $precioFinal;
                    $servicio['duracion'] = (int)$servicio['duracion'];

                    $servicios[] = $servicio;
                }
            } else {
                $carrito['servicios'] = [];
                $cambio = true;
            }
        }

        if ($cambio) {
            guardarCarrito($carrito);
        }

        $totalProductos = 0.0;

        foreach ($productos as $producto) {
            $totalProductos += (float)$producto['subtotal'];
        }

        $totalServicios = 0.0;

        foreach ($servicios as $servicio) {
            $totalServicios += (float)$servicio['subtotal'];
        }

        $totalProductos = round($totalProductos, 2);
        $totalServicios = round($totalServicios, 2);

        jsonResponse([
            'ok' => true,
            'avisos' => $avisos,
            'carrito' => [
                'productos' => $productos,
                'servicios' => $servicios,
                'total_productos' => $totalProductos,
                'total_servicios' => $totalServicios,
                'total' => round($totalProductos + $totalServicios, 2)
            ]
        ]);
    }


    /*
     * POST especial: vaciar todo el carrito.
     */
    if ($method === 'POST') {
        $data = getJsonInput();

        if (isset($data['vaciar']) && $data['vaciar']) {
            guardarCarrito([
                'productos' => [],
                'servicios' => []
            ]);

            jsonResponse([
                'ok' => true,
                'mensaje' => 'Carrito vaciado'
            ]);
        }
    }


    /*
     * POST
     * Agregar producto o servicio.
     */
    if ($method === 'POST') {

        $data = getJsonInput();

        $tipo = trim(
            (string)($data['tipo'] ?? '')
        );

        $id = (int)(
            $data['id'] ?? 0
        );

        if (
            !in_array(
                $tipo,
                ['producto', 'servicio'],
                true
            )
        ) {
            jsonResponse([
                'ok' => false,
                'mensaje' =>
                    'Tipo de artículo inválido'
            ], 400);
        }

        if ($id <= 0) {
            jsonResponse([
                'ok' => false,
                'mensaje' =>
                    'ID inválido'
            ], 400);
        }

        $carrito = obtenerCarrito();
        $db = getDB();

        if ($tipo === 'producto') {

            $stmt = $db->prepare("
                SELECT
                    id,
                    stock_cantidad
                FROM productos
                WHERE id = ?
                LIMIT 1
            ");

            $stmt->execute([$id]);

            $producto = $stmt->fetch(
                PDO::FETCH_ASSOC
            );

            if (!$producto) {
                jsonResponse([
                    'ok' => false,
                    'mensaje' =>
                        'Producto no encontrado'
                ], 404);
            }

            $cantidadActual =
                (int)(
                    $carrito['productos'][$id] ?? 0
                );

            $nuevaCantidad =
                $cantidadActual + 1;

            if (
                $nuevaCantidad >
                (int)$producto['stock_cantidad']
            ) {
                jsonResponse([
                    'ok' => false,
                    'mensaje' =>
                        'No hay suficiente stock disponible'
                ], 409);
            }

            if ((int)$producto['stock_cantidad'] <= 0) {
                jsonResponse([
                    'ok' => false,
                    'mensaje' =>
                        'Este producto se quedó sin stock'
                ], 409);
            }

            $carrito['productos'][$id] =
                $nuevaCantidad;
        }


        if ($tipo === 'servicio') {

            $stmt = $db->prepare("
                SELECT id
                FROM servicios
                WHERE id = ?
                LIMIT 1
            ");

            $stmt->execute([$id]);

            if (!$stmt->fetch()) {
                jsonResponse([
                    'ok' => false,
                    'mensaje' =>
                        'Servicio no encontrado'
                ], 404);
            }

            /*
             * Un servicio aparece una sola vez.
             * Si ya está en el carrito se conserva su fecha y hora.
             */
            if (!isset($carrito['servicios'][$id])) {
                $carrito['servicios'][$id] = [
                    'fecha' => null,
                    'hora' => null
                ];
            }
        }

        guardarCarrito($carrito);

        jsonResponse([
            'ok' => true,
            'mensaje' =>
                $tipo === 'producto'
                    ? 'Producto agregado al carrito'
                    : 'Servicio agregado al carrito'
        ]);
    }


    /*
     * PUT
     * Cambiar cantidad de producto o fecha/hora de servicio.
     */
    if ($method === 'PUT') {

        $data = getJsonInput();

        $tipo = trim(
            (string)($data['tipo'] ?? '')
        );

        $id = (int)(
            $data['id'] ?? 0
        );

        $carrito = obtenerCarrito();

        if ($tipo === 'producto') {

            $cantidad = (int)(
                $data['cantidad'] ?? 0
            );

            if ($cantidad <= 0) {

                unset(
                    $carrito['productos'][$id]
                );

            } else {

                $db = getDB();

                $stmt = $db->prepare("
                    SELECT stock_cantidad
                    FROM productos
                    WHERE id = ?
                    LIMIT 1
                ");

                $stmt->execute([$id]);

                $producto =
                    $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$producto) {
                    jsonResponse([
                        'ok' => false,
                        'mensaje' =>
                            'Producto no encontrado'
                    ], 404);
                }

                if (
                    $cantidad >
                    (int)$producto['stock_cantidad']
                ) {
                    jsonResponse([
                        'ok' => false,
                        'mensaje' =>
                            'La cantidad supera el stock disponible'
                    ], 409);
                }

                $carrito['productos'][$id] =
                    $cantidad;
            }
        }


        if ($tipo === 'servicio') {

            if (
                !isset(
                    $carrito['servicios'][$id]
                )
            ) {
                jsonResponse([
                    'ok' => false,
                    'mensaje' =>
                        'El servicio no está en el carrito'
                ], 404);
            }

            $fecha = trim(
                (string)($data['fecha'] ?? '')
            );

            $hora = trim(
                (string)($data['hora'] ?? '')
            );

            if ($fecha !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                jsonResponse([
                    'ok' => false,
                    'mensaje' => 'La fecha del turno no es válida'
                ], 400);
            }

            if ($hora !== '' && senderosHoraAMinutos($hora) === null) {
                jsonResponse([
                    'ok' => false,
                    'mensaje' => 'La hora del turno no es válida'
                ], 400);
            }

            $carrito['servicios'][$id] = [
                'fecha' =>
                    $fecha !== ''
                        ? $fecha
                        : null,
                'hora' =>
                    $hora !== ''
                        ? substr($hora, 0, 5)
                        : null
            ];
        }

        if ($tipo !== 'producto' && $tipo !== 'servicio') {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'Tipo de artículo inválido'
            ], 400);
        }

        guardarCarrito($carrito);

        jsonResponse([
            'ok' => true,
            'mensaje' =>
                'Carrito actualizado'
        ]);
    }


    /*
     * DELETE
     * Eliminar artículo.
     */
    if ($method === 'DELETE') {

        $data = getJsonInput();

        $tipo = trim(
            (string)($data['tipo'] ?? '')
        );

        $id = (int)(
            $data['id']
            ?? $_GET['id']
            ?? 0
        );

        $carrito = obtenerCarrito();

        if ($tipo === 'producto') {

            unset(
                $carrito['productos'][$id]
            );
        }

        if ($tipo === 'servicio') {

            unset(
                $carrito['servicios'][$id]
            );
        }

        guardarCarrito($carrito);

        jsonResponse([
            'ok' => true,
            'mensaje' =>
                'Artículo eliminado del carrito'
        ]);
    }


    jsonResponse([
        'ok' => false,
        'mensaje' =>
            'Método no permitido'
    ], 405);

} catch (Throwable $e) {

    error_log(
        'Error carrito.php: ' .
        $e->getMessage()
    );

    jsonResponse([
        'ok' => false,
        'mensaje' =>
            'No se pudo procesar el carrito'
    ], 500);
}
