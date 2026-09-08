<?php
require_once 'config.php';
session_start();
header('Content-Type: application/json');
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $slug = $_GET['servicio_slug'] ?? null;
    if ($slug) {
        $stmt = $db->prepare("SELECT * FROM resenas WHERE servicio_slug=? ORDER BY creado_en DESC");
        $stmt->execute([$slug]);
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
    $stmt = $db->prepare("INSERT INTO resenas (servicio_slug, usuario_id, nombre_usuario, estrellas, texto) VALUES (?,?,?,?,?)");
    $stmt->execute([
        $data['servicio_slug'], $_SESSION['id'], $_SESSION['nombre'],
        $data['estrellas'], $data['texto']
    ]);
    echo json_encode(["ok" => true, "id" => $db->lastInsertId()]);
    exit;
}