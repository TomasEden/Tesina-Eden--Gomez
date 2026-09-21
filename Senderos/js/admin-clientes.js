/* ═══════════════════════════════════════
   Senderos — admin-clientes.js
   Rol verificado por la API, created_at real y HTML escapado.
   ═══════════════════════════════════════ */

var todosClientes = [];
var filtroActual = 'todos';
var busquedaActual = '';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.verificarAdministrador === 'function') {
    window.verificarAdministrador().then(function (ok) {
      if (ok) {
        cablearClientes();
        cargarClientes();
        activarRefreshAdmin(cargarClientes, 30000);
      }
    });
  } else {
    cablearClientes();
    cargarClientes();
    activarRefreshAdmin(cargarClientes, 30000);
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

function cablearClientes() {
  var buscar = document.getElementById('buscarCliente');

  if (buscar) {
    buscar.addEventListener('input', function () {
      filtrarClientes(buscar.value);
    });
  }

  document.querySelectorAll('.cfiltro').forEach(function (btn) {
    btn.addEventListener('click', function () {
      aplicarFiltro(btn.dataset.filtro || 'todos', btn);
    });
  });

  var exportar = document.querySelector('.btn-export');

  if (exportar) {
    exportar.addEventListener('click', exportarCSV);
  }

  var modal = document.getElementById('modalCliente');

  if (modal) {
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        cerrarModal();
      }
    });

    var cerrar = modal.querySelector('.modal-close');

    if (cerrar) {
      cerrar.addEventListener('click', cerrarModal);
    }
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      cerrarModal();
    }
  });
}

function fechaRegistro(cliente) {
  return cliente.created_at || cliente.createdAt || null;
}

/* ── CARGAR CLIENTES ── */
function cargarClientes() {
  return Promise.all([
    fetch('../api/clientes.php', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); }),
    fetch('../api/turnos.php?todos=1', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); }),
    fetch('../api/pedidos.php?todos=1', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); })
  ])
    .then(function (resultados) {
      var usuarios = Array.isArray(resultados[0] && resultados[0].clientes) ? resultados[0].clientes : [];
      var turnos = Array.isArray(resultados[1] && resultados[1].turnos) ? resultados[1].turnos : [];
      var pedidos = Array.isArray(resultados[2] && resultados[2].pedidos) ? resultados[2].pedidos : [];

      todosClientes = usuarios.map(function (u) {
        var turnosUsuario = turnos.filter(function (t) {
          return Number(t.usuario_id) === Number(u.id);
        });
        var pedidosUsuario = pedidos.filter(function (p) {
          return Number(p.usuario_id) === Number(u.id);
        });
        var gastoTotal = pedidosUsuario.reduce(function (s, p) {
          return s + (Number(p.total) || 0);
        }, 0);

        return {
          id: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          telefono: u.telefono,
          created_at: u.created_at || u.createdAt || null,
          turnos: turnosUsuario,
          pedidos: pedidosUsuario,
          gastoTotal: gastoTotal
        };
      });

      renderStats();
      renderTabla(todosClientes);
    })
    .catch(function () {
      todosClientes = [];
      renderStats();
      renderTabla([]);

      if (typeof window.showToast === 'function') {
        window.showToast('No pudimos cargar los clientes.');
      }
    });
}

/* ── STATS ── */
function renderStats() {
  var cont = document.getElementById('clientesStats');

  if (!cont) {
    return;
  }

  cont.innerHTML = '';

  var total = todosClientes.length;
  var conTurnos = todosClientes.filter(function (c) { return (c.turnos || []).length > 0; }).length;
  var conPedidos = todosClientes.filter(function (c) { return (c.pedidos || []).length > 0; }).length;
  var hace30 = Date.now() - 86400000 * 30;
  var recientes = todosClientes.filter(function (c) {
    var f = fechaRegistro(c);
    return f && new Date(f).getTime() >= hace30;
  }).length;
  var gastoTotal = todosClientes.reduce(function (s, c) { return s + (c.gastoTotal || 0); }, 0);

  [
    [String(total), 'Total clientes', ''],
    [String(conTurnos), 'Con turnos', ''],
    [String(conPedidos), 'Con pedidos', ''],
    [String(recientes), 'Nuevos (30 días)', ''],
    ['$' + Number(gastoTotal).toLocaleString('es-AR'), 'Gasto total', 'cstat-green']
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

/* ── TABLA ── */
function renderTabla(lista) {
  var tbody = document.getElementById('tbodyClientes');
  var empty = document.getElementById('tablaVacia');

  if (!tbody) {
    return;
  }

  tbody.innerHTML = '';

  if (!lista.length) {
    if (empty) {
      empty.classList.remove('hidden');
    }

    return;
  }

  if (empty) {
    empty.classList.add('hidden');
  }

  lista.forEach(function (c) {
    var nTurnos = (c.turnos || []).length;
    var nPedidos = (c.pedidos || []).length;
    var f = fechaRegistro(c);
    var fecha = f
      ? new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';
    var inicial = String(c.nombre || '?').charAt(0).toUpperCase();
    var colores = ['#AD717E', '#45634D', '#d4850a', '#3b7be8'];
    var color = colores[Number(c.id) % 4] || '#AD717E';

    var tr = document.createElement('tr');

    var tdCliente = document.createElement('td');
    var wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '0.7rem';

    var avatar = document.createElement('div');
    avatar.style.cssText = 'width:36px;height:36px;border-radius:50%;background:' + color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-family:\'Cormorant Garamond\',serif;font-size:1.1rem;font-weight:600;flex-shrink:0';
    avatar.textContent = inicial;

    var nombreBox = document.createElement('div');
    var nombreEl = document.createElement('div');
    nombreEl.style.fontWeight = '600';
    nombreEl.textContent = String(c.nombre || '') + ' ' + String(c.apellido || '');
    nombreBox.appendChild(nombreEl);

    wrap.appendChild(avatar);
    wrap.appendChild(nombreBox);
    tdCliente.appendChild(wrap);
    tr.appendChild(tdCliente);

    var tdEmail = document.createElement('td');
    tdEmail.style.fontSize = '0.82rem';
    tdEmail.textContent = c.email || '—';
    tr.appendChild(tdEmail);

    var tdTel = document.createElement('td');
    tdTel.style.fontSize = '0.82rem';
    tdTel.textContent = c.telefono || '—';
    tr.appendChild(tdTel);

    var tdT = document.createElement('td');
    var bT = document.createElement('span');
    bT.className = 'badge-count' + (nTurnos > 0 ? ' green' : '');
    bT.textContent = String(nTurnos);
    tdT.appendChild(bT);
    tr.appendChild(tdT);

    var tdP = document.createElement('td');
    var bP = document.createElement('span');
    bP.className = 'badge-count' + (nPedidos > 0 ? ' pink' : '');
    bP.textContent = String(nPedidos);
    tdP.appendChild(bP);
    tr.appendChild(tdP);

    var tdG = document.createElement('td');
    var g = document.createElement('strong');
    g.style.fontFamily = "'Cormorant Garamond',serif";
    g.style.fontSize = '1.05rem';
    g.textContent = c.gastoTotal > 0 ? '$' + Number(c.gastoTotal).toLocaleString('es-AR') : '—';
    tdG.appendChild(g);
    tr.appendChild(tdG);

    var tdF = document.createElement('td');
    tdF.style.fontSize = '0.78rem';
    tdF.textContent = fecha;
    tr.appendChild(tdF);

    var tdA = document.createElement('td');
    var acc = document.createElement('div');
    acc.style.display = 'flex';
    acc.style.gap = '0.4rem';

    var ver = document.createElement('button');
    ver.type = 'button';
    ver.className = 'table-action-btn';
    ver.title = 'Ver detalle';
    ver.setAttribute('aria-label', 'Ver detalle de ' + String(c.nombre || 'cliente'));

    var verImg = document.createElement('img');
    verImg.src = '../img/icons/ver.svg';
    verImg.alt = '';
    verImg.width = 14;
    verImg.height = 14;
    ver.appendChild(verImg);
    ver.addEventListener('click', function () {
      verCliente(Number(c.id));
    });
    acc.appendChild(ver);

    var tel = String(c.telefono || '').replace(/\D/g, '');
    var wa = document.createElement('a');
    wa.className = 'table-action-btn';
    wa.target = '_blank';
    wa.title = 'WhatsApp';
    wa.style.textDecoration = 'none';
    wa.href = 'https://wa.me/549' + tel + '?text=' + encodeURIComponent('Hola ' + String(c.nombre || '') + ', te contactamos desde Senderos.');

    var waImg = document.createElement('img');
    waImg.src = '../img/icons/whatsapp.svg';
    waImg.alt = '';
    waImg.width = 15;
    waImg.height = 15;
    wa.appendChild(waImg);
    acc.appendChild(wa);

    tdA.appendChild(acc);
    tr.appendChild(tdA);

    tbody.appendChild(tr);
  });
}

/* ── FILTROS ── */
function filtrarClientes(q) {
  busquedaActual = String(q || '').toLowerCase();
  aplicarFiltros();
}

function aplicarFiltro(filtro, btn) {
  filtroActual = filtro || 'todos';

  document.querySelectorAll('.cfiltro').forEach(function (b) {
    b.classList.remove('active');
  });

  if (btn) {
    btn.classList.add('active');
  }

  aplicarFiltros();
}

function aplicarFiltros() {
  var hace30 = Date.now() - 86400000 * 30;
  var lista = todosClientes.slice();

  if (filtroActual === 'con-turnos') {
    lista = lista.filter(function (c) { return (c.turnos || []).length > 0; });
  }

  if (filtroActual === 'con-pedidos') {
    lista = lista.filter(function (c) { return (c.pedidos || []).length > 0; });
  }

  if (filtroActual === 'recientes') {
    lista = lista.filter(function (c) {
      var f = fechaRegistro(c);
      return f && new Date(f).getTime() >= hace30;
    });
  }

  if (busquedaActual) {
    lista = lista.filter(function (c) {
      return (
        (String(c.nombre || '') + ' ' + String(c.apellido || '')).toLowerCase().indexOf(busquedaActual) !== -1 ||
        String(c.email || '').toLowerCase().indexOf(busquedaActual) !== -1
      );
    });
  }

  renderTabla(lista);
}

/* ── MODAL DETALLE ── */
function verCliente(id) {
  var c = todosClientes.find(function (x) {
    return Number(x.id) === Number(id);
  });

  if (!c) {
    return;
  }

  var contenido = document.getElementById('modalClienteContent');

  if (!contenido) {
    return;
  }

  contenido.innerHTML = '';

  var nTurnos = (c.turnos || []).length;
  var nPedidos = (c.pedidos || []).length;
  var f = fechaRegistro(c);
  var fecha = f
    ? new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  var head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;gap:1.2rem;margin-bottom:1.5rem';

  var avatar = document.createElement('div');
  avatar.style.cssText = 'width:60px;height:60px;border-radius:50%;background:#AD717E;color:#fff;display:flex;align-items:center;justify-content:center;font-family:\'Cormorant Garamond\',serif;font-size:1.8rem;font-weight:600;flex-shrink:0';
  avatar.textContent = String(c.nombre || '?').charAt(0).toUpperCase();
  head.appendChild(avatar);

  var datos = document.createElement('div');
  var h2 = document.createElement('h2');
  h2.style.cssText = "font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:300;margin:0";
  h2.textContent = String(c.nombre || '') + ' ' + String(c.apellido || '');
  datos.appendChild(h2);

  var mail = document.createElement('p');
  mail.style.cssText = 'font-size:0.82rem;margin:0.2rem 0 0';
  mail.textContent = c.email || '';
  datos.appendChild(mail);

  head.appendChild(datos);
  contenido.appendChild(head);

  var stats = document.createElement('div');
  stats.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem;margin-bottom:1.5rem';

  [
    [String(nTurnos), 'Turnos'],
    [String(nPedidos), 'Pedidos'],
    ['$' + Number(c.gastoTotal || 0).toLocaleString('es-AR'), 'Gasto total']
  ].forEach(function (s) {
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--cream);border-radius:10px;padding:0.8rem;text-align:center';

    var num = document.createElement('div');
    num.style.cssText = "font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600";
    num.textContent = s[0];

    var lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em';
    lbl.textContent = s[1];

    box.appendChild(num);
    box.appendChild(lbl);
    stats.appendChild(box);
  });

  contenido.appendChild(stats);

  var contacto = document.createElement('p');
  contacto.style.fontSize = '0.88rem';
  contacto.textContent = 'Teléfono: ' + String(c.telefono || '—') + ' · Registrado: ' + fecha;
  contenido.appendChild(contacto);

  var modal = document.getElementById('modalCliente');

  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function cerrarModal() {
  var modal = document.getElementById('modalCliente');

  if (modal) {
    modal.classList.add('hidden');
  }

  document.body.style.overflow = '';
}

/* ── EXPORTAR CSV ── */
function exportarCSV() {
  var headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Turnos', 'Pedidos', 'Gasto Total', 'Registro'];
  var rows = todosClientes.map(function (c) {
    var f = fechaRegistro(c);

    return [
      c.nombre || '',
      c.apellido || '',
      c.email || '',
      c.telefono || '',
      (c.turnos || []).length,
      (c.pedidos || []).length,
      c.gastoTotal || 0,
      f ? new Date(f).toLocaleDateString('es-AR') : ''
    ];
  });

  var csv = [headers].concat(rows)
    .map(function (r) {
      return r.map(function (v) {
        return '"' + String(v).replace(/"/g, '""') + '"';
      }).join(',');
    })
    .join('\n');

  var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'senderos-clientes-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  URL.revokeObjectURL(url);

  if (typeof window.showToast === 'function') {
    window.showToast('CSV exportado');
  }
}
