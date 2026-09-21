/* Senderos — Inicio
 * Datos desde la API, carrito por api/carrito.php.
 */

var SERVICIOS = [];
var PRODUCTOS = [];

/* ── INICIO ── */

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  if (typeof window.cargarOfertas === 'function') {
    window.cargarOfertas().then(cargarInicio).catch(cargarInicio);
  } else {
    cargarInicio();
  }

  window.addEventListener('ofertas:listas', actualizarTicker);

  var formContacto = document.getElementById('formContacto');

  if (formContacto) {
    formContacto.addEventListener('submit', enviarConsulta);
  }
});

/* ── CARGA PRINCIPAL ── */

function cargarInicio() {
  mostrarSkeletons();

  return Promise.allSettled([
    fetch('../api/servicios.php', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }).then(function (r) {
      return r.json();
    }),
    fetch('../api/productos.php', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }).then(function (r) {
      return r.json();
    })
  ]).then(function (resultados) {
    var serviciosOK = false;
    var productosOK = false;

    if (resultados[0].status === 'fulfilled' && resultados[0].value && resultados[0].value.ok) {
      SERVICIOS = (Array.isArray(resultados[0].value.servicios) ? resultados[0].value.servicios : []).map(normServicioLocal).sort(function (a, b) {
        return a.dbId - b.dbId;
      });

      serviciosOK = true;
      renderCategorias();
      renderServiciosDestacados();
    } else {
      mostrarErrorBloque('serviciosDestacados', 'No pudimos cargar los servicios.');
      mostrarErrorBloque('categoriasGrid', 'No pudimos cargar las categorías.');
      fallarConexion(cargarInicio);
    }

    if (resultados[1].status === 'fulfilled' && resultados[1].value && resultados[1].value.ok) {
      PRODUCTOS = (Array.isArray(resultados[1].value.productos) ? resultados[1].value.productos : []).map(normProductoLocal);

      productosOK = true;
      renderProductosDestacados();
    } else {
      mostrarErrorBloque('productosDestacados', 'No pudimos cargar los productos.');
      fallarConexion(cargarInicio);
    }

    actualizarEstadisticas(serviciosOK ? SERVICIOS : [], productosOK ? PRODUCTOS : []);

    if (!serviciosOK && !productosOK) {
      fallarConexion(cargarInicio);
    }
  });
}

function normServicioLocal(servicio) {
  if (typeof window.normServicio === 'function') {
    try {
      var n = window.normServicio(servicio);

      n.precioFinal =
        servicio.precio_final !== undefined && servicio.precio_final !== null
          ? Number(servicio.precio_final)
          : n.precio;
      n.oferta = servicio.oferta || null;
      n.tieneOferta = Boolean(servicio.tiene_oferta) || n.precioFinal < n.precio;

      return n;
    } catch (e) {}
  }

  var precio = Number(servicio.precio) || 0;

  return {
    id: String(servicio.slug || servicio.id),
    dbId: Number(servicio.id),
    nombre: String(servicio.nombre || ''),
    categoria: String(servicio.categoria || ''),
    desc: String(servicio.descripcion || ''),
    duracionMin: Number(servicio.duracion) || 0,
    duracion: (Number(servicio.duracion) || 0) + ' min',
    precio: precio,
    precioFinal: servicio.precio_final !== undefined ? Number(servicio.precio_final) : precio,
    oferta: servicio.oferta || null,
    tieneOferta: Boolean(servicio.tiene_oferta),
    badge: String(servicio.badge || '').toLowerCase() || null,
    badgeText: String(servicio.badge_texto || servicio.badge || ''),
    img: String(servicio.imagen || '').trim() || '../img/placeholder.svg',
    incluye: String(servicio.incluye || '').split('|').map(function (x) { return x.trim(); }).filter(Boolean)
  };
}

function normProductoLocal(producto) {
  if (typeof window.normProducto === 'function') {
    try {
      var n = window.normProducto(producto);

      n.precioFinal =
        producto.precio_final !== undefined && producto.precio_final !== null
          ? Number(producto.precio_final)
          : n.precio;
      n.oferta = producto.oferta || null;
      n.tieneOferta = Boolean(producto.tiene_oferta) || n.precioFinal < n.precio;

      return n;
    } catch (e) {}
  }

  var stockQty = Number(producto.stock_cantidad) || 0;
  var precio = Number(producto.precio) || 0;

  return {
    id: Number(producto.id),
    nombre: String(producto.nombre || ''),
    categoria: String(producto.categoria || ''),
    marca: String(producto.marca || ''),
    desc: String(producto.descripcion || ''),
    precio: precio,
    precioFinal: producto.precio_final !== undefined ? Number(producto.precio_final) : precio,
    oferta: producto.oferta || null,
    tieneOferta: Boolean(producto.tiene_oferta),
    stockQty: stockQty,
    stock: stockQty > 0,
    badge: String(producto.badge || '').toLowerCase() || null,
    img: String(producto.imagen || '').trim() || '../img/placeholder.svg'
  };
}

/* ── SKELETONS ── */

function mostrarSkeletons() {
  ['serviciosDestacados', 'productosDestacados'].forEach(function (id, i) {
    var el = document.getElementById(id);

    if (!el) {
      return;
    }

    el.innerHTML = '';

    var n = id === 'serviciosDestacados' ? 3 : 4;

    for (var k = 0; k < n; k++) {
      var skel = document.createElement('div');
      skel.className = 'skel';
      el.appendChild(skel);
    }
  });

  var categorias = document.getElementById('categoriasGrid');

  if (categorias) {
    categorias.innerHTML = '';
  }
}

/* ── ESTADÍSTICAS ── */

function actualizarEstadisticas(servicios, productos) {
  var marcas = new Set();

  productos.forEach(function (producto) {
    var marca = String(producto.marca || '').trim().toLowerCase();

    if (marca) {
      marcas.add(marca);
    }
  });

  var statServicios = document.getElementById('statServicios');
  var statProductos = document.getElementById('statProductos');
  var statMarcas = document.getElementById('statMarcas');

  if (statServicios) {
    statServicios.textContent = String(servicios.length);
  }

  if (statProductos) {
    statProductos.textContent = String(productos.length);
  }

  if (statMarcas) {
    statMarcas.textContent = String(marcas.size);
  }
}

/* ── CATEGORÍAS ── */

function renderCategorias() {
  var grid = document.getElementById('categoriasGrid');

  if (!grid) {
    return;
  }

  grid.innerHTML = '';

  var categorias = new Map();

  SERVICIOS.forEach(function (servicio) {
    var categoria = String(servicio.categoria || '').trim();

    if (!categoria) {
      return;
    }

    if (!categorias.has(categoria)) {
      categorias.set(categoria, []);
    }

    categorias.get(categoria).push(servicio);
  });

  if (!categorias.size) {
    var msg = document.createElement('div');
    msg.className = 'estado-msg';
    msg.textContent = 'No hay categorías disponibles.';
    grid.appendChild(msg);
    return;
  }

  categorias.forEach(function (servicios, categoria) {
    var min = Math.min.apply(
      null,
      servicios.map(function (s) { return Number(s.tieneOferta ? s.precioFinal : s.precio) || 0; })
    );

    var tile = document.createElement('a');
    tile.className = 'cat-tile img-slot';
    tile.href = 'servicios.html?cat=' + encodeURIComponent(categoria);

    var info = document.createElement('div');
    info.className = 'cat-tile-info';

    var name = document.createElement('div');
    name.className = 'cat-tile-name';
    name.textContent = categoria;
    info.appendChild(name);

    var meta = document.createElement('div');
    meta.className = 'cat-tile-meta';
    meta.textContent =
      servicios.length + (servicios.length === 1 ? ' servicio' : ' servicios') +
      ' · desde ' + formatoPrecioLocal(min);
    info.appendChild(meta);

    tile.appendChild(info);
    grid.appendChild(tile);
  });
}

/* ── SERVICIOS DESTACADOS ── */

function renderServiciosDestacados() {
  var grid = document.getElementById('serviciosDestacados');

  if (!grid) {
    return;
  }

  grid.innerHTML = '';

  var destacados = SERVICIOS.filter(function (s) {
    return s.badge === 'popular';
  });

  if (destacados.length < 3) {
    var usados = new Set(destacados.map(function (s) { return s.dbId; }));

    SERVICIOS.forEach(function (s) {
      if (destacados.length >= 3 || usados.has(s.dbId)) {
        return;
      }

      destacados.push(s);
      usados.add(s.dbId);
    });
  }

  destacados = destacados.slice(0, 3);

  if (!destacados.length) {
    var msg = document.createElement('div');
    msg.className = 'estado-msg';
    msg.textContent = 'No hay servicios disponibles.';
    grid.appendChild(msg);
    return;
  }

  destacados.forEach(function (servicio) {
    grid.appendChild(tarjetaServicio(servicio));
  });
}

function tarjetaServicio(servicio) {
  var card = document.createElement('article');
  card.className = 'service-card';

  var imgWrap = document.createElement('div');
  imgWrap.className = 'service-img-wrap img-slot';

  var img = document.createElement('img');
  img.className = 'service-img';
  img.src = servicio.img || '../img/placeholder.svg';
  img.alt = servicio.nombre;
  img.loading = 'lazy';
  img.onerror = function () {
    if (img.src.indexOf('placeholder.svg') === -1) {
      img.src = '../img/placeholder.svg';
    }
  };
  imgWrap.appendChild(img);

  if (servicio.tieneOferta && servicio.oferta) {
    var badge = document.createElement('span');
    badge.className = 'oferta-badge-sitio';
    badge.style.background = String(servicio.oferta.color || '#AD717E');
    badge.textContent = etiquetaOfertaLocal(servicio.oferta);
    imgWrap.appendChild(badge);
  }

  card.appendChild(imgWrap);

  var body = document.createElement('div');
  body.className = 'service-body';

  var meta = document.createElement('div');
  meta.className = 'service-meta';

  var dur = document.createElement('span');
  dur.className = 'service-duration';
  dur.textContent = servicio.duracion;
  meta.appendChild(dur);

  var price = document.createElement('span');
  price.className = 'service-price';
  pintarPrecioLocal(price, servicio.precio, servicio.precioFinal, servicio.tieneOferta);
  meta.appendChild(price);

  body.appendChild(meta);

  var cat = document.createElement('p');
  cat.className = 'service-cat';
  cat.textContent = servicio.categoria;
  body.appendChild(cat);

  var h3 = document.createElement('h3');
  h3.className = 'service-name';
  h3.textContent = servicio.nombre;
  body.appendChild(h3);

  var desc = document.createElement('p');
  desc.className = 'service-desc';
  desc.textContent = servicio.desc;
  body.appendChild(desc);

  var link = document.createElement('a');
  link.className = 'btn-reservar';
  link.href = 'servicios.html?id=' + encodeURIComponent(servicio.id);
  link.textContent = 'Ver y reservar';
  body.appendChild(link);

  card.appendChild(body);

  return card;
}

/* ── PRODUCTOS DESTACADOS ── */

function renderProductosDestacados() {
  var grid = document.getElementById('productosDestacados');

  if (!grid) {
    return;
  }

  grid.innerHTML = '';

  var disponibles = PRODUCTOS.filter(function (p) { return p.stock; });
  var destacados = [];

  disponibles
    .filter(function (p) { return p.badge === 'nuevo' || p.badge === 'oferta' || p.tieneOferta; })
    .forEach(function (p) {
      if (!destacados.some(function (x) { return x.id === p.id; })) {
        destacados.push(p);
      }
    });

  var marcas = new Set();

  disponibles.forEach(function (p) {
    if (destacados.length >= 4) {
      return;
    }

    var marca = String(p.marca || '').trim().toLowerCase();

    if (marca && !marcas.has(marca) && !destacados.some(function (x) { return x.id === p.id; })) {
      destacados.push(p);
      marcas.add(marca);
    }
  });

  disponibles.forEach(function (p) {
    if (destacados.length >= 4 || destacados.some(function (x) { return x.id === p.id; })) {
      return;
    }

    destacados.push(p);
  });

  var lista = destacados.slice(0, 4);

  if (!lista.length) {
    var msg = document.createElement('div');
    msg.className = 'estado-msg';
    msg.textContent = 'No hay productos disponibles.';
    grid.appendChild(msg);
    return;
  }

  lista.forEach(function (producto) {
    grid.appendChild(tarjetaProducto(producto));
  });
}

function tarjetaProducto(producto) {
  var card = document.createElement('article');
  card.className = 'product-card';

  var imgWrap = document.createElement('div');
  imgWrap.className = 'product-img-wrap img-slot';

  var img = document.createElement('img');
  img.className = 'product-img';
  img.src = producto.img || '../img/placeholder.svg';
  img.alt = producto.nombre;
  img.loading = 'lazy';
  img.onerror = function () {
    if (img.src.indexOf('placeholder.svg') === -1) {
      img.src = '../img/placeholder.svg';
    }
  };
  imgWrap.appendChild(img);

  if (producto.tieneOferta && producto.oferta) {
    var badge = document.createElement('span');
    badge.className = 'oferta-badge-sitio';
    badge.style.background = String(producto.oferta.color || '#AD717E');
    badge.textContent = etiquetaOfertaLocal(producto.oferta);
    imgWrap.appendChild(badge);
  } else if (producto.badge === 'nuevo' || producto.badge === 'oferta') {
    var b2 = document.createElement('span');
    b2.className = 'oferta-badge-sitio';
    b2.textContent = producto.badge === 'nuevo' ? 'Nuevo' : 'Oferta';
    imgWrap.appendChild(b2);
  }

  card.appendChild(imgWrap);

  var body = document.createElement('div');
  body.className = 'product-body';

  var cat = document.createElement('p');
  cat.className = 'product-cat';
  cat.textContent = producto.marca || producto.categoria || '';
  body.appendChild(cat);

  var h3 = document.createElement('h3');
  h3.className = 'product-name';

  var link = document.createElement('a');
  link.href = 'productos.html?id=' + encodeURIComponent(String(producto.id));
  link.textContent = producto.nombre;
  h3.appendChild(link);
  body.appendChild(h3);

  var footer = document.createElement('div');
  footer.className = 'product-footer';

  var price = document.createElement('span');
  price.className = 'product-price';
  pintarPrecioLocal(price, producto.precio, producto.precioFinal, producto.tieneOferta);
  footer.appendChild(price);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-add';
  btn.textContent = '+ Carrito';
  btn.addEventListener('click', function () {
    agregarProducto(producto.id);
  });
  footer.appendChild(btn);

  var fav = document.createElement('button');
  fav.type = 'button';
  fav.className = 'btn-fav';
  fav.textContent = '♡';
  fav.setAttribute('aria-label', 'Agregar a favoritos');
  fav.addEventListener('click', function () {
    toggleFavoritoIndex(producto.id, fav);
  });
  footer.appendChild(fav);

  body.appendChild(footer);
  card.appendChild(body);

  return card;
}

function toggleFavoritoIndex(id, boton) {
  var clave = 'senderos-likes-productos';
  var lista = [];

  try {
    lista = JSON.parse(window.localStorage.getItem(clave) || '[]');

    if (!Array.isArray(lista)) {
      lista = [];
    }
  } catch (e) {
    lista = [];
  }

  var num = Number(id);
  var idx = lista.indexOf(num);

  if (idx === -1) {
    lista.push(num);
  } else {
    lista.splice(idx, 1);
  }

  try {
    window.localStorage.setItem(clave, JSON.stringify(lista));
  } catch (e) {}

  if (boton) {
    boton.textContent = idx === -1 ? '♥' : '♡';
    boton.classList.toggle('active', idx === -1);
  }
}

/* ── AGREGAR POR API (sin localStorage) ── */

function agregarProducto(id) {
  var producto = PRODUCTOS.find(function (item) {
    return Number(item.id) === Number(id);
  });

  if (!producto) {
    return Promise.resolve();
  }

  if (!producto.stock) {
    if (typeof window.showToast === 'function') {
      window.showToast('Este producto no tiene stock.');
    }

    return Promise.resolve();
  }

  return sesionServidorOk().then(function (ok) {
    if (!ok) {
      irALoginInicio();
      return;
    }

    return fetch('../api/carrito.php', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ tipo: 'producto', id: Number(producto.id) })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          throw new Error(data.mensaje || data.error || 'No se pudo agregar al carrito.');
        }
      });
    })
    .then(function () {
      if (typeof window.actualizarNavbar === 'function') {
        window.actualizarNavbar();
      }

      if (typeof window.showToast === 'function') {
        window.showToast('Producto agregado al carrito');
      }
    })
    .catch(function (error) {
      if (typeof window.showToast === 'function') {
        window.showToast(error.message || 'No se pudo agregar al carrito.');
      }
    });
  });
}

function sesionServidorOk() {
  if (typeof window.consultarSesionServidor === 'function') {
    return window.consultarSesionServidor().then(function (usuario) {
      return Boolean(usuario);
    });
  }

  return Promise.resolve(
    Boolean(typeof window.getSesion === 'function' && window.getSesion())
  );
}

function irALoginInicio() {
  try {
    window.localStorage.setItem('redirectAfterLogin', 'index.html');
  } catch (e) {}

  if (typeof window.showToast === 'function') {
    window.showToast('Iniciá sesión para agregar productos al carrito.');
  }

  setTimeout(function () {
    window.location.href = 'login.html';
  }, 600);
}

/* ── TICKER ── */

function actualizarTicker() {
  if (typeof window.actualizarTickerOfertas === 'function') {
    window.actualizarTickerOfertas();
  }
}

/* ── CONTACTO ── */

function limpiarErroresContacto() {
  ['cNombre', 'cTelefono', 'cEmail', 'cAsunto', 'cMensaje'].forEach(function (id) {
    var input = document.getElementById(id);
    var error = document.getElementById('err-' + id);

    if (input) {
      input.classList.remove('error');
    }

    if (error) {
      error.textContent = '';
    }
  });
}

function mostrarErrorCampo(id, mensaje) {
  var input = document.getElementById(id);
  var error = document.getElementById('err-' + id);

  if (input) {
    input.classList.add('error');
  }

  if (error) {
    error.textContent = mensaje;
  }
}

function enviarConsulta(event) {
  event.preventDefault();

  limpiarErroresContacto();

  var nombre = (document.getElementById('cNombre') || {}).value || '';
  var telefono = (document.getElementById('cTelefono') || {}).value || '';
  var email = (document.getElementById('cEmail') || {}).value || '';
  var asunto = (document.getElementById('cAsunto') || {}).value || '';
  var mensaje = (document.getElementById('cMensaje') || {}).value || '';

  nombre = String(nombre).trim();
  telefono = String(telefono).trim();
  email = String(email).trim();
  asunto = String(asunto).trim();
  mensaje = String(mensaje).trim();

  var primerInvalido = null;

  function marcar(id, msg) {
    mostrarErrorCampo(id, msg);

    if (!primerInvalido) {
      primerInvalido = document.getElementById(id);
    }
  }

  if (nombre.length < 2) {
    marcar('cNombre', 'Ingresá tu nombre.');
  }

  if (telefono.length < 8 || !/^[0-9+\-\s()]+$/.test(telefono)) {
    marcar('cTelefono', 'Ingresá un teléfono válido.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    marcar('cEmail', 'Ingresá un email válido.');
  }

  if (!asunto) {
    marcar('cAsunto', 'Seleccioná una consulta.');
  }

  if (mensaje.length < 5) {
    marcar('cMensaje', 'Escribí un mensaje.');
  }

  if (primerInvalido) {
    primerInvalido.focus();
    return;
  }

  var texto = [
    'Hola Senderos de Spa.',
    '',
    'Nombre: ' + nombre,
    'Teléfono: ' + telefono,
    'Email: ' + email,
    'Consulta: ' + asunto,
    '',
    'Mensaje: ' + mensaje
  ].join('\n');

  window.open(
    'https://wa.me/5493571616113?text=' + encodeURIComponent(texto),
    '_blank',
    'noopener,noreferrer'
  );

  if (typeof window.showToast === 'function') {
    window.showToast('Se abrió WhatsApp con tu mensaje.');
  }
}

/* ── ERRORES ── */

function mostrarErrorBloque(id, mensaje) {
  var elemento = document.getElementById(id);

  if (!elemento) {
    return;
  }

  elemento.innerHTML = '';

  var box = document.createElement('div');
  box.className = 'estado-msg';
  box.appendChild(document.createTextNode(mensaje + ' '));

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Reintentar';
  btn.addEventListener('click', cargarInicio);
  box.appendChild(document.createElement('br'));
  box.appendChild(btn);

  elemento.appendChild(box);
}

function fallarConexion(reintentar) {
  if (typeof window.mostrarErrorConexion === 'function') {
    window.mostrarErrorConexion(reintentar);
  }
}

/* ── HELPERS ── */

function pintarPrecioLocal(contenedor, original, final, conOferta) {
  contenedor.innerHTML = '';

  if (conOferta && Number(final) < Number(original)) {
    var tachado = document.createElement('s');
    tachado.className = 'precio-tachado';
    tachado.textContent = formatoPrecioLocal(original);
    contenedor.appendChild(tachado);
    contenedor.appendChild(document.createTextNode(' '));

    var f = document.createElement('strong');
    f.className = 'precio-final';
    f.textContent = formatoPrecioLocal(final);
    contenedor.appendChild(f);
  } else {
    contenedor.textContent = formatoPrecioLocal(original);
  }
}

function etiquetaOfertaLocal(oferta) {
  if (oferta.tipo === 'porcentaje') {
    return Number(oferta.descuento) + '% OFF';
  }

  if (oferta.tipo === '2x1') {
    return '2x1';
  }

  if (oferta.tipo === 'precio_fijo') {
    return 'Precio especial';
  }

  return String(oferta.nombre || 'Oferta');
}

function formatoPrecioLocal(valor) {
  if (typeof window.formatoPrecio === 'function') {
    return window.formatoPrecio(Number(valor) || 0);
  }

  return '$' + Number(valor || 0).toLocaleString('es-AR');
}
