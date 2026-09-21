/* ═══════════════════════════════════════════════════════════════
   Senderos — buscar.js
   Buscador global de servicios y productos (precios del servidor).
   ═══════════════════════════════════════════════════════════════ */

var filtroActivo = 'todo';
var queryActual = '';
var debounceTimer = null;

var serviciosCache = [];
var productosCache = [];

var datosCargados = false;
var cargaDatosPromise = null;

var PLACEHOLDER_IMG = '../img/placeholder.svg';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  cablearBuscador();

  cargarDatos().then(function () {
    var params = null;

    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {}

    var qParam = params ? params.get('q') : null;

    if (!qParam) {
      return;
    }

    var input = document.getElementById('searchInput');

    if (input) {
      input.value = qParam;
    }

    buscar(qParam);
  });
});

function cablearBuscador() {
  var input = document.getElementById('searchInput');

  if (input) {
    input.addEventListener('input', function () {
      buscar(input.value);
    });
  }

  var clear = document.getElementById('btnClear');

  if (clear) {
    clear.addEventListener('click', limpiarBusqueda);
  }

  document.querySelectorAll('.sf-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      cambiarFiltro(chip);
    });
  });

  document.querySelectorAll('[data-sugerencia]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setQuery(btn.dataset.sugerencia || '');
    });
  });
}

/* ── CARGA ── */

function cargarDatos() {
  if (datosCargados) {
    return Promise.resolve();
  }

  if (cargaDatosPromise) {
    return cargaDatosPromise;
  }

  cargaDatosPromise = Promise.all([
    fetch('../api/servicios.php', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); }),
    fetch('../api/productos.php', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); })
  ])
    .then(function (resultados) {
      var datosServicios = resultados[0];
      var datosProductos = resultados[1];

      if (!datosServicios || datosServicios.ok === false || !Array.isArray(datosServicios.servicios)) {
        throw new Error('Respuesta inválida de servicios.');
      }

      if (!datosProductos || datosProductos.ok === false || !Array.isArray(datosProductos.productos)) {
        throw new Error('Respuesta inválida de productos.');
      }

      serviciosCache = datosServicios.servicios.map(normServicioLocal);
      productosCache = datosProductos.productos.map(normProductoLocal);

      datosCargados = true;
    })
    .catch(function () {
      serviciosCache = [];
      productosCache = [];

      var empty = document.getElementById('emptyQuery');

      if (empty) {
        empty.textContent = 'No se pudo cargar el catálogo';
      }

      mostrarEstado('empty');

      if (typeof window.mostrarErrorConexion === 'function') {
        window.mostrarErrorConexion(cargarDatos);
      }
    });

  return cargaDatosPromise;
}

function normServicioLocal(s) {
  var precio = Number(s.precio) || 0;

  return {
    id: String(s.slug || s.id),
    dbId: Number(s.id),
    nombre: String(s.nombre || ''),
    desc: String(s.descripcion || ''),
    categoria: String(s.categoria || ''),
    duracion: (Number(s.duracion) || 0) + ' min',
    precio: precio,
    precioFinal: s.precio_final !== undefined && s.precio_final !== null ? Number(s.precio_final) : precio,
    oferta: s.oferta || null,
    tieneOferta: Boolean(s.tiene_oferta),
    img: String(s.imagen || '').trim() || PLACEHOLDER_IMG
  };
}

function normProductoLocal(p) {
  var stockQty = Number(p.stock_cantidad) || 0;
  var precio = Number(p.precio) || 0;

  return {
    id: Number(p.id),
    nombre: String(p.nombre || ''),
    desc: String(p.descripcion || ''),
    categoria: String(p.categoria || ''),
    marca: String(p.marca || ''),
    precio: precio,
    precioFinal: p.precio_final !== undefined && p.precio_final !== null ? Number(p.precio_final) : precio,
    oferta: p.oferta || null,
    tieneOferta: Boolean(p.tiene_oferta),
    stockQty: stockQty,
    stock: stockQty > 0,
    img: String(p.imagen || '').trim() || PLACEHOLDER_IMG
  };
}

/* ── BÚSQUEDA ── */

function buscar(query) {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(function () {
    ejecutarBusqueda(query);
  }, 180);
}

function ejecutarBusqueda(query) {
  queryActual = String(query || '').trim().toLowerCase();

  var clearBtn = document.getElementById('btnClear');

  if (clearBtn) {
    clearBtn.classList.toggle('hidden', !queryActual);
  }

  if (queryActual.length < 2) {
    limpiarResultados();
    mostrarEstado('initial');
    return Promise.resolve();
  }

  function seguir() {
    var resultadosServicios = serviciosCache.filter(function (s) {
      return buscarEnServicio(s, queryActual);
    });
    var resultadosProductos = productosCache.filter(function (p) {
      return buscarEnProducto(p, queryActual);
    });

    var serviciosFinal =
      filtroActivo === 'todo' || filtroActivo === 'servicio' ? resultadosServicios : [];
    var productosFinal =
      filtroActivo === 'todo' || filtroActivo === 'producto' ? resultadosProductos : [];

    var total = serviciosFinal.length + productosFinal.length;

    if (!total) {
      var empty = document.getElementById('emptyQuery');

      if (empty) {
        empty.textContent = queryActual;
      }

      limpiarResultados();
      mostrarEstado('empty');
      return;
    }

    mostrarEstado('results');

    var countEl = document.getElementById('resultsCount');

    if (countEl) {
      countEl.textContent =
        total + ' resultado' + (total !== 1 ? 's' : '') + ' para "' + queryActual + '"';
    }

    renderResultadosServicios(serviciosFinal);
    renderResultadosProductos(productosFinal);
  }

  if (!datosCargados) {
    return cargarDatos().then(seguir);
  }

  seguir();
  return Promise.resolve();
}

function buscarEnServicio(servicio, query) {
  return [servicio.nombre, servicio.desc, servicio.categoria, servicio.duracion].some(function (valor) {
    return String(valor || '').toLowerCase().indexOf(query) !== -1;
  });
}

function buscarEnProducto(producto, query) {
  return [producto.nombre, producto.desc, producto.categoria, producto.marca].some(function (valor) {
    return String(valor || '').toLowerCase().indexOf(query) !== -1;
  });
}

/* ── RENDER ── */

function renderResultadosServicios(servicios) {
  var section = document.getElementById('secServicios');
  var grid = document.getElementById('gridServicios');

  if (!section || !grid) {
    return;
  }

  grid.innerHTML = '';

  if (!servicios.length) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');

  servicios.forEach(function (servicio) {
    grid.appendChild(tarjetaServicio(servicio));
  });
}

function renderResultadosProductos(productos) {
  var section = document.getElementById('secProductos');
  var grid = document.getElementById('gridProductos');

  if (!section || !grid) {
    return;
  }

  grid.innerHTML = '';

  if (!productos.length) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');

  productos.forEach(function (producto) {
    grid.appendChild(tarjetaProducto(producto));
  });
}

function tarjetaServicio(servicio) {
  var link = document.createElement('a');
  link.className = 'result-card';
  link.href = 'servicios.html?id=' + encodeURIComponent(servicio.id);

  var imgWrap = document.createElement('div');
  imgWrap.className = 'result-card-image-wrap';

  var img = document.createElement('img');
  img.className = 'result-card-img';
  img.src = servicio.img;
  img.alt = servicio.nombre;
  img.loading = 'lazy';
  img.onerror = function () {
    img.onerror = null;
    img.src = '../img/icons/servicio.svg';
  };
  imgWrap.appendChild(img);
  link.appendChild(imgWrap);

  var body = document.createElement('div');
  body.className = 'result-card-body';

  var tipo = document.createElement('div');
  tipo.className = 'result-card-tipo tipo-servicio';
  tipo.textContent = 'Servicio' + (servicio.duracion ? ' · ' + servicio.duracion : '');
  body.appendChild(tipo);

  var h3 = document.createElement('h3');
  h3.className = 'result-card-name';
  h3.appendChild(resaltar(servicio.nombre));
  body.appendChild(h3);

  var desc = document.createElement('p');
  desc.className = 'result-card-desc';
  desc.appendChild(resaltar(servicio.desc || ''));
  body.appendChild(desc);

  var footer = document.createElement('div');
  footer.className = 'result-card-footer';

  var price = document.createElement('span');
  price.className = 'result-card-price';
  price.textContent = precioTexto(servicio.precio, servicio.precioFinal, servicio.tieneOferta);
  footer.appendChild(price);

  var cta = document.createElement('span');
  cta.className = 'result-card-cta';
  cta.textContent = 'Reservar →';
  footer.appendChild(cta);

  body.appendChild(footer);
  link.appendChild(body);

  return link;
}

function tarjetaProducto(producto) {
  var link = document.createElement('a');
  link.className = 'result-card';
  link.href = 'productos.html?id=' + encodeURIComponent(String(producto.id));

  var imgWrap = document.createElement('div');
  imgWrap.className = 'result-card-image-wrap';

  var img = document.createElement('img');
  img.className = 'result-card-img';
  img.src = producto.img;
  img.alt = producto.nombre;
  img.loading = 'lazy';
  img.onerror = function () {
    img.onerror = null;
    img.src = '../img/icons/bolsa.svg';
  };
  imgWrap.appendChild(img);
  link.appendChild(imgWrap);

  var body = document.createElement('div');
  body.className = 'result-card-body';

  var tipo = document.createElement('div');
  tipo.className = 'result-card-tipo';
  tipo.textContent = producto.categoria || producto.marca || 'Producto';
  body.appendChild(tipo);

  var h3 = document.createElement('h3');
  h3.className = 'result-card-name';
  h3.appendChild(resaltar(producto.nombre));
  body.appendChild(h3);

  var desc = document.createElement('p');
  desc.className = 'result-card-desc';
  desc.appendChild(resaltar(producto.desc || ''));
  body.appendChild(desc);

  var footer = document.createElement('div');
  footer.className = 'result-card-footer';

  var price = document.createElement('span');
  price.className = 'result-card-price';
  price.textContent = precioTexto(producto.precio, producto.precioFinal, producto.tieneOferta);
  footer.appendChild(price);

  var cta = document.createElement('span');
  cta.className = 'result-card-cta';
  cta.textContent = producto.stock ? 'Ver →' : 'Sin stock';
  footer.appendChild(cta);

  body.appendChild(footer);
  link.appendChild(body);

  return link;
}

function precioTexto(original, final, conOferta) {
  if (conOferta && Number(final) < Number(original)) {
    return formatoPrecioLocal(final);
  }

  return formatoPrecioLocal(original);
}

function resaltar(valor) {
  var frag = document.createDocumentFragment();
  var texto = String(valor || '');

  if (!queryActual) {
    frag.appendChild(document.createTextNode(texto));
    return frag;
  }

  var lower = texto.toLowerCase();
  var q = queryActual.toLowerCase();
  var i = 0;
  var pos = lower.indexOf(q);

  if (pos === -1) {
    frag.appendChild(document.createTextNode(texto));
    return frag;
  }

  while (pos !== -1) {
    frag.appendChild(document.createTextNode(texto.slice(i, pos)));

    var mark = document.createElement('mark');
    mark.textContent = texto.slice(pos, pos + q.length);
    frag.appendChild(mark);

    i = pos + q.length;
    pos = lower.indexOf(q, i);
  }

  frag.appendChild(document.createTextNode(texto.slice(i)));

  return frag;
}

/* ── ESTADOS ── */

function mostrarEstado(estado) {
  var initial = document.getElementById('stateInitial');
  var empty = document.getElementById('stateEmpty');
  var results = document.getElementById('searchResults');

  if (initial) {
    initial.classList.toggle('hidden', estado !== 'initial');
  }

  if (empty) {
    empty.classList.toggle('hidden', estado !== 'empty');
  }

  if (results) {
    results.classList.toggle('hidden', estado !== 'results');
  }
}

function limpiarResultados() {
  ['gridServicios', 'gridProductos'].forEach(function (id) {
    var el = document.getElementById(id);

    if (el) {
      el.innerHTML = '';
    }
  });

  ['secServicios', 'secProductos'].forEach(function (id) {
    var el = document.getElementById(id);

    if (el) {
      el.classList.remove('hidden');
    }
  });

  var count = document.getElementById('resultsCount');

  if (count) {
    count.textContent = '';
  }
}

/* ── CONTROLES ── */

function limpiarBusqueda() {
  var input = document.getElementById('searchInput');

  if (input) {
    input.value = '';
    input.focus();
  }

  queryActual = '';

  var clearBtn = document.getElementById('btnClear');

  if (clearBtn) {
    clearBtn.classList.add('hidden');
  }

  limpiarResultados();
  mostrarEstado('initial');
}

function setQuery(query) {
  var input = document.getElementById('searchInput');

  if (input) {
    input.value = query;
    input.focus();
  }

  buscar(query);
}

function cambiarFiltro(btn) {
  if (!btn) {
    return;
  }

  document.querySelectorAll('.sf-chip').forEach(function (chip) {
    chip.classList.remove('active');
  });

  btn.classList.add('active');

  filtroActivo = btn.dataset.tipo || 'todo';

  if (queryActual.length >= 2) {
    ejecutarBusqueda(queryActual);
  }
}

function formatoPrecioLocal(valor) {
  if (typeof window.formatoPrecio === 'function') {
    return window.formatoPrecio(Number(valor) || 0);
  }

  return '$' + Number(valor || 0).toLocaleString('es-AR');
}
