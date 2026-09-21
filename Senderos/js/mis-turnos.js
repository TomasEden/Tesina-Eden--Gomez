/* ═══════════════════════════════════════
   Senderos — mis-turnos.js
   Turnos y pedidos reales del usuario.
   ═══════════════════════════════════════ */

var API_TURNOS = '../api/turnos.php';
var API_PEDIDOS = '../api/pedidos.php';
var WHATSAPP_NUMERO = '5493571616113';

var turnosData = [];
var pedidosData = [];
var filtroActivo = 'todos';
var cancelarTurnoId = null;
var cancelarPedidoId = null;

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  if (
    typeof window.requireSesionPage === 'function' &&
    !window.requireSesionPage()
  ) {
    return;
  }

  cablearTabs();
  cargarTurnos();
  cargarPedidos();

  var navbar = document.getElementById('navbar');

  if (navbar) {
    var alScrollear = function () {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    };

    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
  }
});

function cablearTabs() {
  document.querySelectorAll('.main-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      cambiarMainTab(btn);
    });
  });

  document.querySelectorAll('.filter-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      cambiarFiltro(btn);
    });
  });

  var btnVolver = document.getElementById('btnModalVolver');

  if (btnVolver) {
    btnVolver.addEventListener('click', cerrarModalCancelar);
  }

  var btnConfirmar = document.getElementById('btnModalConfirmar');

  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', confirmarCancelar);
  }
}

function cambiarMainTab(btn) {
  if (!btn) {
    return;
  }

  var tabId = btn.dataset.tab;

  document.querySelectorAll('.main-tab').forEach(function (tab) {
    var activo = tab === btn;
    tab.classList.toggle('active', activo);
    tab.setAttribute('aria-selected', String(activo));
  });

  document.querySelectorAll('.tab-panel').forEach(function (panel) {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

function cambiarFiltro(btn) {
  if (!btn) {
    return;
  }

  filtroActivo = btn.dataset.estado || 'todos';

  document.querySelectorAll('.filter-tab').forEach(function (tab) {
    tab.classList.toggle('active', tab === btn);
  });

  renderTurnos();
}

/* ───────── TURNOS ───────── */

function cargarTurnos() {
  fetch(API_TURNOS + '?propios=1', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          throw new Error(data.error || data.mensaje || 'No se pudieron cargar los turnos.');
        }

        return data.turnos;
      });
    })
    .then(function (turnos) {
      turnosData = Array.isArray(turnos) ? turnos : [];
      renderTurnos();
      actualizarBadges();
    })
    .catch(function () {
      turnosData = [];
      renderTurnos();

      if (typeof window.showToast === 'function') {
        window.showToast('No pudimos mostrar tus turnos en este momento.');
      } else if (typeof window.mostrarErrorConexion === 'function') {
        window.mostrarErrorConexion(cargarTurnos);
      }
    });
}

function renderTurnos() {
  var lista = document.getElementById('turnosList');
  var empty = document.getElementById('turnosEmpty');

  if (!lista || !empty) {
    return;
  }

  lista.innerHTML = '';

  var turnos = turnosData.slice();

  if (filtroActivo !== 'todos') {
    turnos = turnos.filter(function (turno) {
      return String(turno.estado || '').toLowerCase() === filtroActivo;
    });
  }

  turnos.sort(function (a, b) {
    return (
      new Date(String(a.fecha) + 'T' + String(a.horario || '00:00')) -
      new Date(String(b.fecha) + 'T' + String(b.horario || '00:00'))
    );
  });

  if (!turnos.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  turnos.forEach(function (turno, index) {
    lista.appendChild(crearTurnoCard(turno, index));
  });
}

function nombreServicioTurno(turno) {
  try {
    var servs = JSON.parse(String(turno.servicios || ''));
    if (Array.isArray(servs) && servs.length) {
      return servs.map(function (s) { return String(s.nombre || ''); }).filter(Boolean).join(' + ') || 'Servicio';
    }
  } catch (e) {}

  return String(turno.servicios || 'Servicio');
}

function crearTurnoCard(turno, index) {
  var card = document.createElement('article');
  var estado = String(turno.estado || 'pendiente').toLowerCase();

  card.className = 'turno-card ' + escapeClass(estado);
  card.style.animationDelay = index * 0.06 + 's';

  var fecha = parseFecha(turno.fecha);
  var dia = fecha ? String(fecha.getDate()) : '—';
  var mes = fecha
    ? fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
    : '—';
  var fechaLarga = fecha
    ? fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : String(turno.fecha || 'Fecha no disponible');

  var servicio = nombreServicioTurno(turno);
  var precio = Number(turno.precio_total) || 0;

  var estadoLabel =
    { pendiente: 'Pendiente', confirmado: 'Confirmado', cancelado: 'Cancelado' }[estado] ||
    estado;

  var bloqueFecha = document.createElement('div');
  bloqueFecha.className = 'turno-fecha-block';

  var diaEl = document.createElement('div');
  diaEl.className = 'turno-dia';
  diaEl.textContent = dia;

  var mesEl = document.createElement('div');
  mesEl.className = 'turno-mes';
  mesEl.textContent = mes;

  bloqueFecha.appendChild(diaEl);
  bloqueFecha.appendChild(mesEl);
  card.appendChild(bloqueFecha);

  var info = document.createElement('div');
  info.className = 'turno-info';

  var nombre = document.createElement('div');
  nombre.className = 'turno-nombre';
  nombre.textContent = servicio;
  info.appendChild(nombre);

  var meta = document.createElement('div');
  meta.className = 'turno-meta';

  meta.appendChild(metaItem('../img/icons/calendario.svg', fechaLarga));
  meta.appendChild(metaItem('../img/icons/tiempo.svg', String(turno.horario || '—').slice(0, 5) + ' hs'));

  if (turno.duracion_total) {
    var d = document.createElement('span');
    d.textContent = String(turno.duracion_total) + ' min';
    meta.appendChild(d);
  }

  var p = document.createElement('span');
  p.textContent = formatoPrecioLocal(precio);
  meta.appendChild(p);

  info.appendChild(meta);
  card.appendChild(info);

  var acciones = document.createElement('div');
  acciones.className = 'turno-actions';

  var badge = document.createElement('span');
  badge.className = 'badge badge-' + escapeClass(estado);
  badge.textContent = estadoLabel;
  acciones.appendChild(badge);

  var pasado = fecha ? fecha < inicioDelDia() : false;

  if (!pasado && estado !== 'cancelado') {
    var whatsapp = document.createElement('a');
    whatsapp.className = 'btn-wa';
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
    whatsapp.textContent = 'WhatsApp';
    whatsapp.href = crearLinkWhatsApp(
      ['Hola! Quiero consultar sobre mi turno:', '', servicio, fechaLarga + ' a las ' + String(turno.horario || '—').slice(0, 5) + ' hs'].join('\n')
    );
    acciones.appendChild(whatsapp);

    var cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'btn-cancelar';
    cancelar.textContent = 'Cancelar';
    cancelar.addEventListener('click', function () {
      abrirModalCancelarTurno(Number(turno.id));
    });
    acciones.appendChild(cancelar);
  }

  card.appendChild(acciones);

  return card;
}

function metaItem(icono, texto) {
  var s = document.createElement('span');
  var img = document.createElement('img');
  img.src = icono;
  img.alt = '';
  img.width = 13;
  img.height = 13;
  s.appendChild(img);
  s.appendChild(document.createTextNode(' ' + texto));
  return s;
}

function abrirModalCancelarTurno(id) {
  cancelarTurnoId = Number(id);
  cancelarPedidoId = null;

  var titulo = document.getElementById('modalCancelarTitulo');
  var desc = document.querySelector('#modalCancelar .modal-desc');

  if (titulo) {
    titulo.textContent = '¿Cancelar turno?';
  }

  if (desc) {
    desc.textContent = 'Si faltan más de 24 hs lo cancelamos enseguida. Si falta menos, escribinos por WhatsApp y lo vemos.';
  }

  mostrarModalCancelar();
}

function abrirModalCancelarPedido(id) {
  cancelarPedidoId = Number(id);
  cancelarTurnoId = null;

  var titulo = document.getElementById('modalCancelarTitulo');
  var desc = document.querySelector('#modalCancelar .modal-desc');

  if (titulo) {
    titulo.textContent = '¿Cancelar pedido?';
  }

  if (desc) {
    desc.textContent = 'Se cancela el pedido pendiente, se repone el stock y se cancelan sus turnos. Esta acción no se puede deshacer.';
  }

  mostrarModalCancelar();
}

function mostrarModalCancelar() {
  var modal = document.getElementById('modalCancelar');

  if (modal) {
    modal.classList.remove('hidden');
  }
}

function cerrarModalCancelar() {
  var modal = document.getElementById('modalCancelar');

  if (modal) {
    modal.classList.add('hidden');
  }

  cancelarTurnoId = null;
  cancelarPedidoId = null;
}

function confirmarCancelar() {
  if (cancelarPedidoId) {
    confirmarCancelarPedido();
    return;
  }

  if (cancelarTurnoId) {
    confirmarCancelarTurno();
  }
}

function confirmarCancelarTurno() {
  if (!cancelarTurnoId) {
    return;
  }

  fetch(API_TURNOS, {
    method: 'PUT',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: cancelarTurnoId, estado: 'cancelado' })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          var error = new Error(data.error || data.mensaje || 'No se pudo cancelar el turno.');
          error.consultarWhatsApp = Boolean(data.consultarWhatsApp);
          error.codigo = respuesta.status;
          throw error;
        }
      });
    })
    .then(function () {
      cerrarModalCancelar();

      if (typeof window.showToast === 'function') {
        window.showToast('Turno cancelado correctamente.');
      }

      return cargarTurnos();
    })
    .catch(function (error) {
      cerrarModalCancelar();

      if (error.consultarWhatsApp) {
        if (typeof window.mostrarModalValidacion === 'function') {
          window.mostrarModalValidacion({
            titulo: 'Falta menos de 24 hs',
            mensaje: 'Ya falta menos de 24 hs para tu turno. Escribinos por WhatsApp y lo vemos.',
            icono: 'advertencia.svg',
            botones: [
              { texto: 'Volver', clase: 'outline' },
              {
                texto: 'Consultar por WhatsApp',
                clase: 'primary',
                accion: function () {
                  window.cerrarModalValidacion();
                  window.open(
                    crearLinkWhatsApp('Hola! Quiero consultar sobre mi turno.'),
                    '_blank',
                    'noopener'
                  );
                }
              }
            ]
          });
          return;
        }
      }

      if (typeof window.showToast === 'function') {
        window.showToast(error.message || 'No se pudo cancelar el turno.');
      }
    });
}

/* ───────── PEDIDOS ───────── */

function cargarPedidos() {
  fetch(API_PEDIDOS + '?propios=1', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          throw new Error(data.error || data.mensaje || 'No se pudieron cargar los pedidos.');
        }

        return data.pedidos;
      });
    })
    .then(function (pedidos) {
      pedidosData = Array.isArray(pedidos) ? pedidos : [];
      renderPedidos();
      actualizarBadges();
    })
    .catch(function () {
      pedidosData = [];
      renderPedidos();

      if (typeof window.showToast === 'function') {
        window.showToast('No pudimos mostrar tus pedidos en este momento.');
      }
    });
}

function renderPedidos() {
  var lista = document.getElementById('pedidosList');
  var empty = document.getElementById('pedidosEmpty');

  if (!lista || !empty) {
    return;
  }

  lista.innerHTML = '';

  var pedidos = pedidosData.slice().sort(function (a, b) {
    return new Date(b.creado_en) - new Date(a.creado_en);
  });

  if (!pedidos.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  pedidos.forEach(function (pedido, index) {
    lista.appendChild(crearPedidoCard(pedido, index));
  });
}

var ESTADO_PEDIDO_LABEL = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  preparado: 'Preparado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
};

function crearPedidoCard(pedido, index) {
  var card = document.createElement('article');
  card.className = 'pedido-card';
  card.style.animationDelay = index * 0.06 + 's';

  /* En "Mis pedidos" se muestran solo productos; los servicios
     están en la pestaña Turnos. */
  var todos = Array.isArray(pedido.items) ? pedido.items : [];
  var items = todos.filter(function (item) {
    return String(item.tipo || 'producto') === 'producto';
  });
  var nServicios = todos.length - items.length;
  var estado = String(pedido.estado || 'pendiente').toLowerCase();
  var total = Number(pedido.total) || 0;

  var header = document.createElement('div');
  header.className = 'pedido-header';

  var left = document.createElement('div');
  var idEl = document.createElement('div');
  idEl.className = 'pedido-id';
  idEl.textContent = 'Pedido #' + String(pedido.id || '').padStart(6, '0');

  var fechaEl = document.createElement('div');
  fechaEl.className = 'pedido-fecha';
  fechaEl.textContent = formatFechaCorta(pedido.creado_en);

  left.appendChild(idEl);
  left.appendChild(fechaEl);
  header.appendChild(left);

  var badge = document.createElement('span');
  badge.className = 'badge badge-' + escapeClass(estado);
  badge.textContent = ESTADO_PEDIDO_LABEL[estado] || estado;
  header.appendChild(badge);

  card.appendChild(header);

  var extra = document.createElement('div');
  extra.className = 'pedido-extra';

  if (pedido.entrega) {
    var e = document.createElement('p');
    e.textContent =
      'Entrega: ' + (pedido.entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en el local');
    extra.appendChild(e);
  }

  if (pedido.direccion_envio) {
    var d = document.createElement('p');
    d.textContent = 'Dirección: ' + String(pedido.direccion_envio);
    extra.appendChild(d);
  }

  if (pedido.metodo_pago) {
    var m = document.createElement('p');
    m.textContent = 'Pago: ' + nombreMetodo(pedido.metodo_pago) + ' (' + nombreGrupo(pedido.pago_grupo) + ')';
    extra.appendChild(m);
  }

  if (nServicios > 0) {
    var s = document.createElement('p');
    s.textContent =
      'Además incluye ' + nServicios + (nServicios === 1 ? ' servicio' : ' servicios') + ' (ver en Turnos).';
    extra.appendChild(s);
  }

  if (extra.childNodes.length) {
    card.appendChild(extra);
  }

  var itemsBox = document.createElement('div');
  itemsBox.className = 'pedido-items';

  if (!items.length) {
    var sin = document.createElement('p');
    sin.className = 'pedido-sin-items';
    sin.textContent = 'Sin detalle de productos.';
    itemsBox.appendChild(sin);
  } else {
    items.forEach(function (item) {
      var cantidad = Number(item.cantidad) || 1;
      var precio = Number(item.precio) || 0;

      var fila = document.createElement('div');
      fila.className = 'pedido-item';

      var n = document.createElement('span');
      n.className = 'pedido-item-name';
      n.textContent = String(item.nombre || 'Producto') + (precio === 0 ? ' (gratis)' : '');

      var q = document.createElement('span');
      q.className = 'pedido-item-qty';
      q.textContent = 'x' + cantidad;

      var pr = document.createElement('span');
      pr.className = 'pedido-item-price';
      pr.textContent = formatoPrecioLocal(precio * cantidad);

      fila.appendChild(n);
      fila.appendChild(q);
      fila.appendChild(pr);
      itemsBox.appendChild(fila);
    });
  }

  card.appendChild(itemsBox);

  var footer = document.createElement('div');
  footer.className = 'pedido-footer';

  var totalEl = document.createElement('span');
  totalEl.className = 'pedido-total';

  var tLabel = document.createElement('span');
  tLabel.textContent = 'Total ';

  totalEl.appendChild(tLabel);
  totalEl.appendChild(document.createTextNode(formatoPrecioLocal(total)));
  footer.appendChild(totalEl);

  if (estado === 'pendiente') {
    var cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'btn-cancelar';
    cancelar.textContent = 'Cancelar pedido';
    cancelar.addEventListener('click', function () {
      abrirModalCancelarPedido(Number(pedido.id));
    });
    footer.appendChild(cancelar);

    var wa = document.createElement('a');
    wa.className = 'btn-wa';
    wa.target = '_blank';
    wa.rel = 'noopener noreferrer';
    wa.textContent = 'Consultar estado';
    wa.href = crearLinkWhatsApp(
      ['Hola! Quiero consultar el estado de mi pedido #' + String(pedido.id || '').padStart(6, '0') + ':', '', 'Total: ' + formatoPrecioLocal(total)].join('\n')
    );
    footer.appendChild(wa);
  }

  if (estado === 'entregado') {
    var productosPedido = items.filter(function (item) {
      return String(item.tipo || 'producto') === 'producto' && Number(item.producto_id) > 0;
    });

    if (productosPedido.length) {
      var resenar = document.createElement('a');
      resenar.className = 'btn-resenar';
      resenar.textContent = 'Dejar reseña';
      resenar.href =
        'productos.html?id=' + encodeURIComponent(String(productosPedido[0].producto_id));
      footer.appendChild(resenar);
    }

    if (dentroDe48h(pedido.creado_en || pedido.actualizado_en)) {
      var queja = document.createElement('a');
      queja.className = 'btn-wa';
      queja.target = '_blank';
      queja.rel = 'noopener noreferrer';
      queja.textContent = 'Tuve un inconveniente';
      queja.href = crearLinkWhatsApp(
        'Hola! Tuve un inconveniente con mi pedido #' +
          String(pedido.id || '').padStart(6, '0') +
          ' (entregado). ¿Me ayudan? ¡Gracias!'
      );
      footer.appendChild(queja);
    }
  }

  card.appendChild(footer);

  return card;
}

function confirmarCancelarPedido() {
  if (!cancelarPedidoId) {
    return;
  }

  fetch(API_PEDIDOS, {
    method: 'PUT',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: cancelarPedidoId, estado: 'cancelado' })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          throw new Error(data.error || data.mensaje || 'No se pudo cancelar el pedido.');
        }
      });
    })
    .then(function () {
      cerrarModalCancelar();

      if (typeof window.showToast === 'function') {
        window.showToast('Pedido cancelado correctamente.');
      }

      cargarPedidos();
      cargarTurnos();
    })
    .catch(function (error) {
      cerrarModalCancelar();

      if (typeof window.showToast === 'function') {
        window.showToast(error.message || 'No se pudo cancelar el pedido.');
      }
    });
}

function nombreMetodo(metodo) {
  var m = String(metodo || '').toLowerCase();
  if (m === 'transferencia') {
    return 'Transferencia';
  }
  if (m === 'debito') {
    return 'Débito';
  }
  return 'Transferencia';
}

function nombreGrupo(grupo) {
  var g = String(grupo || '').toLowerCase();

  if (g === 'servicios') {
    return 'solo servicios';
  }

  if (g === 'productos') {
    return 'solo productos';
  }

  return 'todo junto';
}

/* ───────── BADGES ───────── */

function actualizarBadges() {
  var badgeTurnos = document.getElementById('badgeTurnos');
  var badgePedidos = document.getElementById('badgePedidos');

  if (badgeTurnos) {
    badgeTurnos.textContent = String(turnosData.length);
  }

  if (badgePedidos) {
    badgePedidos.textContent = String(pedidosData.length);
  }
}

/* ───────── UTILS ───────── */

function parseFecha(fecha) {
  if (!fecha) {
    return null;
  }

  var resultado = new Date(String(fecha) + 'T00:00:00');

  return Number.isNaN(resultado.getTime()) ? null : resultado;
}

function inicioDelDia() {
  var ahora = new Date();
  ahora.setHours(0, 0, 0, 0);
  return ahora;
}

function formatFechaCorta(fechaStr) {
  if (!fechaStr) {
    return '—';
  }

  var fecha = new Date(fechaStr);

  if (Number.isNaN(fecha.getTime())) {
    return String(fechaStr);
  }

  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dentroDe48h(fechaStr) {
  if (!fechaStr) {
    return false;
  }

  var fecha = new Date(String(fechaStr).replace(' ', 'T'));

  if (Number.isNaN(fecha.getTime())) {
    return false;
  }

  return Date.now() - fecha.getTime() <= 48 * 3600 * 1000;
}

function crearLinkWhatsApp(mensaje) {
  return 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensaje);
}

function formatoPrecioLocal(valor) {
  if (typeof window.formatoPrecio === 'function') {
    return window.formatoPrecio(Number(valor) || 0);
  }

  return '$' + Number(valor || 0).toLocaleString('es-AR');
}

function escapeClass(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    var modal = document.getElementById('modalCancelar');

    if (modal && !modal.classList.contains('hidden')) {
      cerrarModalCancelar();
    }
  }
});
