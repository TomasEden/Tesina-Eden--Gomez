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

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('topbarDate').textContent = new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
  try {
    const r=await fetch('../api/turnos.php'); const data=await r.json();
    if(data.ok){ turnos=(data.turnos||[]).map(t=>({id:Number(t.id),cliente:t.cliente||'Cliente web',servicio:t.servicios||'Servicio',fecha:t.fecha,horario:String(t.horario||'').slice(0,5),precio:Number(t.precio_total||0),estado:t.estado||'pendiente',telefono:t.telefono||''})); renderStats();renderTabla(turnos); }
    else throw new Error();
  } catch(e) { turnos=[];renderStats();renderTabla(turnos);showToast('No se pudieron cargar los turnos desde la base de datos.'); }
});

function renderStats() {
  const total      = turnos.length;
  const pendientes = turnos.filter(t => t.estado === 'pendiente').length;
  const confirmados = turnos.filter(t => t.estado === 'confirmado').length;
  const cancelados = turnos.filter(t => t.estado === 'cancelado').length;

  const stats = [
    { icon: '<img src="../img/icons/formulario.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem">', label: 'Total turnos',  value: total,       color: 'rose'   },
    { icon: '<img src="../img/icons/tiempo.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">', label: 'Pendientes',    value: pendientes,  color: 'orange' },
    { icon: '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">', label: 'Confirmados',   value: confirmados, color: 'green'  },
    { icon: '<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">', label: 'Cancelados',    value: cancelados,  color: 'blue'   },
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
            <button class="btn-icon" title="Cambiar estado" onclick="abrirModalEstado(${t.id})"><img src="../img/icons/formulario.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem"></button>
            <button class="btn-icon danger" title="Eliminar" onclick="abrirModalEliminar(${t.id})"><img src="../img/icons/basura.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem"></button>
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
  fetch('../api/turnos.php',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:turnoActivo.id,estado:nuevoEstado})}).then(r=>r.json()).then(res=>{ if(!res.ok) throw new Error(); turnoActivo.estado=nuevoEstado; cerrarModal('modalEstado'); renderTabla(turnos); renderStats(); showToast('Estado actualizado'); }).catch(()=>showToast('No se pudo actualizar el turno.'));
  return;
  cerrarModal('modalEstado');
  renderTabla(turnos);
  renderStats();
  showToast('<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Estado actualizado');

  // Si se confirmó el turno, ofrecer notificar al cliente por WhatsApp
  if (nuevoEstado === 'confirmado' && estadoAnterior !== 'confirmado') {
    const tel = turnoActivo.telefono || '';
    const fecha = turnoActivo.fecha instanceof Date
      ? turnoActivo.fecha.toLocaleDateString('es-AR')
      : turnoActivo.fecha;
    const msg = `Hola! Tu turno de ${turnoActivo.servicio} del ${fecha} a las ${turnoActivo.horario} hs está CONFIRMADO. ¡Te esperamos!`;
    const waUrl = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;

    mostrarModalValidacion({
      icono: 'whatsapp.svg',
      titulo: '¿Notificar al cliente?',
      mensaje: 'Podés avisarle por WhatsApp que su turno está confirmado.',
      botones: [
        { texto: 'Sí, notificar', clase: 'primary', accion: () => { window.open(waUrl, '_blank'); cerrarModalValidacion(); } },
        { texto: 'No, gracias', clase: 'outline' }
      ]
    });
  }
}

function abrirModalEliminar(id) {
  eliminarId = id;
  document.getElementById('modalEliminar').classList.remove('hidden');
}

function confirmarEliminar() {
  fetch('../api/turnos.php',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:eliminarId,estado:'cancelado'})}).then(r=>r.json()).then(res=>{if(!res.ok)throw new Error();turnos=turnos.map(t=>t.id===eliminarId?{...t,estado:'cancelado'}:t);cerrarModal('modalEliminar');filtrar();renderStats();showToast('Turno cancelado');}).catch(()=>showToast('No se pudo cancelar el turno.'));
}

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function cerrarSesion() {
  sessionStorage.removeItem('adminSesion');
  window.location.href = 'admin-login.html';
}
