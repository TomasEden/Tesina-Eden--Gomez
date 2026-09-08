/* ═══════════════════════════════════════
   Senderos — resenas.js (conectado a la API)
   Sistema de reseñas de servicios
   ═══════════════════════════════════════ */

   const API_RESENAS = '../api/resenas.php';

   // ── Cache local por servicio (para no pedir 2 veces mientras se navega) ──────
   let resenasCache = {}; // { slug: [resenas...] }
   
   // ── Traer reseñas de un servicio desde la API (síncrono con callback) ────────
   function fetchResenas(servicioId, callback) {
     fetch(`${API_RESENAS}?servicio_slug=${encodeURIComponent(servicioId)}`)
       .then(r => r.json())
       .then(data => {
         const lista = data.ok ? data.resenas : [];
         resenasCache[servicioId] = lista;
         callback(lista);
       })
       .catch(() => {
         resenasCache[servicioId] = [];
         callback([]);
       });
   }
   
   function getPromedioEstrellas(servicioId) {
     const lista = resenasCache[servicioId] || [];
     if (!lista.length) return 0;
     const suma = lista.reduce((s, r) => s + Number(r.estrellas), 0);
     return (suma / lista.length).toFixed(1);
   }
   
   function getResenasPorServicio(servicioId) {
     return resenasCache[servicioId] || [];
   }
   
   // ── Render estrellas ──────────────────────────────────────────────────────────
   function renderEstrellas(n, interactive = false) {
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
     const fecha = new Date(r.creado_en).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
     const inicial = (r.nombre_usuario || '?')[0].toUpperCase();
     return `
       <div class="resena-card">
         <div class="resena-header">
           <div class="resena-avatar">${inicial}</div>
           <div class="resena-meta">
             <div class="resena-nombre">${r.nombre_usuario || 'Cliente'}</div>
             <div class="resena-fecha">${fecha}</div>
           </div>
           <div class="resena-estrellas">${renderEstrellas(r.estrellas)}</div>
         </div>
         <p class="resena-texto">"${r.texto}"</p>
       </div>`;
   }
   
   // ── Render sección completa de reseñas ───────────────────────────────────────
   function renderSeccionResenas(servicioId, containerId) {
     const cont = document.getElementById(containerId);
     if (!cont) return;
   
     cont.innerHTML = `<div class="resenas-wrap"><p style="font-size:0.85rem;color:var(--text-light)">Cargando reseñas...</p></div>`;
   
     fetchResenas(servicioId, (lista) => {
       const prom   = getPromedioEstrellas(servicioId);
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
               <button class="btn-enviar-resena" onclick="enviarResena('${servicioId}', '${containerId}')">Publicar reseña</button>
               <button class="btn-cancelar-resena" onclick="toggleFormResena('${servicioId}', null)">Cancelar</button>
             </div>
           </div>
   
           <!-- Lista -->
           <div class="resenas-lista" id="listaResenas_${servicioId}">
             ${lista.length ? lista.slice(0, 4).map(renderResenaCard).join('') : '<p class="resenas-empty">Sé la primera en dejar una reseña.</p>'}
           </div>
           ${lista.length > 4 ? `<button class="btn-ver-mas-resenas" onclick="verMasResenas('${servicioId}')">Ver todas las reseñas (${lista.length})</button>` : ''}
         </div>`;
     });
   }
   
   function toggleFormResena(servicioId, btn) {
     const form = document.getElementById('formResena_' + servicioId);
     if (!form) return;
     const isOpen = !form.classList.contains('hidden');
     form.classList.toggle('hidden', isOpen);
     if (btn) btn.textContent = isOpen ? 'Dejar reseña' : 'Cancelar';
   }
   
   function enviarResena(servicioId, containerId) {
     const starsEl = document.getElementById('starsResena_' + servicioId);
     const textEl  = document.getElementById('textoResena_' + servicioId);
   
     const estrellas = parseInt(starsEl?.dataset.val || '0');
     const texto     = textEl?.value.trim();
   
     if (!estrellas) { alert('Seleccioná una calificación'); return; }
     if (!texto || texto.length < 10) { alert('Escribí al menos 10 caracteres'); return; }
   
     fetch(API_RESENAS, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         servicio_slug: servicioId,
         estrellas,
         texto
       })
     })
     .then(r => r.json())
     .then(res => {
       if (!res.ok) {
         showToast('❌ ' + (res.error || 'Error al publicar la reseña'));
         return;
       }
       showToast('¡Reseña publicada! Gracias por tu opinión.');
       renderSeccionResenas(servicioId, containerId);
     })
     .catch(() => showToast('❌ Error de conexión con el servidor'));
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