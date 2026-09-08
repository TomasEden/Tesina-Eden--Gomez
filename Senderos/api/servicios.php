<?php
require_once 'config.php';
header('Content-Type: application/json');
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM servicios ORDER BY id DESC");
    echo json_encode(["ok" => true, "servicios" => $stmt->fetchAll()]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST') {
    $stmt = $db->prepare("INSERT INTO servicios (nombre, categoria, descripcion, duracion, precio, imagen) VALUES (?,?,?,?,?,?)");
    $stmt->execute([
        $data['nombre'], $data['categoria'], $data['descripcion'],
        $data['duracion'], $data['precio'], $data['imagen']
    ]);
    echo json_encode(["ok" => true, "id" => $db->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $stmt = $db->prepare("UPDATE servicios SET nombre=?, categoria=?, descripcion=?, duracion=?, precio=?, imagen=? WHERE id=?");
    $stmt->execute([
        $data['nombre'], $data['categoria'], $data['descripcion'],
        $data['duracion'], $data['precio'], $data['imagen'], $data['id']
    ]);
    echo json_encode(["ok" => true]);
    exit;
}

if ($method === 'DELETE') {
    $id = $data['id'] ?? $_GET['id'];
    $stmt = $db->prepare("DELETE FROM servicios WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(["ok" => true]);
    exit;
}