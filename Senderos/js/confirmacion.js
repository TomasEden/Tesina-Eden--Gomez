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
  fila('Este pago incluye', nombreGrupoPago(pedido.pago_grupo));

  if (turnos.length) {
    var t = document.createElement('div');
    t.className = 'confirm-detalle-fila';

    var a = document.createElement('span');
    a.textContent = 'Turnos';

    var b = document.createElement('strong');
    b.textContent = turnos
      .map(function (x) {
        return String(x.fecha || '') + ' ' + String(x.horario || '').slice(0, 5);
      })
      .join(' · ');

    t.appendChild(a);
    t.appendChild(b);
    contenedor.appendChild(t);
  }
}

function nombreMetodoPago(metodo) {
  var raw = String(metodo || '').trim();
  var m = raw.toLowerCase();

  if (m === 'transferencia') {
    return 'Transferencia';
  }

  if (m === 'debito') {
    return 'Débito';
  }

  /* Tarjetas guardadas como "visa ****1234": solo se muestra la marca
     y los últimos 4 dígitos. */
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
