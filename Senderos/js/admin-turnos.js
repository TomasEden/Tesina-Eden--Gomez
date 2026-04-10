/* SPA M — admin-turnos.js */

if (!sessionStorage.getItem('adminSesion')) window.location.href = 'admin-login.html';

const DEMO = [
  { id: 101, cliente: 'María García',    servicio: 'Masaje Relajante',   fecha: '2026-04-02', horario: '10:00', precio: 5000, estado: 'confirmado' },
  { id: 102, cliente: 'Laura Pérez',     servicio: 'Facial Premium',      fecha: '2026-04-02', horario: '11:00', precio: 3000, estado: 'pendiente'  },
  { id: 103, cliente: 'Sofía Torres',    servicio: 'Jacuzzi Privado',     fecha: '2026-04-03', horario: '15:00', precio: 5000, estado: 'confirmado' },
  { id: 104, cliente: 'Ana Rodríguez',   servicio: 'Aromaterapia',        fecha: '2026-04-03', horario: '17:00', precio: 4000, estado: 'cancelado'  },
  { id: 105, cliente: 'Valentina Ruiz',  servicio: 'Manicura & Pedicura', fecha: '2026-04-04', horario: '09:00', precio: 2500, estado: 'pendiente'  },
  { id: 106, cliente: 'Camila Sosa',     servicio: 'Masaje Relajante',   fecha: '2026-04-05', horario: '12:00', precio: 5000, estado: 'confirmado' },
];

let turnos      = [];
let turnoActivo = null;
let eliminarId  = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('topbarDate').textContent =
    new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const guardados = (JSON.parse(localStorage.getItem('turnos')) || []).map((t, i) => ({
    id: i + 1,
    cliente: 'Cliente web',
    servicio: t.servicio || t.nombre,
    fecha: t.fecha ? new Date(t.fecha).toLocaleDateString('es-AR') : '—',
    horario: t.horario || '—',
    precio: t.precio || 0,
    estado: t.estado || 'pendiente'
  }));
  turnos = [...guardados, ...DEMO];
  renderStats();
  renderTabla(turnos);
});

function renderStats() {
  const total      = turnos.length;
  const pendientes = turnos.filter(t => t.estado === 'pendiente').length;
  const confirmados = turnos.filter(t => t.estado === 'confirmado').length;
  const cancelados = turnos.filter(t => t.estado === 'cancelado').length;

  const stats = [
    { icon: '📋', label: 'Total turnos',  value: total,       color: 'rose'   },
    { icon: '⏳', label: 'Pendientes',    value: pendientes,  color: 'orange' },
    { icon: '✅', label: 'Confirmados',   value: confirmados, color: 'green'  },
    { icon: '❌', label: 'Cancelados',    value: cancelados,  color: 'blue'   },
  ];
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = '';
  stats.forEach(s => {
    grid.innerHTML += `
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon ${s.color}">${s.icon}</div>
        </div>
        <div class="stat-card-num">${s.value}</div>
        <div class="stat-card-label">${s.label}</div>
      </div>`;
  });
}

function renderTabla(lista) {
  const tbody = document.getElementById('turnosBody');
  const empty = document.getElementById('tableEmpty');
  tbody.innerHTML = '';

  if (!lista.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  lista.forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${t.cliente}</strong></td>
        <td>${t.servicio}</td>
        <td class="td-light">${t.fecha} · ${t.horario}</td>
        <td><span class="badge badge-${t.estado}">${t.estado}</span></td>
        <td>
          <div style="display:flex;gap:0.4rem">
            <button class="btn-icon" title="Cambiar estado" onclick="abrirModalEstado(${t.id})">✏️</button>
            <button class="btn-icon danger" title="Eliminar" onclick="abrirModalEliminar(${t.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
  });
}

function filtrar() {
  const busqueda = document.getElementById('searchInput').value.toLowerCase();
  const estado   = document.getElementById('filterEstado').value;
  const resultado = turnos.filter(t => {
    const matchBusq = t.cliente.toLowerCase().includes(busqueda) || t.servicio.toLowerCase().includes(busqueda);
    const matchEstado = estado === 'todos' || t.estado === estado;
    return matchBusq && matchEstado;
  });
  renderTabla(resultado);
}

function abrirModalEstado(id) {
  turnoActivo = turnos.find(t => t.id === id);
  if (!turnoActivo) return;
  document.getElementById('modalTurnoInfo').textContent =
    `${turnoActivo.cliente} — ${turnoActivo.servicio} — ${turnoActivo.fecha}`;
  document.getElementById('nuevoEstado').value = turnoActivo.estado;
  document.getElementById('modalEstado').classList.remove('hidden');
}

function guardarEstado() {
  if (!turnoActivo) return;
  const nuevoEstado = document.getElementById('nuevoEstado').value;
  const estadoAnterior = turnoActivo.estado;
  turnoActivo.estado = nuevoEstado;
  cerrarModal('modalEstado');
  renderTabla(turnos);
  renderStats();
  showToast('✅ Estado actualizado');

  // Si se confirmó el turno, ofrecer notificar al cliente por WhatsApp
  if (nuevoEstado === 'confirmado' && estadoAnterior !== 'confirmado') {
    const tel = turnoActivo.telefono || '';
    const fecha = turnoActivo.fecha instanceof Date
      ? turnoActivo.fecha.toLocaleDateString('es-AR')
      : turnoActivo.fecha;
    const msg = `Hola! 🌸 Tu turno de ${turnoActivo.servicio} del ${fecha} a las ${turnoActivo.horario} hs está CONFIRMADO. ¡Te esperamos!`;
    const waUrl = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;

    if (confirm('¿Notificar al cliente por WhatsApp que su turno está confirmado?')) {
      window.open(waUrl, '_blank');
    }
  }
}

function abrirModalEliminar(id) {
  eliminarId = id;
  document.getElementById('modalEliminar').classList.remove('hidden');
}

function confirmarEliminar() {
  turnos = turnos.filter(t => t.id !== eliminarId);
  cerrarModal('modalEliminar');
  filtrar();
  renderStats();
  showToast('🗑️ Turno eliminado');
}

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function cerrarSesion() {
  sessionStorage.removeItem('adminSesion');
  window.location.href = 'admin-login.html';
}
