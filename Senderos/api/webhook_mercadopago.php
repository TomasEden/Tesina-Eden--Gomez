<?php

declare(strict_types=1);

/*
 * Webhook de Mercado Pago.
 * No usa sesión. Valida firma HMAC y consulta el pago real a la API de MP.
 * Responde 200 para eventos ignorados y 5xx solo cuando conviene que MP reintente.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/pagos_lib.php';

header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Método no permitido'], 405);
}

if (!mpConfigurado()) {
    jsonResponse(['ok' => false, 'error' => 'Mercado Pago no está configurado'], 503);
}

$raw = file_get_contents('php://input');
$payload = json_decode((string)$raw, true);

if (!is_array($payload)) {
    $payload = [];
}

if (!mpValidarFirmaWebhook($payload)) {
    error_log('Webhook Mercado Pago: firma inválida.');

    jsonResponse(['ok' => false, 'error' => 'Firma inválida'], 401);
}

$tipo = strtolower(trim((string)(
    $payload['type']
    ?? $payload['topic']
    ?? $_GET['type']
    ?? $_GET['topic']
    ?? ''
)));
$pagoId = trim((string)(
    $_GET['data.id']
    ?? $_GET['data']['id']
    ?? $_GET['id']
    ?? $payload['data']['id']
    ?? ''
));

if ($tipo !== '' && $tipo !== 'payment') {
    jsonResponse(['ok' => true, 'ignorado' => true]);
}

if ($pagoId === '') {
    jsonResponse(['ok' => true, 'ignorado' => true]);
}

try {
    $pago = mpObtenerPago($pagoId);
    $db = getDB();
    $db->beginTransaction();

    try {
        $resultado = mpProcesarPago($db, $pago);
        $db->commit();

        jsonResponse($resultado, 200);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        throw $e;
    }
} catch (Throwable $e) {
    error_log('Webhook Mercado Pago: ' . $e->getMessage());

    jsonResponse(['ok' => false, 'error' => 'No se pudo procesar el pago'], 500);
}
