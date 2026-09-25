/* Senderos — politicas.js
   Navegación lateral de Políticas (sin inline handlers ni menús duplicados).
*/

document.addEventListener('DOMContentLoaded', function () {
  var links = Array.from(document.querySelectorAll('.pol-link'));

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      links.forEach(function (item) {
        item.classList.remove('active');
      });

      link.classList.add('active');
    });
  });

  var secciones = Array.from(document.querySelectorAll('.pol-section'));

  if (!secciones.length || !('IntersectionObserver' in window)) {
    return;
  }

  var mapa = new Map();

  links.forEach(function (link) {
    var href = link.getAttribute('href') || '';

    if (href.charAt(0) === '#') {
      mapa.set(href.slice(1), link);
    }
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        var link = mapa.get(entry.target.id);

        if (!link) {
          return;
        }

        links.forEach(function (item) {
          item.classList.remove('active');
        });

        link.classList.add('active');
      });
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
  );

  secciones.forEach(function (seccion) {
    observer.observe(seccion);
  });
});
