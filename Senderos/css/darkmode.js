/* ═══════════════════════════════════════
   Senderos — darkmode.js
   Toggle de modo oscuro global
   ═══════════════════════════════════════ */

(function () {
  // Aplicar modo guardado ANTES de que cargue el CSS para evitar flash
  const saved = localStorage.getItem('darkMode');
  if (saved === 'on') document.documentElement.classList.add('dark');

  document.addEventListener('DOMContentLoaded', function () {
    // Crear el botón flotante de toggle
    const btn = document.createElement('button');
    btn.id = 'darkToggle';
    btn.className = 'dark-toggle';
    btn.setAttribute('aria-label', 'Cambiar modo oscuro');
    btn.innerHTML = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
    btn.onclick = toggleDark;
    document.body.appendChild(btn);
  });

  function toggleDark() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark ? 'on' : 'off');
    const btn = document.getElementById('darkToggle');
    if (btn) btn.innerHTML = isDark ? '☀️' : '🌙';
  }
})();
