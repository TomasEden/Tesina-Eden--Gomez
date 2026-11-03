/* Senderos — favoritos-api.js
   Cliente de api/favoritos.php (tabla `favoritos`).

   El servidor es la fuente de verdad: cada favorito se guarda en la BD
   contra el usuario logueado. localStorage queda como caché local para
   que la página pinte al instante y siga funcionando si la red falla,
   pero se re-sincroniza contra el servidor en cada carga de página.

   Se usa el ID numérico del producto o servicio (no el slug), que es lo
   que guarda la tabla. Cargá este archivo ANTES de la lógica de cada
   página (index, productos, servicios, favoritos). */

(function () {
  'use strict';

  var CLAVE_PRODUCTOS = 'senderos-likes-productos';
  var CLAVE_SERVICIOS = 'senderos-likes';

  function leerLS(clave) {
    try {
      var lista = JSON.parse(window.localStorage.getItem(clave) || '[]');
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  function escribirLS(clave, lista) {
    try {
      window.localStorage.setItem(clave, JSON.stringify(lista));
    } catch (e) {}
  }

  function normalizarIds(lista) {
    var unicos = [];

    lista.forEach(function (valor) {
      var num = Number(valor);

      if (Number.isFinite(num) && num > 0 && unicos.indexOf(num) === -1) {
        unicos.push(num);
      }
    });

    return unicos;
  }

  /* ── Caché local (lectura síncrona para pintar rápido) ── */

  function cacheProductos() {
    return normalizarIds(leerLS(CLAVE_PRODUCTOS));
  }

  function cacheServicios() {
    return normalizarIds(leerLS(CLAVE_SERVICIOS));
  }

  /* ── Sincronización contra el servidor ── */

  /**
   * Trae los favoritos reales del usuario y actualiza la caché local.
   * Devuelve { productos:[], servicios:[] }. Si el servidor falla o no
   * hay sesión, devuelve la caché sin romper la página.
   */
  function sincronizar() {
    return fetch('../api/favoritos.php', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
      .then(function (respuesta) {
        /* 401 = sin sesión: la página se encarga de redirigir. */
        if (respuesta.status === 401) {
          return { productos: cacheProductos(), servicios: cacheServicios() };
        }

        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar los favoritos.');
        }

        return respuesta.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true) {
          throw new Error('Respuesta inválida del servidor.');
        }

        var productos = normalizarIds(data.productos || []);
        var servicios = normalizarIds(data.servicios || []);

        escribirLS(CLAVE_PRODUCTOS, productos);
        escribirLS(CLAVE_SERVICIOS, servicios);

        return { productos: productos, servicios: servicios };
      })
      .catch(function () {
        /* Sin red: se usa la caché para no dejar la página rota. */
        return { productos: cacheProductos(), servicios: cacheServicios() };
      });
  }

  /**
   * Alterna un favorito en el servidor y devuelve el estado nuevo.
   * `tipo` es 'producto' o 'servicio'; `refId` el ID numérico.
   * Si el servidor rechaza, se revierte la caché y se propaga el error.
   */
  function alternar(tipo, refId) {
    var esProducto = tipo === 'producto';
    var clave = esProducto ? CLAVE_PRODUCTOS : CLAVE_SERVICIOS;
    var lista = esProducto ? cacheProductos() : cacheServicios();
    var num = Number(refId);
    var estaba = lista.indexOf(num) !== -1;

    /* Actualización optimista: se pinta al instante y se confirma después. */
    var nueva = estaba
      ? lista.filter(function (x) {
          return x !== num;
        })
      : lista.concat([num]);

    escribirLS(clave, nueva);

    return fetch('../api/favoritos.php', {
      method: estaba ? 'DELETE' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ tipo: tipo, ref_id: num })
    })
      .then(function (respuesta) {
        return respuesta.json().then(function (data) {
          if (!respuesta.ok || !data.ok) {
            throw new Error(data.mensaje || data.error || 'No se pudo guardar el favorito.');
          }

          return { agregado: !estaba, productos: null, servicios: null };
        });
      })
      .catch(function (error) {
        /* Se revierte el cambio local para no dejar estado mentiroso. */
        escribirLS(clave, lista);
        throw error;
      });
  }

  window.FAVORITOS = {
    cacheProductos: cacheProductos,
    cacheServicios: cacheServicios,
    sincronizar: sincronizar,
    alternar: alternar
  };
})();
