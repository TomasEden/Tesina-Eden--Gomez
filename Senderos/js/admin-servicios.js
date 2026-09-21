/* =========================================================
   SENDEROS — admin-servicios.js
   Badge, badge_texto e incluye incluidos; categoría con
   sugerencias reales de la base; HTML escapado.
   ========================================================= */

var API_URL = '../api/servicios.php';

var servicios = [];
var eliminarId = null;

document.addEventListener('DOMContentLoaded', function () {
  function seguir(ok) {
    if (!ok) {
      return;
    }

    cablearServicios();
    cargarServicios();
    activarRefreshAdmin(cargarServicios, 30000);
  }

  if (typeof window.verificarAdministrador === 'function') {
    window.verificarAdministrador().then(seguir);
  } else {
    seguir(true);
  }
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

function cablearServicios() {
  var buscar = document.getElementById('searchInput');

  if (buscar) {
    buscar.addEventListener('input', filtrar);
  }

  document.querySelectorAll('[data-cerrar-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      cerrarModal(btn.dataset.cerrarModal);
    });
  });

  var btnNuevo = document.querySelector('[data-nuevo-servicio]');

  if (btnNuevo) {
    btnNuevo.addEventListener('click', abrirModalNuevo);
  }

  var btnGuardar = document.querySelector('[data-guardar-servicio]');

  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarServicio);
  }

  var btnEliminar = document.querySelector('[data-confirmar-eliminar]');

  if (btnEliminar) {
    btnEliminar.addEventListener('click', confirmarEliminar);
  }
}

/* ── CARGAR ── */

function cargarServicios() {
  return fetch(API_URL, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (!data.ok) {
        throw new Error(data.error || data.mensaje || 'Error al cargar servicios');
      }

      servicios = Array.isArray(data.servicios) ? data.servicios : [];

      poblarCategorias();
      renderTabla(servicios);
    })
    .catch(function () {
      if (typeof window.showToast === 'function') {
        window.showToast('Error de conexión con el servidor');
      }
    });
}

/* Categorías reales como sugerencias (no pisa la guardada). */
function poblarCategorias() {
  var lista = document.getElementById('datalistCategorias');

  if (!lista) {
    return;
  }

  lista.innerHTML = '';

  var categorias = Array.from(
    new Set(
      servicios
        .map(function (s) { return String(s.categoria || '').trim(); })
        .filter(Boolean)
    )
  ).sort(function (a, b) { return a.localeCompare(b, 'es'); });

  categorias.forEach(function (cat) {
    var opt = document.createElement('option');
    opt.value = cat;
    lista.appendChild(opt);
  });
}

/* ── TABLA ── */

function renderTabla(lista) {
  var tbody = document.getElementById('serviciosBody');

  if (!tbody) {
    return;
  }

  tbody.innerHTML = '';

  if (!lista.length) {
    var trVacio = document.createElement('tr');
    var tdVacio = document.createElement('td');
    tdVacio.colSpan = 5;
    tdVacio.textContent = 'No hay servicios para mostrar.';
    trVacio.appendChild(tdVacio);
    tbody.appendChild(trVacio);
    return;
  }

  lista.forEach(function (servicio) {
    var tr = document.createElement('tr');

    var tdNombre = document.createElement('td');
    var strong = document.createElement('strong');
    strong.textContent = String(servicio.nombre || '');
    tdNombre.appendChild(strong);

    var desc = String(servicio.descripcion || '').substring(0, 45);

    if (desc) {
      tdNombre.appendChild(document.createElement('br'));

      var light = document.createElement('span');
      light.className = 'td-light';
      light.textContent = desc + '...';
      tdNombre.appendChild(light);
    }

    if (servicio.badge) {
      tdNombre.appendChild(document.createElement('br'));

      var badge = document.createElement('span');
      badge.className = 'td-light';
      badge.textContent = 'Badge: ' + String(servicio.badge_texto || servicio.badge);
      tdNombre.appendChild(badge);
    }

    tr.appendChild(tdNombre);

    var tdCat = document.createElement('td');
    tdCat.className = 'td-light';
    tdCat.textContent = String(servicio.categoria || '');
    tr.appendChild(tdCat);

    var tdDur = document.createElement('td');
    tdDur.className = 'td-light';
    tdDur.textContent = String(servicio.duracion || 0) + ' min';
    tr.appendChild(tdDur);

    var tdPrecio = document.createElement('td');
    var strongPrecio = document.createElement('strong');
    strongPrecio.textContent = '$' + Number(servicio.precio || 0).toLocaleString('es-AR');
    tdPrecio.appendChild(strongPrecio);
    tr.appendChild(tdPrecio);

    var tdAcc = document.createElement('td');
    var box = document.createElement('div');
    box.style.display = 'flex';
    box.style.gap = '0.4rem';

    var btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn-icon';
    btnEditar.title = 'Editar';
    btnEditar.setAttribute('aria-label', 'Editar servicio');

    var imgEditar = document.createElement('img');
    imgEditar.src = '../img/icons/formulario.svg';
    imgEditar.alt = '';
    imgEditar.width = 13;
    imgEditar.height = 13;
    btnEditar.appendChild(imgEditar);
    btnEditar.addEventListener('click', function () {
      abrirModalEditar(Number(servicio.id));
    });
    box.appendChild(btnEditar);

    var btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-icon danger';
    btnEliminar.title = 'Eliminar';
    btnEliminar.setAttribute('aria-label', 'Eliminar servicio');

    var imgEliminar = document.createElement('img');
    imgEliminar.src = '../img/icons/basura.svg';
    imgEliminar.alt = '';
    imgEliminar.width = 15;
    imgEliminar.height = 15;
    btnEliminar.appendChild(imgEliminar);
    btnEliminar.addEventListener('click', function () {
      abrirModalEliminar(Number(servicio.id));
    });
    box.appendChild(btnEliminar);

    tdAcc.appendChild(box);
    tr.appendChild(tdAcc);

    tbody.appendChild(tr);
  });
}

/* ── FILTRAR ── */

function filtrar() {
  var input = document.getElementById('searchInput');
  var q = input ? input.value.toLowerCase().trim() : '';

  renderTabla(
    servicios.filter(function (s) {
      return (
        String(s.nombre || '').toLowerCase().indexOf(q) !== -1 ||
        String(s.categoria || '').toLowerCase().indexOf(q) !== -1
      );
    })
  );
}

/* ── FORMULARIO ── */

function valor(id) {
  var el = document.getElementById(id);
  return el ? el.value : '';
}

function setValor(id, texto) {
  var el = document.getElementById(id);

  if (el) {
    el.value = texto;
  }
}

function limpiarForm() {
  ['fNombre', 'fDuracion', 'fPrecio', 'fImg', 'fDesc', 'fBadge', 'fBadgeTexto', 'fIncluye'].forEach(function (id) {
    setValor(id, '');
  });

  setValor('editId', '');
  setValor('fCategoria', '');

  ['err-nombre', 'err-duracion', 'err-precio'].forEach(function (id) {
    var el = document.getElementById(id);

    if (el) {
      el.textContent = '';
    }
  });
}

function abrirModalNuevo() {
  limpiarForm();

  var titulo = document.getElementById('modalFormTitle');

  if (titulo) {
    titulo.textContent = 'Nuevo servicio';
  }

  var modal = document.getElementById('modalForm');

  if (modal) {
    modal.classList.remove('hidden');
  }
}

function abrirModalEditar(id) {
  var servicio = servicios.find(function (item) {
    return Number(item.id) === Number(id);
  });

  if (!servicio) {
    return;
  }

  limpiarForm();

  var titulo = document.getElementById('modalFormTitle');

  if (titulo) {
    titulo.textContent = 'Editar servicio';
  }

  setValor('editId', String(servicio.id));
  setValor('fNombre', String(servicio.nombre || ''));
  setValor('fCategoria', String(servicio.categoria || ''));
  setValor('fDuracion', String(servicio.duracion || ''));
  setValor('fPrecio', String(servicio.precio || ''));
  setValor('fImg', String(servicio.imagen || ''));
  setValor('fDesc', String(servicio.descripcion || ''));
  setValor('fBadge', String(servicio.badge || ''));
  setValor('fBadgeTexto', String(servicio.badge_texto || ''));
  setValor('fIncluye', String(servicio.incluye || ''));

  var modal = document.getElementById('modalForm');

  if (modal) {
    modal.classList.remove('hidden');
  }
}

function guardarServicio() {
  var nombre = valor('fNombre').trim();
  var categoria = valor('fCategoria').trim();
  var duracion = parseInt(valor('fDuracion'), 10);
  var precio = parseFloat(valor('fPrecio'));

  var valido = true;

  function marcar(id, mensaje) {
    var el = document.getElementById(id);

    if (el) {
      el.textContent = mensaje;
    }

    valido = false;
  }

  var eN = document.getElementById('err-nombre');
  var eD = document.getElementById('err-duracion');
  var eP = document.getElementById('err-precio');

  if (eN) {
    eN.textContent = '';
  }

  if (eD) {
    eD.textContent = '';
  }

  if (eP) {
    eP.textContent = '';
  }

  if (!nombre) {
    marcar('err-nombre', 'El nombre es obligatorio');
  }

  if (!categoria) {
    if (typeof window.showToast === 'function') {
      window.showToast('La categoría es obligatoria');
    }

    valido = false;
  }

  if (!duracion || duracion <= 0) {
    marcar('err-duracion', 'Ingresá una duración válida');
  }

  if (!Number.isFinite(precio) || precio < 0) {
    marcar('err-precio', 'Ingresá un precio válido');
  }

  if (!valido) {
    return;
  }

  var data = {
    nombre: nombre,
    categoria: categoria,
    duracion: duracion,
    precio: precio,
    imagen: valor('fImg').trim(),
    descripcion: valor('fDesc').trim(),
    badge: valor('fBadge').trim(),
    badge_texto: valor('fBadgeTexto').trim(),
    incluye: valor('fIncluye').trim()
  };

  var editId = valor('editId');
  var metodo = editId ? 'PUT' : 'POST';

  if (editId) {
    data.id = parseInt(editId, 10);
  }

  fetch(API_URL, {
    method: metodo,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data)
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (res) {
      if (!res.ok) {
        throw new Error(res.error || res.mensaje || 'Error al guardar');
      }

      if (typeof window.showToast === 'function') {
        window.showToast(editId ? 'Servicio actualizado' : 'Servicio creado');
      }

      cerrarModal('modalForm');
      cargarServicios();
    })
    .catch(function (error) {
      if (typeof window.showToast === 'function') {
        window.showToast(error.message || 'Error de conexión con el servidor');
      }
    });
}

/* ── ELIMINAR ── */

function abrirModalEliminar(id) {
  eliminarId = Number(id);

  var modal = document.getElementById('modalEliminar');

  if (modal) {
    modal.classList.remove('hidden');
  }
}

function confirmarEliminar() {
  if (!eliminarId) {
    return;
  }

  fetch(API_URL, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: eliminarId })
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (res) {
      if (!res.ok) {
        throw new Error(res.error || res.mensaje || 'Error al eliminar');
      }

      cerrarModal('modalEliminar');

      if (typeof window.showToast === 'function') {
        window.showToast('Servicio eliminado');
      }

      eliminarId = null;
      cargarServicios();
    })
    .catch(function (error) {
      if (typeof window.showToast === 'function') {
        window.showToast(error.message || 'Error de conexión con el servidor');
      }
    });
}

function cerrarModal(id) {
  var modal = document.getElementById(id);

  if (modal) {
    modal.classList.add('hidden');
  }
}
