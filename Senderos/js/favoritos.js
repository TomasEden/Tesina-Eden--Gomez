/* Senderos — favoritos.js */

// Obtener productos desde la misma fuente que productos.js
// Prioridad: admin > PRODUCTOS global > fallback vacío
function getProductosBase() {
  var adminProds = JSON.parse(localStorage.getItem('adminProductos') || 'null');
  if (adminProds) return adminProds;
  if (typeof PRODUCTOS !== 'undefined') return PRODUCTOS;
  return [];
}

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  renderFavoritos();
  window.addEventListener('scroll', function() {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function renderFavoritos() {
  var favIds   = JSON.parse(localStorage.getItem('favs')) || [];
  var todos    = getProductosBase();
  var lista    = todos.filter(function(p) { return favIds.indexOf(p.id) !== -1; });

  var grid  = document.getElementById('favGrid');
  var empty = document.getElementById('favEmpty');
  grid.innerHTML = '';

  if (!lista.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  lista.forEach(function(p) {
    var card = document.createElement('div');
    card.className = 'product-card';
    var btnHTML = p.stock
      ? '<button class="btn-add" onclick="agregarAlCarrito(' + p.id + ',' + p.precio + ',\'' + p.nombre + '\',\'' + p.img + '\')">+ Carrito</button>'
      : '<button class="btn-add disabled" disabled>Sin stock</button>';

    card.innerHTML =
      '<a href="producto-detalle.html?id=' + p.id + '" style="display:block;text-decoration:none">' +
        '<img class="product-img" src="' + p.img + '" alt="' + p.nombre + '"/>' +
      '</a>' +
      '<div class="product-body">' +
        '<p class="product-cat">' + p.categoria + '</p>' +
        '<h3 class="product-name"><a href="producto-detalle.html?id=' + p.id + '" style="text-decoration:none;color:inherit">' + p.nombre + '</a></h3>' +
        '<div class="product-footer">' +
          '<span class="product-price">$' + p.precio.toLocaleString() + '</span>' +
          '<div style="display:flex;gap:0.4rem">' +
            btnHTML +
            '<button class="btn-add" style="background:var(--sand);color:var(--text-light)" onclick="quitarFav(' + p.id + ')" title="Quitar de favoritos">' +
              '<img src="../img/icons/favorito-on.png" alt="" width="14" height="14"/>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    grid.appendChild(card);
  });
}

function quitarFav(id) {
  var favs = JSON.parse(localStorage.getItem('favs')) || [];
  var idx  = favs.indexOf(id);
  if (idx !== -1) favs.splice(idx, 1);
  localStorage.setItem('favs', JSON.stringify(favs));
  renderFavoritos();
  showToast('Quitado de favoritos');
}

function agregarAlCarrito(id, precio, nombre, img) {
  if (!requireSesion('agregar productos al carrito')) return;
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.push({ id:id, nombre:nombre, precio:precio, tipo:'producto', img:img });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarNavbar();
  showToast(nombre + ' agregado al carrito');
}
