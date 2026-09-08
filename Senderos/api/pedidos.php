<?php
require_once 'config.php';
session_start();
header('Content-Type: application/json');
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['propios']) && isset($_SESSION['id'])) {
        $stmt = $db->prepare("SELECT * FROM pedidos WHERE usuario_id=? ORDER BY creado_en DESC");
        $stmt->execute([$_SESSION['id']]);
        $pedidos = $stmt->fetchAll();
    } else {
        $stmt = $db->query("SELECT p.*, u.nombre AS cliente FROM pedidos p JOIN usuarios u ON u.id=p.usuario_id ORDER BY p.creado_en DESC");
        $pedidos = $stmt->fetchAll();
    }
    // Traer items de cada pedido
    $stmtItems = $db->prepare("SELECT * FROM pedido_items WHERE pedido_id=?");
    foreach ($pedidos as &$p) {
        $stmtItems->execute([$p['id']]);
        $p['items'] = $stmtItems->fetchAll();
    }
    echo json_encode(["ok" => true, "pedidos" => $pedidos]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST') {
    if (!isset($_SESSION['id'])) {
        echo json_encode(["ok" => false, "error" => "Debés iniciar sesión"]);
        exit;
    }
    $db->beginTransaction();
    $stmt = $db->prepare("INSERT INTO pedidos (usuario_id, total, estado) VALUES (?,?, 'pendiente')");
    $stmt->execute([$_SESSION['id'], $data['total']]);
    $pedidoId = $db->lastInsertId();

    $stmtItem = $db->prepare("INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad) VALUES (?,?,?,?,?)");
    foreach ($data['items'] as $it) {
        $stmtItem->execute([$pedidoId, $it['producto_id'] ?? null, $it['nombre'], $it['precio'], $it['cantidad'] ?? 1]);
    }
    $db->commit();
    echo json_encode(["ok" => true, "id" => $pedidoId]);
    exit;
}

if ($method === 'PUT') {
    $stmt = $db->prepare("UPDATE pedidos SET estado=? WHERE id=?");
    $stmt->execute([$data['estado'], $data['id']]);
    echo json_encode(["ok" => true]);
    exit;
}