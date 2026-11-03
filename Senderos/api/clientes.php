<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

/* Solo lectura: la lista de clientes es exclusiva del panel admin. */
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

requireAdmin(); // la lista de clientes es solo para el panel admin

try {
    $db = getDB();
    $stmt = $db->query("SELECT id, nombre, apellido, email, telefono, nacimiento, created_at FROM usuarios WHERE rol = 'cliente' ORDER BY id DESC");
    $clientes = [];

    foreach ($stmt->fetchAll() as $fila) {
        $fila['createdAt'] = $fila['created_at'] ?? null;
        $clientes[] = $fila;
    }

    jsonResponse(['ok' => true, 'clientes' => $clientes]);
} catch (Throwable $e) {
    error_log('Senderos clientes: ' . $e->getMessage());
    jsonResponse(['ok' => false, 'error' => 'No se pudo cargar la lista de clientes.'], 500);
}
