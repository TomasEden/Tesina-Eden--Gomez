<?php

declare(strict_types=1);

/*
 * Favoritos del usuario logueado (tabla `favoritos`).
 *
 *   GET              → lista los favoritos del usuario
 *   POST {tipo,ref_id}   → agrega un favorito
 *   DELETE {tipo,ref_id} → quita un favorito
 *
 * El identificador guardado es el ID numérico del producto o servicio
 * (no el slug). Requiere sesión iniciada: sin usuario se responde 401.
 */

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

$usuario = requireLogin();

$tiposValidos = ['producto', 'servicio'];

/**
 * Valida el par tipo/ref_id del cuerpo JSON y devuelve [tipo, ref_id].
 * Responde 400 con error y no continúa.
 */
function favoritoEntrada(array $data): array
{
    global $tiposValidos, $db;

    $tipo = trim((string)($data['tipo'] ?? ''));
    $refId = (int)($data['ref_id'] ?? 0);

    if (!in_array($tipo, $tiposValidos, true)) {
        jsonResponse([
            'ok' => false,
            'error' => 'Tipo de favorito inválido'
        ], 400);
    }

    if ($refId <= 0) {
        jsonResponse([
            'ok' => false,
            'error' => 'Referencia inválida'
        ], 400);
    }

    /* El elemento debe existir en su tabla antes de guardarlo. */
    $tabla = $tipo === 'producto' ? 'productos' : 'servicios';

    $stmt = $db->prepare(
        "SELECT COUNT(*) FROM `{$tabla}` WHERE id = :id"
    );
    $stmt->execute([':id' => $refId]);

    if ((int)$stmt->fetchColumn() === 0) {
        jsonResponse([
            'ok' => false,
            'error' => 'El elemento no existe'
        ], 404);
    }

    return [$tipo, $refId];
}

try {
    $db = getDB();
    $method = $_SERVER['REQUEST_METHOD'];

    /* ── GET: lista los favoritos del usuario ─────────────── */
    if ($method === 'GET') {

        $stmt = $db->prepare("
            SELECT tipo, ref_id
            FROM favoritos
            WHERE usuario_id = :uid
            ORDER BY creado_en DESC, id DESC
        ");
        $stmt->execute([':uid' => $usuario['id']]);

        $productos = [];
        $servicios = [];

        foreach ($stmt->fetchAll() as $fila) {
            if ($fila['tipo'] === 'producto') {
                $productos[] = (int)$fila['ref_id'];
            } else {
                $servicios[] = (int)$fila['ref_id'];
            }
        }

        jsonResponse([
            'ok' => true,
            'productos' => $productos,
            'servicios' => $servicios
        ]);
    }

    /* ── POST: agrega un favorito ─────────────────────────── */
    if ($method === 'POST') {

        [$tipo, $refId] = favoritoEntrada(getJsonInput());

        /* ON DUPLICATE KEY id: repetir la petición no duplica filas
           (la tabla tiene UNIQUE(usuario_id,tipo,ref_id)). */
        $stmt = $db->prepare("
            INSERT INTO favoritos (usuario_id, tipo, ref_id)
            VALUES (:uid, :tipo, :ref)
            ON DUPLICATE KEY UPDATE id = id
        ");
        $stmt->execute([
            ':uid' => $usuario['id'],
            ':tipo' => $tipo,
            ':ref' => $refId
        ]);

        jsonResponse([
            'ok' => true,
            'agregado' => true,
            'tipo' => $tipo,
            'ref_id' => $refId
        ]);
    }

    /* ── DELETE: quita un favorito ────────────────────────── */
    if ($method === 'DELETE') {

        [$tipo, $refId] = favoritoEntrada(getJsonInput());

        $stmt = $db->prepare("
            DELETE FROM favoritos
            WHERE usuario_id = :uid AND tipo = :tipo AND ref_id = :ref
        ");
        $stmt->execute([
            ':uid' => $usuario['id'],
            ':tipo' => $tipo,
            ':ref' => $refId
        ]);

        jsonResponse([
            'ok' => true,
            'agregado' => false,
            'tipo' => $tipo,
            'ref_id' => $refId
        ]);
    }

    jsonResponse([
        'ok' => false,
        'error' => 'Método no permitido'
    ], 405);
} catch (Throwable $e) {
    error_log('Senderos favoritos: ' . $e->getMessage());

    jsonResponse([
        'ok' => false,
        'error' => 'No se pudo completar la operación'
    ], 500);
}
