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


/*
 * Genera un slug compatible con URLs.
 */
function generarSlug(string $texto): string
{
    $texto = trim($texto);

    $texto = mb_strtolower(
        $texto,
        'UTF-8'
    );

    $reemplazos = [
        'á' => 'a',
        'à' => 'a',
        'ä' => 'a',
        'â' => 'a',
        'ã' => 'a',

        'é' => 'e',
        'è' => 'e',
        'ë' => 'e',
        'ê' => 'e',

        'í' => 'i',
        'ì' => 'i',
        'ï' => 'i',
        'î' => 'i',

        'ó' => 'o',
        'ò' => 'o',
        'ö' => 'o',
        'ô' => 'o',
        'õ' => 'o',

        'ú' => 'u',
        'ù' => 'u',
        'ü' => 'u',
        'û' => 'u',

        'ñ' => 'n'
    ];

    $texto = strtr(
        $texto,
        $reemplazos
    );

    $texto = preg_replace(
        '/[^a-z0-9]+/',
        '-',
        $texto
    );

    return trim(
        (string)$texto,
        '-'
    );
}


/*
 * Genera un slug único (solo al crear).
 */
function slugUnico(
    PDO $db,
    string $nombre,
    ?int $idExcluir = null
): string {

    $base = generarSlug($nombre);

    if ($base === '') {
        $base = 'servicio';
    }

    $slug = $base;
    $numero = 1;

    while (true) {

        if ($idExcluir !== null) {

            $stmt = $db->prepare("
                SELECT COUNT(*)
                FROM servicios
                WHERE slug = ?
                  AND id <> ?
            ");

            $stmt->execute([
                $slug,
                $idExcluir
            ]);

        } else {

            $stmt = $db->prepare("
                SELECT COUNT(*)
                FROM servicios
                WHERE slug = ?
            ");

            $stmt->execute([
                $slug
            ]);
        }

        if ((int)$stmt->fetchColumn() === 0) {
            return $slug;
        }

        $numero++;

        $slug =
            $base .
            '-' .
            $numero;
    }
}


try {

    /*
     * GET con oferta vigente y precio_final calculados en el servidor.
     */
    if ($method === 'GET') {

        $stmt = $db->query("
            SELECT
                id,
                nombre,
                slug,
                categoria,
                descripcion,
                duracion,
                precio,
                imagen,
                creado_en,
                badge,
                badge_texto,
                incluye
            FROM servicios
            ORDER BY id ASC
        ");

        $filas = $stmt->fetchAll();
        $salida = [];

        foreach ($filas as $fila) {
            $oferta = ofertaVigente($db, (string)$fila['nombre'], 'servicio', (int)$fila['id']);
            $precio = (float)$fila['precio'];
            $precioFinal = precioFinal($precio, $oferta);

            $fila['precio'] = $precio;
            $fila['duracion'] = (int)$fila['duracion'];
            $fila['oferta'] = ofertaResumen($oferta);
            $fila['precio_final'] = $precioFinal;
            $fila['tiene_oferta'] = $oferta !== null && $precioFinal < $precio;

            $salida[] = $fila;
        }

        jsonResponse([
            'ok' => true,
            'servicios' => $salida
        ]);
    }


    $data = getJsonInput();


    /*
     * POST
     */
    if ($method === 'POST') {

        $nombre = trim(
            (string)($data['nombre'] ?? '')
        );

        $categoria = trim(
            (string)($data['categoria'] ?? '')
        );

        $descripcion = trim(
            (string)($data['descripcion'] ?? '')
        );

        $duracion = (int)(
            $data['duracion'] ?? 0
        );

        $precio = (float)(
            $data['precio'] ?? 0
        );

        $imagen = trim(
            (string)($data['imagen'] ?? '')
        );

        $badge = trim(
            (string)($data['badge'] ?? '')
        );

        $badgeTexto = trim(
            (string)($data['badge_texto'] ?? '')
        );

        $incluye = trim(
            (string)($data['incluye'] ?? '')
        );


        if (
            $nombre === '' ||
            $categoria === ''
        ) {
            jsonResponse([
                'ok' => false,
                'mensaje' =>
                    'El nombre y la categoría son obligatorios'
            ], 400);
        }


        if (
            $duracion <= 0 ||
            $precio < 0
        ) {
            jsonResponse([
                'ok' => false,
                'mensaje' =>
                    'La duración debe ser mayor a cero y el precio no puede ser negativo'
            ], 400);
        }


        $slug = slugUnico(
            $db,
            $nombre
        );


        $stmt = $db->prepare("
            INSERT INTO servicios
            (
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
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");


        $stmt->execute([
            $nombre,
            $slug,
            $categoria,
            $descripcion !== ''
                ? $descripcion
                : null,
            $duracion,
            $precio,
            $imagen !== ''
                ? $imagen
                : null,
            $badge !== ''
                ? $badge
                : null,
            $badgeTexto !== ''
                ? $badgeTexto
                : null,
            $incluye !== ''
                ? $incluye
                : null
        ]);


        jsonResponse([
            'ok' => true,
            'mensaje' =>
                'Servicio creado correctamente',
            'id' =>
                (int)$db->lastInsertId(),
            'slug' =>
                $slug
        ], 201);
    }


    /*
     * PUT: al editar NO se regenera el slug (rompería reseñas y links).
     * Los campos opcionales que no vengan se conservan.
     */
    if ($method === 'PUT') {

        $id = (int)(
            $data['id'] ?? 0
        );

        if ($id <= 0) {
            jsonResponse([
                'ok' => false,
                'mensaje' =>
                    'ID de servicio inválido'
            ], 400);
        }

        $stmt = $db->prepare("SELECT * FROM servicios WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $actual = $stmt->fetch();

        if (!$actual) {
            jsonResponse([
                'ok' => false,
                'mensaje' => 'Servicio no encontrado'
            ], 404);
        }

        $nombre = array_key_exists('nombre', $data) ? trim((string)$data['nombre']) : (string)$actual['nombre'];
        $categoria = array_key_exists('categoria', $data) ? trim((string)$data['categoria']) : (string)$actual['categoria'];
        $descripcion = array_key_exists('descripcion', $data) ? trim((string)$data['descripcion']) : (string)($actual['descripcion'] ?? '');
        $duracion = array_key_exists('duracion', $data) ? (int)$data['duracion'] : (int)$actual['duracion'];
        $precio = array_key_exists('precio', $data) ? (float)$data['precio'] : (float)$actual['precio'];
        $imagen = array_key_exists('imagen', $data) ? trim((string)$data['imagen']) : (string)($actual['imagen'] ?? '');
        $badge = array_key_exists('badge', $data) ? trim((string)$data['badge']) : (string)($actual['badge'] ?? '');
        $badgeTexto = array_key_exists('badge_texto', $data) ? trim((string)$data['badge_texto']) : (string)($actual['badge_texto'] ?? '');
        $incluye = array_key_exists('incluye', $data) ? trim((string)$data['incluye']) : (string)($actual['incluye'] ?? '');

        if (
            $nombre === '' ||
            $categoria === ''
        ) {
            jsonResponse([
                'ok' => false,
                'mensaje' =>
                    'El nombre y la categoría son obligatorios'
            ], 400);
        }

        if ($duracion <= 0 || $precio < 0) {
            jsonResponse([
                'ok' => false,
                'mensaje' =>
                    'La duración debe ser mayor a cero y el precio no puede ser negativo'
            ], 400);
        }

        $stmt = $db->prepare("
            UPDATE servicios
            SET
                nombre = ?,
                categoria = ?,
                descripcion = ?,
                duracion = ?,
                precio = ?,
                imagen = ?,
                badge = ?,
                badge_texto = ?,
                incluye = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $nombre,
            $categoria,
            $descripcion !== ''
                ? $descripcion
                : null,
            $duracion,
            $precio,
            $imagen !== ''
                ? $imagen
                : null,
            $badge !== ''
                ? $badge
                : null,
            $badgeTexto !== ''
                ? $badgeTexto
                : null,
            $incluye !== ''
                ? $incluye
                : null,
            $id
        ]);

        jsonResponse([
            'ok' => true,
            'mensaje' =>
                'Servicio actualizado correctamente',
            'slug' =>
                (string)$actual['slug']
        ]);
    }


    /*
     * DELETE
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
                'mensaje' =>
                    'ID de servicio inválido'
            ], 400);
        }


        $stmt = $db->prepare("
            DELETE FROM servicios
            WHERE id = ?
        ");

        $stmt->execute([
            $id
        ]);


        jsonResponse([
            'ok' => true,
            'mensaje' =>
                'Servicio eliminado correctamente'
        ]);
    }


    jsonResponse([
        'ok' => false,
        'mensaje' =>
            'Método no permitido'
    ], 405);


} catch (Throwable $e) {

    error_log(
        'Error servicios.php: ' .
        $e->getMessage()
    );

    jsonResponse([
        'ok' => false,
        'mensaje' =>
            'Error al procesar el servicio'
    ], 500);
}
