<?php

require_once 'config.php';

$data =
json_decode(
file_get_contents("php://input"),
true
);

$nombre =
$data['nombre'];

$apellido =
$data['apellido'];

$email =
$data['email'];

$password =
$data['password'];

$telefono =
$data['telefono'];

$nacimiento =
$data['nacimiento'];

$db = getDB();

$hash =
password_hash(
$password,
PASSWORD_BCRYPT
);

$stmt =
$db->prepare(
"INSERT INTO usuarios
(nombre,apellido,email,password_hash,telefono,nacimiento)
VALUES(?,?,?,?,?,?)"
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
"ok"=>true
]);