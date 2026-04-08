/* ═══════════════════════════════════════
   SPA M — admin-dashboard.js (v2)
   Datos reales desde localStorage
   ═══════════════════════════════════════ */

if (!sessionStorage.getItem('adminSesion')) window.location.href = 'admin-login.html';

// ── Datos demo de relleno (se mezclan con los reales) ───────────────────────
const TURNOS_DEMO = [
  { id: 101, cliente: 'María García',    servicio: 'Masaje Relajante',   fecha: '2026-04-02', horario: '10:00', precio: 5000, estado: 'confirmado' },
  { id: 102, cliente: 'Laura Pérez',     servicio: 'Facial Premium',     fecha: '2026-04-02', horario: '11:00', precio: 3000, estado: 'pendiente'  },
  { id: 103, cliente: 'Sofía Torres',    servicio: 'Jacuzzi Privado',    fecha: '2026-04-03', horario: '15:00', precio: 5000, estado: 'confirmado' },
  { id: 104, cliente: 'Ana Rodríguez',   servicio: 'Aromaterapia',       fecha: '2026-04-03', horario: '17:00', precio: 4000, estado: 'cancelado'  },
  { id: 105, cliente: 'Valentina Ruiz',  servicio: 'Manicura & Pedicura',fecha: '2026-04-04', horario: '09:00', precio: 2500, estado: 'pendiente'  },
  { id: 106, cliente: 'Camila Sosa',     servicio: 'Masaje Relajante',   fecha: '2026-04-05', horario: '12:00', precio: 5000, estado: 'confirmado' },
];

document.addEventListener('DOMContentLoaded', () => {
  setFecha();
  renderStats();
  renderTurnosRecientes();
  renderTopServicios();
  renderActividadReciente();
});

function setFecha() {
  document.getElementById('topbarDate').textContent =
    new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Obtener todos los turnos (reales + demo) ─────────────────────────────────
function getAllTurnos() {
  const reales = (JSON.parse(localStorage.getItem('turnos')) || []).map(t => ({
    ...t,
    cliente:  'Cliente web',
    fecha:    t.fecha ? new Date(t.fecha).toLocaleDateString('es-AR') : '—',
    precio:   t.precio || 0
  }));
  return [...reales, ...TURNOS_DEMO];
}

function getAllPedidos() {
  return JSON.parse(localStorage.getItem('pedidos')) || [];
}

function getProductos() {
  return JSON.parse(localStorage.getItem('adminProductos')) || [];
}

// ── Stats ───────────────────────────────────────────────────────────────────
function renderStats() {
  const turnos   = getAllTurnos();
  const pedidos  = getAllPedidos();
  const productos = getProductos();

  const confirmados = turnos.filter(t => t.estado === 'confirmado');
  const pendientes  = turnos.filter(t => t.estado === 'pendiente').length;
  const ingresosTurnos = confirmados.reduce((s, t) => s + (t.precio || 0), 0);
  const ingresosPedidos = pedidos.reduce((s, p) => s + (p.total || 0), 0);
  const totalIngresos  = ingresosTurnos + ingresosPedidos;
  const sinStock = productos.filter(p => !p.stock || (p.stockQty ?? 99) === 0).length;

  const stats = [
    { icon: '📅', label: 'Turnos totales',     value: turnos.length,                   trend: `${pendientes} pendientes`, color: 'rose'   },
    { icon: '💰', label: 'Ingresos estimados', value: `$${totalIngresos.toLocaleString()}`, trend: `${confirmados.length} confirmados`, color: 'green'  },
    { icon: '🛍️', label: 'Productos activos',  value: productos.length || 9,           trend: sinStock > 0 ? `${sinStock} sin stock` : 'Todo en stock', color: 'orange' },
    { icon: '📦', label: 'Pedidos recibidos',  value: pedidos.length,                  trend: 'Historial', color: 'blue' },
  ];

  const grid = document.getElementById('statsGrid');
  grid.innerHTML = '';
  stats.forEach(s => {
    grid.innerHTML += `
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon ${s.color}">${s.icon}</div>
          <span class="stat-trend up">${s.trend}</span>
        </div>
        <div class="stat-card-num">${s.value}</div>
        <div class="stat-card-label">${s.label}</div>
      </div>`;
  });
}

// ── Turnos recientes ─────────────────────────────────────────────────────────
function renderTurnosRecientes() {
  const turnos = getAllTurnos().slice(0, 6);
  const tbody  = document.getElementById('turnosRecientes');
  tbody.innerHTML = '';
  turnos.forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${t.cliente}</strong></td>
        <td>${t.servicio}</td>
        <td class="td-light">${t.fecha} ${t.horario ? '· ' + t.horario : ''}</td>
        <td><span class="badge badge-${t.estado}">${t.estado}</span></td>
      </tr>`;
  });
}

// ── Top servicios ─────────────────────────────────────────────────────────────
function renderTopServicios() {
  const turnos = getAllTurnos();
  const conteo = {};
  turnos.forEach(t => {
    const s = t.servicio || 'Desconocido';
    conteo[s] = (conteo[s] || 0) + 1;
  });
  const top = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const container = document.getElementById('topServicios');
  container.innerHTML = '';
  top.forEach(([nombre, cant], i) => {
    container.innerHTML += `
      <div class="top-servicio-item">
        <span class="top-rank">${i + 1}</span>
        <span class="top-servicio-name">${nombre}</span>
        <span class="top-servicio-count">${cant} reservas</span>
      </div>`;
  });

  // Fallback si no hay datos reales
  if (!top.length) {
    [['Masaje Relajante',48],['Jacuzzi Privado',35],['Facial Premium',29],['Aromaterapia',18]]
      .forEach(([nombre, cant], i) => {
        container.innerHTML += `
          <div class="top-servicio-item">
            <span class="top-rank">${i + 1}</span>
            <span class="top-servicio-name">${nombre}</span>
            <span class="top-servicio-count">${cant} reservas</span>
          </div>`;
      });
  }
}

// ── Actividad reciente (pedidos) ─────────────────────────────────────────────
function renderActividadReciente() {
  const pedidos = getAllPedidos().slice(-3).reverse();
  const container = document.getElementById('topServicios');

  if (pedidos.length === 0) return;

  container.innerHTML += `<div style="padding:0.8rem 1.8rem 0;border-top:1px solid var(--cream);margin-top:0.5rem">
    <p style="font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-light);font-weight:500">Pedidos recientes</p>
  </div>`;

  pedidos.forEach(p => {
    const fecha = new Date(p.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    container.innerHTML += `
      <div class="top-servicio-item">
        <span class="top-rank">🛍️</span>
        <span class="top-servicio-name">${p.cliente || 'Cliente'} · ${fecha}</span>
        <span class="top-servicio-count">$${(p.total || 0).toLocaleString()}</span>
      </div>`;
  });
}

function cerrarSesion() {
  sessionStorage.removeItem('adminSesion');
  window.location.href = 'admin-login.html';
}
