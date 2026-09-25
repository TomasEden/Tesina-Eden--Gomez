/* Senderos — darkmode.js
   Fase A: modo oscuro real con boton UNICO flotante.
   - Guarda la preferencia en localStorage (clave senderos-tema).
   - Respeta prefers-color-scheme como valor inicial.
   - El <head> de cada html trae un snippet anti-parpadeo que aplica
     html.dark antes del primer paint; este archivo solo confirma.
   - El boton es SOLO flotante abajo a la derecha en TODAS las paginas
     (publicas, admin y PC). No se inyecta en navbar ni menu movil.
   - Cambia de icono (luna/sol) al instante, compatible con
     iconos-adaptativos.js que convierte <img> en <svg> inline:
     se preserva dataset.iconTema y se evita reemplazo innecesario.
*/

(function () {
  var CLAVE = 'senderos-tema';
  var SELECTOR_BOTONES = '[data-dark-toggle]';
  var ID_FLOTANTE = 'darkFloatBtn';

  function prefiereOscuro() {
    try {
      return (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    } catch (e) {
      return false;
    }
  }

  function leerGuardado() {
    try {
      return window.localStorage.getItem(CLAVE);
    } catch (e) {
      return null;
    }
  }

  function guardar(valor) {
    try {
      window.localStorage.setItem(CLAVE, valor);
    } catch (e) {}
  }

  function esOscuro() {
    return document.documentElement.classList.contains('dark');
  }

  function aplicar(oscuro, persistir) {
    document.documentElement.classList.toggle('dark', Boolean(oscuro));

    try {
      document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
    } catch (e) {}

    if (persistir !== false) {
      guardar(oscuro ? 'oscuro' : 'claro');
    }

    pintarBotones();

    try {
      window.dispatchEvent(
        new CustomEvent('senderos:tema', {
          detail: { oscuro: Boolean(oscuro) }
        })
      );
    } catch (e) {}
  }

  function iconoPara(oscuro) {
    return oscuro ? '../img/icons/sol.svg' : '../img/icons/luna.svg';
  }

  function nombreIcono(oscuro) {
    return oscuro ? 'sol' : 'luna';
  }

  function textoPara(oscuro) {
    return oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  }

  function precargarIconos() {
    ['../img/icons/luna.svg', '../img/icons/sol.svg'].forEach(function (src) {
      try {
        if (window.fetch) {
          fetch(src, { cache: 'force-cache' }).catch(function () {});
        }
        var im = new Image();
        im.src = src;
      } catch (e) {}
    });
  }

  function pintarBotones() {
    var oscuro = esOscuro();
    var esperado = nombreIcono(oscuro);

    document.querySelectorAll(SELECTOR_BOTONES).forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(oscuro));
      btn.setAttribute('aria-label', textoPara(oscuro));
      btn.setAttribute('title', textoPara(oscuro));

      /* El icono puede ser <img> (antes de convertir) o <svg> inline
         (despues de iconos-adaptativos). Si ya es el correcto, no tocar
         para que el cambio sea instantaneo y sin parpadeo. */
      var actual = btn.querySelector('img, svg');

      if (actual && actual.dataset && actual.dataset.iconTema === esperado) {
        return;
      }

      if (actual) {
        actual.remove();
      }

      var img = document.createElement('img');
      img.setAttribute('src', iconoPara(oscuro));
      img.setAttribute('alt', '');
      img.setAttribute('width', '20');
      img.setAttribute('height', '20');
      img.setAttribute('aria-hidden', 'true');
      img.dataset.iconTema = esperado;
      img.className = 'dark-icon-img';
      btn.prepend(img);
    });
  }

  function alternar() {
    aplicar(!esOscuro(), true);
  }

  function cablearBoton(btn) {
    if (!btn || btn.dataset.darkListo === '1') {
      return;
    }
    btn.dataset.darkListo = '1';
    if (!btn.getAttribute('type')) {
      btn.setAttribute('type', 'button');
    }
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      alternar();
    });
  }

  function cablearBotones() {
    document.querySelectorAll(SELECTOR_BOTONES).forEach(cablearBoton);
    pintarBotones();
  }

  function crearFlotanteSiFalta() {
    /* Regla Fase A: SOLO flotante. Si ya hay uno, no crear otro.
       Si alguna pagina vieja trae un boton en navbar, se respeta
       pero no se crean mas: el flotante es el unico que creamos. */
    var existente = document.getElementById(ID_FLOTANTE);
    if (existente) {
      cablearBoton(existente);
      pintarBotones();
      return existente;
    }

    if (document.querySelector(SELECTOR_BOTONES)) {
      cablearBotones();
      return null;
    }

    if (!document.body) {
      return null;
    }

    var btn = document.createElement('button');
    btn.id = ID_FLOTANTE;
    btn.setAttribute('data-dark-toggle', '');
    btn.className = 'dark-toggle dark-float';
    btn.setAttribute('type', 'button');

    var oscuro = esOscuro();
    btn.setAttribute('aria-pressed', String(oscuro));
    btn.setAttribute('aria-label', textoPara(oscuro));
    btn.setAttribute('title', textoPara(oscuro));

    var img = document.createElement('img');
    img.setAttribute('src', iconoPara(oscuro));
    img.setAttribute('alt', '');
    img.setAttribute('width', '20');
    img.setAttribute('height', '20');
    img.setAttribute('aria-hidden', 'true');
    img.dataset.iconTema = nombreIcono(oscuro);
    img.className = 'dark-icon-img';

    btn.appendChild(img);
    document.body.appendChild(btn);

    cablearBoton(btn);
    pintarBotones();
    return btn;
  }

  function init() {
    var guardado = leerGuardado();

    if (guardado === 'oscuro') {
      aplicar(true, false);
    } else if (guardado === 'claro') {
      aplicar(false, false);
    } else if (prefiereOscuro()) {
      aplicar(true, false);
    } else {
      /* Si el snippet del <head> ya aplico .dark, aplicar(false,false)
         lo sacaria. Solo normalizar colorScheme sin tocar la clase
         cuando no hay preferencia guardada y el head ya decidio. */
      var yaOscuro = esOscuro();
      var quiereOscuro = prefiereOscuro();
      if (yaOscuro !== quiereOscuro && !guardado) {
        aplicar(quiereOscuro, false);
      } else {
        try {
          document.documentElement.style.colorScheme = yaOscuro
            ? 'dark'
            : 'light';
        } catch (e) {}
        pintarBotones();
      }
    }

    precargarIconos();
    cablearBotones();
    crearFlotanteSiFalta();

    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var alCambiar = function (event) {
        if (leerGuardado()) {
          return;
        }
        aplicar(Boolean(event.matches), false);
      };
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', alCambiar);
      } else if (typeof mq.addListener === 'function') {
        mq.addListener(alCambiar);
      }
    } catch (e) {}
  }

  window.temaOscuro = esOscuro;
  window.alternarTema = alternar;
  window.initDarkmodeButtons = function () {
    cablearBotones();
    crearFlotanteSiFalta();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
