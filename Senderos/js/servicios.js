/* ═══════════════════════════════════════
   Senderos — servicios.js (conectado a la API)
   Catálogo desde la base de datos + panel + reseñas
   ═══════════════════════════════════════ */

   const API_SERVICIOS = '../api/servicios.php';

   // ── Estado ───────────────────────────────────────────────────────────────────
   let SERVICIOS        = [];   // se llena desde la API
   let categoriaActiva  = 'todas';
   let servicioActivo   = null;
   let likesGuardados   = JSON.parse(localStorage.getItem('likes') || '[]');
   
   // ── INIT ─────────────────────────────────────────────────────────────────────
   document.addEventListener('DOMContentLoaded', () => {
     actualizarNavbar();
     cargarServicios();
   
     window.addEventListener('scroll', () => {
       document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 20);
     }, { passive: true });
   
     document.addEventListener('keydown', e => {
       if (e.key === 'Escape') cerrarPanel();
     });
   });
   
   // ── CARGAR DESDE LA API ────────────────────────────────────────────────────
   function cargarServicios() {
     fetch(API_SERVICIOS)
       .then(r => r.json())
       .then(data => {
         if (data.ok) {
           SERVICIOS = data.servicios.map(normalizarServicio);
           renderCategoryBar();
           renderServicios();
         } else {
           showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error al cargar servicios');
         }
       })
       .catch(() => showToast('<img src="../img/icons/x.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Error de conexión con el servidor'));
   }
   
   // Adapta los campos de la BD al formato que usa el resto del archivo
   function normalizarServicio(s) {
     return {
       id:         s.slug,               // usamos el slug como identificador público (likes, reseñas, carrito)
       dbId:       s.id,                 // id numérico real, útil para turno_servicios
       nombre:     s.nombre,
       categoria:  s.categoria || 'General',
       desc:       s.descripcion || '',
       duracion:   s.duracion + ' min',
       duracionMin: Number(s.duracion),
       precio:     Number(s.precio),
       badge:      s.badge || null,
       badgeText:  s.badge_texto || '',
       img:        s.imagen || 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=700&q=80',
       incluye:    s.incluye ? s.incluye.split('|') : []
     };
   }
   
   // ── TOAST ────────────────────────────────────────────────────────────────────
   function showToast(msg) {
     const t = document.getElementById('toast');
     if (!t) return;
     t.innerHTML = msg;
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
       const liked = likesGuardados.includes(s.id);
   
       const card = document.createElement('div');
       card.className = 'service-card reveal';
       card.style.animationDelay = `${i * 0.06}s`;
       card.dataset.id = s.id;
   
       card.innerHTML = `
         <div class="service-img-wrap" onclick="abrirPanel('${s.id}')">
           <img class="service-img" src="${s.img}" alt="${s.nombre}" loading="lazy"/>
           ${s.badge ? `<span class="service-badge ${s.badge}">${s.badgeText}</span>` : ''}
           <button class="service-likes ${liked ? 'liked' : ''}" onclick="event.stopPropagation();toggleLike('${s.id}',this)" aria-label="Like">
             <span class="like-icon">${liked ? '<img src="../img/icons/corazon2.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem">' : '<img src="../img/icons/corazon1.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem">'}</span>
           </button>
         </div>
         <div class="service-body">
           <div class="service-meta">
             <span class="service-cat">${s.categoria}</span>
           </div>
           <h3 class="service-name" onclick="abrirPanel('${s.id}')">${s.nombre}</h3>
           <p class="service-desc">${s.desc}</p>
           <div class="service-footer">
             <div>
               <span class="service-duracion"><img src="../img/icons/tiempo.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">${s.duracion}</span>
               <span class="service-price">$${s.precio.toLocaleString('es-AR')}</span>
             </div>
             <button class="btn-ver-servicio" onclick="abrirPanel('${s.id}')">Ver detalle</button>
           </div>
         </div>`;
   
       grid.appendChild(card);
     });
   
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
   
     const liked = likesGuardados.includes(id);
   
     panel.innerHTML = `
       <div class="panel-img-wrap">
         <img src="${s.img}" alt="${s.nombre}" loading="lazy"/>
         <div class="panel-img-overlay"></div>
         <button class="panel-close" onclick="cerrarPanel()" aria-label="Cerrar"><img src="../img/icons/x.svg" alt="" width="12" height="12" style="vertical-align:middle;margin-right:0.3rem"></button>
         <div class="panel-img-info">
           <span class="service-cat">${s.categoria}</span>
           <h2 class="panel-nombre">${s.nombre}</h2>
           <div class="panel-meta-row">
             <span class="panel-duracion"><img src="../img/icons/tiempo.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">${s.duracion}</span>
             <span class="panel-rating" id="panelRatingWrap"></span>
           </div>
         </div>
         ${s.badge ? `<span class="service-badge ${s.badge}">${s.badgeText}</span>` : ''}
       </div>
   
       <div class="panel-body">
   
         <div class="panel-precio-bar">
           <div>
             <div class="panel-precio">$${s.precio.toLocaleString('es-AR')}</div>
             <div class="panel-precio-sub">por sesión</div>
           </div>
           <button class="btn-reservar-panel" onclick="agregarServicioCarrito('${s.id}')">
             Agregar al carrito
           </button>
         </div>
   
         <p class="panel-desc">${s.desc}</p>
   
         ${s.incluye.length ? `
         <div class="panel-incluye">
           <h4 class="panel-section-title">¿Qué incluye?</h4>
           <ul class="panel-incluye-list">
             ${s.incluye.map(i => `<li>${i}</li>`).join('')}
           </ul>
         </div>` : ''}
   
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
   
         <div id="resenasPanelWrap"></div>
       </div>`;
   
     panel.classList.add('open');
     overlay.classList.add('show');
     document.body.classList.add('panel-open');
   
     if (typeof renderSeccionResenas === 'function') {
       renderSeccionResenas(id, 'resenasPanelWrap');
     }
   }
   
   function cerrarPanel() {
     document.getElementById('srvPanel')?.classList.remove('open');
     document.getElementById('srvOverlay')?.classList.remove('show');
     document.body.classList.remove('panel-open');
     servicioActivo = null;
   }
   
   // ── LIKES (se mantienen solo en localStorage, no hay tabla para esto) ────────
   function toggleLike(id, btn) {
     const idx = likesGuardados.indexOf(id);
     if (idx === -1) {
       likesGuardados.push(id);
       btn.innerHTML = `<span class="like-icon"><img src="../img/icons/corazon2.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem"></span>`;
       btn.classList.add('liked');
     } else {
       likesGuardados.splice(idx, 1);
       btn.innerHTML = `<span class="like-icon"><img src="../img/icons/corazon1.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem"></span>`;
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
       id:       s.dbId,      // id numérico real de la tabla servicios (para turno_servicios)
       slug:     s.id,
       nombre:   s.nombre,
       precio:   s.precio,
       duracion: s.duracion,
       tipo:     'servicio',
       img:      s.img
     });
     localStorage.setItem('carrito', JSON.stringify(carrito));
     actualizarNavbar();
     showToast('<img src="../img/icons/servicio.svg" alt="" width="15" height="15" style="vertical-align:middle;margin-right:0.3rem">' + s.nombre + ' agregado al carrito');
   
     const btn = document.querySelector('.btn-reservar-panel');
     if (btn) {
       btn.innerHTML = '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Agregado';
       btn.style.background = '#5c9e6e';
       setTimeout(() => {
         btn.textContent = 'Agregar al carrito';
         btn.style.background = '';
       }, 2000);
     }
   }
