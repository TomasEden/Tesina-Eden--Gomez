<?php
require_once 'config.php';
header('Content-Type: application/json');
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM productos ORDER BY id DESC");
    echo json_encode(["ok" => true, "productos" => $stmt->fetchAll()]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST') {
    $stmt = $db->prepare("INSERT INTO productos (nombre, categoria, descripcion, precio, stock_cantidad, badge, imagen) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([
        $data['nombre'], $data['categoria'], $data['descripcion'],
        $data['precio'], $data['stock_cantidad'], $data['badge'], $data['imagen']
    ]);
    echo json_encode(["ok" => true, "id" => $db->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $stmt = $db->prepare("UPDATE productos SET nombre=?, categoria=?, descripcion=?, precio=?, stock_cantidad=?, badge=?, imagen=? WHERE id=?");
    $stmt->execute([
        $data['nombre'], $data['categoria'], $data['descripcion'],
        $data['precio'], $data['stock_cantidad'], $data['badge'], $data['imagen'], $data['id']
    ]);
    echo json_encode(["ok" => true]);
    exit;
}

if ($method === 'DELETE') {
    $id = $data['id'] ?? $_GET['id'];
    $stmt = $db->prepare("DELETE FROM productos WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(["ok" => true]);
    exit;
}