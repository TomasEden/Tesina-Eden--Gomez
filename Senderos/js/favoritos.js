/* Senderos — favoritos.js
   Servicios y productos marcados como favoritos.
*/

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.actualizarNavbar === 'function') {
    window.actualizarNavbar();
  }

  cargarFavoritos();
});

function leerLS(clave) {
  try {
    var lista = JSON.parse(window.localStorage.getItem(clave) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
}

function cargarFavoritos() {
  return Promise.all([
    fetch('../api/servicios.php', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    }).then(function (r) {
      return r.ok ? r.json() : null;
    }),
    fetch('../api/productos.php', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    }).then(function (r) {
      return r.ok ? r.json() : null;
    })
  ])
    .then(function (resultados) {
      var servicios = Array.isArray(resultados[0] && resultados[0].servicios)
        ? resultados[0].servicios
        : [];
      var productos = Array.isArray(resultados[1] && resultados[1].productos)
        ? resultados[1].productos
        : [];

      var likesServ = leerLS('senderos-likes').map(String);
      var likesProd = leerLS('senderos-likes-productos').map(Number);

      renderFavsServicios(
        servicios.filter(function (s) {
          return likesServ.indexOf(String(s.slug || s.id)) !== -1;
        })
      );

      renderFavsProductos(
        productos.filter(function (p) {
          return likesProd.indexOf(Number(p.id)) !== -1;
        })
      );
    })
    .catch(function () {
      if (typeof window.mostrarErrorConexion === 'function') {
        window.mostrarErrorConexion(cargarFavoritos);
      }
    });
}

function renderFavsServicios(lista) {
  var grid = document.getElementById('favsServicios');
  var vacio = document.getElementById('favsServiciosVacio');

  if (!grid) {
    return;
  }

  grid.innerHTML = '';

  if (!lista.length) {
    if (vacio) {
      vacio.classList.remove('hidden');
    }

    return;
  }

  if (vacio) {
    vacio.classList.add('hidden');
  }

  lista.forEach(function (s) {
    var card = document.createElement('article');
    card.className = 'fav-card';

    var h3 = document.createElement('h3');
    h3.textContent = String(s.nombre || '');
    card.appendChild(h3);

    var meta = document.createElement('p');
    meta.textContent =
      String(s.categoria || '') +
      ' · ' +
      (Number(s.duracion) || 0) +
      ' min · ' +
      formatoLocal(Number(s.precio_final !== undefined ? s.precio_final : s.precio));
    card.appendChild(meta);

    var fila = document.createElement('div');
    fila.className = 'fav-acciones';

    var ver = document.createElement('a');
    ver.className = 'btn-outline btn-chico';
    ver.href = 'servicios.html?id=' + encodeURIComponent(String(s.slug || s.id));
    ver.textContent = 'Ver';
    fila.appendChild(ver);

    var quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'btn-ghost btn-chico';
    quitar.textContent = 'Quitar';
    quitar.addEventListener('click', function () {
      quitarLike('senderos-likes', String(s.slug || s.id));
      cargarFavoritos();
    });
    fila.appendChild(quitar);

    card.appendChild(fila);
    grid.appendChild(card);
  });
}

function renderFavsProductos(lista) {
  var grid = document.getElementById('favsProductos');
  var vacio = document.getElementById('favsProductosVacio');

  if (!grid) {
    return;
  }

  grid.innerHTML = '';

  if (!lista.length) {
    if (vacio) {
      vacio.classList.remove('hidden');
    }

    return;
  }

  if (vacio) {
    vacio.classList.add('hidden');
  }

  lista.forEach(function (p) {
    var card = document.createElement('article');
    card.className = 'fav-card';

    var h3 = document.createElement('h3');
    h3.textContent = String(p.nombre || '');
    card.appendChild(h3);

    var meta = document.createElement('p');
    meta.textContent =
      String(p.marca || p.categoria || '') +
      ' · ' +
      formatoLocal(Number(p.precio_final !== undefined ? p.precio_final : p.precio));
    card.appendChild(meta);

    var fila = document.createElement('div');
    fila.className = 'fav-acciones';

    var ver = document.createElement('a');
    ver.className = 'btn-outline btn-chico';
    ver.href = 'productos.html?id=' + encodeURIComponent(String(p.id));
    ver.textContent = 'Ver';
    fila.appendChild(ver);

    var agregar = document.createElement('button');
    agregar.type = 'button';
    agregar.className = 'btn-primary btn-chico';
    agregar.textContent = 'Al carrito';
    agregar.disabled = Number(p.stock_cantidad) <= 0;
    agregar.addEventListener('click', function () {
      agregarFavoritoAlCarrito(Number(p.id), agregar);
    });
    fila.appendChild(agregar);

    var quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'btn-ghost btn-chico';
    quitar.textContent = 'Quitar';
    quitar.addEventListener('click', function () {
      quitarLike('senderos-likes-productos', Number(p.id));
      cargarFavoritos();
    });
    fila.appendChild(quitar);

    card.appendChild(fila);
    grid.appendChild(card);
  });
}

function quitarLike(clave, valor) {
  var lista = leerLS(clave).filter(function (x) {
    return x !== valor && String(x) !== String(valor) && Number(x) !== Number(valor);
  });

  try {
    window.localStorage.setItem(clave, JSON.stringify(lista));
  } catch (e) {}
}

function agregarFavoritoAlCarrito(id, boton) {
  function seguir() {
    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Agregando...';
    }

    fetch('../api/carrito.php', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ tipo: 'producto', id: id })
    })
      .then(function (respuesta) {
        return respuesta.json().then(function (data) {
          if (!respuesta.ok || !data.ok) {
            throw new Error(data.mensaje || data.error || 'No se pudo agregar.');
          }
        });
      })
      .then(function () {
        if (typeof window.actualizarNavbar === 'function') {
          window.actualizarNavbar();
        }

        if (typeof window.showToast === 'function') {
          window.showToast('Producto agregado al carrito');
        }
      })
      .catch(function (error) {
        if (typeof window.showToast === 'function') {
          window.showToast(error.message || 'No se pudo agregar.');
        }
      })
      .finally(function () {
        if (boton) {
          boton.disabled = false;
          boton.textContent = 'Al carrito';
        }
      });
  }

  if (typeof window.consultarSesionServidor === 'function') {
    window.consultarSesionServidor().then(function (usuario) {
      if (!usuario) {
        try {
          window.localStorage.setItem('redirectAfterLogin', 'favoritos.html');
        } catch (e) {}

        window.location.href = 'login.html';
        return;
      }

      seguir();
    });
  } else {
    seguir();
  }
}

function formatoLocal(valor) {
  if (typeof window.formatoPrecio === 'function') {
    return window.formatoPrecio(Number(valor) || 0);
  }

  return '$' + Number(valor || 0).toLocaleString('es-AR');
}
