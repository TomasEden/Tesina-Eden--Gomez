/* SPA M - index.js */

const SERVICIOS_DESTACADOS = [
  { nombre: 'Masaje Relajante',  descripcion: 'Técnica sueca de 60 min para liberar tensiones.', duracion: '60 min', precio: 5000, img: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80' },
  { nombre: 'Tratamiento Facial', descripcion: 'Limpieza profunda e hidratación intensiva.',       duracion: '30 min', precio: 3000, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80' },
  { nombre: 'Jacuzzi Privado',   descripcion: 'Sesión privada de relajación en jacuzzi.',          duracion: '80 min', precio: 5000, img: 'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=600&q=80' }
];

const PRODUCTOS_DESTACADOS = [
  { id: 1, nombre: 'Crema Hidratante',    categoria: 'Facial · Piel Seca',  precio: 500, stock: true,  img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80' },
  { id: 2, nombre: 'Aceite de Lavanda',   categoria: 'Facial · Piel Mixta', precio: 500, stock: true,  img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
  { id: 3, nombre: 'Serum de Crecimiento',categoria: 'Capilar',             precio: 500, stock: false, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80' },
  { id: 4, nombre: 'Kit Capilar',         categoria: 'Cuidado Completo',    precio: 800, stock: true,  img: 'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=400&q=80' }
];

window.addEventListener('scroll', function() {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function renderServicios() {
  var grid = document.getElementById('serviciosGrid');
  if (!grid) return;
  grid.innerHTML = '';
  SERVICIOS_DESTACADOS.forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML =
      '<img class="service-img" src="' + s.img + '" alt="' + s.nombre + '"/>' +
      '<div class="service-body">' +
        '<div class="service-meta">' +
          '<span class="service-duration">&#9203; ' + s.duracion + '</span>' +
          (function() {
          var oferta = (typeof getOfertaParaItem === 'function') ? getOfertaParaItem(s.nombre, 'servicio') : null;
          return '<span class="service-price">' + (oferta ? getPrecioHTML(s.precio, oferta) : '$' + s.precio.toLocaleString()) + '</span>';
        })() +
        '</div>' +
        '<h3 class="service-name">' + s.nombre + '</h3>' +
        '<p class="service-desc">' + s.descripcion + '</p>' +
        '<a href="turnos.html?servicio=' + encodeURIComponent(s.nombre) + '" class="btn-reservar">Reservar turno</a>' +
      '</div>';
    grid.appendChild(card);
  });
}

function renderProductos() {
  var grid = document.getElementById('productosGrid');
  if (!grid) return;
  grid.innerHTML = '';
  PRODUCTOS_DESTACADOS.forEach(function(p) {
    var card = document.createElement('div');
    card.className = 'product-card';
    var btnHTML = p.stock
      ? '<button class="btn-add" onclick="agregarProducto(\'' + p.nombre + '\',' + p.precio + ',\'' + p.img + '\')">+ Carrito</button>'
      : '<button class="btn-add sin-stock" disabled>Sin stock</button>';
    card.innerHTML =
      '<a href="producto-detalle.html?id=' + p.id + '" style="display:block;text-decoration:none">' +
        '<img class="product-img" src="' + p.img + '" alt="' + p.nombre + '"/>' +
      '</a>' +
      '<div class="product-body">' +
        '<p class="product-cat">' + p.categoria + '</p>' +
        '<h3 class="product-name">' +
          '<a href="producto-detalle.html?id=' + p.id + '" style="text-decoration:none;color:inherit">' + p.nombre + '</a>' +
        '</h3>' +
        '<div class="product-footer">' +
          (function() {
            var of = (typeof getOfertaParaItem === 'function') ? getOfertaParaItem(p.nombre, 'producto') : null;
            return '<span class="product-price">' + (of ? getPrecioHTML(p.precio, of) : '$' + p.precio.toLocaleString()) + '</span>';
          })() +
          btnHTML +
        '</div>' +
      '</div>';
    grid.appendChild(card);
  });
}

function agregarProducto(nombre, precio, img) {
  if (!requireSesion('agregar productos al carrito')) return;
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.push({ nombre: nombre, precio: precio, tipo: 'producto', img: img });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarNavbar();
  showToast(nombre + ' agregado al carrito');
}

function enviarConsulta() {
  showToast('Mensaje enviado! Te contactamos pronto');
}

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  renderServicios();
  renderProductos();
  // Actualizar ticker con ofertas activas del admin
  if (typeof actualizarTickerOfertas === 'function') {
    actualizarTickerOfertas();
  }
});
