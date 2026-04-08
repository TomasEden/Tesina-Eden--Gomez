/* SPA M — ofertas.js
   Módulo compartido: lee ofertas del admin y las aplica al sitio
   Incluir en: index.html, servicios.html, turnos.html, productos.html
*/

// ── Obtener ofertas activas para hoy ─────────────────────────────────────────
function getOfertasActivas() {
  var todas  = JSON.parse(localStorage.getItem('ofertas')) || [];
  var hoy    = new Date();
  var diaSem = hoy.getDay();

  return todas.filter(function(o) {
    if (o.estado === 'pausada') return false;

    // Verificar fecha de inicio
    if (o.inicio) {
      var inicio = new Date(o.inicio);
      if (hoy < inicio) return false;
    }

    // Verificar fecha de fin
    if (o.fin) {
      var fin = new Date(o.fin);
      fin.setHours(23, 59, 59);
      if (hoy > fin) return false;
    }

    // Verificar día de la semana
    if (o.dias && o.dias.length > 0) {
      if (o.dias.indexOf(diaSem) === -1) return false;
    }

    return true;
  });
}

// ── Obtener oferta aplicable a un item (servicio o producto) ─────────────────
function getOfertaParaItem(nombre, tipo) {
  // tipo: 'servicio' o 'producto'
  var activas = getOfertasActivas();

  // Buscar oferta específica primero (mayor prioridad)
  var especifica = activas.find(function(o) {
    return o.aplica === 'especifico' &&
           o.especifico.toLowerCase() === nombre.toLowerCase();
  });
  if (especifica) return especifica;

  // Buscar oferta por tipo
  var porTipo = activas.find(function(o) {
    return (o.aplica === 'servicios' && tipo === 'servicio') ||
           (o.aplica === 'productos' && tipo === 'producto');
  });
  if (porTipo) return porTipo;

  // Buscar oferta general
  return activas.find(function(o) { return o.aplica === 'todos'; }) || null;
}

// ── Calcular precio con descuento ─────────────────────────────────────────────
function calcularPrecioConOferta(precio, oferta) {
  if (!oferta) return precio;
  if (oferta.tipo === 'porcentaje' && oferta.descuento > 0) {
    return Math.round(precio * (1 - oferta.descuento / 100));
  }
  if (oferta.tipo === 'precio_fijo' && oferta.descuento > 0) {
    return oferta.descuento;
  }
  return precio; // 2x1 y texto no cambian el precio
}

// ── Generar badge HTML para una oferta ───────────────────────────────────────
function getBadgeOferta(oferta) {
  if (!oferta) return '';
  var color = oferta.color || '#AD717E';
  var texto = '';
  if (oferta.tipo === 'porcentaje') texto = oferta.descuento + '% OFF';
  else if (oferta.tipo === '2x1')   texto = '2x1';
  else if (oferta.tipo === 'precio_fijo') texto = 'Precio esp.';
  else texto = 'Oferta';
  return '<span class="oferta-badge-sitio" style="background:' + color + '">' + texto + '</span>';
}

// ── Generar HTML de precio con descuento ─────────────────────────────────────
function getPrecioHTML(precioOriginal, oferta) {
  if (!oferta || oferta.tipo === 'texto' || oferta.tipo === '2x1') {
    return '$' + precioOriginal.toLocaleString();
  }
  var precioFinal = calcularPrecioConOferta(precioOriginal, oferta);
  if (precioFinal === precioOriginal) return '$' + precioOriginal.toLocaleString();

  return '<span style="text-decoration:line-through;color:var(--text-light);font-size:0.85em">$' + precioOriginal.toLocaleString() + '</span> ' +
         '<span style="color:var(--rose-deep);font-weight:700">$' + precioFinal.toLocaleString() + '</span>';
}

// ── Actualizar ticker del index con ofertas activas ───────────────────────────
function actualizarTickerOfertas() {
  var track = document.getElementById('promoTrack');
  if (!track) return;

  var activas = getOfertasActivas();
  if (!activas.length) return; // Dejar el ticker por defecto

  // Limpiar y repoblar con ofertas reales
  track.innerHTML = '';

  // Duplicar para el loop infinito
  for (var rep = 0; rep < 2; rep++) {
    activas.forEach(function(o) {
      var item = document.createElement('span');
      item.className = 'promo-item';
      item.innerHTML = '<span class="promo-dot"></span> ' + (o.desc || o.nombre);
      track.appendChild(item);
    });
  }
}

// ── CSS para badges del sitio (inyectado una vez) ────────────────────────────
(function() {
  if (document.getElementById('ofertasBadgeStyle')) return;
  var style = document.createElement('style');
  style.id  = 'ofertasBadgeStyle';
  style.textContent =
    '.oferta-badge-sitio {' +
      'display:inline-block;' +
      'padding:0.2rem 0.65rem;' +
      'border-radius:50px;' +
      'font-size:0.68rem;' +
      'font-weight:700;' +
      'color:#fff;' +
      'letter-spacing:0.05em;' +
      'position:absolute;' +
      'top:0.7rem;' +
      'right:0.7rem;' +
      'z-index:2;' +
    '}';
  document.head.appendChild(style);
})();
