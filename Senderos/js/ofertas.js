/* Senderos — ofertas.js
   Ticker y badges de muestra. Los precios de verdad los calcula el servidor
   (productos.php, servicios.php y carrito.php traen oferta + precio_final).
   Acá solo se leen las ofertas públicas activas hoy.
*/

var ofertasCache = [];
var ofertasPromise = null;

function normalizarOferta(o) {
  var dias = [];

  if (Array.isArray(o.dias)) {
    dias = o.dias.map(Number).filter(Number.isInteger);
  } else if (typeof o.dias === 'string' && o.dias.trim() !== '') {
    dias = o.dias
      .split(',')
      .map(function (x) {
        return Number(String(x).trim());
      })
      .filter(Number.isInteger);
  }

  return {
    id: Number(o.id) || 0,
    nombre: String(o.nombre || ''),
    desc: String(o.descripcion || o.desc || o.nombre || ''),
    tipo: String(o.tipo || ''),
    descuento: Number(o.descuento) || 0,
    aplica: String(o.aplica || ''),
    especifico: String(o.especifico || ''),
    inicio: o.fecha_inicio || o.inicio || null,
    fin: o.fecha_fin || o.fin || null,
    dias: dias,
    color: String(o.color || '#AD717E'),
    estado: String(o.estado || 'activa')
  };
}

function cargarOfertas() {
  if (!ofertasPromise) {
    ofertasPromise = fetch('../api/oferta.php?publicas=1', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        ofertasCache = Array.isArray(data && data.ofertas)
          ? data.ofertas.map(normalizarOferta)
          : [];

        try {
          window.dispatchEvent(new Event('ofertas:listas'));
        } catch (e) {}

        return ofertasCache;
      })
      .catch(function () {
        ofertasCache = [];
        return ofertasCache;
      });
  }

  return ofertasPromise;
}

function getOfertasActivas() {
  return ofertasCache.slice();
}

function especificoCoincide(especifico, nombre) {
  var esp = String(especifico || '').trim();
  var nom = String(nombre || '').trim();

  if (!esp || !nom) {
    return false;
  }

  if (esp.toLowerCase() === nom.toLowerCase()) {
    return true;
  }

  // Formato "tipo|id|Nombre": compara por la parte del nombre.
  var partes = esp.split('|');

  if (partes.length === 3) {
    return partes[2].trim().toLowerCase() === nom.toLowerCase();
  }

  return false;
}

// Oferta aplicable a un item, solo para mostrar (el precio final lo da el servidor).
function getOfertaParaItem(nombre, tipo) {
  var activas = getOfertasActivas();

  var especifica = activas.find(function (o) {
    return (
      o.aplica === 'especifico' && especificoCoincide(o.especifico, nombre)
    );
  });

  if (especifica) {
    return especifica;
  }

  var porTipo = activas.find(function (o) {
    return (
      (o.aplica === 'servicios' && tipo === 'servicio') ||
      (o.aplica === 'productos' && tipo === 'producto')
    );
  });

  if (porTipo) {
    return porTipo;
  }

  return (
    activas.find(function (o) {
      return o.aplica === 'todos';
    }) || null
  );
}

// Precio de muestra (el checkout y el carrito usan el precio_final del servidor).
function calcularPrecioConOferta(precio, oferta) {
  precio = Number(precio) || 0;

  if (!oferta) {
    return precio;
  }

  if (oferta.tipo === 'porcentaje' && oferta.descuento > 0) {
    return Math.round(precio * (1 - Math.min(oferta.descuento, 100) / 100));
  }

  if (oferta.tipo === 'precio_fijo' && oferta.descuento >= 0) {
    return Math.min(precio, oferta.descuento);
  }

  return precio; // 2x1 y texto no cambian el precio unitario
}

function getBadgeOferta(oferta) {
  if (!oferta) {
    return '';
  }

  var texto = 'Oferta';

  if (oferta.tipo === 'porcentaje') {
    texto = String(oferta.descuento) + '% OFF';
  } else if (oferta.tipo === '2x1') {
    texto = '2x1';
  } else if (oferta.tipo === 'precio_fijo') {
    texto = 'Precio especial';
  }

  var span = document.createElement('span');

  span.className = 'oferta-badge-sitio';
  span.style.background = String(oferta.color || '#AD717E');
  span.textContent = texto;

  return span.outerHTML;
}

function getPrecioHTML(precioOriginal, oferta) {
  var original = Number(precioOriginal) || 0;

  function soloPrecio(valor) {
    if (typeof window.formatoPrecio === 'function') {
      return window.escapeHTML(window.formatoPrecio(valor));
    }

    return window.escapeHTML('$' + Number(valor).toLocaleString('es-AR'));
  }

  if (
    !oferta ||
    oferta.tipo === 'texto' ||
    oferta.tipo === '2x1'
  ) {
    return soloPrecio(original);
  }

  var final = calcularPrecioConOferta(original, oferta);

  if (final >= original) {
    return soloPrecio(original);
  }

  return (
    '<span class="precio-tachado">' +
    soloPrecio(original) +
    '</span> ' +
    '<span class="precio-final">' +
    soloPrecio(final) +
    '</span>'
  );
}

// Copia real del ticker para una oferta, armada solo con campos
// estructurados (tipo, descuento, aplica): nunca texto libre del servidor,
// así no aparecen cargas de prueba tipo "sdassda".
function textoTickerOferta(oferta) {
  if (!oferta || String(oferta.estado) !== 'activa') {
    return '';
  }

  var alcance = '';

  if (oferta.aplica === 'todos') {
    alcance = 'en todo el catálogo';
  } else if (oferta.aplica === 'servicios') {
    alcance = 'en servicios';
  } else if (oferta.aplica === 'productos') {
    alcance = 'en productos';
  } else if (oferta.aplica === 'especifico') {
    /* Ofertas puntuales: solo entran si traen el formato viejo
       "tipo|id|Nombre" (ahí sí hay un nombre real que mostrar). */
    var partes = String(oferta.especifico || '').split('|');

    if (partes.length !== 3 || !String(partes[2] || '').trim()) {
      return '';
    }

    alcance = 'en ' + String(partes[2]).trim();
  } else {
    return '';
  }

  if (oferta.tipo === 'porcentaje' && Number(oferta.descuento) > 0) {
    return Number(oferta.descuento) + '% OFF ' + alcance;
  }

  if (oferta.tipo === '2x1') {
    return '2x1 ' + alcance;
  }

  if (oferta.tipo === 'precio_fijo' && Number(oferta.descuento) >= 0) {
    return 'Precio especial ' + alcance;
  }

  if (oferta.tipo === 'texto') {
    var texto = String(oferta.desc || '').trim();

    /* Texto libre del admin: se muestra solo si es una frase legible. */
    if (texto.length >= 6 && texto.length <= 90 && / /.test(texto)) {
      return texto;
    }

    return '';
  }

  return '';
}

// Ticker del inicio: datos reales del negocio (HTML) + ofertas activas.
function actualizarTickerOfertas() {
  var track = document.getElementById('promoTrack');

  if (!track) {
    return Promise.resolve();
  }

  /* El contenido base (datos del negocio) se guarda en la primera pasada:
     así se puede re-renderizar sin duplicar el track. */
  if (!window.__tickerBase) {
    var vistos = {};

    window.__tickerBase = Array.prototype.filter
      .call(track.querySelectorAll('.promo-item'), function (el) {
        var texto = (el.textContent || '').replace(/\s+/g, ' ').trim();

        if (!texto || vistos[texto]) {
          return false;
        }

        vistos[texto] = true;
        el.setAttribute('data-ticker-base', '1');
        el.__tickerTexto = texto;
        return true;
      })
      .map(function (el) {
        return el.__tickerTexto;
      });
  }

  if (!window.__tickerBase.length) {
    return Promise.resolve();
  }

  return cargarOfertas().then(function (activas) {
    var textos = window.__tickerBase.slice();

    activas.forEach(function (o) {
      var texto = textoTickerOferta(o);

      if (texto && textos.indexOf(texto) === -1) {
        textos.push(texto);
      }
    });

    if (!textos.length) {
      return;
    }

    track.innerHTML = '';

    for (var rep = 0; rep < 2; rep++) {
      textos.forEach(function (texto) {
        var item = document.createElement('span');

        item.className = 'promo-item';

        var dot = document.createElement('span');

        dot.className = 'promo-dot';
        item.appendChild(dot);

        item.appendChild(document.createTextNode(' ' + texto));

        track.appendChild(item);
      });
    }
  });
}
