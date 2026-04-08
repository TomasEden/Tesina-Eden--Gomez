/* SPA M - carrito.js */

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  render();
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

function agruparProductos(items) {
  var mapa = {};
  items.forEach(function(item, idx) {
    var key = item.nombre;
    if (!mapa[key]) {
      mapa[key] = Object.assign({}, item, { cantidad: 1, indices: [idx] });
    } else {
      mapa[key].cantidad++;
      mapa[key].indices.push(idx);
    }
  });
  return Object.values(mapa);
}

function render() {
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  var empty   = document.getElementById('cartEmpty');
  var summary = document.getElementById('cartSummary');

  document.getElementById('contador').textContent = carrito.length;

  if (!carrito.length) {
    empty.classList.remove('hidden');
    summary.style.display = 'none';
    return;
  }

  empty.classList.add('hidden');
  summary.style.display = '';

  var servicios = carrito.filter(function(i) { return i.tipo === 'servicio'; });
  var productos  = carrito.filter(function(i) { return i.tipo === 'producto'; });
  var productosAgrupados = agruparProductos(productos);

  renderSeccionServicios(servicios, carrito);
  renderSeccionProductos(productosAgrupados, carrito);
  renderResumen(servicios, productos);
}

function renderSeccionServicios(items, carritoCompleto) {
  var container = document.getElementById('seccionServicios');
  container.innerHTML = '';
  if (!items.length) return;

  var subtotal = items.reduce(function(s, i) { return s + i.precio; }, 0);

  var header = document.createElement('div');
  header.className = 'section-title-bar';
  header.innerHTML =
    '<h2>Servicios</h2>' +
    '<span class="section-count">' + items.length + '</span>' +
    '<span class="section-subtotal">Subtotal: $' + subtotal.toLocaleString() + '</span>';
  container.appendChild(header);

  items.forEach(function(item) {
    var realIndex = carritoCompleto.indexOf(item);
    var div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML =
      '<img class="item-img" src="' + (item.img || 'https://via.placeholder.com/72') + '" alt="' + item.nombre + '"/>' +
      '<div class="item-info">' +
        '<div class="item-name">' + item.nombre + '</div>' +
        '<div class="item-meta">' +
          (item.fecha   ? '&#128197; ' + item.fecha : '') +
          (item.horario ? ' &middot; ' + item.horario + ' hs' : '') +
        '</div>' +
      '</div>' +
      '<span class="item-price">$' + item.precio.toLocaleString() + '</span>' +
      '<button class="btn-remove" onclick="eliminarItem(' + realIndex + ')">&#10005;</button>';
    container.appendChild(div);
  });
}

function renderSeccionProductos(agrupados, carritoCompleto) {
  var container = document.getElementById('seccionProductos');
  container.innerHTML = '';
  if (!agrupados.length) return;

  var totalUnidades = agrupados.reduce(function(s, p) { return s + p.cantidad; }, 0);
  var subtotal      = agrupados.reduce(function(s, p) { return s + p.precio * p.cantidad; }, 0);

  var header = document.createElement('div');
  header.className = 'section-title-bar';
  header.innerHTML =
    '<h2>Productos</h2>' +
    '<span class="section-count">' + totalUnidades + '</span>' +
    '<span class="section-subtotal">Subtotal: $' + subtotal.toLocaleString() + '</span>';
  container.appendChild(header);

  agrupados.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML =
      '<img class="item-img" src="' + (item.img || 'https://via.placeholder.com/72') + '" alt="' + item.nombre + '"/>' +
      '<div class="item-info">' +
        '<div class="item-name">' + item.nombre + '</div>' +
        '<div class="item-meta">Producto</div>' +
      '</div>' +
      '<div class="item-qty">' +
        '<button class="qty-btn" onclick="cambiarCantidad(\'' + item.nombre.replace(/'/g, "\\'") + '\',-1)">&#8722;</button>' +
        '<span class="qty-num">' + item.cantidad + '</span>' +
        '<button class="qty-btn" onclick="cambiarCantidad(\'' + item.nombre.replace(/'/g, "\\'") + '\',1)">&#43;</button>' +
      '</div>' +
      '<span class="item-price">$' + (item.precio * item.cantidad).toLocaleString() + '</span>' +
      '<button class="btn-remove" onclick="eliminarTodos(\'' + item.nombre.replace(/'/g, "\\'") + '\')">&#10005;</button>';
    container.appendChild(div);
  });
}

function cambiarCantidad(nombre, delta) {
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (delta === -1) {
    var idx = carrito.findIndex(function(i) { return i.nombre === nombre && i.tipo === 'producto'; });
    if (idx !== -1) carrito.splice(idx, 1);
  } else {
    var base = carrito.find(function(i) { return i.nombre === nombre && i.tipo === 'producto'; });
    if (base) carrito.push(Object.assign({}, base));
  }
  localStorage.setItem('carrito', JSON.stringify(carrito));
  render();
}

function eliminarTodos(nombre) {
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito = carrito.filter(function(i) { return !(i.nombre === nombre && i.tipo === 'producto'); });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  showToast('Producto eliminado');
  render();
}

function eliminarItem(index) {
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.splice(index, 1);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  showToast('Item eliminado');
  render();
}

function renderResumen(servicios, productos) {
  var lines   = document.getElementById('summaryLines');
  var totalEl = document.getElementById('totalGeneral');
  var btn     = document.getElementById('btnCheckout');
  lines.innerHTML = '';

  var totalServ = servicios.reduce(function(s, i) { return s + i.precio; }, 0);
  var totalProd = productos.reduce(function(s, i) { return s + i.precio; }, 0);
  var total     = totalServ + totalProd;

  if (servicios.length) {
    lines.innerHTML +=
      '<div class="summary-line"><span>Servicios (' + servicios.length + ')</span><strong>$' + totalServ.toLocaleString() + '</strong></div>';
  }
  if (productos.length) {
    lines.innerHTML +=
      '<div class="summary-line"><span>Productos (' + productos.length + ')</span><strong>$' + totalProd.toLocaleString() + '</strong></div>';
  }

  totalEl.textContent = '$' + total.toLocaleString();
  btn.disabled = total === 0;
}

function pagarTodo() {
  if (!requireSesion('completar la compra')) return;
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (!carrito.length) return;

  var totalServ = carrito.filter(function(i) { return i.tipo === 'servicio'; }).reduce(function(s,i) { return s + i.precio; }, 0);
  var totalProd = carrito.filter(function(i) { return i.tipo === 'producto'; }).reduce(function(s,i) { return s + i.precio; }, 0);
  var total     = totalServ + totalProd;

  // Guardar en historial
  var productos = agruparProductos(carrito.filter(function(i) { return i.tipo === 'producto'; }));
  var serviciosCarrito = carrito.filter(function(i) { return i.tipo === 'servicio'; });
  var todosItems = productos.map(function(p) { return { nombre: p.nombre, precio: p.precio, cantidad: p.cantidad, img: p.img }; })
    .concat(serviciosCarrito.map(function(s) { return { nombre: s.nombre, precio: s.precio, cantidad: 1, img: s.img }; }));
  guardarPedido(todosItems, total);

  // WA al admin si el toggle está activado
  var waCheck = document.getElementById('waClienteCheck');
  if (waCheck && waCheck.checked) {
    var sesion  = getSesion();
    var nombre  = sesion ? sesion.nombre + ' ' + (sesion.apellido || '') : 'Cliente';
    var telAdmin = '5493510000000';
    var lista   = carrito.map(function(i) { return '  - ' + i.nombre + ' $' + i.precio.toLocaleString(); }).join('\n');
    var msg     = 'Nuevo pedido de ' + nombre + '!\n\n' + lista + '\n\nTotal: $' + total.toLocaleString() + '\n\nPor favor avisarme cuando este listo';
    window.open('https://wa.me/' + telAdmin + '?text=' + encodeURIComponent(msg), '_blank');
  }

  document.getElementById('modalDesc').innerHTML =
    'Se proceso el pago por <strong>$' + total.toLocaleString() + '</strong>.<br>' +
    (totalServ ? 'Servicios: $' + totalServ.toLocaleString() + '<br>' : '') +
    (totalProd ? 'Productos: $' + totalProd.toLocaleString() + '<br>' : '') +
    'Gracias por elegirnos!';

  localStorage.removeItem('carrito');
  document.getElementById('modalPago').classList.remove('hidden');
  actualizarNavbar();
}
