/* ═══════════════════════════════════════════════════════════════
   Senderos — confirmacion.js
   Muestra el pedido real (GET pedidos.php?id=, solo dueño o admin).
   ═══════════════════════════════════════════════════════════════ */

var WHATSAPP_NUMERO = '5493571616113';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  cargarConfirmacion();
});

function idPedidoDeURL() {
  try {
    var params = new URLSearchParams(window.location.search);
    var id = Number(params.get('id'));

    return Number.isFinite(id) && id > 0 ? id : 0;
  } catch (e) {
    return 0;
  }
}

function cargarConfirmacion() {
  var id = idPedidoDeURL();

  if (!id) {
    mostrarConfirmacionGenerica();
    return;
  }

  fetch('../api/pedidos.php?id=' + encodeURIComponent(String(id)), {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok || !data.pedido) {
          throw new Error(
            (data && (data.error || data.mensaje)) ||
              'No se pudo cargar el pedido.'
          );
        }

        return data.pedido;
      });
    })
    .then(function (pedido) {
      mostrarPedido(pedido);
    })
    .catch(function () {
      mostrarConfirmacionGenerica(id);
    });
}

function mostrarPedido(pedido) {
  var id = Number(pedido.id || 0);
  var items = Array.isArray(pedido.items) ? pedido.items : [];
  var turnos = Array.isArray(pedido.turnos) ? pedido.turnos : [];
  var total = Number(pedido.total) || 0;

  actualizarNumeroPedido(id);
  renderItems(items);
  renderTotales(pedido, items, total);
  renderDetalle(pedido, turnos);
  configurarWhatsApp(pedido, items, turnos, total);
  actualizarSubtituloPago(pedido);
  programarActualizacionPago(pedido);
}

function esPagoSimulado(pedido) {
  var metodo = String((pedido || {}).metodo_pago || '').toLowerCase();
  var proveedor = String((pedido || {}).pago_proveedor || '').toLowerCase();

  return proveedor.indexOf('simulacion') === 0 ||
    ['billetera', 'transferencia_qr', 'efectivo'].indexOf(metodo) !== -1;
}

function actualizarSubtituloPago(pedido) {
  var subtitulo = document.getElementById('confirmSubtitle');

  if (!subtitulo) {
    return;
  }

  var estado = String(pedido.pago_estado || 'pendiente').toLowerCase();

  if (estado === 'simulado') {
    subtitulo.textContent = 'Recibimos tu pedido. El pago fue aprobado en modo demostración; no se debitó dinero real.';
    return;
  }

  if (estado === 'aprobado') {
    subtitulo.textContent = 'Recibimos tu pedido y el pago fue acreditado. Ya estamos trabajando en él.';
    return;
  }

  if (estado === 'rechazado' || estado === 'cancelado' || estado === 'error') {
    subtitulo.textContent = 'Recibimos tu pedido, pero el pago no se completó. Podés coordinar otro medio con el local.';
    return;
  }

  if (estado === 'reembolsado') {
    subtitulo.textContent = 'Recibimos tu pedido. El pago fue reembolsado.';
    return;
  }

  if (estado === 'revisar') {
    subtitulo.textContent = 'Recibimos tu pedido. El pago necesita una revisión con el local.';
    return;
  }

  if (esPagoSimulado(pedido)) {
    subtitulo.textContent = 'Recibimos tu pedido. El pago simulado quedó pendiente en modo demostración.';
    return;
  }

  if (String(pedido.metodo_pago || '').toLowerCase() === 'mercadopago') {
    subtitulo.textContent = 'Recibimos tu pedido. Estamos esperando la acreditación de Mercado Pago.';
    return;
  }

  subtitulo.textContent = 'Recibimos tu pedido. El pago queda pendiente de coordinación.';
}

var actualizacionPagoTimer = null;
var intentosActualizacionPago = 0;

function programarActualizacionPago(pedido) {
  if (actualizacionPagoTimer) {
    clearTimeout(actualizacionPagoTimer);
    actualizacionPagoTimer = null;
  }

  var metodo = String(pedido.metodo_pago || '').toLowerCase();
  var estado = String(pedido.pago_estado || 'pendiente').toLowerCase();

  if (metodo !== 'mercadopago' || ['pendiente', 'en_proceso'].indexOf(estado) === -1) {
    intentosActualizacionPago = 0;
    return;
  }

  if (intentosActualizacionPago >= 10) {
    return;
  }

  intentosActualizacionPago += 1;

  actualizacionPagoTimer = setTimeout(function () {
    cargarConfirmacion();
  }, 6000);
}

function actualizarNumeroPedido(id) {
  var elemento = document.getElementById('confirmOrderNum');

  if (!elemento) {
    return;
  }

  elemento.textContent = id ? '#' + String(id).padStart(6, '0') : '—';
}

function mostrarConfirmacionGenerica(pedidoId) {
  actualizarNumeroPedido(Number(pedidoId) || 0);

  var items = document.getElementById('confirmItems');

  if (items) {
    items.innerHTML = '';

    var p = document.createElement('p');
    p.className = 'confirm-generic';
    p.textContent =
      'Tu pedido fue registrado correctamente. Podés consultar el detalle desde Mis turnos y pedidos.';
    items.appendChild(p);
  }

  var totals = document.getElementById('confirmTotals');

  if (totals) {
    totals.innerHTML = '';
  }

  var detalle = document.getElementById('confirmDetalle');

  if (detalle) {
    detalle.innerHTML = '';
  }

  ocultarWhatsApp();
}

function renderItems(items) {
  var contenedor = document.getElementById('confirmItems');

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = '';

  if (!items.length) {
    var p = document.createElement('p');
    p.className = 'confirm-generic';
    p.textContent = 'Tu pedido fue registrado correctamente.';
    contenedor.appendChild(p);
    return;
  }

  items.forEach(function (item) {
    var nombre = String(item.nombre || 'Producto');
    var cantidad = Math.max(1, Number(item.cantidad) || 1);
    var precio = Number(item.precio) || 0;

    var fila = document.createElement('div');
    fila.className = 'confirm-item';

    var info = document.createElement('div');
    info.className = 'confirm-item-info';

    var name = document.createElement('div');
    name.className = 'confirm-item-name';
    name.textContent = nombre + (Number(precio) === 0 ? ' (gratis)' : '');
    info.appendChild(name);

    var meta = document.createElement('div');
    meta.className = 'confirm-item-meta';
    meta.textContent = 'Cantidad: ' + cantidad;
    info.appendChild(meta);

    var price = document.createElement('div');
    price.className = 'confirm-item-price';
    price.textContent = formatoConfirmPrecio(precio * cantidad);

    fila.appendChild(info);
    fila.appendChild(price);
    contenedor.appendChild(fila);
  });
}

function renderTotales(pedido, items, total) {
  var contenedor = document.getElementById('confirmTotals');

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = '';

  var subtotal = items.reduce(function (acc, item) {
    return acc + Number(item.precio || 0) * Math.max(1, Number(item.cantidad) || 1);
  }, 0);

  var envio = Number(pedido.costo_envio) || Math.max(0, total - subtotal);
  if (pedido.entrega !== 'envio') {
    envio = 0;
  }

  function fila(etiqueta, valor, grande) {
    var row = document.createElement('div');
    row.className = 'confirm-total-row' + (grande ? ' grand' : '');

    var a = document.createElement('span');
    a.textContent = etiqueta;

    var b = document.createElement('span');
    b.textContent = formatoConfirmPrecio(valor);

    row.appendChild(a);
    row.appendChild(b);
    contenedor.appendChild(row);
  }

  fila('Subtotal', subtotal, false);

  if (envio > 0) {
    fila('Envío', envio, false);
  }

  fila('Total', total, true);
}

function formatoFechaTurno(fecha) {
  var valor = String(fecha || '');

  if (!valor) {
    return 'Fecha a confirmar';
  }

  try {
    var d = new Date(valor + 'T12:00:00');

    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    }
  } catch (e) {}

  return valor;
}

function renderDetalle(pedido, turnos) {
  var contenedor = document.getElementById('confirmDetalle');

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = '';

  function fila(etiqueta, valor) {
    if (!valor) {
      return;
    }

    var row = document.createElement('div');
    row.className = 'confirm-detalle-fila';

    var a = document.createElement('span');
    a.textContent = etiqueta;

    var b = document.createElement('strong');
    b.textContent = String(valor);

    row.appendChild(a);
    row.appendChild(b);
    contenedor.appendChild(row);
  }

  fila('Entrega', pedido.entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en el local');

  if (pedido.direccion_envio) {
    fila('Dirección', pedido.direccion_envio);
  }

  fila('Método de pago', nombreMetodoPago(pedido.metodo_pago));
  fila('Detalle del pago', pedido.pago_metodo);
  fila('Estado del pago', estadoPagoTexto(pedido));
  fila('Proveedor del pago', nombreProveedorPago(pedido.pago_proveedor));
  fila('Este pago incluye', nombreGrupoPago(pedido.pago_grupo));

  if (String(pedido.metodo_pago || '').toLowerCase() === 'efectivo' && pedido.pago_referencia) {
    fila('Cupón de pago', pedido.pago_referencia);
  } else if (pedido.pago_referencia) {
    fila('Referencia de pago', pedido.pago_referencia);
  }

  if (turnos.length) {
    var t = document.createElement('div');
    t.className = 'confirm-detalle-fila';

    var a = document.createElement('span');
    a.textContent = 'Turnos';

    var b = document.createElement('strong');
    b.textContent = turnos
      .map(function (x) {
        return formatoFechaTurno(x.fecha) + ' · ' + String(x.horario || '').slice(0, 5) + ' hs';
      })
      .join(' · ');

    t.appendChild(a);
    t.appendChild(b);
    contenedor.appendChild(t);
  }

  agregarSimulacionPago(contenedor, pedido);
}

function agregarSimulacionPago(contenedor, pedido) {
  if (!esPagoSimulado(pedido)) {
    return;
  }

  var metodo = String(pedido.metodo_pago || '').toLowerCase();
  var referencia = String(pedido.pago_referencia || '');
  var caja = document.createElement('div');
  caja.className = 'confirm-sim-box';

  var titulo = document.createElement('strong');
  titulo.textContent = 'Pago en modo demostración';
  caja.appendChild(titulo);

  var texto = document.createElement('p');

  if (metodo === 'transferencia_qr') {
    texto.textContent = 'Este QR es demostrativo y no permite transferir dinero. La referencia sirve para probar el seguimiento del pedido.';
    caja.appendChild(texto);

    if (referencia) {
      caja.appendChild(crearQrDemostrativo(referencia));
    }
  } else if (metodo === 'efectivo') {
    texto.textContent = 'Cupón demostrativo para Pago Fácil o RapiPago. No es válido para abonar en una sucursal real.';
    caja.appendChild(texto);

    var cupon = document.createElement('div');
    cupon.className = 'confirm-cupon-sim';
    cupon.textContent = referencia || 'SEND-DEMO';
    caja.appendChild(cupon);
  } else {
    texto.textContent = 'La billetera virtual se simuló correctamente. No se abrió una cuenta real ni se debitó dinero.';
    caja.appendChild(texto);
  }

  contenedor.appendChild(caja);
}

function crearQrDemostrativo(referencia) {
  var envoltura = document.createElement('div');
  envoltura.className = 'confirm-qr-sim';

  var grid = document.createElement('div');
  grid.className = 'confirm-qr-grid';
  grid.setAttribute('role', 'img');
  grid.setAttribute('aria-label', 'QR demostrativo de pago, no escaneable');

  var semilla = 0;

  for (var i = 0; i < referencia.length; i += 1) {
    semilla = (semilla + referencia.charCodeAt(i) * (i + 3)) % 997;
  }

  for (var y = 0; y < 21; y += 1) {
    for (var x = 0; x < 21; x += 1) {
      var celda = document.createElement('span');
      var zonaFinder =
        (x < 7 && y < 7) ||
        (x > 13 && y < 7) ||
        (x < 7 && y > 13);
      var oscuro = false;

      if (zonaFinder) {
        var lx = x > 13 ? x - 14 : x;
        var ly = y > 13 ? y - 14 : y;
        var borde = lx === 0 || lx === 6 || ly === 0 || ly === 6;
        var centro = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        oscuro = borde || centro;
      } else {
        oscuro = ((x * 17 + y * 31 + semilla) % 7) < 3;
      }

      celda.className = oscuro ? 'is-dark' : '';
      grid.appendChild(celda);
    }
  }

  envoltura.appendChild(grid);

  var leyenda = document.createElement('small');
  leyenda.textContent = 'QR demostrativo';
  envoltura.appendChild(leyenda);

  return envoltura;
}

function nombreProveedorPago(proveedor) {
  var valor = String(proveedor || '').trim().toLowerCase();

  if (valor === 'mercadopago') {
    return 'Mercado Pago';
  }

  if (valor === 'manual') {
    return 'Gestión manual del local';
  }

  if (valor === 'tarjeta') {
    return 'Tarjeta';
  }

  if (valor === 'simulacion') {
    return 'Simulación local';
  }

  if (valor === 'simulacion_qr') {
    return 'QR simulado';
  }

  if (valor === 'simulacion_efectivo') {
    return 'Cupón simulado';
  }

  return proveedor || '';
}

function estadoPagoTexto(pedido) {
  var estado = String(pedido.pago_estado || 'pendiente').toLowerCase();
  var metodo = String(pedido.metodo_pago || '').toLowerCase();

  if (estado === 'simulado') {
    return 'Pago simulado aprobado (demostración)';
  }

  if (estado === 'aprobado') {
    return 'Pago acreditado';
  }

  if (estado === 'en_proceso') {
    return 'Pago en proceso';
  }

  if (estado === 'rechazado') {
    return 'Pago rechazado';
  }

  if (estado === 'cancelado') {
    return 'Pago cancelado';
  }

  if (estado === 'reembolsado') {
    return 'Pago reembolsado';
  }

  if (estado === 'revisar' || estado === 'error') {
    return 'Pago a revisar con el local';
  }

  if (esPagoSimulado(pedido)) {
    return 'Pago simulado pendiente (demostración)';
  }

  if (metodo === 'mercadopago') {
    return 'Pendiente de acreditación en Mercado Pago';
  }

  return 'Pendiente de coordinación con el local';
}

function nombreMetodoPago(metodo) {
  var raw = String(metodo || '').trim();
  var m = raw.toLowerCase();

  if (m === 'transferencia') {
    return 'Transferencia';
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
    return 'Billetera virtual (simulación)';
  }

  if (m === 'transferencia_qr') {
    return 'Transferencia con QR (simulación)';
  }

  if (m === 'efectivo') {
    return 'Efectivo en red · cupón (simulación)';
  }

  /* Pedidos legacy con tarjetas guardadas como "visa ****1234": solo se
     muestra la marca y los últimos 4 dígitos. El checkout nuevo no pide
     datos de tarjeta. */
  var partes = raw.split('****');
  var marca = String(partes[0] || '').trim().toLowerCase();
  var ultimos = partes[1] ? String(partes[1]).replace(/\D/g, '') : '';

  var marcas = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    cabal: 'Cabal',
    naranja_x: 'Naranja X',
    amex: 'American Express'
  };

  if (marcas[marca]) {
    return marcas[marca] + (ultimos ? ' (terminación ' + ultimos + ')' : '');
  }

  if (!raw) {
    return 'Transferencia';
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function nombreGrupoPago(grupo) {
  var g = String(grupo || '').toLowerCase();

  if (g === 'servicios') {
    return 'Solo servicios';
  }

  if (g === 'productos') {
    return 'Solo productos';
  }

  return 'Todo junto';
}

function configurarWhatsApp(pedido, items, turnos, total) {
  var contenedor = document.getElementById('confirmWa');
  var boton = document.getElementById('btnWaConfirm');

  if (!contenedor || !boton) {
    return;
  }

  var sesion =
    typeof window.getSesion === 'function' ? window.getSesion() : null;

  var nombre = sesion
    ? [sesion.nombre, sesion.apellido].filter(Boolean).join(' ')
    : 'Cliente';

  var pedidoId = Number(pedido.id || 0);
  var numero = pedidoId
    ? '#' + String(pedidoId).padStart(6, '0')
    : 'mi pedido';

  var lista = items
    .map(function (item) {
      var cantidad = Math.max(1, Number(item.cantidad) || 1);
      var precio = Number(item.precio) || 0;

      return (
        '• ' +
        String(item.nombre || 'Producto') +
        ' x' +
        cantidad +
        ' — ' +
        formatoConfirmPrecio(precio * cantidad)
      );
    })
    .join('\n');

  var mensaje = [
    'Hola! Soy ' + (nombre || 'Cliente') + '.',
    'Realicé el pedido ' + numero + ':',
    '',
    lista || 'Sin detalle',
    '',
    'Total: ' + formatoConfirmPrecio(total),
    'Pago: ' + nombreMetodoPago(pedido.metodo_pago) + ' (' + nombreGrupoPago(pedido.pago_grupo) + ')',
    '',
    '¿Me avisás cuando esté listo? ¡Gracias!'
  ].join('\n');

  boton.href =
    'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensaje);

  contenedor.classList.remove('hidden');
}

function ocultarWhatsApp() {
  var contenedor = document.getElementById('confirmWa');

  if (contenedor) {
    contenedor.classList.add('hidden');
  }
}

function formatoConfirmPrecio(valor) {
  if (typeof window.formatoPrecio === 'function') {
    return window.formatoPrecio(Number(valor) || 0);
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
}
