/* SPA M — admin-ofertas.js (conectado a la API) */

if (!sessionStorage.getItem('adminSesion')) window.location.href = 'admin-login.html';

const API_URL = '../api/oferta.php';

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

var ofertas    = [];
var eliminarId = null;
var colorSeleccionado = '#AD717E';
var diasSeleccionados = [];
var recursosOferta = { servicios: [], productos: [] };

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  buildDiasGrid();
  buildColorOpts();
  cargarRecursosOferta();
  document.getElementById('fAplica').addEventListener('change', actualizarFormTipo);
  cargarOfertas();
});

// ── Cargar servicios y productos existentes para ofertas específicas ─────────
function cargarRecursosOferta() {
  Promise.all([
    fetch('../api/servicios.php').then(function(r){ return r.json(); }),
    fetch('../api/productos.php').then(function(r){ return r.json(); })
  ]).then(function(resultados) {
    recursosOferta.servicios = resultados[0].ok ? resultados[0].servicios : [];
    recursosOferta.productos = resultados[1].ok ? resultados[1].productos : [];
    actualizarOpcionesEspecificas();
  }).catch(function() {
    actualizarOpcionesEspecificas();
  });
}

function actualizarOpcionesEspecificas(valorSeleccionado) {
  var select = document.getElementById('fEspecifico');
  if (!select) return;

  var actual = valorSeleccionado !== undefined ? valorSeleccionado : select.value;
  select.innerHTML = '<option value="">Seleccioná un servicio o producto</option>';

  var grupoS = document.createElement('optgroup');
  grupoS.label = 'Servicios';
  recursosOferta.servicios.forEach(function(item) {
    var op = document.createElement('option');
    op.value = 'servicio|' + item.id + '|' + item.nombre;
    op.textContent = item.nombre;
    grupoS.appendChild(op);
  });
  if (grupoS.children.length) select.appendChild(grupoS);

  var grupoP = document.createElement('optgroup');
  grupoP.label = 'Productos';
  recursosOferta.productos.forEach(function(item) {
    var op = document.createElement('option');
    op.value = 'producto|' + item.id + '|' + item.nombre;
    op.textContent = item.nombre;
    grupoP.appendChild(op);
  });
  if (grupoP.children.length) select.appendChild(grupoP);

  if (actual) {
    var encontrado = Array.from(select.options).some(function(op) {
      if (op.value === actual) { op.selected = true; return true; }
      var partes = op.value.split('|');
      if (partes.length === 3 && partes[2] === actual) { op.selected = true; return true; }
      return false;
    });
    if (!encontrado) {
      var legacy = document.createElement('option');
      legacy.value = actual;
      legacy.textContent = actual + ' (oferta existente)';
      legacy.selected = true;
      select.appendChild(legacy);
    }
  }

  if (!select.querySelector('option[value^="servicio|"], option[value^="producto|"]')) {
    var vacio = document.createElement('option');
    vacio.disabled = true;
    vacio.textContent = 'No hay servicios ni productos cargados';
    select.appendChild(vacio);
  }
}

// ── Cargar ofertas desde la API ────────────────────────────────────────────
function cargarOfertas() {
  fetch(API_URL)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        ofertas = data.ofertas.map(normalizarOferta);
        renderStats();
        renderTabla();
      } else {
        showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error al cargar ofertas');
      }
    })
    .catch(function() { showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error de conexión con el servidor'); });
}

// Convierte lo que devuelve la BD (dias como "1,3,5" y números como string) a formato usable en JS
function normalizarOferta(o) {
  return Object.assign({}, o, {
    dias: o.dias ? o.dias.split(',').filter(function(x){return x !== '';}).map(Number) : [],
    descuento: Number(o.descuento) || 0,
    inicio: o.fecha_inicio,
    fin: o.fecha_fin,
    desc: o.descripcion
  });
}

// ── Stats ────────────────────────────────────────────────────────────────────
function renderStats() {
  var activas   = ofertas.filter(function(o) { return calcularEstado(o) === 'activa'; }).length;
  var pausadas  = ofertas.filter(function(o) { return o.estado === 'pausada'; }).length;
  var vencidas  = ofertas.filter(function(o) { return calcularEstado(o) === 'vencida'; }).length;
  var total     = ofertas.length;

  var stats = [
    { icon:'<img src="../img/icons/oferta.svg" alt="" width="14" height="14" style="vertical-align:middle;margin-right:0.3rem">', label:'Total ofertas',  value: total,   color:'rose'   },
    { icon:'<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">', label:'Activas hoy',    value: activas,  color:'green'  },
    { icon:'<img src="../img/icons/cerrar.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">', label:'Pausadas',       value: pausadas, color:'orange' },
    { icon:'<img src="../img/icons/tiempo.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">', label:'Vencidas',       value: vencidas, color:'blue'   }
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

  if (o.fin) {
    var fin = new Date(o.fin + 'T23:59:59');
    if (hoy > fin) return 'vencida';
  }

  if (o.inicio) {
    var inicio = new Date(o.inicio + 'T00:00:00');
    if (hoy < inicio) return 'pendiente';
  }

  if (o.dias && o.dias.length > 0) {
    var diaActual = hoy.getDay();
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
      fechaVig = (o.inicio ? new Date(o.inicio + 'T00:00').toLocaleDateString('es-AR', {day:'numeric',month:'short'}) : '∞');
      fechaVig += ' → ';
      fechaVig += (o.fin ? new Date(o.fin + 'T00:00').toLocaleDateString('es-AR', {day:'numeric',month:'short'}) : '∞');
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
            '<button class="btn-icon" onclick="abrirModalEditar(' + o.id + ')" title="Editar"><img src="../img/icons/formulario.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem"></button>' +
            '<button class="btn-icon" onclick="verPreview()" title="Vista previa"><img src="../img/icons/ver.svg" alt="" width="14" height="14" style="vertical-align:middle;margin-right:0.3rem"></button>' +
            '<button class="btn-icon danger" onclick="abrirModalEliminar(' + o.id + ')" title="Eliminar"><img src="../img/icons/basura.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem"></button>' +
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
  var nuevoEstado = (estadoActual === 'activa' || estadoActual === 'inactiva_hoy') ? 'pausada' : 'activa';

  guardarOfertaCompleta(o, nuevoEstado, function() {
    showToast(nuevoEstado === 'activa' ? '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Oferta activada' : '<img src="../img/icons/cerrar.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Oferta pausada');
  });
}

// Actualiza una oferta ya existente cambiando solo el estado (usado por el toggle)
function guardarOfertaCompleta(o, nuevoEstado, callback) {
  var data = {
    id: o.id,
    nombre: o.nombre,
    descripcion: o.desc,
    tipo: o.tipo,
    descuento: o.descuento,
    aplica: o.aplica,
    especifico: o.especifico,
    fecha_inicio: o.inicio || null,
    fecha_fin: o.fin || null,
    dias: o.dias || [],
    color: o.color,
    estado: nuevoEstado
  };

  fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (!res.ok) { showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error al actualizar'); return; }
    cargarOfertas();
    if (callback) callback();
  })
  .catch(function() { showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error de conexión con el servidor'); });
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
  if (especifico) actualizarOpcionesEspecificas();
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

  diasSeleccionados = [];
  document.querySelectorAll('.dia-btn').forEach(function(b) { b.classList.remove('active'); });

  colorSeleccionado = '#AD717E';
  document.querySelectorAll('.color-opt').forEach(function(b) {
    b.classList.toggle('active', b.title === 'Rosa');
  });

  actualizarFormTipo();
}

// ── Abrir modal nuevo ────────────────────────────────────────────────────────
function abrirModalNuevo() {
  limpiarForm();
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
  actualizarOpcionesEspecificas(o.especifico || '');
  document.getElementById('fInicio').value       = o.inicio || '';
  document.getElementById('fFin').value          = o.fin || '';
  document.getElementById('fEstado').value       = o.estado || 'activa';

  diasSeleccionados = o.dias ? o.dias.slice() : [];
  document.querySelectorAll('.dia-btn').forEach(function(b) {
    if (diasSeleccionados.indexOf(parseInt(b.dataset.dia)) !== -1) {
      b.classList.add('active');
    }
  });

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
  var descuento = parseFloat(document.getElementById('fDescuento').value) || 0;
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
    nombre:       nombre,
    descripcion:  document.getElementById('fDesc').value.trim(),
    tipo:         tipo,
    descuento:    descuento,
    aplica:       aplica,
    especifico:   (function() {
      var v = document.getElementById('fEspecifico').value.trim();
      var p = v.split('|');
      return p.length === 3 ? p[2] : v;
    })(),
    fecha_inicio: document.getElementById('fInicio').value || null,
    fecha_fin:    document.getElementById('fFin').value || null,
    dias:         diasSeleccionados.slice().sort(),
    color:        colorSeleccionado,
    estado:       document.getElementById('fEstado').value
  };

  var editId = document.getElementById('editId').value;
  var metodo = editId ? 'PUT' : 'POST';
  if (editId) data.id = parseInt(editId);

  fetch(API_URL, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (!res.ok) { showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">' + (res.error || 'Error al guardar')); return; }
    showToast(editId ? '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Oferta actualizada' : '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Oferta creada');
    cerrarModal('modalForm');
    cargarOfertas();
  })
  .catch(function() { showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error de conexión con el servidor'); });
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
  fetch(API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: eliminarId })
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (!res.ok) { showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error al eliminar'); return; }
    cerrarModal('modalEliminar');
    showToast('<img src="../img/icons/basura.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem">Oferta eliminada');
    cargarOfertas();
  })
  .catch(function() { showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error de conexión con el servidor'); });
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.innerHTML = msg;
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