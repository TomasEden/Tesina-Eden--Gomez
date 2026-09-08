/* SPA M - mis-turnos.js (conectado a la API) */

const API_TURNOS  = '../api/turnos.php';
const API_PEDIDOS = '../api/pedidos.php';

let turnosData   = [];
let pedidosData  = [];
let filtroActivo = 'todos';
let cancelarId   = null;

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  requireSesionPage(); // redirige a login si no hay sesión

  cargarTurnos();
  cargarPedidos();

  window.addEventListener('scroll', function() {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function cambiarMainTab(btn) {
  var tabId = btn.dataset.tab;
  document.querySelectorAll('.main-tab').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ── CARGAR TURNOS DESDE LA API ────────────────────────────────────────────────
function cargarTurnos() {
  fetch(API_TURNOS + '?propios=1')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        turnosData = data.turnos;
        renderTurnos();
        actualizarBadges();
      } else {
        showToast('❌ Error al cargar turnos');
      }
    })
    .catch(function() { showToast('❌ Error de conexión con el servidor'); });
}

// ── CARGAR PEDIDOS DESDE LA API ───────────────────────────────────────────────
function cargarPedidos() {
  fetch(API_PEDIDOS + '?propios=1')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        pedidosData = data.pedidos;
        renderPedidos();
        actualizarBadges();
      } else {
        showToast('❌ Error al cargar pedidos');
      }
    })
    .catch(function() { showToast('❌ Error de conexión con el servidor'); });
}

function actualizarBadges() {
  var bt = document.getElementById('badgeTurnos');
  var bp = document.getElementById('badgePedidos');
  if (bt) bt.textContent = turnosData.length;
  if (bp) bp.textContent = pedidosData.length;
}

function cambiarFiltro(btn) {
  filtroActivo = btn.dataset.estado;
  document.querySelectorAll('.filter-tab').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderTurnos();
}

// ── RENDER TURNOS ──────────────────────────────────────────────────────────────
function renderTurnos() {
  var lista = document.getElementById('turnosList');
  var empty = document.getElementById('turnosEmpty');
  lista.innerHTML = '';

  var turnos = turnosData.slice();
  if (filtroActivo !== 'todos') {
    turnos = turnos.filter(function(t) { return t.estado === filtroActivo; });
  }
  turnos.sort(function(a,b) { return new Date(a.fecha) - new Date(b.fecha); });

  if (!turnos.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  turnos.forEach(function(t, i) {
    var fecha      = new Date(t.fecha + 'T00:00');
    var dia        = fecha.getDate();
    var mes        = fecha.toLocaleDateString('es-AR', { month:'short' }).replace('.','');
    var fechaLarga = fecha.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
    var esPasado   = fecha < new Date(new Date().toDateString());
    var tel        = '5493510000000';
    var nombreServ = t.servicios || 'Servicio';
    var msg        = 'Hola! Quiero consultar sobre mi turno:\n\n' + nombreServ + '\n' + fechaLarga + ' a las ' + t.horario + ' hs';
    var waLink     = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(msg);

    var card = document.createElement('div');
    card.className = 'turno-card ' + t.estado;
    card.style.animationDelay = (i * 0.06) + 's';

    var acciones = '<span class="badge badge-' + t.estado + '">' + t.estado + '</span>';
    if (!esPasado && t.estado !== 'cancelado') {
      acciones +=
        '<a class="btn-wa" href="' + waLink + '" target="_blank">&#128172; WhatsApp</a>' +
        '<button class="btn-cancelar" onclick="abrirModalCancelar(' + t.id + ')">Cancelar</button>';
    }

    card.innerHTML =
      '<div class="turno-fecha-block">' +
        '<div class="turno-dia">' + dia + '</div>' +
        '<div class="turno-mes">' + mes + '</div>' +
      '</div>' +
      '<div class="turno-info">' +
        '<div class="turno-nombre">' + nombreServ + '</div>' +
        '<div class="turno-meta">' +
          '<span>&#128197; ' + fechaLarga + '</span>' +
          '<span>&#9201; ' + t.horario + ' hs</span>' +
          (t.duracion_total ? '<span>' + t.duracion_total + ' min</span>' : '') +
          '<span>$' + (Number(t.precio_total) || 0).toLocaleString() + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="turno-actions">' + acciones + '</div>';
    lista.appendChild(card);
  });
}

function abrirModalCancelar(id) {
  cancelarId = id;
  document.getElementById('modalCancelar').classList.remove('hidden');
}

function confirmarCancelar() {
  fetch(API_TURNOS, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: cancelarId, estado: 'cancelado' })
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (!res.ok) { showToast('❌ Error al cancelar'); return; }
    cerrarModal();
    showToast('Turno cancelado');
    cargarTurnos();
  })
  .catch(function() { showToast('❌ Error de conexión con el servidor'); });
}

function cerrarModal() {
  document.getElementById('modalCancelar').classList.add('hidden');
}

// ── RENDER PEDIDOS ─────────────────────────────────────────────────────────────
function renderPedidos() {
  var lista = document.getElementById('pedidosList');
  var empty = document.getElementById('pedidosEmpty');
  lista.innerHTML = '';

  var pedidos = pedidosData.slice();
  pedidos.sort(function(a,b) { return new Date(b.creado_en) - new Date(a.creado_en); });

  if (!pedidos.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  pedidos.forEach(function(p, i) {
    var fechaStr = formatFechaCorta(p.creado_en);
    var card = document.createElement('div');
    card.className = 'pedido-card';
    card.style.animationDelay = (i * 0.06) + 's';

    var items = p.items || [];
    var itemsHTML = items.map(function(it) {
      return '<div class="pedido-item">' +
        '<span class="pedido-item-name">' + it.nombre + '</span>' +
        '<span class="pedido-item-qty">x' + (it.cantidad || 1) + '</span>' +
        '<span class="pedido-item-price">$' + ((Number(it.precio) || 0) * (it.cantidad || 1)).toLocaleString() + '</span>' +
      '</div>';
    }).join('');

    var labels = { pendiente:'Pendiente', listo:'Listo para retirar', entregado:'Entregado' };
    var estadoLabel = labels[p.estado] || p.estado;

    var tel = '5493510000000';
    var itemsTxt = items.map(function(i) { return '- ' + i.nombre + ' x' + (i.cantidad||1); }).join('\n');
    var msg = 'Hola! Quiero consultar el estado de mi pedido #' + String(p.id).padStart(6,'0') + ':\n\n' + itemsTxt + '\n\nTotal: $' + Number(p.total).toLocaleString();
    var waLink = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(msg);

    card.innerHTML =
      '<div class="pedido-header">' +
        '<div>' +
          '<div class="pedido-id">Pedido #' + String(p.id).padStart(6,'0') + '</div>' +
          '<div class="pedido-fecha">&#128197; ' + fechaStr + '</div>' +
        '</div>' +
        '<span class="badge badge-' + p.estado + '">' + estadoLabel + '</span>' +
      '</div>' +
      '<div class="pedido-items">' + itemsHTML + '</div>' +
      '<div class="pedido-footer">' +
        '<span class="pedido-total"><span>Total</span>$' + (Number(p.total) || 0).toLocaleString() + '</span>' +
        (p.estado === 'pendiente' ? '<a class="btn-wa" href="' + waLink + '" target="_blank">&#128172; Consultar estado</a>' : '') +
      '</div>';
    lista.appendChild(card);
  });
}

function formatFechaCorta(fechaStr) {
  if (!fechaStr) return '—';
  try {
    return new Date(fechaStr).toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' });
  } catch (e) { return fechaStr; }
}