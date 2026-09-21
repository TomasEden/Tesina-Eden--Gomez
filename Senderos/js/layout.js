/* ═══════════════════════════════════════════════════════════════
   Senderos — layout.js — Fase A
   Layout público compartido.
   Navbar · menú móvil accesible · footer · toast.
   - El contador sale de api/carrito.php (sesion.js).
   - La sesión visible se sincroniza con api/sesion.php (sesion.js).
   - SIN referencias a carrito legacy en storage (ni listener storage
     ni limpieza legacy).
   - NO se ejecuta en páginas admin (tienen admin-shell.js).
   ═══════════════════════════════════════════════════════════════ */


function esPaginaAdmin() {
  try {
    var ruta = String(window.location.pathname || '');

    if (/admin-/i.test(ruta)) {
      return true;
    }
  } catch (e) {}

  if (document.body && document.body.hasAttribute('data-admin')) {
    return true;
  }

  if (document.querySelector('.admin-shell, .admin-sidebar, [data-admin-shell]')) {
    return true;
  }

  return false;
}


/* =========================================================
   DATOS DEL NEGOCIO
   ========================================================= */

window.NEGOCIO = window.NEGOCIO || {
  nombre: 'Senderos de Spa',

  direccion: 'General Roca 145',

  telefono: '3571-616113',

  telHref: 'tel:+543571616113',

  wa: '5493571616113',

  mail: 'claudia.senderospa@gmail.com',

  horario:
    'Lun. a sáb. · 8 a 12:30 y 16 a 20 hs',

  cerrado:
    'Domingos y feriados: cerrado',

  instagram: [
    [
      'Senderos de Spa',
      'Senderos_de_spa'
    ],
    [
      'Claudia Makeup',
      'claudiamakeup'
    ],
    [
      'C.G. Distribuidora',
      'c.g.distribuidora'
    ]
  ]
};


/* =========================================================
   PÁGINA ACTUAL
   ========================================================= */

function obtenerPaginaActual() {
  var pagina =
    document.body &&
    document.body.dataset &&
    document.body.dataset.pagina;

  if (pagina) {
    return pagina;
  }

  var archivo =
    window.location.pathname
      .split('/')
      .pop()
      .toLowerCase();

  return archivo
    .replace('.html', '')
    || 'index';
}


/* =========================================================
   NAVBAR
   ========================================================= */

function crearNavbar() {
  var existente =
    document.getElementById('navbar');

  if (existente) {
    actualizarLinksActivos(existente);
    return existente;
  }

  var navbar =
    document.createElement('nav');

  navbar.className = 'navbar';
  navbar.id = 'navbar';
  navbar.setAttribute('aria-label', 'Navegación principal');

  navbar.innerHTML =
    '<a href="index.html" class="nav-logo">' +
      '<img src="../img/icons/logo.png" alt="Senderos" width="26" height="26">' +
      'Senderos' +
    '</a>' +

    '<ul class="nav-links">' +
      '<li><a href="index.html">Inicio</a></li>' +
      '<li><a href="servicios.html">Servicios</a></li>' +
      '<li><a href="productos.html">Productos</a></li>' +
      '<li><a href="nosotros.html">Nosotros</a></li>' +
    '</ul>' +

    '<div class="nav-right">' +
      '<a href="carrito.html" class="nav-cart" id="navCartLink" aria-label="Mi carrito">' +
        '<img src="../img/icons/carrito+.svg" alt="" width="22" height="22" aria-hidden="true">' +
        '<span class="cart-badge" id="contador" aria-hidden="true">0</span>' +
      '</a>' +

      '<a href="buscar.html" class="nav-search" aria-label="Buscar">' +
        '<img src="../img/icons/lupa.svg" alt="" width="20" height="20" aria-hidden="true">' +
      '</a>' +

      '<a href="login.html" class="btn-login" id="btnSesion">Ingresar</a>' +
    '</div>' +

    '<button class="nav-hamburger" id="navHamburger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="navMobile">' +
      '<span aria-hidden="true"></span>' +
      '<span aria-hidden="true"></span>' +
      '<span aria-hidden="true"></span>' +
    '</button>';

  document.body.prepend(navbar);

  var hamburguesa = navbar.querySelector('#navHamburger');

  if (hamburguesa && typeof window.toggleMenu === 'function') {
    hamburguesa.addEventListener('click', function () {
      window.toggleMenu();
    });
  }

  actualizarLinksActivos(navbar);

  return navbar;
}


/* =========================================================
   LINKS ACTIVOS
   ========================================================= */

function actualizarLinksActivos(navbar) {
  if (!navbar) {
    return;
  }

  var pagina =
    obtenerPaginaActual();

  navbar
    .querySelectorAll(
      '.nav-links a, .nav-mobile-links a'
    )
    .forEach(function (link) {
      var href =
        link.getAttribute('href') || '';

      var destino =
        href
          .split('/')
          .pop()
          .split('?')[0]
          .split('#')[0]
          .toLowerCase();

      var activo =
        destino === (pagina + '.html') ||
        (
          pagina === 'index' &&
          destino === 'index.html'
        );

      link.classList.toggle(
        'active',
        activo
      );

      if (activo) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
}


/* =========================================================
   MENÚ MÓVIL — Fase A
   Incluye: Inicio, Servicios, Productos, Nosotros, Buscar,
   Favoritos, Mi carrito (con contador), Mis turnos y pedidos,
   Ingresar / Cerrar sesión. Si es admin, Panel admin.
   Accesible: role dialog, aria-modal, Escape, backdrop y
   bloqueo de scroll (los gestiona sesion.js toggleMenu).
   ========================================================= */

function crearMenuMobile() {
  var menu =
    document.getElementById('navMobile');

  if (!menu) {
    menu =
      document.createElement('div');

    menu.className =
      'nav-mobile';

    menu.id =
      'navMobile';

    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Menú');
    menu.setAttribute('aria-hidden', 'true');

    menu.innerHTML =
      '<button class="nav-mobile-close" id="navMobileClose" type="button" aria-label="Cerrar menú">' +
        '<img src="../img/icons/x.svg" alt="" width="12" height="12" aria-hidden="true">' +
      '</button>' +

      '<nav class="nav-mobile-links" aria-label="Menú móvil">' +
        '<a href="index.html">Inicio</a>' +
        '<a href="servicios.html">Servicios</a>' +
        '<a href="productos.html">Productos</a>' +
        '<a href="nosotros.html">Nosotros</a>' +
        '<a href="buscar.html">Buscar</a>' +
        '<a href="favoritos.html">Favoritos</a>' +
        '<a href="carrito.html" class="nav-mobile-cart-link">Mi carrito <span class="cart-badge cart-badge-mobile" id="contadorMobile" aria-hidden="true">0</span></a>' +
        '<a href="mis-turnos.html">Mis turnos y pedidos</a>' +
        '<a href="admin-dashboard.html" id="linkAdminMobile" hidden>Panel admin</a>' +
      '</nav>' +

      '<div class="nav-mobile-bottom">' +
        '<a href="login.html" class="nav-mobile-login" id="btnSesionMobile">Ingresar</a>' +
      '</div>';

    document.body.appendChild(menu);

    var cerrar = menu.querySelector('#navMobileClose');

    if (cerrar && typeof window.toggleMenu === 'function') {
      cerrar.addEventListener('click', function () {
        var abierto = menu.classList.contains('open');

        if (abierto) {
          window.toggleMenu(false);
        }
      });
    }
  }

  actualizarLinksActivos(
    document.getElementById('navbar')
  );

  return menu;
}


/* =========================================================
   FOOTER
   ========================================================= */

function crearFooter() {
  var footer = document.querySelector('.site-footer');

  if (footer) {
    return footer;
  }

  footer = document.createElement('footer');
  footer.className = 'site-footer';

  var instagram = window.NEGOCIO.instagram || [];

  var redes = instagram.map(function (par) {
    var nombre = par[0];
    var usuario = par[1];

    return (
      '<a href="https://instagram.com/' + encodeURIComponent(usuario) + '" target="_blank" rel="noopener noreferrer">' +
        '<img src="../img/icons/instagram.svg" alt="" width="15" height="15" aria-hidden="true">' +
        window.escapeHTML(nombre) +
      '</a>'
    );
  }).join('');

  footer.innerHTML =
    '<div class="footer-inner">' +

      '<div class="footer-brand-col">' +
        '<div class="footer-brand">' +
          '<img src="../img/icons/logo.png" alt="Senderos" width="26" height="26">' +
          '<span>Senderos</span>' +
        '</div>' +
        '<p class="footer-desc">Tu espacio de bienestar en Río Tercero: spa y tienda de cosmética.</p>' +
      '</div>' +

      '<div class="footer-col">' +
        '<h4>Encontranos</h4>' +
        '<a href="' + window.escapeHTML(window.NEGOCIO.telHref) + '">' +
          '<img src="../img/icons/telefono.svg" alt="" width="15" height="15" aria-hidden="true">' +
          window.escapeHTML(window.NEGOCIO.telefono) +
        '</a>' +
        '<a href="https://wa.me/' + window.escapeHTML(window.NEGOCIO.wa) + '" target="_blank" rel="noopener noreferrer">' +
          '<img src="../img/icons/whatsapp.svg" alt="" width="15" height="15" aria-hidden="true">' +
          'WhatsApp' +
        '</a>' +
        '<span>' +
          '<img src="../img/icons/ubicacion.svg" alt="" width="15" height="15" aria-hidden="true">' +
          window.escapeHTML(window.NEGOCIO.direccion) +
        '</span>' +
        '<span>' +
          '<img src="../img/icons/tiempo.svg" alt="" width="15" height="15" aria-hidden="true">' +
          window.escapeHTML(window.NEGOCIO.horario) +
        '</span>' +
        '<span class="footer-note">' +
          window.escapeHTML(window.NEGOCIO.cerrado) +
        '</span>' +
      '</div>' +

      '<div class="footer-col">' +
        '<h4>Navegación</h4>' +
        '<a href="index.html">Inicio</a>' +
        '<a href="servicios.html">Servicios</a>' +
        '<a href="productos.html">Productos</a>' +
        '<a href="nosotros.html">Nosotros</a>' +
        '<a href="buscar.html">Buscar</a>' +
        '<a href="politicas.html">Políticas</a>' +
      '</div>' +

      '<div class="footer-col">' +
        '<h4>Pagos y envíos</h4>' +
        '<span>' +
          '<img src="../img/icons/paquete.svg" alt="" width="15" height="15" aria-hidden="true">' +
          'Envíos a todo el país' +
        '</span>' +
        '<span>' +
          '<img src="../img/icons/transferencia.svg" alt="" width="15" height="15" aria-hidden="true">' +
          'Transferencia' +
        '</span>' +
        '<span>' +
          '<img src="../img/icons/tarjeta.svg" alt="" width="15" height="15" aria-hidden="true">' +
          'Débito' +
        '</span>' +
      '</div>' +

      '<div class="footer-col">' +
        '<h4>Redes y contacto</h4>' +
        redes +
        '<a href="mailto:' + window.escapeHTML(window.NEGOCIO.mail) + '">' +
          '<img src="../img/icons/correo2.svg" alt="" width="15" height="15" aria-hidden="true">' +
          window.escapeHTML(window.NEGOCIO.mail) +
        '</a>' +
      '</div>' +

    '</div>' +

    '<div class="footer-bottom">' +
      '<span>© ' + new Date().getFullYear() + ' ' + window.escapeHTML(window.NEGOCIO.nombre) + '</span>' +
      '<span>Todos los derechos reservados</span>' +
    '</div>';

  document.body.appendChild(footer);
  return footer;
}

/* =========================================================
   TOAST
   ========================================================= */

function crearToast() {
  var toast =
    document.getElementById('toast');

  if (toast) {
    return toast;
  }

  toast =
    document.createElement('div');

  toast.className =
    'toast';

  toast.id =
    'toast';

  toast.setAttribute(
    'aria-live',
    'polite'
  );

  document.body.appendChild(toast);

  return toast;
}


/* =========================================================
   NORMALIZAR ESTRUCTURA DEL LAYOUT
   ========================================================= */

function inicializarLayout() {
  if (!document.body) {
    return;
  }

  if (esPaginaAdmin()) {
    return;
  }

  crearNavbar();

  crearMenuMobile();

  crearFooter();

  crearToast();

  if (typeof window.initDarkmodeButtons === 'function') {
    window.initDarkmodeButtons();
  }

  if (
    typeof window.actualizarNavbar ===
    'function'
  ) {
    window.actualizarNavbar();
  }
}


/* =========================================================
   INICIO
   ========================================================= */

if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    inicializarLayout,
    { once: true }
  );
} else {
  inicializarLayout();
}
