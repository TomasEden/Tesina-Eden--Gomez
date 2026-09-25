<?php

declare(strict_types=1);

/*
 * Senderos — auditoría estática del proyecto (Fases A y G).
 *
 * Uso (desde la raíz del proyecto o desde cualquier carpeta):
 *   php tools/auditar.php        → corre todas las reglas
 *   php tools/auditar.php B      → solo las reglas de la Fase B
 *
 * Código de salida: 0 = sin errores, 1 = hay errores.
 * No toca la base de datos ni la red: solo lee archivos.
 */

$raiz = dirname(__DIR__);

$fase = isset($argv[1]) ? strtoupper(trim((string)$argv[1])) : 'TODAS';
if ($fase === '' || $fase === 'TODASAS') {
    $fase = 'TODAS';
}

$errores = [];
$avisos = [];
$refsOk = 0;

/* Una regla se aplica en TODAS, en G (verificación final) o en su fase. */
function aplicaFase(string $fase, string ...$fases): bool
{
    if ($fase === 'TODAS' || $fase === 'G') {
        return true;
    }

    return in_array($fase, $fases, true);
}

function relRaiz(string $raiz, string $archivo): string
{
    return str_replace('\\', '/', substr($archivo, strlen($raiz) + 1));
}

function lineaDe(string $texto, int $offset): int
{
    return substr_count(substr($texto, 0, $offset), "\n") + 1;
}

function anotar(array &$destino, string $raiz, string $archivo, int $linea, string $codigo, string $mensaje): void
{
    $destino[] = sprintf('%s:%d  [%s]  %s', relRaiz($raiz, $archivo), $linea, $codigo, $mensaje);
}

/* Normaliza rutas con ./ y ../ sin salirse del esquema del sistema. */
function normalizarRuta(string $ruta): string
{
    $ruta = str_replace('\\', '/', $ruta);
    $prefijo = '';

    if (preg_match('#^([A-Za-z]:/)#', $ruta, $m)) {
        $prefijo = $m[1];
        $ruta = substr($ruta, strlen($m[1]));
    } elseif ($ruta !== '' && $ruta[0] === '/') {
        $prefijo = '/';
        $ruta = ltrim($ruta, '/');
    }

    $partes = [];

    foreach (explode('/', $ruta) as $p) {
        if ($p === '' || $p === '.') {
            continue;
        }
        if ($p === '..') {
            array_pop($partes);
            continue;
        }
        $partes[] = $p;
    }

    return $prefijo . implode('/', $partes);
}

/*
 * Parser mínimo de CSS: devuelve reglas (selector + cuerpo) y bloques
 * condicionales (@media / @supports). Los bloques @keyframes se omiten
 * (lo que hay adentro no aplica a elementos estáticos).
 */
function reglasCss(string $css): array
{
    $n = strlen($css);
    $i = 0;
    $linea = 1;
    $pila = [];
    $reglas = [];
    $bloques = [];
    $pend = '';
    $pendLinea = 1;

    while ($i < $n) {
        $ch = $css[$i];

        if ($ch === '{') {
            $sel = trim($pend);
            $tipo = 'regla';

            if (preg_match('/^@(?:-\w+-)?keyframes\b/', $sel)) {
                $tipo = 'keyframes';
            } elseif (preg_match('/^@(?:media|supports|container|layer|scope)\b/', $sel)) {
                $tipo = 'bloque';
            }

            $pila[] = [
                'tipo' => $tipo,
                'sel' => $sel,
                'linea' => $pendLinea,
                'inicio' => $i + 1
            ];

            $pend = '';
            $pendLinea = $linea;
            $i++;
            continue;
        }

        if ($ch === '}') {
            $bloque = array_pop($pila);

            if ($bloque !== null) {
                $padre = $pila ? $pila[count($pila) - 1] : null;
                $fin = $i;

                if ($bloque['tipo'] === 'regla') {
                    $dentroKeyframes = $padre !== null && $padre['tipo'] === 'keyframes';

                    if (!$dentroKeyframes) {
                        $reglas[] = [
                            'sel' => $bloque['sel'],
                            'linea' => $bloque['linea'],
                            'inicio' => $bloque['inicio'],
                            'fin' => $fin
                        ];
                    }
                } else {
                    $bloques[] = [
                        'sel' => $bloque['sel'],
                        'linea' => $bloque['linea'],
                        'inicio' => $bloque['inicio'],
                        'fin' => $fin
                    ];
                }
            }

            $pend = '';
            $pendLinea = $linea;
            $i++;
            continue;
        }

        if ($ch === "\n") {
            $linea++;
        }

        /* @import y otras sentencias sin bloque no ensucian el selector siguiente. */
        if ($ch === ';' && $pila === []) {
            $pend = '';
            $i++;
            continue;
        }

        $top = $pila ? $pila[count($pila) - 1] : null;

        if ($top === null || $top['tipo'] !== 'regla') {
            if ($pend === '' && !ctype_space($ch)) {
                $pendLinea = $linea;
            }

            if ($pend !== '' || !ctype_space($ch)) {
                $pend .= $ch;
            }
        }

        $i++;
    }

    return ['reglas' => $reglas, 'bloques' => $bloques];
}

function limpiarComentariosCss(string $css): string
{
    return (string)preg_replace_callback(
        '/\/\*.*?\*\//s',
        static function ($m) {
            return preg_replace('/[^\n]/', ' ', $m[0]);
        },
        $css
    );
}

$globHtml = glob($raiz . '/html/*.html') ?: [];
$globCss = glob($raiz . '/css/*.css') ?: [];
$globJs = glob($raiz . '/js/*.js') ?: [];
$globApi = glob($raiz . '/api/*.php') ?: [];

$esquemaIgnorado = '/^(https?:)?\/\/|^mailto:|^tel:|^javascript:|^data:|^#|^about:/i';

/* ═══════════════════════════════════════════════════════════
   R1 · REF-ROTA — archivos referenciados que no existen
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'A', 'B', 'F')) {
    foreach ($globHtml as $archivo) {
        $texto = (string)file_get_contents($archivo);

        if (!preg_match_all('/\b(?:src|href)\s*=\s*["\']([^"\']+)["\']/', $texto, $m, PREG_OFFSET_CAPTURE)) {
            continue;
        }

        foreach ($m[1] as $par) {
            $ref = trim($par[0]);

            if ($ref === '' || preg_match($esquemaIgnorado, $ref) || strpos($ref, '${') !== false) {
                continue;
            }

            $ref = (string)preg_split('/[?#]/', $ref)[0];

            if ($ref === '') {
                continue;
            }

            $refsOk++;

            if (!file_exists(normalizarRuta(dirname($archivo) . '/' . $ref))) {
                anotar($errores, $raiz, $archivo, lineaDe($texto, $par[1]), 'REF-ROTA', "no existe: {$ref}");
            }
        }
    }

    foreach ($globCss as $archivo) {
        $texto = (string)file_get_contents($archivo);

        if (!preg_match_all('/url\(\s*["\']?([^"\')]+)["\']?\s*\)/', $texto, $m, PREG_OFFSET_CAPTURE)) {
            continue;
        }

        foreach ($m[1] as $par) {
            $ref = trim($par[0]);

            if ($ref === '' || preg_match($esquemaIgnorado, $ref)) {
                continue;
            }

            $refsOk++;

            if (!file_exists(normalizarRuta(dirname($archivo) . '/' . $ref))) {
                anotar($errores, $raiz, $archivo, lineaDe($texto, $par[1]), 'REF-ROTA', "no existe: {$ref}");
            }
        }
    }

    foreach ($globJs as $archivo) {
        $texto = (string)file_get_contents($archivo);

        /* Rutas ../img|css|js|api escritas en JS: son relativas al documento (html/). */
        if (preg_match_all('/[\'"]((?:\.\.\/)+(?:img|css|js|api)\/[^\'"]+)[\'"]/', $texto, $m, PREG_OFFSET_CAPTURE)) {
            foreach ($m[1] as $par) {
                $ref = $par[0];

                if (strpos($ref, '${') !== false || strpos($ref, '+') !== false) {
                    continue;
                }

                $ref = (string)preg_split('/[?#]/', $ref)[0];
                $refsOk++;

                if (!file_exists(normalizarRuta($raiz . '/html/' . $ref))) {
                    anotar($errores, $raiz, $archivo, lineaDe($texto, $par[1]), 'REF-ROTA', "no existe: {$ref}");
                }
            }
        }

        /* Páginas sueltas ('index.html', '../html/x.html'): relativas a html/. */
        if (preg_match_all('/[\'"]([A-Za-z0-9_\-\/]+\.html)(?:[?#][^\'"]*)?[\'"]/', $texto, $m, PREG_OFFSET_CAPTURE)) {
            foreach ($m[1] as $par) {
                $ref = $par[0];
                $refsOk++;

                if (!file_exists(normalizarRuta($raiz . '/html/' . $ref))) {
                    anotar($errores, $raiz, $archivo, lineaDe($texto, $par[1]), 'REF-ROTA', "no existe: {$ref}");
                }
            }
        }
    }

    foreach ($globApi as $archivo) {
        $texto = (string)file_get_contents($archivo);

        if (!preg_match_all('/__DIR__\s*\.\s*[\'"]\/([^\'"]+)[\'"]/', $texto, $m, PREG_OFFSET_CAPTURE)) {
            continue;
        }

        foreach ($m[1] as $par) {
            $refsOk++;

            if (!file_exists(normalizarRuta(dirname($archivo) . '/' . $par[0]))) {
                anotar($errores, $raiz, $archivo, lineaDe($texto, $par[1]), 'REF-ROTA', "no existe: {$par[0]}");
            }
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R2 · ALERTA-NATIVA — alert() / confirm() / prompt() prohibidos
   ═══════════════════════════════════════════════════════════ */
foreach (array_merge($globJs, $globHtml) as $archivo) {
    $texto = (string)file_get_contents($archivo);

    if (preg_match_all('/(?<![\w.$>])(?:alert|confirm|prompt)\s*\(/', $texto, $m, PREG_OFFSET_CAPTURE)) {
        foreach ($m[0] as $par) {
            anotar($errores, $raiz, $archivo, lineaDe($texto, $par[1]), 'ALERTA-NATIVA', 'usá modales y toasts del sitio');
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R3 · ALIAS-FUERA-DE-CONFIG — dato ficticio fuera de su único lugar
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'F')) {
    $unicoLugar = normalizarRuta($raiz . '/js/config-pagos.js');

    if (!file_exists($unicoLugar)) {
        anotar($errores, $raiz, $unicoLugar, 1, 'ALIAS-FUERA-DE-CONFIG', 'falta el archivo único con la configuración de pago');
    }

    foreach (array_merge($globHtml, $globJs, $globCss, $globApi) as $archivo) {
        if (normalizarRuta($archivo) === $unicoLugar) {
            continue;
        }

        $texto = (string)file_get_contents($archivo);

        if (preg_match_all('/tomy2009/i', $texto, $m, PREG_OFFSET_CAPTURE)) {
            foreach ($m[0] as $par) {
                anotar($errores, $raiz, $archivo, lineaDe($texto, $par[1]), 'ALIAS-FUERA-DE-CONFIG', 'el alias ficticio solo vive en js/config-pagos.js');
            }
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R4 · MODAL-LEGADO — selectores .show/.active que la UI admin no usa
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'C')) {
    foreach (glob($raiz . '/js/admin-*.js') ?: [] as $archivo) {
        $texto = (string)file_get_contents($archivo);

        if (preg_match_all('/\.modal-overlay\.(?:show|active)/', $texto, $m, PREG_OFFSET_CAPTURE)) {
            foreach ($m[0] as $par) {
                anotar($errores, $raiz, $archivo, lineaDe($texto, $par[1]), 'MODAL-LEGADO', 'la UI admin abre/cierra modales con la clase .hidden');
            }
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R5 · MODALES-ADMIN — clases de modal usadas en HTML sin estilo en admin.css
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'C')) {
    $adminCss = (string)file_get_contents($raiz . '/css/admin.css');

    foreach (['modal-box', 'modal-card', 'modal-header', 'modal-body'] as $clase) {
        $tieneEstilo = (bool)preg_match('/\.' . preg_quote($clase, '/') . '\s*[,{]/', $adminCss);

        if ($tieneEstilo) {
            continue;
        }

        foreach (glob($raiz . '/html/admin-*.html') ?: [] as $archivo) {
            $texto = (string)file_get_contents($archivo);
            $pos = strpos($texto, $clase);

            if ($pos !== false) {
                anotar($errores, $raiz, $archivo, lineaDe($texto, $pos), 'MODALES-ADMIN', "usa .{$clase} pero css/admin.css no lo define");
            }
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R6 · IMG-SIN-SVG — filtros sobre <img> que iconos-adaptativos deja en <svg>
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'A')) {
    foreach ($globCss as $archivo) {
        $texto = limpiarComentariosCss((string)file_get_contents($archivo));
        $parsed = reglasCss($texto);

        foreach ($parsed['reglas'] as $r) {
            $cuerpo = substr($texto, $r['inicio'], $r['fin'] - $r['inicio']);

            if (!preg_match('/(?<![-\w])filter\s*:/', $cuerpo)) {
                continue;
            }

            if (strpos($r['sel'], 'img') !== false && strpos($r['sel'], 'svg') === false) {
                anotar($errores, $raiz, $archivo, $r['linea'], 'IMG-SIN-SVG', 'el selector cubre img pero no svg (iconos-adaptativos.js reemplaza <img> por <svg>)');
            }
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R7 · REDUCE-INCOMPLETO — opacity:0 + animation anulada sin compensar
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'B')) {
    foreach ($globCss as $archivo) {
        $texto = limpiarComentariosCss((string)file_get_contents($archivo));
        $parsed = reglasCss($texto);

        $invisibles = [];

        foreach ($parsed['reglas'] as $r) {
            $cuerpo = substr($texto, $r['inicio'], $r['fin'] - $r['inicio']);

            if (!preg_match('/opacity\s*:\s*0(?![.\d])/', $cuerpo)) {
                continue;
            }

            if (!preg_match('/\banimation(?:-name)?\s*:/i', $cuerpo)) {
                continue;
            }

            foreach (explode(',', $r['sel']) as $s) {
                $s = trim($s);

                if ($s !== '') {
                    $invisibles[$s] = $r['linea'];
                }
            }
        }

        if (!$invisibles) {
            continue;
        }

        foreach ($parsed['bloques'] as $b) {
            if (stripos($b['sel'], 'prefers-reduced-motion') === false) {
                continue;
            }

            $cuerpo = substr($texto, $b['inicio'], $b['fin'] - $b['inicio']);

            if (!preg_match('/animation(?:-name)?\s*:\s*none/i', $cuerpo)) {
                continue;
            }

            if (preg_match('/opacity\s*:/', $cuerpo)) {
                continue;
            }

            $afectados = [];

            foreach (array_keys($invisibles) as $sel) {
                $raizSel = (string)preg_split('/[\s>:]+/', $sel)[0];

                if ($raizSel !== '' && strpos($cuerpo, $raizSel) !== false) {
                    $afectados[] = $sel;
                }
            }

            if ($afectados) {
                anotar(
                    $errores,
                    $raiz,
                    $archivo,
                    $b['linea'],
                    'REDUCE-INCOMPLETO',
                    'animation: none deja invisibles: ' . implode(', ', array_slice($afectados, 0, 6))
                        . (count($afectados) > 6 ? '…' : '') . ' (agregá opacity: 1; transform: none)'
                );
            }
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R8 · OSC-OPACITY — opacity: 0 en selectores html.dark sin compensación
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'B', 'C')) {
    foreach ($globCss as $archivo) {
        $texto = limpiarComentariosCss((string)file_get_contents($archivo));
        $parsed = reglasCss($texto);

        foreach ($parsed['reglas'] as $r) {
            if (strpos($r['sel'], 'html.dark') === false) {
                continue;
            }

            $cuerpo = substr($texto, $r['inicio'], $r['fin'] - $r['inicio']);

            if (preg_match('/opacity\s*:\s*0(?![.\d])/', $cuerpo) && !preg_match('/opacity\s*:\s*1/', $cuerpo)) {
                anotar($errores, $raiz, $archivo, $r['linea'], 'OSC-OPACITY', 'regla html.dark con opacity: 0 sin compensación');
            }
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R9 · OFERTAS-LIMPIAR — limpiarForm() debe reiniciar selección y filtro
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'D')) {
    $archivo = $raiz . '/js/admin-ofertas.js';
    $texto = (string)file_get_contents($archivo);
    $pos = strpos($texto, 'function limpiarForm');

    if ($pos === false) {
        anotar($errores, $raiz, $archivo, 1, 'OFERTAS-LIMPIAR', 'no se encontró limpiarForm()');
    } else {
        $fin = strpos($texto, "\nfunction ", $pos);
        $cuerpo = substr($texto, $pos, $fin === false ? 4000 : $fin - $pos);

        foreach (['seleccionadosEspecificos', 'filtroEspecifico'] as $clave) {
            if (strpos($cuerpo, $clave) === false) {
                anotar($errores, $raiz, $archivo, lineaDe($texto, $pos), 'OFERTAS-LIMPIAR', "limpiarForm() no reinicia {$clave}");
            }
        }

        if (!preg_match('/buscarEspecifico/', $cuerpo)) {
            anotar($errores, $raiz, $archivo, lineaDe($texto, $pos), 'OFERTAS-LIMPIAR', 'limpiarForm() no limpia el buscador de específicos');
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   R10 · LOGIN-CARRITO / LOGOUT-CARRITO — el carrito vive en la sesión
   ═══════════════════════════════════════════════════════════ */
if (aplicaFase($fase, 'E')) {
    $logout = $raiz . '/api/logout.php';
    $texto = (string)file_get_contents($logout);
    $lineasPhp = preg_split('/\R/', $texto) ?: [];

    if (preg_match('/session_destroy\s*\(/', $texto, $m, PREG_OFFSET_CAPTURE)) {
        $nroLinea = lineaDe($texto, $m[0][1]);
        $contenido = trim($lineasPhp[$nroLinea - 1] ?? '');

        /* Solo cuenta código real: un comentario que lo mencione no es error. */
        if (!preg_match('/^(?:\/\*|\*|\/\/|#)/', $contenido)) {
            anotar($errores, $raiz, $logout, $nroLinea, 'LOGOUT-CARRITO', 'session_destroy() borra $_SESSION["carrito"]: usá resguardar + session_regenerate_id()');
        }
    }

    if (!preg_match('/\$_SESSION\[.carrito.\]|fusionarCarritos/', $texto)) {
        anotar($errores, $raiz, $logout, 1, 'LOGOUT-CARRITO', 'logout no conserva el carrito de la sesión');
    }

    $login = $raiz . '/api/login.php';
    $textoLogin = (string)file_get_contents($login);

    if (!preg_match('/\$_SESSION\[.carrito.\]|fusionarCarritos/', $textoLogin)) {
        anotar($errores, $raiz, $login, 1, 'LOGIN-CARRITO', 'login no resguarda/fusiona el carrito del invitado');
    }
}

/* ═══════════════════════════════════════════════════════════
   R11 · INNERHTML-SIN-ESCAPE (aviso) — concat con innerHTML y sin escapeHTML
   ═══════════════════════════════════════════════════════════ */
foreach ($globJs as $archivo) {
    $texto = (string)file_get_contents($archivo);

    if (strpos($texto, 'escapeHTML') !== false || strpos($texto, 'escapeHtml') !== false) {
        continue;
    }

    $lineas = preg_split('/\R/', $texto) ?: [];

    foreach ($lineas as $n => $linea) {
        if (strpos($linea, 'innerHTML') !== false && strpos($linea, '+') !== false) {
            anotar($avisos, $raiz, $archivo, $n + 1, 'INNERHTML-SIN-ESCAPE', 'revisá que el dato pase por escapeHTML() antes de entrar a innerHTML');
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   SALIDA
   ═══════════════════════════════════════════════════════════ */

$tituloFase = $fase === 'TODAS' ? 'todas las reglas' : 'reglas de la Fase ' . $fase;

/* Deduplica hallazgos repetidos (mismo archivo, línea, código y mensaje). */
$unicos = [];

foreach ([$errores, $avisos] as $i => $lista) {
    $vistos = [];

    foreach ($lista as $item) {
        if (isset($vistos[$item])) {
            continue;
        }

        $vistos[$item] = true;
        $unicos[$i][] = $item;
    }
}

$errores = $unicos[0] ?? [];
$avisos = $unicos[1] ?? [];

echo "Senderos — auditoría estática ({$tituloFase})\n";
echo "Raíz: " . str_replace('\\', '/', $raiz) . "\n";
echo str_repeat('-', 72) . "\n";

if ($errores) {
    echo "ERRORES (" . count($errores) . ")\n";

    foreach ($errores as $e) {
        echo "  " . $e . "\n";
    }
} else {
    echo "ERRORES (0)\n";
}

if ($avisos) {
    echo "AVISOS (" . count($avisos) . ")\n";

    foreach ($avisos as $a) {
        echo "  " . $a . "\n";
    }
}

echo str_repeat('-', 72) . "\n";
echo 'Archivos: ' . count($globHtml) . ' HTML · ' . count($globCss) . ' CSS · '
    . count($globJs) . ' JS · ' . count($globApi) . " API\n";
echo 'Referencias locales verificadas: ' . $refsOk . "\n";
echo 'Errores: ' . count($errores) . ' · Avisos: ' . count($avisos) . "\n";
echo 'Resultado: ' . ($errores ? 'FALLA' : 'OK') . "\n";

exit($errores ? 1 : 0);
