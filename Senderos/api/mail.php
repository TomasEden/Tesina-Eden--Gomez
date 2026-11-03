<?php

declare(strict_types=1);

/*
 * ═══════════════════════════════════════════════════════════
 * Senderos — mail.php
 * Envío real de correos con PHPMailer (SMTP autenticado) y
 * plantillas HTML con la identidad visual de Senderos Spa.
 *
 * Requiere PHPMailer instalado con Composer:
 *   composer require phpmailer/phpmailer
 *
 * La configuración SMTP vive en .env (ver .env.example).
 * Si el envío falla se lanza SenderosMailException: el llamador
 * NO debe continuar con la operación protegida.
 * ═══════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;

/** Excepción propia para fallos de correo. */
class SenderosMailException extends RuntimeException
{
}

/* ═══════════════════════════════════════════
   Plantillas
   ═══════════════════════════════════════════ */

/**
 * Cuerpo HTML compartido por todos los correos de verificación.
 * Diseño responsive de una columna, sin imágenes externas (el logo
 * es texto con la tipografía de la marca) para funcionar en Gmail,
 * Outlook, Yahoo y apps móviles.
 *
 * $codigo puede ser null para correos sin bloque de código
 * (p. ej. la notificación de cambio completado).
 */
function mailPlantillaHTML(
    string $titulo,
    string $saludo,
    array $parrafos,
    ?string $codigo,
    ?string $avisoFinal = null
): string {
    $anio = date('Y');
    $minutos = CODIGO_VALIDEZ_MIN;

    $parrafosHTML = '';

    foreach ($parrafos as $parrafo) {
        $parrafosHTML .= '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#5d7462;">'
            . htmlspecialchars((string)$parrafo, ENT_QUOTES, 'UTF-8')
            . '</p>';
    }

    $bloqueCodigo = '';

    if ($codigo !== null) {
        $codigoSeguro = htmlspecialchars($codigo, ENT_QUOTES, 'UTF-8');

        $bloqueCodigo = <<<HTML
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;"><tr><td align="center" style="background:#faf0f2;border:1px dashed #D3A1A9;border-radius:10px;padding:18px 12px;">
<span style="display:block;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#AD717E;margin-bottom:6px;">Tu código de verificación</span>
<span style="font-family:'DM Sans','Segoe UI',monospace;font-size:34px;font-weight:500;letter-spacing:.34em;color:#45634D;">{$codigoSeguro}</span>
</td></tr></table>
<p style="margin:12px 0 0;text-align:center;font-size:13px;color:#8a9c8e;">Vence en {$minutos} minutos. Una vez vencido deberás solicitar uno nuevo.</p>
HTML;
    }

    $avisoHTML = '';

    if ($avisoFinal !== null && $avisoFinal !== '') {
        $avisoHTML = '<p style="margin:24px 0 0;padding:16px;background:#faf0f2;border-left:3px solid #D3A1A9;font-size:13px;line-height:1.6;color:#5d7462;">'
            . htmlspecialchars((string)$avisoFinal, ENT_QUOTES, 'UTF-8')
            . '</p>';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<title>{$titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f4ece7;font-family:'DM Sans','Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4ece7;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 10px 34px rgba(69,99,77,.08);">
<tr><td style="background:#45634D;padding:28px 36px;text-align:center;">
<span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;letter-spacing:.04em;color:#ffffff;">Senderos</span>
<span style="display:block;margin-top:4px;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#F3CFD4;">Spa &amp; Bienestar</span>
</td></tr>
<tr><td style="padding:36px 36px 40px;">
<h1 style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#39311D;">{$titulo}</h1>
<p style="margin:0 0 20px;font-size:15px;font-weight:500;color:#AD717E;">{$saludo}</p>
{$parrafosHTML}
{$bloqueCodigo}
{$avisoHTML}
</td></tr>
<tr><td style="background:#faf7f5;padding:22px 36px;text-align:center;">
<p style="margin:0;font-size:12px;line-height:1.6;color:#8a9c8e;">
Senderos Spa · Río Tercero, Córdoba<br>
© {$anio} Senderos. Todos los derechos reservados.
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
}

/**
 * Versión de texto plano, con el mismo contenido del HTML
 * para clientes que no muestran HTML ni fuentes especiales.
 */
function mailPlantillaTexto(string $titulo, array $parrafos, ?string $codigo): string
{
    $minutos = CODIGO_VALIDEZ_MIN;

    $texto = "SENDEROS SPA\n"
        . str_repeat('=', 40) . "\n\n"
        . $titulo . "\n\n";

    foreach ($parrafos as $parrafo) {
        $texto .= (string)$parrafo . "\n\n";
    }

    if ($codigo !== null) {
        $texto .= 'Tu código de verificación: ' . $codigo . "\n"
            . "Vence en {$minutos} minutos.\n\n";
    }

    $texto .= "Si no solicitaste este mensaje, ignoralo.\n"
        . "Nunca compartas tu código con nadie.\n";

    return $texto;
}

/* ═══════════════════════════════════════════
   Los cuatro correos de verificación
   ═══════════════════════════════════════════ */

/**
 * Contenido de cada tipo de correo. Devuelve
 * [asunto, html, texto] para usar con mailEnviar().
 */
function mailContenido(string $tipo, string $nombre, string $codigo, array $datos = []): array
{
    $nombreSeguro = $nombre !== '' ? $nombre : 'Usuario';

    switch ($tipo) {

        case VERIF_TIPO_LOGIN:
            return [
                'asunto' => 'Tu código de verificación para ingresar a Senderos',
                'html' => mailPlantillaHTML(
                    'Verificación de inicio de sesión',
                    'Hola, ' . $nombreSeguro,
                    [
                        'Recibimos un intento de inicio de sesión en tu cuenta de Senderos. Para continuar, ingresá el código de 6 dígitos que aparece más abajo.',
                        'Si no fuiste vos, no te preocupes: sin este código nadie puede entrar. Solo podés iniciar sesión desde la pantalla de verificación en tu navegador.',
                    ],
                    $codigo,
                    'Nunca compartas este código. Senderos nunca te va a pedirlo por teléfono ni por WhatsApp.'
                ),
                'texto' => mailPlantillaTexto(
                    'Verificación de inicio de sesión',
                    [
                        'Hola, ' . $nombreSeguro . '.',
                        'Recibimos un intento de inicio de sesión en tu cuenta de Senderos. Ingresá el código de 6 dígitos para continuar.',
                        'Si no fuiste vos, ignorá este mensaje: sin el código nadie puede entrar.',
                    ],
                    $codigo
                ),
            ];

        case VERIF_TIPO_PERFIL:
            return [
                'asunto' => 'Confirmá los cambios de tu cuenta en Senderos',
                'html' => mailPlantillaHTML(
                    'Confirmación de cambios',
                    'Hola, ' . $nombreSeguro,
                    [
                        'Queremos asegurarnos de que sos vos antes de guardar los cambios en tus datos personales. Ingresá el código de 6 dígitos para confirmar la modificación.',
                        'Los cambios no se aplicarán hasta que el código sea verificado.',
                    ],
                    $codigo,
                    'Si no pediste modificar tus datos, ignorá este mensaje: no se guardó ningún cambio.'
                ),
                'texto' => mailPlantillaTexto(
                    'Confirmación de cambios',
                    [
                        'Hola, ' . $nombreSeguro . '.',
                        'Ingresá el código de 6 dígitos para confirmar los cambios en tus datos personales.',
                        'Si no pediste modificar tus datos, ignorá este mensaje.',
                    ],
                    $codigo
                ),
            ];

        case VERIF_TIPO_EMAIL_ACTUAL:
            $emailNuevo = (string)($datos['email_nuevo'] ?? '');

            return [
                'asunto' => 'Verificá tu identidad para cambiar tu correo',
                'html' => mailPlantillaHTML(
                    'Cambio de correo electrónico',
                    'Hola, ' . $nombreSeguro,
                    [
                        'Nos pediste cambiar el correo de tu cuenta de Senderos' .
                            ($emailNuevo !== '' ? ' a ' . $emailNuevo : '') . '.',
                        'Para continuar necesitamos confirmar que tenés acceso a esta dirección. Ingresá el código de 6 dígitos que te enviamos.',
                    ],
                    $codigo,
                    'Si no pediste este cambio, no ingreses el código y comunicate con nosotros. Tu correo actual se mantiene intacto hasta completar la verificación.'
                ),
                'texto' => mailPlantillaTexto(
                    'Cambio de correo electrónico',
                    [
                        'Hola, ' . $nombreSeguro . '.',
                        'Nos pediste cambiar el correo de tu cuenta' .
                            ($emailNuevo !== '' ? ' a ' . $emailNuevo : '') . '.',
                        'Ingresá el código de 6 dígitos para confirmar que tenés acceso a esta dirección.',
                        'Si no pediste este cambio, ignorá este mensaje.',
                    ],
                    $codigo
                ),
            ];

        case VERIF_TIPO_EMAIL_NUEVO:
            return [
                'asunto' => 'Verificá tu nuevo correo en Senderos',
                'html' => mailPlantillaHTML(
                    'Nuevo correo electrónico',
                    'Hola, ' . $nombreSeguro,
                    [
                        'Estamos por asociar esta dirección a tu cuenta de Senderos. Como último paso, ingresá el código de 6 dígitos para confirmar que tenés acceso a este correo.',
                        'Una vez verificado, a partir de ahora se usarán estos datos para iniciar sesión y recibir notificaciones.',
                    ],
                    $codigo,
                    'Si no pediste este cambio, ignorá este mensaje: tu cuenta no se modifica.'
                ),
                'texto' => mailPlantillaTexto(
                    'Nuevo correo electrónico',
                    [
                        'Hola, ' . $nombreSeguro . '.',
                        'Ingresá el código de 6 dígitos para confirmar tu nuevo correo electrónico.',
                        'Si no pediste este cambio, ignorá este mensaje.',
                    ],
                    $codigo
                ),
            ];

        /* Notificación de seguridad: sin bloque de código. */
        case 'email_cambio_ok':
            $emailNuevo = (string)($datos['email_nuevo'] ?? '');

            return [
                'asunto' => 'Tu correo electrónico fue actualizado',
                'html' => mailPlantillaHTML(
                    'Cambio de correo completado',
                    'Hola, ' . $nombreSeguro,
                    [
                        'Te escribimos para informarte que el correo electrónico de tu cuenta de Senderos fue actualizado correctamente.',
                        'A partir de ahora tu cuenta se asocia a ' . $emailNuevo . '. Podés usar esa dirección para iniciar sesión.',
                    ],
                    null,
                    'Si no realizaste este cambio, contactanos de inmediato para proteger tu cuenta.'
                ),
                'texto' => mailPlantillaTexto(
                    'Cambio de correo completado',
                    [
                        'Hola, ' . $nombreSeguro . '.',
                        'El correo electrónico de tu cuenta fue actualizado a ' . $emailNuevo . '.',
                        'Si no realizaste este cambio, contactanos de inmediato.',
                    ],
                    null
                ),
            ];
    }

    throw new SenderosMailException('Tipo de correo desconocido');
}

/* ═══════════════════════════════════════════
   Envío real vía SMTP
   ═══════════════════════════════════════════ */

/**
 * Envía un correo real por SMTP autenticado.
 * Lanza SenderosMailException si la configuración está incompleta
 * o el envío falla. NUNCA simula el envío.
 */
function mailEnviar(string $para, string $asunto, string $html, string $texto): void
{
    if (!SMTP_CONFIGURADO) {
        throw new SenderosMailException(
            'El servicio de correo no está configurado. Revisá el archivo .env (SENDEROS_SMTP_*).'
        );
    }

    $mail = new PHPMailer(true);

    try {
        /* Configuración del servidor. */
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->Port = SMTP_PORT > 0 ? SMTP_PORT : 587;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;

        if (SMTP_ENCRIPTACION === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } elseif (SMTP_ENCRIPTACION === 'tls' || SMTP_ENCRIPTACION === '') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            /* 'none' u otro valor: sin cifrado explícito. */
            $mail->SMTPSecure = false;
        }

        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';

        /* Remitente. */
        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addAddress($para);
        $mail->Subject = $asunto;
        $mail->AltBody = $texto;
        $mail->msgHTML($html);

        $mail->send();
    } catch (MailException $e) {
        /* El mensaje interno de PHPMailer puede contener credenciales:
           se registra solo en el log del servidor, jamás se devuelve. */
        error_log('Senderos mail: ' . $e->getMessage());

        throw new SenderosMailException('No se pudo enviar el correo de verificación');
    }
}

/**
 * Atajo: genera el contenido del tipo indicado y lo envía.
 * Lanza SenderosMailException ante cualquier fallo.
 */
function mailEnviarVerificacion(
    string $tipo,
    string $para,
    string $nombre,
    string $codigo,
    array $datos = []
): void {
    $contenido = mailContenido($tipo, $nombre, $codigo, $datos);

    mailEnviar(
        $para,
        (string)$contenido['asunto'],
        (string)$contenido['html'],
        (string)$contenido['texto']
    );
}
