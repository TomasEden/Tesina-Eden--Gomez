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

// Limpiar sesión temporal cuando se cierra la pestaña (sin "recordar")
window.addEventListener('beforeunload', function() {
  if (sessionStorage.getItem('tempSession') === '1') {
    localStorage.removeItem('sesion');
  }
});

/* ══════════════════════════════════════════
   WHATSAPP FLOTANTE
   ══════════════════════════════════════════ */
(function() {
  const TEL = '5493510000000';

  function crearWABtn() {
    if (document.getElementById('waFloating')) return;
    const btn = document.createElement('a');
    btn.id        = 'waFloating';
    btn.href      = 'https://wa.me/' + TEL + '?text=' + encodeURIComponent('Hola! Quiero consultar sobre los servicios de Senderos.');
    btn.target    = '_blank';
    btn.rel       = 'noopener';
    btn.title     = 'Chatear con Senderos';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" width="26" height="26"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.858L.057 23.98l6.304-1.654A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.852 0-3.587-.5-5.082-1.37l-.361-.215-3.743.981.998-3.648-.235-.373A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>';
    btn.style.cssText = 'position:fixed;bottom:5rem;right:2rem;z-index:390;width:50px;height:50px;border-radius:50%;background:#25d366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(37,211,102,0.45);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);text-decoration:none;';
    btn.onmouseenter = () => btn.style.transform = 'scale(1.15)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearWABtn);
  } else {
    crearWABtn();
  }
})();

/* ══════════════════════════════════════════
   SISTEMA DE NOTIFICACIONES
   ══════════════════════════════════════════ */
function getNotificaciones() {
  return JSON.parse(localStorage.getItem('notificaciones') || '[]');
}

function agregarNotificacion(msg, tipo) {
  tipo = tipo || 'info';
  const notifs = getNotificaciones();
  notifs.unshift({
    id:     Date.now(),
    msg:    msg,
    tipo:   tipo,  // 'info' | 'success' | 'warning'
    leida:  false,
    fecha:  new Date().toISOString()
  });
  // Máximo 20 notificaciones
  localStorage.setItem('notificaciones', JSON.stringify(notifs.slice(0, 20)));
  actualizarBadgeNotif();
}

function marcarTodasLeidas() {
  const notifs = getNotificaciones().map(n => ({ ...n, leida: true }));
  localStorage.setItem('notificaciones', JSON.stringify(notifs));
  actualizarBadgeNotif();
  document.getElementById('notifPanel')?.remove();
}

function actualizarBadgeNotif() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const noLeidas = getNotificaciones().filter(n => !n.leida).length;
  badge.textContent = noLeidas;
  badge.style.display = noLeidas > 0 ? 'flex' : 'none';
}

function toggleNotifPanel() {
  const existing = document.getElementById('notifPanel');
  if (existing) { existing.remove(); return; }

  const notifs = getNotificaciones();
  const iconBtn = document.getElementById('notifBtn');
  if (!iconBtn) return;

  const panel = document.createElement('div');
  panel.id = 'notifPanel';
  panel.style.cssText = 'position:fixed;top:74px;right:1.5rem;z-index:500;width:min(340px,92vw);background:#fff;border-radius:18px;box-shadow:0 8px 36px rgba(0,0,0,0.16);border:1px solid rgba(211,161,169,0.2);overflow:hidden;animation:fadeUp 0.25s ease both;font-family:DM Sans,sans-serif;';

  const noLeidas = notifs.filter(n => !n.leida).length;
  const colores = { success:'#edf7f1', warning:'#fef4e6', info:'#faf0f2' };
  const iconos  = { success:'✓', warning:'⚠', info:'ℹ' };

  panel.innerHTML =
    '<div style="padding:1rem 1.2rem 0.7rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0ece8">' +
      '<span style="font-size:0.82rem;font-weight:600;color:#45634D">Notificaciones ' + (noLeidas > 0 ? '(' + noLeidas + ')' : '') + '</span>' +
      (noLeidas > 0 ? '<button onclick="marcarTodasLeidas()" style="font-size:0.72rem;color:#AD717E;background:none;border:none;cursor:pointer;font-family:inherit">Marcar todas leídas</button>' : '') +
    '</div>' +
    (notifs.length === 0
      ? '<p style="padding:1.5rem;text-align:center;font-size:0.85rem;color:#9a9a8e">Sin notificaciones</p>'
      : notifs.map(n =>
          '<div style="padding:0.8rem 1.2rem;border-bottom:1px solid #f9f5f2;background:' + (n.leida ? '#fff' : colores[n.tipo] || '#faf0f2') + ';display:flex;gap:0.7rem;align-items:flex-start">' +
            '<span style="font-size:0.8rem;flex-shrink:0;margin-top:2px">' + (iconos[n.tipo] || 'ℹ') + '</span>' +
            '<div><p style="font-size:0.82rem;color:#2d2d2d;margin:0 0 0.15rem">' + n.msg + '</p>' +
            '<span style="font-size:0.7rem;color:#9a9a8e">' + new Date(n.fecha).toLocaleDateString('es-AR', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) + '</span></div>' +
          '</div>').join('')) +
    '<div style="padding:0.7rem 1.2rem;text-align:center">' +
      '<a href="mis-turnos.html" style="font-size:0.78rem;color:#AD717E;text-decoration:none">Ver mis turnos →</a>' +
    '</div>';

  document.body.appendChild(panel);

  // Marcar como leídas al abrir
  setTimeout(() => {
    const notifs2 = getNotificaciones().map(n => ({ ...n, leida: true }));
    localStorage.setItem('notificaciones', JSON.stringify(notifs2));
    actualizarBadgeNotif();
  }, 800);

  // Cerrar al click fuera
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!panel.contains(e.target) && e.target !== iconBtn) {
        panel.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 100);
}

// Inyectar botón campana en navbar al cargar
(function() {
  function addNotifBtn() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight || document.getElementById('notifBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'notifBtn';
    btn.onclick = toggleNotifPanel;
    btn.style.cssText = 'position:relative;background:none;border:none;cursor:pointer;padding:0.3rem;display:flex;align-items:center;color:#7a9080;transition:color 0.2s;font-size:1.1rem;';
    btn.innerHTML = '🔔<span id="notifBadge" style="display:none;position:absolute;top:-2px;right:-4px;background:#AD717E;color:#fff;font-size:0.58rem;font-weight:700;min-width:16px;height:16px;border-radius:50%;align-items:center;justify-content:center;padding:0 2px;border:1.5px solid rgba(250,247,245,0.95)">0</span>';
    btn.onmouseenter = () => btn.style.color = '#AD717E';
    btn.onmouseleave = () => btn.style.color = '#7a9080';

    // Insertar antes del btn-login
    const btnLogin = navRight.querySelector('.btn-login');
    if (btnLogin) navRight.insertBefore(btn, btnLogin);
    else navRight.appendChild(btn);

    actualizarBadgeNotif();

    // Demo: generar notificaciones de ejemplo si no hay ninguna
    if (getNotificaciones().length === 0) {
      agregarNotificacion('Tu turno del 20 de Abril fue confirmado ✅', 'success');
      agregarNotificacion('Tu pedido #456789 está listo para retirar 🎉', 'success');
      agregarNotificacion('Recordatorio: tenés un turno mañana a las 10:00 hs', 'info');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addNotifBtn);
  } else {
    addNotifBtn();
  }
})();
