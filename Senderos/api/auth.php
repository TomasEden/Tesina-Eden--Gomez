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

/*
 * El carrito vive en $_SESSION['carrito'] con esta forma (ver api/carrito.php):
 *   ['productos' => [id => cantidad], 'servicios' => [id => ['fecha'=>…, 'hora'=>…]]]
 *
 * fusionarCarritos() une dos versiones del carrito por unión de ítems:
 * lo que ya está en $actual se conserva tal cual y solo se agregan los que
 * faltan en $respaldo. Nunca suma cantidades (evita duplicar unidades) y no
 * toca stock, precios ni turnos: eso lo revalida el servidor en carrito.php
 * y checkout.php.
 */
function fusionarCarritos(?array $actual, ?array $respaldo): array
{
    $resultado = [
        'productos' => [],
        'servicios' => []
    ];

    foreach ([$actual, $respaldo] as $origen) {
        if (!is_array($origen)) {
            continue;
        }

        foreach (['productos', 'servicios'] as $rama) {
            $items = $origen[$rama] ?? null;

            if (!is_array($items)) {
                continue;
            }

            foreach ($items as $id => $dato) {
                if (!array_key_exists($id, $resultado[$rama])) {
                    $resultado[$rama][$id] = $dato;
                }
            }
        }
    }

    return $resultado;
}