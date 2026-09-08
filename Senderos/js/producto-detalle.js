/* SPA M - producto-detalle.js */

var cantidad = 1;
var productoActual = null;
var favs = JSON.parse(localStorage.getItem('favs')) || [];

var PRODUCTOS_BASE = [
  { id:1, nombre:'Crema Hidratante',     categoria:'Facial - Piel Seca',    precio:500,  stockQty:50, stock:true,  badge:'Nuevo',  img:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80', desc:'Formula enriquecida con acido hialuronico y vitamina E para hidratacion profunda. Ideal para piel seca o sensible. Sin parabenos, sin sulfatos.' },
  { id:2, nombre:'Aceite de Lavanda',    categoria:'Facial - Piel Mixta',   precio:500,  stockQty:30, stock:true,  badge:null,     img:'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80', desc:'Aceite esencial 100% puro que equilibra y calma la piel mixta. Propiedades relajantes y antiinflamatorias.' },
  { id:3, nombre:'Serum de Crecimiento', categoria:'Capilar',               precio:500,  stockQty:0,  stock:false, badge:null,     img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80', desc:'Estimula el foliculo piloso con biotina, pantenol y extractos vegetales para un cabello mas denso.' },
  { id:4, nombre:'Kit Capilar',          categoria:'Cuidado Completo',      precio:800,  stockQty:15, stock:true,  badge:'Oferta', img:'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=800&q=80', desc:'Set completo: shampoo + acondicionador + mascarilla capilar nutritiva. Para todo tipo de cabello.' },
  { id:5, nombre:'Aceite de Coco',       categoria:'Corporal - Natural',    precio:600,  stockQty:22, stock:true,  badge:null,     img:'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80', desc:'Aceite 100% natural prensado en frio. Hidrata cuerpo, cabello y cuticulas. Sin aditivos.' },
  { id:6, nombre:'Balsamo Natural',      categoria:'Corporal - Hidratacion',precio:450,  stockQty:18, stock:true,  badge:null,     img:'https://images.unsplash.com/photo-1585386959984-a41552231658?w=800&q=80', desc:'Hidratacion intensa con manteca de karite y aceite de argan. Para pieles muy secas.' },
  { id:7, nombre:'Mascarilla Facial',    categoria:'Facial - Todo tipo',    precio:650,  stockQty:40, stock:true,  badge:'Nuevo',  img:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80', desc:'Mascarilla purificante de arcilla blanca que limpia poros en profundidad sin resecar.' },
  { id:8, nombre:'Contorno de Ojos',     categoria:'Facial - Antiage',      precio:900,  stockQty:0,  stock:false, badge:null,     img:'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', desc:'Reduce ojeras y bolsas con vitamina C y peptidos de accion reafirmante.' },
  { id:9, nombre:'Exfoliante Corporal',  categoria:'Corporal - Renovacion', precio:550,  stockQty:12, stock:true,  badge:null,     img:'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=800&q=80', desc:'Mezcla de azucar morena y aceites naturales que elimina celulas muertas y suaviza la piel.' }
];

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  var params = new URLSearchParams(window.location.search);
  var id = parseInt(params.get('id'));
  if (id) cargarProducto(id);
  window.addEventListener('scroll', function() {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function cargarProducto(id) {
  var adminProds = JSON.parse(localStorage.getItem('adminProductos'));
  var p = PRODUCTOS_BASE.find(function(x) { return x.id === id; });
  if (!p) { window.location.href = 'productos.html'; return; }
  if (adminProds) {
    var admin = adminProds.find(function(a) { return a.id === id; });
    if (admin) p = Object.assign({}, p, admin);
  }
  productoActual = p;

  document.title = p.nombre + ' - SPA M';
  document.getElementById('imgPrincipal').src    = p.img;
  document.getElementById('imgPrincipal').alt    = p.nombre;
  document.getElementById('detalleName').textContent   = p.nombre;
  document.getElementById('detalleCat').textContent    = p.categoria;
  document.getElementById('detallePrecio').textContent = '$' + p.precio.toLocaleString();
  document.getElementById('detalleDesc').textContent   = p.desc || '';

  var stockEl = document.getElementById('detalleStock');
  if (p.stock && p.stockQty > 0) {
    stockEl.textContent = '✅ ' + p.stockQty + ' disponibles';
    stockEl.className   = 'detalle-stock';
  } else {
    stockEl.textContent = '❌ Sin stock';
    stockEl.className   = 'detalle-stock sin-stock';
    var btnAgregar = document.getElementById('btnAgregar');
    if (btnAgregar) { btnAgregar.disabled = true; btnAgregar.textContent = 'Sin stock'; }
  }

  var badge = document.getElementById('productoBadge');
  if (badge) {
    if (p.badge) { badge.textContent = p.badge; badge.style.display = ''; }
    else          { badge.style.display = 'none'; }
  }
  actualizarBtnFav();
}

function cambiarImg(miniEl, src) {
  document.getElementById('imgPrincipal').src = src;
  document.querySelectorAll('.miniatura').forEach(function(m) { m.classList.remove('active'); });
  miniEl.classList.add('active');
}

function cambiarQty(delta) {
  var max = productoActual ? (productoActual.stockQty || 99) : 99;
  cantidad = Math.max(1, Math.min(max, cantidad + delta));
  document.getElementById('qtyNum').textContent = cantidad;
}

function agregarAlCarrito() {
  if (!requireSesion('agregar productos al carrito')) return;
  if (!productoActual || !productoActual.stock) return;
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  for (var i = 0; i < cantidad; i++) {
    carrito.push({ nombre: productoActual.nombre, precio: productoActual.precio, tipo: 'producto', img: productoActual.img });
  }
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarNavbar();
  showToast(cantidad + 'x ' + productoActual.nombre + ' agregado al carrito');
}

function toggleFav() {
  if (!productoActual) return;
  var idx = favs.indexOf(productoActual.id);
  if (idx === -1) { favs.push(productoActual.id);  showToast('Guardado en favoritos'); }
  else            { favs.splice(idx, 1);             showToast('Quitado de favoritos'); }
  localStorage.setItem('favs', JSON.stringify(favs));
  actualizarBtnFav();
}

function actualizarBtnFav() {
  var btn = document.getElementById('btnFav');
  if (!btn || !productoActual) return;
  var esFav = favs.indexOf(productoActual.id) !== -1;
  btn.textContent = esFav ? '❤️' : '🤍';
  btn.classList.toggle('activo', esFav);
}

function cambiarTab(btn, tabId) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}
