<?php

declare(strict_types=1);

/*
 * Senderos — exporta la base completa (estructura + datos) a un archivo .sql.
 *
 * Qué conserva:
 *   • las 8 tablas con su estructura exacta (SHOW CREATE TABLE: claves
 *     primarias, FOREIGN KEY y AUTO_INCREMENT) y TODOS los registros;
 *   • el usuario administrador con su email, su password_hash bcrypt y el
 *     rol 'admin'. La contraseña se guarda como hash (password_hash/bcrypt,
 *     $2y$…) y no en claro: por eso, al restaurar este archivo, el mismo
 *     email y la misma contraseña siguen entrando al panel.
 *
 * Uso (desde la carpeta Senderos/):
 *   php tools/exportar_db.php
 *   php tools/exportar_db.php db/mi_copia.sql
 *
 * Si no pasás una ruta, escribe en:
 *   db/exportaciones/senderos_db_AAA-mm-dd_HH-ii-ss.sql
 *
 * Solo corre por línea de comandos: desde el navegador responde 404.
 * No escribe en la base: es lectura pura (no toca la base).
 *
 * Para restaurar en otra máquina / después de un desastre:
 *   mysql -h 127.0.0.1 -P 3307 -uroot senderos_db < el_archivo.sql
 *
 * Equivalente en una línea (si preferís mysqldump):
 *   mysqldump -h 127.0.0.1 -P 3307 -uroot --single-transaction --routines \
 *             --triggers --default-character-set=utf8mb4 senderos_db > dump.sql
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/config.php';

/* Columnas binarias: se vuelcan como X'hex' para que no se corrompan. */
const TIPOS_BINARIOS = [
    'blob', 'tinyblob', 'mediumblob', 'longblob', 'binary', 'varbinary'
];

/**
 * Devuelve un valor en formato SQL para el INSERT.
 */
function exportarValor(mixed $valor, string $tipo, PDO $db): string
{
    if ($valor === null) {
        return 'NULL';
    }

    if (is_bool($valor)) {
        return $valor ? '1' : '0';
    }

    if (is_int($valor) || is_float($valor)) {
        return (string) $valor;
    }

    $texto = (string) $valor;

    if (in_array($tipo, TIPOS_BINARIOS, true)) {
        return "X'" . bin2hex($texto) . "'";
    }

    return (string) $db->quote($texto);
}

/* ─── Destino del archivo ─────────────────────────────────────────────── */

$salida = trim((string) ($argv[1] ?? ''));

if ($salida === '') {
    $carpeta = __DIR__ . '/../db/exportaciones';

    if (!is_dir($carpeta) && !mkdir($carpeta, 0775, true) && !is_dir($carpeta)) {
        fwrite(STDERR, "No pude crear la carpeta de salida: {$carpeta}\n");
        exit(1);
    }

    $salida = $carpeta . '/senderos_db_' . date('Y-m-d_H-i-s') . '.sql';
}

/* ─── Conexión ────────────────────────────────────────────────────────── */
/*
 * No usamos getDB(): en un error de conexión responde JSON y hace exit(0),
 * y acá necesitamos un error por STDERR con código de salida 1.
 */

try {
    $dsn =
        'mysql:host=' . DB_HOST .
        ';port=' . DB_PORT .
        ';dbname=' . DB_NAME .
        ';charset=utf8mb4';

    $db = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    fwrite(STDERR, 'No pude conectar con la base: ' . $e->getMessage() . "\n");
    exit(1);
}

try {
    $version = (string) $db->query('SELECT VERSION()')->fetchColumn();

    /* Tablas de la base (solo tablas, ni vistas). */
    $stmt = $db->prepare(
        "SELECT TABLE_NAME
           FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
          ORDER BY TABLE_NAME"
    );
    $stmt->execute([DB_NAME]);
    $tablas = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!$tablas) {
        fwrite(STDERR, 'La base no tiene tablas.\n');
        exit(1);
    }

    /* Tipos de columna por tabla (para el volcado binario). */
    $tipos = [];

    $stmt = $db->prepare(
        'SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
           FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = ?'
    );
    $stmt->execute([DB_NAME]);

    foreach ($stmt->fetchAll() as $col) {
        $tipos[(string) $col['TABLE_NAME']][(string) $col['COLUMN_NAME']] =
            strtolower((string) $col['DATA_TYPE']);
    }

    /* ─── Cabecera ────────────────────────────────────────────────────── */

    $sql = "-- Senderos — exportación de la base `" . DB_NAME . "`\n"
        . '-- Generado: ' . date('Y-m-d H:i:s') . ' (America/Argentina/Cordoba)' . "\n"
        . '-- Servidor: ' . DB_HOST . ':' . DB_PORT . ' — ' . $version . "\n"
        . '-- Contiene estructura Y datos, incluida la fila del administrador' . "\n"
        . '-- (email + password_hash + rol), así se conserva la contraseña.' . "\n"
        . '-- Restaurar: mysql -h 127.0.0.1 -P 3307 -uroot ' . DB_NAME . ' < este_archivo.sql' . "\n\n"
        . "SET NAMES utf8mb4;\n"
        . "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n"
        . "SET FOREIGN_KEY_CHECKS = 0;\n"
        . "START TRANSACTION;\n\n";

    $totales = [];

    /* ─── Tablas: estructura + datos ──────────────────────────────────── */

    foreach ($tablas as $tabla) {
        $tabla = (string) $tabla;

        if (!preg_match('/^[A-Za-z0-9_]+$/', $tabla)) {
            continue;
        }

        $create = $db->query("SHOW CREATE TABLE `{$tabla}`")->fetch(PDO::FETCH_NUM);

        $sql .= "-- --------------------------------------------------------\n"
            . "-- Estructura de la tabla `{$tabla}`\n"
            . "-- --------------------------------------------------------\n"
            . "DROP TABLE IF EXISTS `{$tabla}`;\n"
            . (string) ($create[1] ?? '') . ";\n\n";

        $filas = $db->query("SELECT * FROM `{$tabla}`")->fetchAll();

        if (!$filas) {
            $sql .= "-- `{$tabla}`: sin datos.\n\n";
            $totales[$tabla] = 0;
            continue;
        }

        $columnas = array_keys($filas[0]);
        $columnasSql = '`' . implode('`, `', $columnas) . '`';
        $tiposTabla = $tipos[$tabla] ?? [];

        $sql .= "-- Datos de la tabla `{$tabla}`\n"
            . "-- --------------------------------------------------------\n";

        foreach (array_chunk($filas, 200) as $lote) {
            $valores = [];

            foreach ($lote as $fila) {
                $partes = [];

                foreach ($columnas as $columna) {
                    $partes[] = exportarValor(
                        $fila[$columna],
                        (string) ($tiposTabla[$columna] ?? ''),
                        $db
                    );
                }

                $valores[] = '(' . implode(', ', $partes) . ')';
            }

            $sql .= "INSERT INTO `{$tabla}` ({$columnasSql}) VALUES\n"
                . implode(",\n", $valores) . ";\n";
        }

        $sql .= "\n";
        $totales[$tabla] = count($filas);
    }

    $sql .= "SET FOREIGN_KEY_CHECKS = 1;\nCOMMIT;\n";

    /* ─── Escritura ───────────────────────────────────────────────────── */

    if (file_put_contents($salida, $sql) === false) {
        fwrite(STDERR, "No pude escribir el archivo: {$salida}\n");
        exit(1);
    }

    /* ─── Verificación ────────────────────────────────────────────────── */

    $errores = [];

    foreach ($totales as $tabla => $exportadas) {
        $vivas = (int) $db->query("SELECT COUNT(*) FROM `{$tabla}`")->fetchColumn();

        if ($vivas !== (int) $exportadas) {
            $errores[] = "`{$tabla}`: exporté {$exportadas} filas y la base tiene {$vivas}";
        }
    }

    /* El administrador es lo más importante: tiene que estar, con su hash. */
    $admins = $db->query(
        "SELECT id, email, rol, activo, password_hash
           FROM usuarios
          WHERE rol = 'admin'
          ORDER BY id"
    )->fetchAll();

    if (!$admins) {
        fwrite(STDERR, "ALERTA: no hay ningún usuario con rol 'admin' en la base.\n");
        exit(1);
    }

    $verificados = [];

    foreach ($admins as $admin) {
        $email = (string) $admin['email'];
        $hash = (string) $admin['password_hash'];

        $emailOk = str_contains($sql, "'" . $admin['email'] . "'");
        $hashOk = str_contains($sql, "'" . $hash . "'");

        if (!$emailOk || !$hashOk) {
            $errores[] = "el admin {$email} no quedó completo en el archivo";
            continue;
        }

        $verificados[] = sprintf(
            '#%d %s — rol %s, activo %d, hash bcrypt de %d caracteres (%s…)',
            (int) $admin['id'],
            $email,
            (string) $admin['rol'],
            (int) $admin['activo'],
            strlen($hash),
            substr($hash, 0, 7)
        );
    }

    if ($errores) {
        fwrite(STDERR, "La exportación tiene problemas:\n  - " . implode("\n  - ", $errores) . "\n");
        exit(1);
    }

    /* ─── Resumen ─────────────────────────────────────────────────────── */

    fwrite(STDOUT, "Exportación lista: {$salida}\n");
    fwrite(STDOUT, 'Tamaño: ' . number_format((float) filesize($salida), 0, ',', '.') . " bytes\n");
    fwrite(STDOUT, 'Tablas: ' . count($totales) . "\n");

    $filasTotal = 0;

    foreach ($totales as $tabla => $n) {
        $filasTotal += $n;
        fwrite(STDOUT, sprintf("  %-14s %4d filas\n", $tabla, $n));
    }

    fwrite(STDOUT, "Total: {$filasTotal} filas — todas verificadas contra la base viva.\n");
    fwrite(STDOUT, "Administrador incluido: " . implode(' | ', $verificados) . "\n");
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n");
    exit(1);
}
