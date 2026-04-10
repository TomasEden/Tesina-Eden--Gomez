/* SPA M - turnos.js */

var SERVICIOS = [
  { id:'masaje',       nombre:'Masaje Relajante',   duracionMin:60, precio:5000, img:'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=300&q=80' },
  { id:'facial',       nombre:'Tratamiento Facial',  duracionMin:30, precio:3000, img:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80' },
  { id:'jacuzzi',      nombre:'Jacuzzi Privado',     duracionMin:80, precio:5000, img:'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=300&q=80' },
  { id:'unas',         nombre:'Manicura & Pedicura', duracionMin:45, precio:2500, img:'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80' },
  { id:'depilacion',   nombre:'Depilacion',          duracionMin:40, precio:2000, img:'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300&q=80' },
  { id:'aromaterapia', nombre:'Aromaterapia',        duracionMin:50, precio:4000, img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80' }
];

var SLOTS_DIA = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00'
];

var estado = { servicios: [], fecha: null, horario: null };
var calFecha = new Date();

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  renderServicios();
  renderCalendario();

  // Pre-seleccionar servicio desde URL ?servicio=masaje
  var params = new URLSearchParams(window.location.search);
  var servicioId = params.get('servicio');
  if (servicioId) {
    var s = SERVICIOS.find(function(x) { return x.id === servicioId; });
    if (s) {
      setTimeout(function() {
        var btn = document.querySelector('.servicio-btn[data-id="' + servicioId + '"]');
        if (btn) toggleServicio(s, btn);
        var card = document.getElementById('card-servicio');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  var overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  }

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

// ── Duración y precio totales ────────────────────────────────────────────────
function duracionTotal() {
  return estado.servicios.reduce(function(sum, s) { return sum + s.duracionMin; }, 0);
}

function formatearDuracion(min) {
  if (min < 60) return min + ' min';
  var h = Math.floor(min / 60);
  var m = min % 60;
  return m === 0 ? h + ' h' : h + ' h ' + m + ' min';
}

function precioTotal() {
  return estado.servicios.reduce(function(sum, s) { return sum + s.precio; }, 0);
}

// ── Render servicios (selección múltiple) ────────────────────────────────────
function renderServicios() {
  var grid = document.getElementById('serviciosGrid');
  if (!grid) return;
  grid.innerHTML = '';

  var hint = document.createElement('p');
  hint.className = 'servicios-hint';
  hint.textContent = 'Podes elegir mas de uno';
  grid.appendChild(hint);

  SERVICIOS.forEach(function(s) {
    var btn = document.createElement('button');
    btn.className = 'servicio-btn';
    btn.dataset.id = s.id;
    btn.innerHTML =
      '<div class="servicio-check">&#10003;</div>' +
      '<img src="' + s.img + '" alt="' + s.nombre + '"/>' +
      '<span class="servicio-btn-name">' + s.nombre + '</span>' +
      '<div class="servicio-btn-meta">' +
        '<span>&#9201; ' + formatearDuracion(s.duracionMin) + '</span>' +
        '<span class="servicio-btn-price">$' + s.precio.toLocaleString() + '</span>' +
      '</div>';
    btn.addEventListener('click', function() { toggleServicio(s, btn); });
    grid.appendChild(btn);
  });
}

function toggleServicio(s, btn) {
  var idx = estado.servicios.findIndex(function(x) { return x.id === s.id; });
  if (idx === -1) {
    estado.servicios.push(s);
    btn.classList.add('selected');
    showToast(s.nombre + ' agregado');
  } else {
    estado.servicios.splice(idx, 1);
    btn.classList.remove('selected');
    showToast(s.nombre + ' quitado');
  }

  if (estado.servicios.length > 0) {
    document.getElementById('card-fecha').classList.remove('dimmed');
  } else {
    document.getElementById('card-fecha').classList.add('dimmed');
    document.getElementById('card-horario').classList.add('dimmed');
    estado.fecha   = null;
    estado.horario = null;
  }

  actualizarResumen();
  if (estado.fecha) renderHorarios();
}

// ── Calendario ───────────────────────────────────────────────────────────────
function cambiarMes(dir) {
  calFecha.setMonth(calFecha.getMonth() + dir);
  renderCalendario();
}

function renderCalendario() {
  var hoy      = new Date();
  var year     = calFecha.getFullYear();
  var month    = calFecha.getMonth();
  var primerDia = new Date(year, month, 1).getDay();
  var diasMes  = new Date(year, month + 1, 0).getDate();

  document.getElementById('calMonth').textContent =
    calFecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  var container = document.getElementById('calDays');
  container.innerHTML = '';

  for (var i = 0; i < primerDia; i++) {
    var empty = document.createElement('div');
    empty.className = 'cal-day empty';
    container.appendChild(empty);
  }

  for (var d = 1; d <= diasMes; d++) {
    var fechaBtn = new Date(year, month, d);
    var div = document.createElement('div');
    div.className = 'cal-day';
    div.textContent = d;

    var esHoy    = fechaBtn.toDateString() === hoy.toDateString();
    var esPasado = fechaBtn < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    var esDomingo = fechaBtn.getDay() === 0;
    var esSelec  = estado.fecha && fechaBtn.toDateString() === estado.fecha.toDateString();

    if (esHoy)              div.classList.add('today');
    if (esPasado || esDomingo) div.classList.add('disabled');
    if (esSelec)            div.classList.add('selected');

    if (!esPasado && !esDomingo) {
      (function(fecha) {
        div.addEventListener('click', function() { seleccionarFecha(fecha); });
      })(fechaBtn);
    }
    container.appendChild(div);
  }
}

function seleccionarFecha(fecha) {
  if (!estado.servicios.length) return;
  estado.fecha   = fecha;
  estado.horario = null;
  renderCalendario();
  renderHorarios();
  document.getElementById('card-horario').classList.remove('dimmed');
  actualizarResumen();
}

// ── Horarios bloqueados reales ────────────────────────────────────────────────
function slotAMinutos(hora) {
  var parts = hora.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function getHorariosOcupados(fecha) {
  var turnos = JSON.parse(localStorage.getItem('turnos')) || [];
  var fechaStr = fecha.toDateString();
  var ocupados = {};
  turnos.forEach(function(t) {
    if (t.estado === 'cancelado') return;
    var tFecha = new Date(t.fecha);
    if (tFecha.toDateString() !== fechaStr) return;
    var durMin = t.duracionTotal || t.duracionMin || 60;
    var inicio = slotAMinutos(t.horario);
    var fin    = inicio + durMin;
    SLOTS_DIA.forEach(function(slot) {
      var slotMin = slotAMinutos(slot);
      if (slotMin >= inicio && slotMin < fin) ocupados[slot] = true;
    });
  });
  return ocupados;
}

function slotDisponible(slot, durNecesaria, ocupados) {
  if (ocupados[slot]) return false;
  var inicio = slotAMinutos(slot);
  var fin    = inicio + durNecesaria;
  if (fin > 1260) return false; // 21:00
  for (var i = 0; i < SLOTS_DIA.length; i++) {
    var s = SLOTS_DIA[i];
    var sMin = slotAMinutos(s);
    if (sMin > inicio && sMin < fin && ocupados[s]) return false;
  }
  return true;
}

function renderHorarios() {
  var grid = document.getElementById('horariosGrid');
  grid.innerHTML = '';

  var durNecesaria = duracionTotal();
  var ocupados     = getHorariosOcupados(estado.fecha);

  var sub = document.createElement('p');
  sub.className = 'horarios-hint';
  sub.textContent = 'Tu reserva ocupa ' + formatearDuracion(durNecesaria) + ' en total';
  grid.appendChild(sub);

  SLOTS_DIA.forEach(function(hora) {
    var disponible = slotDisponible(hora, durNecesaria, ocupados);
    var btn = document.createElement('button');
    btn.className = 'horario-btn' + (!disponible ? ' ocupado' : '');
    btn.textContent = hora;
    btn.disabled = !disponible;
    if (disponible) {
      (function(h, b) {
        b.addEventListener('click', function() { seleccionarHorario(h, b); });
      })(hora, btn);
    }
    grid.appendChild(btn);
  });
}

function seleccionarHorario(hora, btn) {
  estado.horario = hora;
  document.querySelectorAll('.horario-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  actualizarResumen();
}

// ── Resumen ───────────────────────────────────────────────────────────────────
function actualizarResumen() {
  var empty   = document.getElementById('summaryEmpty');
  var details = document.getElementById('summaryDetails');
  var btnRes  = document.getElementById('btnReservar');
  var waWrap  = document.getElementById('waToggleWrap');
  var completo = estado.servicios.length > 0 && estado.fecha && estado.horario;

  if (estado.servicios.length > 0) {
    empty.style.display = 'none';
    details.classList.remove('hidden');

    var listaHTML = estado.servicios.map(function(s) {
      return '<div class="sum-servicio-item">' +
        '<span>' + s.nombre + '</span>' +
        '<span>$' + s.precio.toLocaleString() + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('sum-servicio').innerHTML = listaHTML;
    document.getElementById('sum-duracion').textContent = formatearDuracion(duracionTotal()) + ' total';
    document.getElementById('sum-precio').textContent   = '$' + precioTotal().toLocaleString();
  } else {
    empty.style.display = '';
    details.classList.add('hidden');
  }

  if (estado.fecha) {
    document.getElementById('sum-fecha').textContent =
      estado.fecha.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
  }

  if (estado.horario) {
    var inicioMin = slotAMinutos(estado.horario);
    var finMin    = inicioMin + duracionTotal();
    var finH      = String(Math.floor(finMin / 60)).padStart(2, '0');
    var finM      = String(finMin % 60).padStart(2, '0');
    document.getElementById('sum-horario').textContent = estado.horario + ' -> ' + finH + ':' + finM + ' hs';
  }

  btnRes.disabled = !completo;
  if (waWrap) {
    if (completo) waWrap.classList.remove('hidden');
    else          waWrap.classList.add('hidden');
  }
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────
function generarLinkWhatsApp() {
  var tel    = '5493510000000';
  var sesion = getSesion ? getSesion() : null;
  var nombre = sesion ? sesion.nombre + ' ' + (sesion.apellido || '') : 'un cliente';
  var fecha  = estado.fecha.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });

  var listaServicios = estado.servicios.map(function(s) {
    return '  - ' + s.nombre + ' (' + formatearDuracion(s.duracionMin) + ') $' + s.precio.toLocaleString();
  }).join('\n');

  var finMin = slotAMinutos(estado.horario) + duracionTotal();
  var finH   = String(Math.floor(finMin / 60)).padStart(2, '0');
  var finM   = String(finMin % 60).padStart(2, '0');

  var mensaje =
    'Hola! Quiero confirmar mi turno\n\n' +
    'Nombre: ' + nombre + '\n' +
    'Fecha: ' + fecha + '\n' +
    'Horario: ' + estado.horario + ' -> ' + finH + ':' + finM + ' hs\n' +
    'Servicios:\n' + listaServicios + '\n' +
    'Duracion total: ' + formatearDuracion(duracionTotal()) + '\n' +
    'Total: $' + precioTotal().toLocaleString() + '\n\nMuchas gracias!';

  return 'https://wa.me/' + tel + '?text=' + encodeURIComponent(mensaje);
}

function toggleWaConfirm(checkbox) {
  if (checkbox.checked) {
    window.open(generarLinkWhatsApp(), '_blank');
  }
}

// ── Confirmar reserva ─────────────────────────────────────────────────────────
function confirmarReserva() {
  if (!requireSesion('reservar un turno')) return;
  if (!estado.servicios.length || !estado.fecha || !estado.horario) return;

  var turnos = JSON.parse(localStorage.getItem('turnos')) || [];
  estado.servicios.forEach(function(s) {
    turnos.push({
      id:            Date.now() + Math.random(),
      servicio:      s.nombre,
      duracionMin:   s.duracionMin,
      duracionTotal: duracionTotal(),
      precio:        s.precio,
      fecha:         estado.fecha.toISOString(),
      horario:       estado.horario,
      estado:        'pendiente',
      creadoEn:      new Date().toISOString()
    });
  });
  localStorage.setItem('turnos', JSON.stringify(turnos));

  // Agregar al carrito
  var carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  estado.servicios.forEach(function(s) {
    carrito.push({
      nombre:  s.nombre,
      precio:  s.precio,
      tipo:    'servicio',
      img:     s.img,
      fecha:   estado.fecha.toLocaleDateString('es-AR'),
      horario: estado.horario
    });
  });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarNavbar();

  // Notificar al admin por WA
  var sesion = getSesion ? getSesion() : null;
  var nombreCliente = sesion ? sesion.nombre + ' ' + (sesion.apellido || '') : 'Un cliente';
  var telAdmin = '5493510000000';
  var fechaStr = estado.fecha.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
  var listaAdmin = estado.servicios.map(function(s) { return s.nombre; }).join(', ');
  var msgAdmin = 'Nueva reserva!\n' + nombreCliente + '\n' + listaAdmin + '\n' + fechaStr + ' - ' + estado.horario + ' hs\n$' + precioTotal().toLocaleString();
  var adminLink = document.createElement('a');
  adminLink.href = 'https://wa.me/' + telAdmin + '?text=' + encodeURIComponent(msgAdmin);
  adminLink.target = '_blank';
  adminLink.style.display = 'none';
  document.body.appendChild(adminLink);
  adminLink.click();
  setTimeout(function() { adminLink.remove(); }, 1000);

  // Mostrar modal
  var fechaStr2 = estado.fecha.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
  var finMin2 = slotAMinutos(estado.horario) + duracionTotal();
  var finH2   = String(Math.floor(finMin2 / 60)).padStart(2, '0');
  var finM2   = String(finMin2 % 60).padStart(2, '0');

  var listaHTML = estado.servicios.map(function(s) {
    return '<div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.3rem">' +
      '<span>' + s.nombre + '</span><strong>$' + s.precio.toLocaleString() + '</strong></div>';
  }).join('');

  document.getElementById('modalDesc').innerHTML =
    listaHTML +
    '<div style="border-top:1px solid #F3CFD4;margin-top:0.8rem;padding-top:0.8rem">' +
      fechaStr2 + '<br>' +
      estado.horario + ' -> ' + finH2 + ':' + finM2 + ' hs<br>' +
      formatearDuracion(duracionTotal()) + ' en total<br>' +
      '<strong>Total: $' + precioTotal().toLocaleString() + '</strong>' +
    '</div>';

  document.getElementById('modalWhatsapp').href = generarLinkWhatsApp();
  document.getElementById('modalOverlay').classList.remove('hidden');

  // Cuenta regresiva y redireccion
  var seg = 5;
  var intervalo = setInterval(function() {
    seg--;
    var el = document.getElementById('cuentaRegresiva');
    if (el) el.textContent = seg;
    if (seg <= 0) {
      clearInterval(intervalo);
      window.location.href = 'mis-turnos.html';
    }
  }, 1000);
}
