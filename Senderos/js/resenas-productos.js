/* Senderos — resenas-productos.js
   Reseñas de productos: promedio, listado y formulario (login requerido).
*/

var RESENAS_PROD_CACHE = {};

function renderSeccionResenasProducto(productoId, productoNombre, contenedorId) {
  var contenedor = document.getElementById(contenedorId);

  if (!contenedor) {
    return Promise.resolve();
  }

  contenedor.innerHTML = '';

  var seccion = document.createElement('section');
  seccion.className = 'resenas-seccion';

  var titulo = document.createElement('h4');
  titulo.className = 'panel-section-title';
  titulo.textContent = 'Reseñas';
  seccion.appendChild(titulo);

  var promedio = document.createElement('div');
  promedio.className = 'resenas-promedio';
  seccion.appendChild(promedio);

  var lista = document.createElement('div');
  lista.id = 'listaResenasProducto_' + productoId;
  seccion.appendChild(lista);

  var formBox = document.createElement('div');
  seccion.appendChild(formBox);

  contenedor.appendChild(seccion);

  pintarPromedioProducto(productoId, promedio);
  pintarFormularioProducto(productoId, formBox);

  return cargarResenasProducto(productoId).then(function () {
    pintarPromedioProducto(productoId, promedio);
  });
}

function nodoResenaProducto(resena) {
  var estrellas = Math.max(1, Math.min(5, Number(resena.estrellas) || 0));

  var article = document.createElement('article');
  article.className = 'resena';

  var head = document.createElement('div');
  head.className = 'resena-head';

  var autor = document.createElement('strong');
  autor.className = 'resena-autor';
  autor.textContent = String(resena.nombre_usuario || 'Cliente');
  head.appendChild(autor);

  var stars = document.createElement('span');
  stars.className = 'resena-estrellas';
  stars.textContent = '★★★★★'.slice(0, estrellas) + '☆☆☆☆☆'.slice(0, 5 - estrellas);
  head.appendChild(stars);

  article.appendChild(head);

  var texto = document.createElement('p');
  texto.className = 'resena-texto';
  texto.textContent = String(resena.texto || '');
  article.appendChild(texto);

  return article;
}

function cargarResenasProducto(productoId) {
  var contenedor = document.getElementById('listaResenasProducto_' + productoId);

  if (!contenedor) {
    return Promise.resolve();
  }

  return fetch(
    '../api/resenas.php?producto_id=' + encodeURIComponent(String(productoId)),
    { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }
  )
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.ok) {
          throw new Error((data && (data.error || data.mensaje)) || 'Error');
        }

        return Array.isArray(data.resenas) ? data.resenas : [];
      });
    })
    .then(function (resenas) {
      RESENAS_PROD_CACHE[productoId] = resenas;
      renderResenasProducto(productoId, resenas);
    })
    .catch(function () {
      contenedor.innerHTML = '';

      var box = document.createElement('div');
      box.className = 'estado-msg';
      box.textContent = 'No pudimos cargar las reseñas.';
      contenedor.appendChild(box);

      if (typeof window.mostrarErrorConexion === 'function') {
        window.mostrarErrorConexion(function () {
          cargarResenasProducto(productoId);
        });
      }
    });
}

function renderResenasProducto(productoId, resenas) {
  var contenedor = document.getElementById('listaResenasProducto_' + productoId);

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = '';

  if (!resenas.length) {
    var vacio = document.createElement('div');
    vacio.className = 'reviews-empty';
    vacio.textContent = 'Todavía no hay reseñas para este producto. ¡Sé la primera!';
    contenedor.appendChild(vacio);
    return;
  }

  var limite = 3;
  var lista = document.createElement('div');
  lista.className = 'resenas-list';

  resenas.slice(0, limite).forEach(function (resena) {
    lista.appendChild(nodoResenaProducto(resena));
  });

  contenedor.appendChild(lista);

  if (resenas.length > limite) {
    var ver = document.createElement('button');
    ver.type = 'button';
    ver.className = 'btn-ver-resenas';
    ver.textContent = 'Ver todas las reseñas';
    ver.addEventListener('click', function () {
      lista.innerHTML = '';

      (RESENAS_PROD_CACHE[productoId] || []).forEach(function (resena) {
        lista.appendChild(nodoResenaProducto(resena));
      });

      ver.remove();
    });
    contenedor.appendChild(ver);
  }
}

function pintarPromedioProducto(productoId, nodo) {
  function pintar(promedio, cantidad) {
    nodo.innerHTML = '';

    var avg = document.createElement('strong');
    avg.textContent = Number(promedio || 0).toFixed(1) + ' ★';
    nodo.appendChild(avg);

    var c = document.createElement('span');
    c.textContent = ' (' + Number(cantidad || 0) + ' reseñas)';
    nodo.appendChild(c);
  }

  return fetch('../api/resenas.php?resumen=1', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      var filas = Array.isArray(data && data.resumen_productos) ? data.resumen_productos : [];
      var actual = null;

      filas.forEach(function (f) {
        if (Number(f.producto_id) === Number(productoId)) {
          actual = f;
        }
      });

      if (actual) {
        pintar(actual.promedio, actual.cantidad);
        return;
      }

      var lista = RESENAS_PROD_CACHE[productoId] || [];

      if (lista.length) {
        var suma = lista.reduce(function (acc, x) {
          return acc + (Number(x.estrellas) || 0);
        }, 0);
        pintar(suma / lista.length, lista.length);
      } else {
        pintar(0, 0);
      }
    })
    .catch(function () {
      pintar(0, 0);
    });
}

function pintarFormularioProducto(productoId, nodo) {
  nodo.innerHTML = '';

  var sesion =
    typeof window.getSesion === 'function' ? window.getSesion() : null;

  if (!sesion) {
    var aviso = document.createElement('p');
    aviso.className = 'resenas-login-aviso';
    aviso.appendChild(document.createTextNode('Iniciá sesión para dejar tu reseña. '));

    var link = document.createElement('a');
    link.href = 'login.html';
    link.textContent = 'Ingresar';
    link.addEventListener('click', function () {
      try {
        window.localStorage.setItem('redirectAfterLogin', window.location.href);
      } catch (e) {}
    });
    aviso.appendChild(link);

    nodo.appendChild(aviso);
    return;
  }

  var form = document.createElement('form');
  form.className = 'form-resena';

  var h3 = document.createElement('h3');
  h3.textContent = 'Dejá tu reseña';
  form.appendChild(h3);

  var grupo = document.createElement('div');
  grupo.className = 'resena-estrellas-input';
  grupo.setAttribute('role', 'radiogroup');
  grupo.setAttribute('aria-label', 'Calificación');

  var estrellasElegidas = 0;
  var botones = [];

  for (var numero = 1; numero <= 5; numero++) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'estrella-btn';
    btn.textContent = '☆';
    btn.setAttribute('aria-label', numero + ' estrellas');
    btn.dataset.valor = String(numero);
    btn.addEventListener('click', function () {
      estrellasElegidas = Number(this.dataset.valor);
      botones.forEach(function (b, indice) {
        b.textContent = indice < estrellasElegidas ? '★' : '☆';
        b.classList.toggle('elegida', indice < estrellasElegidas);
      });
      err.textContent = '';
    });
    botones.push(btn);
    grupo.appendChild(btn);
  }

  form.appendChild(grupo);

  var err = document.createElement('p');
  err.className = 'field-error';
  err.setAttribute('role', 'alert');
  form.appendChild(err);

  var area = document.createElement('textarea');
  area.className = 'resena-textarea';
  area.minLength = 10;
  area.maxLength = 600;
  area.placeholder = 'Contanos tu experiencia...';
  area.addEventListener('input', function () {
    err.textContent = '';
  });
  form.appendChild(area);

  var enviar = document.createElement('button');
  enviar.type = 'submit';
  enviar.className = 'btn-primary';
  enviar.textContent = 'Publicar reseña';
  form.appendChild(enviar);

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var texto = area.value.trim();

    if (!estrellasElegidas || estrellasElegidas < 1 || estrellasElegidas > 5) {
      err.textContent = 'Falta la calificación.';
      return;
    }

    if (texto.length < 10) {
      err.textContent = 'La reseña debe tener al menos 10 caracteres.';
      area.focus();
      return;
    }

    enviar.disabled = true;
    enviar.textContent = 'Publicando...';

    fetch('../api/resenas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ producto_id: Number(productoId), estrellas: estrellasElegidas, texto: texto })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (response.status === 401) {
            try {
              window.localStorage.setItem('redirectAfterLogin', window.location.href);
            } catch (e) {}

            if (typeof window.showToast === 'function') {
              window.showToast('Iniciá sesión para publicar una reseña.');
            }

            setTimeout(function () {
              window.location.href = 'login.html';
            }, 1200);

            return { redirigido: true };
          }

          if (!response.ok || !data.ok) {
            throw new Error(data.error || data.mensaje || 'No se pudo publicar la reseña.');
          }

          return data;
        });
      })
      .then(function (data) {
        if (!data || data.redirigido) {
          return;
        }

        area.value = '';
        estrellasElegidas = 0;
        botones.forEach(function (b) {
          b.textContent = '☆';
          b.classList.remove('elegida');
        });

        if (typeof window.showToast === 'function') {
          window.showToast('Reseña publicada correctamente.');
        }

        var promedio = nodo.parentElement
          ? nodo.parentElement.querySelector('.resenas-promedio')
          : null;

        return cargarResenasProducto(productoId).then(function () {
          if (promedio) {
            pintarPromedioProducto(productoId, promedio);
          }
        });
      })
      .catch(function (error) {
        err.textContent = error.message || 'No se pudo publicar la reseña.';
      })
      .finally(function () {
        enviar.disabled = false;
        enviar.textContent = 'Publicar reseña';
      });
  });

  nodo.appendChild(form);
}
