/* ═══════════════════════════════════════
   Senderos — resenas.js
   Sistema de reseñas de servicios
   ═══════════════════════════════════════ */

// ── Reseñas demo ────────────────────────────────────────────────────────────
const RESENAS_DEMO = [
  {
    id: 1, servicio: 'masaje-relajante',
    usuario: 'María G.', avatar: 'M', estrellas: 5,
    texto: 'Increíble experiencia. Marcela tiene manos mágicas, salí sintiéndome nueva. Ya reservé para el mes que viene.',
    fecha: '2026-04-10'
  },
  {
    id: 2, servicio: 'facial-premium',
    usuario: 'Lucía R.', avatar: 'L', estrellas: 5,
    texto: 'El facial premium vale cada peso. Mi piel quedó luminosa y suave. El ambiente es muy relajante.',
    fecha: '2026-04-08'
  },
  {
    id: 3, servicio: 'masaje-relajante',
    usuario: 'Valentina S.', avatar: 'V', estrellas: 4,
    texto: 'Muy profesional y puntual. El masaje relajó todas mis contracturas. Le saco una estrella porque el estacionamiento es complicado, pero el servicio es excelente.',
    fecha: '2026-04-05'
  },
  {
    id: 4, servicio: 'jacuzzi',
    usuario: 'Carolina M.', avatar: 'C', estrellas: 5,
    texto: 'El jacuzzi privado es un sueño. Fui con mi pareja para nuestro aniversario y fue perfecto. Muy recomendable.',
    fecha: '2026-03-28'
  },
  {
    id: 5, servicio: 'masaje-piedras',
    usuario: 'Andrea L.', avatar: 'A', estrellas: 5,
    texto: 'Nunca había probado el masaje con piedras calientes. Una sensación única. El calor llega a fondo y relaja músculos que ni sabía que tenía tensos.',
    fecha: '2026-03-22'
  },
  {
    id: 6, servicio: 'facial-premium',
    usuario: 'Sofía P.', avatar: 'S', estrellas: 4,
    texto: 'Muy buena atención y el resultado se nota inmediatamente. Recomiendo especialmente para el invierno cuando la piel se reseca.',
    fecha: '2026-03-15'
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getResenas() {
  const guardadas = JSON.parse(localStorage.getItem('resenas') || '[]');
  return [...RESENAS_DEMO, ...guardadas];
}

function getResenasPorServicio(servicioId) {
  return getResenas().filter(r => r.servicio === servicioId);
}

function getPromedioEstrellas(servicioId) {
  const lista = getResenasPorServicio(servicioId);
  if (!lista.length) return 0;
  const suma = lista.reduce((s, r) => s + r.estrellas, 0);
  return (suma / lista.length).toFixed(1);
}

function getTotalResenas() {
  return getResenas().length;
}

function guardarResena(resena) {
  const guardadas = JSON.parse(localStorage.getItem('resenas') || '[]');
  resena.id = Date.now();
  guardadas.push(resena);
  localStorage.setItem('resenas', JSON.stringify(guardadas));
  return resena;
}

// ── Render estrellas ──────────────────────────────────────────────────────────
function renderEstrellas(n, interactive = false, onSelect = null) {
  let html = '<div class="estrellas' + (interactive ? ' estrellas-interactive' : '') + '">';
  for (let i = 1; i <= 5; i++) {
    const active = i <= n ? 'active' : '';
    if (interactive) {
      html += `<span class="estrella ${active}" data-val="${i}" onclick="selectEstrella(${i}, this.closest('.estrellas'))">★</span>`;
    } else {
      html += `<span class="estrella ${active}">★</span>`;
    }
  }
  html += '</div>';
  return html;
}

function selectEstrella(val, container) {
  container.querySelectorAll('.estrella').forEach((el, idx) => {
    el.classList.toggle('active', idx < val);
  });
  container.dataset.val = val;
}

// ── Render card de reseña ────────────────────────────────────────────────────
function renderResenaCard(r) {
  const fecha = new Date(r.fecha).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
    <div class="resena-card">
      <div class="resena-header">
        <div class="resena-avatar">${r.avatar || r.usuario[0]}</div>
        <div class="resena-meta">
          <div class="resena-nombre">${r.usuario}</div>
          <div class="resena-fecha">${fecha}</div>
        </div>
        <div class="resena-estrellas">${renderEstrellas(r.estrellas)}</div>
      </div>
      <p class="resena-texto">"${r.texto}"</p>
    </div>`;
}

// ── Render sección completa de reseñas ───────────────────────────────────────
function renderSeccionResenas(servicioId, containerId) {
  const lista  = getResenasPorServicio(servicioId);
  const prom   = getPromedioEstrellas(servicioId);
  const cont   = document.getElementById(containerId);
  if (!cont) return;

  const sesion = typeof getSesion === 'function' ? getSesion() : null;

  cont.innerHTML = `
    <div class="resenas-wrap">
      <div class="resenas-header">
        <div class="resenas-summary">
          <div class="resenas-avg">${prom}</div>
          <div>
            ${renderEstrellas(Math.round(prom))}
            <div class="resenas-count">${lista.length} reseña${lista.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        ${sesion ? `<button class="btn-nueva-resena" onclick="toggleFormResena('${servicioId}', this)">Dejar reseña</button>` : `<a href="login.html" class="btn-nueva-resena-outline">Ingresá para opinar</a>`}
      </div>

      <!-- Formulario (oculto por defecto) -->
      <div class="form-resena hidden" id="formResena_${servicioId}">
        <h4 class="form-resena-title">Tu reseña</h4>
        <div class="estrellas estrellas-interactive" id="starsResena_${servicioId}" data-val="0">
          <span class="estrella" data-val="1" onclick="selectEstrella(1, this.closest('.estrellas'))">★</span>
          <span class="estrella" data-val="2" onclick="selectEstrella(2, this.closest('.estrellas'))">★</span>
          <span class="estrella" data-val="3" onclick="selectEstrella(3, this.closest('.estrellas'))">★</span>
          <span class="estrella" data-val="4" onclick="selectEstrella(4, this.closest('.estrellas'))">★</span>
          <span class="estrella" data-val="5" onclick="selectEstrella(5, this.closest('.estrellas'))">★</span>
        </div>
        <textarea class="resena-textarea" id="textoResena_${servicioId}" placeholder="Contanos tu experiencia..." rows="3"></textarea>
        <div class="form-resena-btns">
          <button class="btn-enviar-resena" onclick="enviarResena('${servicioId}')">Publicar reseña</button>
          <button class="btn-cancelar-resena" onclick="toggleFormResena('${servicioId}', null)">Cancelar</button>
        </div>
      </div>

      <!-- Lista -->
      <div class="resenas-lista" id="listaResenas_${servicioId}">
        ${lista.length ? lista.slice(0, 4).map(renderResenaCard).join('') : '<p class="resenas-empty">Sé la primera en dejar una reseña.</p>'}
      </div>
      ${lista.length > 4 ? `<button class="btn-ver-mas-resenas" onclick="verMasResenas('${servicioId}')">Ver todas las reseñas (${lista.length})</button>` : ''}
    </div>`;
}

function toggleFormResena(servicioId, btn) {
  const form = document.getElementById('formResena_' + servicioId);
  if (!form) return;
  const isOpen = !form.classList.contains('hidden');
  form.classList.toggle('hidden', isOpen);
  if (btn) btn.textContent = isOpen ? 'Dejar reseña' : 'Cancelar';
}

function enviarResena(servicioId) {
  const starsEl = document.getElementById('starsResena_' + servicioId);
  const textEl  = document.getElementById('textoResena_' + servicioId);
  const sesion  = typeof getSesion === 'function' ? getSesion() : null;

  const estrellas = parseInt(starsEl?.dataset.val || '0');
  const texto     = textEl?.value.trim();

  if (!estrellas) { alert('Seleccioná una calificación'); return; }
  if (!texto || texto.length < 10) { alert('Escribí al menos 10 caracteres'); return; }

  const nombre = sesion ? sesion.nombre + ' ' + (sesion.apellido || '')[0] + '.' : 'Cliente';
  guardarResena({
    servicio: servicioId,
    usuario: nombre,
    avatar:  sesion ? sesion.nombre[0] : 'C',
    estrellas, texto,
    fecha: new Date().toISOString().split('T')[0]
  });

  // Refrescar sección
  const cont = starsEl?.closest('.resenas-wrap')?.parentElement;
  if (cont) renderSeccionResenas(servicioId, cont.id);

  showToast('¡Reseña publicada! Gracias por tu opinión.');
}

function verMasResenas(servicioId) {
  const lista  = getResenasPorServicio(servicioId);
  const listEl = document.getElementById('listaResenas_' + servicioId);
  if (listEl) listEl.innerHTML = lista.map(renderResenaCard).join('');
  const btnVer = listEl?.nextElementSibling;
  if (btnVer) btnVer.remove();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
