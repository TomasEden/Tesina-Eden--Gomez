<?php
require_once 'config.php';
header('Content-Type: application/json');
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM ofertas ORDER BY id DESC");
    echo json_encode(["ok" => true, "ofertas" => $stmt->fetchAll()]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST') {
    $stmt = $db->prepare("INSERT INTO ofertas (nombre, descripcion, tipo, descuento, aplica, especifico, fecha_inicio, fecha_fin, dias, color, estado)
                          VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $data['nombre'], $data['descripcion'], $data['tipo'], $data['descuento'],
        $data['aplica'], $data['especifico'], $data['fecha_inicio'] ?: null, $data['fecha_fin'] ?: null,
        implode(',', $data['dias'] ?? []), $data['color'], $data['estado']
    ]);
    echo json_encode(["ok" => true, "id" => $db->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $stmt = $db->prepare("UPDATE ofertas SET nombre=?, descripcion=?, tipo=?, descuento=?, aplica=?, especifico=?, fecha_inicio=?, fecha_fin=?, dias=?, color=?, estado=? WHERE id=?");
    $stmt->execute([
        $data['nombre'], $data['descripcion'], $data['tipo'], $data['descuento'],
        $data['aplica'], $data['especifico'], $data['fecha_inicio'] ?: null, $data['fecha_fin'] ?: null,
        implode(',', $data['dias'] ?? []), $data['color'], $data['estado'], $data['id']
    ]);
    echo json_encode(["ok" => true]);
    exit;
}

if ($method === 'DELETE') {
    $id = $data['id'] ?? $_GET['id'];
    $stmt = $db->prepare("DELETE FROM ofertas WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(["ok" => true]);
    exit;
}