/* ═══════════════════════════════════════════════════════════════
   Senderos — carrito.js
   Carrito por api/carrito.php + paso de pago por api/checkout.php.
   ═══════════════════════════════════════════════════════════════ */

var API_CARRITO = '../api/carrito.php';
var API_CHECKOUT = '../api/checkout.php';
var API_DISPONIBILIDAD = '../api/turnos.php';
var API_CONFIG = '../api/configuracion.php';

var carritoActual = null;
var costoEnvio = 0;
var checkoutVisible = false;
var cfgTurnos = { diasCerrados: [0], feriados: [], ventanas: [], pasoMin: 30 };
var calendarioAbierto = null;

document.addEventListener('DOMContentLoaded', function () {
  inicializarCarrito();
});

function inicializarCarrito() {
  aplicarConfigPago();

  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  actualizarCarrito().then(function () {
    return cargarCostoEnvio();
  }).then(function () {
    cablearCheckout();
  }).catch(function () {
    cablearCheckout();
  });

  document.addEventListener('change', manejarCambioCarrito);
  document.addEventListener('click', manejarClickCarrito);
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
        carrito: data.carrito || { productos: [], servicios: [], total_productos: 0, total_servicios: 0, total: 0 },
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
      actualizarResumen(carritoActual);
      actualizarEstadoVacio(carritoActual);
      alternarGrupo();
      actualizarCheckoutVisibilidad();

      if (typeof window.actualizarNavbar === 'function') {
        window.actualizarNavbar();
      }
    })
    .catch(function (error) {
      mostrarMensaje(error.message || 'No se pudo cargar el carrito.');
    });
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

function actualizarResumen(carrito) {
  var totalProductos = document.getElementById('total-productos');
  var totalServicios = document.getElementById('total-servicios');
  var totalCarrito = document.getElementById('total-carrito');
  var lineaEnvio = document.getElementById('linea-envio');
  var totalEnvio = document.getElementById('total-envio');

  if (totalProductos) {
    totalProductos.textContent = formatoDinero(carrito.total_productos);
  }

  if (totalServicios) {
    totalServicios.textContent = formatoDinero(carrito.total_servicios);
  }

  var grupo = typeof grupoElegido === 'function' ? grupoElegido() : 'productos';
  var incluyeProd = grupo === 'productos';
  var incluyeServ = grupo === 'servicios';

  var entrega = entregaElegida();
  var envio = 0;

  if (entrega === 'envio' && incluyeProd && (carrito.productos || []).length) {
    envio = costoEnvio;
  }

  if (lineaEnvio) {
    lineaEnvio.hidden = !(envio > 0);
  }

  if (totalEnvio) {
    totalEnvio.textContent = formatoDinero(envio);
  }

  var totalGrupo =
    (incluyeProd ? Number(carrito.total_productos || 0) : 0) +
    (incluyeServ ? Number(carrito.total_servicios || 0) : 0) +
    envio;

  if (totalCarrito) {
    totalCarrito.textContent = formatoDinero(totalGrupo);
  }

  var ayuda = document.getElementById('resumen-grupo-ayuda');
  if (ayuda) {
    if (grupo === 'servicios') {
      ayuda.textContent = 'Este pago incluye solo los servicios. Los productos quedan en el carrito.';
    } else {
      ayuda.textContent = 'Este pago incluye solo los productos. Los servicios quedan en el carrito.';
    }
  }
}

function actualizarEstadoVacio(carrito) {
  var productos = carrito.productos || [];
  var servicios = carrito.servicios || [];
  var vacio = productos.length === 0 && servicios.length === 0;

  var carritoVacio = document.getElementById('carrito-vacio');
  var resumen = document.getElementById('carrito-resumen');
  var checkout = document.getElementById('carrito-checkout');

  if (carritoVacio) {
    carritoVacio.hidden = !vacio;
  }

  if (resumen) {
    resumen.hidden = vacio;
  }

  if (checkout) {
    checkout.hidden = vacio || !checkoutVisible;

    if (vacio) {
      checkoutVisible = false;
      cerrarCalendario();
    }
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

function crearProductoItem(producto) {
  var article = document.createElement('article');
  article.className = 'carrito-item';

  var id = Number(producto.id);
  var cantidad = Math.max(1, Number(producto.cantidad) || 1);
  var stock = Math.max(cantidad, Number(producto.stock_cantidad) || cantidad);
  var precioFinal = Number(producto.precio_final ?? producto.precio) || 0;
  var precioOriginal = Number(producto.precio) || 0;
  var oferta = producto.oferta || null;

  var cont = document.createElement('div');
  cont.className = 'carrito-item-info';

  if (producto.imagen) {
    var img = document.createElement('img');
    img.src = String(producto.imagen);
    img.alt = String(producto.nombre || '');
    img.className = 'carrito-item-imagen';
    img.loading = 'lazy';
    img.onerror = function () {
      img.style.display = 'none';
    };
    cont.appendChild(img);
  }

  var datos = document.createElement('div');
  datos.className = 'carrito-item-datos';

  var tipo = document.createElement('span');
  tipo.className = 'carrito-item-tipo';
  tipo.textContent = 'Producto';
  datos.appendChild(tipo);

  var h3 = document.createElement('h3');
  h3.textContent = String(producto.nombre || '');
  datos.appendChild(h3);

  if (producto.marca) {
    var marca = document.createElement('p');
    marca.className = 'carrito-item-marca';
    marca.textContent = String(producto.marca);
    datos.appendChild(marca);
  }

  var precio = document.createElement('p');
  precio.className = 'carrito-item-precio';

  if (oferta && precioFinal < precioOriginal) {
    var tachado = document.createElement('s');
    tachado.textContent = formatoDinero(precioOriginal);
    precio.appendChild(tachado);
    precio.appendChild(document.createTextNode(' ' + formatoDinero(precioFinal) + ' c/u'));

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
    gratis.textContent = ' (2x1: ' + producto.unidades_gratis + ' gratis)';
    precio.appendChild(gratis);
  }

  datos.appendChild(precio);
  cont.appendChild(datos);
  article.appendChild(cont);

  var controles = document.createElement('div');
  controles.className = 'carrito-item-controles';

  var label = document.createElement('label');
  label.className = 'carrito-cantidad';

  var spanCant = document.createElement('span');
  spanCant.textContent = 'Cantidad';
  label.appendChild(spanCant);

  var input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = String(stock);
  input.value = String(cantidad);
  input.dataset.tipo = 'producto';
  input.dataset.id = String(id);
  input.className = 'cantidad-producto';
  input.setAttribute('inputmode', 'numeric');
  label.appendChild(input);
  controles.appendChild(label);

  var sub = document.createElement('strong');
  sub.className = 'carrito-subtotal';
  sub.textContent = formatoDinero(producto.subtotal);
  controles.appendChild(sub);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-eliminar';
  btn.dataset.tipo = 'producto';
  btn.dataset.id = String(id);
  btn.textContent = 'Eliminar';
  controles.appendChild(btn);

  article.appendChild(controles);

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

  var id = Number(servicio.id);
  var duracion = Number(servicio.duracion) || 0;
  var precioFinal = Number(servicio.precio_final ?? servicio.precio) || 0;
  var precioOriginal = Number(servicio.precio) || 0;
  var oferta = servicio.oferta || null;

  var cont = document.createElement('div');
  cont.className = 'carrito-item-info';

  if (servicio.imagen) {
    var img = document.createElement('img');
    img.src = String(servicio.imagen);
    img.alt = String(servicio.nombre || '');
    img.className = 'carrito-item-imagen';
    img.loading = 'lazy';
    img.onerror = function () {
      img.style.display = 'none';
    };
    cont.appendChild(img);
  }

  var datos = document.createElement('div');
  datos.className = 'carrito-item-datos';

  var tipo = document.createElement('span');
  tipo.className = 'carrito-item-tipo';
  tipo.textContent = 'Servicio';
  datos.appendChild(tipo);

  var h3 = document.createElement('h3');
  h3.textContent = String(servicio.nombre || '');
  datos.appendChild(h3);

  if (duracion) {
    var dur = document.createElement('p');
    dur.className = 'carrito-item-marca';
    dur.textContent = duracion + ' minutos';
    datos.appendChild(dur);
  }

  var precio = document.createElement('p');
  precio.className = 'carrito-item-precio';

  if (oferta && precioFinal < precioOriginal) {
    var tachado = document.createElement('s');
    tachado.textContent = formatoDinero(precioOriginal);
    precio.appendChild(tachado);
    precio.appendChild(document.createTextNode(' ' + formatoDinero(precioFinal)));
  } else {
    precio.textContent = formatoDinero(precioOriginal);
  }

  datos.appendChild(precio);
  cont.appendChild(datos);
  article.appendChild(cont);

  var turno = document.createElement('div');
  turno.className = 'servicio-turno-elegido';
  turno.dataset.id = String(id);

  var iconoTxt = document.createElement('span');
  iconoTxt.textContent = 'Reserva: ';
  turno.appendChild(iconoTxt);

  var valor = document.createElement('strong');
  valor.className = 'servicio-turno-valor';
  valor.textContent = resumenTurno(servicio);
  turno.appendChild(valor);

  var hint = document.createElement('span');
  hint.className = 'carrito-ayuda';
  hint.textContent = ' (se elige una sola vez abajo, en el paso de pago)';
  turno.appendChild(hint);

  article.appendChild(turno);

  var controles = document.createElement('div');
  controles.className = 'carrito-item-controles';

  var sub = document.createElement('strong');
  sub.className = 'carrito-subtotal';
  sub.textContent = formatoDinero(servicio.subtotal);
  controles.appendChild(sub);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-eliminar';
  btn.dataset.tipo = 'servicio';
  btn.dataset.id = String(id);
  btn.textContent = 'Eliminar';
  controles.appendChild(btn);

  article.appendChild(controles);

  return article;
}

function resumenTurno(servicio) {
  var fecha = String(servicio.fecha || '');
  var hora = String(servicio.hora || '').slice(0, 5);

  if (!fecha || !hora) {
    return 'sin elegir todavía';
  }

  return fecha + ' ' + hora;
}

function pintarTurnosElegidos() {
  document.querySelectorAll('.servicio-turno-elegido').forEach(function (caja) {
    var id = Number(caja.dataset.id);
    var servicio = (carritoActual.servicios || []).find(function (s) {
      return Number(s.id) === id;
    });

    var valor = caja.querySelector('.servicio-turno-valor');

    if (valor) {
      valor.textContent = resumenTurno(servicio || {});
    }
  });
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

/* ═══════════ CAMBIOS ═══════════ */

function manejarCambioCarrito(event) {
  var elemento = event.target;

  if (elemento.classList.contains('cantidad-producto')) {
    actualizarProducto(elemento);
    return;
  }

  if (
    elemento.name === 'entrega' ||
    elemento.id === 'direccion-envio'
  ) {
    actualizarResumen(carritoActual || { productos: [], servicios: [], total: 0 });
    alternarDireccion();
    return;
  }
}

function actualizarProducto(input) {
  var id = Number(input.dataset.id);
  var cantidad = Number(input.value);
  var max = Number(input.max);

  if (!Number.isFinite(cantidad)) {
    cantidad = 1;
  }

  cantidad = Math.max(1, Math.trunc(cantidad));

  if (Number.isFinite(max) && max > 0) {
    cantidad = Math.min(cantidad, max);
  }

  input.value = cantidad;

  enviarCarrito('PUT', { tipo: 'producto', id: id, cantidad: cantidad })
    .then(actualizarCarrito)
    .catch(function (error) {
      mostrarMensaje(error.message || 'No se pudo actualizar la cantidad.');
    });
}

/* ═══════════ CLICKS ═══════════ */

function manejarClickCarrito(event) {
  var boton = event.target.closest('.btn-eliminar');

  if (boton) {
    eliminarItem(boton);
    return;
  }

  if (event.target.closest('#btn-vaciar-carrito')) {
    pedirVaciarCarrito();
    return;
  }

  if (event.target.closest('#btn-continuar-compra')) {
    continuarCompra();
    return;
  }

  if (event.target.closest('#btn-confirmar-pedido')) {
    confirmarPedido();
  }
}

function eliminarItem(boton) {
  var tipo = boton.dataset.tipo;
  var id = Number(boton.dataset.id);

  if (!tipo || !Number.isFinite(id)) {
    return;
  }

  boton.disabled = true;

  enviarCarrito('DELETE', { tipo: tipo, id: id })
    .then(actualizarCarrito)
    .catch(function (error) {
      boton.disabled = false;
      mostrarMensaje(error.message || 'No se pudo eliminar el elemento.');
    });
}

function pedirVaciarCarrito() {
  if (typeof window.mostrarModalValidacion !== 'function') {
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
      checkoutVisible = false;
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

/* ═══════════ CHECKOUT ═══════════ */

function cablearCheckout() {
  document.querySelectorAll('input[name="entrega"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      alternarDireccion();
      actualizarResumen(carritoActual || { productos: [], servicios: [], total: 0 });
    });
  });

  document.querySelectorAll('input[name="pago_grupo"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      alternarDireccion();
      actualizarResumen(carritoActual || { productos: [], servicios: [], total: 0 });
    });
  });

  document.querySelectorAll('input[name="metodo_pago"]').forEach(function (radio) {
    radio.addEventListener('change', alternarMetodoPago);
  });

  var ultimos4 = document.getElementById('tarjeta-ultimos4');

  if (ultimos4) {
    ultimos4.addEventListener('input', function () {
      ultimos4.value = ultimos4.value.replace(/\D/g, '').slice(0, 4);

      var campoErr = document.getElementById('err-tarjeta-ultimos4');

      if (campoErr) {
        campoErr.textContent = '';
      }
    });
  }

  var btnAlias = document.getElementById('btn-copiar-alias');

  if (btnAlias) {
    btnAlias.addEventListener('click', copiarAlias);
  }

  alternarMetodoPago();
  alternarDireccion();
}

/* Muestra el panel del método elegido: alias (transferencia),
   nada (débito) o marca + últimos 4 dígitos (tarjeta). */
function alternarMetodoPago() {
  var metodo = metodoElegido();
  var panelAlias = document.getElementById('panel-transferencia');
  var panelTarjeta = document.getElementById('panel-tarjeta');

  if (panelAlias) {
    panelAlias.hidden = metodo !== 'transferencia';
  }

  if (panelTarjeta) {
    panelTarjeta.hidden = metodo !== 'tarjeta';
  }
}

/* ═══════════ CONFIGURACIÓN DE PAGO ═══════════

   El alias y el WhatsApp de pago salen de js/config-pagos.js, el único
   lugar editable de esos datos: acá no se pega ningún valor, solo se
   vuelca window.CONFIG_PAGOS al DOM (alias y spans [data-pago-whatsapp]). */
function configuracionPago() {
  var cfg = window.CONFIG_PAGOS || {};

  return {
    alias: typeof cfg.alias === 'string' ? cfg.alias.trim() : '',
    whatsappPago: typeof cfg.whatsappPago === 'string' ? cfg.whatsappPago.trim() : ''
  };
}

function aplicarConfigPago() {
  var cfg = configuracionPago();
  var alias = document.getElementById('alias-valor');

  if (alias) {
    alias.textContent = cfg.alias || '—';
  }

  document.querySelectorAll('[data-pago-whatsapp]').forEach(function (nodo) {
    nodo.textContent = cfg.whatsappPago;
  });
}

function copiarAlias() {
  var valor = document.getElementById('alias-valor');
  var texto = valor ? String(valor.textContent || '').trim() : '';

  /* Sin alias configurado no se copia nada ni se avisa con un valor inventado. */
  if (!texto || texto === '—') {
    texto = configuracionPago().alias;
  }

  if (!texto) {
    if (typeof window.showToast === 'function') {
      window.showToast('El alias de transferencia todavía no está disponible.');
    }

    return;
  }

  function listo() {
    if (typeof window.showToast === 'function') {
      window.showToast('Alias copiado: ' + texto);
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(listo).catch(copiarAliasFallback);
  } else {
    copiarAliasFallback();
  }

  function copiarAliasFallback() {
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
        window.showToast('Copiá el alias manualmente: ' + texto);
      }
    }

    document.body.removeChild(aux);
  }
}

function entregaElegida() {
  var radio = document.querySelector('input[name="entrega"]:checked');

  return radio ? radio.value : 'retiro';
}

function metodoElegido() {
  var radio = document.querySelector('input[name="metodo_pago"]:checked');

  return radio ? radio.value : 'transferencia';
}

/* Datos de pago a enviar al servidor. Para tarjeta se envía la marca
   (visa, mastercard, cabal, naranja_x, amex) y solo los últimos 4 dígitos:
   el número completo nunca sale del navegador. */
function datosPago() {
  var metodo = metodoElegido();

  if (metodo !== 'tarjeta') {
    return { metodo: metodo, ultimos4: '' };
  }

  var marcaRadio = document.querySelector('input[name="tarjeta_marca"]:checked');
  var marca = marcaRadio ? marcaRadio.value : '';
  var input = document.getElementById('tarjeta-ultimos4');
  var ultimos4 = String((input || {}).value || '').replace(/\D/g, '').slice(0, 4);

  return { metodo: marca, ultimos4: marca ? ultimos4 : '' };
}

function grupoElegido() {
  /* Productos y servicios se pagan por separado: si el carrito tiene un
     solo tipo, ese es el grupo; con ambos, se usa la elección visible. */
  var tieneProd = (((carritoActual || {}).productos) || []).length > 0;
  var tieneServ = (((carritoActual || {}).servicios) || []).length > 0;

  if (tieneProd && !tieneServ) {
    return 'productos';
  }

  if (tieneServ && !tieneProd) {
    return 'servicios';
  }

  var radio = document.querySelector('input[name="pago_grupo"]:checked');

  return radio ? radio.value : 'productos';
}

function alternarGrupo() {
  var bloque = document.getElementById('bloque-grupo');

  if (!bloque) {
    return;
  }

  var tieneProductos = ((carritoActual || {}).productos || []).length > 0;
  var tieneServicios = ((carritoActual || {}).servicios || []).length > 0;

  /* Solo hace falta elegir cuando el carrito mezcla los dos tipos. */
  bloque.hidden = !(tieneProductos && tieneServicios);

  if (!bloque.hidden) {
    var elegido = document.querySelector('input[name="pago_grupo"]:checked');

    if (!elegido) {
      var primero = document.querySelector('input[name="pago_grupo"]');

      if (primero) {
        primero.checked = true;
      }
    }
  }

  /* El bloque de entrega depende del grupo elegido. */
  if (typeof alternarDireccion === 'function') {
    alternarDireccion();
  }
}

function alternarDireccion() {
  var grupo = document.getElementById('grupo-direccion');
  var bloqueEntrega = document.getElementById('bloque-entrega');
  var txt = document.getElementById('costo-envio-txt');

  if (txt) {
    txt.textContent = costoEnvio > 0 ? '(' + formatoDinero(costoEnvio) + ')' : '';
  }

  /* Los servicios se reservan con turno: no tienen envío ni retiro. */
  if (bloqueEntrega) {
    bloqueEntrega.hidden =
      typeof grupoElegido === 'function' && grupoElegido() === 'servicios';
  }

  if (!grupo) {
    return;
  }

  var esEnvio =
    entregaElegida() === 'envio' &&
    ((carritoActual || {}).productos || []).length > 0;

  grupo.hidden = !esEnvio;
}

function cargarCostoEnvio() {
  if (typeof window.cargarConfig === 'function') {
    return window.cargarConfig().then(function (cfg) {
      cfg = cfg || {};
      costoEnvio = Number(cfg.costoEnvio) || 0;
      cfgTurnos.diasCerrados = Array.isArray(cfg.diasCerrados) ? cfg.diasCerrados : [0];
      cfgTurnos.feriados = Array.isArray(cfg.feriados) ? cfg.feriados : [];
      cfgTurnos.ventanas = Array.isArray(cfg.ventanas) ? cfg.ventanas : [];
      cfgTurnos.pasoMin = Number(cfg.pasoMin) || 30;
      alternarDireccion();

      if (carritoActual) {
        actualizarResumen(carritoActual);
      }
    });
  }

  return fetch(API_CONFIG, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      costoEnvio = Number((data || {}).costoEnvio) || 0;
      cfgTurnos.diasCerrados = Array.isArray((data || {}).diasCerrados) ? data.diasCerrados : [0];
      cfgTurnos.feriados = Array.isArray((data || {}).feriados) ? data.feriados : [];
      alternarDireccion();

      if (carritoActual) {
        actualizarResumen(carritoActual);
      }
    })
    .catch(function () {
      costoEnvio = 0;
    });
}

function continuarCompra() {
  if (!carritoActual) {
    return;
  }

  var sesion =
    typeof window.getSesion === 'function' ? window.getSesion() : null;

  if (!sesion) {
    try {
      window.localStorage.setItem('redirectAfterLogin', 'carrito.html');
    } catch (e) {}

    window.location.href = 'login.html';
    return;
  }

  consultarSesionServidorSiHaceFalta().then(function (usuario) {
    if (!usuario) {
      try {
        window.localStorage.setItem('redirectAfterLogin', 'carrito.html');
      } catch (e) {}

      window.location.href = 'login.html';
      return;
    }

    checkoutVisible = true;
    actualizarEstadoVacio(carritoActual);
    renderTurnosCheckout();

    var checkout = document.getElementById('carrito-checkout');

    if (checkout) {
      checkout.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

function actualizarCheckoutVisibilidad() {
  if (!checkoutVisible) {
    return;
  }

  var checkout = document.getElementById('carrito-checkout');

  if (checkout) {
    checkout.hidden = false;
  }

  renderTurnosCheckout();
}

function renderTurnosCheckout() {
  var bloque = document.getElementById('bloque-turnos');
  var lista = document.getElementById('lista-turnos-checkout');

  if (!bloque || !lista) {
    return;
  }

  var servicios = (carritoActual || {}).servicios || [];

  lista.innerHTML = '';

  if (!servicios.length) {
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

  var titulo = document.createElement('strong');
  titulo.textContent =
    String(servicio.nombre || 'Servicio') +
    ' (' + (Number(servicio.duracion) || 30) + ' min)';
  fila.appendChild(titulo);

  var meta = document.createElement('p');
  meta.className = 'carrito-ayuda';
  meta.textContent = 'Elegido: ' + resumenTurno(servicio);
  fila.appendChild(meta);

  var btnFecha = document.createElement('button');
  btnFecha.type = 'button';
  btnFecha.className = 'btn-outline btn-chico';
  btnFecha.textContent = servicio.fecha ? 'Cambiar fecha (' + servicio.fecha + ')' : 'Elegir fecha';
  btnFecha.addEventListener('click', function () {
    abrirCalendario(id, btnFecha);
  });
  fila.appendChild(btnFecha);

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
    ayuda.textContent = 'Primero elegí la fecha.';
    grid.appendChild(ayuda);
  }

  if (conCopia) {
    var copiar = document.createElement('button');
    copiar.type = 'button';
    copiar.className = 'btn-ghost btn-chico';
    copiar.textContent = 'Usar esta fecha y hora para los demás';
    copiar.addEventListener('click', function () {
      copiarTurno(id);
    });
    fila.appendChild(copiar);
  }

  return fila;
}

function servicioEnCarrito(id) {
  return (carritoActual.servicios || []).find(function (s) {
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
    .then(actualizarCarrito)
    .then(function () {
      pintarTurnosElegidos();

      if (checkoutVisible) {
        renderTurnosCheckout();
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

  var promesas = (carritoActual.servicios || [])
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
    .then(actualizarCarrito)
    .then(function () {
      pintarTurnosElegidos();
      mostrarMensaje(
        'Todos quedaron para el ' + origen.fecha + ' a las ' + String(origen.hora).slice(0, 5) + ' hs.'
      );

      if (checkoutVisible) {
        renderTurnosCheckout();
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
          btn.disabled = true;
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

/* ── Calendario propio ── */

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

function confirmarPedido() {
  var err = document.getElementById('checkout-error');

  if (err) {
    err.textContent = '';
  }

  var entrega = entregaElegida();
  var pago = datosPago();
  var metodo = pago.metodo;
  var grupo = grupoElegido();
  var direccion = (
    document.getElementById('direccion-envio') || {}
  ).value || '';

  direccion = String(direccion).trim();

  var incluyeProd = grupo === 'productos';
  var incluyeServ = grupo === 'servicios';

  /* Tarjeta: marca obligatoria y solo 4 dígitos (nunca el número completo). */
  var grupoMetodo = document.getElementById('bloque-pago');
  var errCampo = document.getElementById('err-tarjeta-ultimos4');

  if (errCampo) {
    errCampo.textContent = '';
  }

  if (metodoElegido() === 'tarjeta') {
    var errMarca = '';

    if (!pago.metodo) {
      errMarca = 'Elegí la marca de tu tarjeta (Visa, Mastercard, Cabal, Naranja X o American Express).';
    } else if (pago.ultimos4.length !== 4) {
      errMarca = 'Ingresá los últimos 4 dígitos de la tarjeta.';

      if (errCampo) {
        errCampo.textContent = 'Faltan los 4 dígitos.';
      }
    }

    if (errMarca) {
      if (err) {
        err.textContent = errMarca;
      }

      if (grupoMetodo) {
        grupoMetodo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      return;
    }
  }

  if (
    entrega === 'envio' &&
    incluyeProd &&
    ((carritoActual || {}).productos || []).length > 0 &&
    direccion.length < 8
  ) {
    if (err) {
      err.textContent =
        'Contanos la dirección completa para el envío (calle, número y ciudad).';
    }

    return;
  }

  var servicios = (carritoActual || {}).servicios || [];
  var turnos = {};

  if (incluyeServ && servicios.length) {
    var incompleto = servicios.find(function (s) {
      return !s.fecha || !s.hora;
    });

    if (incompleto) {
      if (err) {
        err.textContent =
          'Elegí fecha y horario para "' + String(incompleto.nombre || 'el servicio') + '".';
      }

      var bloque = document.getElementById('bloque-turnos');

      if (bloque) {
        bloque.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      return;
    }

    servicios.forEach(function (s) {
      turnos[String(s.id)] = {
        fecha: String(s.fecha),
        hora: String(s.hora).slice(0, 5)
      };
    });
  }

  var boton = document.getElementById('btn-confirmar-pedido');

  if (boton) {
    boton.disabled = true;
  }

  fetch(API_CHECKOUT, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entrega: entrega,
      direccion: direccion,
      metodo_pago: metodo,
      tarjeta_ultimos4: pago.ultimos4,
      pago_grupo: grupo,
      turnos: turnos
    })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          if (respuesta.status === 401) {
            try {
              window.localStorage.setItem('redirectAfterLogin', 'carrito.html');
            } catch (e) {}

            window.location.href = 'login.html';
            throw new Error('Tenés que iniciar sesión para confirmar el pedido.');
          }

          throw new Error(data.mensaje || data.error || 'No se pudo registrar el pedido.');
        }

        return data;
      });
    })
    .then(function (data) {
      window.location.href =
        'confirmacion.html?id=' + encodeURIComponent(String(data.pedido_id));
    })
    .catch(function (error) {
      if (err) {
        err.textContent = error.message || 'No se pudo registrar el pedido.';
      } else {
        mostrarMensaje(error.message || 'No se pudo registrar el pedido.');
      }
    })
    .finally(function () {
      if (boton) {
        boton.disabled = false;
      }
    });
}

/* ═══════════ UTILIDADES ═══════════ */

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

var mensajeTimer = null;

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
  }, 3500);

  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }
}
