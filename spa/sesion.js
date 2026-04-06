/* ═══════════════════════════════════════
   SPA M — sesion.js
   Helper compartido de sesión
   ═══════════════════════════════════════ */

/**
 * Retorna el objeto de sesión activo o null si no hay sesión.
 */
function getSesion() {
  return JSON.parse(localStorage.getItem('sesion')) ||
         JSON.parse(sessionStorage.getItem('sesion')) ||
         null;
}

/**
 * Verifica si hay sesión. Si no, muestra un modal pidiendo login.
 * Retorna true si hay sesión, false si no.
 */
function requireSesion(accion) {
  if (getSesion()) return true;

  // Mostrar modal de login requerido
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
        animation:fadeUp 0.3s ease forwards;
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
          <a href="login.html" onclick="localStorage.setItem('redirectAfterLogin', window.location.href)" style="
            display:block;background:#AD717E;color:#fff;
            padding:0.9rem;border-radius:50px;text-decoration:none;
            font-size:0.88rem;font-weight:500;transition:background 0.2s;
          ">Iniciar sesión</a>
          <a href="registro.html" style="
            display:block;background:transparent;color:#AD717E;
            padding:0.9rem;border-radius:50px;text-decoration:none;
            font-size:0.88rem;font-weight:500;
            border:1.5px solid #AD717E;
          ">Crear cuenta gratis</a>
          <button onclick="document.getElementById('modalLoginReq').remove()" style="
            background:none;border:none;color:#7a9080;
            font-size:0.82rem;cursor:pointer;padding:0.4rem;
          ">Cancelar</button>
        </div>
      </div>
      <style>@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}</style>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  } else {
    document.getElementById('modalLoginReqDesc').textContent =
      `Para ${accion || 'continuar'} necesitás tener una cuenta.`;
    overlay.style.display = 'flex';
  }
  return false;
}
