/* ═══════════════════════════════════════
   Senderos — admin-clientes.js
   ═══════════════════════════════════════ */

let todosClientes = [];
let filtroActual  = 'todos';
let busquedaActual = '';

document.addEventListener('DOMContentLoaded', () => {
  verificarAdminSesion();
  cargarClientes();
});

function verificarAdminSesion() {
  const sesion = typeof getSesion === 'function' ? getSesion() : null;
  if (!sesion) { window.location.href = 'admin-login.html'; return; }
}

function cerrarSesion() {
  localStorage.removeItem('sesion');
  sessionStorage.removeItem('sesion');
  window.location.href = 'admin-login.html';
}

// ── CARGAR CLIENTES ───────────────────────────────────────────────────────────
function cargarClientes() {
  const usuarios  = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const turnos    = JSON.parse(localStorage.getItem('turnosGuardados') || '[]');
  const pedidos   = JSON.parse(localStorage.getItem('pedidos') || '[]');

  // Si no hay usuarios registrados, mostrar datos demo
  if (!usuarios.length) {
    todosClientes = generarClientesDemo(turnos, pedidos);
  } else {
    todosClientes = usuarios.map(u => {
      const turnosUsuario  = turnos.filter(t => t.email === u.email || t.usuarioId === u.id);
      const pedidosUsuario = pedidos.filter(p => p.email === u.email || p.usuarioId === u.id);
      const gastoTotal     = pedidosUsuario.reduce((s, p) => s + (p.total || 0), 0);
      return { ...u, turnos: turnosUsuario, pedidos: pedidosUsuario, gastoTotal };
    });
  }

  renderStats();
  renderTabla(todosClientes);
}

function generarClientesDemo(turnosGuardados, pedidos) {
  const DEMO = [
    { id:1, nombre:'María',    apellido:'García',    email:'maria@email.com',    telefono:'351 111-1111', createdAt: new Date(Date.now()-86400000*5).toISOString()  },
    { id:2, nombre:'Laura',    apellido:'Díaz',      email:'laura@email.com',    telefono:'351 222-2222', createdAt: new Date(Date.now()-86400000*12).toISOString() },
    { id:3, nombre:'Ana',      apellido:'Rodríguez', email:'ana@email.com',      telefono:'351 333-3333', createdAt: new Date(Date.now()-86400000*20).toISOString() },
    { id:4, nombre:'Sofía',    apellido:'López',     email:'sofia@email.com',    telefono:'351 444-4444', createdAt: new Date(Date.now()-86400000*35).toISOString() },
    { id:5, nombre:'Valentina',apellido:'Martínez',  email:'vale@email.com',     telefono:'351 555-5555', createdAt: new Date(Date.now()-86400000*48).toISOString() },
    { id:6, nombre:'Carolina', apellido:'Pérez',     email:'caro@email.com',     telefono:'351 666-6666', createdAt: new Date(Date.now()-86400000*60).toISOString() },
    { id:7, nombre:'Jimena',   apellido:'Torres',    email:'jimena@email.com',   telefono:'351 777-7777', createdAt: new Date(Date.now()-86400000*90).toISOString() },
  ];

  const turnosPorCliente = [3, 1, 2, 0, 4, 1, 2];
  const pedidosPorCliente= [2, 1, 0, 1, 3, 0, 1];
  const gastos           = [15000, 5000, 10000, 3000, 20000, 5000, 8000];

  return DEMO.map((u, i) => ({
    ...u,
    turnos:     { length: turnosPorCliente[i] },
    pedidos:    { length: pedidosPorCliente[i] },
    gastoTotal: gastos[i]
  }));
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function renderStats() {
  const cont = document.getElementById('clientesStats');
  if (!cont) return;

  const total      = todosClientes.length;
  const conTurnos  = todosClientes.filter(c => (c.turnos?.length || 0) > 0).length;
  const conPedidos = todosClientes.filter(c => (c.pedidos?.length || 0) > 0).length;
  const hace30     = new Date(Date.now() - 86400000 * 30).toISOString();
  const recientes  = todosClientes.filter(c => c.createdAt > hace30).length;
  const gastoTotal = todosClientes.reduce((s, c) => s + (c.gastoTotal || 0), 0);

  cont.innerHTML = `
    <div class="cstat"><div class="cstat-num">${total}</div><div class="cstat-lbl">Total clientes</div></div>
    <div class="cstat"><div class="cstat-num">${conTurnos}</div><div class="cstat-lbl">Con turnos</div></div>
    <div class="cstat"><div class="cstat-num">${conPedidos}</div><div class="cstat-lbl">Con pedidos</div></div>
    <div class="cstat"><div class="cstat-num">${recientes}</div><div class="cstat-lbl">Nuevos (30 días)</div></div>
    <div class="cstat"><div class="cstat-num cstat-green">$${gastoTotal.toLocaleString('es-AR')}</div><div class="cstat-lbl">Gasto total</div></div>`;
}

// ── TABLA ─────────────────────────────────────────────────────────────────────
function renderTabla(lista) {
  const tbody = document.getElementById('tbodyClientes');
  const empty = document.getElementById('tablaVacia');
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }
  empty?.classList.add('hidden');

  tbody.innerHTML = lista.map(c => {
    const nTurnos  = c.turnos?.length  || 0;
    const nPedidos = c.pedidos?.length || 0;
    const fecha    = c.createdAt
      ? new Date(c.createdAt).toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' })
      : '—';
    const inicial  = (c.nombre || '?')[0].toUpperCase();
    const color    = ['#AD717E','#45634D','#d4850a','#3b7be8'][c.id % 4] || '#AD717E';

    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.7rem">
            <div style="width:36px;height:36px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;flex-shrink:0">${inicial}</div>
            <div>
              <div style="font-weight:600;color:#1a1a1a">${c.nombre} ${c.apellido || ''}</div>
            </div>
          </div>
        </td>
        <td><span style="font-size:0.82rem;color:#666">${c.email || '—'}</span></td>
        <td><span style="font-size:0.82rem;color:#666">${c.telefono || '—'}</span></td>
        <td>
          <span class="badge-count${nTurnos > 0 ? ' green' : ''}">${nTurnos}</span>
        </td>
        <td>
          <span class="badge-count${nPedidos > 0 ? ' pink' : ''}">${nPedidos}</span>
        </td>
        <td>
          <strong style="color:${c.gastoTotal > 0 ? '#45634D' : '#ccc'};font-family:'Cormorant Garamond',serif;font-size:1.05rem">
            ${c.gastoTotal > 0 ? '$' + c.gastoTotal.toLocaleString('es-AR') : '—'}
          </strong>
        </td>
        <td><span style="font-size:0.78rem;color:#9a9a8e">${fecha}</span></td>
        <td>
          <div style="display:flex;gap:0.4rem">
            <button class="table-action-btn" onclick="verCliente(${c.id})" title="Ver detalle">👁</button>
            <a class="table-action-btn" href="https://wa.me/549${(c.telefono||'').replace(/\D/g,'')}?text=${encodeURIComponent('Hola ' + c.nombre + ', te contactamos desde Senderos.')}" target="_blank" title="WhatsApp" style="text-decoration:none">💬</a>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── FILTROS ───────────────────────────────────────────────────────────────────
function filtrarClientes(q) {
  busquedaActual = q.toLowerCase();
  aplicarFiltros();
}

function aplicarFiltro(filtro, btn) {
  filtroActual = filtro;
  document.querySelectorAll('.cfiltro').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltros();
}

function aplicarFiltros() {
  const hace30 = new Date(Date.now() - 86400000 * 30).toISOString();
  let lista = todosClientes;

  if (filtroActual === 'con-turnos')  lista = lista.filter(c => (c.turnos?.length || 0) > 0);
  if (filtroActual === 'con-pedidos') lista = lista.filter(c => (c.pedidos?.length || 0) > 0);
  if (filtroActual === 'recientes')   lista = lista.filter(c => c.createdAt > hace30);

  if (busquedaActual) {
    lista = lista.filter(c =>
      (c.nombre + ' ' + (c.apellido||'')).toLowerCase().includes(busquedaActual) ||
      (c.email||'').toLowerCase().includes(busquedaActual)
    );
  }

  renderTabla(lista);
}

// ── MODAL DETALLE ─────────────────────────────────────────────────────────────
function verCliente(id) {
  const c = todosClientes.find(x => x.id === id);
  if (!c) return;

  const nTurnos  = c.turnos?.length  || 0;
  const nPedidos = c.pedidos?.length || 0;
  const fecha    = c.createdAt
    ? new Date(c.createdAt).toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' })
    : '—';
  const inicial  = (c.nombre || '?')[0].toUpperCase();
  const color    = ['#AD717E','#45634D','#d4850a','#3b7be8'][id % 4] || '#AD717E';

  const turnosList = Array.isArray(c.turnos) && c.turnos.length
    ? c.turnos.slice(0,5).map(t => `
        <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #f5f5f5;font-size:0.82rem">
          <span>${t.servicio || '—'}</span>
          <span style="color:#9a9a8e">${t.fecha || ''} ${t.horario || ''}</span>
          <span class="badge-${t.estado || 'pendiente'}">${t.estado || 'pendiente'}</span>
        </div>`).join('')
    : '<p style="color:#ccc;font-size:0.82rem;padding:0.5rem 0">Sin turnos registrados</p>';

  document.getElementById('modalClienteContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:1.2rem;margin-bottom:1.5rem">
      <div style="width:60px;height:60px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:600;flex-shrink:0">${inicial}</div>
      <div>
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:300;color:#1a1a1a;margin:0">${c.nombre} ${c.apellido || ''}</h2>
        <p style="font-size:0.82rem;color:#9a9a8e;margin:0.2rem 0 0">${c.email || ''}</p>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem;margin-bottom:1.5rem">
      <div style="background:#faf0f2;border-radius:10px;padding:0.8rem;text-align:center">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;color:#AD717E;font-weight:600">${nTurnos}</div>
        <div style="font-size:0.72rem;color:#9a9a8e;text-transform:uppercase;letter-spacing:0.08em">Turnos</div>
      </div>
      <div style="background:#edf7f1;border-radius:10px;padding:0.8rem;text-align:center">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;color:#45634D;font-weight:600">${nPedidos}</div>
        <div style="font-size:0.72rem;color:#9a9a8e;text-transform:uppercase;letter-spacing:0.08em">Pedidos</div>
      </div>
      <div style="background:#f5f3f0;border-radius:10px;padding:0.8rem;text-align:center">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:#1a1a1a;font-weight:600">$${(c.gastoTotal||0).toLocaleString('es-AR')}</div>
        <div style="font-size:0.72rem;color:#9a9a8e;text-transform:uppercase;letter-spacing:0.08em">Gasto total</div>
      </div>
    </div>
    <div style="margin-bottom:1.2rem">
      <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#9a9a8e;margin-bottom:0.5rem;font-weight:600">Contacto</div>
      <div style="font-size:0.88rem;color:#444">${c.telefono || '—'} &nbsp;·&nbsp; Registrado: ${fecha}</div>
    </div>
    <div>
      <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#9a9a8e;margin-bottom:0.5rem;font-weight:600">Últimos turnos</div>
      ${turnosList}
    </div>
    <div style="display:flex;gap:0.8rem;margin-top:1.5rem">
      <a href="https://wa.me/549${(c.telefono||'').replace(/\D/g,'')}?text=${encodeURIComponent('Hola ' + c.nombre + ', te contactamos desde Senderos.')}" target="_blank"
         style="flex:1;background:#25d366;color:#fff;text-align:center;padding:0.7rem;border-radius:50px;text-decoration:none;font-size:0.82rem;font-weight:500">
        💬 WhatsApp
      </a>
      <a href="mailto:${c.email||''}"
         style="flex:1;background:#faf0f2;color:#AD717E;text-align:center;padding:0.7rem;border-radius:50px;text-decoration:none;font-size:0.82rem;font-weight:500;border:1px solid #F3CFD4">
        ✉️ Email
      </a>
    </div>`;

  document.getElementById('modalCliente').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  document.getElementById('modalCliente').classList.add('hidden');
  document.body.style.overflow = '';
}

// Cerrar modal con Escape o click fuera
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });
document.getElementById('modalCliente')?.addEventListener('click', function(e) {
  if (e.target === this) cerrarModal();
});

// ── EXPORTAR CSV ──────────────────────────────────────────────────────────────
function exportarCSV() {
  const headers = ['Nombre','Apellido','Email','Teléfono','Turnos','Pedidos','Gasto Total','Registro'];
  const rows = todosClientes.map(c => [
    c.nombre || '',
    c.apellido || '',
    c.email || '',
    c.telefono || '',
    c.turnos?.length || 0,
    c.pedidos?.length || 0,
    c.gastoTotal || 0,
    c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-AR') : ''
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'senderos-clientes-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  URL.revokeObjectURL(url);

  const t = document.getElementById('toast');
  if (t) { t.textContent = '✅ CSV exportado'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
}
