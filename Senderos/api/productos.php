<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ofertas_lib.php';

header('Cache-Control: no-store');

$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

// Leer es público; crear, editar y borrar es solo para el admin.
if ($method !== 'GET') {
    requireAdmin();
}

try {

    /*
     * GET
     * Lista todos los productos con su oferta vigente y precio_final.
     */
    if ($method === 'GET') {
        $stmt = $db->query("
            SELECT
                id,
                nombre,
                marca,
                categoria,
                descripcion,
                precio,
                stock_cantidad,
                badge,
                imagen,
                creado_en
            FROM productos
            ORDER BY id ASC
        ");

        $filas = $stmt->fetchAll();
        $salida = [];

        foreach ($filas as $fila) {
            $oferta = ofertaVigente($db, (string)$fila['nombre'], 'producto', (int)$fila['id']);
            $precio = (float)$fila['precio'];
            $precioFinal = precioFinal($precio, $oferta);

            $fila['precio'] = $precio;
            $fila['stock_cantidad'] = (int)$fila['stock_cantidad'];
            $fila['oferta'] = ofertaResumen($oferta);
            $fila['precio_final'] = $precioFinal;
            $fila['tiene_oferta'] = $oferta !== null && $precioFinal < $precio;

            $salida[] = $fila;
        }

        jsonResponse([
            'ok' => true,
            'productos' => $salida
        ]);
    }


    /*
     * POST
     * Crear producto.
     */
    if ($method === 'POST') {

        $data = getJsonInput();

        $nombre = trim((string)($data['nombre'] ?? ''));
        $marca = trim((string)($data['marca'] ?? ''));
        $categoria = trim((string)($data['categoria'] ?? ''));
        $descripcion = trim((string)($data['descripcion'] ?? ''));
        $precio = (float)($data['precio'] ?? 0);
        $stock = (int)($data['stock_cantidad'] ?? $data['stock'] ?? 0);
        $badge = trim((string)($data['badge'] ?? ''));
        $imagen = trim((string)($data['imagen'] ?? ''));

        if ($nombre === '' || $categoria === '') {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'El nombre y la categoría son obligatorios'
            ], 400);
        }

        if ($precio < 0 || $stock < 0) {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'El precio y el stock no pueden ser negativos'
            ], 400);
        }

        $stmt = $db->prepare("
            INSERT INTO productos
            (
                nombre,
                marca,
                categoria,
                descripcion,
                precio,
                stock_cantidad,
                badge,
                imagen
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $nombre,
            $marca !== '' ? $marca : null,
            $categoria,
            $descripcion !== '' ? $descripcion : null,
            $precio,
            $stock,
            $badge !== '' ? $badge : null,
            $imagen !== '' ? $imagen : null
        ]);

        jsonResponse([
            'ok' => true,
            'mensaje' => 'Producto creado correctamente',
            'id' => (int)$db->lastInsertId()
        ], 201);
    }


    /*
     * PUT
     * Modificar producto. Los campos opcionales que no vengan se conservan.
     */
    if ($method === 'PUT') {

        $data = getJsonInput();

        $id = (int)($data['id'] ?? 0);

        if ($id <= 0) {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'ID de producto inválido'
            ], 400);
        }

        $stmt = $db->prepare("SELECT * FROM productos WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $actual = $stmt->fetch();

        if (!$actual) {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'Producto no encontrado'
            ], 404);
        }

        $nombre = array_key_exists('nombre', $data) ? trim((string)$data['nombre']) : (string)$actual['nombre'];
        $marca = array_key_exists('marca', $data) ? trim((string)$data['marca']) : (string)($actual['marca'] ?? '');
        $categoria = array_key_exists('categoria', $data) ? trim((string)$data['categoria']) : (string)$actual['categoria'];
        $descripcion = array_key_exists('descripcion', $data) ? trim((string)$data['descripcion']) : (string)($actual['descripcion'] ?? '');
        $precio = array_key_exists('precio', $data) ? (float)$data['precio'] : (float)$actual['precio'];
        $stock = array_key_exists('stock_cantidad', $data) ? (int)$data['stock_cantidad'] : (array_key_exists('stock', $data) ? (int)$data['stock'] : (int)$actual['stock_cantidad']);
        $badge = array_key_exists('badge', $data) ? trim((string)$data['badge']) : (string)($actual['badge'] ?? '');
        $imagen = array_key_exists('imagen', $data) ? trim((string)$data['imagen']) : (string)($actual['imagen'] ?? '');

        if ($nombre === '' || $categoria === '') {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'El nombre y la categoría son obligatorios'
            ], 400);
        }

        if ($precio < 0 || $stock < 0) {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'El precio y el stock no pueden ser negativos'
            ], 400);
        }

        $stmt = $db->prepare("
            UPDATE productos
            SET
                nombre = ?,
                marca = ?,
                categoria = ?,
                descripcion = ?,
                precio = ?,
                stock_cantidad = ?,
                badge = ?,
                imagen = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $nombre,
            $marca !== '' ? $marca : null,
            $categoria,
            $descripcion !== '' ? $descripcion : null,
            $precio,
            $stock,
            $badge !== '' ? $badge : null,
            $imagen !== '' ? $imagen : null,
            $id
        ]);

        jsonResponse([
            'ok' => true,
            'mensaje' => 'Producto actualizado correctamente'
        ]);
    }


    /*
     * DELETE
     * Eliminar producto.
     */
    if ($method === 'DELETE') {

        $data = getJsonInput();

        $id = (int)(
            $data['id']
            ?? $_GET['id']
            ?? 0
        );

        if ($id <= 0) {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'ID de producto inválido'
            ], 400);
        }

        $stmt = $db->prepare("
            DELETE FROM productos
            WHERE id = ?
        ");

        $stmt->execute([$id]);

        jsonResponse([
            'ok' => true,
            'mensaje' => 'Producto eliminado correctamente'
        ]);
    }


    jsonResponse([
        'ok' => false,
        'mensaje' => 'Método no permitido'
    ], 405);

} catch (Throwable $e) {

    error_log(
        'Error productos.php: ' .
        $e->getMessage()
    );

    jsonResponse([
        'ok' => false,
        'mensaje' => 'Error al procesar el producto'
    ], 500);
}
