<?php

declare(strict_types=1);

/**
 * Desarma el campo `especifico` que puede venir como:
 *  - "Nombre del producto o servicio" (formato simple original)
 *  - "tipo|id|Nombre" (formato con id)
 *  - lista separada por comas de cualquiera de los anteriores
 *    (ej: "servicio:35,producto:7" o "Nombre A,Nombre B")
 */
function ofertaParseEspecifico(string $especifico): array
{
    $especifico = trim($especifico);

    $partes = explode('|', $especifico);

    if (count($partes) === 3) {
        return [
            'tipo' => strtolower(trim($partes[0])),
            'id' => (int)trim($partes[1]),
            'nombre' => trim($partes[2])
        ];
    }

    if (preg_match('/^(servicio|producto):(\d+)$/i', $especifico, $m)) {
        return [
            'tipo' => strtolower($m[1]),
            'id' => (int)$m[2],
            'nombre' => ''
        ];
    }

    return [
        'tipo' => '',
        'id' => 0,
        'nombre' => $especifico
    ];
}

function ofertaListaEspecificos(string $especifico): array
{
    $salida = [];

    foreach (explode(',', $especifico) as $parte) {
        $parte = trim($parte);

        if ($parte !== '') {
            $salida[] = $parte;
        }
    }

    return $salida;
}

function ofertaEstaVigenteHoy(array $oferta): bool
{
    /* Fase C: las ofertas rigen por estado + fechas, sin restricción de días. */
    if (strtolower(trim((string)($oferta['estado'] ?? ''))) !== 'activa') {
        return false;
    }

    $hoy = date('Y-m-d');

    $inicio = trim((string)($oferta['fecha_inicio'] ?? ''));
    $fin = trim((string)($oferta['fecha_fin'] ?? ''));

    if ($inicio !== '' && $inicio > $hoy) {
        return false;
    }

    if ($fin !== '' && $fin < $hoy) {
        return false;
    }

    return true;
}

function ofertaCoincideEspecifica(array $oferta, string $tipo, int $id, string $nombre): bool
{
    foreach (ofertaListaEspecificos((string)($oferta['especifico'] ?? '')) as $item) {
        $parsed = ofertaParseEspecifico($item);

        if ($parsed['id'] > 0 && $id > 0 && $parsed['id'] === $id) {
            if ($parsed['tipo'] === '' || $parsed['tipo'] === $tipo) {
                return true;
            }
        }

        if ($parsed['nombre'] !== '' && strcasecmp($parsed['nombre'], trim($nombre)) === 0) {
            return true;
        }
    }

    return false;
}

/**
 * Devuelve la oferta vigente para un ítem según prioridad:
 * específica > por tipo > general. Respeta estado, fechas y días.
 */
function ofertaVigente(
    PDO $db,
    string $nombre,
    string $tipo,
    ?int $id = null
): ?array {
    $tipo = strtolower(trim($tipo));
    $id = (int)($id ?? 0);

    $stmt = $db->query(
        "SELECT *
         FROM ofertas
         WHERE estado = 'activa'
         ORDER BY id ASC"
    );

    $ofertas = $stmt->fetchAll();

    $especificas = [];
    $porTipo = [];
    $generales = [];

    foreach ($ofertas as $oferta) {
        if (!ofertaEstaVigenteHoy($oferta)) {
            continue;
        }

        $aplica = strtolower(trim((string)($oferta['aplica'] ?? '')));

        if ($aplica === 'especifico') {
            if (ofertaCoincideEspecifica($oferta, $tipo, $id, $nombre)) {
                $especificas[] = $oferta;
            }

            continue;
        }

        if (
            ($aplica === 'servicios' && $tipo === 'servicio') ||
            ($aplica === 'productos' && $tipo === 'producto')
        ) {
            $porTipo[] = $oferta;
            continue;
        }

        if ($aplica === 'todos') {
            $generales[] = $oferta;
        }
    }

    if ($especificas) {
        return $especificas[0];
    }

    if ($porTipo) {
        return $porTipo[0];
    }

    if ($generales) {
        return $generales[0];
    }

    return null;
}

/**
 * Precio unitario final según la oferta.
 *  - porcentaje: descuento sobre el precio
 *  - precio_fijo: precio fijo solo si es menor al original
 *  - 2x1 y texto: no cambian el precio unitario
 */
function precioFinal(
    float $precio,
    ?array $of
): float {
    if (!$of) {
        return round($precio, 2);
    }

    $tipo = strtolower(trim((string)($of['tipo'] ?? '')));
    $descuento = (float)($of['descuento'] ?? 0);

    if ($tipo === 'porcentaje' && $descuento > 0) {
        $descuento = min($descuento, 100);
        return round($precio * (1 - $descuento / 100), 2);
    }

    if ($tipo === 'precio_fijo' && $descuento >= 0) {
        return round(min($precio, $descuento), 2);
    }

    return round($precio, 2);
}

/**
 * Subtotal de un producto con cantidad (el 2x1 paga ceil(cantidad/2)).
 */
function subtotalProducto(float $precio, int $cantidad, ?array $of): float
{
    $cantidad = max(0, $cantidad);
    $unitario = precioFinal($precio, $of);
    $tipo = strtolower(trim((string)($of['tipo'] ?? '')));

    if ($tipo === '2x1' && $cantidad > 0) {
        $pagas = (int)ceil($cantidad / 2);
        return round($unitario * $pagas, 2);
    }

    return round($unitario * $cantidad, 2);
}

/**
 * Desglose de unidades pagas y gratis para un 2x1.
 */
function desgloseProducto(float $precio, int $cantidad, ?array $of): array
{
    $tipo = strtolower(trim((string)($of['tipo'] ?? '')));
    $unitario = precioFinal($precio, $of);

    if ($tipo === '2x1' && $cantidad > 0) {
        $pagas = (int)ceil($cantidad / 2);
        $gratis = $cantidad - $pagas;

        return [
            'precio_final' => $unitario,
            'pagas' => $pagas,
            'gratis' => $gratis,
            'subtotal' => round($unitario * $pagas, 2)
        ];
    }

    return [
        'precio_final' => $unitario,
        'pagas' => $cantidad,
        'gratis' => 0,
        'subtotal' => round($unitario * $cantidad, 2)
    ];
}

/**
 * Ofertas activas hoy (modo público para el ticker del inicio).
 */
function ofertasVigentesHoy(PDO $db): array
{
    $stmt = $db->query(
        "SELECT *
         FROM ofertas
         WHERE estado = 'activa'
         ORDER BY id ASC"
    );

    $salida = [];

    foreach ($stmt->fetchAll() as $oferta) {
        if (ofertaEstaVigenteHoy($oferta)) {
            $salida[] = $oferta;
        }
    }

    return $salida;
}

/**
 * Resume una oferta para exponerla al front (sin datos internos de más).
 */
function ofertaResumen(?array $of): ?array
{
    if (!$of) {
        return null;
    }

    return [
        'id' => (int)($of['id'] ?? 0),
        'nombre' => (string)($of['nombre'] ?? ''),
        'tipo' => (string)($of['tipo'] ?? ''),
        'descuento' => (float)($of['descuento'] ?? 0),
        'color' => (string)($of['color'] ?? ''),
        'descripcion' => (string)($of['descripcion'] ?? '')
    ];
}
