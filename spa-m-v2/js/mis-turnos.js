/* SPA M - mis-turnos.js */

var TURNOS_DEMO = [
  { id:901, servicio:'Masaje Relajante', duracionMin:60, precio:5000, fecha: new Date(Date.now() + 86400000*3).toISOString(), horario:'10:00', estado:'confirmado' },
  { id:902, servicio:'Jacuzzi Privado',  duracionMin:80, precio:5000, fecha: new Date(Date.now() + 86400000*7).toISOString(), horario:'15:00', estado:'pendiente'  },
  { id:903, servicio:'Facial Premium',   duracionMin:30, precio:3000, fecha: new Date(Date.now() - 86400000*5).toISOString(), horario:'11:00', estado:'cancelado'  }
];

var PEDIDOS_DEMO = [
  { id:801, fecha: new Date(Date.now() - 86400000*2).toISOString(), cliente:'Demo', estado:'listo', total:1050,
    items:[
      { nombre:'Crema Hidratante', precio:500, cantidad:1, img:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=80' },
      { nombre:'Balsamo Natural',  precio:450, cantidad:1, img:'https://images.unsplash.com/photo-1585386959984-a41552231658?w=80' }
    ]
  }
];

var filtroActivo = 'todos';
var cancelarId   = null;

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  renderTurnos();
  renderPedidos();
  actualizarBadges();
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

function actualizarBadges() {
  var turnos  = getTurnosGuardados().concat(TURNOS_DEMO);
  var pedidos = getPedidos().concat(PEDIDOS_DEMO);
  var bt = document.getElementById('badgeTurnos');
  var bp = document.getElementById('badgePedidos');
  if (bt) bt.textContent = turnos.length;
  if (bp) bp.textContent = pedidos.length;
}

function getAllTurnos() {
  return getTurnosGuardados().concat(TURNOS_DEMO);
}

function cambiarFiltro(btn) {
  filtroActivo = btn.dataset.estado;
  document.querySelectorAll('.filter-tab').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderTurnos();
}

function renderTurnos() {
  var lista = document.getElementById('turnosList');
  var empty = document.getElementById('turnosEmpty');
  lista.innerHTML = '';

  var turnos = getAllTurnos();
  if (filtroActivo !== 'todos') {
    turnos = turnos.filter(function(t) { return t.estado === filtroActivo; });
  }
  turnos.sort(function(a,b) { return new Date(a.fecha) - new Date(b.fecha); });

  if (!turnos.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  turnos.forEach(function(t, i) {
    var fecha      = new Date(t.fecha);
    var dia        = fecha.getDate();
    var mes        = fecha.toLocaleDateString('es-AR', { month:'short' }).replace('.','');
    var fechaLarga = fecha.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
    var esPasado   = fecha < new Date();
    var tel        = '5493510000000';
    var msg        = 'Hola! Quiero consultar sobre mi turno:\n\n' + t.servicio + '\n' + fechaLarga + ' a las ' + t.horario + ' hs';
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
        '<div class="turno-nombre">' + t.servicio + '</div>' +
        '<div class="turno-meta">' +
          '<span>&#128197; ' + fechaLarga + '</span>' +
          '<span>&#9201; ' + t.horario + ' hs</span>' +
          (t.duracionMin ? '<span>' + t.duracionMin + ' min</span>' : '') +
          '<span>$' + ((t.precio || 0).toLocaleString()) + '</span>' +
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
  var turnos = getTurnosGuardados();
  var idx    = turnos.findIndex(function(t) { return t.id === cancelarId; });
  if (idx !== -1) {
    turnos[idx].estado = 'cancelado';
    localStorage.setItem('turnos', JSON.stringify(turnos));
  }
  cerrarModal();
  renderTurnos();
  actualizarBadges();
  showToast('Turno cancelado');
}

function cerrarModal() {
  document.getElementById('modalCancelar').classList.add('hidden');
}

function renderPedidos() {
  var lista = document.getElementById('pedidosList');
  var empty = document.getElementById('pedidosEmpty');
  lista.innerHTML = '';

  var pedidos = getPedidos().concat(PEDIDOS_DEMO);
  pedidos.sort(function(a,b) { return new Date(b.fecha) - new Date(a.fecha); });

  if (!pedidos.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  pedidos.forEach(function(p, i) {
    var fechaStr = formatFechaCorta(p.fecha);
    var card = document.createElement('div');
    card.className = 'pedido-card';
    card.style.animationDelay = (i * 0.06) + 's';

    var itemsHTML = p.items.map(function(it) {
      return '<div class="pedido-item">' +
        '<img class="pedido-item-img" src="' + (it.img || 'https://via.placeholder.com/44') + '" alt="' + it.nombre + '"/>' +
        '<span class="pedido-item-name">' + it.nombre + '</span>' +
        '<span class="pedido-item-qty">x' + (it.cantidad || 1) + '</span>' +
        '<span class="pedido-item-price">$' + ((it.precio || 0) * (it.cantidad || 1)).toLocaleString() + '</span>' +
      '</div>';
    }).join('');

    var labels = { pendiente:'Pendiente', listo:'Listo para retirar', entregado:'Entregado' };
    var estadoLabel = labels[p.estado] || p.estado;

    var tel = '5493510000000';
    var items = p.items.map(function(i) { return '- ' + i.nombre + ' x' + (i.cantidad||1); }).join('\n');
    var msg = 'Hola! Quiero consultar el estado de mi pedido #' + String(p.id).slice(-6) + ':\n\n' + items + '\n\nTotal: $' + p.total.toLocaleString();
    var waLink = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(msg);

    card.innerHTML =
      '<div class="pedido-header">' +
        '<div>' +
          '<div class="pedido-id">Pedido #' + String(p.id).slice(-6) + '</div>' +
          '<div class="pedido-fecha">&#128197; ' + fechaStr + '</div>' +
        '</div>' +
        '<span class="badge badge-' + p.estado + '">' + estadoLabel + '</span>' +
      '</div>' +
      '<div class="pedido-items">' + itemsHTML + '</div>' +
      '<div class="pedido-footer">' +
        '<span class="pedido-total"><span>Total</span>$' + (p.total || 0).toLocaleString() + '</span>' +
        (p.estado === 'pendiente' ? '<a class="btn-wa" href="' + waLink + '" target="_blank">&#128172; Consultar estado</a>' : '') +
      '</div>';
    lista.appendChild(card);
  });
}
