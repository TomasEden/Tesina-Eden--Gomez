/* Senderos — servicios.js
   Catálogo de servicios con ofertas del servidor, filtros accesibles,
   favoritos, panel de detalle con reseñas y agregado por API.
*/

var API_SERVICIOS = '../api/servicios.php';
var PLACEHOLDER_IMG = '../img/placeholder.svg';

var SERVICIOS = [];
var categoriaActiva = 'todas';
var servicioActivo = null;
var likesGuardados = [];

try {
  likesGuardados = JSON.parse(window.localStorage.getItem('senderos-likes') || '[]');

  if (!Array.isArray(likesGuardados)) {
    likesGuardados = [];
  }
} catch (e) {
  likesGuardados = [];
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  cablearPanel();

  if (typeof window.cargarOfertas === 'function') {
    window.cargarOfertas().then(cargarServicios).catch(cargarServicios);
  } else {
    cargarServicios();
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      cerrarPanel();
    }
  });
});

function cablearPanel() {
  var backdrop = document.getElementById('srvPanelBackdrop');

  if (backdrop) {
    backdrop.addEventListener('click', cerrarPanel);
  }
}

/* ── CARGAR ── */

function cargarServicios() {
  fetch(API_SERVICIOS, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.ok) {
          throw new Error((data && (data.mensaje || data.error)) || 'Error al cargar servicios');
        }

        return data.servicios;
      });
    })
    .then(function (servicios) {
      SERVICIOS = (Array.isArray(servicios) ? servicios : []).map(normalizarServicio);

      renderCategoryBar();
      aplicarCategoriaDesdeURL();
      renderServicios();
      abrirPanelDesdeURL();
      renderResumenGeneral();
    })
    .catch(function () {
      if (typeof window.mostrarErrorConexion === 'function') {
        window.mostrarErrorConexion(cargarServicios);
      } else if (typeof window.showToast === 'function') {
        window.showToast('Error de conexión con el servidor');
      }
    });
}

function normalizarServicio(servicio) {
  var precio = Number(servicio.precio) || 0;
  var precioFinal =
    servicio.precio_final !== undefined && servicio.precio_final !== null
      ? Number(servicio.precio_final)
      : precio;

  return {
    id: String(servicio.slug || servicio.id),
    dbId: Number(servicio.id),
    nombre: String(servicio.nombre || ''),
    categoria: String(servicio.categoria || 'General'),
    desc: String(servicio.descripcion || ''),
    duracionMin: Number(servicio.duracion) || 0,
    duracion: (Number(servicio.duracion) || 0) + ' min',
    precio: precio,
    precioFinal: precioFinal,
    oferta: servicio.oferta || null,
    tieneOferta: Boolean(servicio.tiene_oferta) || precioFinal < precio,
    badge: String(servicio.badge || '').toLowerCase() || null,
    badgeText: String(servicio.badge_texto || servicio.badge || ''),
    img: String(servicio.imagen || '').trim() || PLACEHOLDER_IMG,
    incluye: String(servicio.incluye || '')
      .split('|')
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean)
  };
}

/* ── CATEGORÍAS (sin onclick inline) ── */

function renderCategoryBar() {
  var bar = document.getElementById('categoryBar');

  if (!bar) {
    return;
  }

  bar.innerHTML = '';

  var categorias = ['todas'].concat(
    Array.from(new Set(SERVICIOS.map(function (s) { return s.categoria; }))).sort(function (a, b) {
      return a.localeCompare(b, 'es');
    })
  );

  categorias.forEach(function (categoria) {
    var cantidad =
      categoria === 'todas'
        ? SERVICIOS.length
        : SERVICIOS.filter(function (s) { return s.categoria === categoria; }).length;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-tab' + (categoria === categoriaActiva ? ' active' : '');
    btn.dataset.categoria = categoria;
    btn.setAttribute('aria-pressed', String(categoria === categoriaActiva));

    var etiqueta = document.createElement('span');
    etiqueta.textContent = categoria === 'todas' ? 'Todos' : categoria;
    btn.appendChild(etiqueta);

    var count = document.createElement('span');
    count.className = 'cat-count';
    count.textContent = String(cantidad);
    btn.appendChild(document.createTextNode(' '));
    btn.appendChild(count);

    btn.addEventListener('click', function () {
      filtrarCat(categoria);
    });

    bar.appendChild(btn);
  });
}

function filtrarCat(categoria) {
  categoriaActiva = categoria || 'todas';

  document.querySelectorAll('.cat-tab').forEach(function (item) {
    var activa = item.dataset.categoria === categoriaActiva;
    item.classList.toggle('active', activa);
    item.setAttribute('aria-pressed', String(activa));
  });

  renderServicios();
}

function aplicarCategoriaDesdeURL() {
  try {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('cat');

    if (cat) {
      var existe = SERVICIOS.some(function (s) { return s.categoria === cat; });

      if (existe) {
        categoriaActiva = cat;
      }
    }
  } catch (e) {}
}

/* ── TARJETAS ── */

function renderServicios() {
  var grid = document.getElementById('servicesGrid');
  var empty = document.getElementById('emptyState');

  if (!grid) {
    return;
  }

  var lista =
    categoriaActiva === 'todas'
      ? SERVICIOS
      : SERVICIOS.filter(function (s) { return s.categoria === categoriaActiva; });

  grid.innerHTML = '';

  if (!lista.length) {
    if (empty) {
      empty.classList.remove('hidden');
    }

    return;
  }

  if (empty) {
    empty.classList.add('hidden');
  }

  lista.forEach(function (servicio, index) {
    grid.appendChild(crearTarjeta(servicio, index));
  });

  observarReveal(grid);
}

function crearTarjeta(servicio, index) {
  var card = document.createElement('article');
  card.className = 'service-card reveal';
  card.style.animationDelay = index * 0.06 + 's';

  var liked = likesGuardados.indexOf(servicio.id) !== -1;

  var imgWrap = document.createElement('div');
  imgWrap.className = 'service-img-wrap';
  imgWrap.addEventListener('click', function () {
    abrirPanel(servicio.id);
  });

  var img = document.createElement('img');
  img.className = 'service-img';
  img.src = servicio.img;
  img.alt = servicio.nombre;
  img.loading = 'lazy';
  img.onerror = function () {
    if (img.src.indexOf('placeholder.svg') === -1) {
      img.src = PLACEHOLDER_IMG;
    }
  };
  imgWrap.appendChild(img);

  if (servicio.tieneOferta && servicio.oferta) {
    var badge = document.createElement('span');
    badge.className = 'oferta-badge-sitio';
    badge.style.background = String(servicio.oferta.color || '#AD717E');
    badge.textContent = etiquetaOferta(servicio.oferta);
    imgWrap.appendChild(badge);
  } else if (servicio.badge) {
    var b2 = document.createElement('span');
    b2.className = 'service-badge ' + servicio.badge;
    b2.textContent = servicio.badgeText || servicio.badge;
    imgWrap.appendChild(b2);
  }

  var like = document.createElement('button');
  like.type = 'button';
  like.className = 'service-likes' + (liked ? ' liked' : '');
  like.setAttribute('aria-label', liked ? 'Quitar de favoritos' : 'Agregar a favoritos');
  like.setAttribute('aria-pressed', String(liked));

  var likeIcon = document.createElement('span');
  likeIcon.className = 'like-icon';

  var likeImg = document.createElement('img');
  likeImg.src = '../img/icons/' + (liked ? 'corazon2' : 'corazon1') + '.svg';
  likeImg.alt = '';
  likeImg.width = 15;
  likeImg.height = 15;
  likeIcon.appendChild(likeImg);
  like.appendChild(likeIcon);

  like.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleLike(servicio.id, like);
  });

  imgWrap.appendChild(like);
  card.appendChild(imgWrap);

  var body = document.createElement('div');
  body.className = 'service-body';

  var meta = document.createElement('div');
  meta.className = 'service-meta';

  var cat = document.createElement('span');
  cat.className = 'service-cat';
  cat.textContent = servicio.categoria;
  meta.appendChild(cat);
  body.appendChild(meta);

  var h3 = document.createElement('h3');
  h3.className = 'service-name';
  h3.textContent = servicio.nombre;
  h3.addEventListener('click', function () {
    abrirPanel(servicio.id);
  });
  body.appendChild(h3);

  var desc = document.createElement('p');
  desc.className = 'service-desc';
  desc.textContent = servicio.desc;
  body.appendChild(desc);

  var footer = document.createElement('div');
  footer.className = 'service-footer';

  var left = document.createElement('div');

  var dur = document.createElement('span');
  dur.className = 'service-duracion';

  var durImg = document.createElement('img');
  durImg.src = '../img/icons/tiempo.svg';
  durImg.alt = '';
  durImg.width = 13;
  durImg.height = 13;
  dur.appendChild(durImg);
  dur.appendChild(document.createTextNode(' ' + servicio.duracion));
  left.appendChild(dur);

  left.appendChild(document.createTextNode(' '));

  var price = document.createElement('span');
  price.className = 'service-price';
  pintarPrecio(price, servicio.precio, servicio.precioFinal, servicio.tieneOferta);
  left.appendChild(price);

  footer.appendChild(left);

  var ver = document.createElement('button');
  ver.type = 'button';
  ver.className = 'btn-ver-servicio';
  ver.textContent = 'Ver detalle';
  ver.addEventListener('click', function () {
    abrirPanel(servicio.id);
  });
  footer.appendChild(ver);

  body.appendChild(footer);
  card.appendChild(body);

  return card;
}

function pintarPrecio(contenedor, original, final, conOferta) {
  contenedor.innerHTML = '';

  if (conOferta && final < original) {
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

function etiquetaOferta(oferta) {
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

function observarReveal(grid) {
  if (typeof IntersectionObserver === 'undefined') {
    grid.querySelectorAll('.reveal').forEach(function (item) {
      item.classList.add('visible');
    });

    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );

  grid.querySelectorAll('.reveal').forEach(function (item) {
    observer.observe(item);
  });
}

/* ── PANEL ── */

function abrirPanelDesdeURL() {
  var id = null;

  try {
    id = new URLSearchParams(window.location.search).get('id');
  } catch (e) {}

  if (!id) {
    return;
  }

  var servicio = SERVICIOS.find(function (s) {
    return s.id === id || String(s.dbId) === String(id);
  });

  if (servicio) {
    abrirPanel(servicio.id);
  }
}

function abrirPanel(id) {
  var servicio = SERVICIOS.find(function (item) {
    return item.id === id;
  });

  var panel = document.getElementById('srvPanel');
  var overlay = document.getElementById('srvPanelBackdrop');

  if (!servicio || !panel || !overlay) {
    return;
  }

  servicioActivo = servicio;
  panel.innerHTML = '';

  var imgWrap = document.createElement('div');
  imgWrap.className = 'panel-img-wrap';

  var img = document.createElement('img');
  img.src = servicio.img;
  img.alt = servicio.nombre;
  img.loading = 'lazy';
  img.onerror = function () {
    if (img.src.indexOf('placeholder.svg') === -1) {
      img.src = PLACEHOLDER_IMG;
    }
  };
  imgWrap.appendChild(img);

  var imgOverlay = document.createElement('div');
  imgOverlay.className = 'panel-img-overlay';
  imgWrap.appendChild(imgOverlay);

  var cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.className = 'panel-close';
  cerrar.setAttribute('aria-label', 'Cerrar');

  var cerrarImg = document.createElement('img');
  cerrarImg.src = '../img/icons/x.svg';
  cerrarImg.alt = '';
  cerrarImg.width = 12;
  cerrarImg.height = 12;
  cerrar.appendChild(cerrarImg);
  cerrar.addEventListener('click', cerrarPanel);
  imgWrap.appendChild(cerrar);

  var imgInfo = document.createElement('div');
  imgInfo.className = 'panel-img-info';

  var cat = document.createElement('span');
  cat.className = 'service-cat';
  cat.textContent = servicio.categoria;
  imgInfo.appendChild(cat);

  var h2 = document.createElement('h2');
  h2.className = 'panel-nombre';
  h2.textContent = servicio.nombre;
  imgInfo.appendChild(h2);

  var metaRow = document.createElement('div');
  metaRow.className = 'panel-meta-row';

  var dur = document.createElement('span');
  dur.className = 'panel-duracion';

  var durImg = document.createElement('img');
  durImg.src = '../img/icons/tiempo.svg';
  durImg.alt = '';
  durImg.width = 13;
  durImg.height = 13;
  dur.appendChild(durImg);
  dur.appendChild(document.createTextNode(' ' + servicio.duracion));
  metaRow.appendChild(dur);

  var rating = document.createElement('span');
  rating.className = 'panel-rating';
  rating.id = 'panelRatingWrap';
  metaRow.appendChild(rating);

  imgInfo.appendChild(metaRow);
  imgWrap.appendChild(imgInfo);

  if (servicio.tieneOferta && servicio.oferta) {
    var badge = document.createElement('span');
    badge.className = 'oferta-badge-sitio';
    badge.style.background = String(servicio.oferta.color || '#AD717E');
    badge.textContent = etiquetaOferta(servicio.oferta);
    imgWrap.appendChild(badge);
  } else if (servicio.badge) {
    var b2 = document.createElement('span');
    b2.className = 'service-badge ' + servicio.badge;
    b2.textContent = servicio.badgeText || servicio.badge;
    imgWrap.appendChild(b2);
  }

  panel.appendChild(imgWrap);

  var body = document.createElement('div');
  body.className = 'panel-body';

  var precioBar = document.createElement('div');
  precioBar.className = 'panel-precio-bar';

  var precioBox = document.createElement('div');
  var precioEl = document.createElement('div');
  precioEl.className = 'panel-precio';
  pintarPrecio(precioEl, servicio.precio, servicio.precioFinal, servicio.tieneOferta);
  precioBox.appendChild(precioEl);

  var sub = document.createElement('div');
  sub.className = 'panel-precio-sub';
  sub.textContent = 'por sesión';
  precioBox.appendChild(sub);

  precioBar.appendChild(precioBox);

  var agregar = document.createElement('button');
  agregar.type = 'button';
  agregar.className = 'btn-reservar-panel';
  agregar.textContent = 'Agregar al carrito';
  agregar.addEventListener('click', function () {
    agregarServicioCarrito(servicio.id);
  });
  precioBar.appendChild(agregar);

  body.appendChild(precioBar);

  var desc = document.createElement('p');
  desc.className = 'panel-desc';
  desc.textContent = servicio.desc;
  body.appendChild(desc);

  if (servicio.incluye.length) {
    var incluye = document.createElement('div');
    incluye.className = 'panel-incluye';

    var h4 = document.createElement('h4');
    h4.className = 'panel-section-title';
    h4.textContent = '¿Qué incluye?';
    incluye.appendChild(h4);

    var ul = document.createElement('ul');
    ul.className = 'panel-incluye-list';

    servicio.incluye.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });

    incluye.appendChild(ul);
    body.appendChild(incluye);
  }

  var sug = document.createElement('div');
  sug.className = 'panel-sugeridos';

  var h4s = document.createElement('h4');
  h4s.className = 'panel-section-title';
  h4s.textContent = 'También podría interesarte';
  sug.appendChild(h4s);

  var lista = document.createElement('div');
  lista.className = 'sugeridos-lista';

  SERVICIOS.filter(function (item) {
    return item.id !== servicio.id && item.categoria === servicio.categoria;
  })
    .slice(0, 2)
    .forEach(function (item) {
      var fila = document.createElement('div');
      fila.className = 'sugerido-item';
      fila.setAttribute('role', 'button');
      fila.setAttribute('tabindex', '0');
      fila.addEventListener('click', function () {
        abrirPanel(item.id);
      });
      fila.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          abrirPanel(item.id);
        }
      });

      var im = document.createElement('img');
      im.src = item.img;
      im.alt = '';
      im.loading = 'lazy';
      im.onerror = function () {
        if (im.src.indexOf('placeholder.svg') === -1) {
          im.src = PLACEHOLDER_IMG;
        }
      };
      fila.appendChild(im);

      var box = document.createElement('div');

      var n = document.createElement('div');
      n.className = 'sugerido-nombre';
      n.textContent = item.nombre;
      box.appendChild(n);

      var pr = document.createElement('div');
      pr.className = 'sugerido-precio';
      pr.textContent =
        formatoPrecioLocal(item.tieneOferta ? item.precioFinal : item.precio) +
        ' · ' +
        item.duracion;
      box.appendChild(pr);

      fila.appendChild(box);
      lista.appendChild(fila);
    });

  sug.appendChild(lista);
  body.appendChild(sug);

  var resenas = document.createElement('div');
  resenas.id = 'resenasPanelWrap';
  body.appendChild(resenas);

  panel.appendChild(body);

  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');

  document.body.classList.add('panel-open');

  if (typeof window.renderSeccionResenas === 'function') {
    window.renderSeccionResenas(servicio.id, 'resenasPanelWrap');
  }
}

function cerrarPanel() {
  var panel = document.getElementById('srvPanel');
  var overlay = document.getElementById('srvPanelBackdrop');

  if (panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  if (overlay) {
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
  }

  document.body.classList.remove('panel-open');

  servicioActivo = null;
}

/* ── FAVORITOS ── */

function toggleLike(id, boton) {
  /* Favoritos sólo con sesión iniciada (verificada en el servidor). */
  sesionServidorOk().then(function (ok) {
    if (!ok) {
      irALoginServicio('guardar favoritos.');
      return;
    }

    aplicarToggleLike(id, boton);
  });
}

function aplicarToggleLike(id, boton) {
  var index = likesGuardados.indexOf(id);
  var liked = index === -1;

  if (liked) {
    likesGuardados.push(id);
  } else {
    likesGuardados.splice(index, 1);
  }

  try {
    window.localStorage.setItem('senderos-likes', JSON.stringify(likesGuardados));
  } catch (e) {}

  boton.classList.toggle('liked', liked);
  boton.setAttribute('aria-label', liked ? 'Quitar de favoritos' : 'Agregar a favoritos');
  boton.setAttribute('aria-pressed', String(liked));

  /* iconos-adaptativos.js convierte <img> en <svg> inline: hay que
     reemplazar el nodo (img o svg) para que se vea al instante
     sin refrescar la página. */
  var actual = boton.querySelector('img, svg');
  if (actual) {
    actual.remove();
  }
  var icono = document.createElement('img');
  icono.src = '../img/icons/' + (liked ? 'corazon2' : 'corazon1') + '.svg';
  icono.alt = '';
  icono.width = 15;
  icono.height = 15;
  icono.setAttribute('aria-hidden', 'true');
  var cont = boton.querySelector('.like-icon');
  (cont || boton).appendChild(icono);
}

/* ── CARRITO POR API ── */

function agregarServicioCarrito(id) {
  var servicio = SERVICIOS.find(function (item) {
    return item.id === id;
  });

  if (!servicio) {
    return;
  }

  var boton = document.querySelector('.btn-reservar-panel');

  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Verificando sesión...';
  }

  return sesionServidorOk().then(function (ok) {
    if (!ok) {
      if (boton) {
        boton.disabled = false;
        boton.textContent = 'Agregar al carrito';
      }

      irALoginServicio();
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
      body: JSON.stringify({ tipo: 'servicio', id: Number(servicio.dbId) })
    })
      .then(function (respuesta) {
        return respuesta.json().then(function (data) {
          if (!respuesta.ok || !data.ok) {
            throw new Error(data.mensaje || data.error || 'No se pudo agregar el servicio al carrito.');
          }
        });
      })
      .then(function () {
        if (typeof window.actualizarNavbar === 'function') {
          window.actualizarNavbar();
        }

        if (typeof window.showToast === 'function') {
          window.showToast('Servicio agregado al carrito');
        }

        if (boton) {
          boton.textContent = 'Agregado';

          setTimeout(function () {
            if (document.body.contains(boton)) {
              boton.textContent = 'Agregar al carrito';
            }
          }, 1500);
        }
      })
      .catch(function (error) {
        if (typeof window.showToast === 'function') {
          window.showToast(error.message || 'No se pudo agregar el servicio.');
        }

        if (boton) {
          boton.textContent = 'Agregar al carrito';
        }
      })
      .finally(function () {
        if (boton) {
          boton.disabled = false;
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

function irALoginServicio(motivo) {
  try {
    window.localStorage.setItem('redirectAfterLogin', 'servicios.html' + window.location.search);
  } catch (e) {}

  if (typeof window.showToast === 'function') {
    window.showToast(
      'Iniciá sesión para ' +
        String(motivo || 'agregar servicios al carrito.')
    );
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

/* ── RESEÑAS GENERALES ("Lo que dicen de nosotros") ── */

function renderResumenGeneral() {
  var contenedor = document.getElementById('reviewsServices');

  if (!contenedor) {
    return;
  }

  fetch('../api/resenas.php?resumen=1', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (data) {
      var resumen = Array.isArray(data && data.resumen) ? data.resumen : [];

      contenedor.innerHTML = '';

      if (!resumen.length) {
        var seccion = contenedor.closest('.reviews-section');

        if (seccion) {
          seccion.hidden = true;
        }

        return;
      }

      resumen
        .slice()
        .sort(function (a, b) {
          return Number(b.promedio) - Number(a.promedio);
        })
        .slice(0, 3)
        .forEach(function (fila) {
          var servicio = SERVICIOS.find(function (s) {
            return s.id === String(fila.servicio_slug);
          });

          var card = document.createElement('article');
          card.className = 'review-card';

          var nombre = document.createElement('strong');
          nombre.textContent = servicio ? servicio.nombre : String(fila.servicio_slug);
          card.appendChild(nombre);

          var prom = document.createElement('p');
          prom.textContent =
            Number(fila.promedio).toFixed(1) + ' ★ · ' + Number(fila.cantidad) + ' reseñas';
          card.appendChild(prom);

          if (servicio) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', function () {
              abrirPanel(servicio.id);
            });
          }

          contenedor.appendChild(card);
        });
    })
    .catch(function () {
      var seccion = contenedor.closest('.reviews-section');

      if (seccion) {
        seccion.hidden = true;
      }
    });
}
