/* ═══════════════════════════════════════
   SPA M — servicios.js
   ═══════════════════════════════════════ */

// ── Catálogo de servicios ───────────────────────────────────────────────────
const SERVICIOS = [
  {
    id: 'masaje-relajante',
    nombre: 'Masaje Relajante',
    categoria: 'Masajes',
    desc: 'Técnica sueca de cuerpo completo para liberar tensiones musculares y calmar la mente.',
    duracion: '60 min',
    precio: 5000,
    badge: 'popular',
    badgeText: 'Más reservado',
    likes: 128,
    img: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80'
  },
  {
    id: 'masaje-piedras',
    nombre: 'Masaje con Piedras Calientes',
    categoria: 'Masajes',
    desc: 'Piedras volcánicas de basalto que penetran el calor en los músculos profundos.',
    duracion: '75 min',
    precio: 6500,
    badge: null,
    likes: 87,
    img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80'
  },
  {
    id: 'facial-premium',
    nombre: 'Tratamiento Facial Premium',
    categoria: 'Faciales',
    desc: 'Limpieza profunda, exfoliación e hidratación intensiva con productos de alta cosmética.',
    duracion: '30 min',
    precio: 3000,
    badge: 'nuevo',
    badgeText: 'Nuevo',
    likes: 64,
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80'
  },
  {
    id: 'facial-antiage',
    nombre: 'Facial Anti-Age',
    categoria: 'Faciales',
    desc: 'Tratamiento reafirmante con ácido hialurónico y vitamina C para una piel radiante.',
    duracion: '45 min',
    precio: 4500,
    badge: null,
    likes: 53,
    img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80'
  },
  {
    id: 'jacuzzi',
    nombre: 'Jacuzzi Privado',
    categoria: 'Spa & Relax',
    desc: 'Sesión privada de hidroterapia con sales minerales y aceites esenciales.',
    duracion: '80 min',
    precio: 5000,
    badge: 'popular',
    badgeText: '2x1 jueves',
    likes: 201,
    img: 'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=600&q=80'
  },
  {
    id: 'aromaterapia',
    nombre: 'Aromaterapia',
    categoria: 'Spa & Relax',
    desc: 'Masaje suave con aceites esenciales premium. Alivia el estrés y mejora el sueño.',
    duracion: '50 min',
    precio: 4000,
    badge: null,
    likes: 76,
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80'
  },
  {
    id: 'manicura',
    nombre: 'Manicura & Pedicura',
    categoria: 'Uñas & Estética',
    desc: 'Cuidado completo de manos y pies con esmaltado semipermanente incluido.',
    duracion: '45 min',
    precio: 2500,
    badge: null,
    likes: 95,
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80'
  },
  {
    id: 'depilacion',
    nombre: 'Depilación con Cera',
    categoria: 'Uñas & Estética',
    desc: 'Depilación profesional con cera natural de alta temperatura. Resultado duradero.',
    duracion: '40 min',
    precio: 2000,
    badge: null,
    likes: 44,
    img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80'
  },
  {
    id: 'reflexologia',
    nombre: 'Reflexología Podal',
    categoria: 'Masajes',
    desc: 'Técnica de presión en puntos reflejos del pie que activan la energía del cuerpo.',
    duracion: '40 min',
    precio: 3500,
    badge: 'nuevo',
    badgeText: 'Nuevo',
    likes: 31,
    img: 'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=600&q=80'
  }
];

// ── Estado ──────────────────────────────────────────────────────────────────
let categoriaActiva = 'todas';
let likesGuardados  = JSON.parse(localStorage.getItem('likes')) || [];

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  renderCategoryBar();
  renderServicios();

  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

// ── Navbar ──────────────────────────────────────────────────────────────────


`;
    btn.href = 'mis-turnos.html';
  }
}

// ── Toast ───────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Barra de categorías ─────────────────────────────────────────────────────
function renderCategoryBar() {
  const categorias = ['todas', ...new Set(SERVICIOS.map(s => s.categoria))];
  const bar = document.getElementById('categoryBar');

  categorias.forEach(cat => {
    const count = cat === 'todas'
      ? SERVICIOS.length
      : SERVICIOS.filter(s => s.categoria === cat).length;

    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (cat === 'todas' ? ' active' : '');
    btn.innerHTML = `
      ${cat === 'todas' ? 'Todos' : cat}
      <span class="cat-count">${count}</span>`;
    btn.addEventListener('click', () => {
      categoriaActiva = cat;
      document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderServicios();
    });
    bar.appendChild(btn);
  });
}

// ── Render servicios ────────────────────────────────────────────────────────
function renderServicios() {
  const grid  = document.getElementById('servicesGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '';

  const lista = categoriaActiva === 'todas'
    ? SERVICIOS
    : SERVICIOS.filter(s => s.categoria === categoriaActiva);

  if (lista.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  lista.forEach((s, i) => {
    const liked   = likesGuardados.includes(s.id);
    const likeCnt = liked ? s.likes + 1 : s.likes;

    let badgeHTML = '';
    if (s.badge) {
      badgeHTML = `<span class="service-badge ${s.badge}">${s.badgeText}</span>`;
    }

    const card = document.createElement('div');
    card.className = 'service-card';
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="service-img-wrap">
        <img class="service-img" src="${s.img}" alt="${s.nombre}"/>
        ${badgeHTML}
        <div class="service-likes ${liked ? 'liked' : ''}" onclick="toggleLike('${s.id}', this)">
          ${liked ? '❤️' : '🤍'} <span>${likeCnt}</span>
        </div>
      </div>
      <div class="service-body">
        <div class="service-meta">
          <span class="service-cat">${s.categoria}</span>
          <span class="service-price">$${s.precio.toLocaleString()}</span>
        </div>
        <h3 class="service-name">${s.nombre}</h3>
        <p class="service-desc">${s.desc}</p>
        <div class="service-footer">
          <span class="service-duracion">⏱ ${s.duracion}</span>
          <a href="turnos.html?servicio=${s.id}" class="btn-reservar">Reservar</a>
        </div>
      </div>`;

    grid.appendChild(card);
  });
}

// ── Toggle like ─────────────────────────────────────────────────────────────
function toggleLike(id, el) {
  const idx = likesGuardados.indexOf(id);
  const servicio = SERVICIOS.find(s => s.id === id);
  const span = el.querySelector('span');

  if (idx === -1) {
    likesGuardados.push(id);
    el.innerHTML = `❤️ <span>${servicio.likes + 1}</span>`;
    el.classList.add('liked');
  } else {
    likesGuardados.splice(idx, 1);
    el.innerHTML = `🤍 <span>${servicio.likes}</span>`;
    el.classList.remove('liked');
  }

  localStorage.setItem('likes', JSON.stringify(likesGuardados));
}
