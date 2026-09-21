<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Método no permitido'
    ], 405);
}

$data = getJsonInput();

$nombre = trim((string)($data['nombre'] ?? ''));
$apellido = trim((string)($data['apellido'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$password = (string)($data['password'] ?? '');
$telefono = trim((string)($data['telefono'] ?? ''));
$nacimiento = trim((string)($data['nacimiento'] ?? ''));

if ($nombre === '' || $apellido === '' || $email === '' || $password === '' || $telefono === '') {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Completá todos los campos obligatorios, incluido el teléfono'
    ], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'Ingresá un email válido'
    ], 400);
}

if (strlen($password) < 6) {
    jsonResponse([
        'ok' => false,
        'mensaje' => 'La contraseña debe tener al menos 6 caracteres'
    ], 400);
}

try {

    $db = getDB();

    $stmt = $db->prepare("
        SELECT id
        FROM usuarios
        WHERE email = ?
        LIMIT 1
    ");

    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        jsonResponse([
            'ok' => false,
            'mensaje' => 'Ya existe una cuenta con ese email'
        ], 409);
    }

    $stmt = $db->prepare("
        SELECT id
        FROM usuarios
        WHERE telefono = ?
        LIMIT 1
    ");

    $stmt->execute([$telefono]);

    if ($stmt->fetch()) {
        jsonResponse([
            'ok' => false,
            'mensaje' => 'Ya existe una cuenta con ese teléfono'
        ], 409);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $db->prepare("
        INSERT INTO usuarios
        (
            nombre,
            apellido,
            email,
            password_hash,
            telefono,
            nacimiento,
            rol,
            activo,
            created_at
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'cliente',
            1,
            NOW()
        )
    ");

    $stmt->execute([
        $nombre,
        $apellido,
        $email,
        $passwordHash,
        $telefono,
        $nacimiento !== '' ? $nacimiento : null
    ]);

    $usuarioId = (int)$db->lastInsertId();

    jsonResponse([
        'ok' => true,
        'mensaje' => 'Cuenta creada correctamente',
        'usuario_id' => $usuarioId
    ], 201);

} catch (Throwable $e) {

    error_log('Senderos registro: ' . $e->getMessage());

    jsonResponse([
        'ok' => false,
        'mensaje' => 'No se pudo crear la cuenta. Probá de nuevo.'
    ], 500);
}
