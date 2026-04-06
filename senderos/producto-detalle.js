/* ═══════════════════════════════════════
   SPA M — producto-detalle.js
   ═══════════════════════════════════════ */

let cantidad = 1;
let productoActual = null;
let favs = JSON.parse(localStorage.getItem('favs')) || [];

document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();

  // Leer id de la URL: producto-detalle.html?id=1
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (id) cargarProducto(id);

  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});



`; btn.href = 'mis-turnos.html'; }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Cargar datos del producto por ID ────────────────────────────────────────
function cargarProducto(id) {
  // Primero buscar en adminProductos (si el admin editó algo)
  const adminProds = JSON.parse(localStorage.getItem('adminProductos'));
  const PRODUCTOS_BASE = [
    { id:1, nombre:'Crema Hidratante',    categoria:'Facial · Piel Seca',  precio:500,  stockQty:50, stock:true,  badge:'Nuevo', img:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80', desc:'Fórmula enriquecida con ácido hialurónico y vitamina E para hidratación profunda. Ideal para piel seca o sensible. Sin parabenos, sin sulfatos.' },
    { id:2, nombre:'Aceite de Lavanda',   categoria:'Facial · Piel Mixta', precio:500,  stockQty:30, stock:true,  badge:null,    img:'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80', desc:'Aceite esencial 100% puro que equilibra y calma la piel mixta. Propiedades relajantes y antiinflamatorias.' },
    { id:3, nombre:'Sérum de Crecimiento',categoria:'Capilar',             precio:500,  stockQty:0,  stock:false, badge:null,    img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80', desc:'Estimula el folículo piloso con biotina, pantenol y extractos vegetales para un cabello más denso.' },
    { id:4, nombre:'Kit Capilar',         categoria:'Cuidado Completo',    precio:800,  stockQty:15, stock:true,  badge:'Oferta',img:'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=800&q=80', desc:'Set completo: shampoo + acondicionador + mascarilla capilar nutritiva. Para todo tipo de cabello.' },
    { id:5, nombre:'Aceite de Coco',      categoria:'Corporal · Natural',  precio:600,  stockQty:22, stock:true,  badge:null,    img:'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80', desc:'Aceite 100% natural prensado en frío. Hidrata cuerpo, cabello y cutículas. Sin aditivos.' },
    { id:6, nombre:'Bálsamo Natural',     categoria:'Corporal · Hidratación',precio:450,stockQty:18, stock:true,  badge:null,    img:'https://images.unsplash.com/photo-1585386959984-a41552231658?w=800&q=80', desc:'Hidratación intensa con manteca de karité y aceite de argán. Para pieles muy secas.' },
    { id:7, nombre:'Mascarilla Facial',   categoria:'Facial · Todo tipo',  precio:650,  stockQty:40, stock:true,  badge:'Nuevo', img:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80', desc:'Mascarilla purificante de arcilla blanca que limpia poros en profundidad sin resecar.' },
    { id:8, nombre:'Contorno de Ojos',    categoria:'Facial · Antiage',    precio:900,  stockQty:0,  stock:false, badge:null,    img:'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', desc:'Reduce ojeras y bolsas con vitamina C y péptidos de acción reafirmante.' },
    { id:9, nombre:'Exfoliante Corporal', categoria:'Corporal · Renovación',precio:550, stockQty:12, stock:true,  badge:null,    img:'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=800&q=80', desc:'Mezcla de azúcar morena y aceites naturales que elimina células muertas y suaviza la piel.' },
  ];

  let p = PRODUCTOS_BASE.find(x => x.id === id);
  if (!p) { window.location.href = 'productos.html'; return; }

  // Sobreescribir con datos del admin si existen
  if (adminProds) {
    const admin = adminProds.find(a => a.id === id);
    if (admin) p = { ...p, ...admin };
  }

  productoActual = p;

  // Actualizar título de la página
  document.title = `${p.nombre} — 🌸 SPA M`;

  // Poblar la UI
  document.getElementById('imgPrincipal').src    = p.img;
  document.getElementById('imgPrincipal').alt    = p.nombre;
  document.getElementById('detalleName').textContent  = p.nombre;
  document.getElementById('detalleCat').textContent   = p.categoria;
  document.getElementById('detallePrecio').textContent = `$${p.precio.toLocaleString()}`;
  document.getElementById('detalleDesc').textContent   = p.desc || '';

  const stockEl = document.getElementById('detalleStock');
  if (p.stock && p.stockQty > 0) {
    stockEl.textContent = `✅ ${p.stockQty} disponibles`;
    stockEl.className   = 'detalle-stock';
  } else {
    stockEl.textContent = '❌ Sin stock';
    stockEl.className   = 'detalle-stock sin-stock';
    document.getElementById('btnAgregar').disabled = true;
    document.getElementById('btnAgregar').textContent = 'Sin stock';
  }

  const badge = document.getElementById('productoBadge');
  if (p.badge || p.badgeText) {
    badge.textContent = p.badgeText || p.badge;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  // Favorito
  actualizarBtnFav();
}

// ── Galería ─────────────────────────────────────────────────────────────────
function cambiarImg(miniEl, src) {
  document.getElementById('imgPrincipal').src = src;
  document.querySelectorAll('.miniatura').forEach(m => m.classList.remove('active'));
  miniEl.classList.add('active');
}

// ── Cantidad ────────────────────────────────────────────────────────────────
function cambiarQty(delta) {
  const max = productoActual?.stockQty ?? 99;
  cantidad = Math.max(1, Math.min(max, cantidad + delta));
  document.getElementById('qtyNum').textContent = cantidad;
}

// ── Agregar al carrito ──────────────────────────────────────────────────────
function agregarAlCarrito() {
  if (!requireSesion('agregar productos al carrito')) return;
  if (!productoActual || !productoActual.stock) return;

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  for (let i = 0; i < cantidad; i++) {
    carrito.push({
      nombre: productoActual.nombre,
      precio: productoActual.precio,
      tipo:   'producto',
      img:    productoActual.img
    });
  }
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContador();
  showToast(`🛒 ${cantidad}x ${productoActual.nombre} agregado${cantidad > 1 ? 's' : ''} al carrito`);
}

// ── Favoritos ────────────────────────────────────────────────────────────────
function toggleFav() {
  if (!productoActual) return;
  const idx = favs.indexOf(productoActual.id);
  if (idx === -1) { favs.push(productoActual.id); showToast('❤️ Guardado en favoritos'); }
  else            { favs.splice(idx, 1);           showToast('💔 Quitado de favoritos'); }
  localStorage.setItem('favs', JSON.stringify(favs));
  actualizarBtnFav();
}

function actualizarBtnFav() {
  const btn = document.getElementById('btnFav');
  if (!btn || !productoActual) return;
  const esFav = favs.includes(productoActual.id);
  btn.textContent = esFav ? '❤️' : '🤍';
  btn.classList.toggle('activo', esFav);
}

// ── Tabs ────────────────────────────────────────────────────────────────────
function cambiarTab(btn, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}
