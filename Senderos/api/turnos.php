<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store');

try {
    $db = getDB();
    $method = $_SERVER['REQUEST_METHOD'];

    /* ═══════════ GET ═══════════ */
    if ($method === 'GET') {

        /*
         * Disponibilidad pública: ?disponibilidad=1&fecha=Y-m-d&duracion=60
         * o ?disponibilidad=1&fecha=Y-m-d&servicio_id=NN.
         * No expone datos de otros clientes.
         */
        if (isset($_GET['disponibilidad'])) {
            $fecha = trim((string)($_GET['fecha'] ?? ''));

            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                jsonResponse(['ok' => false, 'error' => 'La fecha no es válida.'], 400);
            }

            $duracion = (int)($_GET['duracion'] ?? 30);

            if (isset($_GET['servicio_id']) && $duracion <= 0) {
                $st = $db->prepare('SELECT duracion FROM servicios WHERE id = ? LIMIT 1');
                $st->execute([(int)$_GET['servicio_id']]);
                $fila = $st->fetch();
                $duracion = $fila ? (int)$fila['duracion'] : 30;
            }

            if ($duracion <= 0) {
                $duracion = 30;
            }

            if (senderosEsDiaCerrado($fecha)) {
                jsonResponse([
                    'ok' => true,
                    'fecha' => $fecha,
                    'duracion' => $duracion,
                    'cerrado' => true,
                    'disponibles' => [],
                    'ventanas' => HORARIO_VENTANAS,
                    'pasoMin' => PASO_TURNO_MIN
                ]);
            }

            $st = $db->prepare("SELECT horario, duracion_total FROM turnos WHERE fecha = ? AND estado <> 'cancelado'");
            $st->execute([$fecha]);

            $ocupados = [];

            foreach ($st->fetchAll() as $t) {
                $ini = senderosHoraAMinutos(substr((string)$t['horario'], 0, 5));

                if ($ini === null) {
                    continue;
                }

                $ocupados[] = ['inicio' => $ini, 'fin' => $ini + max(1, (int)$t['duracion_total'])];
            }

            jsonResponse([
                'ok' => true,
                'fecha' => $fecha,
                'duracion' => $duracion,
                'cerrado' => false,
                'disponibles' => senderosSlotsDisponibles($fecha, $duracion, $ocupados),
                'ventanas' => HORARIO_VENTANAS,
                'pasoMin' => PASO_TURNO_MIN,
                'diasCerrados' => DIAS_CERRADOS,
                'feriados' => FERIADOS
            ]);
        }

        /* Turnos propios. */
        if (isset($_GET['propios'])) {
            $usuario = requireLogin();

            $st = $db->prepare('SELECT * FROM turnos WHERE usuario_id = ? ORDER BY fecha ASC, horario ASC');
            $st->execute([(int)$usuario['id']]);

            jsonResponse(['ok' => true, 'turnos' => $st->fetchAll(PDO::FETCH_ASSOC)]);
        }

        /* Listado admin (con teléfono y cliente, servicios como JSON). */
        requireAdmin();

        $st = $db->query(
            "SELECT t.*,
                    u.nombre AS cliente_nombre,
                    u.apellido AS cliente_apellido,
                    u.telefono AS telefono
             FROM turnos t
             LEFT JOIN usuarios u ON u.id = t.usuario_id
             ORDER BY t.fecha ASC, t.horario ASC"
        );

        $turnos = $st->fetchAll(PDO::FETCH_ASSOC);

        foreach ($turnos as &$turno) {
            $nombre = trim(($turno['cliente_nombre'] ?? '') . ' ' . ($turno['cliente_apellido'] ?? ''));
            $turno['cliente'] = $nombre !== '' ? $nombre : 'Cliente web';
            $turno['telefono'] = $turno['telefono'] ?? '';
        }

        unset($turno);

        jsonResponse(['ok' => true, 'turnos' => $turnos]);
    }

    /* ═══════════ POST: los turnos se crean solo en checkout.php ═══════════ */
    if ($method === 'POST') {
        jsonResponse([
            'ok' => false,
            'error' => 'Los turnos se crean desde el checkout con los datos del servidor.'
        ], 410);
    }

    /* ═══════════ PUT: cambiar estado ═══════════ */
    if ($method === 'PUT') {
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);
        $estado = strtolower(trim((string)($data['estado'] ?? '')));

        if ($id <= 0) {
            jsonResponse(['ok' => false, 'error' => 'ID de turno inválido.'], 400);
        }

        $usuario = requireLogin();

        /* Admin: pendiente | confirmado | cancelado en cualquier turno. */
        if ($usuario['rol'] === 'admin') {
            $permitidos = ['pendiente', 'confirmado', 'cancelado'];

            if (!in_array($estado, $permitidos, true)) {
                jsonResponse(['ok' => false, 'error' => 'Estado de turno inválido.'], 400);
            }

            $st = $db->prepare('UPDATE turnos SET estado = ? WHERE id = ?');
            $st->execute([$estado, $id]);

            if ($st->rowCount() === 0) {
                $check = $db->prepare('SELECT id FROM turnos WHERE id = ?');
                $check->execute([$id]);

                if (!$check->fetch()) {
                    jsonResponse(['ok' => false, 'error' => 'Turno no encontrado.'], 404);
                }
            }

            jsonResponse(['ok' => true, 'actualizado' => true]);
        }

        /* Cliente: solo puede cancelar su propio turno con más de 24 hs. */
        if ($estado !== 'cancelado') {
            jsonResponse(['ok' => false, 'error' => 'Solo el local puede confirmar tu turno.'], 403);
        }

        $st = $db->prepare('SELECT * FROM turnos WHERE id = ? AND usuario_id = ? LIMIT 1');
        $st->execute([$id, (int)$usuario['id']]);
        $turno = $st->fetch();

        if (!$turno) {
            jsonResponse(['ok' => false, 'error' => 'No tenés permiso para modificar este turno.'], 403);
        }

        if (strtolower((string)$turno['estado']) === 'cancelado') {
            jsonResponse(['ok' => false, 'error' => 'Este turno ya está cancelado.'], 409);
        }

        $tsTurno = strtotime($turno['fecha'] . ' ' . $turno['horario']);

        if ($tsTurno === false) {
            jsonResponse(['ok' => false, 'error' => 'No se pudo verificar el horario del turno.'], 500);
        }

        $horasRestantes = ($tsTurno - time()) / 3600;

        if ($horasRestantes < 24) {
            jsonResponse([
                'ok' => false,
                'error' => 'Ya falta menos de 24 hs para tu turno. Escribinos por WhatsApp y lo vemos.',
                'consultarWhatsApp' => true
            ], 409);
        }

        $st = $db->prepare("UPDATE turnos SET estado = 'cancelado' WHERE id = ? AND usuario_id = ?");
        $st->execute([$id, (int)$usuario['id']]);

        jsonResponse(['ok' => true, 'actualizado' => true]);
    }

    jsonResponse(['ok' => false, 'error' => 'Método no permitido'], 405);
} catch (Throwable $e) {
    error_log('Error turnos.php: ' . $e->getMessage());

    jsonResponse(['ok' => false, 'error' => 'No se pudo procesar el turno.'], 500);
}
