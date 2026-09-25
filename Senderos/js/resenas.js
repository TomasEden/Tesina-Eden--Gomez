/* ═══════════════════════════════════════
   Senderos — Reseñas de servicios
   Listado, promedio y formulario (login requerido).
   ═══════════════════════════════════════ */

var RESENAS_CACHE = {};
var RESENAS_RESUMEN = null;

document.addEventListener('click', function (event) {
  var reintentar = event.target.closest('[data-resena-reintentar]');

  if (reintentar) {
    cargarResenasServicio(reintentar.dataset.resenaReintentar);
    return;
  }

  var verMas = event.target.closest('[data-resena-vermas]');

  if (verMas) {
    verMasResenas(verMas.dataset.resenaVermas);
    return;
  }

  var estrella = event.target.closest('[data-resena-estrella]');

  if (estrella) {
    seleccionarEstrellas(
      estrella.dataset.resenaSlug,
      Number(estrella.dataset.resenaEstrella)
    );
  }
});

document.addEventListener('submit', function (event) {
  var form = event.target.closest('[data-resena-form]');

  if (form) {
    enviarResena(event, form.dataset.resenaForm);
  }
});

document.addEventListener('input', function (event) {
  if (event.target && event.target.id && event.target.id.indexOf('textoResena_') === 0) {
    limpiarErrorResena(event.target.id.replace('textoResena_', ''));
  }
});

/* =========================================================
   SECCIÓN COMPLETA (la llama servicios.js en el panel)
   ========================================================= */

function renderSeccionResenas(servicioSlug, contenedorId) {
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
  promedio.id = 'promedio_' + servicioSlug;
  seccion.appendChild(promedio);

  var lista = document.createElement('div');
  lista.id = 'listaResenas_' + servicioSlug;
  seccion.appendChild(lista);

  var formBox = document.createElement('div');
  formBox.id = 'formResena_' + servicioSlug;
  seccion.appendChild(formBox);

  contenedor.appendChild(seccion);

  pintarPromedio(servicioSlug, promedio);
  pintarFormulario(servicioSlug, formBox);

  return cargarResenasServicio(servicioSlug).then(function () {
    return pintarPromedio(servicioSlug, promedio);
  });
}

function resumenServicio(slug) {
  if (!RESENAS_RESUMEN) {
    return null;
  }

  return RESENAS_RESUMEN[slug] || null;
}

function pintarPromedio(slug, nodo) {
  var res = resumenServicio(slug);
  var lista = RESENAS_CACHE[slug];

  function pintar(promedio, cantidad) {
    nodo.innerHTML = '';

    var avg = document.createElement('strong');
    avg.textContent = Number(promedio || 0).toFixed(1) + ' ★';
    nodo.appendChild(avg);

    var c = document.createElement('span');
    c.textContent = ' (' + Number(cantidad || 0) + ' reseñas)';
    nodo.appendChild(c);
  }

  if (res) {
    pintar(res.promedio, res.cantidad);
    return Promise.resolve();
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
      RESENAS_RESUMEN = {};

      (Array.isArray(data && data.resumen) ? data.resumen : []).forEach(function (fila) {
        RESENAS_RESUMEN[String(fila.servicio_slug)] = {
          promedio: Number(fila.promedio) || 0,
          cantidad: Number(fila.cantidad) || 0
        };
      });

      var actual = resumenServicio(slug);

      if (actual) {
        pintar(actual.promedio, actual.cantidad);
      } else if (Array.isArray(lista) && lista.length) {
        var suma = lista.reduce(function (acc, x) {
          return acc + (Number(x.estrellas) || 0);
        }, 0);
        pintar(suma / lista.length, lista.length);
      } else {
        pintar(0, 0);
      }
    })
    .catch(function () {
      if (Array.isArray(lista) && lista.length) {
        var suma = lista.reduce(function (acc, x) {
          return acc + (Number(x.estrellas) || 0);
        }, 0);
        pintar(suma / lista.length, lista.length);
      } else {
        pintar(0, 0);
      }
    });
}

function pintarFormulario(slug, nodo) {
  nodo.innerHTML = '';

  var sesion =
    typeof window.getSesion === 'function' ? window.getSesion() : null;

  if (!sesion) {
    var aviso = document.createElement('p');
    aviso.className = 'resenas-login-aviso';

    aviso.appendChild(
      document.createTextNode('Iniciá sesión para dejar tu reseña. ')
    );

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
  form.dataset.resenaForm = slug;

  var h3 = document.createElement('h3');
  h3.textContent = 'Dejá tu reseña';
  form.appendChild(h3);

  var grupo = document.createElement('div');
  grupo.className = 'resena-estrellas-input';
  grupo.setAttribute('role', 'radiogroup');
  grupo.setAttribute('aria-label', 'Calificación');

  for (var numero = 1; numero <= 5; numero++) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'estrella-btn';
    btn.textContent = '☆';
    btn.dataset.resenaEstrella = String(numero);
    btn.dataset.resenaSlug = slug;
    btn.setAttribute('aria-label', numero + ' estrellas');
    grupo.appendChild(btn);
  }

  form.appendChild(grupo);

  var hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.id = 'estrellas_' + slug;
  hidden.value = '';
  form.appendChild(hidden);

  var err = document.createElement('p');
  err.className = 'field-error';
  err.id = 'errResena_' + slug;
  err.setAttribute('role', 'alert');
  form.appendChild(err);

  var area = document.createElement('textarea');
  area.id = 'textoResena_' + slug;
  area.className = 'resena-textarea';
  area.minLength = 10;
  area.maxLength = 600;
  area.placeholder = 'Contanos tu experiencia...';
  form.appendChild(area);

  var enviar = document.createElement('button');
  enviar.type = 'submit';
  enviar.className = 'btn-primary';
  enviar.textContent = 'Publicar reseña';
  form.appendChild(enviar);

  nodo.appendChild(form);
}

/* =========================================================
   CARGAR RESEÑAS
   ========================================================= */

function cargarResenasServicio(servicioSlug) {
  var contenedor = document.getElementById('listaResenas_' + servicioSlug);

  if (!contenedor) {
    return Promise.resolve();
  }

  return fetch(
    '../api/resenas.php?servicio_slug=' + encodeURIComponent(servicioSlug),
    { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }
  )
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.ok) {
          throw new Error();
        }

        return Array.isArray(data.resenas) ? data.resenas : [];
      });
    })
    .then(function (resenas) {
      RESENAS_CACHE[servicioSlug] = resenas;
      renderResenas(servicioSlug, resenas);
    })
    .catch(function () {
      contenedor.innerHTML = '';

      var box = document.createElement('div');
      box.className = 'estado-msg';
      box.appendChild(document.createTextNode('No pudimos cargar las reseñas. '));

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Reintentar';
      btn.dataset.resenaReintentar = servicioSlug;
      box.appendChild(btn);

      contenedor.appendChild(box);

      if (typeof window.mostrarErrorConexion === 'function') {
        window.mostrarErrorConexion(function () {
          cargarResenasServicio(servicioSlug);
        });
      }
    });
}

/* =========================================================
   RENDER DE RESEÑAS
   ========================================================= */

function renderResenas(servicioSlug, resenas) {
  var contenedor = document.getElementById('listaResenas_' + servicioSlug);

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = '';

  if (!resenas.length) {
    var vacio = document.createElement('div');
    vacio.className = 'reviews-empty';
    vacio.textContent = 'Todavía no hay reseñas para este servicio. ¡Sé la primera!';
    contenedor.appendChild(vacio);
    return;
  }

  var limite = 3;
  var lista = document.createElement('div');
  lista.className = 'resenas-list';

  resenas.slice(0, limite).forEach(function (resena) {
    lista.appendChild(crearResenaNodo(resena));
  });

  contenedor.appendChild(lista);

  if (resenas.length > limite) {
    var ver = document.createElement('button');
    ver.type = 'button';
    ver.className = 'btn-ver-resenas';
    ver.textContent = 'Ver todas las reseñas';
    ver.dataset.resenaVermas = servicioSlug;
    contenedor.appendChild(ver);
  }
}

function crearResenaNodo(resena) {
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

function verMasResenas(servicioSlug) {
  var resenas = RESENAS_CACHE[servicioSlug];

  if (!Array.isArray(resenas)) {
    cargarResenasServicio(servicioSlug);
    return;
  }

  var contenedor = document.getElementById('listaResenas_' + servicioSlug);

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = '';

  var lista = document.createElement('div');
  lista.className = 'resenas-list';

  resenas.forEach(function (resena) {
    lista.appendChild(crearResenaNodo(resena));
  });

  contenedor.appendChild(lista);
}

/* =========================================================
   ESTRELLAS / FORMULARIO
   ========================================================= */

function seleccionarEstrellas(servicioSlug, cantidad) {
  var input = document.getElementById('estrellas_' + servicioSlug);

  if (input) {
    input.value = String(cantidad);
  }

  var form = document.querySelector('[data-resena-form="' + CSS.escape(servicioSlug) + '"]');

  if (!form) {
    return;
  }

  form.querySelectorAll('.estrella-btn').forEach(function (boton, indice) {
    boton.textContent = indice < cantidad ? '★' : '☆';
    boton.classList.toggle('elegida', indice < cantidad);
  });

  limpiarErrorResena(servicioSlug);
}

function limpiarErrorResena(servicioSlug) {
  var error = document.getElementById('errResena_' + servicioSlug);

  if (error) {
    error.textContent = '';
  }
}

function enviarResena(event, servicioSlug) {
  event.preventDefault();

  limpiarErrorResena(servicioSlug);

  var estrellas = Number(
    (document.getElementById('estrellas_' + servicioSlug) || {}).value || 0
  );
  var textarea = document.getElementById('textoResena_' + servicioSlug);
  var texto = (textarea ? textarea.value : '').trim();
  var error = document.getElementById('errResena_' + servicioSlug);

  function fallar(mensaje) {
    if (error) {
      error.textContent = mensaje;
    }

    if (textarea) {
      textarea.focus();
    }
  }

  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    fallar('Falta la calificación.');
    return;
  }

  if (texto.length < 10) {
    fallar('La reseña debe tener al menos 10 caracteres.');
    return;
  }

  if (texto.length > 600) {
    fallar('La reseña no puede superar los 600 caracteres.');
    return;
  }

  var boton = event.currentTarget
    ? event.currentTarget.querySelector('button[type="submit"]')
    : null;

  if (boton) {
    boton.disabled = true;
    boton.setAttribute('aria-busy', 'true');
    boton.textContent = 'Publicando...';
  }

  fetch('../api/resenas.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ servicio_slug: servicioSlug, estrellas: estrellas, texto: texto })
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (response.status === 401) {
          try {
            window.localStorage.setItem('redirectAfterLogin', window.location.href);
          } catch (e) {}

          if (typeof window.showToast === 'function') {
            window.showToast('Iniciá sesión para publicar una reseña.', 'info', {
              texto: 'Ingresar',
              href: 'login.html'
            });
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

      if (textarea) {
        textarea.value = '';
      }

      var input = document.getElementById('estrellas_' + servicioSlug);

      if (input) {
        input.value = '';
      }

      var form = document.querySelector('[data-resena-form="' + CSS.escape(servicioSlug) + '"]');

      if (form) {
        form.querySelectorAll('.estrella-btn').forEach(function (b) {
          b.textContent = '☆';
          b.classList.remove('elegida');
        });
      }

      RESENAS_RESUMEN = null;

      if (typeof window.showToast === 'function') {
        window.showToast('Reseña publicada correctamente.');
      }

      var promedio = document.getElementById('promedio_' + servicioSlug);

      if (promedio) {
        pintarPromedio(servicioSlug, promedio);
      }

      return cargarResenasServicio(servicioSlug);
    })
    .catch(function (error) {
      if (error && error.message === 'Iniciá sesión para publicar una reseña.') {
        return;
      }

      if (error) {
        fallar(error.message || 'No se pudo publicar la reseña.');
      }
    })
    .finally(function () {
      if (boton) {
        boton.disabled = false;
        boton.setAttribute('aria-busy', 'false');
        boton.textContent = 'Publicar reseña';
      }
    });
}
