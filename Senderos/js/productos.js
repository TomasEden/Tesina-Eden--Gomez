/* Senderos — Productos
 * Catálogo + filtros + panel lateral con stock real y ofertas del servidor.
 */

var PRODUCTOS = [];
var productoSeleccionado = null;

var filtrosProductos = {
  texto: '',
  categoria: '',
  marca: '',
  precioMax: 0,
  soloStock: false,
  soloOferta: false,
  orden: ''
};

var PLACEHOLDER_IMG = '../img/placeholder.svg';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  prepararEventosPanel();

  var promesas = [];

  if (typeof window.cargarOfertas === 'function') {
    promesas.push(window.cargarOfertas().catch(function () {}));
  }

  Promise.all(promesas).then(cargarProductos);
});

/* ── CARGA ── */

function cargarProductos() {
  var grid = document.getElementById('productsGrid');

  return fetch('../api/productos.php', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.ok) {
          throw new Error((data && (data.mensaje || data.error)) || 'Error');
        }

        return data.productos;
      });
    })
    .then(function (productos) {
      PRODUCTOS = (Array.isArray(productos) ? productos : [])
        .map(normProductoLocal)
        .sort(function (a, b) { return a.id - b.id; });

      aplicarFiltrosDesdeURL();
      prepararFiltrosProductos();
      renderProductos();
      abrirProductoDesdeURL();
    })
    .catch(function () {
      if (grid) {
        grid.innerHTML = '';

        var box = document.createElement('div');
        box.className = 'estado-msg';

        var p = document.createElement('p');
        p.textContent = 'No pudimos cargar los productos.';
        box.appendChild(p);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Reintentar';
        btn.addEventListener('click', cargarProductos);
        box.appendChild(btn);

        grid.appendChild(box);
      }

      if (typeof window.mostrarErrorConexion === 'function') {
        window.mostrarErrorConexion(cargarProductos);
      }
    });
}

function normProductoLocal(producto) {
  var stockQty = Number(producto.stock_cantidad);
  stockQty = Number.isFinite(stockQty) ? stockQty : 0;

  var precio = Number(producto.precio) || 0;
  var precioFinal =
    producto.precio_final !== undefined && producto.precio_final !== null
      ? Number(producto.precio_final)
      : precio;

  return {
    id: Number(producto.id),
    nombre: String(producto.nombre || ''),
    categoria: String(producto.categoria || ''),
    marca: String(producto.marca || ''),
    desc: String(producto.descripcion || ''),
    precio: precio,
    precioFinal: precioFinal,
    oferta: producto.oferta || null,
    tieneOferta: Boolean(producto.tiene_oferta) || precioFinal < precio,
    stockQty: stockQty,
    stock: stockQty > 0,
    badge: String(producto.badge || '').toLowerCase() || null,
    img: String(producto.imagen || '').trim() || PLACEHOLDER_IMG
  };
}

/* ── PANEL ── */

function prepararEventosPanel() {
  var cerrar = document.getElementById('productPanelClose');

  if (cerrar) {
    cerrar.addEventListener('click', cerrarPanelProducto);
  }

  var backdrop = document.getElementById('productPanelBackdrop');

  if (backdrop) {
    backdrop.addEventListener('click', cerrarPanelProducto);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') {
      return;
    }

    var panel = document.getElementById('productPanel');

    if (panel && panel.classList.contains('open')) {
      cerrarPanelProducto();
    }
  });
}

/* ── FILTROS ── */

function prepararFiltrosProductos() {
  var categoria = document.getElementById('filtroCategoria');
  var marca = document.getElementById('filtroMarca');
  var orden = document.getElementById('filtroOrden');
  var texto = document.getElementById('filtroTexto');
  var precio = document.getElementById('filtroPrecio');
  var precioValor = document.getElementById('filtroPrecioValor');
  var soloStock = document.getElementById('filtroStock');
  var soloOferta = document.getElementById('filtroOferta');
  var limpiar = document.getElementById('btnLimpiarFiltros');

  if (!categoria || !marca || !orden) {
    return;
  }

  function opcionesUnicas(clave) {
    return Array.from(
      new Set(
        PRODUCTOS.map(function (p) {
          return String(p[clave] || '').trim();
        }).filter(Boolean)
      )
    ).sort(function (a, b) { return a.localeCompare(b, 'es'); });
  }

  function llenar(select, items, actual) {
    select.innerHTML = '';

    var todas = document.createElement('option');
    todas.value = '';
    todas.textContent = 'Todas';
    select.appendChild(todas);

    items.forEach(function (item) {
      var opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      select.appendChild(opt);
    });

    select.value = actual || '';
  }

  llenar(categoria, opcionesUnicas('categoria'), filtrosProductos.categoria);
  llenar(marca, opcionesUnicas('marca'), filtrosProductos.marca);
  orden.value = filtrosProductos.orden || '';

  categoria.onchange = function () {
    filtrosProductos.categoria = categoria.value;
    renderProductos();
  };

  marca.onchange = function () {
    filtrosProductos.marca = marca.value;
    renderProductos();
  };

  orden.onchange = function () {
    filtrosProductos.orden = orden.value;
    renderProductos();
  };

  var texto = document.getElementById('filtroTexto');

  if (texto) {
    texto.value = filtrosProductos.texto || '';

    texto.oninput = function () {
      filtrosProductos.texto = texto.value;
      renderProductos();
    };
  }

  var precio = document.getElementById('filtroPrecio');
  var precioValor = document.getElementById('filtroPrecioValor');

  if (precio) {
    var maximo = PRODUCTOS.reduce(function (max, p) {
      return Math.max(max, precioOrden(p));
    }, 0);

    maximo = Math.ceil((maximo || 100000) / 1000) * 1000;

    precio.max = String(maximo);

    if (!filtrosProductos.precioMax) {
      filtrosProductos.precioMax = maximo;
    }

    precio.value = String(filtrosProductos.precioMax);

    if (precioValor) {
      precioValor.textContent = formatoPrecioLocal(filtrosProductos.precioMax);
    }

    precio.oninput = function () {
      filtrosProductos.precioMax = Number(precio.value) || 0;

      if (precioValor) {
        precioValor.textContent = formatoPrecioLocal(filtrosProductos.precioMax);
      }

      renderProductos();
    };
  }

  var soloStock = document.getElementById('filtroStock');

  if (soloStock) {
    soloStock.checked = filtrosProductos.soloStock;

    soloStock.onchange = function () {
      filtrosProductos.soloStock = soloStock.checked;
      renderProductos();
    };
  }

  var soloOferta = document.getElementById('filtroOferta');

  if (soloOferta) {
    soloOferta.checked = filtrosProductos.soloOferta;

    soloOferta.onchange = function () {
      filtrosProductos.soloOferta = soloOferta.checked;
      renderProductos();
    };
  }

  var limpiar = document.getElementById('btnLimpiarFiltros');

  if (limpiar) {
    limpiar.addEventListener('click', limpiarFiltrosProductos);
  }
}

function aplicarFiltrosDesdeURL() {
  try {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('cat');

    if (cat) {
      filtrosProductos.categoria = cat;
    }
  } catch (e) {}
}

function obtenerProductosFiltrados() {
  var lista = PRODUCTOS.slice();

  if (filtrosProductos.texto) {
    var q = String(filtrosProductos.texto).trim().toLowerCase();

    if (q) {
      lista = lista.filter(function (p) {
        return (
          String(p.nombre || '').toLowerCase().indexOf(q) !== -1 ||
          String(p.marca || '').toLowerCase().indexOf(q) !== -1 ||
          String(p.categoria || '').toLowerCase().indexOf(q) !== -1
        );
      });
    }
  }

  if (filtrosProductos.categoria) {
    lista = lista.filter(function (p) {
      return p.categoria === filtrosProductos.categoria;
    });
  }

  if (filtrosProductos.marca) {
    lista = lista.filter(function (p) {
      return p.marca === filtrosProductos.marca;
    });
  }

  if (filtrosProductos.precioMax > 0) {
    lista = lista.filter(function (p) {
      return precioOrden(p) <= filtrosProductos.precioMax;
    });
  }

  if (filtrosProductos.soloStock) {
    lista = lista.filter(function (p) {
      return Number(p.stockQty) > 0;
    });
  }

  if (filtrosProductos.soloOferta) {
    lista = lista.filter(function (p) {
      return p.tieneOferta;
    });
  }

  if (filtrosProductos.orden === 'nombre') {
    lista.sort(function (a, b) {
      return a.nombre.localeCompare(b.nombre, 'es');
    });
  } else if (filtrosProductos.orden === 'precio-asc') {
    lista.sort(function (a, b) {
      return precioOrden(a) - precioOrden(b);
    });
  } else if (filtrosProductos.orden === 'precio-desc') {
    lista.sort(function (a, b) {
      return precioOrden(b) - precioOrden(a);
    });
  }

  return lista;
}

function precioOrden(p) {
  return Number(p.tieneOferta ? p.precioFinal : p.precio) || 0;
}

/* ── RENDER ── */

function renderProductos() {
  var grid = document.getElementById('productsGrid');
  var contador = document.getElementById('productsCount');

  if (!grid) {
    return;
  }

  var lista = obtenerProductosFiltrados();

  if (contador) {
    contador.textContent =
      lista.length + (lista.length === 1 ? ' producto' : ' productos');
  }

  grid.innerHTML = '';

  if (!lista.length) {
    var box = document.createElement('div');
    box.className = 'estado-msg';

    var p = document.createElement('p');
    p.textContent = 'No hay productos que coincidan con los filtros seleccionados.';
    box.appendChild(p);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Limpiar filtros';
    btn.addEventListener('click', limpiarFiltrosProductos);
    box.appendChild(btn);

    grid.appendChild(box);
    return;
  }

  lista.forEach(function (producto) {
    grid.appendChild(crearTarjetaProducto(producto));
  });
}

function crearTarjetaProducto(producto) {
  var card = document.createElement('article');
  card.className = 'product-card';

  var sinStock = !producto.stock || Number(producto.stockQty) <= 0;

  card.classList.toggle('sin-stock', sinStock);

  var imgWrap = document.createElement('div');
  imgWrap.className = 'product-img-wrap img-slot';

  var img = document.createElement('img');
  img.className = 'product-img';
  img.src = producto.img;
  img.alt = producto.nombre;
  img.loading = 'lazy';
  img.onerror = function () {
    if (img.src.indexOf('placeholder.svg') === -1) {
      img.src = PLACEHOLDER_IMG;
    }
  };
  imgWrap.appendChild(img);

  var badgeTxt = '';

  if (producto.tieneOferta && producto.oferta) {
    badgeTxt = etiquetaOfertaLocal(producto.oferta);
  } else if (producto.badge === 'nuevo') {
    badgeTxt = 'Nuevo';
  } else if (producto.badge === 'oferta') {
    badgeTxt = 'Oferta';
  }

  if (badgeTxt) {
    var badge = document.createElement('span');
    badge.className = 'product-badge';

    if (producto.oferta && producto.oferta.color) {
      badge.style.background = String(producto.oferta.color);
    }

    badge.textContent = badgeTxt;
    imgWrap.appendChild(badge);
  }

  card.appendChild(imgWrap);

  var body = document.createElement('div');
  body.className = 'product-body';

  if (producto.marca) {
    var brand = document.createElement('span');
    brand.className = 'product-brand';
    brand.textContent = producto.marca;
    body.appendChild(brand);
  }

  var cat = document.createElement('span');
  cat.className = 'product-category';
  cat.textContent = producto.categoria || '';
  body.appendChild(cat);

  var h3 = document.createElement('h3');
  h3.className = 'product-name';
  h3.textContent = producto.nombre;
  body.appendChild(h3);

  var desc = document.createElement('p');
  desc.className = 'product-description';
  desc.textContent = producto.desc || '';
  body.appendChild(desc);

  var favRow = document.createElement('div');
  favRow.className = 'product-fav-row';

  var favBtn = document.createElement('button');
  favBtn.type = 'button';
  favBtn.className = 'fav-btn' + (esFavoritoProducto(producto.id) ? ' active' : '');
  favBtn.setAttribute('aria-label', 'Agregar a favoritos');
  favBtn.setAttribute('aria-pressed', String(esFavoritoProducto(producto.id)));
  favBtn.textContent = esFavoritoProducto(producto.id) ? '♥ En favoritos' : '♡ Favorito';
  favBtn.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleFavoritoProducto(producto.id, favBtn);
  });
  favRow.appendChild(favBtn);
  body.appendChild(favRow);

  var footer = document.createElement('div');
  footer.className = 'product-footer';

  var left = document.createElement('div');

  var price = document.createElement('div');
  price.className = 'product-price';
  pintarPrecioLocal(price, producto);
  left.appendChild(price);

  var stock = document.createElement('p');
  stock.className = 'product-stock' + (sinStock ? ' out-of-stock' : '');
  stock.textContent = sinStock
    ? 'Sin stock'
    : 'Stock disponible: ' + Number(producto.stockQty);
  left.appendChild(stock);

  footer.appendChild(left);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-product';
  btn.disabled = sinStock;
  btn.textContent = sinStock ? 'Sin stock' : 'Ver producto';
  btn.addEventListener('click', function (event) {
    event.stopPropagation();
    abrirPanelProducto(producto);
  });
  footer.appendChild(btn);

  body.appendChild(footer);
  card.appendChild(body);

  card.addEventListener('click', function (event) {
    if (event.target.closest('button')) {
      return;
    }

    abrirPanelProducto(producto);
  });

  return card;
}

function pintarPrecioLocal(contenedor, producto) {
  contenedor.innerHTML = '';

  if (producto.tieneOferta && Number(producto.precioFinal) < Number(producto.precio)) {
    var tachado = document.createElement('s');
    tachado.className = 'precio-tachado';
    tachado.textContent = formatoPrecioLocal(producto.precio);
    contenedor.appendChild(tachado);
    contenedor.appendChild(document.createTextNode(' '));

    var f = document.createElement('strong');
    f.className = 'precio-final';
    f.textContent = formatoPrecioLocal(producto.precioFinal);
    contenedor.appendChild(f);
  } else {
    contenedor.textContent = formatoPrecioLocal(producto.precio);
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

/* ── PANEL ── */

function abrirPanelProducto(producto) {
  productoSeleccionado = producto;

  var panel = document.getElementById('productPanel');
  var backdrop = document.getElementById('productPanelBackdrop');

  if (!panel) {
    return;
  }

  var imagen = document.getElementById('panelProductoImagen');
  var marca = document.getElementById('panelProductoMarca');
  var categoria = document.getElementById('panelProductoCategoria');
  var nombre = document.getElementById('panelProductoNombre');
  var precio = document.getElementById('panelProductoPrecio');
  var stock = document.getElementById('panelProductoStock');
  var descripcion = document.getElementById('panelProductoDescripcion');
  var agregar = document.getElementById('panelProductoAgregar');

  if (imagen) {
    imagen.innerHTML = '';

    var img = document.createElement('img');
    img.className = 'panel-product-img';
    img.src = producto.img;
    img.alt = producto.nombre;
    img.loading = 'lazy';
    img.onerror = function () {
      if (img.src.indexOf('placeholder.svg') === -1) {
        img.src = PLACEHOLDER_IMG;
      }
    };
    imagen.appendChild(img);
  }

  if (marca) {
    marca.textContent = producto.marca || '';
  }

  if (categoria) {
    categoria.textContent = producto.categoria || '';
  }

  if (nombre) {
    nombre.textContent = producto.nombre || '';
  }

  if (precio) {
    pintarPrecioLocal(precio, producto);
  }

  var cantidadStock = Number(producto.stockQty) || 0;

  if (stock) {
    stock.textContent =
      cantidadStock > 0 ? 'Stock disponible: ' + cantidadStock : 'Sin stock';
    stock.classList.toggle('out-of-stock', cantidadStock <= 0);
  }

  if (descripcion) {
    descripcion.textContent = producto.desc || '';
  }

  var resenasBox = document.getElementById('resenasProductoWrap');

  if (!resenasBox) {
    resenasBox = document.createElement('div');
    resenasBox.id = 'resenasProductoWrap';

    var panelBody = document.querySelector('.product-panel-body');

    if (panelBody) {
      panelBody.appendChild(resenasBox);
    }
  }

  if (typeof window.renderSeccionResenasProducto === 'function') {
    window.renderSeccionResenasProducto(producto.id, producto.nombre, 'resenasProductoWrap');
  }

  if (agregar) {
    var nuevo = agregar.cloneNode(false);
    nuevo.disabled = cantidadStock <= 0;
    nuevo.textContent = cantidadStock > 0 ? 'Agregar al carrito' : 'Sin stock';
    agregar.replaceWith(nuevo);

    nuevo.addEventListener('click', function () {
      agregarProducto(producto.id);
    });
  }

  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');

  if (backdrop) {
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
  }

  document.body.classList.add('panel-open');

  var cerrar = document.getElementById('productPanelClose');

  if (cerrar) {
    cerrar.focus();
  }
}

function cerrarPanelProducto() {
  var panel = document.getElementById('productPanel');
  var backdrop = document.getElementById('productPanelBackdrop');

  if (panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  document.body.classList.remove('panel-open');

  productoSeleccionado = null;

  try {
    var params = new URLSearchParams(window.location.search);

    if (params.has('id')) {
      params.delete('id');
      var query = params.toString();

      window.history.replaceState(
        {},
        '',
        window.location.pathname + (query ? '?' + query : '')
      );
    }
  } catch (e) {}
}

function abrirProductoDesdeURL() {
  var id = null;

  try {
    id = new URLSearchParams(window.location.search).get('id');
  } catch (e) {}

  if (!id) {
    return;
  }

  var producto = PRODUCTOS.find(function (item) {
    return String(item.id) === String(id);
  });

  if (producto) {
    abrirPanelProducto(producto);
  }
}

/* ── CARRITO POR API (solo con sesión iniciada) ── */

function agregarProducto(id) {
  var producto = PRODUCTOS.find(function (item) {
    return Number(item.id) === Number(id);
  });

  if (!producto) {
    return Promise.resolve();
  }

  if (Number(producto.stockQty) <= 0) {
    if (typeof window.showToast === 'function') {
      window.showToast('Este producto no tiene stock.');
    }

    return Promise.resolve();
  }

  var boton = document.getElementById('panelProductoAgregar');

  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Verificando sesión...';
  }

  return sesionServidorOk().then(function (ok) {
    if (!ok) {
      if (boton && document.body.contains(boton)) {
        boton.disabled = false;
        boton.textContent = 'Agregar al carrito';
      }

      irALogin();
      return;
    }

    if (boton) {
      boton.textContent = 'Agregando...';
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
          throw new Error(data.mensaje || data.error || 'No se pudo agregar el producto al carrito.');
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

      if (boton && document.body.contains(boton)) {
        boton.textContent = 'Agregado';

        setTimeout(function () {
          if (document.body.contains(boton)) {
            boton.textContent = 'Agregar al carrito';
            boton.disabled = false;
          }
        }, 1500);
      }
    })
    .catch(function (error) {
      if (typeof window.showToast === 'function') {
        window.showToast(error.message || 'No se pudo agregar el producto.');
      }

      if (boton && document.body.contains(boton)) {
        boton.textContent = 'Agregar al carrito';
        boton.disabled = false;
      }
    });
  });
}

function leerFavoritosProductos() {
  try {
    var lista = JSON.parse(window.localStorage.getItem('senderos-likes-productos') || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
}

function esFavoritoProducto(id) {
  return leerFavoritosProductos().indexOf(Number(id)) !== -1;
}

function toggleFavoritoProducto(id, boton) {
  var lista = leerFavoritosProductos();
  var num = Number(id);
  var idx = lista.indexOf(num);

  if (idx === -1) {
    lista.push(num);
  } else {
    lista.splice(idx, 1);
  }

  try {
    window.localStorage.setItem('senderos-likes-productos', JSON.stringify(lista));
  } catch (e) {}

  var activo = idx === -1;

  if (boton) {
    boton.classList.toggle('active', activo);
    boton.setAttribute('aria-pressed', String(activo));
    boton.textContent = activo ? '♥ En favoritos' : '♡ Favorito';
  }

  if (typeof window.showToast === 'function') {
    window.showToast(activo ? 'Agregado a favoritos' : 'Quitado de favoritos');
  }
}

function limpiarFiltrosProductos() {
  filtrosProductos.texto = '';
  filtrosProductos.categoria = '';
  filtrosProductos.marca = '';
  filtrosProductos.precioMax = 0;
  filtrosProductos.soloStock = false;
  filtrosProductos.soloOferta = false;
  filtrosProductos.orden = '';

  prepararFiltrosProductos();
  renderProductos();
}

/* ── SESIÓN REQUERIDA (verificada en el servidor) ── */

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

function irALogin() {
  try {
    window.localStorage.setItem('redirectAfterLogin', 'productos.html' + window.location.search);
  } catch (e) {}

  if (typeof window.showToast === 'function') {
    window.showToast('Iniciá sesión para agregar productos al carrito.');
  }

  setTimeout(function () {
    window.location.href = 'login.html';
  }, 600);
}

function formatoPrecioLocal(valor) {
  if (typeof window.formatoPrecio === 'function') {
    return window.formatoPrecio(Number(valor) || 0);
  }

  return '$' + Number(valor || 0).toLocaleString('es-AR');
}
