/* ═══════════════════════════════════════
   Senderos — admin-dashboard.js (v2)
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

/* ══════════════════════════════════════════
   GRÁFICOS REALES CON SVG PURO
   ══════════════════════════════════════════ */

function renderGraficos() {
  renderBarTurnos();
  renderBarIngresos();
  renderEstadosChart();
}

// ── Barras: turnos por día de la semana ─────────────────────────────────────
function renderBarTurnos() {
  const cont = document.getElementById('barChartTurnos');
  if (!cont) return;

  const turnos = JSON.parse(localStorage.getItem('turnosGuardados') || '[]');
  const dias   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const counts = [0,0,0,0,0,0,0];

  turnos.forEach(t => {
    if (!t.fecha) return;
    const d = new Date(t.fecha + 'T00:00');
    counts[d.getDay()]++;
  });

  const max = Math.max(...counts, 1);

  cont.innerHTML = renderBarChart(dias, counts, max, '#AD717E', '#FAF0F2');

  // Actualizar total
  const totalEl = document.getElementById('chartPeriod');
  if (totalEl) totalEl.textContent = turnos.length + ' turnos totales';
}

// ── Barras: ingresos últimos 6 meses ────────────────────────────────────────
function renderBarIngresos() {
  const cont = document.getElementById('barChartIngresos');
  if (!cont) return;

  const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
  const meses   = [];
  const ingresos = [];
  const hoy     = new Date();

  for (let i = 5; i >= 0; i--) {
    const d    = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const key  = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const nom  = d.toLocaleDateString('es-AR', { month: 'short' });
    meses.push(nom);

    const total = pedidos
      .filter(p => p.fecha && p.fecha.startsWith(key))
      .reduce((s, p) => s + (p.total || 0), 0);
    ingresos.push(total);
  }

  const max = Math.max(...ingresos, 1);
  cont.innerHTML = renderBarChart(meses, ingresos, max, '#45634D', '#edf7f1', true);

  const mesEl = document.getElementById('ingresosMes');
  if (mesEl) {
    const ultimo = ingresos[ingresos.length - 1];
    mesEl.textContent = '$' + ultimo.toLocaleString('es-AR');
  }
}

// ── Función genérica de barras SVG ──────────────────────────────────────────
function renderBarChart(labels, values, max, color, bgColor, currency) {
  const W = 100 / labels.length;
  const bars = labels.map((label, i) => {
    const val  = values[i] || 0;
    const pct  = max > 0 ? (val / max) * 100 : 0;
    const disp = currency
      ? (val >= 1000 ? '$' + Math.round(val/1000) + 'K' : val > 0 ? '$' + val : '—')
      : (val > 0 ? val : '—');

    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:0.25rem;min-width:0">
        <span style="font-size:0.65rem;color:#9a9a8e;font-weight:500">${disp}</span>
        <div style="width:100%;background:#f0ece8;border-radius:6px;height:80px;display:flex;align-items:flex-end;overflow:hidden">
          <div style="width:100%;height:${Math.max(pct, val > 0 ? 4 : 0)}%;background:${color};border-radius:6px;transition:height 0.5s cubic-bezier(0.34,1.56,0.64,1);"></div>
        </div>
        <span style="font-size:0.65rem;color:#7a9080;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%">${label}</span>
      </div>`;
  }).join('');

  return `<div style="display:flex;gap:0.4rem;align-items:flex-end;padding:0.5rem 0">${bars}</div>`;
}

// ── Distribución de estados ──────────────────────────────────────────────────
function renderEstadosChart() {
  const cont = document.getElementById('estadosChart');
  if (!cont) return;

  const turnos = JSON.parse(localStorage.getItem('turnosGuardados') || '[]');
  const estados = {
    pendiente:   { label: 'Pendientes',   color: '#d4850a', bg: '#fef4e6', count: 0 },
    confirmado:  { label: 'Confirmados',  color: '#45634D', bg: '#edf7f1', count: 0 },
    cancelado:   { label: 'Cancelados',   color: '#e05050', bg: '#fef0f0', count: 0 },
  };

  turnos.forEach(t => {
    if (estados[t.estado]) estados[t.estado].count++;
    else estados.pendiente.count++;
  });

  const total = turnos.length || 1;

  cont.innerHTML = Object.values(estados).map(e => `
    <div style="margin-bottom:0.7rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem">
        <span style="font-size:0.78rem;color:#333;font-weight:500">${e.label}</span>
        <span style="font-size:0.78rem;font-weight:700;color:${e.color}">${e.count}</span>
      </div>
      <div style="background:#f0ece8;border-radius:50px;height:8px;overflow:hidden">
        <div style="height:100%;width:${(e.count/total*100).toFixed(1)}%;background:${e.color};border-radius:50px;transition:width 0.6s cubic-bezier(0.4,0,0.2,1)"></div>
      </div>
    </div>`).join('');
}

// Llamar a los gráficos al final del init
const _origInit = typeof window._dashInit === 'function' ? window._dashInit : null;
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(renderGraficos, 100);
});
