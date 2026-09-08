<?php

require_once 'config.php';

$data =
json_decode(
file_get_contents("php://input"),
true
);

$email =
$data['email'];

$password =
$data['password'];

$db = getDB();

$stmt =
$db->prepare(
"SELECT *
FROM usuarios
WHERE email=?"
);

$stmt->execute([
$email
]);

$usuario =
$stmt->fetch();

if(
$usuario &&
password_verify(
$password,
$usuario['password_hash']
)
)
{
    session_start();

    $_SESSION['id']
    =
    $usuario['id'];

    $_SESSION['nombre']
    =
    $usuario['nombre'];

    echo json_encode([
        "ok" => true,
        "usuario" => [
            "id" => $usuario['id'],
            "nombre" => $usuario['nombre'],
            "apellido" => $usuario['apellido'],
            "email" => $usuario['email'],
            "telefono" => $usuario['telefono']
        ]
    ]);
}
else
{
    echo json_encode([
        "ok" => false,
        "error" => "Email o contraseña incorrectos"
    ]);
}