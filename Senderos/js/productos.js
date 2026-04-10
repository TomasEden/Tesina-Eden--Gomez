/* SPA M - productos.js */

var PRODUCTOS = [
  { id:1, nombre:'Crema Hidratante',    categoria:'Facial',  precio:500,  stockQty:50, stock:true,  badge:'nuevo',  badgeText:'Nuevo',  desc:'Hidratacion profunda con acido hialuronico y vitamina E. Ideal para piel seca.',  img:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=80' },
  { id:2, nombre:'Aceite de Lavanda',   categoria:'Facial',  precio:500,  stockQty:30, stock:true,  badge:null,     badgeText:'',       desc:'Aceite esencial para piel mixta. Equilibra y calma la piel sensible.',            img:'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80' },
  { id:3, nombre:'Serum de Crecimiento',categoria:'Capilar', precio:500,  stockQty:0,  stock:false, badge:null,     badgeText:'',       desc:'Estimula el crecimiento del cabello con biotina y extractos naturales.',          img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80' },
  { id:4, nombre:'Kit Capilar',         categoria:'Capilar', precio:800,  stockQty:15, stock:true,  badge:'oferta', badgeText:'Oferta', desc:'Shampoo + acondicionador + mascarilla. Cuidado completo para tu cabello.',        img:'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=500&q=80' },
  { id:5, nombre:'Aceite de Coco',      categoria:'Corporal',precio:600,  stockQty:22, stock:true,  badge:null,     badgeText:'',       desc:'Aceite 100% natural para hidratacion corporal y capilar.',                       img:'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=500&q=80' },
  { id:6, nombre:'Balsamo Natural',     categoria:'Corporal',precio:450,  stockQty:18, stock:true,  badge:null,     badgeText:'',       desc:'Hidratacion intensa con manteca de karite y aceite de argan.',                   img:'https://images.unsplash.com/photo-1585386959984-a41552231658?w=500&q=80' },
  { id:7, nombre:'Mascarilla Facial',   categoria:'Facial',  precio:650,  stockQty:40, stock:true,  badge:'nuevo',  badgeText:'Nuevo',  desc:'Mascarilla purificante de arcilla blanca. Para todo tipo de piel.',              img:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80' },
  { id:8, nombre:'Contorno de Ojos',    categoria:'Facial',  precio:900,  stockQty:0,  stock:false, badge:null,     badgeText:'',       desc:'Reduce ojeras y bolsas con vitamina C y peptidos activos.',                      img:'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500&q=80' },
  { id:9, nombre:'Exfoliante Corporal', categoria:'Corporal',precio:550,  stockQty:12, stock:true,  badge:null,     badgeText:'',       desc:'Exfoliante con azucar y aceites naturales. Piel suave y renovada.',              img:'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=500&q=80' }
];

var filtroCategoria = 'todas';

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  renderCategorias();
  filtrarProductos();
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

function renderCategorias() {
  var cats = ['todas'];
  PRODUCTOS.forEach(function(p) { if (cats.indexOf(p.categoria) === -1) cats.push(p.categoria); });
  var container = document.getElementById('filterCategorias');
  if (!container) return;
  container.innerHTML = '';
  cats.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.className = 'filter-chip' + (cat === 'todas' ? ' active' : '');
    btn.textContent = cat === 'todas' ? 'Todas' : cat;
    btn.dataset.cat = cat;
    btn.addEventListener('click', function() {
      filtroCategoria = cat;
      document.querySelectorAll('.filter-chip').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      filtrarProductos();
    });
    container.appendChild(btn);
  });
}

function filtrarProductos() {
  var precioMax = parseInt(document.getElementById('rangePrecio').value);
  var soloStock = document.getElementById('soloStock').checked;
  var orden     = document.getElementById('sortSelect').value;

  document.getElementById('rangeValor').textContent = '$' + precioMax.toLocaleString();

  // Sincronizar con cambios del admin
  var adminProds = JSON.parse(localStorage.getItem('adminProductos'));
  var lista = PRODUCTOS.map(function(p) {
    if (adminProds) {
      var admin = adminProds.find(function(a) { return a.id === p.id; });
      if (admin) return Object.assign({}, p, { stockQty: admin.stockQty, stock: admin.stock, precio: admin.precio });
    }
    return p;
  });

  lista = lista.filter(function(p) {
    if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
    if (p.precio > precioMax) return false;
    if (soloStock && !p.stock) return false;
    return true;
  });

  if (orden === 'precio-asc')  lista.sort(function(a,b) { return a.precio - b.precio; });
  if (orden === 'precio-desc') lista.sort(function(a,b) { return b.precio - a.precio; });
  if (orden === 'nombre')      lista.sort(function(a,b) { return a.nombre.localeCompare(b.nombre); });

  renderProductos(lista);
}

function renderProductos(lista) {
  var grid  = document.getElementById('productsGrid');
  var empty = document.getElementById('emptyState');
  var count = document.getElementById('catalogCount');
  grid.innerHTML = '';

  if (!lista.length) {
    empty.classList.remove('hidden');
    count.textContent = 'Sin resultados';
    return;
  }

  empty.classList.add('hidden');
  count.textContent = lista.length + ' producto' + (lista.length !== 1 ? 's' : '');

  lista.forEach(function(p, i) {
    var qty = typeof p.stockQty === 'number' ? p.stockQty : (p.stock ? 99 : 0);
    var card = document.createElement('div');
    card.className = 'product-card' + (!p.stock || qty === 0 ? ' sin-stock' : '');
    card.style.animationDelay = (i * 0.06) + 's';

    // Verificar si hay oferta activa para este producto
    var oferta = (typeof getOfertaParaItem === 'function') ? getOfertaParaItem(p.nombre, 'producto') : null;

    var badgeHTML = '';
    if (!p.stock || qty === 0) {
      badgeHTML = '<span class="product-badge sin-stock-badge">Sin stock</span>';
    } else if (oferta) {
      badgeHTML = getBadgeOferta(oferta);
    } else if (p.badge) {
      badgeHTML = '<span class="product-badge ' + p.badge + '">' + p.badgeText + '</span>';
    }

    var stockInfo = (qty > 0 && qty < 99) ? '<span style="font-size:0.65rem;color:var(--text-light);display:block;text-align:right">' + qty + ' disponibles</span>' : '';

    var btnHTML = (p.stock && qty > 0)
      ? '<button class="btn-add" onclick="agregarAlCarrito(' + p.id + ')">+ Carrito</button>'
      : '<button class="btn-add disabled" disabled>Sin stock</button>';

    card.innerHTML =
      '<a href="producto-detalle.html?id=' + p.id + '" class="product-img-wrap" style="display:block;text-decoration:none">' +
        '<img class="product-img" src="' + p.img + '" alt="' + p.nombre + '"/>' +
        badgeHTML +
      '</a>' +
      '<div class="product-body">' +
        '<p class="product-cat">' + p.categoria + '</p>' +
        '<h3 class="product-name"><a href="producto-detalle.html?id=' + p.id + '" style="text-decoration:none;color:inherit">' + p.nombre + '</a></h3>' +
        '<p class="product-desc">' + (p.desc || '') + '</p>' +
        '<div class="product-footer">' +
          '<span class="product-price">' + (oferta ? getPrecioHTML(p.precio, oferta) : '$' + p.precio.toLocaleString()) + '</span>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end">' + btnHTML + stockInfo + '</div>' +
        '</div>' +
      '</div>';
    grid.appendChild(card);
  });
}

function agregarAlCarrito(id) {
  if (!requireSesion('agregar productos al carrito')) return;
  var producto = PRODUCTOS.find(function(p) { return p.id === id; });
  if (!producto || !producto.stock) return;
  if (typeof producto.stockQty === 'number') {
    producto.stockQty = Math.max(0, producto.stockQty - 1);
    if (producto.stockQty === 0) producto.stock = false;
  }
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.push({ nombre: producto.nombre, precio: producto.precio, tipo: 'producto', img: producto.img });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarNavbar();
  filtrarProductos();
  showToast('🛒 ' + producto.nombre + ' agregado al carrito');
}

function resetFiltros() {
  filtroCategoria = 'todas';
  document.getElementById('rangePrecio').value = 1500;
  document.getElementById('rangeValor').textContent = '$1500';
  document.getElementById('soloStock').checked = false;
  document.getElementById('sortSelect').value = 'default';
  document.querySelectorAll('.filter-chip').forEach(function(b) {
    b.classList.toggle('active', b.dataset.cat === 'todas');
  });
  filtrarProductos();
}
