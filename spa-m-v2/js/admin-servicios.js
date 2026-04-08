/* SPA M — admin-servicios.js */

if (!sessionStorage.getItem('adminSesion')) window.location.href = 'admin-login.html';

const SERVICIOS_DEFAULT = [
  { id: 1, nombre: 'Masaje Relajante',           categoria: 'Masajes',        duracion: 60, precio: 5000, desc: 'Técnica sueca de cuerpo completo.', img: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=300' },
  { id: 2, nombre: 'Masaje con Piedras Calientes',categoria: 'Masajes',        duracion: 75, precio: 6500, desc: 'Piedras volcánicas de basalto.',      img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300'  },
  { id: 3, nombre: 'Tratamiento Facial Premium',  categoria: 'Faciales',       duracion: 30, precio: 3000, desc: 'Limpieza profunda e hidratación.',    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300'},
  { id: 4, nombre: 'Facial Anti-Age',             categoria: 'Faciales',       duracion: 45, precio: 4500, desc: 'Reafirmante con ácido hialurónico.',  img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300'},
  { id: 5, nombre: 'Jacuzzi Privado',             categoria: 'Spa & Relax',    duracion: 80, precio: 5000, desc: 'Hidroterapia con sales minerales.',   img: 'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=300'},
  { id: 6, nombre: 'Aromaterapia',                categoria: 'Spa & Relax',    duracion: 50, precio: 4000, desc: 'Masaje con aceites esenciales.',      img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300'},
  { id: 7, nombre: 'Manicura & Pedicura',         categoria: 'Uñas & Estética',duracion: 45, precio: 2500, desc: 'Cuidado completo de manos y pies.',   img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300'},
  { id: 8, nombre: 'Depilación con Cera',         categoria: 'Uñas & Estética',duracion: 40, precio: 2000, desc: 'Depilación profesional duradera.',    img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300'},
  { id: 9, nombre: 'Reflexología Podal',          categoria: 'Masajes',        duracion: 40, precio: 3500, desc: 'Presión en puntos reflejos del pie.', img: 'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=300'},
];

let servicios  = JSON.parse(localStorage.getItem('adminServicios')) || SERVICIOS_DEFAULT;
let eliminarId = null;

document.addEventListener('DOMContentLoaded', () => { renderTabla(servicios); });

function guardarLS() { localStorage.setItem('adminServicios', JSON.stringify(servicios)); }

function renderTabla(lista) {
  const tbody = document.getElementById('serviciosBody');
  tbody.innerHTML = '';
  lista.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${s.nombre}</strong><br><span class="td-light">${s.desc?.substring(0,45)}...</span></td>
        <td class="td-light">${s.categoria}</td>
        <td class="td-light">⏱ ${s.duracion} min</td>
        <td><strong>$${s.precio.toLocaleString()}</strong></td>
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
  renderTabla(servicios.filter(s => s.nombre.toLowerCase().includes(q) || s.categoria.toLowerCase().includes(q)));
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
  document.getElementById('fCategoria').value = s.categoria;
  document.getElementById('fDuracion').value = s.duracion;
  document.getElementById('fPrecio').value   = s.precio;
  document.getElementById('fImg').value      = s.img || '';
  document.getElementById('fDesc').value     = s.desc || '';
  document.getElementById('modalForm').classList.remove('hidden');
}

function guardarServicio() {
  const nombre   = document.getElementById('fNombre').value.trim();
  const duracion = parseInt(document.getElementById('fDuracion').value);
  const precio   = parseInt(document.getElementById('fPrecio').value);
  let valido = true;

  document.getElementById('err-nombre').textContent   = '';
  document.getElementById('err-duracion').textContent = '';
  document.getElementById('err-precio').textContent   = '';

  if (!nombre)          { document.getElementById('err-nombre').textContent   = 'El nombre es obligatorio'; valido = false; }
  if (!duracion || duracion <= 0) { document.getElementById('err-duracion').textContent = 'Ingresá una duración válida'; valido = false; }
  if (!precio   || precio <= 0)   { document.getElementById('err-precio').textContent   = 'Ingresá un precio válido';   valido = false; }
  if (!valido) return;

  const data = {
    nombre,
    categoria: document.getElementById('fCategoria').value,
    duracion,
    precio,
    img:  document.getElementById('fImg').value.trim(),
    desc: document.getElementById('fDesc').value.trim(),
  };

  const editId = document.getElementById('editId').value;
  if (editId) {
    const idx = servicios.findIndex(s => s.id === parseInt(editId));
    if (idx !== -1) servicios[idx] = { ...servicios[idx], ...data };
    showToast('✅ Servicio actualizado');
  } else {
    const maxId = servicios.reduce((m, s) => Math.max(m, s.id), 0);
    servicios.push({ id: maxId + 1, ...data });
    showToast('✅ Servicio creado');
  }

  guardarLS();
  cerrarModal('modalForm');
  renderTabla(servicios);
}

function abrirModalEliminar(id) {
  eliminarId = id;
  document.getElementById('modalEliminar').classList.remove('hidden');
}

function confirmarEliminar() {
  servicios = servicios.filter(s => s.id !== eliminarId);
  guardarLS();
  cerrarModal('modalEliminar');
  renderTabla(servicios);
  showToast('🗑️ Servicio eliminado');
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
