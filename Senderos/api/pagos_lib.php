<?php

declare(strict_types=1);

/*
 * Senderos — integración Mercado Pago Checkout Pro.
 *
 * Este archivo no contiene credenciales. Se configuran por variables de
 * entorno (ver api/config.php). Si MP_ENABLED es false, el checkout rechaza
 * el método mercadopago y el resto del sitio sigue funcionando normalmente.
 */

require_once __DIR__ . '/config.php';

function mpConfigurado(): bool
{
    return MP_ENABLED && function_exists('curl_init');
}

function mpHttpRequest(string $method, string $url, ?array $payload = null): array
{
    if (!mpConfigurado()) {
        throw new RuntimeException('Mercado Pago no está configurado.');
    }

    if (!function_exists('curl_init')) {
        throw new RuntimeException('La extensión cURL de PHP no está disponible.');
    }

    $ch = curl_init($url);

    if ($ch === false) {
        throw new RuntimeException('No se pudo iniciar la conexión con Mercado Pago.');
    }

    $headers = [
        'Authorization: Bearer ' . MP_ACCESS_TOKEN,
        'Content-Type: application/json',
        'Accept: application/json',
        'User-Agent: Senderos/1.0'
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 20
    ]);

    if ($payload !== null) {
        curl_setopt(
            $ch,
            CURLOPT_POSTFIELDS,
            json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
    }

    $raw = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $error !== '') {
        error_log('Mercado Pago cURL: ' . $error);
        throw new RuntimeException('No se pudo conectar con Mercado Pago.');
    }

    $body = json_decode((string)$raw, true);

    if (!is_array($body)) {
        $body = [];
    }

    if ($status < 200 || $status >= 300) {
        $detalle = (string)($body['message'] ?? $body['error'] ?? 'Error de Mercado Pago');

        error_log('Mercado Pago HTTP ' . $status . ': ' . $detalle);

        throw new RuntimeException('Mercado Pago rechazó la operación: ' . $detalle);
    }

    return $body;
}

function mpCrearPreferencia(array $preferencia): array
{
    return mpHttpRequest(
        'POST',
        'https://api.mercadopago.com/checkout/preferences',
        $preferencia
    );
}

function mpObtenerPago(string $pagoId): array
{
    $pagoId = trim($pagoId);

    if ($pagoId === '' || !preg_match('/^[A-Za-z0-9_-]{1,120}$/', $pagoId)) {
        throw new InvalidArgumentException('ID de pago inválido.');
    }

    return mpHttpRequest(
        'GET',
        'https://api.mercadopago.com/v1/payments/' . rawurlencode($pagoId)
    );
}

function mpUrlPreferencia(array $preferencia): string
{
    $produccion = (string)($preferencia['init_point'] ?? '');
    $sandbox = (string)($preferencia['sandbox_init_point'] ?? '');

    if (MP_MODE === 'production') {
        return $produccion !== '' ? $produccion : $sandbox;
    }

    return $sandbox !== '' ? $sandbox : $produccion;
}

function mpWebhookUrl(): string
{
    return APP_URL . '/api/webhook_mercadopago.php';
}

function mpBackUrl(string $resultado, int $pedidoId): string
{
    return APP_URL . '/html/confirmacion.html?id=' . $pedidoId . '&pago=' . rawurlencode($resultado);
}

/**
 * Valida la firma HMAC del webhook de Mercado Pago.
 * Documentación: x-signature = ts=...,v1=...; x-request-id.
 */
function mpValidarFirmaWebhook(array $payload): bool
{
    if (MP_WEBHOOK_SECRET === '') {
        return false;
    }

    $firma = (string)($_SERVER['HTTP_X_SIGNATURE'] ?? '');
    $requestId = (string)($_SERVER['HTTP_X_REQUEST_ID'] ?? '');

    if ($firma === '') {
        return false;
    }

    $partes = [];

    foreach (explode(',', $firma) as $par) {
        $trozos = explode('=', trim($par), 2);

        if (count($trozos) === 2) {
            $partes[$trozos[0]] = $trozos[1];
        }
    }

    $ts = (string)($partes['ts'] ?? '');
    $v1 = (string)($partes['v1'] ?? '');

    $dataId = (string)(
        $_GET['data.id']
        ?? $_GET['data']['id']
        ?? $_GET['id']
        ?? $payload['data']['id']
        ?? ''
    );

    if ($ts === '' || $v1 === '' || $dataId === '') {
        return false;
    }

    $manifest = 'id:' . $dataId . ';';

    if ($requestId !== '') {
        $manifest .= 'request-id:' . $requestId . ';';
    }

    $manifest .= 'ts:' . $ts . ';';

    $calculada = hash_hmac('sha256', $manifest, MP_WEBHOOK_SECRET);

    return hash_equals($calculada, $v1);
}

function mpMapearEstadoPago(string $estado): string
{
    $estado = strtolower(trim($estado));

    if ($estado === 'approved') {
        return 'aprobado';
    }

    if ($estado === 'in_process' || $estado === 'authorized') {
        return 'en_proceso';
    }

    if ($estado === 'rejected') {
        return 'rechazado';
    }

    if ($estado === 'cancelled' || $estado === 'canceled') {
        return 'cancelado';
    }

    if ($estado === 'refunded' || $estado === 'charged_back') {
        return 'reembolsado';
    }

    if ($estado === 'pending') {
        return 'pendiente';
    }

    return 'revisar';
}

/**
 * Guarda el resultado de un pago de Mercado Pago. No modifica el estado
 * logístico del pedido (pendiente/confirmado/etc.).
 */
function mpProcesarPago(PDO $db, array $payment): array
{
    $external = trim((string)($payment['external_reference'] ?? ''));
    $pagoId = trim((string)($payment['id'] ?? ''));

    if ($external === '' || $pagoId === '') {
        return ['ok' => true, 'ignorado' => true, 'motivo' => 'Sin referencia'];
    }

    $stmt = $db->prepare('SELECT * FROM pagos WHERE external_reference = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$external]);
    $registro = $stmt->fetch();

    if (!$registro) {
        return ['ok' => true, 'ignorado' => true, 'motivo' => 'Pago no registrado'];
    }

    $stmt = $db->prepare('SELECT * FROM pedidos WHERE id = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([(int)$registro['pedido_id']]);
    $pedido = $stmt->fetch();

    if (!$pedido) {
        return ['ok' => true, 'ignorado' => true, 'motivo' => 'Pedido inexistente'];
    }

    $estado = mpMapearEstadoPago((string)($payment['status'] ?? ''));
    $detalle = substr((string)($payment['status_detail'] ?? ''), 0, 120);
    $monto = round((float)($payment['transaction_amount'] ?? 0), 2);
    $moneda = strtoupper(trim((string)($payment['currency_id'] ?? MP_CURRENCY)));
    $metodo = substr((string)($payment['payment_method_id'] ?? $payment['payment_type_id'] ?? ''), 0, 60);
    $montoEsperado = round((float)($registro['monto'] ?? 0), 2);

    $payloadSeguro = [
        'id' => $pagoId,
        'status' => (string)($payment['status'] ?? ''),
        'status_detail' => $detalle,
        'transaction_amount' => $monto,
        'currency_id' => $moneda,
        'payment_method_id' => (string)($payment['payment_method_id'] ?? ''),
        'payment_type_id' => (string)($payment['payment_type_id'] ?? ''),
        'date_created' => (string)($payment['date_created'] ?? ''),
        'date_approved' => (string)($payment['date_approved'] ?? ''),
        'external_reference' => $external
    ];

    if ($moneda !== 'ARS' || abs($monto - $montoEsperado) > 0.01) {
        $estado = 'revisar';
        $detalle = 'Monto o moneda no coinciden con el pedido.';

        $stmt = $db->prepare(
            'UPDATE pagos
             SET pago_id = ?, estado = ?, estado_detalle = ?, metodo = ?,
                 monto = ?, moneda = ?, payload_json = ?, actualizado_en = NOW()
             WHERE id = ?'
        );
        $stmt->execute([
            $pagoId,
            $estado,
            $detalle,
            $metodo,
            $monto,
            $moneda,
            json_encode($payloadSeguro, JSON_UNESCAPED_UNICODE),
            (int)$registro['id']
        ]);

        $stmt = $db->prepare(
            'UPDATE pedidos
             SET pago_estado = ?, pago_proveedor = ?, pago_id = ?, pago_metodo = ?,
                 pago_actualizado_en = NOW()
             WHERE id = ?'
        );
        $stmt->execute([
            'revisar',
            'mercadopago',
            $pagoId,
            $metodo,
            (int)$pedido['id']
        ]);

        error_log('Mercado Pago: pago ' . $pagoId . ' con monto/moneda inconsistentes.');

        return ['ok' => true, 'estado' => $estado, 'pedido_id' => (int)$pedido['id'], 'revisar' => true];
    }

    $stmt = $db->prepare(
        'UPDATE pagos
         SET pago_id = ?, estado = ?, estado_detalle = ?, metodo = ?,
             monto = ?, moneda = ?, payload_json = ?, actualizado_en = NOW()
         WHERE id = ?'
    );
    $stmt->execute([
        $pagoId,
        $estado,
        $detalle,
        $metodo,
        $monto,
        $moneda,
        json_encode($payloadSeguro, JSON_UNESCAPED_UNICODE),
        (int)$registro['id']
    ]);

    $stmt = $db->prepare(
        'UPDATE pedidos
         SET pago_estado = ?, pago_proveedor = ?, pago_id = ?, pago_metodo = ?,
             pago_actualizado_en = NOW()
         WHERE id = ?'
    );
    $stmt->execute([
        $estado,
        'mercadopago',
        $pagoId,
        $metodo,
        (int)$pedido['id']
    ]);

    return [
        'ok' => true,
        'estado' => $estado,
        'pedido_id' => (int)$pedido['id'],
        'pago_id' => $pagoId
    ];
}
