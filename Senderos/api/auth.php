<?php

declare(strict_types=1);

function usuarioActual(): ?array
{
    iniciarSesion();

    if (
        empty($_SESSION['usuario_id']) ||
        empty($_SESSION['usuario']) ||
        !is_array($_SESSION['usuario'])
    ) {
        return null;
    }

    $usuario = $_SESSION['usuario'];

    return [
        'id' => (int) ($_SESSION['usuario_id'] ?? $usuario['id'] ?? 0),
        'nombre' => (string) ($usuario['nombre'] ?? ''),
        'apellido' => (string) ($usuario['apellido'] ?? ''),
        'email' => (string) ($usuario['email'] ?? ''),
        'rol' => (string) ($usuario['rol'] ?? 'cliente')
    ];
}

function requireLogin(): array
{
    $usuario = usuarioActual();

    if (!$usuario) {
        jsonResponse([
            'ok' => false,
            'error' => 'Debés iniciar sesión'
        ], 401);
    }

    return $usuario;
}

function requireAdmin(): array
{
    $usuario = usuarioActual();

    if (!$usuario) {
        jsonResponse([
            'ok' => false,
            'error' => 'Debés iniciar sesión'
        ], 401);
    }

    if ($usuario['rol'] !== 'admin') {
        jsonResponse([
            'ok' => false,
            'error' => 'No tenés permisos de administrador'
        ], 403);
    }

    return $usuario;
}