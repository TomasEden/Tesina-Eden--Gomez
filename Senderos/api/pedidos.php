<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

try {
    $db = getDB();
    $method = $_SERVER['REQUEST_METHOD'];

    /* ═══════════ GET ═══════════ */
    if ($method === 'GET') {
        $usuario = requireLogin();

        /* Un pedido puntual: solo dueño o admin. */
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];

            if ($id <= 0) {
                jsonResponse(['ok' => false, 'error' => 'ID de pedido inválido.'], 400);
            }

            $st = $db->prepare('SELECT * FROM pedidos WHERE id = ? LIMIT 1');
            $st->execute([$id]);
            $pedido = $st->fetch();

            if (!$pedido) {
                jsonResponse(['ok' => false, 'error' => 'Pedido no encontrado.'], 404);
            }

            if ($usuario['rol'] !== 'admin' && (int)$pedido['usuario_id'] !== (int)$usuario['id']) {
                jsonResponse(['ok' => false, 'error' => 'No tenés permiso para ver este pedido.'], 403);
            }

            $pedido = enriquecerPedido($db, $pedido);

            jsonResponse(['ok' => true, 'pedido' => $pedido]);
        }

        /* Admin: todos los pedidos con ítems. */
        if (isset($_GET['todos'])) {
            requireAdmin();

            $st = $db->query(
                "SELECT p.*,
                        u.nombre AS cliente_nombre,
                        u.apellido AS cliente_apellido,
                        u.email AS cliente_email,
                        u.telefono AS cliente_telefono
                 FROM pedidos p
                 LEFT JOIN usuarios u ON u.id = p.usuario_id
                 ORDER BY p.creado_en DESC, p.id DESC"
            );

            $pedidos = [];

            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $pedido) {
                $pedido['cliente'] = trim(($pedido['cliente_nombre'] ?? '') . ' ' . ($pedido['cliente_apellido'] ?? ''));
                if ($pedido['cliente'] === '') {
                    $pedido['cliente'] = 'Cliente web';
                }
                $pedido['email'] = $pedido['cliente_email'] ?? '';
                $pedido['telefono'] = $pedido['cliente_telefono'] ?? '';
                $pedidos[] = enriquecerPedido($db, $pedido);
            }

            jsonResponse(['ok' => true, 'pedidos' => $pedidos]);
        }

        /* Pedidos propios con ítems. */
        $st = $db->prepare('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY creado_en DESC, id DESC');
        $st->execute([(int)$usuario['id']]);

        $pedidos = [];

        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $pedido) {
            $pedidos[] = enriquecerPedido($db, $pedido);
        }

        jsonResponse(['ok' => true, 'pedidos' => $pedidos]);
    }

    /* ═══════════ PUT: cambiar estado ═══════════ */
    if ($method === 'PUT') {
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);
        $estado = strtolower(trim((string)($data['estado'] ?? '')));

        $permitidos = ['pendiente', 'confirmado', 'preparado', 'enviado', 'entregado', 'cancelado'];

        if ($id <= 0) {
            jsonResponse(['ok' => false, 'error' => 'ID de pedido inválido.'], 400);
        }

        if (!in_array($estado, $permitidos, true)) {
            jsonResponse(['ok' => false, 'error' => 'Estado de pedido inválido.'], 400);
        }

        $usuario = requireLogin();

        /* Cliente: solo puede cancelar su propio pedido pendiente. */
        if ($usuario['rol'] !== 'admin') {
            if ($estado !== 'cancelado') {
                jsonResponse(['ok' => false, 'error' => 'No tenés permiso para cambiar este pedido.'], 403);
            }

            cancelarPedido($db, $id, (int)$usuario['id'], false);

            jsonResponse(['ok' => true, 'actualizado' => true]);
        }

        /* Admin: cualquier cambio válido; al cancelar se repone stock una sola vez. */
        $db->beginTransaction();

        $st = $db->prepare('SELECT * FROM pedidos WHERE id = ? FOR UPDATE');
        $st->execute([$id]);
        $pedido = $st->fetch();

        if (!$pedido) {
            $db->rollBack();
            jsonResponse(['ok' => false, 'error' => 'Pedido no encontrado.'], 404);
        }

        $anterior = strtolower((string)$pedido['estado']);

        if ($estado === 'cancelado' && $anterior !== 'cancelado') {
            reponerStockPedido($db, $id);
            $stT = $db->prepare("UPDATE turnos SET estado = 'cancelado' WHERE pedido_id = ? AND estado <> 'cancelado'");
            $stT->execute([$id]);
        }

        $st = $db->prepare('UPDATE pedidos SET estado = ? WHERE id = ?');
        $st->execute([$estado, $id]);

        $db->commit();

        jsonResponse(['ok' => true, 'actualizado' => true]);
    }

    jsonResponse(['ok' => false, 'error' => 'Método no permitido.'], 405);
} catch (Throwable $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }

    error_log('Error pedidos.php: ' . $e->getMessage());

    jsonResponse(['ok' => false, 'error' => 'No se pudo procesar el pedido.'], 500);
}

function enriquecerPedido(PDO $db, array $pedido): array
{
    $st = $db->prepare('SELECT id, pedido_id, producto_id, servicio_id, tipo, nombre, precio, cantidad FROM pedido_items WHERE pedido_id = ? ORDER BY id ASC');
    $st->execute([(int)$pedido['id']]);
    $items = $st->fetchAll();

    $stT = $db->prepare('SELECT id, fecha, horario, duracion_total, precio_total, servicios, estado, metodo_pago FROM turnos WHERE pedido_id = ? ORDER BY fecha ASC, horario ASC');
    $stT->execute([(int)$pedido['id']]);

    $pedido['items'] = $items ?: [];
    $pedido['turnos'] = $stT->fetchAll() ?: [];
    $pedido['total'] = (float)$pedido['total'];
    $pedido['costo_envio'] = (($pedido['entrega'] ?? '') === 'envio') ? (float)COSTO_ENVIO : 0.0;

    return $pedido;
}

function reponerStockPedido(PDO $db, int $pedidoId): void
{
    $st = $db->prepare('SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ? AND tipo = ? AND producto_id IS NOT NULL');
    $st->execute([$pedidoId, 'producto']);
    $up = $db->prepare('UPDATE productos SET stock_cantidad = stock_cantidad + ? WHERE id = ?');

    foreach ($st->fetchAll() as $it) {
        $up->execute([max(0, (int)$it['cantidad']), (int)$it['producto_id']]);
    }
}

function cancelarPedido(PDO $db, int $pedidoId, int $usuarioId, bool $esAdmin): void
{
    $db->beginTransaction();

    try {
        $st = $db->prepare('SELECT * FROM pedidos WHERE id = ? FOR UPDATE');
        $st->execute([$pedidoId]);
        $pedido = $st->fetch();

        if (!$pedido) {
            $db->rollBack();
            jsonResponse(['ok' => false, 'error' => 'Pedido no encontrado.'], 404);
        }

        if (!$esAdmin && (int)$pedido['usuario_id'] !== $usuarioId) {
            $db->rollBack();
            jsonResponse(['ok' => false, 'error' => 'No tenés permiso para cancelar este pedido.'], 403);
        }

        if (strtolower((string)$pedido['estado']) !== 'pendiente') {
            $db->rollBack();
            jsonResponse(['ok' => false, 'error' => 'Solo se puede cancelar un pedido pendiente.'], 409);
        }

        reponerStockPedido($db, $pedidoId);

        $stT = $db->prepare("UPDATE turnos SET estado = 'cancelado' WHERE pedido_id = ? AND estado <> 'cancelado'");
        $stT->execute([$pedidoId]);

        $st = $db->prepare("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?");
        $st->execute([$pedidoId]);

        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        throw $e;
    }
}
