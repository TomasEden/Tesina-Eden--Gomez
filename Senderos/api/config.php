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

/* Duración de la sesión PHP en días. CONFIRMAR con Claudia si quiere otro valor. */
define('SESION_DIAS', 30);

/* El carrito vive en la sesión del servidor: si el recolector la limpia antes,
   el carrito desaparece. Por eso el gc dura lo mismo que la sesión. */
ini_set('session.gc_maxlifetime', (string)(SESION_DIAS * 86400));

/* Costo de envío a domicilio. CONFIRMAR con Claudia: valor provisorio. */
define('COSTO_ENVIO', 800); // CONFIRMAR con Claudia

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

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path' => '/',
        'httponly' => true,
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

iniciarSesion();

require_once __DIR__ . '/auth.php';
