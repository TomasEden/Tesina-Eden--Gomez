<?php
require_once 'config.php';
session_start();
header('Content-Type: application/json');
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $servicioId = $_GET['servicio_id'] ?? null;
    if ($servicioId) {
        $stmt = $db->prepare("SELECT * FROM resenas WHERE servicio_id=? ORDER BY creado_en DESC");
        $stmt->execute([$servicioId]);
    } else {
        $stmt = $db->query("SELECT * FROM resenas ORDER BY creado_en DESC");
    }
    echo json_encode(["ok" => true, "resenas" => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($_SESSION['id'])) {
        echo json_encode(["ok" => false, "error" => "Debés iniciar sesión"]);
        exit;
    }
    $stmt = $db->prepare("INSERT INTO resenas (servicio_id, usuario_id, nombre_usuario, estrellas, texto) VALUES (?,?,?,?,?)");
    $stmt->execute([
        $data['servicio_id'], $_SESSION['id'], $_SESSION['nombre'],
        $data['estrellas'], $data['texto']
    ]);
    echo json_encode(["ok" => true, "id" => $db->lastInsertId()]);
    exit;
}