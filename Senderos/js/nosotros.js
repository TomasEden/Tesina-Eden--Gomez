/* Senderos — nosotros.js
   Muro de marcas (sale de las marcas reales del catálogo).
   Para sumar el logo de una marca, agregá su imagen en img/marcas/
   con el nombre en minúsculas y sin espacios (ej: selecta.png).
*/

document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('marcasGrid');

  if (!grid) {
    return;
  }

  fetch('../api/productos.php', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (data) {
      var productos = Array.isArray(data && data.productos) ? data.productos : [];

      var marcas = Array.from(
        new Set(
          productos
            .map(function (p) {
              return String(p.marca || '').trim();
            })
            .filter(Boolean)
        )
      ).sort(function (a, b) {
        return a.localeCompare(b, 'es');
      });

      grid.innerHTML = '';

      if (!marcas.length) {
        grid.hidden = true;
        return;
      }

      marcas.forEach(function (marca) {
        var card = document.createElement('div');
        card.className = 'marca-card';

        var archivo =
          '../img/marcas/' +
          marca
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '') +
          '.png';

        var img = document.createElement('img');
        img.src = archivo;
        img.alt = marca;
        img.loading = 'lazy';
        img.onerror = function () {
          img.remove();

          var nombre = document.createElement('strong');
          nombre.textContent = marca;
          card.prepend(nombre);
        };

        card.appendChild(img);

        var pie = document.createElement('span');
        pie.textContent = marca;
        card.appendChild(pie);

        grid.appendChild(card);
      });
    })
    .catch(function () {
      grid.hidden = true;
    });
});
