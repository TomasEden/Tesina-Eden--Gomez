<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

try {
    $db = getDB();
    $stmt = $db->query('SELECT id, nombre, apellido, email, telefono, nacimiento FROM usuarios ORDER BY id DESC');
    jsonResponse(['ok' => true, 'clientes' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    error_log('Senderos clientes: ' . $e->getMessage());
    jsonResponse(['ok' => false, 'error' => 'No se pudo cargar la lista de clientes.'], 500);
}
