/* ═══════════════════════════════════════════════════════════════
   Senderos — carrito.js
   Carrito por api/carrito.php + checkout por api/checkout.php.
   Interfaz de tres etapas, sin recargar la página.
   ═══════════════════════════════════════════════════════════════ */

var API_CARRITO = '../api/carrito.php';
var API_CHECKOUT = '../api/checkout.php';
var API_DISPONIBILIDAD = '../api/turnos.php';
var API_CONFIG = '../api/configuracion.php';
var API_PAGO_CONFIG = '../api/pago_config.php';

var carritoActual = null;
var mpDisponible = false;
var costoEnvio = 0;
var envioConocido = false;
var checkoutEnviando = false;
var checkoutToken = '';
var pasoActual = 1;
var productosEnCurso = {};
var cfgTurnos = { diasCerrados: [0], feriados: [], ventanas: [], pasoMin: 30 };
var calendarioAbierto = null;
var mensajeTimer = null;

document.addEventListener('DOMContentLoaded', inicializarCarrito);

function inicializarCarrito() {
  aplicarConfigPago();
  aplicarDatosNegocio();
  cablearCheckout();
  cargarConfiguracionPago();

  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  actualizarCarrito();

  cargarCostoEnvio()
    .then(function () {
      if (carritoActual) {
        actualizarResumen(carritoActual);
        actualizarOpcionesCheckout();
      }
    })
    .catch(function () {
      if (carritoActual) {
        actualizarResumen(carritoActual);
      }
    });

  document.addEventListener('change', manejarCambioCarrito);
  document.addEventListener('click', manejarClickCarrito);
  document.addEventListener('input', manejarInputCarrito);
}

/* ═══════════ API ═══════════ */

function obtenerCarrito() {
  return fetch(API_CARRITO, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          throw new Error(data.mensaje || data.error || 'No se pudo cargar el carrito.');
        }

        return data;
      });
    })
    .then(function (data) {
      return {
        carrito: data.carrito || {
          productos: [],
          servicios: [],
          total_productos: 0,
          total_servicios: 0,
          total: 0
        },
        avisos: Array.isArray(data.avisos) ? data.avisos : []
      };
    })
    .catch(function () {
      if (typeof window.mostrarErrorConexion === 'function') {
        window.mostrarErrorConexion(actualizarCarrito);
      }

      throw new Error('No se pudo cargar el carrito.');
    });
}

function enviarCarrito(method, body) {
  var opciones = {
    method: method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  };

  if (body !== null && body !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(body);
  }

  return fetch(API_CARRITO, opciones)
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          throw new Error(data.mensaje || data.error || 'No se pudo actualizar el carrito.');
        }

        return data;
      });
    })
    .catch(function (error) {
      if (error && error.message === 'Failed to fetch') {
        if (typeof window.mostrarErrorConexion === 'function') {
          window.mostrarErrorConexion(actualizarCarrito);
        }
      }

      throw error;
    });
}

/* ═══════════ ESTADO GENERAL ═══════════ */

function actualizarCarrito() {
  return obtenerCarrito()
    .then(function (resultado) {
      carritoActual = resultado.carrito;

      renderProductos(carritoActual.productos || []);
      renderServicios(carritoActual.servicios || []);
      renderAvisos(resultado.avisos);
      actualizarCantidades(carritoActual);
      actualizarResumen(carritoActual);
      actualizarOpcionesCheckout();
      actualizarEstadoVacio(carritoActual);

      if (pasoActual === 2) {
        renderTurnosCheckout();
      } else if (pasoActual === 3) {
        renderRevisionFinal();
      }

      if (typeof window.actualizarNavbar === 'function') {
        window.actualizarNavbar();
      }
    })
    .catch(function (error) {
      mostrarMensaje(error.message || 'No se pudo cargar el carrito.');
    });
}

function carritoEstaVacio(carrito) {
  var c = carrito || carritoActual || {};
  return !((c.productos || []).length || (c.servicios || []).length);
}

function renderAvisos(avisos) {
  var caja = document.getElementById('carrito-avisos');

  if (!caja) {
    return;
  }

  caja.innerHTML = '';

  if (!avisos || !avisos.length) {
    caja.hidden = true;
    return;
  }

  avisos.forEach(function (texto) {
    var p = document.createElement('p');
    p.textContent = String(texto || '');
    caja.appendChild(p);
  });

  caja.hidden = false;
}

function actualizarCantidades(carrito) {
  var productos = carrito.productos || [];
  var servicios = carrito.servicios || [];
  var total = 0;

  productos.forEach(function (p) {
    total += Math.max(0, Number(p.cantidad) || 0);
  });

  total += servicios.length;

  var texto = total === 1 ? '1 ítem' : total + ' ítems';
  var cabecera = document.getElementById('carrito-cantidad');
  var resumen = document.getElementById('resumen-cantidad');

  if (cabecera) {
    cabecera.textContent = texto;
  }

  if (resumen) {
    resumen.textContent = texto;
  }
}

function calcularResumen(carrito) {
  carrito = carrito || { productos: [], servicios: [] };

  var grupo = grupoElegido();
  var incluyeProductos = grupo !== 'servicios';
  var incluyeServicios = grupo !== 'productos';
  var productos = carrito.productos || [];
  var servicios = carrito.servicios || [];

  var envioPendiente = false;
  var envio = 0;

  if (
    incluyeProductos &&
    productos.length &&
    entregaElegida() === 'envio'
  ) {
    if (envioConocido) {
      envio = Number(costoEnvio) || 0;
    } else {
      envioPendiente = true;
    }
  }

  var subtotalProductos = Number(carrito.total_productos) || 0;
  var subtotalServicios = Number(carrito.total_servicios) || 0;
  var descuento = 0;

  (incluyeProductos ? productos : []).forEach(function (p) {
    var original = Number(p.precio) || 0;
    var cantidad = Math.max(0, Number(p.cantidad) || 0);
    var subtotal = Number(p.subtotal) || 0;
    descuento += Math.max(0, original * cantidad - subtotal);
  });

  (incluyeServicios ? servicios : []).forEach(function (s) {
    var original = Number(s.precio) || 0;
    var subtotal = Number(s.subtotal) || 0;
    descuento += Math.max(0, original - subtotal);
  });

  var totalGrupo =
    (incluyeProductos ? subtotalProductos : 0) +
    (incluyeServicios ? subtotalServicios : 0) +
    envio;

  return {
    grupo: grupo,
    incluyeProductos: incluyeProductos,
    incluyeServicios: incluyeServicios,
    subtotalProductos: subtotalProductos,
    subtotalServicios: subtotalServicios,
    descuento: Math.round(descuento * 100) / 100,
    envio: envio,
    envioPendiente: envioPendiente,
    total: Math.round(totalGrupo * 100) / 100,
    tieneProductos: productos.length > 0,
    tieneServicios: servicios.length > 0
  };
}

function actualizarResumen(carrito) {
  carrito = carrito || { productos: [], servicios: [] };

  var datos = calcularResumen(carrito);
  var totalProductos = document.getElementById('total-productos');
  var totalServicios = document.getElementById('total-servicios');
  var totalCarrito = document.getElementById('total-carrito');
  var totalLabel = document.getElementById('resumen-total-label');
  var lineaEnvio = document.getElementById('linea-envio');
  var totalEnvio = document.getElementById('total-envio');
  var lineaDescuento = document.getElementById('linea-descuento');
  var totalDescuento = document.getElementById('total-descuento');

  if (totalProductos) {
    totalProductos.textContent = formatoDinero(datos.subtotalProductos);
  }

  if (totalServicios) {
    totalServicios.textContent = formatoDinero(datos.subtotalServicios);
  }

  if (lineaDescuento) {
    lineaDescuento.hidden = !(datos.descuento > 0);
  }

  if (totalDescuento) {
    totalDescuento.textContent = '−' + formatoDinero(datos.descuento);
  }

  if (lineaEnvio) {
    lineaEnvio.hidden = !(datos.envio > 0 || datos.envioPendiente);
  }

  if (totalEnvio) {
    totalEnvio.textContent = datos.envioPendiente
      ? 'A confirmar'
      : formatoDinero(datos.envio);
  }

  if (totalLabel) {
    totalLabel.textContent = datos.envioPendiente
      ? 'Total pendiente de envío'
      : 'Total a pagar';
  }

  if (totalCarrito) {
    totalCarrito.textContent = datos.envioPendiente
      ? 'A confirmar'
      : formatoDinero(datos.total);
  }

  var ayuda = document.getElementById('resumen-grupo-ayuda');

  if (ayuda) {
    if (datos.grupo === 'todo') {
      ayuda.textContent = 'Este pago incluye productos y turnos en una sola operación. El resumen muestra ambos grupos por separado.';
    } else if (datos.grupo === 'servicios') {
      ayuda.textContent = datos.tieneProductos
        ? 'Este pago incluye solo los servicios. Los productos quedan guardados en tu carrito.'
        : 'Este pago incluye tus servicios. Elegí fecha y horario en el paso siguiente.';
    } else {
      ayuda.textContent = datos.tieneServicios
        ? 'Este pago incluye solo los productos. Los servicios quedan guardados en tu carrito.'
        : 'Este pago incluye tus productos. El envío se suma cuando corresponde.';
    }
  }
}

function actualizarEstadoVacio(carrito) {
  var vacio = carritoEstaVacio(carrito);

  if (vacio && pasoActual !== 1) {
    pasoActual = 1;
  }

  aplicarVisibilidadPasos(vacio);
  actualizarProgreso();

  var vacioEl = document.getElementById('carrito-vacio');
  var resumen = document.getElementById('carrito-resumen');
  var progreso = document.getElementById('checkout-progress');

  if (vacioEl) {
    vacioEl.hidden = !vacio;
  }

  if (resumen) {
    resumen.hidden = vacio;
  }

  if (progreso) {
    progreso.hidden = vacio;
  }

  if (vacio) {
    cerrarCalendario();
  }
}

function aplicarVisibilidadPasos(vacio) {
  var pagina = document.querySelector('.carrito-page');
  var paso1 = document.getElementById('paso-carrito');
  var paso2 = document.getElementById('paso-entrega');
  var paso3 = document.getElementById('paso-confirmacion');

  if (pagina) {
    pagina.setAttribute('data-paso', vacio ? '0' : String(pasoActual));
  }

  if (paso1) {
    paso1.hidden = vacio || pasoActual !== 1;
  }

  if (paso2) {
    paso2.hidden = vacio || pasoActual !== 2;
  }

  if (paso3) {
    paso3.hidden = vacio || pasoActual !== 3;
  }

  var continuar = document.getElementById('btn-continuar-compra');
  var vaciar = document.getElementById('btn-vaciar-carrito');
  var acciones = document.querySelector('.resumen-acciones');

  if (continuar) {
    continuar.hidden = pasoActual !== 1;
  }

  if (vaciar) {
    vaciar.hidden = pasoActual !== 1;
  }

  if (acciones) {
    acciones.hidden = pasoActual !== 1;
  }
}

function actualizarProgreso() {
  document.querySelectorAll('[data-paso-indicador]').forEach(function (item) {
    var numero = Number(item.getAttribute('data-paso-indicador'));
    var activo = numero === pasoActual;
    var completo = numero < pasoActual;

    item.classList.toggle('is-active', activo);
    item.classList.toggle('is-complete', completo);

    if (activo) {
      item.setAttribute('aria-current', 'step');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function irAPaso(paso) {
  if (carritoEstaVacio(carritoActual)) {
    return;
  }

  pasoActual = Number(paso) || 1;

  if (pasoActual < 1) {
    pasoActual = 1;
  }

  if (pasoActual > 3) {
    pasoActual = 3;
  }

  aplicarVisibilidadPasos(false);
  actualizarProgreso();

  if (pasoActual === 2) {
    poblarDatosCuenta();
    actualizarOpcionesCheckout();
    renderTurnosCheckout();
  } else if (pasoActual === 3) {
    renderRevisionFinal();
  }

  if (carritoActual) {
    actualizarResumen(carritoActual);
  }

  var navbar = document.getElementById('navbar');
  var offset = (navbar ? navbar.offsetHeight : 68) + 16;
  var destino = pasoActual === 1
    ? document.querySelector('.carrito-container')
    : document.getElementById('checkout-progress');

  if (destino) {
    var y = destino.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top: Math.max(0, y),
      behavior: 'smooth'
    });
  }
}

/* ═══════════ PRODUCTOS ═══════════ */

function renderProductos(productos) {
  var lista = document.getElementById('lista-productos');
  var seccion = document.getElementById('carrito-productos');

  if (!lista || !seccion) {
    return;
  }

  lista.innerHTML = '';

  if (!productos.length) {
    seccion.hidden = true;
    return;
  }

  seccion.hidden = false;

  productos.forEach(function (producto) {
    lista.appendChild(crearProductoItem(producto));
  });
}

function crearImagen(item, clase) {
  var img = document.createElement('img');
  img.src = item.imagen ? String(item.imagen) : '../img/placeholder.svg';
  img.alt = String(item.nombre || '');
  img.className = clase;
  img.loading = 'lazy';
  img.onerror = function () {
    img.onerror = null;
    img.src = '../img/placeholder.svg';
    img.classList.add('is-placeholder');
  };
  return img;
}

function crearProductoItem(producto) {
  var article = document.createElement('article');
  article.className = 'carrito-item';
  article.dataset.tipo = 'producto';
  article.dataset.id = String(producto.id);

  var id = Number(producto.id);
  var cantidad = Math.max(1, Number(producto.cantidad) || 1);
  var stock = Math.max(cantidad, Number(producto.stock_cantidad) || cantidad);
  var precioFinal = Number(producto.precio_final ?? producto.precio) || 0;
  var precioOriginal = Number(producto.precio) || 0;
  var oferta = producto.oferta || null;
  var enMaximo = cantidad >= stock;

  var media = document.createElement('div');
  media.className = 'carrito-item-media';
  media.appendChild(crearImagen(producto, 'carrito-item-imagen'));
  article.appendChild(media);

  var cuerpo = document.createElement('div');
  cuerpo.className = 'carrito-item-cuerpo';

  var tipo = document.createElement('span');
  tipo.className = 'carrito-item-tipo';
  tipo.textContent = 'Producto';
  cuerpo.appendChild(tipo);

  var h3 = document.createElement('h3');
  h3.className = 'carrito-item-nombre';
  h3.textContent = String(producto.nombre || '');
  cuerpo.appendChild(h3);

  if (producto.marca) {
    var marca = document.createElement('p');
    marca.className = 'carrito-item-marca';
    marca.textContent = String(producto.marca);
    cuerpo.appendChild(marca);
  }

  var precio = document.createElement('p');
  precio.className = 'carrito-item-precio';

  if (oferta && precioFinal < precioOriginal) {
    var tachado = document.createElement('s');
    tachado.textContent = formatoDinero(precioOriginal);
    precio.appendChild(tachado);
    precio.appendChild(document.createTextNode(' '));

    var final = document.createElement('strong');
    final.textContent = formatoDinero(precioFinal) + ' c/u';
    precio.appendChild(final);

    var badge = document.createElement('span');
    badge.className = 'oferta-badge-sitio oferta-badge-inline';
    badge.style.background = String(oferta.color || '#AD717E');
    badge.textContent = etiquetaOferta(oferta);
    precio.appendChild(document.createTextNode(' '));
    precio.appendChild(badge);
  } else {
    precio.textContent = formatoDinero(precioOriginal) + ' c/u';
  }

  if (Number(producto.unidades_gratis) > 0) {
    var gratis = document.createElement('small');
    gratis.className = 'carrito-gratis';
    gratis.textContent = ' 2x1: ' + producto.unidades_gratis + ' gratis';
    precio.appendChild(gratis);
  }

  cuerpo.appendChild(precio);

  var stockLinea = document.createElement('p');
  stockLinea.className = 'carrito-item-stock' + (enMaximo ? ' is-max' : '');
  stockLinea.textContent = enMaximo
    ? 'Máximo disponible: ' + stock
    : 'Stock disponible: ' + stock;
  cuerpo.appendChild(stockLinea);

  article.appendChild(cuerpo);

  var lado = document.createElement('div');
  lado.className = 'carrito-item-lado';

  var stepper = document.createElement('div');
  stepper.className = 'carrito-stepper';

  var menos = document.createElement('button');
  menos.type = 'button';
  menos.className = 'stepper-btn';
  menos.dataset.accion = 'menos';
  menos.dataset.id = String(id);
  menos.setAttribute('aria-label', 'Quitar una unidad de ' + String(producto.nombre || 'producto'));
  menos.textContent = '−';
  menos.disabled = cantidad <= 1;
  stepper.appendChild(menos);

  var input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = String(stock);
  input.value = String(cantidad);
  input.dataset.tipo = 'producto';
  input.dataset.id = String(id);
  input.className = 'cantidad-producto';
  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('aria-label', 'Cantidad de ' + String(producto.nombre || 'producto'));
  stepper.appendChild(input);

  var mas = document.createElement('button');
  mas.type = 'button';
  mas.className = 'stepper-btn';
  mas.dataset.accion = 'mas';
  mas.dataset.id = String(id);
  mas.setAttribute('aria-label', 'Agregar una unidad de ' + String(producto.nombre || 'producto'));
  mas.textContent = '+';
  mas.disabled = enMaximo;
  stepper.appendChild(mas);

  lado.appendChild(stepper);

  var sub = document.createElement('strong');
  sub.className = 'carrito-subtotal';
  sub.textContent = formatoDinero(producto.subtotal);
  lado.appendChild(sub);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-eliminar';
  btn.dataset.tipo = 'producto';
  btn.dataset.id = String(id);
  btn.setAttribute('aria-label', 'Eliminar ' + String(producto.nombre || 'producto') + ' del carrito');
  btn.innerHTML = '<img src="../img/icons/basura.svg" alt="" width="14" height="14" aria-hidden="true"><span>Eliminar</span>';
  lado.appendChild(btn);

  article.appendChild(lado);

  return article;
}

/* ═══════════ SERVICIOS ═══════════ */

function renderServicios(servicios) {
  var lista = document.getElementById('lista-servicios');
  var seccion = document.getElementById('carrito-servicios');

  if (!lista || !seccion) {
    return;
  }

  lista.innerHTML = '';

  if (!servicios.length) {
    seccion.hidden = true;
    return;
  }

  seccion.hidden = false;

  servicios.forEach(function (servicio) {
    lista.appendChild(crearServicioItem(servicio));
  });
}

function crearServicioItem(servicio) {
  var article = document.createElement('article');
  article.className = 'carrito-item carrito-servicio';
  article.dataset.tipo = 'servicio';
  article.dataset.id = String(servicio.id);

  var id = Number(servicio.id);
  var duracion = Number(servicio.duracion) || 0;
  var precioFinal = Number(servicio.precio_final ?? servicio.precio) || 0;
  var precioOriginal = Number(servicio.precio) || 0;
  var oferta = servicio.oferta || null;

  var media = document.createElement('div');
  media.className = 'carrito-item-media';
  media.appendChild(crearImagen(servicio, 'carrito-item-imagen'));
  article.appendChild(media);

  var cuerpo = document.createElement('div');
  cuerpo.className = 'carrito-item-cuerpo';

  var tipo = document.createElement('span');
  tipo.className = 'carrito-item-tipo';
  tipo.textContent = 'Servicio';
  cuerpo.appendChild(tipo);

  var h3 = document.createElement('h3');
  h3.className = 'carrito-item-nombre';
  h3.textContent = String(servicio.nombre || '');
  cuerpo.appendChild(h3);

  if (duracion) {
    var dur = document.createElement('p');
    dur.className = 'carrito-item-marca';
    dur.textContent = duracion + ' minutos';
    cuerpo.appendChild(dur);
  }

  var precio = document.createElement('p');
  precio.className = 'carrito-item-precio';

  if (oferta && precioFinal < precioOriginal) {
    var tachado = document.createElement('s');
    tachado.textContent = formatoDinero(precioOriginal);
    precio.appendChild(tachado);
    precio.appendChild(document.createTextNode(' '));

    var final = document.createElement('strong');
    final.textContent = formatoDinero(precioFinal);
    precio.appendChild(final);
  } else {
    precio.textContent = formatoDinero(precioOriginal);
  }

  cuerpo.appendChild(precio);

  var turno = document.createElement('div');
  turno.className = 'servicio-turno-elegido';
  turno.dataset.id = String(id);

  var icono = document.createElement('img');
  icono.src = '../img/icons/calendario.svg';
  icono.alt = '';
  icono.width = 15;
  icono.height = 15;
  icono.setAttribute('aria-hidden', 'true');
  turno.appendChild(icono);

  var valor = document.createElement('strong');
  valor.className = 'servicio-turno-valor';
  valor.textContent = resumenTurno(servicio);
  turno.appendChild(valor);

  var elegir = document.createElement('button');
  elegir.type = 'button';
  elegir.className = 'servicio-turno-btn';
  elegir.dataset.accion = 'elegir-turno';
  elegir.dataset.id = String(id);
  elegir.textContent = servicio.fecha ? 'Cambiar' : 'Elegir fecha';
  turno.appendChild(elegir);

  cuerpo.appendChild(turno);
  article.appendChild(cuerpo);

  var lado = document.createElement('div');
  lado.className = 'carrito-item-lado';

  var sub = document.createElement('strong');
  sub.className = 'carrito-subtotal';
  sub.textContent = formatoDinero(servicio.subtotal);
  lado.appendChild(sub);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-eliminar';
  btn.dataset.tipo = 'servicio';
  btn.dataset.id = String(id);
  btn.setAttribute('aria-label', 'Eliminar ' + String(servicio.nombre || 'servicio') + ' del carrito');
  btn.innerHTML = '<img src="../img/icons/basura.svg" alt="" width="14" height="14" aria-hidden="true"><span>Eliminar</span>';
  lado.appendChild(btn);

  article.appendChild(lado);

  return article;
}

function resumenTurno(servicio) {
  var fecha = String((servicio || {}).fecha || '');
  var hora = String((servicio || {}).hora || '').slice(0, 5);

  if (!fecha || !hora) {
    return 'Sin elegir todavía';
  }

  var textoFecha = fecha;

  try {
    var d = new Date(fecha + 'T12:00:00');
    textoFecha = d.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  } catch (e) {}

  return textoFecha + ' · ' + hora + ' hs';
}

function etiquetaOferta(oferta) {
  if (!oferta) {
    return '';
  }

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
/* ═══════════ EVENTOS ═══════════ */

function manejarInputCarrito(event) {
  var target = event.target;

  if (!target) {
    return;
  }

  if (target.id === 'tarjeta-numero') {
    target.value = formatearNumeroTarjeta(target.value);
    target.classList.remove('input-error');

    var marcaDetectada = marcaTarjetaPorNumero(target.value);
    var selectorMarca = document.getElementById('tarjeta-marca');

    if (marcaDetectada && selectorMarca && selectorMarca.value !== marcaDetectada) {
      selectorMarca.value = marcaDetectada;
    }

    limpiarErrorCheckout();
  }

  if (target.id === 'tarjeta-vencimiento') {
    target.value = formatearVencimiento(target.value);
    target.classList.remove('input-error');
    limpiarErrorCheckout();
  }

  if (target.id === 'tarjeta-cvv') {
    target.value = soloDigitos(target.value).slice(0, 4);
    target.classList.remove('input-error');
    limpiarErrorCheckout();
  }

  if (target.id === 'direccion-envio') {
    target.classList.remove('input-error');

    var err = document.getElementById('err-direccion-envio');

    if (err) {
      err.textContent = '';
    }

    limpiarErrorCheckout();
  }
}

function manejarCambioCarrito(event) {
  var target = event.target;

  if (!target) {
    return;
  }

  if (target.classList && target.classList.contains('cantidad-producto')) {
    actualizarProducto(target);
    return;
  }

  if (target.name === 'entrega') {
    limpiarErrorCheckout();
    alternarDireccion();
    actualizarResumen(carritoActual || { productos: [], servicios: [] });
    return;
  }

  if (target.name === 'pago_grupo') {
    limpiarErrorCheckout();
    alternarGrupo();
    alternarDireccion();
    renderTurnosCheckout();
    actualizarResumen(carritoActual || { productos: [], servicios: [] });
    return;
  }

  if (target.name === 'metodo_pago') {
    limpiarErrorCheckout();
    alternarMetodoPago();
  }
}

function manejarClickCarrito(event) {
  var target = event.target;

  if (!target || !target.closest) {
    return;
  }

  var accion = target.closest('[data-accion]');

  if (accion) {
    var tipoAccion = accion.getAttribute('data-accion');
    var idAccion = Number(accion.getAttribute('data-id'));

    if (tipoAccion === 'menos' || tipoAccion === 'mas') {
      cambiarCantidad(idAccion, tipoAccion === 'mas' ? 1 : -1);
      return;
    }

    if (tipoAccion === 'elegir-turno') {
      elegirTurnoDesdeCarrito(idAccion);
      return;
    }
  }

  var eliminar = target.closest('.btn-eliminar');

  if (eliminar) {
    pedirEliminarItem(eliminar);
    return;
  }

  if (target.closest('#btn-vaciar-carrito')) {
    pedirVaciarCarrito();
    return;
  }

  if (target.closest('#btn-continuar-compra')) {
    continuarCompra();
    return;
  }

  if (target.closest('#btn-volver-carrito') || target.closest('#btn-volver-carrito-2')) {
    irAPaso(1);
    return;
  }

  if (target.closest('#btn-revisar-pedido')) {
    revisarPedido();
    return;
  }

  if (target.closest('#btn-volver-entrega')) {
    irAPaso(2);
    return;
  }

  if (target.closest('#btn-confirmar-pedido')) {
    confirmarPedido();
    return;
  }

  var copiar = target.closest('[data-copiar-pago]');

  if (copiar) {
    copiarDatoPago(copiar.getAttribute('data-copiar-pago'));
  }
}

/* ═══════════ CANTIDADES Y ELIMINACIÓN ═══════════ */

function cambiarCantidad(id, delta) {
  if (productosEnCurso[id]) {
    return;
  }

  var producto = (carritoActual.productos || []).find(function (p) {
    return Number(p.id) === Number(id);
  });

  if (!producto) {
    return;
  }

  var cantidad = Math.max(1, Number(producto.cantidad) || 1);
  var stock = Math.max(cantidad, Number(producto.stock_cantidad) || cantidad);
  var nueva = cantidad + delta;

  if (nueva > stock) {
    mostrarMensaje('Solo quedan ' + stock + ' unidades disponibles de este producto.');
    return;
  }

  if (nueva < 1) {
    return;
  }

  if (nueva === cantidad) {
    return;
  }

  productosEnCurso[id] = true;

  var article = document.querySelector('.carrito-item[data-tipo="producto"][data-id="' + id + '"]');

  if (article) {
    article.querySelectorAll('button, input').forEach(function (control) {
      control.disabled = true;
    });
  }

  actualizarCantidadProducto(id, nueva);
}

function actualizarProducto(input) {
  var id = Number(input.dataset.id);
  var max = Number(input.max);
  var cantidad = Number(input.value);

  if (!Number.isFinite(cantidad)) {
    cantidad = 1;
  }

  cantidad = Math.max(1, Math.trunc(cantidad));

  if (Number.isFinite(max) && max > 0) {
    cantidad = Math.min(cantidad, max);
  }

  input.value = String(cantidad);

  if (productosEnCurso[id]) {
    return;
  }

  var producto = (carritoActual.productos || []).find(function (p) {
    return Number(p.id) === id;
  });

  if (producto && Number(producto.cantidad) === cantidad) {
    return;
  }

  productosEnCurso[id] = true;
  actualizarCantidadProducto(id, cantidad);
}

function actualizarCantidadProducto(id, cantidad) {
  return enviarCarrito('PUT', {
    tipo: 'producto',
    id: id,
    cantidad: cantidad
  })
    .then(function () {
      return actualizarCarrito();
    })
    .catch(function (error) {
      mostrarMensaje(error.message || 'No se pudo actualizar la cantidad.');

      return actualizarCarrito().catch(function () {});
    })
    .finally(function () {
      delete productosEnCurso[id];
    });
}

function pedirEliminarItem(boton) {
  var tipo = boton.dataset.tipo;
  var id = Number(boton.dataset.id);

  if (!tipo || !Number.isFinite(id)) {
    return;
  }

  if (typeof window.mostrarModalValidacion !== 'function') {
    eliminarItem(tipo, id, boton);
    return;
  }

  window.mostrarModalValidacion({
    titulo: '¿Quitar este artículo?',
    mensaje: 'El artículo se quita del carrito. Podés volver a agregarlo cuando quieras.',
    icono: 'advertencia.svg',
    botones: [
      { texto: 'Volver', clase: 'outline' },
      {
        texto: 'Sí, quitar',
        clase: 'primary',
        accion: function () {
          window.cerrarModalValidacion();
          eliminarItem(tipo, id, boton);
        }
      }
    ]
  });
}

function eliminarItem(tipo, id, boton) {
  if (boton) {
    boton.disabled = true;
  }

  enviarCarrito('DELETE', { tipo: tipo, id: id })
    .then(function () {
      return actualizarCarrito();
    })
    .then(function () {
      if (typeof window.showToast === 'function') {
        window.showToast('Artículo quitado del carrito.');
      }
    })
    .catch(function (error) {
      if (boton) {
        boton.disabled = false;
      }

      mostrarMensaje(error.message || 'No se pudo eliminar el artículo.');
    });
}

function pedirVaciarCarrito() {
  if (typeof window.mostrarModalValidacion !== 'function') {
    vaciarCarrito();
    return;
  }

  window.mostrarModalValidacion({
    titulo: '¿Vaciar el carrito?',
    mensaje: 'Se quitan todos los productos y servicios. Podés volver a agregarlos después.',
    icono: 'advertencia.svg',
    botones: [
      { texto: 'Volver', clase: 'outline' },
      {
        texto: 'Sí, vaciar',
        clase: 'primary',
        accion: function () {
          window.cerrarModalValidacion();
          vaciarCarrito();
        }
      }
    ]
  });
}

function vaciarCarrito() {
  var boton = document.getElementById('btn-vaciar-carrito');

  if (boton) {
    boton.disabled = true;
  }

  enviarCarrito('POST', { vaciar: true })
    .then(function () {
      pasoActual = 1;
      return actualizarCarrito();
    })
    .then(function () {
      mostrarMensaje('El carrito fue vaciado.');
    })
    .catch(function (error) {
      mostrarMensaje(error.message || 'No se pudo vaciar el carrito.');
    })
    .finally(function () {
      if (boton) {
        boton.disabled = false;
      }
    });
}

/* ═══════════ ACCESO Y CUENTA ═══════════ */

function continuarCompra() {
  if (carritoEstaVacio(carritoActual)) {
    mostrarMensaje('Tu carrito está vacío.');
    return Promise.resolve(false);
  }

  return consultarSesionServidorSiHaceFalta()
    .then(function (usuario) {
      if (!usuario) {
        try {
          window.localStorage.setItem('redirectAfterLogin', 'carrito.html');
        } catch (e) {}

        window.location.href = 'login.html';
        return false;
      }

      poblarDatosCuenta(usuario);
      irAPaso(2);
      return true;
    })
    .catch(function () {
      mostrarMensaje('No pudimos verificar tu sesión. Probá de nuevo.');
      return false;
    });
}

function consultarSesionServidorSiHaceFalta() {
  if (typeof window.consultarSesionServidor === 'function') {
    return window.consultarSesionServidor();
  }

  return Promise.resolve(
    typeof window.getSesion === 'function' ? window.getSesion() : null
  );
}

function poblarDatosCuenta(usuario) {
  var nombre = document.getElementById('checkout-usuario-nombre');
  var email = document.getElementById('checkout-usuario-email');

  if (!usuario) {
    usuario = typeof window.getSesion === 'function' ? window.getSesion() : null;
  }

  if (nombre) {
    nombre.textContent = usuario
      ? [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'Tu cuenta'
      : 'Tu cuenta';
  }

  if (email) {
    email.textContent = usuario && usuario.email ? String(usuario.email) : '';
  }
}

function elegirTurnoDesdeCarrito(id) {
  continuarCompra().then(function (ok) {
    if (!ok) {
      return;
    }

    setTimeout(function () {
      var fila = document.querySelector('.turno-checkout-fila[data-id="' + id + '"]');

      if (!fila) {
        return;
      }

      fila.scrollIntoView({ behavior: 'smooth', block: 'center' });

      var boton = fila.querySelector('.btn-elegir-fecha');

      if (boton) {
        abrirCalendario(id, boton);
      }
    }, 180);
  });
}

/* ═══════════ CHECKOUT: ESTADO Y PAGO ═══════════ */

function cablearCheckout() {
  if (typeof window.getSesion === 'function') {
    poblarDatosCuenta(window.getSesion());
  }

  alternarMetodoPago();
  alternarDireccion();
}

function entregaElegida() {
  var radio = document.querySelector('input[name="entrega"]:checked');

  return radio ? radio.value : 'retiro';
}

function metodoElegido() {
  var radio = document.querySelector('input[name="metodo_pago"]:checked');

  return radio ? radio.value : 'transferencia';
}

function grupoElegido() {
  var tieneProd = (((carritoActual || {}).productos) || []).length > 0;
  var tieneServ = (((carritoActual || {}).servicios) || []).length > 0;

  if (tieneProd && !tieneServ) {
    return 'productos';
  }

  if (tieneServ && !tieneProd) {
    return 'servicios';
  }

  var radio = document.querySelector('input[name="pago_grupo"]:checked');

  return radio ? radio.value : 'todo';
}

function grupoIncluyeProductos(grupo) {
  return grupo !== 'servicios';
}

function grupoIncluyeServicios(grupo) {
  return grupo !== 'productos';
}

function alternarGrupo() {
  var bloque = document.getElementById('bloque-grupo');

  if (!bloque) {
    return;
  }

  var tieneProductos = ((carritoActual || {}).productos || []).length > 0;
  var tieneServicios = ((carritoActual || {}).servicios || []).length > 0;
  var mixto = tieneProductos && tieneServicios;

  bloque.hidden = !mixto;

  if (mixto) {
    var elegido = document.querySelector('input[name="pago_grupo"]:checked');

    if (!elegido) {
      var todo = document.querySelector('input[name="pago_grupo"][value="todo"]');

      if (todo) {
        todo.checked = true;
      } else {
        var primero = document.querySelector('input[name="pago_grupo"]');

        if (primero) {
          primero.checked = true;
        }
      }
    }
  }
}

function alternarDireccion() {
  var grupo = document.getElementById('grupo-direccion');
  var bloqueEntrega = document.getElementById('bloque-entrega');
  var txt = document.getElementById('costo-envio-txt');
  var notaRetiro = document.getElementById('nota-retiro');
  var notaEnvio = document.getElementById('nota-envio');

  var tieneProductos = ((carritoActual || {}).productos || []).length > 0;
  var incluyeProductos = grupoIncluyeProductos(grupoElegido());

  if (txt) {
    txt.textContent = envioConocido
      ? '+' + formatoDinero(costoEnvio)
      : 'Costo a confirmar';
  }

  if (bloqueEntrega) {
    bloqueEntrega.hidden = !tieneProductos || !incluyeProductos;
  }

  var esEnvio =
    entregaElegida() === 'envio' &&
    tieneProductos &&
    incluyeProductos;

  if (grupo) {
    grupo.hidden = !esEnvio;
  }

  if (notaRetiro) {
    notaRetiro.hidden = esEnvio || !tieneProductos || !incluyeProductos;
  }

  if (notaEnvio) {
    notaEnvio.hidden = !esEnvio;
  }
}

function alternarMetodoPago() {
  var metodo = metodoElegido();
  var paneles = {
    transferencia: document.getElementById('panel-transferencia'),
    mercadopago: document.getElementById('panel-mercadopago'),
    tarjeta_online: document.getElementById('panel-tarjeta-online'),
    billetera: document.getElementById('panel-billetera'),
    transferencia_qr: document.getElementById('panel-transferencia-qr'),
    efectivo: document.getElementById('panel-efectivo')
  };

  Object.keys(paneles).forEach(function (clave) {
    if (paneles[clave]) {
      paneles[clave].hidden = metodo !== clave;
    }
  });

  document.querySelectorAll('.payment-card').forEach(function (label) {
    var input = label.querySelector('input[name="metodo_pago"]');
    label.classList.toggle('is-selected', Boolean(input && input.checked));
  });
}

function actualizarOpcionesCheckout() {
  alternarGrupo();
  alternarDireccion();
  alternarMetodoPago();

  if (pasoActual === 2) {
    renderTurnosCheckout();
  }
}

function soloDigitos(valor) {
  return String(valor == null ? '' : valor).replace(/\D/g, '');
}

function luhnValido(numero) {
  var digitos = soloDigitos(numero);

  if (digitos.length < 13 || digitos.length > 19) {
    return false;
  }

  var suma = 0;
  var alternar = false;

  for (var i = digitos.length - 1; i >= 0; i -= 1) {
    var n = Number(digitos.charAt(i));

    if (alternar) {
      n *= 2;

      if (n > 9) {
        n -= 9;
      }
    }

    suma += n;
    alternar = !alternar;
  }

  return suma % 10 === 0;
}

function marcaTarjetaPorNumero(numero) {
  var digitos = soloDigitos(numero);

  if (/^4/.test(digitos)) {
    return 'visa';
  }

  if (/^(5[1-5]|2[2-7])/.test(digitos)) {
    return 'mastercard';
  }

  if (/^3[47]/.test(digitos)) {
    return 'amex';
  }

  if (/^(6042|6043|6044|6045|6046|6271|5896)/.test(digitos)) {
    return 'cabal';
  }

  if (/^(589562|603996|603997)/.test(digitos)) {
    return 'naranja_x';
  }

  return '';
}

function formatearNumeroTarjeta(valor) {
  var digitos = soloDigitos(valor).slice(0, 19);

  return digitos.replace(/(.{4})/g, '$1 ').trim();
}

function formatearVencimiento(valor) {
  var digitos = soloDigitos(valor).slice(0, 4);

  if (digitos.length >= 3) {
    return digitos.slice(0, 2) + '/' + digitos.slice(2);
  }

  return digitos;
}

function vencimientoValido(valor) {
  var texto = String(valor || '').trim();

  if (!/^\d{2}\/\d{2}$/.test(texto)) {
    return false;
  }

  var mes = Number(texto.slice(0, 2));
  var anio = 2000 + Number(texto.slice(3, 5));

  if (mes < 1 || mes > 12) {
    return false;
  }

  var hoy = new Date();
  var finMes = new Date(anio, mes, 1);

  return finMes > hoy;
}

function datosPago() {
  var metodo = metodoElegido();
  var pago = {
    metodo: metodo,
    ultimos4: '',
    marca: '',
    tipo: '',
    cuotas: 1,
    billetera: ''
  };

  if (metodo === 'tarjeta_online') {
    var numero = soloDigitos((document.getElementById('tarjeta-numero') || {}).value || '');
    pago.ultimos4 = numero.slice(-4);
    pago.marca = marcaTarjetaPorNumero(numero) || 'visa';
    pago.tipo = 'credito';
    pago.cuotas = 1;
  }

  if (metodo === 'billetera') {
    pago.billetera = String((document.getElementById('billetera-proveedor') || {}).value || '');
  }

  return pago;
}

/* ═══════════ CONFIGURACIÓN DE PAGO ═══════════

   El alias, CBU, titular y WhatsApp de pago salen de js/config-pagos.js,
   el único lugar editable de esos datos. No se inventan valores acá. */

function configuracionPago() {
  var cfg = window.CONFIG_PAGOS || {};

  function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
  }

  return {
    alias: texto(cfg.alias),
    cbu: texto(cfg.cbu),
    titular: texto(cfg.titular),
    whatsappPago: texto(cfg.whatsappPago)
  };
}

function aplicarConfigPago() {
  var cfg = configuracionPago();
  var alias = document.getElementById('alias-valor');

  if (alias) {
    alias.textContent = cfg.alias || '—';
  }

  var cbuFila = document.getElementById('cbu-fila');
  var cbuValor = document.getElementById('cbu-valor');

  if (cbuFila) {
    cbuFila.hidden = !cfg.cbu;
  }

  if (cbuValor) {
    cbuValor.textContent = cfg.cbu || '—';
  }

  var titularFila = document.getElementById('titular-fila');
  var titularValor = document.getElementById('titular-valor');

  if (titularFila) {
    titularFila.hidden = !cfg.titular;
  }

  if (titularValor) {
    titularValor.textContent = cfg.titular || '—';
  }

  document.querySelectorAll('[data-pago-whatsapp]').forEach(function (nodo) {
    nodo.textContent = cfg.whatsappPago || 'el número del local';
  });
}

function cargarConfiguracionPago() {
  var opcion = document.getElementById('pago-mercadopago-opcion');

  function ocultar() {
    mpDisponible = false;

    if (opcion) {
      opcion.hidden = true;
    }

    var radioMp = document.querySelector('input[name="metodo_pago"][value="mercadopago"]');
    var radioTransferencia = document.querySelector('input[name="metodo_pago"][value="transferencia"]');

    if (radioMp && radioMp.checked && radioTransferencia) {
      radioMp.checked = false;
      radioTransferencia.checked = true;
    }

    alternarMetodoPago();
  }

  return fetch(API_PAGO_CONFIG, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (respuesta) {
      if (!respuesta.ok) {
        throw new Error('No se pudo consultar Mercado Pago.');
      }

      return respuesta.json();
    })
    .then(function (data) {
      mpDisponible = Boolean(data && data.ok && data.mercadopago && data.mercadopago.enabled);

      if (opcion) {
        opcion.hidden = !mpDisponible;
      }

      if (!mpDisponible) {
        var radioMp = document.querySelector('input[name="metodo_pago"][value="mercadopago"]');
        var radioTransferencia = document.querySelector('input[name="metodo_pago"][value="transferencia"]');

        if (radioMp && radioMp.checked && radioTransferencia) {
          radioMp.checked = false;
          radioTransferencia.checked = true;
        }
      }

      alternarMetodoPago();
    })
    .catch(ocultar);
}

function copiarDatoPago(tipo) {
  var cfg = configuracionPago();
  var texto = '';

  if (tipo === 'alias') {
    texto = cfg.alias;
  } else if (tipo === 'cbu') {
    texto = cfg.cbu;
  } else if (tipo === 'titular') {
    texto = cfg.titular;
  }

  if (!texto) {
    if (typeof window.showToast === 'function') {
      window.showToast('Ese dato de pago todavía no está configurado.');
    }

    return;
  }

  copiarTexto(texto, 'Dato copiado: ' + texto);
}

function copiarAlias() {
  copiarDatoPago('alias');
}

function copiarTexto(texto, mensaje) {
  function listo() {
    if (typeof window.showToast === 'function') {
      window.showToast(mensaje);
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(listo).catch(fallback);
  } else {
    fallback();
  }

  function fallback() {
    var aux = document.createElement('textarea');
    aux.value = texto;
    aux.setAttribute('readonly', '');
    aux.style.position = 'fixed';
    aux.style.opacity = '0';
    document.body.appendChild(aux);
    aux.select();

    try {
      document.execCommand('copy');
      listo();
    } catch (e) {
      if (typeof window.showToast === 'function') {
        window.showToast('Copiá el dato manualmente: ' + texto);
      }
    }

    document.body.removeChild(aux);
  }
}

function cargarCostoEnvio() {
  return fetch(API_CONFIG, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (r) {
      if (!r.ok) {
        throw new Error('No se pudo cargar la configuración.');
      }

      return r.json();
    })
    .then(function (data) {
      if (!data || data.ok === false) {
        throw new Error('No se pudo cargar la configuración.');
      }

      var costo = Number(data.costoEnvio);
      costoEnvio = Number.isFinite(costo) ? costo : 0;
      envioConocido = Number.isFinite(costo);
      cfgTurnos.diasCerrados = Array.isArray(data.diasCerrados) ? data.diasCerrados : [0];
      cfgTurnos.feriados = Array.isArray(data.feriados) ? data.feriados : [];
      cfgTurnos.ventanas = Array.isArray(data.ventanas) ? data.ventanas : [];
      cfgTurnos.pasoMin = Number(data.pasoMin) || 30;
    })
    .catch(function () {
      envioConocido = false;

      if (carritoActual) {
        actualizarResumen(carritoActual);
        alternarDireccion();
      }
    });
}

function aplicarDatosNegocio() {
  var negocio = window.NEGOCIO || {};

  document.querySelectorAll('[data-negocio-horario]').forEach(function (nodo) {
    if (negocio.horario) {
      nodo.textContent = String(negocio.horario);
    }
  });

  document.querySelectorAll('[data-negocio-direccion]').forEach(function (nodo) {
    if (negocio.direccion) {
      nodo.textContent = String(negocio.direccion);
    }
  });
}
/* ═══════════ VALIDACIÓN Y REVISIÓN ═══════════ */

function limpiarErrorCheckout() {
  ['checkout-error', 'confirmacion-error', 'err-direccion-envio'].forEach(function (id) {
    var el = document.getElementById(id);

    if (el) {
      el.textContent = '';
    }
  });

  var direccion = document.getElementById('direccion-envio');

  if (direccion) {
    direccion.classList.remove('input-error');
  }
}

function mostrarErrorCheckout(mensaje, focusId) {
  var idError = pasoActual === 3 ? 'confirmacion-error' : 'checkout-error';
  var err = document.getElementById(idError);

  if (err) {
    err.textContent = String(mensaje || 'Revisá los datos antes de continuar.');
  }

  if (focusId) {
    var foco = document.getElementById(focusId);

    if (foco) {
      try {
        foco.focus({ preventScroll: true });
      } catch (e) {}

      foco.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function validarCheckout() {
  limpiarErrorCheckout();

  if (carritoEstaVacio(carritoActual)) {
    return {
      ok: false,
      mensaje: 'Tu carrito está vacío. Agregá un producto o servicio para continuar.',
      focus: null
    };
  }

  var grupo = grupoElegido();
  var incluyeProductos = grupoIncluyeProductos(grupo);
  var incluyeServicios = grupoIncluyeServicios(grupo);
  var productos = (carritoActual || {}).productos || [];
  var servicios = (carritoActual || {}).servicios || [];

  if (incluyeProductos && !productos.length) {
    return {
      ok: false,
      mensaje: 'No hay productos para incluir en este pago.',
      focus: null
    };
  }

  if (incluyeServicios && !servicios.length) {
    return {
      ok: false,
      mensaje: 'No hay servicios para incluir en este pago.',
      focus: null
    };
  }

  if (incluyeProductos) {
    var entrega = entregaElegida();
    var direccion = String((document.getElementById('direccion-envio') || {}).value || '').trim();

    if (entrega === 'envio') {
      if (!envioConocido) {
        cargarCostoEnvio();

        return {
          ok: false,
          mensaje: 'Estamos calculando el costo de envío. Esperá un instante o elegí retiro en el local.',
          focus: 'bloque-entrega'
        };
      }

      if (direccion.length < 8) {
        var errDireccion = document.getElementById('err-direccion-envio');
        var inputDireccion = document.getElementById('direccion-envio');

        if (errDireccion) {
          errDireccion.textContent = 'Contanos calle, número y ciudad para el envío.';
        }

        if (inputDireccion) {
          inputDireccion.classList.add('input-error');
        }

        return {
          ok: false,
          mensaje: 'Completá la dirección completa para el envío.',
          focus: 'direccion-envio'
        };
      }
    }
  }

  if (incluyeServicios && servicios.length) {
    var incompleto = servicios.find(function (s) {
      return !s.fecha || !s.hora;
    });

    if (incompleto) {
      return {
        ok: false,
        mensaje: 'Elegí fecha y horario para "' + String(incompleto.nombre || 'el servicio') + '".',
        focus: 'bloque-turnos'
      };
    }

    var vencido = servicios.find(function (s) {
      return String(s.fecha) < isoHoy();
    });

    if (vencido) {
      return {
        ok: false,
        mensaje: 'La fecha de "' + String(vencido.nombre || 'un servicio') + '" ya pasó. Elegí otra.',
        focus: 'bloque-turnos'
      };
    }
  }

  var metodo = metodoElegido();
  var metodosValidos = [
    'transferencia',
    'debito',
    'tarjeta',
    'mercadopago',
    'tarjeta_online',
    'billetera',
    'transferencia_qr',
    'efectivo'
  ];

  if (metodosValidos.indexOf(metodo) === -1) {
    return {
      ok: false,
      mensaje: 'Elegí un método de pago para continuar.',
      focus: 'bloque-pago'
    };
  }

  if (metodo === 'mercadopago' && !mpDisponible) {
    return {
      ok: false,
      mensaje: 'Mercado Pago no está disponible en este momento. Elegí otro medio de pago.',
      focus: 'bloque-pago'
    };
  }

  if (metodo === 'tarjeta_online') {
    var numero = soloDigitos((document.getElementById('tarjeta-numero') || {}).value || '');

    if (numero.length < 4) {
      marcarCampoPago('tarjeta-numero');

      return {
        ok: false,
        mensaje: 'Ingresá el número de la tarjeta.',
        focus: 'tarjeta-numero'
      };
    }
  }

  if (metodo === 'billetera') {
    var billetera = String((document.getElementById('billetera-proveedor') || {}).value || '');

    if (['mercadopago', 'paypal', 'applepay', 'googlepay', 'samsungpay'].indexOf(billetera) === -1) {
      return {
        ok: false,
        mensaje: 'Elegí una billetera virtual para continuar.',
        focus: 'billetera-proveedor'
      };
    }
  }

  return {
    ok: true,
    grupo: grupo,
    incluyeProductos: incluyeProductos,
    incluyeServicios: incluyeServicios
  };
}

function marcarCampoPago(id) {
  var campo = document.getElementById(id);

  if (!campo) {
    return;
  }

  campo.classList.add('input-error');

  try {
    campo.focus({ preventScroll: true });
  } catch (e) {}
}

function revisarPedido() {
  var validacion = validarCheckout();

  if (!validacion.ok) {
    mostrarErrorCheckout(validacion.mensaje, validacion.focus);
    return;
  }

  irAPaso(3);
}

function renderRevisionFinal() {
  var contenedor = document.getElementById('revision-final');

  if (!contenedor) {
    return;
  }

  var carrito = carritoActual || { productos: [], servicios: [] };
  var datos = calcularResumen(carrito);
  var productos = datos.incluyeProductos ? carrito.productos || [] : [];
  var servicios = datos.incluyeServicios ? carrito.servicios || [] : [];
  var metodo = metodoElegido();
  var direccion = String((document.getElementById('direccion-envio') || {}).value || '').trim();
  var entrega = entregaElegida();

  var html = '';
  html += '<div class="revision-card">';
  html += '  <div class="revision-card-head">';
  html += '    <span class="revision-num">01</span>';
  html += '    <div><h3>Tu selección</h3><p>Estos son los artículos de este pago.</p></div>';
  html += '  </div>';
  html += '  <div class="revision-lista">';

  if (productos.length) {
    if (servicios.length) {
      html += '<p class="revision-grupo-titulo">Productos</p>';
    }

    productos.forEach(function (producto) {
      var cantidad = Math.max(1, Number(producto.cantidad) || 1);

      html += '<div class="revision-item">';
      html += '  <div><strong>' + escaparHtml(producto.nombre) + '</strong>';
      html += '  <span>Cantidad: ' + cantidad + (Number(producto.unidades_gratis) > 0 ? ' · ' + producto.unidades_gratis + ' gratis' : '') + '</span></div>';
      html += '  <strong>' + formatoDinero(producto.subtotal) + '</strong>';
      html += '</div>';
    });
  }

  if (servicios.length) {
    if (productos.length) {
      html += '<p class="revision-grupo-titulo">Turnos y servicios</p>';
    }

    servicios.forEach(function (servicio) {
      html += '<div class="revision-item">';
      html += '  <div><strong>' + escaparHtml(servicio.nombre) + '</strong>';
      html += '  <span>' + escaparHtml(resumenTurno(servicio)) + '</span></div>';
      html += '  <strong>' + formatoDinero(servicio.subtotal) + '</strong>';
      html += '</div>';
    });
  }

  if (!productos.length && !servicios.length) {
    html += '<p class="carrito-ayuda">No hay artículos para mostrar.</p>';
  }

  html += '  </div>';
  html += '</div>';

  html += '<div class="revision-card">';
  html += '  <div class="revision-card-head">';
  html += '    <span class="revision-num">02</span>';
  html += '    <div><h3>Entrega y pago</h3><p>Revisá cómo recibís y abonás tu pedido.</p></div>';
  html += '  </div>';
  html += '  <div class="revision-grid">';

  var entregaTexto = 'Retiro en el local';
  var entregaDetalle = 'General Roca 145 · Río Tercero';

  if (datos.incluyeServicios) {
    entregaTexto = 'Reserva en el local';
    entregaDetalle = 'El turno se reserva al confirmar el pedido.';
  } else if (entrega === 'envio') {
    entregaTexto = 'Envío a domicilio';
    entregaDetalle = direccion || 'Dirección a confirmar';
  }

  html += '<div class="revision-dato"><span>Entrega</span><strong>' + escaparHtml(entregaTexto) + '</strong><small>' + escaparHtml(entregaDetalle) + '</small></div>';
  html += '<div class="revision-dato"><span>Pago</span><strong>' + escaparHtml(nombreMetodoPago(metodo)) + '</strong><small>' + escaparHtml(notaMetodoPago(metodo)) + '</small></div>';
  html += '  </div>';
  html += '</div>';

  html += '<div class="revision-totales">';

  if (datos.incluyeProductos) {
    html += '<div class="revision-linea"><span>Productos</span><strong>' + formatoDinero(datos.subtotalProductos) + '</strong></div>';
  }

  if (datos.incluyeServicios) {
    html += '<div class="revision-linea"><span>Servicios</span><strong>' + formatoDinero(datos.subtotalServicios) + '</strong></div>';
  }

  if (datos.descuento > 0) {
    html += '<div class="revision-linea descuento"><span>Ofertas aplicadas</span><strong>−' + formatoDinero(datos.descuento) + '</strong></div>';
  }

  if (datos.envio > 0 || datos.envioPendiente) {
    html += '<div class="revision-linea"><span>Envío</span><strong>' + (datos.envioPendiente ? 'A confirmar' : formatoDinero(datos.envio)) + '</strong></div>';
  }

  var etiquetaTotal = datos.incluyeProductos && datos.incluyeServicios
    ? 'Total del pedido'
    : (datos.incluyeServicios ? 'Total de la reserva' : 'Total a pagar');

  html += '<div class="revision-total"><span>' + etiquetaTotal + '</span><strong>' + (datos.envioPendiente ? 'A confirmar' : formatoDinero(datos.total)) + '</strong></div>';
  html += '</div>';

  var notaRevision;

  if (metodo === 'mercadopago') {
    notaRevision = 'El pedido se registra al confirmar y vas a completar el pago en Mercado Pago. El pago queda pendiente hasta la acreditación.';
  } else if (['tarjeta_online', 'billetera', 'transferencia_qr', 'efectivo'].indexOf(metodo) !== -1) {
    notaRevision = 'Este medio está en modo demostración. El pedido se registra y el pago simulado queda identificado como tal; no se cobra dinero real.';
  } else {
    notaRevision = 'El pedido se registra al confirmar. El pago queda pendiente de coordinación y verificación.';
  }

  html += '<p class="revision-nota"><img src="../img/icons/candado.svg" alt="" width="15" height="15" aria-hidden="true"> ' + escaparHtml(notaRevision) + '</p>';

  contenedor.innerHTML = html;
}

function nombreMetodoPago(metodo) {
  var m = String(metodo || '').toLowerCase();

  if (m === 'transferencia') {
    return 'Transferencia bancaria';
  }

  if (m === 'debito') {
    return 'Débito en el local';
  }

  if (m === 'tarjeta') {
    return 'Crédito en el local';
  }

  if (m === 'mercadopago') {
    return 'Mercado Pago';
  }

  if (m === 'tarjeta_online') {
    return 'Tarjeta';
  }

  if (m === 'billetera') {
    var billetera = String((document.getElementById('billetera-proveedor') || {}).value || 'mercadopago');
    var nombresBilletera = {
      mercadopago: 'Mercado Pago',
      paypal: 'PayPal',
      applepay: 'Apple Pay',
      googlepay: 'Google Pay',
      samsungpay: 'Samsung Pay'
    };

    return 'Billetera ' + (nombresBilletera[billetera] || '') + ' (simulación)';
  }

  if (m === 'transferencia_qr') {
    return 'Transferencia con QR (simulación)';
  }

  if (m === 'efectivo') {
    return 'Efectivo en red · cupón (simulación)';
  }

  var marcas = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    cabal: 'Cabal',
    naranja_x: 'Naranja X',
    amex: 'American Express'
  };

  return marcas[m] || 'Pago coordinado';
}

function notaMetodoPago(metodo) {
  var m = String(metodo || '').toLowerCase();

  if (m === 'transferencia') {
    return 'Pendiente de verificación del ingreso.';
  }

  if (m === 'mercadopago') {
    return 'Pago online. Queda pendiente hasta la acreditación.';
  }

  if (m === 'tarjeta_online') {
    return 'El pago se procesa al confirmar el pedido.';
  }

  if (m === 'billetera') {
    return 'Simulación de billetera virtual. No se abre una cuenta real.';
  }

  if (m === 'transferencia_qr') {
    return 'Se genera un QR demostrativo y una referencia. Queda pendiente.';
  }

  if (m === 'efectivo') {
    return 'Se genera un cupón demostrativo para Pago Fácil o RapiPago.';
  }

  return 'Se abona al retirar o en el local.';
}

/* ═══════════ CONFIRMACIÓN ═══════════ */

function generarTokenCheckout() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
  } catch (e) {}

  return 'chk_' + Date.now() + '_' + Math.random().toString(36).slice(2);
}

function setCheckoutCargando(cargando) {
  ['btn-confirmar-pedido', 'btn-revisar-pedido'].forEach(function (id) {
    var boton = document.getElementById(id);

    if (!boton) {
      return;
    }

    if (cargando) {
      if (!boton.dataset.textoOriginal) {
        boton.dataset.textoOriginal = boton.textContent;
      }

      boton.disabled = true;
      boton.setAttribute('aria-busy', 'true');

      if (id === 'btn-confirmar-pedido') {
        boton.textContent = 'Registrando pedido…';
      }
    } else {
      boton.disabled = false;
      boton.removeAttribute('aria-busy');

      if (boton.dataset.textoOriginal) {
        boton.textContent = boton.dataset.textoOriginal;
      }
    }
  });
}

function confirmarPedido() {
  if (checkoutEnviando || carritoEstaVacio(carritoActual)) {
    return;
  }

  var validacion = validarCheckout();

  if (!validacion.ok) {
    if (pasoActual !== 2) {
      irAPaso(2);
    }

    mostrarErrorCheckout(validacion.mensaje, validacion.focus);
    return;
  }

  var grupo = validacion.grupo;
  var incluyeServicios = validacion.incluyeServicios;
  var pago = datosPago();
  var entrega = entregaElegida();
  var direccion = String((document.getElementById('direccion-envio') || {}).value || '').trim();
  var turnos = {};

  if (incluyeServicios) {
    ((carritoActual || {}).servicios || []).forEach(function (servicio) {
      turnos[String(servicio.id)] = {
        fecha: String(servicio.fecha || ''),
        hora: String(servicio.hora || '').slice(0, 5)
      };
    });
  }

  if (!checkoutToken) {
    checkoutToken = generarTokenCheckout();
  }

  checkoutEnviando = true;
  limpiarErrorCheckout();
  setCheckoutCargando(true);

  fetch(API_CHECKOUT, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entrega: entrega,
      direccion: direccion,
      metodo_pago: pago.metodo,
      tarjeta_ultimos4: pago.ultimos4,
      tarjeta_marca: pago.marca,
      tarjeta_tipo: pago.tipo,
      cuotas: pago.cuotas,
      billetera: pago.billetera,
      pago_grupo: grupo,
      turnos: turnos,
      checkout_token: checkoutToken
    })
  })
    .then(function (respuesta) {
      return respuesta.json().catch(function () {
        return {};
      }).then(function (data) {
        if (respuesta.status === 401) {
          try {
            window.localStorage.setItem('redirectAfterLogin', 'carrito.html');
          } catch (e) {}

          window.location.href = 'login.html';
          throw new Error('Tenés que iniciar sesión para confirmar el pedido.');
        }

        if (!respuesta.ok || !data.ok) {
          var error = new Error(data.mensaje || data.error || 'No se pudo registrar el pedido. Probá de nuevo.');
          error.status = respuesta.status;
          throw error;
        }

        if (!data.pedido_id) {
          throw new Error('El servidor no confirmó el número de pedido. No se registró la compra.');
        }

        return data;
      });
    })
    .then(function (data) {
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      window.location.href = 'confirmacion.html?id=' + encodeURIComponent(String(data.pedido_id));
    })
    .catch(function (error) {
      if (
        error &&
        error.message === 'Tenés que iniciar sesión para confirmar el pedido.'
      ) {
        return;
      }

      mostrarErrorCheckout(
        (error && error.message) || 'No se pudo registrar el pedido. Probá de nuevo.',
        null
      );
    })
    .finally(function () {
      checkoutEnviando = false;
      setCheckoutCargando(false);
    });
}

/* ═══════════ UTILIDADES ═══════════ */

function escaparHtml(valor) {
  if (typeof escapeHTML === 'function') {
    return escapeHTML(valor);
  }

  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatoDinero(valor) {
  if (typeof window.formatoPrecio === 'function') {
    return window.formatoPrecio(Number(valor) || 0);
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
}

function mostrarMensaje(texto) {
  var mensaje = document.getElementById('carrito-mensaje');

  if (!mensaje) {
    return;
  }

  mensaje.textContent = String(texto || '');
  mensaje.hidden = false;

  clearTimeout(mensajeTimer);

  mensajeTimer = setTimeout(function () {
    mensaje.hidden = true;
  }, 4800);
}
/* ═══════════ TURNOS DEL CHECKOUT ═══════════ */

function renderTurnosCheckout() {
  var bloque = document.getElementById('bloque-turnos');
  var lista = document.getElementById('lista-turnos-checkout');

  if (!bloque || !lista) {
    return;
  }

  var servicios = (carritoActual || {}).servicios || [];
  var incluyeServicios = grupoIncluyeServicios(grupoElegido());

  lista.innerHTML = '';

  if (pasoActual !== 2 || !incluyeServicios || !servicios.length) {
    bloque.hidden = true;
    return;
  }

  bloque.hidden = false;

  servicios.forEach(function (servicio) {
    lista.appendChild(filaTurnoServicio(servicio, servicios.length > 1));
  });
}

function filaTurnoServicio(servicio, conCopia) {
  var id = Number(servicio.id);

  var fila = document.createElement('div');
  fila.className = 'turno-checkout-fila';
  fila.dataset.id = String(id);

  var head = document.createElement('div');
  head.className = 'turno-head';

  var titulo = document.createElement('strong');
  titulo.textContent = String(servicio.nombre || 'Servicio');
  head.appendChild(titulo);

  var meta = document.createElement('span');
  meta.textContent = (Number(servicio.duracion) || 30) + ' min';
  head.appendChild(meta);

  fila.appendChild(head);

  var estado = document.createElement('p');
  estado.className = 'turno-estado' + (servicio.fecha && servicio.hora ? ' is-ok' : '');
  estado.textContent = servicio.fecha && servicio.hora
    ? 'Turno elegido: ' + resumenTurno(servicio)
    : 'Todavía no elegiste fecha y horario.';
  fila.appendChild(estado);

  var reserva = document.createElement('div');
  reserva.className = 'turno-reserva';

  var btnFecha = document.createElement('button');
  btnFecha.type = 'button';
  btnFecha.className = 'btn-outline btn-chico btn-elegir-fecha';
  btnFecha.textContent = servicio.fecha ? 'Cambiar fecha' : 'Elegir fecha';
  btnFecha.addEventListener('click', function () {
    abrirCalendario(id, btnFecha);
  });
  reserva.appendChild(btnFecha);

  if (conCopia) {
    var copiar = document.createElement('button');
    copiar.type = 'button';
    copiar.className = 'btn-ghost btn-chico';
    copiar.textContent = 'Usar para los demás';
    copiar.addEventListener('click', function () {
      copiarTurno(id);
    });
    reserva.appendChild(copiar);
  }

  fila.appendChild(reserva);

  var grid = document.createElement('div');
  grid.className = 'slot-grid';
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Horarios para ' + String(servicio.nombre || 'servicio'));
  fila.appendChild(grid);

  if (servicio.fecha) {
    cargarSlotsFila(id, grid);
  } else {
    var ayuda = document.createElement('span');
    ayuda.className = 'carrito-ayuda';
    ayuda.textContent = 'Primero elegí una fecha.';
    grid.appendChild(ayuda);
  }

  return fila;
}

function servicioEnCarrito(id) {
  return ((carritoActual || {}).servicios || []).find(function (s) {
    return Number(s.id) === Number(id);
  }) || null;
}

function guardarTurnoFila(id, fecha, hora) {
  return enviarCarrito('PUT', {
    tipo: 'servicio',
    id: Number(id),
    fecha: fecha || '',
    hora: hora ? String(hora).slice(0, 5) : ''
  })
    .then(function () {
      return actualizarCarrito();
    })
    .then(function () {
      if (typeof window.showToast === 'function') {
        window.showToast('Turno guardado.');
      }
    })
    .catch(function (error) {
      mostrarMensaje(error.message || 'No se pudo guardar el turno.');
    });
}

function copiarTurno(idOrigen) {
  var origen = servicioEnCarrito(idOrigen);

  if (!origen || !origen.fecha || !origen.hora) {
    mostrarMensaje('Primero elegí fecha y hora en ese servicio.');
    return;
  }

  var promesas = ((carritoActual || {}).servicios || [])
    .filter(function (s) {
      return Number(s.id) !== Number(idOrigen);
    })
    .map(function (s) {
      return enviarCarrito('PUT', {
        tipo: 'servicio',
        id: Number(s.id),
        fecha: origen.fecha,
        hora: String(origen.hora).slice(0, 5)
      });
    });

  Promise.all(promesas)
    .then(function () {
      return actualizarCarrito();
    })
    .then(function () {
      if (typeof window.showToast === 'function') {
        window.showToast('Fecha y horario aplicados a los demás servicios.');
      }
    })
    .catch(function (error) {
      mostrarMensaje(error.message || 'No se pudo copiar el turno.');
    });
}

function cargarSlotsFila(id, grid) {
  var servicio = servicioEnCarrito(id);

  if (!servicio || !servicio.fecha) {
    return;
  }

  var fecha = String(servicio.fecha);
  var duracion = Number(servicio.duracion) || 30;

  grid.innerHTML = '';

  var cargando = document.createElement('span');
  cargando.className = 'carrito-ayuda';
  cargando.textContent = 'Cargando horarios...';
  grid.appendChild(cargando);

  fetch(
    API_DISPONIBILIDAD +
      '?disponibilidad=1&fecha=' +
      encodeURIComponent(fecha) +
      '&duracion=' +
      encodeURIComponent(String(duracion)),
    { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }
  )
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (!document.body.contains(grid)) {
        return;
      }

      grid.innerHTML = '';

      function mensaje(texto) {
        var s = document.createElement('span');
        s.className = 'carrito-ayuda';
        s.textContent = texto;
        grid.appendChild(s);
      }

      if (!data || !data.ok) {
        mensaje('No se pudo cargar la disponibilidad.');
        return;
      }

      if (data.cerrado) {
        mensaje('Ese día el local está cerrado. Elegí otro día.');
        return;
      }

      var actual = String((servicioEnCarrito(id) || {}).hora || '').slice(0, 5);
      var disponibles = Array.isArray(data.disponibles) ? data.disponibles : [];

      if (actual && disponibles.indexOf(actual) === -1) {
        disponibles = [actual].concat(disponibles);
      }

      if (!disponibles.length) {
        mensaje('Sin horarios libres ese día. Probá con otra fecha.');
        return;
      }

      disponibles.forEach(function (hora) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn' + (hora === actual ? ' active' : '');
        btn.textContent = hora;
        btn.setAttribute('aria-pressed', String(hora === actual));
        btn.addEventListener('click', function () {
          grid.querySelectorAll('button').forEach(function (b) {
            b.disabled = true;
          });
          guardarTurnoFila(id, fecha, hora);
        });
        grid.appendChild(btn);
      });
    })
    .catch(function () {
      if (!document.body.contains(grid)) {
        return;
      }

      grid.innerHTML = '';

      var s = document.createElement('span');
      s.className = 'carrito-ayuda';
      s.textContent = 'No se pudo cargar la disponibilidad.';
      grid.appendChild(s);
    });
}

/* ═══════════ CALENDARIO ═══════════ */

function diaCerradoLocal(isoFecha) {
  var ts = new Date(isoFecha + 'T12:00:00').getTime();

  if (isNaN(ts)) {
    return true;
  }

  var diaSemana = new Date(ts).getDay();

  if ((cfgTurnos.diasCerrados || [0]).indexOf(diaSemana) !== -1) {
    return true;
  }

  return (cfgTurnos.feriados || []).indexOf(isoFecha) !== -1;
}

function isoHoy() {
  var hoy = new Date();

  return (
    hoy.getFullYear() +
    '-' +
    String(hoy.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(hoy.getDate()).padStart(2, '0')
  );
}

function cerrarCalendario() {
  if (calendarioAbierto && calendarioAbierto.parentElement) {
    calendarioAbierto.parentElement.removeChild(calendarioAbierto);
  }

  calendarioAbierto = null;

  try {
    document.removeEventListener('click', cerrarCalendarioAfuera);
  } catch (e) {}
}

function cerrarCalendarioAfuera(event) {
  if (
    calendarioAbierto &&
    !calendarioAbierto.contains(event.target) &&
    !(event.target.closest && event.target.closest('[data-cal-btn]'))
  ) {
    cerrarCalendario();
  }
}

function abrirCalendario(id, boton) {
  cerrarCalendario();

  var servicio = servicioEnCarrito(id);

  if (!servicio) {
    return;
  }

  var base = servicio.fecha || isoHoy();
  var partes = base.split('-');
  var anio = Number(partes[0]);
  var mes = Number(partes[1]) - 1;

  var pop = document.createElement('div');
  pop.className = 'cal-popup';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Elegir fecha para ' + String(servicio.nombre || 'servicio'));

  function dibujar() {
    pop.innerHTML = '';

    var nombresMes = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    var head = document.createElement('div');
    head.className = 'cal-head';

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'cal-nav';
    prev.textContent = '‹';
    prev.setAttribute('aria-label', 'Mes anterior');
    prev.addEventListener('click', function (event) {
      event.stopPropagation();
      mes--;

      if (mes < 0) {
        mes = 11;
        anio--;
      }

      dibujar();
    });
    head.appendChild(prev);

    var titulo = document.createElement('strong');
    titulo.textContent = nombresMes[mes] + ' ' + anio;
    head.appendChild(titulo);

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'cal-nav';
    next.textContent = '›';
    next.setAttribute('aria-label', 'Mes siguiente');
    next.addEventListener('click', function (event) {
      event.stopPropagation();
      mes++;

      if (mes > 11) {
        mes = 0;
        anio++;
      }

      dibujar();
    });
    head.appendChild(next);

    pop.appendChild(head);

    var dias = document.createElement('div');
    dias.className = 'cal-dias';
    ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].forEach(function (d) {
      var h = document.createElement('span');
      h.textContent = d;
      dias.appendChild(h);
    });
    pop.appendChild(dias);

    var grilla = document.createElement('div');
    grilla.className = 'cal-grilla';

    var primero = new Date(anio, mes, 1);
    var desplazamiento = (primero.getDay() + 6) % 7;
    var diasMes = new Date(anio, mes + 1, 0).getDate();
    var hoyIso = isoHoy();
    var actual = String((servicioEnCarrito(id) || {}).fecha || '');

    for (var i = 0; i < desplazamiento; i++) {
      grilla.appendChild(document.createElement('span'));
    }

    for (var d = 1; d <= diasMes; d++) {
      var iso =
        anio +
        '-' +
        String(mes + 1).padStart(2, '0') +
        '-' +
        String(d).padStart(2, '0');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-dia' + (iso === actual ? ' active' : '');
      btn.textContent = String(d);

      if (iso < hoyIso || diaCerradoLocal(iso)) {
        btn.disabled = true;
        btn.title = iso < hoyIso ? 'Fecha pasada' : 'Cerrado';
      } else {
        (function (fechaElegida) {
          btn.addEventListener('click', function () {
            cerrarCalendario();
            guardarTurnoFila(id, fechaElegida, (servicioEnCarrito(id) || {}).hora || '');
          });
        })(iso);
      }

      grilla.appendChild(btn);
    }

    pop.appendChild(grilla);

    var pie = document.createElement('p');
    pie.className = 'carrito-ayuda';
    pie.textContent = 'Lun. a sáb. · Domingos y feriados cerrado.';
    pop.appendChild(pie);
  }

  dibujar();

  boton.setAttribute('data-cal-btn', '1');

  if (boton.parentElement) {
    boton.parentElement.insertBefore(pop, boton.nextSibling);
  }

  calendarioAbierto = pop;

  setTimeout(function () {
    document.addEventListener('click', cerrarCalendarioAfuera);
  }, 0);
}
