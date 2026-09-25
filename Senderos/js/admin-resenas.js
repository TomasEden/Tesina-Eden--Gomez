/* Senderos — admin-resenas.js
   Moderación de reseñas de servicios y productos.
*/

var todasResenas = [];
var filtroResenas = 'todas';
var busquedaResenas = '';
var resenaPendiente = null;
var botonResenaPendiente = null;

document.addEventListener('DOMContentLoaded', function () {
  function seguir(ok) {
    if (!ok) {
      return;
    }

    cablearResenas();
    cargarResenas();
  }

  if (typeof window.verificarAdministrador === 'function') {
    window.verificarAdministrador().then(seguir);
  } else {
    seguir(true);
  }
});

function cablearResenas() {
  var buscar = document.getElementById('buscarResena');

  if (buscar) {
    buscar.addEventListener('input', function () {
      busquedaResenas = String(buscar.value || '').toLowerCase();
      renderTablaResenas();
    });
  }

  document.querySelectorAll('#filtrosResenas .cfiltro').forEach(function (btn) {
    btn.addEventListener('click', function () {
      filtroResenas = btn.dataset.filtro || 'todas';

      document.querySelectorAll('#filtrosResenas .cfiltro').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });

      renderTablaResenas();
    });
  });
}

function esProducto(resena) {
  return (
    (resena.producto_id !== undefined && resena.producto_id !== null && Number(resena.producto_id) > 0) ||
    String(resena.servicio_slug || '').indexOf('producto-') === 0
  );
}

function nombreItem(resena) {
  if (esProducto(resena)) {
    return String(resena.producto_nombre || ('Producto #' + (resena.producto_id || '')));
  }

  return String(resena.servicio_slug || 'Servicio');
}

function cargarResenas() {
  return fetch('../api/resenas.php?todas=1', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.ok) {
          throw new Error((data && (data.error || data.mensaje)) || 'Error');
        }

        return Array.isArray(data.resenas) ? data.resenas : [];
      });
    })
    .then(function (resenas) {
      todasResenas = resenas;
      renderStatsResenas();
      renderTablaResenas();
    })
    .catch(function () {
      todasResenas = [];
      renderStatsResenas();
      renderTablaResenas();

      if (typeof window.showToast === 'function') {
        window.showToast('No se pudieron cargar las reseñas.');
      }
    });
}

function renderStatsResenas() {
  var cont = document.getElementById('resenasStats');

  if (!cont) {
    return;
  }

  cont.innerHTML = '';

  var prom =
    todasResenas.length > 0
      ? todasResenas.reduce(function (acc, r) {
          return acc + (Number(r.estrellas) || 0);
        }, 0) / todasResenas.length
      : 0;

  [
    [String(todasResenas.length), 'Total reseñas', ''],
    [prom.toFixed(1) + ' ★', 'Promedio', 'cstat-green'],
    [
      String(
        todasResenas.filter(function (r) {
          return !esProducto(r);
        }).length
      ),
      'De servicios',
      ''
    ],
    [
      String(
        todasResenas.filter(function (r) {
          return esProducto(r);
        }).length
      ),
      'De productos',
      ''
    ]
  ].forEach(function (stat) {
    var box = document.createElement('div');
    box.className = 'cstat';

    var num = document.createElement('div');
    num.className = 'cstat-num ' + stat[2];
    num.textContent = stat[0];

    var lbl = document.createElement('div');
    lbl.className = 'cstat-lbl';
    lbl.textContent = stat[1];

    box.appendChild(num);
    box.appendChild(lbl);
    cont.appendChild(box);
  });
}

function renderTablaResenas() {
  var tbody = document.getElementById('tbodyResenas');
  var empty = document.getElementById('tablaVaciaResenas');

  if (!tbody) {
    return;
  }

  tbody.innerHTML = '';

  var lista = todasResenas.filter(function (r) {
    if (filtroResenas === 'servicios' && esProducto(r)) {
      return false;
    }

    if (filtroResenas === 'productos' && !esProducto(r)) {
      return false;
    }

    if (busquedaResenas) {
      var texto = (
        nombreItem(r) +
        ' ' +
        String(r.nombre_usuario || '') +
        ' ' +
        String(r.texto || '')
      ).toLowerCase();

      if (texto.indexOf(busquedaResenas) === -1) {
        return false;
      }
    }

    return true;
  });

  if (!lista.length) {
    if (empty) {
      empty.classList.remove('hidden');
    }

    return;
  }

  if (empty) {
    empty.classList.add('hidden');
  }

  lista.forEach(function (r) {
    var tr = document.createElement('tr');

    var tdItem = document.createElement('td');
    var tipo = document.createElement('div');
    tipo.style.fontSize = '0.68rem';
    tipo.style.textTransform = 'uppercase';
    tipo.style.letterSpacing = '0.08em';
    tipo.textContent = esProducto(r) ? 'Producto' : 'Servicio';
    tdItem.appendChild(tipo);

    var nombre = document.createElement('strong');
    nombre.textContent = nombreItem(r);
    tdItem.appendChild(nombre);
    tr.appendChild(tdItem);

    var tdCliente = document.createElement('td');
    tdCliente.className = 'td-light';
    tdCliente.textContent =
      String(r.nombre_usuario || '') +
      (r.autor_email ? ' (' + r.autor_email + ')' : '');
    tr.appendChild(tdCliente);

    var tdEst = document.createElement('td');
    var estrellas = Math.max(1, Math.min(5, Number(r.estrellas) || 0));
    tdEst.textContent = '★★★★★'.slice(0, estrellas) + '☆☆☆☆☆'.slice(0, 5 - estrellas);
    tr.appendChild(tdEst);

    var tdTexto = document.createElement('td');
    tdTexto.className = 'td-light';
    tdTexto.style.maxWidth = '320px';
    tdTexto.textContent = String(r.texto || '');
    tr.appendChild(tdTexto);

    var tdFecha = document.createElement('td');
    tdFecha.className = 'td-light';
    tdFecha.textContent = r.creado_en
      ? new Date(String(r.creado_en).replace(' ', 'T')).toLocaleDateString('es-AR')
      : '—';
    tr.appendChild(tdFecha);

    var tdAcc = document.createElement('td');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-icon danger';
    btn.title = 'Eliminar';
    btn.setAttribute('aria-label', 'Eliminar reseña');

    var img = document.createElement('img');
    img.src = '../img/icons/basura.svg';
    img.alt = '';
    img.width = 15;
    img.height = 15;
    btn.appendChild(img);

    btn.addEventListener('click', function () {
      pedirConfirmacionResena(Number(r.id), btn);
    });

    tdAcc.appendChild(btn);
    tr.appendChild(tdAcc);

    tbody.appendChild(tr);
  });
}

/* Antes de borrar: modal de confirmación (sin alert/confirm nativos). */
function pedirConfirmacionResena(id, btn) {
  var resena = todasResenas.find(function (r) {
    return Number(r.id) === Number(id);
  });

  var desc = document.getElementById('descEliminarResena');

  if (desc) {
    desc.textContent = resena
      ? 'Vas a eliminar la reseña de ' + nombreItem(resena) + '. Esta acción no se puede deshacer.'
      : 'Esta acción no se puede deshacer.';
  }

  resenaPendiente = Number(id);
  botonResenaPendiente = btn || null;

  var modal = document.getElementById('modalEliminarResena');

  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function cerrarConfirmacionResena() {
  var modal = document.getElementById('modalEliminarResena');

  if (modal) {
    modal.classList.add('hidden');
  }

  resenaPendiente = null;
  botonResenaPendiente = null;

  if (!document.querySelector('.modal-overlay:not(.hidden)')) {
    document.body.style.overflow = '';
  }
}

function confirmarEliminarResena() {
  var id = resenaPendiente;
  var btn = botonResenaPendiente;

  cerrarConfirmacionResena();

  if (id) {
    eliminarResena(id, btn);
  }
}

function eliminarResena(id, btn) {
  if (btn) {
    btn.disabled = true;
  }

  fetch('../api/resenas.php', {
    method: 'DELETE',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: id })
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.ok) {
          throw new Error((data && (data.error || data.mensaje)) || 'Error al eliminar');
        }
      });
    })
    .then(function () {
      todasResenas = todasResenas.filter(function (r) {
        return Number(r.id) !== Number(id);
      });
      renderStatsResenas();
      renderTablaResenas();

      if (typeof window.showToast === 'function') {
        window.showToast('Reseña eliminada');
      }
    })
    .catch(function (error) {
      if (btn) {
        btn.disabled = false;
      }

      if (typeof window.showToast === 'function') {
        window.showToast(error.message || 'No se pudo eliminar.');
      }
    });
}
