/* ═══════════════════════════════════════
   Senderos — sesion.js
   Helper compartido de sesión
   ═══════════════════════════════════════ */

/**
 * Retorna el objeto de sesión activo o null.
 */
function getSesion() {
  return JSON.parse(localStorage.getItem('sesion')) ||
         JSON.parse(sessionStorage.getItem('sesion')) ||
         null;
}

/**
 * Cierra la sesión activa y redirige al inicio.
 */
function cerrarSesionCliente() {
  localStorage.removeItem('sesion');
  sessionStorage.removeItem('sesion');
  window.location.href = 'index.html';
}

/**
 * Actualiza el navbar según si hay sesión activa o no.
 * Llama esta función en el DOMContentLoaded de cada página.
 */
function actualizarNavbar() {
  const sesion  = getSesion();
  const btnEl   = document.getElementById('btnSesion');
  const contEl  = document.getElementById('contador');

  // Actualizar badge carrito
  if (contEl) {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    contEl.textContent = carrito.length;
  }

  if (!btnEl) return;

  if (sesion) {
    // Mostrar nombre + dropdown con opciones
    btnEl.textContent = `🌸 ${sesion.nombre}`;
    btnEl.href        = 'mis-turnos.html';
    btnEl.style.cssText = 'position:relative';

    // Crear dropdown si no existe
    if (!document.getElementById('navDropdown')) {
      const dropdown = document.createElement('div');
      dropdown.id = 'navDropdown';
      dropdown.style.cssText = `
        position:absolute; top:calc(100% + 8px); right:0;
        background:#fff; border-radius:14px; min-width:180px;
        box-shadow:0 8px 32px rgba(69,99,77,0.15);
        border:1px solid #F3CFD4; z-index:200;
        padding:0.5rem; display:none;
        font-family:'DM Sans',sans-serif;
      `;
      dropdown.innerHTML = `
        <div style="padding:0.8rem 1rem 0.6rem;border-bottom:1px solid #faf0f2;margin-bottom:0.3rem">
          <div style="font-size:0.85rem;font-weight:500;color:#45634D">${sesion.nombre} ${sesion.apellido || ''}</div>
          <div style="font-size:0.72rem;color:#7a9080">${sesion.email || ''}</div>
        </div>
        <a href="mis-turnos.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1rem;border-radius:8px;text-decoration:none;font-size:0.83rem;color:#45634D;transition:background 0.15s" onmouseover="this.style.background='#faf0f2'" onmouseout="this.style.background='transparent'">
          📅 Mis turnos & pedidos
        </a>
        <a href="carrito.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1rem;border-radius:8px;text-decoration:none;font-size:0.83rem;color:#45634D;transition:background 0.15s" onmouseover="this.style.background='#faf0f2'" onmouseout="this.style.background='transparent'">
          🛒 Mi carrito
        </a>
        <div style="height:1px;background:#faf0f2;margin:0.3rem 0.5rem"></div>
        <button onclick="cerrarSesionCliente()" style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1rem;border-radius:8px;font-size:0.83rem;color:#AD717E;background:none;border:none;cursor:pointer;width:100%;text-align:left;transition:background 0.15s" onmouseover="this.style.background='#faf0f2'" onmouseout="this.style.background='transparent'">
          🚪 Cerrar sesión
        </button>
      `;
      btnEl.parentElement.style.position = 'relative';
      btnEl.parentElement.appendChild(dropdown);

      // Toggle dropdown
      btnEl.addEventListener('click', (e) => {
        e.preventDefault();
        const d = document.getElementById('navDropdown');
        d.style.display = d.style.display === 'none' ? 'block' : 'none';
      });

      // Cerrar al click fuera
      document.addEventListener('click', (e) => {
        if (!btnEl.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }
  } else {
    btnEl.textContent = 'Ingresar';
    btnEl.href        = 'login.html';
    btnEl.style.cssText = '';
    const dd = document.getElementById('navDropdown');
    if (dd) dd.remove();
  }
}

/**
 * Verifica si hay sesión. Si no, muestra modal pidiendo login.
 * Retorna true si hay sesión, false si no.
 */
function requireSesion(accion) {
  if (getSesion()) return true;

  let overlay = document.getElementById('modalLoginReq');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modalLoginReq';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(69,99,77,0.45);backdrop-filter:blur(4px);
      display:flex;align-items:center;justify-content:center;
    `;
    overlay.innerHTML = `
      <div style="
        background:#fff;border-radius:24px;padding:2.5rem 2rem;
        max-width:380px;width:90%;text-align:center;
        animation:fadeUpSesion 0.3s ease forwards;
        font-family:'DM Sans',sans-serif;
      ">
        <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
        <h2 style="
          font-family:'Cormorant Garamond',serif;
          font-size:1.8rem;font-weight:300;color:#45634D;margin-bottom:0.6rem
        ">Necesitás iniciar sesión</h2>
        <p style="font-size:0.85rem;color:#7a9080;line-height:1.6;margin-bottom:2rem" id="modalLoginReqDesc">
          Para ${accion || 'continuar'} necesitás tener una cuenta.
        </p>
        <div style="display:flex;flex-direction:column;gap:0.8rem">
          <a href="login.html"
             onclick="localStorage.setItem('redirectAfterLogin', window.location.href)"
             style="display:block;background:#AD717E;color:#fff;padding:0.9rem;border-radius:50px;text-decoration:none;font-size:0.88rem;font-weight:500;">
            Iniciar sesión
          </a>
          <a href="registro.html"
             style="display:block;background:transparent;color:#AD717E;padding:0.9rem;border-radius:50px;text-decoration:none;font-size:0.88rem;font-weight:500;border:1.5px solid #AD717E;">
            Crear cuenta gratis
          </a>
          <button onclick="document.getElementById('modalLoginReq').remove()"
            style="background:none;border:none;color:#7a9080;font-size:0.82rem;cursor:pointer;padding:0.4rem;">
            Cancelar
          </button>
        </div>
      </div>
      <style>
        @keyframes fadeUpSesion {
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:translateY(0)}
        }
      </style>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  } else {
    const desc = document.getElementById('modalLoginReqDesc');
    if (desc) desc.textContent = `Para ${accion || 'continuar'} necesitás tener una cuenta.`;
    overlay.style.display = 'flex';
  }
  return false;
}

/* ══════════════════════════════════════════
   HAMBURGUESA — menú móvil
   ══════════════════════════════════════════ */

/**
 * Abre/cierra el menú móvil.
 * Llamado desde onclick="toggleMenu()" en el botón hamburguesa.
 */
function toggleMenu() {
  const hamburger = document.getElementById('navHamburger');
  const menu      = document.getElementById('navMobile');
  if (!hamburger || !menu) return;

  const isOpen = menu.classList.contains('open');

  if (isOpen) {
    hamburger.classList.remove('open');
    menu.classList.remove('open');
    document.body.style.overflow = '';
  } else {
    hamburger.classList.add('open');
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

// Cerrar menú con tecla Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const menu = document.getElementById('navMobile');
    if (menu && menu.classList.contains('open')) toggleMenu();
  }
});

// Cerrar menú al hacer click en un link interno
document.addEventListener('DOMContentLoaded', () => {
  const mobileLinks = document.querySelectorAll('.nav-mobile-links a, .nav-mobile-cart');
  mobileLinks.forEach(a => {
    a.addEventListener('click', () => {
      const menu = document.getElementById('navMobile');
      if (menu && menu.classList.contains('open')) toggleMenu();
    });
  });

  // Sincronizar botón de sesión del menú móvil
  _syncMobileSession();
});

/**
 * Actualiza el botón de sesión del menú móvil.
 */
function _syncMobileSession() {
  const btnMobile = document.getElementById('btnSesionMobile');
  if (!btnMobile) return;
  const sesion = getSesion();
  if (sesion) {
    btnMobile.textContent = sesion.nombre;
    btnMobile.href        = 'mis-turnos.html';
    btnMobile.style.background = 'var(--text)';
  } else {
    btnMobile.textContent = 'Ingresar';
    btnMobile.href        = 'login.html';
    btnMobile.style.background = '';
  }
}

// Scroll: agregar clase .scrolled al navbar
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/**
 * requireSesionPage: redirige al login si no hay sesión.
 * Usar en páginas protegidas (mis-turnos, perfil, etc.)
 */
function requireSesionPage() {
  if (!getSesion()) {
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = 'login.html';
  }
}

/* ══════════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════════ */
(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // se anima una sola vez
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function initReveal() {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(function(el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
