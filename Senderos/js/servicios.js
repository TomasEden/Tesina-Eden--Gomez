/* ═══════════════════════════════════════
   Senderos — servicios.js  v2
   Panel lateral de reserva + reseñas
   ═══════════════════════════════════════ */

// ── Catálogo ─────────────────────────────────────────────────────────────────
const SERVICIOS = [
  {
    id: 'masaje-relajante',
    nombre: 'Masaje Relajante',
    categoria: 'Masajes',
    desc: 'Técnica sueca de cuerpo completo para liberar tensiones musculares y calmar la mente. Ideal para el estrés cotidiano.',
    duracion: '60 min',
    precio: 5000,
    badge: 'popular', badgeText: 'Más reservado', likes: 128,
    img: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=700&q=80',
    incluye: ['Aceites esenciales premium', 'Música relajante', 'Infusión de cortesía'],
    disponible: true
  },
  {
    id: 'masaje-piedras',
    nombre: 'Masaje con Piedras Calientes',
    categoria: 'Masajes',
    desc: 'Piedras volcánicas de basalto que penetran el calor profundo en los músculos. Libera contracturas y mejora la circulación.',
    duracion: '75 min',
    precio: 6500,
    badge: null, likes: 87,
    img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=700&q=80',
    incluye: ['Piedras de basalto volcánico', 'Aceite de argán', 'Toalla caliente'],
    disponible: true
  },
  {
    id: 'masaje-deportivo',
    nombre: 'Masaje Deportivo',
    categoria: 'Masajes',
    desc: 'Técnica de alta presión para deportistas. Trabaja grupos musculares específicos y acelera la recuperación.',
    duracion: '50 min',
    precio: 5500,
    badge: null, likes: 60,
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80',
    incluye: ['Evaluación postural inicial', 'Crema muscular', 'Estiramiento final'],
    disponible: true
  },
  {
    id: 'reflexologia',
    nombre: 'Reflexología Podal',
    categoria: 'Masajes',
    desc: 'Presión en puntos reflejos del pie que activan la energía del cuerpo y equilibran los órganos internos.',
    duracion: '40 min',
    precio: 3500,
    badge: 'nuevo', badgeText: 'Nuevo', likes: 31,
    img: 'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=700&q=80',
    incluye: ['Baño de pies aromatizado', 'Crema exfoliante', 'Mapa de puntos reflejos'],
    disponible: true
  },
  {
    id: 'facial-premium',
    nombre: 'Tratamiento Facial Premium',
    categoria: 'Faciales',
    desc: 'Limpieza profunda, exfoliación e hidratación intensiva con productos de alta cosmética natural.',
    duracion: '30 min',
    precio: 3000,
    badge: 'nuevo', badgeText: 'Nuevo', likes: 64,
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700&q=80',
    incluye: ['Limpieza enzimática', 'Sérum vitamina C', 'Mascarilla hidratante'],
    disponible: true
  },
  {
    id: 'facial-antiage',
    nombre: 'Facial Anti-Age',
    categoria: 'Faciales',
    desc: 'Tratamiento reafirmante con ácido hialurónico y vitamina C para una piel luminosa y rejuvenecida.',
    duracion: '45 min',
    precio: 4500,
    badge: null, likes: 53,
    img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=700&q=80',
    incluye: ['Micro-corriente facial', 'Ácido hialurónico', 'Crema de retinol'],
    disponible: true
  },
  {
    id: 'jacuzzi',
    nombre: 'Jacuzzi Privado',
    categoria: 'Spa & Relax',
    desc: 'Sesión privada de hidroterapia con sales minerales y aceites esenciales. Para dos personas o individual.',
    duracion: '80 min',
    precio: 5000,
    badge: 'popular', badgeText: '2×1 Jueves', likes: 201,
    img: 'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=700&q=80',
    incluye: ['Sales del Himalaya', 'Aceites esenciales', 'Copas de espumante', 'Velas aromáticas'],
    disponible: true
  },
  {
    id: 'aromaterapia',
    nombre: 'Aromaterapia',
    categoria: 'Spa & Relax',
    desc: 'Masaje suave con aceites esenciales premium. Alivia el estrés, mejora el sueño y eleva el ánimo.',
    duracion: '50 min',
    precio: 4000,
    badge: null, likes: 76,
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=700&q=80',
    incluye: ['Difusor de aromas', 'Blend personalizado', 'Guía de aceites para llevar'],
    disponible: true
  },
  {
    id: 'manicura',
    nombre: 'Manicura & Pedicura',
    categoria: 'Uñas & Estética',
    desc: 'Cuidado completo de manos y pies con esmaltado semipermanente incluido y exfoliación.',
    duracion: '45 min',
    precio: 2500,
    badge: null, likes: 95,
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=700&q=80',
    incluye: ['Esmaltado semipermanente', 'Exfoliante de azúcar', 'Crema de parafina'],
    disponible: true
  },
  {
    id: 'depilacion',
    nombre: 'Depilación con Cera',
    categoria: 'Uñas & Estética',
    desc: 'Depilación profesional con cera natural de alta temperatura. Resultado duradero y piel suave.',
    duracion: '40 min',
    precio: 2000,
    badge: null, likes: 44,
    img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=700&q=80',
    incluye: ['Cera de avena', 'Aceite post-depilación', 'Talco especial'],
    disponible: true
  }
];

// ── Estado ───────────────────────────────────────────────────────────────────
let categoriaActiva = 'todas';
let servicioActivo  = null;
let likesGuardados  = JSON.parse(localStorage.getItem('likes') || '[]');
let carrito         = JSON.parse(localStorage.getItem('carrito') || '[]');

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  renderCategoryBar();
  renderServicios();

  // Scroll navbar
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Cerrar panel con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarPanel();
  });
});

// ── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── CATEGORÍAS ───────────────────────────────────────────────────────────────
function renderCategoryBar() {
  const cats = ['todas', ...new Set(SERVICIOS.map(s => s.categoria))];
  const bar  = document.getElementById('categoryBar');
  if (!bar) return;

  bar.innerHTML = cats.map(cat => {
    const count = cat === 'todas' ? SERVICIOS.length : SERVICIOS.filter(s => s.categoria === cat).length;
    return `<button class="cat-tab${cat === 'todas' ? ' active' : ''}" onclick="filtrarCat('${cat}', this)">
      ${cat === 'todas' ? 'Todos' : cat}
      <span class="cat-count">${count}</span>
    </button>`;
  }).join('');
}

function filtrarCat(cat, btn) {
  categoriaActiva = cat;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderServicios();
}

// ── RENDER TARJETAS ──────────────────────────────────────────────────────────
function renderServicios() {
  const grid  = document.getElementById('servicesGrid');
  const empty = document.getElementById('emptyState');
  if (!grid) return;
  grid.innerHTML = '';

  const lista = categoriaActiva === 'todas'
    ? SERVICIOS
    : SERVICIOS.filter(s => s.categoria === categoriaActiva);

  if (!lista.length) {
    empty?.classList.remove('hidden');
    return;
  }
  empty?.classList.add('hidden');

  lista.forEach((s, i) => {
    const liked   = likesGuardados.includes(s.id);
    const likeCnt = liked ? s.likes + 1 : s.likes;
    const prom    = typeof getPromedioEstrellas === 'function' ? getPromedioEstrellas(s.id) : 0;
    const enCarrito = carrito.some(c => c.id === s.id);

    const card = document.createElement('div');
    card.className = 'service-card reveal';
    card.style.animationDelay = `${i * 0.06}s`;
    card.dataset.id = s.id;

    card.innerHTML = `
      <div class="service-img-wrap" onclick="abrirPanel('${s.id}')">
        <img class="service-img" src="${s.img}" alt="${s.nombre}" loading="lazy"/>
        ${s.badge ? `<span class="service-badge ${s.badge}">${s.badgeText}</span>` : ''}
        <button class="service-likes ${liked ? 'liked' : ''}" onclick="event.stopPropagation();toggleLike('${s.id}',this)" aria-label="Like">
          <span class="like-icon">${liked ? '❤️' : '🤍'}</span>
          <span class="like-count">${likeCnt}</span>
        </button>
      </div>
      <div class="service-body">
        <div class="service-meta">
          <span class="service-cat">${s.categoria}</span>
          ${prom > 0 ? `<span class="service-rating">★ ${prom}</span>` : ''}
        </div>
        <h3 class="service-name" onclick="abrirPanel('${s.id}')">${s.nombre}</h3>
        <p class="service-desc">${s.desc}</p>
        <div class="service-footer">
          <div>
            <span class="service-duracion">⏱ ${s.duracion}</span>
            <span class="service-price">$${s.precio.toLocaleString('es-AR')}</span>
          </div>
          <button class="btn-ver-servicio" onclick="abrirPanel('${s.id}')">Ver detalle</button>
        </div>
      </div>`;

    grid.appendChild(card);
  });

  // Activar scroll reveal
  if (typeof IntersectionObserver !== 'undefined') {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  } else {
    grid.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

// ── PANEL LATERAL ────────────────────────────────────────────────────────────
function abrirPanel(id) {
  const s = SERVICIOS.find(x => x.id === id);
  if (!s) return;
  servicioActivo = s;

  const panel   = document.getElementById('srvPanel');
  const overlay = document.getElementById('srvOverlay');
  if (!panel) return;

  const prom  = typeof getPromedioEstrellas === 'function' ? getPromedioEstrellas(id) : 0;
  const cant  = typeof getResenasPorServicio === 'function' ? getResenasPorServicio(id).length : 0;
  const liked = likesGuardados.includes(id);
  const enCarrito = carrito.some(c => c.id === id);

  const starsHtml = prom > 0
    ? Array.from({length:5}, (_,i) => `<span style="color:${i < Math.round(prom)?'#f0a800':'#ddd'}">★</span>`).join('')
    : '';

  panel.innerHTML = `
    <!-- Imagen con cierre -->
    <div class="panel-img-wrap">
      <img src="${s.img}" alt="${s.nombre}" loading="lazy"/>
      <div class="panel-img-overlay"></div>
      <button class="panel-close" onclick="cerrarPanel()" aria-label="Cerrar">✕</button>
      <div class="panel-img-info">
        <span class="service-cat">${s.categoria}</span>
        <h2 class="panel-nombre">${s.nombre}</h2>
        <div class="panel-meta-row">
          <span class="panel-duracion">⏱ ${s.duracion}</span>
          ${prom > 0 ? `<span class="panel-rating">${starsHtml} <em>${prom}</em> (${cant})</span>` : ''}
        </div>
      </div>
      ${s.badge ? `<span class="service-badge ${s.badge}">${s.badgeText}</span>` : ''}
    </div>

    <!-- Cuerpo scrolleable -->
    <div class="panel-body">

      <!-- Precio + botón de reserva sticky -->
      <div class="panel-precio-bar">
        <div>
          <div class="panel-precio">$${s.precio.toLocaleString('es-AR')}</div>
          <div class="panel-precio-sub">por sesión</div>
        </div>
        <button class="btn-reservar-panel" onclick="agregarServicioCarrito('${s.id}')">
          Agregar al carrito
        </button>
      </div>

      <!-- Descripción -->
      <p class="panel-desc">${s.desc}</p>

      <!-- Incluye -->
      <div class="panel-incluye">
        <h4 class="panel-section-title">¿Qué incluye?</h4>
        <ul class="panel-incluye-list">
          ${s.incluye.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>

      <!-- RESERVA INLINE -->
      <div class="panel-reserva-inline hidden" id="reservaInline">
        <h4 class="panel-section-title">Elegí tu turno</h4>

        <!-- Paso 1: fecha -->
        <div class="reserva-paso" id="rpaso1">
          <p class="rpaso-label">Seleccioná la fecha</p>
          <div class="mini-cal" id="miniCal"></div>
        </div>

        <!-- Paso 2: horario (aparece al elegir fecha) -->
        <div class="reserva-paso hidden" id="rpaso2">
          <p class="rpaso-label">Elegí el horario</p>
          <div class="mini-horarios" id="miniHorarios"></div>
          <button class="btn-volver-paso" onclick="volverAPaso1()">← Cambiar fecha</button>
        </div>

        <!-- Paso 3: confirmar -->
        <div class="reserva-paso hidden" id="rpaso3">
          <div class="reserva-resumen" id="reservaResumen"></div>
          <button class="btn-confirmar-reserva" onclick="confirmarReserva()">Confirmar reserva</button>
          <button class="btn-volver-paso" onclick="volverAPaso2()">← Cambiar horario</button>
        </div>
      </div>

      <!-- Otros servicios sugeridos -->
      <div class="panel-sugeridos">
        <h4 class="panel-section-title">También podría interesarte</h4>
        <div class="sugeridos-lista">
          ${SERVICIOS.filter(x => x.id !== id && x.categoria === s.categoria).slice(0,2).map(x => `
            <div class="sugerido-item" onclick="abrirPanel('${x.id}')">
              <img src="${x.img}" alt="${x.nombre}" loading="lazy"/>
              <div>
                <div class="sugerido-nombre">${x.nombre}</div>
                <div class="sugerido-precio">$${x.precio.toLocaleString('es-AR')} · ${x.duracion}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Reseñas -->
      <div id="resenasPanelWrap"></div>
    </div>`;

  panel.classList.add('open');
  overlay.classList.add('show');
  document.body.classList.add('panel-open');

  // Renderizar reseñas
  if (typeof renderSeccionResenas === 'function') {
    renderSeccionResenas(id, 'resenasPanelWrap');
  }

  // Construir calendario
  buildMiniCal();
}

function cerrarPanel() {
  document.getElementById('srvPanel')?.classList.remove('open');
  document.getElementById('srvOverlay')?.classList.remove('show');
  document.body.classList.remove('panel-open');
  servicioActivo = null;
}

// ── RESERVA INLINE ───────────────────────────────────────────────────────────
let fechaSeleccionada = null;
let horarioSeleccionado = null;

function abrirReservaInline() {
  const inline = document.getElementById('reservaInline');
  if (!inline) return;
  const isOpen = !inline.classList.contains('hidden');
  inline.classList.toggle('hidden', isOpen);

  if (!isOpen) {
    // Scroll al bloque
    setTimeout(() => inline.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    buildMiniCal();
  }
}

function buildMiniCal() {
  const cal = document.getElementById('miniCal');
  if (!cal) return;

  const hoy   = new Date();
  const year  = hoy.getFullYear();
  const month = hoy.getMonth();
  const primerDia = new Date(year, month, 1).getDay();
  const diasMes   = new Date(year, month + 1, 0).getDate();

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dias  = ['D','L','M','M','J','V','S'];

  let html = `
    <div class="mcal-header">
      <span class="mcal-mes">${meses[month]} ${year}</span>
    </div>
    <div class="mcal-dias-semana">
      ${dias.map(d => `<span>${d}</span>`).join('')}
    </div>
    <div class="mcal-grid">`;

  // Blancos iniciales
  for (let i = 0; i < primerDia; i++) html += '<span></span>';

  for (let d = 1; d <= diasMes; d++) {
    const fecha = new Date(year, month, d);
    const pasado = fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const esHoy  = d === hoy.getDate();
    const cls = pasado ? 'mcal-day disabled' : esHoy ? 'mcal-day today' : 'mcal-day';
    const click = pasado ? '' : `onclick="seleccionarFecha('${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}', this)"`;
    html += `<button class="${cls}" ${click}>${d}</button>`;
  }

  html += '</div>';
  cal.innerHTML = html;
}

function seleccionarFecha(fecha, btn) {
  fechaSeleccionada  = fecha;
  horarioSeleccionado = null;

  document.querySelectorAll('.mcal-day.selected').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  document.getElementById('rpaso1')?.classList.add('hidden');
  document.getElementById('rpaso2')?.classList.remove('hidden');
  buildMiniHorarios();
}

function buildMiniHorarios() {
  const cont = document.getElementById('miniHorarios');
  if (!cont) return;

  const slots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
  const turnosGuardados = JSON.parse(localStorage.getItem('turnosGuardados') || '[]');
  const ocupados = turnosGuardados
    .filter(t => t.fecha === fechaSeleccionada)
    .map(t => t.horario);

  cont.innerHTML = slots.map(h => {
    const ocu = ocupados.includes(h);
    return `<button class="mhor-btn${ocu ? ' ocupado' : ''}" ${ocu ? 'disabled' : `onclick="seleccionarHorario('${h}', this)"`}>${h}${ocu ? '<span>·</span>' : ''}</button>`;
  }).join('');
}

function seleccionarHorario(horario, btn) {
  horarioSeleccionado = horario;
  document.querySelectorAll('.mhor-btn.selected').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  document.getElementById('rpaso2')?.classList.add('hidden');
  document.getElementById('rpaso3')?.classList.remove('hidden');

  // Mostrar resumen
  const d = new Date(fechaSeleccionada + 'T00:00');
  const fechaFmt = d.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
  document.getElementById('reservaResumen').innerHTML = `
    <div class="rres-item"><span>Servicio</span><strong>${servicioActivo?.nombre}</strong></div>
    <div class="rres-item"><span>Fecha</span><strong>${fechaFmt}</strong></div>
    <div class="rres-item"><span>Horario</span><strong>${horario} hs</strong></div>
    <div class="rres-item"><span>Duración</span><strong>${servicioActivo?.duracion}</strong></div>
    <div class="rres-item total"><span>Total</span><strong>$${servicioActivo?.precio.toLocaleString('es-AR')}</strong></div>`;
}

function volverAPaso1() {
  document.getElementById('rpaso2')?.classList.add('hidden');
  document.getElementById('rpaso1')?.classList.remove('hidden');
}

function volverAPaso2() {
  document.getElementById('rpaso3')?.classList.add('hidden');
  document.getElementById('rpaso2')?.classList.remove('hidden');
}

function confirmarReserva() {
  if (!requireSesion('reservar un turno')) return;
  if (!fechaSeleccionada || !horarioSeleccionado || !servicioActivo) return;

  const turno = {
    id:        Date.now(),
    servicio:  servicioActivo.nombre,
    servicioId:servicioActivo.id,
    precio:    servicioActivo.precio,
    duracion:  servicioActivo.duracion,
    fecha:     fechaSeleccionada,
    horario:   horarioSeleccionado,
    estado:    'pendiente'
  };

  const turnos = JSON.parse(localStorage.getItem('turnosGuardados') || '[]');
  turnos.push(turno);
  localStorage.setItem('turnosGuardados', JSON.stringify(turnos));

  // Agregar al carrito también
  const carritoLocal = JSON.parse(localStorage.getItem('carrito') || '[]');
  carritoLocal.push({ ...turno, tipo: 'servicio', nombre: servicioActivo.nombre });
  localStorage.setItem('carrito', JSON.stringify(carritoLocal));

  showToast('✅ Turno reservado y agregado al carrito');

  // Reset estado y mostrar confirmación
  document.getElementById('rpaso3').innerHTML = `
    <div class="reserva-ok">
      <div class="reserva-ok-check">✓</div>
      <p class="reserva-ok-title">¡Turno confirmado!</p>
      <p class="reserva-ok-sub">${servicioActivo.nombre} · ${horarioSeleccionado} hs</p>
      <a href="carrito.html" class="btn-ver-carrito">Ver carrito →</a>
    </div>`;

  fechaSeleccionada   = null;
  horarioSeleccionado = null;
  actualizarNavbar();
}

// ── LIKES ────────────────────────────────────────────────────────────────────
function toggleLike(id, btn) {
  const s   = SERVICIOS.find(x => x.id === id);
  const idx = likesGuardados.indexOf(id);
  if (idx === -1) {
    likesGuardados.push(id);
    btn.innerHTML = `<span class="like-icon">❤️</span><span class="like-count">${s.likes + 1}</span>`;
    btn.classList.add('liked');
  } else {
    likesGuardados.splice(idx, 1);
    btn.innerHTML = `<span class="like-icon">🤍</span><span class="like-count">${s.likes}</span>`;
    btn.classList.remove('liked');
  }
  localStorage.setItem('likes', JSON.stringify(likesGuardados));
}

/* ── AGREGAR SERVICIO AL CARRITO ── */
function agregarServicioCarrito(id) {
  if (!requireSesion('agregar servicios al carrito')) return;
  const s = SERVICIOS.find(x => x.id === id);
  if (!s) return;

  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  carrito.push({
    id:       s.id,
    nombre:   s.nombre,
    precio:   s.precio,
    duracion: s.duracion,
    tipo:     'servicio',
    img:      s.img
  });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarNavbar();
  showToast('💆 ' + s.nombre + ' agregado al carrito');

  const btn = document.querySelector('.btn-reservar-panel');
  if (btn) {
    btn.textContent = '✓ Agregado';
    btn.style.background = '#5c9e6e';
    setTimeout(() => {
      btn.textContent = 'Agregar al carrito';
      btn.style.background = '';
    }, 2000);
  }
}
