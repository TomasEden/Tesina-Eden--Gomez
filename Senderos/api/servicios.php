<?php
require_once 'config.php';
header('Content-Type: application/json');
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function generarSlug($texto) {
    $slug = strtolower($texto);
    $slug = preg_replace('/[áàäâ]/u', 'a', $slug);
    $slug = preg_replace('/[éèëê]/u', 'e', $slug);
    $slug = preg_replace('/[íìïî]/u', 'i', $slug);
    $slug = preg_replace('/[óòöô]/u', 'o', $slug);
    $slug = preg_replace('/[úùüû]/u', 'u', $slug);
    $slug = preg_replace('/ñ/u', 'n', $slug);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    return trim($slug, '-');
}

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM servicios ORDER BY id DESC");
    echo json_encode(["ok" => true, "servicios" => $stmt->fetchAll()]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST') {
    $slug = generarSlug($data['nombre']);
    // Asegurar que el slug sea único
    $base = $slug; $i = 1;
    $check = $db->prepare("SELECT COUNT(*) FROM servicios WHERE slug=?");
    while (true) {
        $check->execute([$slug]);
        if ($check->fetchColumn() == 0) break;
        $slug = $base . '-' . (++$i);
    }

    $stmt = $db->prepare("INSERT INTO servicios (nombre, slug, categoria, descripcion, duracion, precio, imagen, badge, badge_texto, incluye) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $data['nombre'], $slug, $data['categoria'], $data['descripcion'],
        $data['duracion'], $data['precio'], $data['imagen'],
        $data['badge'] ?? null, $data['badge_texto'] ?? null, $data['incluye'] ?? null
    ]);
    echo json_encode(["ok" => true, "id" => $db->lastInsertId(), "slug" => $slug]);
    exit;
}

if ($method === 'PUT') {
    $stmt = $db->prepare("UPDATE servicios SET nombre=?, categoria=?, descripcion=?, duracion=?, precio=?, imagen=?, badge=?, badge_texto=?, incluye=? WHERE id=?");
    $stmt->execute([
        $data['nombre'], $data['categoria'], $data['descripcion'],
        $data['duracion'], $data['precio'], $data['imagen'],
        $data['badge'] ?? null, $data['badge_texto'] ?? null, $data['incluye'] ?? null,
        $data['id']
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