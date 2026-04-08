/* SPA M - servicios.js */

var SERVICIOS = [
  { id:'masaje-relajante', nombre:'Masaje Relajante',            categoria:'Masajes',         desc:'Tecnica sueca de cuerpo completo para liberar tensiones musculares y calmar la mente.', duracion:'60 min', precio:5000, badge:'popular', badgeText:'Mas reservado', likes:128, img:'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80' },
  { id:'masaje-piedras',   nombre:'Masaje con Piedras Calientes', categoria:'Masajes',         desc:'Piedras volcanicas de basalto que penetran el calor en los musculos profundos.',         duracion:'75 min', precio:6500, badge:null,      badgeText:'',              likes:87,  img:'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
  { id:'facial-premium',   nombre:'Tratamiento Facial Premium',   categoria:'Faciales',        desc:'Limpieza profunda, exfoliacion e hidratacion intensiva con productos de alta cosmetica.', duracion:'30 min', precio:3000, badge:'nuevo',   badgeText:'Nuevo',         likes:64,  img:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80' },
  { id:'facial-antiage',   nombre:'Facial Anti-Age',              categoria:'Faciales',        desc:'Tratamiento reafirmante con acido hialuronico y vitamina C para una piel radiante.',     duracion:'45 min', precio:4500, badge:null,      badgeText:'',              likes:53,  img:'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80' },
  { id:'jacuzzi',          nombre:'Jacuzzi Privado',              categoria:'Spa & Relax',     desc:'Sesion privada de hidroterapia con sales minerales y aceites esenciales.',                duracion:'80 min', precio:5000, badge:'popular', badgeText:'2x1 jueves',    likes:201, img:'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=600&q=80' },
  { id:'aromaterapia',     nombre:'Aromaterapia',                 categoria:'Spa & Relax',     desc:'Masaje suave con aceites esenciales premium. Alivia el estres y mejora el sueno.',       duracion:'50 min', precio:4000, badge:null,      badgeText:'',              likes:76,  img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80' },
  { id:'manicura',         nombre:'Manicura & Pedicura',          categoria:'Unas & Estetica', desc:'Cuidado completo de manos y pies con esmaltado semipermanente incluido.',                 duracion:'45 min', precio:2500, badge:null,      badgeText:'',              likes:95,  img:'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80' },
  { id:'depilacion',       nombre:'Depilacion con Cera',          categoria:'Unas & Estetica', desc:'Depilacion profesional con cera natural de alta temperatura. Resultado duradero.',        duracion:'40 min', precio:2000, badge:null,      badgeText:'',              likes:44,  img:'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80' },
  { id:'reflexologia',     nombre:'Reflexologia Podal',           categoria:'Masajes',         desc:'Tecnica de presion en puntos reflejos del pie que activan la energia del cuerpo.',        duracion:'40 min', precio:3500, badge:'nuevo',   badgeText:'Nuevo',         likes:31,  img:'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=600&q=80' }
];

var categoriaActiva = 'todas';
var likesGuardados  = JSON.parse(localStorage.getItem('likes')) || [];

document.addEventListener('DOMContentLoaded', function() {
  actualizarNavbar();
  renderCategoryBar();
  renderServicios();
  window.addEventListener('scroll', function() {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function renderCategoryBar() {
  var cats = ['todas'];
  SERVICIOS.forEach(function(s) { if (cats.indexOf(s.categoria) === -1) cats.push(s.categoria); });
  var bar = document.getElementById('categoryBar');
  if (!bar) return;
  bar.innerHTML = '';
  cats.forEach(function(cat) {
    var count = cat === 'todas' ? SERVICIOS.length : SERVICIOS.filter(function(s) { return s.categoria === cat; }).length;
    var btn = document.createElement('button');
    btn.className = 'cat-tab' + (cat === 'todas' ? ' active' : '');
    btn.innerHTML = (cat === 'todas' ? 'Todos' : cat) + ' <span class="cat-count">' + count + '</span>';
    btn.addEventListener('click', function() {
      categoriaActiva = cat;
      document.querySelectorAll('.cat-tab').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderServicios();
    });
    bar.appendChild(btn);
  });
}

function renderServicios() {
  var grid  = document.getElementById('servicesGrid');
  var empty = document.getElementById('emptyState');
  if (!grid) return;
  grid.innerHTML = '';

  var lista = categoriaActiva === 'todas'
    ? SERVICIOS
    : SERVICIOS.filter(function(s) { return s.categoria === categoriaActiva; });

  if (!lista.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  lista.forEach(function(s, i) {
    var liked   = likesGuardados.indexOf(s.id) !== -1;
    var likeCnt = liked ? s.likes + 1 : s.likes;
    // Oferta activa para este servicio
    var oferta = (typeof getOfertaParaItem === 'function') ? getOfertaParaItem(s.nombre, 'servicio') : null;
    var badgeHTML = '';
    if (oferta) {
      badgeHTML = getBadgeOferta(oferta).replace('position:absolute;', '').replace('top:0.7rem;right:0.7rem;', '');
      badgeHTML = '<span class="service-badge" style="background:' + (oferta.color || '#AD717E') + '">' +
        (oferta.tipo === 'porcentaje' ? oferta.descuento + '% OFF' : oferta.tipo === '2x1' ? '2x1' : oferta.nombre) + '</span>';
    } else {
      badgeHTML = s.badge ? '<span class="service-badge ' + s.badge + '">' + s.badgeText + '</span>' : '';
    }
    var heartIcon = liked ? '&#10084;&#65039;' : '&#129293;';

    var card = document.createElement('div');
    card.className = 'service-card';
    card.style.animationDelay = (i * 0.07) + 's';
    card.innerHTML =
      '<div class="service-img-wrap">' +
        '<img class="service-img" src="' + s.img + '" alt="' + s.nombre + '"/>' +
        badgeHTML +
        '<div class="service-likes' + (liked ? ' liked' : '') + '" onclick="toggleLike(\'' + s.id + '\', this)">' +
          heartIcon + ' <span>' + likeCnt + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="service-body">' +
        '<div class="service-meta">' +
          '<span class="service-cat">' + s.categoria + '</span>' +
          '<span class="service-price">' + (oferta ? getPrecioHTML(s.precio, oferta) : '$' + s.precio.toLocaleString()) + '</span>' +
        '</div>' +
        '<h3 class="service-name">' + s.nombre + '</h3>' +
        '<p class="service-desc">' + s.desc + '</p>' +
        '<div class="service-footer">' +
          '<span class="service-duracion">&#9201; ' + s.duracion + '</span>' +
          '<a href="turnos.html?servicio=' + s.id + '" class="btn-reservar">Reservar</a>' +
        '</div>' +
      '</div>';
    grid.appendChild(card);
  });
}

function toggleLike(id, el) {
  var servicio = SERVICIOS.find(function(s) { return s.id === id; });
  var idx = likesGuardados.indexOf(id);
  var span = el.querySelector('span');
  if (idx === -1) {
    likesGuardados.push(id);
    el.innerHTML = '&#10084;&#65039; <span>' + (servicio.likes + 1) + '</span>';
    el.classList.add('liked');
  } else {
    likesGuardados.splice(idx, 1);
    el.innerHTML = '&#129293; <span>' + servicio.likes + '</span>';
    el.classList.remove('liked');
  }
  localStorage.setItem('likes', JSON.stringify(likesGuardados));
}
