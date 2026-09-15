/* Senderos — admin-productos.js (conectado a la API) */

if (!sessionStorage.getItem('adminSesion')) window.location.href = 'admin-login.html';

const API_URL = '../api/productos.php';

let productos  = [];
let eliminarId = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
});

// ── Cargar productos desde la API ────────────────────────────────────────────
function cargarProductos() {
  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        productos = data.productos;
        renderTabla(productos);
      } else {
        showToast('No pudimos mostrar los productos en este momento.');
      }
    })
    .catch(() => showToast('Error de conexión con el servidor'));
}

function renderTabla(lista) {
  const tbody = document.getElementById('productosBody');
  tbody.innerHTML = '';
  lista.forEach(p => {
    const qty = p.stock_cantidad ?? 0;
    const stockBadge = qty > 0
      ? `<span class="badge badge-stock">Stock: ${qty}</span>`
      : `<span class="badge badge-sin-stock">Sin stock</span>`;
    const badgeText = p.badge === 'nuevo' ? 'Nuevo' : p.badge === 'oferta' ? 'Oferta' : '';
    tbody.innerHTML += `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.8rem">
            <img src="${p.imagen || ''}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0"/>
            <div><strong>${p.nombre}</strong>${badgeText ? `<br><span class="td-light">${badgeText}</span>` : ''}</div>
          </div>
        </td>
        <td class="td-light">${p.marca || '—'}</td>
        <td class="td-light">${p.categoria || ''}</td>
        <td><strong>$${Number(p.precio).toLocaleString()}</strong></td>
        <td>${stockBadge}</td>
        <td>
          <div style="display:flex;gap:0.4rem">
            <button class="btn-icon" onclick="abrirModalEditar(${p.id})"><img src="../img/icons/formulario.svg" alt="" width="13" height="13"></button>
            <button class="btn-icon danger" onclick="abrirModalEliminar(${p.id})"><img src="../img/icons/basura.svg" alt="" width="15" height="15"></button>
          </div>
        </td>
      </tr>`;
  });
}

function filtrar() {
  const q      = document.getElementById('searchInput').value.toLowerCase();
  const marca  = document.getElementById('filterMarca').value;
  const cat    = document.getElementById('filterCat').value;
  const stock  = document.getElementById('filterStock').value;

  const resultado = productos.filter(p => {
    const matchQ      = p.nombre.toLowerCase().includes(q);
    const matchMarca  = marca === 'todas' || p.marca === marca;
    const matchCat    = cat === 'todas' || p.categoria === cat;
    const tieneStock  = (p.stock_cantidad ?? 0) > 0;
    const matchStock  = stock === 'todos' || (stock === 'con' ? tieneStock : !tieneStock);
    return matchQ && matchMarca && matchCat && matchStock;
  });
  renderTabla(resultado);
}

function limpiarForm() {
  ['fNombre','fPrecio','fImg','fDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('editId').value       = '';
  document.getElementById('fMarca').value       = '';
  document.getElementById('fCategoria').value   = 'Facial';
  document.getElementById('fStock').value       = '';
  document.getElementById('fBadge').value       = '';
  ['err-nombre','err-precio'].forEach(id => document.getElementById(id).textContent = '');
}

function abrirModalNuevo() {
  limpiarForm();
  document.getElementById('modalFormTitle').textContent = 'Nuevo producto';
  document.getElementById('modalForm').classList.remove('hidden');
}

function abrirModalEditar(id) {
  const p = productos.find(p => p.id === id);
  if (!p) return;
  limpiarForm();
  document.getElementById('modalFormTitle').textContent = 'Editar producto';
  document.getElementById('editId').value     = p.id;
  document.getElementById('fNombre').value    = p.nombre;
  document.getElementById('fMarca').value     = p.marca || '';
  document.getElementById('fCategoria').value = p.categoria || 'Facial';
  document.getElementById('fPrecio').value    = p.precio;
  document.getElementById('fStock').value     = p.stock_cantidad ?? 0;
  document.getElementById('fBadge').value     = p.badge || '';
  document.getElementById('fImg').value       = p.imagen || '';
  document.getElementById('fDesc').value      = p.descripcion || '';
  document.getElementById('modalForm').classList.remove('hidden');
}

function guardarProducto() {
  const nombre = document.getElementById('fNombre').value.trim();
  const precio = parseFloat(document.getElementById('fPrecio').value);
  let valido   = true;

  document.getElementById('err-nombre').textContent = '';
  document.getElementById('err-precio').textContent = '';

  if (!nombre)                { document.getElementById('err-nombre').textContent = 'El nombre es obligatorio'; valido = false; }
  if (!precio || precio <= 0) { document.getElementById('err-precio').textContent = 'Ingresá un precio válido'; valido = false; }
  if (!valido) return;

  const data = {
    nombre,
    marca:          document.getElementById('fMarca').value || null,
    categoria:      document.getElementById('fCategoria').value,
    precio,
    stock_cantidad: parseInt(document.getElementById('fStock').value) || 0,
    badge:          document.getElementById('fBadge').value || null,
    imagen:         document.getElementById('fImg').value.trim(),
    descripcion:    document.getElementById('fDesc').value.trim(),
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
    if (!res.ok) { showToast('Error al guardar'); return; }
    showToast(editId ? 'Producto actualizado' : 'Producto creado');
    cerrarModal('modalForm');
    cargarProductos();
  })
  .catch(() => showToast('Error de conexión con el servidor'));
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
    if (!res.ok) { showToast('Error al eliminar'); return; }
    cerrarModal('modalEliminar');
    showToast('Producto eliminado');
    cargarProductos();
  })
  .catch(() => showToast('Error de conexión con el servidor'));
}

function cerrarModal(id) { document.getElementById(id).classList.add('hidden'); }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function cerrarSesion() {
  sessionStorage.removeItem('adminSesion');
  window.location.href = 'admin-login.html';
}
