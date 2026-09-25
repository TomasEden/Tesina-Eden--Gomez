<?php

declare(strict_types=1);

/*
 * Senderos — crea o repara un usuario administrador desde la consola.
 *
 * Uso (desde la carpeta Senderos/):
 *   php tools/crear_admin.php email@dominio.com "Nombre" "Apellido" 3510000001
 *
 * Después te pide la contraseña (mínimo 8 caracteres).
 * Solo corre por línea de comandos: desde el navegador responde 404.
 * Si el email ya existe, lo pasa a admin, lo activa y le cambia la contraseña.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/config.php';

$email = trim((string)($argv[1] ?? ''));
$nombre = trim((string)($argv[2] ?? 'Administrador'));
$apellido = trim((string)($argv[3] ?? 'Senderos'));
$telefono = trim((string)($argv[4] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Uso: php tools/crear_admin.php email@dominio.com \"Nombre\" \"Apellido\" telefono\n");
    exit(1);
}

fwrite(STDOUT, "Contraseña (mínimo 8 caracteres; se ve mientras la escribís): ");
$password = trim((string)fgets(STDIN));

if (strlen($password) < 8) {
    fwrite(STDERR, "La contraseña es muy corta.\n");
    exit(1);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $db = getDB();

    $stmt = $db->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $existente = $stmt->fetchColumn();

    if ($existente) {
        $upd = $db->prepare(
            "UPDATE usuarios SET password_hash = ?, rol = 'admin', activo = 1 WHERE id = ?"
        );
        $upd->execute([$hash, $existente]);
        fwrite(STDOUT, "Listo: el usuario #{$existente} ahora es admin y tiene la nueva contraseña.\n");
        exit(0);
    }

    if ($telefono === '') {
        fwrite(STDERR, "El email no existe todavía: pasá también un teléfono único como 4º argumento.\n");
        exit(1);
    }

    $ins = $db->prepare(
        "INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo)
         VALUES (?, ?, ?, ?, ?, 'admin', 1)"
    );
    $ins->execute([$nombre, $apellido, $email, $hash, $telefono]);

    fwrite(STDOUT, "Listo: administrador creado con el email {$email}.\n");
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n");
    exit(1);
}
