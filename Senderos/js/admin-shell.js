/* ═══════════════════════════════════════════════════════════════
   Senderos — admin-shell.js — Fase A
   Shell compartido del panel admin: guardia de admin por api/sesion.php,
   nombre del usuario, menú móvil colapsable, modo oscuro flotante
   y cierre de sesión real por api/logout.php.
   No cargar layout.js ni sesion.js en el admin.
   ═══════════════════════════════════════════════════════════════ */

var __adminUsuario = null;

document.addEventListener('DOMContentLoaded', function () {
  cablearMenuAdmin();
  verificarAdminShell();

  if (typeof window.initDarkmodeButtons === 'function') {
    window.initDarkmodeButtons();
  }

  var btnLogout = document.getElementById('btnAdminLogout');

  if (btnLogout) {
    btnLogout.addEventListener('click', cerrarSesion);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') {
      return;
    }

    var sidebar = document.querySelector('.admin-sidebar');

    if (sidebar && sidebar.classList.contains('open')) {
      cerrarMenuAdmin();
    }
  });
});

function verificarAdminShell() {
  return fetch('../api/sesion.php', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (data) {
      if (!data || !data.ok || !data.logueado || !data.usuario || data.usuario.rol !== 'admin') {
        window.location.href = 'admin-login.html';
        return null;
      }

      __adminUsuario = data.usuario;
      pintarUsuarioAdmin(data.usuario);

      return data.usuario;
    })
    .catch(function () {
      window.location.href = 'admin-login.html';
      return null;
    });
}

/* Guardia compartida para los scripts de cada sección.
   Se expone solo si la página no define la suya, con el mismo criterio que
   los fallbacks de escapeHTML/showToast: admin-dashboard, admin-productos,
   admin-pedidos y admin-turnos declaran la propia (y además pintan el rol
   del sidebar), y al cargar el shell al último se pisaría. */
if (typeof window.verificarAdministrador !== 'function') {
  window.verificarAdministrador = function () {
    if (__adminUsuario && __adminUsuario.rol === 'admin') {
      return Promise.resolve(true);
    }

    return verificarAdminShell().then(function (usuario) {
      return Boolean(usuario);
    });
  };
}

function adminUsuarioActual() {
  return __adminUsuario;
}

function pintarUsuarioAdmin(usuario) {
  var nombre = document.querySelector('.sidebar-user-name');

  if (nombre) {
    nombre.textContent = [usuario.nombre, usuario.apellido]
      .filter(Boolean)
      .join(' ') || 'Administrador';
  }

  var avatar = document.querySelector('.sidebar-avatar');

  if (avatar) {
    var inicial = String(usuario.nombre || 'A').charAt(0).toUpperCase();
    avatar.textContent = inicial || 'A';
  }
}

/* Mismo criterio: si la página ya trae su cerrarSesion(), se usa la suya. */
if (typeof window.cerrarSesion !== 'function') {
  window.cerrarSesion = function () {
    fetch('../api/logout.php', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store'
    })
      .catch(function () {})
      .finally(function () {
        window.location.href = 'admin-login.html';
      });
  };
}

function cablearMenuAdmin() {
  var toggle = document.getElementById('adminMenuToggle');
  var sidebar = document.querySelector('.admin-sidebar');
  var backdrop = document.getElementById('adminMenuBackdrop');

  if (!toggle || !sidebar) {
    return;
  }

  toggle.addEventListener('click', function () {
    if (window.innerWidth > 900) {
      var colapsado = document.body.classList.toggle('admin-colapsado');

      toggle.setAttribute('aria-expanded', String(!colapsado));
      toggle.setAttribute(
        'aria-label',
        colapsado ? 'Abrir menú de administración' : 'Cerrar menú de administración'
      );
      return;
    }

    var abierto = sidebar.classList.toggle('open');

    toggle.setAttribute('aria-expanded', String(abierto));
    toggle.setAttribute(
      'aria-label',
      abierto ? 'Cerrar menú de administración' : 'Abrir menú de administración'
    );

    if (backdrop) {
      backdrop.classList.toggle('open', abierto);
      backdrop.setAttribute('aria-hidden', String(!abierto));
    }

    if (abierto) {
      document.body.style.overflow = 'hidden';
      var primero = sidebar.querySelector('a, button');
      if (primero) {
        try {
          primero.focus({ preventScroll: true });
        } catch (e) {}
      }
    } else if (!document.querySelector('.modal-overlay.show, .modal-overlay.active')) {
      document.body.style.overflow = '';
    }
  });

  function cerrar() {
    cerrarMenuAdmin();
  }

  if (backdrop) {
    backdrop.addEventListener('click', cerrar);
  }

  sidebar.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 900) {
        cerrar();
      }
    });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) {
      var sb = document.querySelector('.admin-sidebar');
      var bd = document.getElementById('adminMenuBackdrop');
      if (sb) {
        sb.classList.remove('open');
      }
      if (bd) {
        bd.classList.remove('open');
      }
      if (!document.body.classList.contains('admin-colapsado')) {
        document.body.style.overflow = '';
      }
      toggle.setAttribute(
        'aria-expanded',
        String(!document.body.classList.contains('admin-colapsado'))
      );
    }
  });
}

function cerrarMenuAdmin() {
  var toggle = document.getElementById('adminMenuToggle');
  var sidebar = document.querySelector('.admin-sidebar');
  var backdrop = document.getElementById('adminMenuBackdrop');

  if (sidebar) {
    sidebar.classList.remove('open');
  }

  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de administración');
  }

  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  if (!document.querySelector('.modal-overlay.show, .modal-overlay.active')) {
    document.body.style.overflow = '';
  }
}

/* Compatibilidad: solo si la página no trae sus propias versiones
   (algunas secciones admin definen las suyas con íconos).

   ⚠ NO volver a declarar escapeHTML() ni showToast() con `function` a
   nivel global en este archivo: admin-shell.js se carga el último de
   cada HTML, esas declaraciones se elevan (hoisting), pisan las
   versiones propias de cada página y cada llamada se invoca a sí misma
   sin fin (RangeError: Maximum call stack size exceeded), cortando el
   render de las tablas. Solo se asignan como respaldo en window. */
if (typeof window.escapeHTML !== 'function') {
  window.escapeHTML = function (valor) {
    return String(valor === undefined || valor === null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
}

if (typeof window.showToast !== 'function') {
  window.showToast = function (mensaje) {
    var toast = document.getElementById('toast');

    if (!toast) {
      return;
    }

    toast.textContent = String(mensaje || '');
    toast.classList.add('show');

    clearTimeout(toast._tm);

    toast._tm = setTimeout(function () {
      toast.classList.remove('show');
    }, 2600);
  };
}

/* Fin del archivo: acá antes había declaraciones `function escapeHTML(...)`
   y `function showToast(...)`, que rompían el panel con recursión infinita
   (RangeError: Maximum call stack size exceeded).
   No volver a agregarlas con `function` a nivel global. */
