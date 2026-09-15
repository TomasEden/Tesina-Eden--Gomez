/* ═══════════════════════════════════════
   Senderos — darkmode.js
   Toggle de modo oscuro global
   ═══════════════════════════════════════ */

(function () {

  /* ─────────────────────────────────────
     APLICAR MODO GUARDADO
     ───────────────────────────────────── */

  const saved = localStorage.getItem('darkMode');

  if (saved === 'on') {
    document.documentElement.classList.add('dark');
  }


  /* ─────────────────────────────────────
     CREAR BOTÓN
     ───────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {

    const btn = document.createElement('button');

    btn.id = 'darkToggle';
    btn.className = 'dark-toggle';
    btn.type = 'button';

    btn.setAttribute('aria-label', 'Cambiar modo de color');
    btn.setAttribute('title', 'Cambiar modo de color');

    actualizarIcono(btn);

    btn.addEventListener('click', toggleDark);

    document.body.appendChild(btn);

  });


  /* ─────────────────────────────────────
     CAMBIAR MODO
     ───────────────────────────────────── */

  function toggleDark() {

    const isDark =
      document.documentElement.classList.toggle('dark');

    localStorage.setItem(
      'darkMode',
      isDark ? 'on' : 'off'
    );

    const btn =
      document.getElementById('darkToggle');

    if (btn) {
      actualizarIcono(btn);
    }

  }


  /* ─────────────────────────────────────
     ACTUALIZAR ICONO
     ───────────────────────────────────── */

  function actualizarIcono(btn) {

    const isDark =
      document.documentElement.classList.contains('dark');

    const icono = isDark ? 'sol.svg' : 'luna.svg';

    btn.innerHTML =
      '<img src="../img/icons/' + icono + '" alt="" width="18" height="18">';

  }

})();

// Navegación robusta del carrito: el enlace sigue funcionando de forma nativa,
// y este fallback cubre casos en los que otro elemento/estilo intercepta el click.
document.addEventListener('click', function (e) {
  var cart = e.target.closest && e.target.closest('a.nav-cart, a.nav-mobile-cart');
  if (!cart) return;
  var href = cart.getAttribute('href');
  if (href && href.indexOf('carrito.html') !== -1) {
    e.preventDefault();
    window.location.href = href;
  }
});
