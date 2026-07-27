/* SPA M — admin-servicios.js (conectado a la API) */

if (!sessionStorage.getItem('adminSesion')) window.location.href = 'admin-login.html';

const API_URL = '../api/servicios.php';

let servicios  = [];
let eliminarId = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarServicios();
});

// ── Cargar servicios desde la API ────────────────────────────────────────────
function cargarServicios() {
  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        servicios = data.servicios;
        renderTabla(servicios);
      } else {
        showToast('❌ Error al cargar servicios');
      }
    })
    .catch(() => showToast('❌ Error de conexión con el servidor'));
}

function renderTabla(lista) {
  const tbody = document.getElementById('serviciosBody');
  tbody.innerHTML = '';
  lista.forEach(s => {
    const desc = s.descripcion ? s.descripcion.substring(0, 45) : '';
    tbody.innerHTML += `
      <tr>
        <td><strong>${s.nombre}</strong><br><span class="td-light">${desc}...</span></td>
        <td class="td-light">${s.categoria || ''}</td>
        <td class="td-light">⏱ ${s.duracion} min</td>
        <td><strong>$${Number(s.precio).toLocaleString()}</strong></td>
        <td>
          <div style="display:flex;gap:0.4rem">
            <button class="btn-icon" onclick="abrirModalEditar(${s.id})">✏️</button>
            <button class="btn-icon danger" onclick="abrirModalEliminar(${s.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
  });
}

function filtrar() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  renderTabla(servicios.filter(s =>
    s.nombre.toLowerCase().includes(q) ||
    (s.categoria || '').toLowerCase().includes(q)
  ));
}

function limpiarForm() {
  ['fNombre','fDuracion','fPrecio','fImg','fDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('editId').value = '';
  document.getElementById('fCategoria').value = 'Masajes';
  ['err-nombre','err-duracion','err-precio'].forEach(id => document.getElementById(id).textContent = '');
}

function abrirModalNuevo() {
  limpiarForm();
  document.getElementById('modalFormTitle').textContent = 'Nuevo servicio';
  document.getElementById('modalForm').classList.remove('hidden');
}

function abrirModalEditar(id) {
  const s = servicios.find(s => s.id === id);
  if (!s) return;
  limpiarForm();
  document.getElementById('modalFormTitle').textContent = 'Editar servicio';
  document.getElementById('editId').value    = s.id;
  document.getElementById('fNombre').value   = s.nombre;
  document.getElementById('fCategoria').value = s.categoria || 'Masajes';
  document.getElementById('fDuracion').value = s.duracion;
  document.getElementById('fPrecio').value   = s.precio;
  document.getElementById('fImg').value      = s.imagen || '';
  document.getElementById('fDesc').value     = s.descripcion || '';
  document.getElementById('modalForm').classList.remove('hidden');
}

function guardarServicio() {
  const nombre   = document.getElementById('fNombre').value.trim();
  const duracion = parseInt(document.getElementById('fDuracion').value);
  const precio   = parseFloat(document.getElementById('fPrecio').value);
  let valido = true;

  document.getElementById('err-nombre').textContent   = '';
  document.getElementById('err-duracion').textContent = '';
  document.getElementById('err-precio').textContent   = '';

  if (!nombre)                     { document.getElementById('err-nombre').textContent   = 'El nombre es obligatorio'; valido = false; }
  if (!duracion || duracion <= 0)  { document.getElementById('err-duracion').textContent = 'Ingresá una duración válida'; valido = false; }
  if (!precio   || precio <= 0)    { document.getElementById('err-precio').textContent   = 'Ingresá un precio válido';   valido = false; }
  if (!valido) return;

  const data = {
    nombre,
    categoria:   document.getElementById('fCategoria').value,
    duracion,
    precio,
    imagen:      document.getElementById('fImg').value.trim(),
    descripcion: document.getElementById('fDesc').value.trim(),
  };

  const editId = document.getElementById('editId').value;
  const metodo = editId ? 'PUT' : 'POST';
  if (editId) data.id = parseInt(editId);

  fetch(API_URL, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(r => r.json())
  .then(res => {
    if (!res.ok) { showToast('❌ ' + (res.error || 'Error al guardar')); return; }
    showToast(editId ? '✅ Servicio actualizado' : '✅ Servicio creado');
    cerrarModal('modalForm');
    cargarServicios();
  })
  .catch(() => showToast('❌ Error de conexión con el servidor'));
}

function abrirModalEliminar(id) {
  eliminarId = id;
  document.getElementById('modalEliminar').classList.remove('hidden');
}

function confirmarEliminar() {
  fetch(API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: eliminarId })
  })
  .then(r => r.json())
  .then(res => {
    if (!res.ok) { showToast('❌ Error al eliminar'); return; }
    cerrarModal('modalEliminar');
    showToast('🗑️ Servicio eliminado');
    cargarServicios();
  })
  .catch(() => showToast('❌ Error de conexión con el servidor'));
}

function cerrarModal(id) { document.getElementById(id).classList.add('hidden'); }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function cerrarSesion() {
  sessionStorage.removeItem('adminSesion');
  window.location.href = 'admin-login.html';
}