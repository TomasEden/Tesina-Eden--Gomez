/* ═══════════════════════════════════════
   SPA M — mis-turnos.js (v2)
   Turnos + Pedidos con tabs
   ═══════════════════════════════════════ */

const TURNOS_DEMO = [
  { id: 901, servicio: 'Masaje Relajante', duracionMin: 60, precio: 5000, fecha: new Date(Date.now() + 86400000 * 3).toISOString(), horario: '10:00', estado: 'confirmado' },
  { id: 902, servicio: 'Jacuzzi Privado',  duracionMin: 80, precio: 5000, fecha: new Date(Date.now() + 86400000 * 7).toISOString(), horario: '15:00', estado: 'pendiente'  },
  { id: 903, servicio: 'Facial Premium',   duracionMin: 30, precio: 3000, fecha: new Date(Date.now() - 86400000 * 5).toISOString(), horario: '11:00', estado: 'cancelado'  },
];

const PEDIDOS_DEMO = [
  {
    id: 801, fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
    cliente: 'Demo', estado: 'listo', total: 1050,
    items: [
      { nombre: 'Crema Hidratante', precio: 500, cantidad: 1, img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=80' },
      { nombre: 'Bálsamo Natural',  precio: 450, cantidad: 1, img: 'https://images.unsplash.com/photo-1585386959984-a41552231658?w=80' },
    ]
  }
];

let filtroActivo = 'todos';
let cancelarId   = null;

document.addEventListener('DOMContentLoaded', () => {
  actualizarContador();
  actualizarNavSesion();
  renderTurnos();
  renderPedidos();
  actualizarBadges();

  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

// ── Navbar ──────────────────────────────────────────────────────────────────
function actualizarContador() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  document.getElementById('contador').textContent = carrito.length;
}

function actualizarNavSesion() {
  const sesion = getSesion ? getSesion() : null;
  const btn = document.getElementById('btnSesion');
  if (sesion && btn) {
    btn.textContent = `Hola, ${sesion.nombre}`;
    btn.href = 'mis-turnos.html';
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Tabs principales ─────────────────────────────────────────────────────────
function cambiarMainTab(btn) {
  const tabId = btn.dataset.tab;
  document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

function actualizarBadges() {
  const turnos  = [...getTurnosGuardados(), ...TURNOS_DEMO];
  const pedidos = [...getPedidos(), ...PEDIDOS_DEMO];
  document.getElementById('badgeTurnos').textContent  = turnos.length;
  document.getElementById('badgePedidos').textContent = pedidos.length;
}

// ── TURNOS ───────────────────────────────────────────────────────────────────
function getTurnos() {
  return [...getTurnosGuardados(), ...TURNOS_DEMO];
}

function cambiarFiltro(btn) {
  filtroActivo = btn.dataset.estado;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTurnos();
}

function renderTurnos() {
  const lista   = document.getElementById('turnosList');
  const empty   = document.getElementById('turnosEmpty');
  lista.innerHTML = '';

  let turnos = getTurnos();
  if (filtroActivo !== 'todos') turnos = turnos.filter(t => t.estado === filtroActivo);
  turnos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  if (!turnos.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  turnos.forEach((t, i) => {
    const fecha      = new Date(t.fecha);
    const dia        = fecha.getDate();
    const mes        = fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
    const fechaLarga = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const esPasado   = fecha < new Date();
    const waLink     = generarWATurno(t);

    const card = document.createElement('div');
    card.className = `turno-card ${t.estado}`;
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = `
      <div class="turno-fecha-block">
        <div class="turno-dia">${dia}</div>
        <div class="turno-mes">${mes}</div>
      </div>
      <div class="turno-info">
        <div class="turno-nombre">${t.servicio}</div>
        <div class="turno-meta">
          <span>📅 ${fechaLarga}</span>
          <span>⏱ ${t.horario} hs</span>
          ${t.duracionMin ? `<span>🕐 ${t.duracionMin} min</span>` : ''}
          <span>💰 $${(t.precio || 0).toLocaleString()}</span>
        </div>
      </div>
      <div class="turno-actions">
        <span class="badge badge-${t.estado}">${t.estado}</span>
        ${!esPasado && t.estado !== 'cancelado' ? `
          <a class="btn-wa" href="${waLink}" target="_blank">💬 WhatsApp</a>
          <button class="btn-cancelar" onclick="abrirModalCancelar(${t.id})">Cancelar</button>
        ` : ''}
      </div>`;
    lista.appendChild(card);
  });
}

function generarWATurno(t) {
  const tel   = '5493510000000';
  const fecha = new Date(t.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const msg   = `Hola! Quiero consultar sobre mi turno:\n\n💆 ${t.servicio}\n📅 ${fecha} a las ${t.horario} hs`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}

function abrirModalCancelar(id) {
  cancelarId = id;
  document.getElementById('modalCancelar').classList.remove('hidden');
}

function confirmarCancelar() {
  const turnos = getTurnosGuardados();
  const idx    = turnos.findIndex(t => t.id === cancelarId);
  if (idx !== -1) {
    turnos[idx].estado = 'cancelado';
    localStorage.setItem('turnos', JSON.stringify(turnos));
  }
  cerrarModal();
  renderTurnos();
  actualizarBadges();
  showToast('❌ Turno cancelado');
}

function cerrarModal() {
  document.getElementById('modalCancelar').classList.add('hidden');
}

// ── PEDIDOS ──────────────────────────────────────────────────────────────────
function renderPedidos() {
  const lista = document.getElementById('pedidosList');
  const empty = document.getElementById('pedidosEmpty');
  lista.innerHTML = '';

  const pedidos = [...getPedidos(), ...PEDIDOS_DEMO]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (!pedidos.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  pedidos.forEach((p, i) => {
    const fechaStr = formatFechaCorta(p.fecha);
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.style.animationDelay = `${i * 0.06}s`;

    const itemsHTML = p.items.map(it => `
      <div class="pedido-item">
        <img class="pedido-item-img" src="${it.img || 'https://via.placeholder.com/44'}" alt="${it.nombre}"/>
        <span class="pedido-item-name">${it.nombre}</span>
        <span class="pedido-item-qty">x${it.cantidad || 1}</span>
        <span class="pedido-item-price">$${((it.precio || 0) * (it.cantidad || 1)).toLocaleString()}</span>
      </div>`).join('');

    card.innerHTML = `
      <div class="pedido-header">
        <div>
          <div class="pedido-id">Pedido #${String(p.id).slice(-6)}</div>
          <div class="pedido-fecha">📅 ${fechaStr}</div>
        </div>
        <span class="badge badge-${p.estado}">${estadoLabel(p.estado)}</span>
      </div>
      <div class="pedido-items">${itemsHTML}</div>
      <div class="pedido-footer">
        <span class="pedido-total"><span>Total</span>$${(p.total || 0).toLocaleString()}</span>
        ${p.estado === 'pendiente' ? `
          <a class="btn-wa" href="${generarWAPedido(p)}" target="_blank">💬 Consultar estado</a>
        ` : ''}
      </div>`;
    lista.appendChild(card);
  });
}

function estadoLabel(estado) {
  const labels = { pendiente: 'Pendiente', listo: 'Listo para retirar', entregado: 'Entregado' };
  return labels[estado] || estado;
}

function generarWAPedido(p) {
  const tel   = '5493510000000';
  const items = p.items.map(i => `• ${i.nombre} x${i.cantidad || 1}`).join('\n');
  const msg   = `Hola! Quiero consultar el estado de mi pedido #${String(p.id).slice(-6)}:\n\n${items}\n\nTotal: $${p.total.toLocaleString()}`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}
