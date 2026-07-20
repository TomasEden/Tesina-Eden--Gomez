<?php

require_once 'config.php';

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$nombre = $data['nombre'];
$apellido = $data['apellido'];
$email = $data['email'];
$password = $data['password'];
$telefono = $data['telefono'];
$nacimiento = $data['nacimiento'];

$db = getDB();

/* Verificar email o teléfono existente */
$check = $db->prepare(
    "SELECT COUNT(*) FROM usuarios
     WHERE email = ? OR telefono = ?"
);

$check->execute([$email, $telefono]);

$existe = $check->fetchColumn();

if ($existe > 0) {
    echo json_encode([
        "ok" => false,
        "error" => "El email o teléfono ya están registrados."
    ]);
    exit;
}

/* Crear usuario */
$hash = password_hash(
    $password,
    PASSWORD_BCRYPT
);

$stmt = $db->prepare(
    "INSERT INTO usuarios
    (nombre, apellido, email, password_hash, telefono, nacimiento)
    VALUES (?, ?, ?, ?, ?, ?)"
);

$stmt->execute([
    $nombre,
    $apellido,
    $email,
    $hash,
    $telefono,
    $nacimiento
]);

echo json_encode([
    "ok" => true
]);