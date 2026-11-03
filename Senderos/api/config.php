<?php

declare(strict_types=1);

date_default_timezone_set('America/Argentina/Cordoba');

ini_set('display_errors', '0');
ini_set('log_errors', '1');

define('DB_HOST', 'localhost');
define('DB_PORT', '3307');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'senderos_db');

/**
 * Carga el archivo privado `.env` (raíz del proyecto) en $_ENV sin
 * pisar variables ya definidas en el entorno del servidor.
 * El .env está excluido del repositorio (.gitignore); ver .env.example.
 */
function senderosCargarEnv(): void
{
    static $cargado = false;

    if ($cargado) {
        return;
    }

    $cargado = true;

    $ruta = dirname(__DIR__) . '/.env';

    if (!is_readable($ruta)) {
        return;
    }

    $lineas = file($ruta, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lineas === false) {
        return;
    }

    foreach ($lineas as $linea) {
        $linea = trim($linea);

        if ($linea === '' || $linea[0] === '#') {
            continue;
        }

        $igual = strpos($linea, '=');

        if ($igual === false) {
            continue;
        }

        $clave = trim(substr($linea, 0, $igual));
        $valor = trim(substr($linea, $igual + 1));

        /* Comillas simples: se toman literalmente (permite '#' en valores). */
        if (strlen($valor) >= 2 && $valor[0] === "'" . substr($valor, -1)) {
            $valor = substr($valor, 1, -1);
        } elseif (strlen($valor) >= 2 && $valor[0] === '"' && substr($valor, -1) === '"') {
            $valor = substr($valor, 1, -1);
        }

        if ($clave !== '' && !isset($_ENV[$clave])) {
            $_ENV[$clave] = $valor;
        }
    }
}

senderosCargarEnv();

function senderosEnv(string $clave, string $porDefecto = ''): string
{
    $valor = getenv($clave);

    if ($valor === false) {
        $valor = $_ENV[$clave] ?? $_SERVER[$clave] ?? null;
    }

    return is_string($valor) && trim($valor) !== ''
        ? trim($valor)
        : $porDefecto;
}

/* Duración de la sesión PHP en días. CONFIRMAR con Claudia si quiere otro valor. */
define('SESION_DIAS', 30);

/* ── Mercado Pago (Checkout Pro) ─────────────────────────────
   Configurar por variables de entorno; nunca hardcodear credenciales.
   MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET, MP_MODE
   (sandbox|production) y SENDEROS_URL (URL pública HTTPS del sitio). */
define('MP_ACCESS_TOKEN', senderosEnv('MP_ACCESS_TOKEN'));
define('MP_PUBLIC_KEY', senderosEnv('MP_PUBLIC_KEY'));
define('MP_WEBHOOK_SECRET', senderosEnv('MP_WEBHOOK_SECRET'));
define('MP_MODE', strtolower(senderosEnv('MP_MODE', 'sandbox')));
define('MP_ENABLED', MP_ACCESS_TOKEN !== '' && MP_WEBHOOK_SECRET !== '');
define('MP_CURRENCY', 'ARS');
define('MP_STATEMENT_DESCRIPTOR', 'SENDEROS');
define('APP_URL', rtrim(senderosEnv('SENDEROS_URL', 'http://localhost/Senderos'), '/'));

/* ═══════════════════════════════════════════
   Verificación en dos pasos (2FA por correo)
   ═══════════════════════════════════════════ */

/* Duración del código de verificación (5 minutos). */
define('CODIGO_VALIDEZ_MIN', 5);

/* Cantidad máxima de intentos de ingreso del código por desafío. */
define('CODIGO_INTENTOS_MAX', 5);

/* Espera mínima entre reenvíos del mismo desafío (60 segundos). */
define('CODIGO_REENVIO_ESPERA_SEG', 60);

/* Máximo de reenvíos por desafío. */
define('CODIGO_REENVIO_MAX', 5);

/* Límite global de desafíos creados por usuario e por IP en la hora. */
define('CODIGO_DESAFIOS_USUARIO_HORA', 10);
define('CODIGO_DESAFIOS_IP_HORA', 20);

/* Límite de intentos de login fallidos por IP en 15 minutos (fuerza bruta). */
define('LOGIN_FALLAS_IP_MAX', 10);
define('LOGIN_FALLAS_IP_VENTANA_MIN', 15);

/*
 * Clave secreta para el HMAC de los códigos de verificación.
 * Se configura por variable de entorno SENDEROS_HMAC_SECRET.
 * Si no está definida se usa (únicamente en entornos locales sin .env)
 * una clave derivada de las credenciales de la base de datos: NUNCA
 * exponer esa clave ni usarla en producción.
 */
define('HMAC_SECRET', senderosEnv('SENDEROS_HMAC_SECRET'));

/*
 * Servidor de correo saliente (SMTP autenticado, p. ej. Gmail con
 * contraseña de aplicación). Configurar en .env — ver .env.example.
 */
define('SMTP_HOST', senderosEnv('SENDEROS_SMTP_HOST'));
define('SMTP_PORT', (int)senderosEnv('SENDEROS_SMTP_PORT', '587'));
define('SMTP_USER', senderosEnv('SENDEROS_SMTP_USER'));
define('SMTP_PASS', senderosEnv('SENDEROS_SMTP_PASS'));
define('SMTP_FROM', senderosEnv('SENDEROS_SMTP_FROM'));
define('SMTP_FROM_NAME', senderosEnv('SENDEROS_SMTP_FROM_NAME', 'Senderos Spa'));
define('SMTP_ENCRIPTACION', strtolower(senderosEnv('SENDEROS_SMTP_ENCRIPTACION', 'tls')));

/* true solo cuando toda la configuración SMTP está presente. */
define(
    'SMTP_CONFIGURADO',
    SMTP_HOST !== '' &&
    SMTP_USER !== '' &&
    SMTP_PASS !== '' &&
    SMTP_FROM !== ''
);

/* El carrito vive en la sesión del servidor: si el recolector la limpia antes,
   el carrito desaparece. Por eso el gc dura lo mismo que la sesión. */
ini_set('session.gc_maxlifetime', (string)(SESION_DIAS * 86400));

/* Costo de envío a domicilio. CONFIRMAR con Claudia: valor provisorio. */
define('COSTO_ENVIO', 2000);

define('HORARIO_VENTANAS', [
    ['08:00', '12:30'],
    ['16:00', '20:00']
]);

define('DIAS_CERRADOS', [0]);

/*
 * Feriados nacionales inamovibles (formato Y-m-d).
 * CONFIRMAR con Claudia: puentes turísticos, feriados trasladables
 * (Carnaval, Semana Santa, Güemes, San Martín, etc.) y días locales
 * de Río Tercero, que cambian cada año.
 */
define('FERIADOS', [
    '2026-01-01',
    '2026-03-24',
    '2026-04-02',
    '2026-05-01',
    '2026-05-25',
    '2026-06-20',
    '2026-07-09',
    '2026-12-08',
    '2026-12-25',
    '2027-01-01',
    '2027-03-24',
    '2027-04-02',
    '2027-05-01',
    '2027-05-25',
    '2027-06-20',
    '2027-07-09',
    '2027-12-08',
    '2027-12-25'
]);

define('PASO_TURNO_MIN', 30);

function jsonResponse(array $d, int $code = 200): void
{
    http_response_code($code);

    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $d,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}

function iniciarSesion(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $lifetime = SESION_DIAS * 86400;

    /*
     * Cookie endurecida: HttpOnly (JavaScript no la lee), SameSite=Lax
     * (bloquea envíos cross-site en POST) y Secure cuando el sitio se
     * sirve por HTTPS (en producción). En XAMPP local por http no se
     * marca Secure para no romper el desarrollo.
     */
    $esHttps = (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
        (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
    );

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path' => '/',
        'httponly' => true,
        'secure' => $esHttps,
        'samesite' => 'Lax'
    ]);

    session_start();
}

/**
 * Lee el cuerpo JSON de la petición y lo devuelve como array.
 * Si el cuerpo está vacío o no es un JSON válido devuelve [].
 */
function getJsonInput(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}

function getDB(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn =
        'mysql:host=' . DB_HOST .
        ';port=' . DB_PORT .
        ';dbname=' . DB_NAME .
        ';charset=utf8mb4';

    try {
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );

        /*
         * Se alinea la zona horaria de MySQL con la de PHP.
         * Los vencimientos se calculan con NOW() en la BD y se comparan
         * con strtotime() en PHP: si ambas zonas difieren, un código
         * recién creado podría leerse como ya vencido.
         */
        $offsetSeg = (int)date('Z');
        $signa = $offsetSeg < 0 ? '-' : '+';
        $absoluto = abs($offsetSeg);
        $pdo->exec(sprintf(
            "SET time_zone = '%s%02d:%02d'",
            $signa,
            intdiv($absoluto, 3600),
            intdiv($absoluto % 3600, 60)
        ));

        return $pdo;
    } catch (PDOException $e) {
        error_log('Error de conexión a la base de datos: ' . $e->getMessage());

        jsonResponse([
            'ok' => false,
            'error' => 'No se pudo conectar con la base de datos'
        ], 500);
    }
}

/* ═══════════════════════════════════════════════════════════
   Disponibilidad de turnos (uso compartido: turnos.php y checkout.php)
   ═══════════════════════════════════════════════════════════ */

function senderosHoraAMinutos(string $hora): ?int
{
    if (!preg_match('/^(\d{2}):(\d{2})(?::(\d{2}))?$/', trim($hora), $m)) {
        return null;
    }

    $h = (int)$m[1];
    $min = (int)$m[2];

    if ($h < 0 || $h > 23 || $min < 0 || $min > 59) {
        return null;
    }

    return $h * 60 + $min;
}

function senderosMinutosAHora(int $minutos): string
{
    $h = intdiv($minutos, 60);
    $m = $minutos % 60;

    return sprintf('%02d:%02d', $h, $m);
}

function senderosEsDiaCerrado(string $fecha): bool
{
    $ts = strtotime($fecha . ' 12:00:00');

    if ($ts === false) {
        return true;
    }

    $diaSemana = (int)date('w', $ts);

    if (in_array($diaSemana, DIAS_CERRADOS, true)) {
        return true;
    }

    if (in_array($fecha, FERIADOS, true)) {
        return true;
    }

    return false;
}

/**
 * Ocupados: lista de ['inicio' => minutos, 'fin' => minutos].
 * Devuelve lista de horarios "HH:MM" disponibles para esa duración.
 */
function senderosSlotsDisponibles(string $fecha, int $duracion, array $ocupados): array
{
    $duracion = max(1, $duracion);
    $paso = max(5, PASO_TURNO_MIN);
    $disponibles = [];

    if (senderosEsDiaCerrado($fecha)) {
        return [];
    }

    foreach (HORARIO_VENTANAS as $ventana) {
        $inicioV = senderosHoraAMinutos((string)($ventana[0] ?? ''));
        $finV = senderosHoraAMinutos((string)($ventana[1] ?? ''));

        if ($inicioV === null || $finV === null) {
            continue;
        }

        for ($ini = $inicioV; ($ini + $duracion) <= $finV; $ini += $paso) {
            $fin = $ini + $duracion;
            $choca = false;

            foreach ($ocupados as $oc) {
                $oi = (int)($oc['inicio'] ?? 0);
                $of = (int)($oc['fin'] ?? 0);

                if ($ini < $of && $fin > $oi) {
                    $choca = true;
                    break;
                }
            }

            if (!$choca) {
                $disponibles[] = senderosMinutosAHora($ini);
            }
        }
    }

    return array_values(array_unique($disponibles));
}

function senderosSlotValido(string $fecha, string $hora, int $duracion, array $ocupados): array
{
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        return [false, 'La fecha del turno no es válida.'];
    }

    $minHora = senderosHoraAMinutos($hora);

    if ($minHora === null) {
        return [false, 'La hora del turno no es válida.'];
    }

    if ($duracion <= 0) {
        return [false, 'La duración del turno no es válida.'];
    }

    if (senderosEsDiaCerrado($fecha)) {
        return [false, 'Ese día el local está cerrado. Elegí otra fecha.'];
    }

    if (($minHora % PASO_TURNO_MIN) !== 0) {
        return [false, 'Elegí un horario válido dentro de la grilla de turnos.'];
    }

    $finHora = $minHora + $duracion;
    $dentroVentana = false;

    foreach (HORARIO_VENTANAS as $ventana) {
        $inicioV = senderosHoraAMinutos((string)($ventana[0] ?? ''));
        $finV = senderosHoraAMinutos((string)($ventana[1] ?? ''));

        if ($inicioV === null || $finV === null) {
            continue;
        }

        if ($minHora >= $inicioV && $finHora <= $finV) {
            $dentroVentana = true;
            break;
        }
    }

    if (!$dentroVentana) {
        return [false, 'Ese horario está fuera del horario de atención.'];
    }

    foreach ($ocupados as $oc) {
        $oi = (int)($oc['inicio'] ?? 0);
        $of = (int)($oc['fin'] ?? 0);

        if ($minHora < $of && $finHora > $oi) {
            return [false, 'Ese horario acaba de ser ocupado. Elegí otro.'];
        }
    }

    return [true, ''];
}

/* ═══════════════════════════════════════════
   Utilidades de seguridad compartidas
   ═══════════════════════════════════════════ */

/**
 * Clave usada para el HMAC de los códigos de verificación.
 * Prioriza SENDEROS_HMAC_SECRET del .env. En entornos locales sin .env
 * deriva una clave estable de las credenciales de la base: funciona para
 * desarrollo, pero en producción DEBE configurarse la variable de entorno.
 */
function hmacClave(): string
{
    if (HMAC_SECRET !== '') {
        return HMAC_SECRET;
    }

    return hash_hmac('sha256', 'senderos|' . DB_NAME . '|' . DB_USER, 'senderos-dev-sin-env');
}

/**
 * Devuelve un email parcialmente oculto para mostrarlo en la UI sin
 * exponer la dirección completa: ju***@gm***.com
 */
function enmascararEmail(string $email): string
{
    $partes = explode('@', $email);

    if (count($partes) !== 2) {
        return '***';
    }

    [$local, $dominio] = $partes;

    $cortar = function (string $texto, int $visibles): string {
        if (mb_strlen($texto) <= $visibles) {
            return $texto;
        }

        return mb_substr($texto, 0, $visibles) . '***';
    };

    $punto = strrpos($dominio, '.');

    if ($punto === false) {
        $dominioCorto = $cortar($dominio, 2);
    } else {
        $tld = substr($dominio, $punto);
        $base = substr($dominio, 0, $punto);
        $dominioCorto = $cortar($base, 2) . $tld;
    }

    return $cortar($local, 1) . '@' . $dominioCorto;
}

/**
 * IP real del cliente considerando proxies solo si están configurados.
 * Se usa para limitar abusos (verificaciones y logins fallidos).
 */
function ipCliente(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    return substr((string)$ip, 0, 45);
}

iniciarSesion();

require_once __DIR__ . '/verificacion_lib.php';
require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/auth.php';
