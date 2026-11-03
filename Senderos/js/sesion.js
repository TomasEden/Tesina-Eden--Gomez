/* ═══════════════════════════════════════
   Senderos — sesion.js — Fase A
   La sesión visible se sincroniza con api/sesion.php (fuente de verdad).
   El contador del carrito sale de api/carrito.php.
   Sin referencias a carrito legacy en storage.
   Menú móvil accesible: Escape, backdrop, aria-expanded,
   bloqueo de scroll y cierre por delegación.
   ═══════════════════════════════════════ */

var __sesionUsuario = null;
var __sesionVerificada = false;
var __sesionPromise = null;

function getSesion() {
  if (__sesionUsuario) {
    return __sesionUsuario;
  }

  try {
    var local =
      window.localStorage.getItem('senderos-sesion') ||
      window.localStorage.getItem('sesion') ||
      window.sessionStorage.getItem('sesion');

    if (local) {
      var parsed = JSON.parse(local);

      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

function guardarSesionLocal(usuario) {
  try {
    if (usuario) {
      window.localStorage.setItem(
        'senderos-sesion',
        JSON.stringify(usuario)
      );
    } else {
      window.localStorage.removeItem('senderos-sesion');
    }

    window.localStorage.removeItem('sesion');
    window.sessionStorage.removeItem('sesion');
  } catch (e) {}
}

function consultarSesionServidor() {
  if (!__sesionPromise) {
    __sesionPromise = fetch('../api/sesion.php', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        __sesionVerificada = true;

        if (data && data.ok && data.logueado && data.usuario) {
          __sesionUsuario = data.usuario;
          guardarSesionLocal(data.usuario);
        } else {
          __sesionUsuario = null;
          guardarSesionLocal(null);
        }

        return __sesionUsuario;
      })
      .catch(function () {
        __sesionVerificada = true;
        return __sesionUsuario;
      })
      .finally(function () {
        __sesionPromise = null;
      });
  }

  return __sesionPromise;
}

function cerrarSesionCliente() {
  fetch('../api/logout.php', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store'
  })
    .catch(function () {})
    .finally(function () {
      __sesionUsuario = null;
      __sesionVerificada = true;
      guardarSesionLocal(null);

      try {
        window.localStorage.removeItem('redirectAfterLogin');
      } catch (e) {}

      window.location.href = 'index.html';
    });
}

function formatearContador(total) {
  var n = Number(total) || 0;
  if (n <= 0) {
    return '0';
  }
  if (n > 99) {
    return '99+';
  }
  return String(n);
}

function actualizarContadorCarrito() {
  var badges = [];

  ['contador', 'contadorMobile'].forEach(function (id) {
    var el = document.getElementById(id);

    if (el) {
      badges.push(el);
    }
  });

  if (!badges.length) {
    return;
  }

  fetch('../api/carrito.php', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (data) {
      if (!data || !data.ok || !data.carrito) {
        return;
      }

      var productos = Array.isArray(data.carrito.productos)
        ? data.carrito.productos.reduce(function (total, item) {
            return total + (Number(item.cantidad) || 0);
          }, 0)
        : 0;

      var servicios = Array.isArray(data.carrito.servicios)
        ? data.carrito.servicios.length
        : 0;

      var totalNum = productos + servicios;
      var total = formatearContador(totalNum);

      badges.forEach(function (el) {
        el.textContent = total;
        /* Badge círculo fijo: se muestra siempre para mantener
           la posición, pero con aria oculta (el link ya avisa). */
        el.hidden = false;
      });

      var linkCarrito = document.getElementById('navCartLink');
      if (linkCarrito) {
        linkCarrito.setAttribute(
          'aria-label',
          totalNum > 0
            ? 'Mi carrito, ' + String(totalNum) + ' artículos'
            : 'Mi carrito'
        );
      }
    })
    .catch(function () {});
}

function pintarSesionEnNavbar(usuario) {
  var btnEl = document.getElementById('btnSesion');

  if (btnEl) {
    // Remover dropdown viejo para repintar desde cero.
    var viejo = document.getElementById('navDropdown');

    if (viejo) {
      viejo.remove();
    }

    if (usuario) {
      btnEl.textContent = '';
      var ico = document.createElement('img');
      ico.src = '../img/icons/usuario.svg';
      ico.alt = '';
      ico.width = 14;
      ico.height = 14;
      ico.setAttribute('aria-hidden', 'true');
      btnEl.appendChild(ico);
      btnEl.appendChild(
        document.createTextNode(' ' + String(usuario.nombre || 'Mi cuenta'))
      );

      btnEl.href = 'mis-turnos.html';
      btnEl.classList.add('btn-sesion-activa');

      crearDropdownSesion(btnEl, usuario);
    } else {
      btnEl.textContent = 'Ingresar';
      btnEl.href = 'login.html';
      btnEl.classList.remove('btn-sesion-activa');
    }
  }

  var linkAdminMobile = document.getElementById('linkAdminMobile');

  if (linkAdminMobile) {
    linkAdminMobile.hidden = !(usuario && usuario.rol === 'admin');
  }

  sincronizarSesionMobile(usuario);
}

function crearDropdownSesion(btnEl, usuario) {
  var dropdown = document.createElement('div');

  dropdown.id = 'navDropdown';
  dropdown.className = 'nav-dropdown';
  dropdown.hidden = true;
  dropdown.setAttribute('role', 'menu');

  var esAdmin = usuario.rol === 'admin';

  var nombre = [usuario.nombre, usuario.apellido]
    .filter(Boolean)
    .join(' ') || 'Mi cuenta';

  var head = document.createElement('div');
  head.className = 'nav-dropdown-head';
  var nom = document.createElement('div');
  nom.className = 'nav-dropdown-nombre';
  nom.textContent = nombre;
  var mail = document.createElement('div');
  mail.className = 'nav-dropdown-mail';
  mail.textContent = String(usuario.email || '');
  head.appendChild(nom);
  head.appendChild(mail);
  dropdown.appendChild(head);

  function agregarLink(texto, href) {
    var a = document.createElement('a');
    a.className = 'nav-dropdown-link';
    a.href = href;
    a.setAttribute('role', 'menuitem');
    a.textContent = texto;
    dropdown.appendChild(a);
  }

  agregarLink('Mi cuenta', 'mis-turnos.html#tabCuenta');
  agregarLink('Mis turnos y pedidos', 'mis-turnos.html');
  agregarLink('Favoritos', 'favoritos.html');
  agregarLink('Mi carrito', 'carrito.html');
  if (esAdmin) {
    agregarLink('Panel admin', 'admin-dashboard.html');
  }

  var sep = document.createElement('div');
  sep.className = 'nav-dropdown-sep';
  dropdown.appendChild(sep);

  var btnCerrar = document.createElement('button');
  btnCerrar.type = 'button';
  btnCerrar.className = 'nav-dropdown-link nav-dropdown-logout';
  btnCerrar.id = 'btnCerrarSesionDesktop';
  btnCerrar.setAttribute('role', 'menuitem');
  btnCerrar.textContent = 'Cerrar sesión';
  btnCerrar.addEventListener('click', cerrarSesionCliente);
  dropdown.appendChild(btnCerrar);

  var wrap = btnEl.parentElement;

  if (wrap) {
    if (getComputedStyle(wrap).position === 'static') {
      wrap.style.position = 'relative';
    }

    wrap.appendChild(dropdown);
  } else {
    document.body.appendChild(dropdown);
  }

  btnEl.addEventListener('click', function (event) {
    event.preventDefault();
    dropdown.hidden = !dropdown.hidden;
    if (!dropdown.hidden) {
      var primero = dropdown.querySelector('a, button');
      if (primero) {
        try {
          primero.focus({ preventScroll: true });
        } catch (e) {}
      }
    }
  });

  document.addEventListener('click', function (event) {
    if (
      !dropdown.hidden &&
      !btnEl.contains(event.target) &&
      !dropdown.contains(event.target)
    ) {
      dropdown.hidden = true;
    }
  });

  document.addEventListener(
    'keydown',
    function (event) {
      if (event.key === 'Escape' && !dropdown.hidden) {
        dropdown.hidden = true;
        try {
          btnEl.focus({ preventScroll: true });
        } catch (e) {}
      }
    }
  );
}

function actualizarNavbar() {
  actualizarContadorCarrito();

  var btnEl = document.getElementById('btnSesion');

  if (!btnEl && !document.getElementById('btnSesionMobile')) {
    return;
  }

  // Pintado inmediato con caché, después se reconcilia con el servidor.
  pintarSesionEnNavbar(getSesion());

  consultarSesionServidor().then(function (usuario) {
    pintarSesionEnNavbar(usuario);
  });
}

function requireSesion(accion) {
  if (getSesion() || __sesionUsuario) {
    return true;
  }

  consultarSesionServidor().then(function (usuario) {
    if (!usuario) {
      try {
        window.localStorage.setItem(
          'redirectAfterLogin',
          window.location.href
        );
      } catch (e) {}

      if (typeof window.showToast === 'function') {
        window.showToast(
          'Iniciá sesión para ' +
            String(accion || 'continuar') +
            '.',
          'info',
          { texto: 'Ingresar', href: 'login.html' }
        );
      }
    }
  });

  try {
    window.localStorage.setItem(
      'redirectAfterLogin',
      window.location.href
    );
  } catch (e) {}

  return false;
}

function mostrarErrorConexion(reintentar) {
  if (typeof window.mostrarModalValidacion !== 'function') {
    return;
  }

  var modal = document.getElementById('modalValidacion');

  if (modal && modal.classList.contains('show')) {
    return;
  }

  window.mostrarModalValidacion({
    titulo: 'Sin conexión con el servidor',
    mensaje:
      'No pudimos comunicarnos con el servidor. Revisá tu conexión e intentá de nuevo.',
    icono: 'advertencia.svg',
    botones: [
      {
        texto: 'Reintentar',
        clase: 'primary',
        accion: function () {
          window.cerrarModalValidacion();

          if (typeof reintentar === 'function') {
            reintentar();
          }
        }
      },
      {
        texto: 'Cerrar',
        clase: 'outline'
      }
    ]
  });
}

/* ══════════════════════════════════════════
   HAMBURGUESA — menú móvil accesible
   Escape · backdrop · aria-expanded · bloqueo de scroll.
   ══════════════════════════════════════════ */

function _getBackdrop() {
  var backdrop = document.getElementById('navMobileBackdrop');

  if (!backdrop) {
    backdrop = document.createElement('div');

    backdrop.id = 'navMobileBackdrop';
    backdrop.className = 'nav-mobile-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    backdrop.addEventListener('click', function () {
      var menu = document.getElementById('navMobile');

      if (menu && menu.classList.contains('open')) {
        toggleMenu(false);
      }
    });

    document.body.appendChild(backdrop);
  }

  return backdrop;
}

function _modalAbierto() {
  return Boolean(
    document.querySelector(
      '.modal-overlay.active, .modal-overlay.show, #modalValidacion.show'
    )
  );
}

function toggleMenu(forzar) {
  var hamburger = document.getElementById('navHamburger');
  var menu = document.getElementById('navMobile');

  if (!menu) {
    return;
  }

  var backdrop = _getBackdrop();
  var abrir =
    typeof forzar === 'boolean'
      ? forzar
      : !menu.classList.contains('open');

  menu.classList.toggle('open', abrir);
  backdrop.classList.toggle('open', abrir);
  document.body.classList.toggle('menu-abierto', abrir);
  menu.setAttribute('aria-hidden', String(!abrir));

  if (abrir) {
    document.body.style.overflow = 'hidden';

    var primero = menu.querySelector(
      '.nav-mobile-close, .nav-mobile-links a'
    );

    if (primero) {
      try {
        primero.focus({ preventScroll: true });
      } catch (e) {}
    }
  } else {
    /* No pisar el bloqueo de un modal abierto. */
    if (!_modalAbierto()) {
      document.body.style.overflow = '';
    }

    if (hamburger && document.activeElement === document.body) {
      try {
        hamburger.focus({ preventScroll: true });
      } catch (e) {}
    } else if (hamburger && menu.contains(document.activeElement)) {
      try {
        hamburger.focus({ preventScroll: true });
      } catch (e) {}
    }
  }

  if (hamburger) {
    hamburger.classList.toggle('open', abrir);
    hamburger.setAttribute('aria-expanded', String(abrir));
    hamburger.setAttribute(
      'aria-label',
      abrir ? 'Cerrar menú' : 'Abrir menú'
    );
  }
}

function sincronizarSesionMobile(usuario) {
  var btnMobile = document.getElementById('btnSesionMobile');

  if (!btnMobile) {
    return;
  }

  var logoutMobile = document.getElementById('btnCerrarSesionMobile');

  if (usuario) {
    btnMobile.textContent = String(usuario.nombre || 'Mi cuenta');
    btnMobile.href = 'mis-turnos.html';
    btnMobile.classList.add('nav-mobile-login-activa');

    if (!logoutMobile) {
      logoutMobile = document.createElement('button');

      logoutMobile.id = 'btnCerrarSesionMobile';
      logoutMobile.type = 'button';
      logoutMobile.className = 'nav-mobile-logout';

      var ico = document.createElement('img');
      ico.src = '../img/icons/cerrar.svg';
      ico.alt = '';
      ico.width = 17;
      ico.height = 17;
      ico.setAttribute('aria-hidden', 'true');
      logoutMobile.appendChild(ico);
      logoutMobile.appendChild(document.createTextNode(' Cerrar sesión'));

      logoutMobile.addEventListener('click', function () {
        toggleMenu(false);
        cerrarSesionCliente();
      });

      var bottom = btnMobile.closest('.nav-mobile-bottom');

      if (bottom) {
        bottom.appendChild(logoutMobile);
      }
    }

    logoutMobile.hidden = false;
  } else {
    btnMobile.textContent = 'Ingresar';
    btnMobile.href = 'login.html';
    btnMobile.classList.remove('nav-mobile-login-activa');

    if (logoutMobile) {
      logoutMobile.hidden = true;
    }
  }
}

function requireSesionPage() {
  var usuario = getSesion() || __sesionUsuario;

  if (usuario) {
    consultarSesionServidor().then(function (actual) {
      if (!actual) {
        try {
          window.localStorage.setItem(
            'redirectAfterLogin',
            window.location.href
          );
        } catch (e) {}

        window.location.href = 'login.html';
      }
    });

    return true;
  }

  consultarSesionServidor().then(function (actual) {
    if (actual) {
      pintarSesionEnNavbar(actual);
      return;
    }

    try {
      window.localStorage.setItem(
        'redirectAfterLogin',
        window.location.href
      );
    } catch (e) {}

    window.location.href = 'login.html';
  });

  try {
    window.localStorage.setItem(
      'redirectAfterLogin',
      window.location.href
    );
  } catch (e) {}

  window.location.href = 'login.html';

  return false;
}

/* ══════════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════════ */

(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  function initReveal() {
    document
      .querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(function (element) {
        observer.observe(element);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  /* Cierre por delegación: funciona aunque layout.js cree el menú
     después de que este script se ejecutó. */
  document.addEventListener('click', function (event) {
    var link = event.target.closest
      ? event.target.closest('.nav-mobile-links a')
      : null;
    if (!link) {
      return;
    }
    var menu = document.getElementById('navMobile');
    if (menu && menu.classList.contains('open')) {
      toggleMenu(false);
    }
  });

  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }
});

window.addEventListener('resize', function () {
  var menu = document.getElementById('navMobile');

  if (window.innerWidth > 940 && menu && menu.classList.contains('open')) {
    toggleMenu(false);
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') {
    return;
  }

  var menu = document.getElementById('navMobile');

  if (menu && menu.classList.contains('open')) {
    toggleMenu(false);
  }
});

window.addEventListener(
  'scroll',
  function () {
    var navbar = document.getElementById('navbar');

    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }
  },
  { passive: true }
);


/* ═══════════════════════════════════════════════════════════════
   AVISO ADMIN EN SITIO PÚBLICO
   Cuando un admin navega el sitio de clientes se muestra un banner
   estético y se bloquean las acciones exclusivas de cliente
   (carrito, favoritos, pagar, reseñas, mensajes).
   ═══════════════════════════════════════════════════════════════ */

var __avisoAdminInstalado = false;

/* Selectores de acciones que solo un cliente debe poder realizar. */
var __accionesCliente = [
  '.btn-add',                 // agregar producto al carrito (index)
  '.btn-reservar-panel',      // agregar servicio al carrito
  '#panelProductoAgregar',    // agregar al carrito (productos)
  '.btn-add-cart',
  '.btn-fav',                 // favorito (index)
  '.service-likes',           // favorito (servicios)
  '.fav-toggle',
  '.btn-favorito',
  '.btn-checkout',
  '#carrito-checkout button',
  '#carrito-checkout input[type="submit"]'
].join(',');

/* Formularios exclusivos de cliente (enviar consulta / reseña). */
var __formulariosCliente = ['#formContacto', '.form-resena'].join(',');

function initAvisoAdmin() {
  consultarSesionServidor().then(function (usuario) {
    if (!usuario || String(usuario.rol || '') !== 'admin') {
      return;
    }

    instalarBloqueoAccionesCliente();
    mostrarBannerAdmin();
  });
}

function instalarBloqueoAccionesCliente() {
  if (__avisoAdminInstalado) {
    return;
  }
  __avisoAdminInstalado = true;

  function negar(motivo) {
    if (typeof window.showToast === 'function') {
      window.showToast(
        'Estás navegando como <strong>administrador</strong>: ' +
          String(motivo || 'esta acción') +
          ' está disponible solo para clientes.',
        'info'
      );
    }
  }

  /* Captura para interceptar antes que los handlers de cada página. */
  document.addEventListener(
    'click',
    function (event) {
      var destino = event.target && event.target.closest
        ? event.target.closest(__accionesCliente)
        : null;

      if (!destino || destino.disabled) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      negar('agregar al carrito, pagar o marcar favoritos');
    },
    true
  );

  document.addEventListener(
    'submit',
    function (event) {
      var form = event.target;
      var coincide = form && form.matches && form.matches(__formulariosCliente);

      if (!coincide) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      negar('enviar mensajes o reseñas');
    },
    true
  );
}

function mostrarBannerAdmin() {
  try {
    if (window.sessionStorage.getItem('senderos-aviso-admin-cerrado')) {
      return;
    }
  } catch (e) {}

  if (document.getElementById('adminAviso')) {
    return;
  }

  var banner = document.createElement('aside');
  banner.id = 'adminAviso';
  banner.className = 'admin-aviso';
  banner.setAttribute('role', 'status');

  banner.innerHTML =
    '<span class="admin-aviso-ico">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M12 2 2 7l10 5 10-5-10-5Z"/>' +
        '<path d="m2 17 10 5 10-5"/>' +
        '<path d="m2 12 10 5 10-5"/>' +
      '</svg>' +
    '</span>' +
    '<div class="admin-aviso-txt">' +
      '<p class="admin-aviso-titulo">Modo administrador</p>' +
      '<p class="admin-aviso-body">Estás viendo el sitio como cliente: no podés agregar al carrito, pagar, marcar favoritos, dejar reseñas ni enviar mensajes. Gestioná el negocio desde el <strong>Panel admin</strong>.</p>' +
    '</div>' +
    '<button class="admin-aviso-cerrar" type="button" aria-label="Cerrar aviso">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M18 6 6 18"/>' +
        '<path d="m6 6 12 12"/>' +
      '</svg>' +
    '</button>';

  banner.querySelector('.admin-aviso-cerrar').addEventListener('click', function () {
    banner.remove();
    try {
      window.sessionStorage.setItem('senderos-aviso-admin-cerrado', '1');
    } catch (e) {}
  });

  /* Se inserta al inicio del contenido (el navbar es fixed con padding-top 68px). */
  document.body.insertBefore(banner, document.body.firstChild);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAvisoAdmin);
} else {
  initAvisoAdmin();
}