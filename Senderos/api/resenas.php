<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    /* Las reseñas de productos requieren las columnas de la
       migración db/migracion_resenas_productos.sql. */
    $soportaProductos = false;

    try {
        $cols = $db->query('SHOW COLUMNS FROM resenas LIKE \'producto_id\'')->fetchAll();
        $soportaProductos = count($cols) > 0;
    } catch (Throwable $e2) {
        $soportaProductos = false;
    }

    if ($method === 'GET') {
        if (isset($_GET['resumen']) && $_GET['resumen'] === '1') {
            $stmt = $db->query(
                'SELECT
                    servicio_slug,
                    ROUND(AVG(estrellas), 1) AS promedio,
                    COUNT(*) AS cantidad
                 FROM resenas
                 WHERE servicio_slug <> \'\'
                 GROUP BY servicio_slug
                 ORDER BY servicio_slug'
            );

            $resumen = [];

            foreach ($stmt->fetchAll() as $fila) {
                $resumen[] = [
                    'servicio_slug' => (string) $fila['servicio_slug'],
                    'promedio' => (float) $fila['promedio'],
                    'cantidad' => (int) $fila['cantidad']
                ];
            }

            $stmtP = null;
            $resumenProductos = [];

            if ($soportaProductos) {
                $stmtP = $db->query(
                    'SELECT
                        producto_id,
                        ROUND(AVG(estrellas), 1) AS promedio,
                        COUNT(*) AS cantidad
                     FROM resenas
                     WHERE producto_id IS NOT NULL
                     GROUP BY producto_id
                     ORDER BY producto_id'
                );

                foreach ($stmtP->fetchAll() as $fila) {
                    $resumenProductos[] = [
                        'producto_id' => (int) $fila['producto_id'],
                        'promedio' => (float) $fila['promedio'],
                        'cantidad' => (int) $fila['cantidad']
                    ];
                }
            }

            jsonResponse([
                'ok' => true,
                'resumen' => $resumen,
                'resumen_productos' => $resumenProductos
            ]);
        }

        /* Admin: todas las reseñas con datos del autor. */
        if (isset($_GET['todas'])) {
            requireAdmin();

            $stmt = $db->query(
                'SELECT
                    r.*,
                    u.nombre AS autor_nombre,
                    u.apellido AS autor_apellido,
                    u.email AS autor_email
                 FROM resenas r
                 LEFT JOIN usuarios u ON u.id = r.usuario_id
                 ORDER BY r.creado_en DESC'
            );

            jsonResponse([
                'ok' => true,
                'resenas' => $stmt->fetchAll()
            ]);
        }

        $slug = trim((string) ($_GET['servicio_slug'] ?? ''));
        $productoId = (int) ($_GET['producto_id'] ?? 0);

        if ($slug !== '') {
            $stmt = $db->prepare(
                'SELECT
                    id,
                    servicio_slug,
                    producto_id,
                    usuario_id,
                    nombre_usuario,
                    estrellas,
                    texto,
                    creado_en
                 FROM resenas
                 WHERE servicio_slug = ?
                 ORDER BY creado_en DESC'
            );

            $stmt->execute([$slug]);
        } elseif ($productoId > 0) {
            if (!$soportaProductos) {
                jsonResponse([
                    'ok' => false,
                    'error' => 'Falta aplicar la migración db/migracion_resenas_productos.sql'
                ], 501);
            }

            $stmt = $db->prepare(
                'SELECT
                    id,
                    servicio_slug,
                    producto_id,
                    usuario_id,
                    nombre_usuario,
                    estrellas,
                    texto,
                    creado_en
                 FROM resenas
                 WHERE producto_id = ?
                 ORDER BY creado_en DESC'
            );

            $stmt->execute([$productoId]);
        } else {
            $stmt = $db->query(
                'SELECT
                    id,
                    servicio_slug,
                    usuario_id,
                    nombre_usuario,
                    estrellas,
                    texto,
                    creado_en
                 FROM resenas
                 ORDER BY creado_en DESC'
            );
        }

        jsonResponse([
            'ok' => true,
            'resenas' => $stmt->fetchAll()
        ]);
    }

    if ($method === 'DELETE') {
        requireAdmin();

        $data = getJsonInput();
        $id = (int) ($data['id'] ?? $_GET['id'] ?? 0);

        if ($id <= 0) {
            jsonResponse([
                'ok' => false,
                'error' => 'ID de reseña inválido'
            ], 400);
        }

        $stmt = $db->prepare('DELETE FROM resenas WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            jsonResponse([
                'ok' => false,
                'error' => 'Reseña no encontrada'
            ], 404);
        }

        jsonResponse(['ok' => true]);
    }

    if ($method !== 'POST') {
        jsonResponse([
            'ok' => false,
            'error' => 'Método no permitido'
        ], 405);
    }

    $usuario = requireLogin();

    $data = getJsonInput();

    if (!is_array($data)) {
        jsonResponse([
            'ok' => false,
            'error' => 'Solicitud inválida'
        ], 400);
    }

    $servicioSlug = trim(
        (string) ($data['servicio_slug'] ?? '')
    );

    $productoId = (int) ($data['producto_id'] ?? 0);

    $estrellas = filter_var(
        $data['estrellas'] ?? null,
        FILTER_VALIDATE_INT
    );

    $texto = trim(
        (string) ($data['texto'] ?? '')
    );

    if ($servicioSlug === '' && $productoId <= 0) {
        jsonResponse([
            'ok' => false,
            'error' => 'El servicio o producto es obligatorio'
        ], 400);
    }

    if (
        $estrellas === false ||
        $estrellas < 1 ||
        $estrellas > 5
    ) {
        jsonResponse([
            'ok' => false,
            'error' => 'La calificación debe ser de 1 a 5 estrellas'
        ], 400);
    }

    if (
        mb_strlen($texto) < 10 ||
        mb_strlen($texto) > 600
    ) {
        jsonResponse([
            'ok' => false,
            'error' => 'La reseña debe tener entre 10 y 600 caracteres'
        ], 400);
    }

    $servicioId = null;
    $productoNombre = null;

    if ($servicioSlug !== '') {
        $stmt = $db->prepare(
            'SELECT id
             FROM servicios
             WHERE slug = ?
             LIMIT 1'
        );

        $stmt->execute([$servicioSlug]);

        $servicio = $stmt->fetch();

        if (!$servicio) {
            jsonResponse([
                'ok' => false,
                'error' => 'El servicio no existe'
            ], 404);
        }

        $servicioId = (int) $servicio['id'];

        $stmt = $db->prepare(
            'SELECT id
             FROM resenas
             WHERE usuario_id = ?
               AND servicio_slug = ?
             LIMIT 1'
        );

        $stmt->execute([
            $usuario['id'],
            $servicioSlug
        ]);

        if ($stmt->fetch()) {
            jsonResponse([
                'ok' => false,
                'error' => 'Ya dejaste una reseña para este servicio.'
            ], 409);
        }
    } else {
        if (!$soportaProductos) {
            jsonResponse([
                'ok' => false,
                'error' => 'Falta aplicar la migración db/migracion_resenas_productos.sql'
            ], 501);
        }

        $stmt = $db->prepare(
            'SELECT id, nombre
             FROM productos
             WHERE id = ?
             LIMIT 1'
        );

        $stmt->execute([$productoId]);

        $producto = $stmt->fetch();

        if (!$producto) {
            jsonResponse([
                'ok' => false,
                'error' => 'El producto no existe'
            ], 404);
        }

        $productoNombre = (string) $producto['nombre'];

        $stmt = $db->prepare(
            'SELECT id
             FROM resenas
             WHERE usuario_id = ?
               AND producto_id = ?
             LIMIT 1'
        );

        $stmt->execute([
            $usuario['id'],
            $productoId
        ]);

        if ($stmt->fetch()) {
            jsonResponse([
                'ok' => false,
                'error' => 'Ya dejaste una reseña para este producto.'
            ], 409);
        }
    }

    $apellido = trim($usuario['apellido'] ?? '');
    $inicialApellido = '';

    if ($apellido !== '') {
        $inicialApellido =
            mb_strtoupper(
                mb_substr($apellido, 0, 1)
            ) . '.';
    }

    $nombreUsuario = trim(
        $usuario['nombre'] .
        ($inicialApellido !== ''
            ? ' ' . $inicialApellido
            : '')
    );

    $stmt = $db->prepare(
        'INSERT INTO resenas
        (
            servicio_id,
            servicio_slug,
            producto_id,
            producto_nombre,
            usuario_id,
            nombre_usuario,
            estrellas,
            texto
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    /* Sin migración aplicada, servicio_slug es NOT NULL: se usa
       un slug sintético por producto (la unicidad por usuario
       sigue garantizada). Con migración, la columna acepta NULL
       y vale igual. */
    $slugGuardar = $servicioSlug !== '' ? $servicioSlug : ('producto-' . $productoId);

    $stmt->execute([
        $servicioId,
        $slugGuardar,
        $productoId > 0 ? $productoId : null,
        $productoNombre,
        $usuario['id'],
        $nombreUsuario,
        $estrellas,
        $texto
    ]);

    jsonResponse([
        'ok' => true,
        'id' => (int) $db->lastInsertId()
    ], 201);
} catch (Throwable $e) {
    error_log('resenas.php: ' . $e->getMessage());

    jsonResponse([
        'ok' => false,
        'error' => 'No se pudo procesar la reseña'
    ], 500);
}
