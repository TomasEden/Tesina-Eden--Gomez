<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ofertas_lib.php';

header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'];

function validarOfertaData(array $data, bool $requiereId = false): array
{
    $id = filter_var(
        $data['id'] ?? null,
        FILTER_VALIDATE_INT
    );

    if ($requiereId && ($id === false || $id < 1)) {
        jsonResponse([
            'ok' => false,
            'error' => 'ID de oferta inválido'
        ], 400);
    }

    $nombre = trim((string) ($data['nombre'] ?? ''));
    $descripcion = trim((string) ($data['descripcion'] ?? ''));
    $tipo = trim((string) ($data['tipo'] ?? ''));
    $descuento = $data['descuento'] ?? 0;
    $aplica = trim((string) ($data['aplica'] ?? ''));
    $especifico = trim((string) ($data['especifico'] ?? ''));
    $fechaInicio = trim((string) ($data['fecha_inicio'] ?? ''));
    $fechaFin = trim((string) ($data['fecha_fin'] ?? ''));
    $dias = $data['dias'] ?? [];
    $color = trim((string) ($data['color'] ?? ''));
    $estado = trim((string) ($data['estado'] ?? ''));

    if ($nombre === '') {
        jsonResponse([
            'ok' => false,
            'error' => 'El nombre es obligatorio'
        ], 400);
    }

    if (mb_strlen($nombre) > 255) {
        jsonResponse([
            'ok' => false,
            'error' => 'El nombre es demasiado largo'
        ], 400);
    }

    $tiposPermitidos = [
        'porcentaje',
        'precio_fijo',
        '2x1',
        'texto'
    ];

    if (!in_array($tipo, $tiposPermitidos, true)) {
        jsonResponse([
            'ok' => false,
            'error' => 'Tipo de oferta inválido'
        ], 400);
    }

    if (!is_numeric($descuento) || (float) $descuento < 0) {
        jsonResponse([
            'ok' => false,
            'error' => 'El descuento debe ser un número mayor o igual a 0'
        ], 400);
    }

    $descuento = (float) $descuento;

    if ($tipo === 'porcentaje' && $descuento > 100) {
        jsonResponse([
            'ok' => false,
            'error' => 'El porcentaje no puede superar el 100%'
        ], 400);
    }

    $aplicacionesPermitidas = [
        'todos',
        'servicios',
        'productos',
        'especifico'
    ];

    if (!in_array($aplica, $aplicacionesPermitidas, true)) {
        jsonResponse([
            'ok' => false,
            'error' => 'Aplicación de oferta inválida'
        ], 400);
    }

    if ($aplica === 'especifico' && $especifico === '') {
        jsonResponse([
            'ok' => false,
            'error' => 'Debés indicar al menos un producto o servicio específico'
        ], 400);
    }

    if (mb_strlen($especifico) > 2000) {
        jsonResponse([
            'ok' => false,
            'error' => 'Elegiste demasiados ítems específicos para una sola oferta'
        ], 400);
    }

    /* Fase C: sin restricción de días. Se acepta el campo por
       compatibilidad pero siempre se guarda vacío. */
    $diasLimpios = [];

    $fechaInicio = $fechaInicio !== ''
        ? $fechaInicio
        : null;

    $fechaFin = $fechaFin !== ''
        ? $fechaFin
        : null;

    if ($fechaInicio !== null) {
        $fi = DateTime::createFromFormat(
            'Y-m-d',
            $fechaInicio
        );

        if (
            !$fi ||
            $fi->format('Y-m-d') !== $fechaInicio
        ) {
            jsonResponse([
                'ok' => false,
                'error' => 'La fecha de inicio no es válida'
            ], 400);
        }
    }

    if ($fechaFin !== null) {
        $ff = DateTime::createFromFormat(
            'Y-m-d',
            $fechaFin
        );

        if (
            !$ff ||
            $ff->format('Y-m-d') !== $fechaFin
        ) {
            jsonResponse([
                'ok' => false,
                'error' => 'La fecha de fin no es válida'
            ], 400);
        }
    }

    if (
        $fechaInicio !== null &&
        $fechaFin !== null &&
        $fechaInicio > $fechaFin
    ) {
        jsonResponse([
            'ok' => false,
            'error' => 'La fecha de inicio no puede ser posterior a la fecha de fin'
        ], 400);
    }

    $estadosPermitidos = [
        'activa',
        'pausada'
    ];

    if (!in_array($estado, $estadosPermitidos, true)) {
        jsonResponse([
            'ok' => false,
            'error' => 'Estado de oferta inválido'
        ], 400);
    }

    if ($color !== '' && mb_strlen($color) > 30) {
        jsonResponse([
            'ok' => false,
            'error' => 'El color de la oferta es inválido'
        ], 400);
    }

    return [
        'id' => $id !== false ? (int) $id : null,
        'nombre' => $nombre,
        'descripcion' => $descripcion,
        'tipo' => $tipo,
        'descuento' => $descuento,
        'aplica' => $aplica,
        'especifico' => $especifico !== '' ? $especifico : null,
        'fecha_inicio' => $fechaInicio,
        'fecha_fin' => $fechaFin,
        'dias' => implode(',', $diasLimpios),
        'color' => $color !== '' ? $color : null,
        'estado' => $estado
    ];
}

try {
    $db = getDB();

    if ($method === 'GET') {
        /* Modo público: solo ofertas activas hoy (ticker del inicio). */
        if (isset($_GET['publicas']) || isset($_GET['activas']) || isset($_GET['ticker']) || isset($_GET['vigentes'])) {
            jsonResponse([
                'ok' => true,
                'ofertas' => ofertasVigentesHoy($db)
            ]);
        }

        /* Modo admin: todas las ofertas. */
        requireAdmin();

        $stmt = $db->query(
            'SELECT *
             FROM ofertas
             ORDER BY id DESC'
        );

        jsonResponse([
            'ok' => true,
            'ofertas' => $stmt->fetchAll()
        ]);
    }

    requireAdmin();

    if ($method === 'POST') {
        $data = getJsonInput();

        if (!is_array($data) || !$data) {
            jsonResponse([
                'ok' => false,
                'error' => 'Solicitud inválida'
            ], 400);
        }

        $oferta = validarOfertaData($data);

        if ($oferta['aplica'] === 'especifico') {
            $errorEspecifico = ofertaValidarEspecificos(
                $db,
                $oferta['especifico']
            );

            if ($errorEspecifico !== null) {
                jsonResponse([
                    'ok' => false,
                    'error' => $errorEspecifico
                ], 400);
            }
        }

        $stmt = $db->prepare(
            'INSERT INTO ofertas
            (
                nombre,
                descripcion,
                tipo,
                descuento,
                aplica,
                especifico,
                fecha_inicio,
                fecha_fin,
                dias,
                color,
                estado
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        $stmt->execute([
            $oferta['nombre'],
            $oferta['descripcion'],
            $oferta['tipo'],
            $oferta['descuento'],
            $oferta['aplica'],
            $oferta['especifico'],
            $oferta['fecha_inicio'],
            $oferta['fecha_fin'],
            $oferta['dias'],
            $oferta['color'],
            $oferta['estado']
        ]);

        jsonResponse([
            'ok' => true,
            'id' => (int) $db->lastInsertId()
        ], 201);
    }

    if ($method === 'PUT') {
        $data = getJsonInput();

        if (!is_array($data) || !$data) {
            jsonResponse([
                'ok' => false,
                'error' => 'Solicitud inválida'
            ], 400);
        }

        $oferta = validarOfertaData(
            $data,
            true
        );

        if ($oferta['aplica'] === 'especifico') {
            $errorEspecifico = ofertaValidarEspecificos(
                $db,
                $oferta['especifico']
            );

            if ($errorEspecifico !== null) {
                jsonResponse([
                    'ok' => false,
                    'error' => $errorEspecifico
                ], 400);
            }
        }

        $stmt = $db->prepare(
            'UPDATE ofertas
             SET
                nombre = ?,
                descripcion = ?,
                tipo = ?,
                descuento = ?,
                aplica = ?,
                especifico = ?,
                fecha_inicio = ?,
                fecha_fin = ?,
                dias = ?,
                color = ?,
                estado = ?
             WHERE id = ?'
        );

        $stmt->execute([
            $oferta['nombre'],
            $oferta['descripcion'],
            $oferta['tipo'],
            $oferta['descuento'],
            $oferta['aplica'],
            $oferta['especifico'],
            $oferta['fecha_inicio'],
            $oferta['fecha_fin'],
            $oferta['dias'],
            $oferta['color'],
            $oferta['estado'],
            $oferta['id']
        ]);

        if ($stmt->rowCount() === 0) {
            $check = $db->prepare(
                'SELECT id FROM ofertas WHERE id = ?'
            );

            $check->execute([
                $oferta['id']
            ]);

            if (!$check->fetch()) {
                jsonResponse([
                    'ok' => false,
                    'error' => 'Oferta no encontrada'
                ], 404);
            }
        }

        jsonResponse([
            'ok' => true
        ]);
    }

    if ($method === 'DELETE') {
        $id = filter_var(
            $_GET['id'] ?? null,
            FILTER_VALIDATE_INT
        );

        if ($id === false || $id < 1) {
            $data = getJsonInput();

            $id = filter_var(
                $data['id'] ?? null,
                FILTER_VALIDATE_INT
            );
        }

        if ($id === false || $id < 1) {
            jsonResponse([
                'ok' => false,
                'error' => 'ID de oferta inválido'
            ], 400);
        }

        $stmt = $db->prepare(
            'DELETE FROM ofertas WHERE id = ?'
        );

        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            jsonResponse([
                'ok' => false,
                'error' => 'Oferta no encontrada'
            ], 404);
        }

        jsonResponse([
            'ok' => true
        ]);
    }

    jsonResponse([
        'ok' => false,
        'error' => 'Método no permitido'
    ], 405);
} catch (Throwable $e) {
    error_log('oferta.php: ' . $e->getMessage());

    jsonResponse([
        'ok' => false,
        'error' => 'No se pudo procesar la oferta'
    ], 500);
}
