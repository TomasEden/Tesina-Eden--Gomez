/* SPA M — admin-ofertas.js */

if (!sessionStorage.getItem('adminSesion')) window.location.href = 'admin-login.html';

// ── Colores disponibles para badges ────────────────────────────────────────
var COLORES = [
  { nombre: 'Rosa',    hex: '#AD717E' },
  { nombre: 'Verde',   hex: '#45634D' },
  { nombre: 'Naranja', hex: '#d4850a' },
  { nombre: 'Rojo',    hex: '#e05050' },
  { nombre: 'Azul',    hex: '#4a7ab5' },
  { nombre: 'Morado',  hex: '#7b5ea7' }
];

var DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

var ofertas    = JSON.parse(localStorage.getItem('ofertas')) || [];
var eliminarId = null;
var colorSeleccionado = '#AD717E';
var diasSeleccionados = [];

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  renderStats();
  renderTabla();
  buildDiasGrid();
  buildColorOpts();
  // Agregar link al sidebar de admin-dashboard
  agregarLinkSidebar();
});

// ── Agregar link de ofertas al sidebar si no está ────────────────────────────
function agregarLinkSidebar() {
  // Solo aplica a esta página, ya está en el HTML
}

// ── Stats ────────────────────────────────────────────────────────────────────
function renderStats() {
  var hoy       = new Date();
  var activas   = ofertas.filter(function(o) { return calcularEstado(o) === 'activa'; }).length;
  var pausadas  = ofertas.filter(function(o) { return o.estado === 'pausada'; }).length;
  var vencidas  = ofertas.filter(function(o) { return calcularEstado(o) === 'vencida'; }).length;
  var total     = ofertas.length;

  var stats = [
    { icon:'🏷️', label:'Total ofertas',  value: total,   color:'rose'   },
    { icon:'✅', label:'Activas hoy',    value: activas,  color:'green'  },
    { icon:'⏸️', label:'Pausadas',       value: pausadas, color:'orange' },
    { icon:'⌛', label:'Vencidas',       value: vencidas, color:'blue'   }
  ];

  var grid = document.getElementById('statsGrid');
  grid.innerHTML = '';
  stats.forEach(function(s) {
    grid.innerHTML +=
      '<div class="stat-card">' +
        '<div class="stat-card-header">' +
          '<div class="stat-card-icon ' + s.color + '">' + s.icon + '</div>' +
        '</div>' +
        '<div class="stat-card-num">' + s.value + '</div>' +
        '<div class="stat-card-label">' + s.label + '</div>' +
      '</div>';
  });
}

// ── Calcular estado real (considera fechas y días) ───────────────────────────
function calcularEstado(o) {
  if (o.estado === 'pausada') return 'pausada';
  var hoy = new Date();

  // Verificar vencimiento
  if (o.fin) {
    var fin = new Date(o.fin);
    fin.setHours(23, 59, 59);
    if (hoy > fin) return 'vencida';
  }

  // Verificar si aún no comenzó
  if (o.inicio) {
    var inicio = new Date(o.inicio);
    if (hoy < inicio) return 'pendiente';
  }

  // Verificar día de la semana
  if (o.dias && o.dias.length > 0) {
    var diaActual = hoy.getDay(); // 0=Dom
    if (o.dias.indexOf(diaActual) === -1) return 'inactiva_hoy';
  }

  return 'activa';
}

function estadoLabel(estado) {
  var labels = {
    activa:        'Activa',
    pausada:       'Pausada',
    vencida:       'Vencida',
    pendiente:     'Pendiente',
    inactiva_hoy:  'Inactiva hoy'
  };
  return labels[estado] || estado;
}

function estadoBadgeClass(estado) {
  var clases = {
    activa:       'badge-confirmado',
    pausada:      'badge-pendiente',
    vencida:      'badge-cancelado',
    pendiente:    'badge-pendiente',
    inactiva_hoy: 'badge-pendiente'
  };
  return clases[estado] || 'badge-pendiente';
}

// ── Render tabla ─────────────────────────────────────────────────────────────
function renderTabla() {
  var tbody  = document.getElementById('ofertasBody');
  var empty  = document.getElementById('tableEmpty');
  var filtro = document.getElementById('filterEstado').value;

  tbody.innerHTML = '';

  var lista = ofertas.filter(function(o) {
    if (filtro === 'todas') return true;
    var est = calcularEstado(o);
    if (filtro === 'activa')  return est === 'activa';
    if (filtro === 'pausada') return est === 'pausada';
    if (filtro === 'vencida') return est === 'vencida';
    return true;
  });

  if (!lista.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  lista.forEach(function(o) {
    var estado = calcularEstado(o);
    var descuentoText = '';
    if (o.tipo === 'porcentaje') descuentoText = o.descuento + '% OFF';
    else if (o.tipo === 'precio_fijo') descuentoText = '$' + (o.descuento || 0).toLocaleString();
    else if (o.tipo === '2x1') descuentoText = '2x1';
    else descuentoText = '—';

    var diasHTML = '';
    if (o.dias && o.dias.length > 0) {
      diasHTML = '<div class="dias-display">';
      o.dias.forEach(function(d) {
        diasHTML += '<span class="dia-tag">' + DIAS_SEMANA[d].substring(0,2) + '</span>';
      });
      diasHTML += '</div>';
    } else {
      diasHTML = '<span style="font-size:0.78rem;color:var(--text-light)">Todos los días</span>';
    }

    var fechaVig = '';
    if (o.inicio || o.fin) {
      fechaVig = (o.inicio ? new Date(o.inicio).toLocaleDateString('es-AR', {day:'numeric',month:'short'}) : '∞');
      fechaVig += ' → ';
      fechaVig += (o.fin ? new Date(o.fin).toLocaleDateString('es-AR', {day:'numeric',month:'short'}) : '∞');
    } else {
      fechaVig = 'Sin vencimiento';
    }

    var toggleClass = (estado === 'activa') ? 'on' : '';

    tbody.innerHTML +=
      '<tr>' +
        '<td>' +
          '<strong>' + o.nombre + '</strong>' +
          (o.desc ? '<br><span class="td-light">' + o.desc + '</span>' : '') +
        '</td>' +
        '<td class="td-light">' + (o.aplica === 'especifico' ? o.especifico : o.aplica) + '</td>' +
        '<td>' +
          '<span class="oferta-badge" style="background:' + (o.color || '#AD717E') + '">' + descuentoText + '</span>' +
        '</td>' +
        '<td class="td-light" style="font-size:0.78rem">' + fechaVig + '</td>' +
        '<td>' + diasHTML + '</td>' +
        '<td>' +
          '<div class="toggle-estado" onclick="toggleEstado(' + o.id + ')">' +
            '<div class="toggle-track ' + toggleClass + '"><div class="toggle-thumb"></div></div>' +
            '<span class="td-light" style="font-size:0.78rem">' + estadoLabel(estado) + '</span>' +
          '</div>' +
        '</td>' +
        '<td>' +
          '<div style="display:flex;gap:0.4rem">' +
            '<button class="btn-icon" onclick="abrirModalEditar(' + o.id + ')" title="Editar">✏️</button>' +
            '<button class="btn-icon" onclick="verPreview()" title="Vista previa">👁️</button>' +
            '<button class="btn-icon danger" onclick="abrirModalEliminar(' + o.id + ')" title="Eliminar">🗑️</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
  });
}

// ── Toggle activa/pausada directo desde la tabla ─────────────────────────────
function toggleEstado(id) {
  var o = ofertas.find(function(x) { return x.id === id; });
  if (!o) return;
  var estadoActual = calcularEstado(o);
  o.estado = (estadoActual === 'activa' || estadoActual === 'inactiva_hoy') ? 'pausada' : 'activa';
  guardarLS();
  renderTabla();
  renderStats();
  showToast(o.estado === 'activa' ? '✅ Oferta activada' : '⏸️ Oferta pausada');
}

// ── Días grid ────────────────────────────────────────────────────────────────
function buildDiasGrid() {
  var container = document.getElementById('diasGrid');
  container.innerHTML = '';
  DIAS_SEMANA.forEach(function(dia, i) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dia-btn';
    btn.textContent = dia.substring(0, 3);
    btn.dataset.dia = i;
    btn.addEventListener('click', function() {
      btn.classList.toggle('active');
      var idx = diasSeleccionados.indexOf(i);
      if (idx === -1) diasSeleccionados.push(i);
      else diasSeleccionados.splice(idx, 1);
    });
    container.appendChild(btn);
  });
}

// ── Color opts ───────────────────────────────────────────────────────────────
function buildColorOpts() {
  var container = document.getElementById('colorOpts');
  container.innerHTML = '';
  COLORES.forEach(function(c) {
    var btn = document.createElement('div');
    btn.className = 'color-opt' + (c.hex === colorSeleccionado ? ' active' : '');
    btn.style.background = c.hex;
    btn.title = c.nombre;
    btn.addEventListener('click', function() {
      colorSeleccionado = c.hex;
      document.querySelectorAll('.color-opt').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    container.appendChild(btn);
  });
}

// ── Actualizar form según tipo ────────────────────────────────────────────────
function actualizarFormTipo() {
  var tipo  = document.getElementById('fTipo').value;
  var campo = document.getElementById('campoDescuento');
  var label = document.getElementById('labelDescuento');
  if (tipo === 'texto') {
    campo.style.display = 'none';
  } else {
    campo.style.display = '';
    if (tipo === 'porcentaje') label.textContent = 'Descuento (%)';
    else if (tipo === 'precio_fijo') label.textContent = 'Precio especial ($)';
    else if (tipo === '2x1') campo.style.display = 'none';
  }

  var especifico = document.getElementById('fAplica').value === 'especifico';
  document.getElementById('campoEspecifico').style.display = especifico ? '' : 'none';
}

// ── Limpiar form ─────────────────────────────────────────────────────────────
function limpiarForm() {
  document.getElementById('editId').value = '';
  document.getElementById('fNombre').value    = '';
  document.getElementById('fDesc').value      = '';
  document.getElementById('fTipo').value      = 'porcentaje';
  document.getElementById('fDescuento').value = '';
  document.getElementById('fAplica').value    = 'todos';
  document.getElementById('fEspecifico').value = '';
  document.getElementById('fInicio').value    = '';
  document.getElementById('fFin').value       = '';
  document.getElementById('fEstado').value    = 'activa';
  document.getElementById('err-nombre').textContent   = '';
  document.getElementById('err-descuento').textContent = '';

  // Reset días
  diasSeleccionados = [];
  document.querySelectorAll('.dia-btn').forEach(function(b) { b.classList.remove('active'); });

  // Reset color
  colorSeleccionado = '#AD717E';
  document.querySelectorAll('.color-opt').forEach(function(b) {
    b.classList.toggle('active', b.style.background === 'rgb(173, 113, 126)' || b.title === 'Rosa');
  });

  actualizarFormTipo();
}

// ── Abrir modal nuevo ────────────────────────────────────────────────────────
function abrirModalNuevo() {
  limpiarForm();
  // Fecha de inicio = hoy por defecto
  var hoy = new Date().toISOString().split('T')[0];
  document.getElementById('fInicio').value = hoy;
  document.getElementById('modalFormTitle').textContent = 'Nueva oferta';
  document.getElementById('modalForm').classList.remove('hidden');
}

// ── Abrir modal editar ────────────────────────────────────────────────────────
function abrirModalEditar(id) {
  var o = ofertas.find(function(x) { return x.id === id; });
  if (!o) return;
  limpiarForm();

  document.getElementById('modalFormTitle').textContent = 'Editar oferta';
  document.getElementById('editId').value        = o.id;
  document.getElementById('fNombre').value       = o.nombre;
  document.getElementById('fDesc').value         = o.desc || '';
  document.getElementById('fTipo').value         = o.tipo || 'porcentaje';
  document.getElementById('fDescuento').value    = o.descuento || '';
  document.getElementById('fAplica').value       = o.aplica || 'todos';
  document.getElementById('fEspecifico').value   = o.especifico || '';
  document.getElementById('fInicio').value       = o.inicio || '';
  document.getElementById('fFin').value          = o.fin || '';
  document.getElementById('fEstado').value       = o.estado || 'activa';

  // Días
  diasSeleccionados = o.dias ? o.dias.slice() : [];
  document.querySelectorAll('.dia-btn').forEach(function(b) {
    if (diasSeleccionados.indexOf(parseInt(b.dataset.dia)) !== -1) {
      b.classList.add('active');
    }
  });

  // Color
  colorSeleccionado = o.color || '#AD717E';
  document.querySelectorAll('.color-opt').forEach(function(b) {
    b.classList.toggle('active', b.style.backgroundColor === hexToRgb(colorSeleccionado));
  });

  actualizarFormTipo();
  document.getElementById('campoEspecifico').style.display =
    o.aplica === 'especifico' ? '' : 'none';
  document.getElementById('modalForm').classList.remove('hidden');
}

function hexToRgb(hex) {
  var r = parseInt(hex.slice(1,3), 16);
  var g = parseInt(hex.slice(3,5), 16);
  var b = parseInt(hex.slice(5,7), 16);
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

// ── Guardar oferta ────────────────────────────────────────────────────────────
function guardarOferta() {
  var nombre   = document.getElementById('fNombre').value.trim();
  var tipo     = document.getElementById('fTipo').value;
  var descuento = parseInt(document.getElementById('fDescuento').value) || 0;
  var aplica   = document.getElementById('fAplica').value;

  document.getElementById('err-nombre').textContent   = '';
  document.getElementById('err-descuento').textContent = '';

  var valido = true;
  if (!nombre) {
    document.getElementById('err-nombre').textContent = 'El nombre es obligatorio';
    valido = false;
  }
  if (tipo !== 'texto' && tipo !== '2x1' && !descuento) {
    document.getElementById('err-descuento').textContent = 'Ingresá un valor válido';
    valido = false;
  }
  if (!valido) return;

  var data = {
    nombre:     nombre,
    desc:       document.getElementById('fDesc').value.trim(),
    tipo:       tipo,
    descuento:  descuento,
    aplica:     aplica,
    especifico: document.getElementById('fEspecifico').value.trim(),
    inicio:     document.getElementById('fInicio').value,
    fin:        document.getElementById('fFin').value,
    dias:       diasSeleccionados.slice().sort(),
    color:      colorSeleccionado,
    estado:     document.getElementById('fEstado').value
  };

  var editId = document.getElementById('editId').value;
  if (editId) {
    var idx = ofertas.findIndex(function(o) { return o.id === parseInt(editId); });
    if (idx !== -1) ofertas[idx] = Object.assign(ofertas[idx], data);
    showToast('✅ Oferta actualizada');
  } else {
    var maxId = ofertas.reduce(function(m, o) { return Math.max(m, o.id); }, 0);
    data.id = maxId + 1;
    ofertas.push(data);
    showToast('✅ Oferta creada');
  }

  guardarLS();
  cerrarModal('modalForm');
  renderTabla();
  renderStats();
}

// ── Vista previa del ticker ────────────────────────────────────────────────────
function verPreview() {
  var activas = ofertas.filter(function(o) { return calcularEstado(o) === 'activa'; });
  var ticker  = document.getElementById('previewTicker');
  ticker.innerHTML = '';

  if (!activas.length) {
    ticker.textContent = 'No hay ofertas activas en este momento';
    ticker.style.justifyContent = 'center';
  } else {
    activas.forEach(function(o) {
      var item = document.createElement('span');
      item.className = 'preview-ticker-item';
      var dot = document.createElement('span');
      dot.className = 'preview-dot';
      item.appendChild(dot);
      var txt = document.createTextNode(' ' + (o.desc || o.nombre));
      item.appendChild(txt);
      ticker.appendChild(item);
    });
  }
  document.getElementById('modalPreview').classList.remove('hidden');
}

// ── Eliminar ──────────────────────────────────────────────────────────────────
function abrirModalEliminar(id) {
  eliminarId = id;
  document.getElementById('modalEliminar').classList.remove('hidden');
}

function confirmarEliminar() {
  ofertas = ofertas.filter(function(o) { return o.id !== eliminarId; });
  guardarLS();
  cerrarModal('modalEliminar');
  renderTabla();
  renderStats();
  showToast('🗑️ Oferta eliminada');
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function guardarLS() {
  localStorage.setItem('ofertas', JSON.stringify(ofertas));
}

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function cerrarSesion() {
  sessionStorage.removeItem('adminSesion');
  window.location.href = 'admin-login.html';
}

// ── Manejar cambio de "Aplica a" ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var aplicaSelect = document.getElementById('fAplica');
  if (aplicaSelect) {
    aplicaSelect.addEventListener('change', function() {
      document.getElementById('campoEspecifico').style.display =
        this.value === 'especifico' ? '' : 'none';
    });
  }
});
