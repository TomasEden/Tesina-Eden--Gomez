/* =========================================================
   SENDEROS — admin-ofertas.js
   Conectado a la sesión PHP y a la API
   ========================================================= */

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

var DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

var ofertas = [];
var eliminarId = null;
var colorSeleccionado = '#AD717E';
var diasSeleccionados = []; /* Fase C: sin días */
var recursosOferta = {
  servicios: [],
  productos: []
};

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
  const autorizado = await verificarAdministrador();

  if (!autorizado) {
    return;
  }
  buildColorOpts();
  cargarRecursosOferta();
  activarRefreshAdmin(cargarOfertas, 30000);

  ['fTipo', 'fAplica'].forEach(function (id) {
    var el = document.getElementById(id);

    if (el) {
      el.addEventListener('change', actualizarFormTipo);
    }
  });

  ['fDescuento'].forEach(function (id) {
    var el = document.getElementById(id);

    if (el) {
      el.addEventListener('input', actualizarPreviewOferta);
      el.addEventListener('change', actualizarPreviewOferta);
    }
  });

  cargarOfertas();
});

function activarRefreshAdmin(recargar, ms) {
  if (typeof recargar !== 'function') {
    return;
  }

  setInterval(function () {
    if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) {
      recargar();
    }
  }, ms || 30000);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) {
      recargar();
    }
  });
}

/* Fase G: verificarAdministrador compartido de admin-shell.js. */

function apiFetch(url, options) {
  return fetch(
    url,
    Object.assign(
      {
        credentials: 'same-origin'
      },
      options || {}
    )
  );
}

// ── Cargar servicios y productos existentes para ofertas específicas ─────────
function cargarRecursosOferta() {
  Promise.all([
    apiFetch('../api/servicios.php')
      .then(function(r) {
        return r.json();
      }),

    apiFetch('../api/productos.php')
      .then(function(r) {
        return r.json();
      })
  ])
    .then(function(resultados) {
      recursosOferta.servicios =
        resultados[0].ok
          ? resultados[0].servicios
          : [];

      recursosOferta.productos =
        resultados[1].ok
          ? resultados[1].productos
          : [];

      actualizarOpcionesEspecificas();
    })
    .catch(function() {
      actualizarOpcionesEspecificas();
    })
    .finally(function() {
      actualizarPreviewOferta();
    });
}

function valorEspecifico(item, tipo) {
  return tipo + ':' + item.id;
}

function especificosSeleccionados() {
  return Array.from(
    document.querySelectorAll('#checkEspecifico input[type="checkbox"]:checked')
  ).map(function (check) {
    return check.value;
  });
}

function actualizarOpcionesEspecificas(
  valorSeleccionado
) {
  var caja = document.getElementById(
    'checkEspecifico'
  );

  if (!caja) {
    return;
  }

  var previos = valorSeleccionado !== undefined
    ? String(valorSeleccionado || '').split(',').map(function (x) {
        return x.trim();
      }).filter(Boolean)
    : especificosSeleccionados();

  caja.innerHTML = '';

  function grupo(titulo, items, tipo) {
    if (!items.length) {
      return;
    }

    var h = document.createElement('p');
    h.className = 'check-lista-titulo';
    h.textContent = titulo;
    caja.appendChild(h);

    items.forEach(function (item) {
      var valor = valorEspecifico(item, tipo);

      var label = document.createElement('label');
      label.className = 'check-item';

      var check = document.createElement('input');
      check.type = 'checkbox';
      check.value = valor;
      check.checked = previos.some(function (prev) {
        return (
          prev === valor ||
          prev === String(item.nombre || '') ||
          prev.split('|').slice(-1)[0] === String(item.nombre || '')
        );
      });
      check.addEventListener('change', actualizarPreviewOferta);
      label.appendChild(check);

      var txt = document.createElement('span');
      txt.textContent =
        String(item.nombre || '') +
        ' ($' + Number(item.precio || 0).toLocaleString('es-AR') + ')';
      label.appendChild(txt);

      caja.appendChild(label);
    });
  }

  grupo('Servicios', recursosOferta.servicios || [], 'servicio');
  grupo('Productos', recursosOferta.productos || [], 'producto');

  if (!caja.children.length) {
    var vacio = document.createElement('p');
    vacio.className = 'td-light';
    vacio.textContent = 'No hay servicios ni productos cargados';
    caja.appendChild(vacio);
  }

  /* Ofertas viejas con otro formato se muestran igual. */
  previos.forEach(function (prev) {
    var existe = caja.querySelector(
      'input[value="' + prev.replace(/"/g, '') + '"]'
    );

    if (!existe && prev.indexOf(':') === -1) {
      var label = document.createElement('label');
      label.className = 'check-item';

      var check = document.createElement('input');
      check.type = 'checkbox';
      check.value = prev;
      check.checked = true;
      check.addEventListener('change', actualizarPreviewOferta);
      label.appendChild(check);

      var txt = document.createElement('span');
      txt.textContent = prev + ' (oferta existente)';
      label.appendChild(txt);

      caja.appendChild(label);
    }
  });
}

// ── Cargar ofertas desde la API ─────────────────────────────────────────────
function cargarOfertas() {
  apiFetch(API_URL)
    .then(function(r) {
      return r.json();
    })
    .then(function(data) {
      if (data.ok) {
        ofertas =
          data.ofertas.map(
            normalizarOferta
          );

        renderStats();
        renderTabla();
      } else {
        window.showToast('Error al cargar ofertas');
      }
    })
    .catch(function() {
      window.showToast('Error al procesar la oferta');
    });
}

// Convierte lo que devuelve la BD a un formato usable en JS
function normalizarOferta(o) {
  return Object.assign(
    {},
    o,
    {
      dias: [],

      descuento:
        Number(o.descuento) || 0,

      inicio:
        o.fecha_inicio,

      fin:
        o.fecha_fin,

      desc:
        o.descripcion
    }
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────
function renderStats() {
  var activas =
    ofertas.filter(
      function(o) {
        return (
          calcularEstado(o) ===
          'activa'
        );
      }
    ).length;

  var pausadas =
    ofertas.filter(
      function(o) {
        return o.estado === 'pausada';
      }
    ).length;

  var vencidas =
    ofertas.filter(
      function(o) {
        return (
          calcularEstado(o) ===
          'vencida'
        );
      }
    ).length;

  var total =
    ofertas.length;

  var stats = [
    {
      icon:
        '<img src="../img/icons/oferta.svg" alt="" width="14" height="14" style="vertical-align:middle;margin-right:0.3rem">',
      label:
        'Total ofertas',
      value:
        total,
      color:
        'rose'
    },

    {
      icon:
        '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">',
      label:
        'Activas hoy',
      value:
        activas,
      color:
        'green'
    },

    {
      icon:
        '<img src="../img/icons/cerrar.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">',
      label:
        'Pausadas',
      value:
        pausadas,
      color:
        'orange'
    },

    {
      icon:
        '<img src="../img/icons/tiempo.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">',
      label:
        'Vencidas',
      value:
        vencidas,
      color:
        'blue'
    }
  ];

  var grid =
    document.getElementById(
      'statsGrid'
    );

  if (!grid) {
    return;
  }

  grid.innerHTML = '';

  stats.forEach(
    function(s) {
      grid.innerHTML +=
        '<div class="stat-card">' +
          '<div class="stat-card-header">' +
            '<div class="stat-card-icon ' +
              s.color +
            '">' +
              s.icon +
            '</div>' +
          '</div>' +

          '<div class="stat-card-num">' +
            s.value +
          '</div>' +

          '<div class="stat-card-label">' +
            s.label +
          '</div>' +
        '</div>';
    }
  );
}

// ── Calcular estado real ────────────────────────────────────────────────────
function calcularEstado(o) {
  if (
    o.estado ===
    'pausada'
  ) {
    return 'pausada';
  }

  var hoy =
    new Date();

  if (o.fin) {
    var fin =
      new Date(
        o.fin +
        'T23:59:59'
      );

    if (hoy > fin) {
      return 'vencida';
    }
  }

  if (o.inicio) {
    var inicio =
      new Date(
        o.inicio +
        'T00:00:00'
      );

    if (hoy < inicio) {
      return 'pendiente';
    }
  }

  return 'activa';
}

function estadoLabel(estado) {
  var labels = {
    activa:
      'Activa',

    pausada:
      'Pausada',

    vencida:
      'Vencida',

    pendiente:
      'Pendiente',

    inactiva_hoy:
      'Inactiva hoy'
  };

  return (
    labels[estado] ||
    estado
  );
}

// ── Render tabla ─────────────────────────────────────────────────────────────
function renderTabla() {
  var tbody =
    document.getElementById(
      'ofertasBody'
    );

  var empty =
    document.getElementById(
      'tableEmpty'
    );

  if (!tbody || !empty || !document.getElementById('filterEstado')) {
    return;
  }

  var filtro =
    document.getElementById(
      'filterEstado'
    ).value;

  tbody.innerHTML = '';

  var lista =
    ofertas.filter(
      function(o) {
        if (
          filtro ===
          'todas'
        ) {
          return true;
        }

        var est =
          calcularEstado(o);

        if (
          filtro ===
          'activa'
        ) {
          return est ===
            'activa';
        }

        if (
          filtro ===
          'pausada'
        ) {
          return est ===
            'pausada';
        }

        if (
          filtro ===
          'vencida'
        ) {
          return est ===
            'vencida';
        }

        return true;
      }
    );

  if (!lista.length) {
    empty.classList.remove(
      'hidden'
    );

    return;
  }

  empty.classList.add(
    'hidden'
  );

  lista.forEach(
    function(o) {
      var estado =
        calcularEstado(o);

      var descuentoText =
        '';

      if (
        o.tipo ===
        'porcentaje'
      ) {
        descuentoText =
          o.descuento +
          '% OFF';
      } else if (
        o.tipo ===
        'precio_fijo'
      ) {
        descuentoText =
          '$' +
          (
            o.descuento ||
            0
          ).toLocaleString();
      } else if (
        o.tipo ===
        '2x1'
      ) {
        descuentoText =
          '2x1';
      } else {
        descuentoText =
          '—';
      }

      var diasHTML = '';
      /* Fase C: sin restricción de días. */

      var fechaVig =
        '';

      if (
        o.inicio ||
        o.fin
      ) {
        fechaVig =
          o.inicio
            ? new Date(
                o.inicio +
                'T00:00'
              ).toLocaleDateString(
                'es-AR',
                {
                  day:
                    'numeric',
                  month:
                    'short'
                }
              )
            : '∞';

        fechaVig +=
          ' → ';

        fechaVig +=
          o.fin
            ? new Date(
                o.fin +
                'T00:00'
              ).toLocaleDateString(
                'es-AR',
                {
                  day:
                    'numeric',
                  month:
                    'short'
                }
              )
            : '∞';
      } else {
        fechaVig =
          'Sin vencimiento';
      }

      var toggleClass =
        estado === 'activa'
          ? 'on'
          : '';

      var tr = document.createElement('tr');

      var tdNombre = document.createElement('td');
      var strongNombre = document.createElement('strong');
      strongNombre.textContent = String(o.nombre || '');
      tdNombre.appendChild(strongNombre);

      if (o.desc) {
        tdNombre.appendChild(document.createElement('br'));

        var descSpan = document.createElement('span');
        descSpan.className = 'td-light';
        descSpan.textContent = String(o.desc);
        tdNombre.appendChild(descSpan);
      }

      tr.appendChild(tdNombre);

      var tdAplica = document.createElement('td');
      tdAplica.className = 'td-light';
      tdAplica.textContent =
        o.aplica === 'especifico' ? String(o.especifico || '') : String(o.aplica || '');
      tr.appendChild(tdAplica);

      var tdDesc = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'oferta-badge';

      var color = /^#[0-9a-fA-F]{3,8}$/.test(String(o.color || ''))
        ? String(o.color)
        : '#AD717E';

      badge.style.background = color;
      badge.textContent = descuentoText;
      tdDesc.appendChild(badge);
      tr.appendChild(tdDesc);

      var tdFecha = document.createElement('td');
      tdFecha.className = 'td-light';
      tdFecha.style.fontSize = '0.78rem';
      tdFecha.textContent = fechaVig;
      tr.appendChild(tdFecha);

      /* Fase C: sin columna de días. */

      var tdEstado = document.createElement('td');
      var toggle = document.createElement('div');
      toggle.className = 'toggle-estado';
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', String(estado === 'activa'));
      toggle.setAttribute('tabindex', '0');

      var track = document.createElement('div');
      track.className = 'toggle-track ' + toggleClass;

      var thumb = document.createElement('div');
      thumb.className = 'toggle-thumb';
      track.appendChild(thumb);
      toggle.appendChild(track);

      var estadoTxt = document.createElement('span');
      estadoTxt.className = 'td-light';
      estadoTxt.style.fontSize = '0.78rem';
      estadoTxt.textContent = estadoLabel(estado);
      toggle.appendChild(estadoTxt);

      toggle.addEventListener('click', function () {
        toggleEstado(o.id);
      });
      toggle.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleEstado(o.id);
        }
      });

      tdEstado.appendChild(toggle);
      tr.appendChild(tdEstado);

      var tdAcc = document.createElement('td');
      var accBox = document.createElement('div');
      accBox.style.display = 'flex';
      accBox.style.gap = '0.4rem';

      [
        { icono: 'formulario.svg', titulo: 'Editar', accion: function () { abrirModalEditar(o.id); } },
        { icono: 'ver.svg', titulo: 'Vista previa', accion: function () { verPreview(); } },
        { icono: 'basura.svg', titulo: 'Eliminar', peligro: true, accion: function () { abrirModalEliminar(o.id); } }
      ].forEach(function (cfg) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-icon' + (cfg.peligro ? ' danger' : '');
        btn.title = cfg.titulo;
        btn.setAttribute('aria-label', cfg.titulo);

        var img = document.createElement('img');
        img.src = '../img/icons/' + cfg.icono;
        img.alt = '';
        img.width = 14;
        img.height = 14;
        btn.appendChild(img);

        btn.addEventListener('click', cfg.accion);
        accBox.appendChild(btn);
      });

      tdAcc.appendChild(accBox);
      tr.appendChild(tdAcc);

      tbody.appendChild(tr);
    }
  );
}

// ── Toggle activa/pausada directo desde la tabla ─────────────────────────────
function toggleEstado(id) {
  var o =
    ofertas.find(
      function(x) {
        return x.id === id;
      }
    );

  if (!o) {
    return;
  }

  var estadoActual =
    calcularEstado(o);

  var nuevoEstado =
    (
      estadoActual ===
        'activa' ||
      estadoActual ===
        'inactiva_hoy'
    )
      ? 'pausada'
      : 'activa';

  guardarOfertaCompleta(
    o,
    nuevoEstado,
    function() {
      window.showToast(
        nuevoEstado ===
          'activa'
          ? '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Oferta activada'
          : '<img src="../img/icons/cerrar.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Oferta pausada'
      );
    }
  );
}

// ── Actualiza una oferta existente cambiando solo el estado ─────────────────
function guardarOfertaCompleta(
  o,
  nuevoEstado,
  callback
) {
  var data = {
    id:
      o.id,

    nombre:
      o.nombre,

    descripcion:
      o.desc,

    tipo:
      o.tipo,

    descuento:
      o.descuento,

    aplica:
      o.aplica,

    especifico:
      o.especifico,

    fecha_inicio:
      o.inicio ||
      null,

    fecha_fin:
      o.fin ||
      null,

    dias: [],

    color:
      o.color,

    estado:
      nuevoEstado
  };

  apiFetch(
    API_URL,
    {
      method:
        'PUT',

      headers: {
        'Content-Type':
          'application/json',

        'Accept':
          'application/json'
      },

      body:
        JSON.stringify(data)
    }
  )
    .then(function(r) {
      return r.json();
    })
    .then(function(res) {
      if (!res.ok) {
        window.showToast('Error al procesar la oferta');

        return;
      }

      cargarOfertas();

      if (callback) {
        callback();
      }
    })
    .catch(function() {
      window.showToast('Error al procesar la oferta');
    });
}

// ── Días grid (la UI se eliminó: las ofertas rigen todos los días) ────────
function buildDiasGrid() {
  var container =
    document.getElementById(
      'diasGrid'
    );

  if (!container) {
    return;
  }

  container.innerHTML = '';

  DIAS_SEMANA.forEach(
    function(dia, i) {
      var btn =
        document.createElement(
          'button'
        );

      btn.type =
        'button';

      btn.className =
        'dia-btn';

      btn.textContent =
        dia.substring(
          0,
          3
        );

      btn.dataset.dia =
        i;

      btn.addEventListener(
        'click',
        function() {
          btn.classList.toggle(
            'active'
          );

          var idx =
            diasSeleccionados.indexOf(
              i
            );

          if (idx === -1) {
            diasSeleccionados.push(
              i
            );
          } else {
            diasSeleccionados.splice(
              idx,
              1
            );
          }
        }
      );

      container.appendChild(
        btn
      );
    }
  );
}

// ── Color opts ───────────────────────────────────────────────────────────────
function buildColorOpts() {
  var container =
    document.getElementById(
      'colorOpts'
    );

  if (!container) {
    return;
  }

  container.innerHTML = '';

  COLORES.forEach(
    function(c) {
      var btn =
        document.createElement(
          'div'
        );

      btn.className =
        'color-opt' +
        (
          c.hex ===
          colorSeleccionado
            ? ' active'
            : ''
        );

      btn.style.background =
        c.hex;

      btn.title =
        c.nombre;

      btn.addEventListener(
        'click',
        function() {
          colorSeleccionado =
            c.hex;

          document
            .querySelectorAll(
              '.color-opt'
            )
            .forEach(
              function(b) {
                b.classList.remove(
                  'active'
                );
              }
            );

          btn.classList.add(
            'active'
          );
        }
      );

      container.appendChild(
        btn
      );
    }
  );
}

// ── Actualizar form según tipo ───────────────────────────────────────────────
function actualizarFormTipo() {
  var tipo =
    document.getElementById(
      'fTipo'
    ).value;

  var campo =
    document.getElementById(
      'campoDescuento'
    );

  var label =
    document.getElementById(
      'labelDescuento'
    );

  if (
    tipo ===
    'texto'
  ) {
    campo.style.display =
      'none';
  } else {
    campo.style.display =
      '';

    if (
      tipo ===
      'porcentaje'
    ) {
      label.textContent =
        'Descuento (%)';
    } else if (
      tipo ===
      'precio_fijo'
    ) {
      label.textContent =
        'Precio especial ($)';
    } else if (
      tipo ===
      '2x1'
    ) {
      campo.style.display =
        'none';
    }
  }

  var especifico =
    document.getElementById(
      'fAplica'
    ).value ===
    'especifico';

  document.getElementById(
    'campoEspecifico'
  ).style.display =
    especifico
      ? ''
      : 'none';

  if (especifico) {
    actualizarOpcionesEspecificas();
  }

  actualizarPreviewOferta();
}

// ── Vista previa del descuento (banner expandible) ─────────────────────────
function precioMuestra(precio, tipo, descuento) {
  precio = Number(precio) || 0;
  descuento = Number(descuento) || 0;

  if (tipo === 'porcentaje' && descuento > 0) {
    return Math.round(precio * (1 - Math.min(descuento, 100) / 100));
  }

  if (tipo === 'precio_fijo' && descuento >= 0) {
    return Math.min(precio, descuento);
  }

  return precio;
}

function itemsAfectados(aplica, especificos) {
  var servicios = recursosOferta.servicios || [];
  var productos = recursosOferta.productos || [];

  var todos = servicios
    .map(function (s) {
      return { tipo: 'servicio', id: Number(s.id), nombre: s.nombre, precio: Number(s.precio) || 0 };
    })
    .concat(
      productos.map(function (p) {
        return { tipo: 'producto', id: Number(p.id), nombre: p.nombre, precio: Number(p.precio) || 0 };
      })
    );

  if (aplica === 'especifico') {
    var lista = String(especificos || '')
      .split(',')
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);

    if (!lista.length) {
      return [];
    }

    return todos.filter(function (item) {
      return lista.some(function (esp) {
        if (esp === item.nombre) {
          return true;
        }

        var partes = esp.split('|');

        if (partes.length === 3 && partes[2] === item.nombre) {
          return true;
        }

        var par = esp.split(':');

        return (
          par.length === 2 &&
          par[0].toLowerCase() === item.tipo &&
          Number(par[1]) === Number(item.id)
        );
      });
    });
  }

  if (aplica === 'servicios') {
    return todos.filter(function (item) {
      return item.tipo === 'servicio';
    });
  }

  if (aplica === 'productos') {
    return todos.filter(function (item) {
      return item.tipo === 'producto';
    });
  }

  return todos;
}

function actualizarPreviewOferta() {
  var caja = document.getElementById('ofertaPreview');

  if (!caja) {
    return;
  }

  caja.innerHTML = '';

  var tipoEl = document.getElementById('fTipo');
  var descEl = document.getElementById('fDescuento');
  var aplicaEl = document.getElementById('fAplica');

  if (!tipoEl || !aplicaEl) {
    return;
  }

  var tipo = tipoEl.value;
  var descuento = descEl ? Number(descEl.value) || 0 : 0;
  var aplica = aplicaEl.value;

  var items = itemsAfectados(aplica, especificosSeleccionados().join(','));

  var banner = document.createElement('button');
  banner.type = 'button';
  banner.className = 'oferta-preview-banner';

  var resumen = document.createElement('span');

  if (!items.length) {
    resumen.textContent =
      aplica === 'especifico'
        ? 'Elegí un servicio o producto para ver el descuento aplicado.'
        : 'Todavía no hay ítems cargados para esta aplicación.';
  } else if (tipo === '2x1') {
    resumen.textContent =
      '2x1 en ' + items.length + (items.length === 1 ? ' ítem' : ' ítems') + ' — tocá para ver el detalle.';
  } else if (tipo === 'texto') {
    resumen.textContent =
      'Banner de texto en ' + items.length + (items.length === 1 ? ' ítem' : ' ítems') + ' (no cambia precios).';
  } else {
    var ejemplo = items[0];
    var final = precioMuestra(ejemplo.precio, tipo, descuento);

    resumen.textContent =
      'Se aplica a ' + items.length + (items.length === 1 ? ' ítem' : ' ítems') +
      ' — ej: "' + ejemplo.nombre + '" $' + Number(ejemplo.precio).toLocaleString('es-AR') +
      ' → $' + Number(final).toLocaleString('es-AR') + '. Tocá para ver todos.';
  }

  banner.appendChild(resumen);

  var detalle = document.createElement('div');
  detalle.className = 'oferta-preview-detalle';
  detalle.hidden = true;

  items.slice(0, 12).forEach(function (item) {
    var fila = document.createElement('div');
    fila.className = 'oferta-preview-fila';

    var nombre = document.createElement('span');
    nombre.textContent = item.nombre;
    fila.appendChild(nombre);

    var precio = document.createElement('strong');

    if (tipo === '2x1') {
      precio.textContent =
        '$' + Number(item.precio).toLocaleString('es-AR') + ' (2x1)';
    } else if (tipo === 'texto') {
      precio.textContent = '$' + Number(item.precio).toLocaleString('es-AR');
    } else {
      precio.textContent =
        '$' + Number(item.precio).toLocaleString('es-AR') +
        ' → $' + Number(precioMuestra(item.precio, tipo, descuento)).toLocaleString('es-AR');
    }

    fila.appendChild(precio);
    detalle.appendChild(fila);
  });

  if (items.length > 12) {
    var mas = document.createElement('p');
    mas.textContent = '...y ' + (items.length - 12) + ' más.';
    detalle.appendChild(mas);
  }

  banner.addEventListener('click', function () {
    detalle.hidden = !detalle.hidden;
  });

  caja.appendChild(banner);
  caja.appendChild(detalle);
}

// ── Limpiar form ─────────────────────────────────────────────────────────────
function limpiarForm() {
  document.getElementById(
    'editId'
  ).value = '';

  document.getElementById(
    'fNombre'
  ).value = '';

  document.getElementById(
    'fDesc'
  ).value = '';

  document.getElementById(
    'fTipo'
  ).value =
    'porcentaje';

  document.getElementById(
    'fDescuento'
  ).value = '';

  document.getElementById(
    'fAplica'
  ).value =
    'todos';

  document
    .querySelectorAll(
      '#checkEspecifico input[type="checkbox"]'
    )
    .forEach(function (check) {
      check.checked = false;
    });

  document.getElementById(
    'fInicio'
  ).value = '';

  document.getElementById(
    'fFin'
  ).value = '';

  document.getElementById(
    'fEstado'
  ).value =
    'activa';

  document.getElementById(
    'err-nombre'
  ).textContent = '';

  document.getElementById(
    'err-descuento'
  ).textContent = '';

  diasSeleccionados = []; /* Fase C: sin días */

  document
    .querySelectorAll(
      '.dia-btn'
    )
    .forEach(
      function(b) {
        b.classList.remove(
          'active'
        );
      }
    );

  colorSeleccionado =
    '#AD717E';

  document
    .querySelectorAll(
      '.color-opt'
    )
    .forEach(
      function(b) {
        b.classList.toggle(
          'active',
          b.title ===
            'Rosa'
        );
      }
    );

  actualizarFormTipo();
}

// ── Abrir modal nuevo ────────────────────────────────────────────────────────
function abrirModalNuevo() {
  limpiarForm();

  var hoy =
    new Date()
      .toISOString()
      .split('T')[0];

  document.getElementById(
    'fInicio'
  ).value = hoy;

  document.getElementById(
    'modalFormTitle'
  ).textContent =
    'Nueva oferta';

  document.getElementById(
    'modalForm'
  ).classList.remove(
    'hidden'
  );
}

// ── Abrir modal editar ────────────────────────────────────────────────────────
function abrirModalEditar(id) {
  var o =
    ofertas.find(
      function(x) {
        return x.id === id;
      }
    );

  if (!o) {
    return;
  }

  limpiarForm();

  document.getElementById(
    'modalFormTitle'
  ).textContent =
    'Editar oferta';

  document.getElementById(
    'editId'
  ).value =
    o.id;

  document.getElementById(
    'fNombre'
  ).value =
    o.nombre;

  document.getElementById(
    'fDesc'
  ).value =
    o.desc || '';

  document.getElementById(
    'fTipo'
  ).value =
    o.tipo ||
    'porcentaje';

  document.getElementById(
    'fDescuento'
  ).value =
    o.descuento ||
    '';

  document.getElementById(
    'fAplica'
  ).value =
    o.aplica ||
    'todos';

  actualizarOpcionesEspecificas(
    o.especifico ||
      ''
  );

  document.getElementById(
    'fInicio'
  ).value =
    o.inicio ||
    '';

  document.getElementById(
    'fFin'
  ).value =
    o.fin ||
    '';

  document.getElementById(
    'fEstado'
  ).value =
    o.estado ||
    'activa';

  diasSeleccionados =
    o.dias
      ? o.dias.slice()
      : [];

  document
    .querySelectorAll(
      '.dia-btn'
    )
    .forEach(
      function(b) {
        if (
          diasSeleccionados.indexOf(
            parseInt(
              b.dataset.dia
            )
          ) !== -1
        ) {
          b.classList.add(
            'active'
          );
        }
      }
    );

  colorSeleccionado =
    o.color ||
    '#AD717E';

  document
    .querySelectorAll(
      '.color-opt'
    )
    .forEach(
      function(b) {
        b.classList.toggle(
          'active',
          b.style.backgroundColor ===
            hexToRgb(
              colorSeleccionado
            )
        );
      }
    );

  actualizarFormTipo();

  document.getElementById(
    'campoEspecifico'
  ).style.display =
    o.aplica ===
    'especifico'
      ? ''
      : 'none';

  document.getElementById(
    'modalForm'
  ).classList.remove(
    'hidden'
  );
}

function hexToRgb(hex) {
  var r =
    parseInt(
      hex.slice(1, 3),
      16
    );

  var g =
    parseInt(
      hex.slice(3, 5),
      16
    );

  var b =
    parseInt(
      hex.slice(5, 7),
      16
    );

  return (
    'rgb(' +
    r +
    ', ' +
    g +
    ', ' +
    b +
    ')'
  );
}

// ── Guardar oferta ───────────────────────────────────────────────────────────
function guardarOferta() {
  var nombre =
    document.getElementById(
      'fNombre'
    ).value.trim();

  var tipo =
    document.getElementById(
      'fTipo'
    ).value;

  var descuento =
    parseFloat(
      document.getElementById(
        'fDescuento'
      ).value
    ) || 0;

  var aplica =
    document.getElementById(
      'fAplica'
    ).value;

  document.getElementById(
    'err-nombre'
  ).textContent = '';

  document.getElementById(
    'err-descuento'
  ).textContent = '';

  var valido =
    true;

  if (!nombre) {
    document.getElementById(
      'err-nombre'
    ).textContent =
      'El nombre es obligatorio';

    valido =
      false;
  }

  if (
    aplica === 'especifico' &&
    especificosSeleccionados().length === 0
  ) {
    document.getElementById(
      'err-nombre'
    ).textContent =
      'Elegí al menos un servicio o producto';

    valido =
      false;
  }

  if (
    tipo !==
      'texto' &&
    tipo !==
      '2x1' &&
    !descuento
  ) {
    document.getElementById(
      'err-descuento'
    ).textContent =
      'Ingresá un valor válido';

    valido =
      false;
  }

  if (!valido) {
    return;
  }

  var data = {
    nombre:
      nombre,

    descripcion:
      document.getElementById(
        'fDesc'
      ).value.trim(),

    tipo:
      tipo,

    descuento:
      descuento,

    aplica:
      aplica,

    especifico:
      aplica === 'especifico'
        ? especificosSeleccionados().join(',')
        : '',

    fecha_inicio:
      document.getElementById(
        'fInicio'
      ).value ||
      null,

    fecha_fin:
      document.getElementById(
        'fFin'
      ).value ||
      null,

    dias: [],

    color:
      colorSeleccionado,

    estado:
      document.getElementById(
        'fEstado'
      ).value
  };

  var editId =
    document.getElementById(
      'editId'
    ).value;

  var metodo =
    editId
      ? 'PUT'
      : 'POST';

  if (editId) {
    data.id =
      parseInt(editId);
  }

  apiFetch(
    API_URL,
    {
      method:
        metodo,

      headers: {
        'Content-Type':
          'application/json',

        'Accept':
          'application/json'
      },

      body:
        JSON.stringify(data)
    }
  )
    .then(function(r) {
      return r.json();
    })
    .then(function(res) {
      if (!res.ok) {
        window.showToast('Error al procesar la oferta');

        return;
      }

      window.showToast(
        editId
          ? '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Oferta actualizada'
          : '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Oferta creada'
      );

      cerrarModal(
        'modalForm'
      );

      cargarOfertas();
    })
    .catch(function() {
      window.showToast('Error al procesar la oferta');
    });
}

// ── Vista previa del ticker ──────────────────────────────────────────────────
function verPreview() {
  var activas =
    ofertas.filter(
      function(o) {
        return (
          calcularEstado(o) ===
          'activa'
        );
      }
    );

  var ticker =
    document.getElementById(
      'previewTicker'
    );

  if (!ticker) {
    return;
  }

  ticker.innerHTML =
    '';

  if (!activas.length) {
    ticker.textContent =
      'No hay ofertas activas en este momento';

    ticker.style.justifyContent =
      'center';
  } else {
    activas.forEach(
      function(o) {
        var item =
          document.createElement(
            'span'
          );

        item.className =
          'preview-ticker-item';

        var dot =
          document.createElement(
            'span'
          );

        dot.className =
          'preview-dot';

        item.appendChild(
          dot
        );

        var txt =
          document.createTextNode(
            ' ' +
            (
              o.desc ||
              o.nombre
            )
          );

        item.appendChild(
          txt
        );

        ticker.appendChild(
          item
        );
      }
    );
  }

  document.getElementById(
    'modalPreview'
  ).classList.remove(
    'hidden'
  );
}

// ── Eliminar ─────────────────────────────────────────────────────────────────
function abrirModalEliminar(id) {
  eliminarId =
    id;

  document.getElementById(
    'modalEliminar'
  ).classList.remove(
    'hidden'
  );
}

function confirmarEliminar() {
  apiFetch(
    API_URL,
    {
      method:
        'DELETE',

      headers: {
        'Content-Type':
          'application/json',

        'Accept':
          'application/json'
      },

      body:
        JSON.stringify({
          id:
            eliminarId
        })
    }
  )
    .then(function(r) {
      return r.json();
    })
    .then(function(res) {
      if (!res.ok) {
        window.showToast('Error al procesar la oferta');

        return;
      }

      cerrarModal(
        'modalEliminar'
      );

      window.showToast(
        '<img src="../img/icons/basura.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem">Oferta eliminada'
      );

      eliminarId =
        null;

      cargarOfertas();
    })
    .catch(function() {
      window.showToast('Error al procesar la oferta');
    });
}

// ── Utils ────────────────────────────────────────────────────────────────────
function cerrarModal(id) {
  document.getElementById(
    id
  ).classList.add(
    'hidden'
  );
}

/* Fase G: showToast compartido de admin-shell.js (sin duplicado ni innerHTML). */

/* Fase G: cerrarSesion compartido de admin-shell.js. */