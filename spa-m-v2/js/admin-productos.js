/* SPA M — admin-productos.js */

if (!sessionStorage.getItem('adminSesion')) window.location.href = 'admin-login.html';

const PRODUCTOS_DEFAULT = [
  { id:1, stockQty:50, nombre:'Crema Hidratante',   categoria:'Facial',   precio:500,  stock:true,  badge:'nuevo',  badgeText:'Nuevo',  desc:'Hidratación profunda con ácido hialurónico.',      img:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=300' },
  { id:2, nombre:'Aceite de Lavanda',  categoria:'Facial',   precio:500,  stock:true,  badge:null,     badgeText:'',       desc:'Aceite esencial para piel mixta.',                 img:'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300' },
  { id:3, nombre:'Sérum de Crecimiento',categoria:'Capilar', precio:500,  stock:false, badge:null,     badgeText:'',       desc:'Estimula el crecimiento con biotina.',             img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300' },
  { id:4, nombre:'Kit Capilar',        categoria:'Capilar',  precio:800,  stock:true,  badge:'oferta', badgeText:'Oferta', desc:'Shampoo + acondicionador + mascarilla.',           img:'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=300' },
  { id:5, nombre:'Aceite de Coco',     categoria:'Corporal', precio:600,  stock:true,  badge:null,     badgeText:'',       desc:'Aceite 100% natural para cuerpo y cabello.',      img:'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=300' },
  { id:6, nombre:'Bálsamo Natural',    categoria:'Corporal', precio:450,  stock:true,  badge:null,     badgeText:'',       desc:'Hidratación intensa con karité y argán.',         img:'https://images.unsplash.com/photo-1585386959984-a41552231658?w=300' },
  { id:7, nombre:'Mascarilla Facial',  categoria:'Facial',   precio:650,  stock:true,  badge:'nuevo',  badgeText:'Nuevo',  desc:'Mascarilla purificante de arcilla blanca.',        img:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300' },
  { id:8, nombre:'Contorno de Ojos',   categoria:'Facial',   precio:900,  stock:false, badge:null,     badgeText:'',       desc:'Reduce ojeras con vitamina C y péptidos.',        img:'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300' },
  { id:9, nombre:'Exfoliante Corporal',categoria:'Corporal', precio:550,  stock:true,  badge:null,     badgeText:'',       desc:'Azúcar y aceites naturales. Piel renovada.',      img:'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=300' },
];

let productos  = JSON.parse(localStorage.getItem('adminProductos')) || PRODUCTOS_DEFAULT;
let eliminarId = null;

document.addEventListener('DOMContentLoaded', () => { renderTabla(productos); });

function guardarLS() { localStorage.setItem('adminProductos', JSON.stringify(productos)); }

function renderTabla(lista) {
  const tbody = document.getElementById('productosBody');
  tbody.innerHTML = '';
  lista.forEach(p => {
    const qty = p.stockQty ?? (p.stock ? 10 : 0);
    const stockBadge = qty > 0
      ? `<span class="badge badge-stock">Stock: ${qty}</span>`
      : `<span class="badge badge-sin-stock">Sin stock</span>`;
    tbody.innerHTML += `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.8rem">
            <img src="${p.img}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0"/>
            <div><strong>${p.nombre}</strong>${p.badge ? `<br><span class="td-light">${p.badgeText}</span>` : ''}</div>
          </div>
        </td>
        <td class="td-light">${p.categoria}</td>
        <td><strong>$${p.precio.toLocaleString()}</strong></td>
        <td>${stockBadge}</td>
        <td>
          <div style="display:flex;gap:0.4rem">
            <button class="btn-icon" onclick="abrirModalEditar(${p.id})">✏️</button>
            <button class="btn-icon danger" onclick="abrirModalEliminar(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
  });
}

function filtrar() {
  const q     = document.getElementById('searchInput').value.toLowerCase();
  const cat   = document.getElementById('filterCat').value;
  const stock = document.getElementById('filterStock').value;

  const resultado = productos.filter(p => {
    const matchQ     = p.nombre.toLowerCase().includes(q);
    const matchCat   = cat === 'todas' || p.categoria === cat;
    const matchStock = stock === 'todos' || (stock === 'con' ? p.stock : !p.stock);
    return matchQ && matchCat && matchStock;
  });
  renderTabla(resultado);
}

function limpiarForm() {
  ['fNombre','fPrecio','fImg','fDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('editId').value       = '';
  document.getElementById('fCategoria').value   = 'Facial';
  document.getElementById('fStock').value       = 'true';
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
  document.getElementById('fCategoria').value = p.categoria;
  document.getElementById('fPrecio').value    = p.precio;
  document.getElementById('fStock').value     = p.stockQty ?? (p.stock ? 10 : 0);
  document.getElementById('fBadge').value     = p.badge || '';
  document.getElementById('fImg').value       = p.img || '';
  document.getElementById('fDesc').value      = p.desc || '';
  document.getElementById('modalForm').classList.remove('hidden');
}

function guardarProducto() {
  const nombre = document.getElementById('fNombre').value.trim();
  const precio = parseInt(document.getElementById('fPrecio').value);
  let valido   = true;

  document.getElementById('err-nombre').textContent = '';
  document.getElementById('err-precio').textContent = '';

  if (!nombre)               { document.getElementById('err-nombre').textContent = 'El nombre es obligatorio'; valido = false; }
  if (!precio || precio <= 0){ document.getElementById('err-precio').textContent = 'Ingresá un precio válido'; valido = false; }
  if (!valido) return;

  const badgeVal  = document.getElementById('fBadge').value;
  const badgeText = badgeVal === 'nuevo' ? 'Nuevo' : badgeVal === 'oferta' ? 'Oferta' : '';

  const data = {
    nombre,
    categoria: document.getElementById('fCategoria').value,
    precio,
    stockQty:  parseInt(document.getElementById('fStock').value) || 0,
    stock:     (parseInt(document.getElementById('fStock').value) || 0) > 0,
    badge:     badgeVal || null,
    badgeText,
    img:       document.getElementById('fImg').value.trim(),
    desc:      document.getElementById('fDesc').value.trim(),
  };

  const editId = document.getElementById('editId').value;
  if (editId) {
    const idx = productos.findIndex(p => p.id === parseInt(editId));
    if (idx !== -1) productos[idx] = { ...productos[idx], ...data };
    showToast('✅ Producto actualizado');
  } else {
    const maxId = productos.reduce((m, p) => Math.max(m, p.id), 0);
    productos.push({ id: maxId + 1, ...data });
    showToast('✅ Producto creado');
  }

  guardarLS();
  cerrarModal('modalForm');
  renderTabla(productos);
}

function abrirModalEliminar(id) {
  eliminarId = id;
  document.getElementById('modalEliminar').classList.remove('hidden');
}

function confirmarEliminar() {
  productos = productos.filter(p => p.id !== eliminarId);
  guardarLS();
  cerrarModal('modalEliminar');
  renderTabla(productos);
  showToast('🗑️ Producto eliminado');
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
