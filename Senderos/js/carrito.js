/* ═══════════════════════════════════════
   Senderos — carrito.js (conectado a la API)
   Servicios + Productos + Flujo de reserva
   ═══════════════════════════════════════ */

   const API_TURNOS  = '../api/turnos.php';
   const API_PEDIDOS = '../api/pedidos.php';
   
   // ── Estado ───────────────────────────────────────────────────────────────────
   let carritoData    = [];
   let entregaActual  = 'retiro';
   let pagoSeleccion  = 'todo';
   let turnosAsignados = {};
   
   const COSTO_ENVIO = 800;
   const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30',
                  '12:00','14:00','14:30','15:00','15:30','16:00',
                  '16:30','17:00','17:30','18:00'];
   
   // ── INIT ─────────────────────────────────────────────────────────────────────
   document.addEventListener('DOMContentLoaded', () => {
     actualizarNavbar();
     cargarCarrito();
   
     window.addEventListener('scroll', () => {
       document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 20);
     }, { passive: true });
   });
   
   // ── CARGAR CARRITO ────────────────────────────────────────────────────────────
   function cargarCarrito() {
     carritoData = JSON.parse(localStorage.getItem('carrito') || '[]');
   
     const servicios = carritoData.filter(i => i.tipo === 'servicio');
     const productos  = carritoData.filter(i => i.tipo === 'producto');
     const total      = servicios.length + productos.length;
   
     const empty  = document.getElementById('cartEmpty');
     const layout = document.getElementById('cartLayout');
     if (!total) {
       empty?.classList.remove('hidden');
       layout?.classList.add('hidden');
       document.getElementById('cartTabs')?.classList.add('hidden');
       return;
     }
     empty?.classList.add('hidden');
     layout?.classList.remove('hidden');
   
     renderTabs(servicios.length, productos.length);
     renderServicios(servicios);
     renderProductos(productos);
     renderResumen();
   }
   
   // ── TABS ──────────────────────────────────────────────────────────────────────
   function renderTabs(nServ, nProd) {
     const tabs = document.getElementById('cartTabs');
     if (!tabs) return;
     tabs.innerHTML = '';
   
     if (nServ > 0) {
       const t = document.createElement('button');
       t.className = 'cart-tab active';
       t.dataset.sec = 'services';
       t.innerHTML = `💆 Servicios <span>${nServ}</span>`;
       t.onclick = () => switchTab('services');
       tabs.appendChild(t);
     }
     if (nProd > 0) {
       const t = document.createElement('button');
       t.className = `cart-tab${nServ === 0 ? ' active' : ''}`;
       t.dataset.sec = 'products';
       t.innerHTML = `🧴 Productos <span>${nProd}</span>`;
       t.onclick = () => switchTab('products');
       tabs.appendChild(t);
     }
   
     if (nServ > 0) showSection('services');
     else showSection('products');
   }
   
   function switchTab(sec) {
     document.querySelectorAll('.cart-tab').forEach(t => {
       t.classList.toggle('active', t.dataset.sec === sec);
     });
     showSection(sec);
   }
   
   function showSection(sec) {
     document.getElementById('secServices')?.classList.toggle('hidden', sec !== 'services');
     document.getElementById('secProducts')?.classList.toggle('hidden', sec !== 'products');
   }
   
   // ── RENDER SERVICIOS ──────────────────────────────────────────────────────────
   function renderServicios(lista) {
     const sec   = document.getElementById('secServices');
     const cont  = document.getElementById('listaServicios');
     const count = document.getElementById('servCount');
     if (!sec || !lista.length) return;
   
     sec.classList.remove('hidden');
     count.textContent = lista.length;
   
     cont.innerHTML = lista.map((item, i) => {
       const asignado = turnosAsignados[i];
       return `
         <div class="cart-item" id="srvItem_${i}">
           <div class="item-img-wrap">
             <img src="${item.img || 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=200&q=60'}"
                  alt="${item.nombre}" loading="lazy"
                  onerror="this.src='https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=200&q=60'"/>
           </div>
           <div class="item-info">
             <span class="item-tipo-badge serv">Servicio</span>
             <p class="item-nombre">${item.nombre}</p>
             ${item.duracion ? `<p class="item-meta">⏱ ${item.duracion}</p>` : ''}
             ${asignado
               ? `<p class="item-turno-asignado">📅 ${formatFechaCorta(asignado.fecha)} · ${asignado.horario} hs
                  <button class="btn-cambiar-turno" onclick="abrirAsignacion(${i})">Cambiar</button></p>`
               : `<button class="btn-asignar-turno" onclick="abrirAsignacion(${i})">+ Elegir fecha y horario</button>`
             }
           </div>
           <div class="item-precio-col">
             <span class="item-precio">$${item.precio.toLocaleString('es-AR')}</span>
             <button class="item-remove" onclick="quitarItem('servicio', ${i})" title="Quitar">✕</button>
           </div>
         </div>`;
     }).join('');
   
     renderAsignacionTurnos(lista);
   }
   
   // ── ASIGNACIÓN DE TURNOS ───────────────────────────────────────────────────────
   function renderAsignacionTurnos(lista) {
     const cont = document.getElementById('reservaItems');
     const block = document.getElementById('reservaBlock');
     if (!cont || !block) return;
   
     const faltantes = lista.filter((_, i) => !turnosAsignados[i]);
     if (!faltantes.length) {
       block.classList.add('todo-asignado');
       block.innerHTML = `<div class="asignacion-ok">
         <span class="aok-icon">✅</span>
         <p>¡Todos los turnos tienen fecha y horario asignados!</p>
       </div>`;
       return;
     }
     block.classList.remove('todo-asignado');
   
     cont.innerHTML = lista.map((item, i) => {
       if (turnosAsignados[i]) return '';
       return `
         <div class="asig-item" id="asigItem_${i}">
           <div class="asig-header">
             <span class="asig-nombre">${item.nombre}</span>
             <span class="asig-precio">$${item.precio.toLocaleString('es-AR')}</span>
           </div>
           <div class="asig-body hidden" id="asigBody_${i}">
             <p class="asig-step-label">Elegí la fecha</p>
             <div class="mini-cal" id="miniCal_${i}"></div>
             <div class="asig-horarios hidden" id="asigHors_${i}">
               <p class="asig-step-label">Elegí el horario</p>
               <div class="horarios-grid" id="hGrid_${i}"></div>
             </div>
           </div>
           <button class="btn-expandir-asig" id="btnExp_${i}"
                   onclick="toggleAsig(${i})">Elegir fecha y horario ↓</button>
         </div>`;
     }).join('');
   }
   
   function abrirAsignacion(idx) {
     const el = document.getElementById('asigItem_' + idx);
     if (!el) return;
     toggleAsig(idx, true);
     el.scrollIntoView({ behavior: 'smooth', block: 'start' });
   }
   
   function toggleAsig(idx, forceOpen = false) {
     const body = document.getElementById('asigBody_' + idx);
     const btn  = document.getElementById('btnExp_' + idx);
     if (!body) return;
     const open = forceOpen || body.classList.contains('hidden');
     body.classList.toggle('hidden', !open);
     if (btn) btn.textContent = open ? 'Cerrar ↑' : 'Elegir fecha y horario ↓';
     if (open) buildMiniCal(idx);
   }
   
   function buildMiniCal(idx) {
     const cal = document.getElementById('miniCal_' + idx);
     if (!cal) return;
     const hoy   = new Date();
     const year  = hoy.getFullYear();
     const month = hoy.getMonth();
     const primerDia = new Date(year, month, 1).getDay();
     const diasMes   = new Date(year, month + 1, 0).getDate();
     const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
     const dias  = ['D','L','M','M','J','V','S'];
   
     let html = `<div class="mcal-nav"><span class="mcal-mes">${meses[month]} ${year}</span></div>
       <div class="mcal-dow">${dias.map(d=>`<span>${d}</span>`).join('')}</div>
       <div class="mcal-grid">`;
     for (let i = 0; i < primerDia; i++) html += '<span></span>';
     for (let d = 1; d <= diasMes; d++) {
       const fecha   = new Date(year, month, d);
       const pasado  = fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
       const esHoy   = d === hoy.getDate();
       const cls     = pasado ? 'mcal-day dis' : esHoy ? 'mcal-day today' : 'mcal-day';
       const fechaStr= `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
       const click   = pasado ? '' : `onclick="selFecha('${fechaStr}',${idx},this)"`;
       html += `<button class="${cls}" ${click}>${d}</button>`;
     }
     html += '</div>';
     cal.innerHTML = html;
   }
   
   // ── Trae horarios ocupados de la API en vez de localStorage ──────────────────
   function selFecha(fecha, idx, btn) {
     const cal = btn.closest('.mini-cal');
     cal?.querySelectorAll('.mcal-day.sel').forEach(b => b.classList.remove('sel'));
     btn.classList.add('sel');
   
     const hors = document.getElementById('asigHors_' + idx);
     const grid = document.getElementById('hGrid_' + idx);
     if (!hors || !grid) return;
   
     grid.innerHTML = '<p style="font-size:0.78rem;color:var(--text-light)">Cargando horarios...</p>';
     hors.classList.remove('hidden');
   
     fetch(`${API_TURNOS}?fecha=${fecha}`)
       .then(r => r.json())
       .then(data => {
         const ocupados = [];
         if (data.ok) {
           data.ocupados.forEach(t => ocupados.push(t.horario));
         }
         grid.innerHTML = SLOTS.map(h => {
           const ocu = ocupados.includes(h);
           return `<button class="hor-btn${ocu ? ' ocu' : ''}" ${ocu ? 'disabled' : `onclick="selHorario('${fecha}','${h}',${idx})"`}>${h}</button>`;
         }).join('');
       })
       .catch(() => {
         grid.innerHTML = '<p style="font-size:0.78rem;color:var(--error)">Error al cargar horarios</p>';
       });
   
     if (!turnosAsignados[idx]) turnosAsignados[idx] = {};
     turnosAsignados[idx].fecha = fecha;
   }
   
   function selHorario(fecha, horario, idx) {
     turnosAsignados[idx] = { fecha, horario };
     showToast('✅ Turno asignado: ' + formatFechaCorta(fecha) + ' ' + horario + ' hs');
     const servicios = carritoData.filter(i => i.tipo === 'servicio');
     renderServicios(servicios);
     renderResumen();
   }
   
   function formatFechaCorta(fechaStr) {
     const d = new Date(fechaStr + 'T00:00');
     return d.toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short' });
   }
   
   // ── RENDER PRODUCTOS ──────────────────────────────────────────────────────────
   function renderProductos(lista) {
     const sec   = document.getElementById('secProducts');
     const cont  = document.getElementById('listaProductos');
     const count = document.getElementById('prodCount');
     if (!sec || !lista.length) return;
   
     sec.classList.remove('hidden');
   
     const mapa = {};
     lista.forEach((item, idx) => {
       const key = item.id !== undefined ? String(item.id) : item.nombre;
       if (!mapa[key]) mapa[key] = { ...item, cantidad: 1, idxs: [idx] };
       else { mapa[key].cantidad++; mapa[key].idxs.push(idx); }
     });
   
     const agrupados = Object.values(mapa);
     count.textContent = agrupados.reduce((s, i) => s + i.cantidad, 0);
   
     cont.innerHTML = agrupados.map(item => `
       <div class="cart-item">
         <div class="item-img-wrap">
           <img src="${item.img || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=60'}"
                alt="${item.nombre}" loading="lazy"
                onerror="this.src='https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=60'"/>
         </div>
         <div class="item-info">
           <span class="item-tipo-badge prod">Producto</span>
           <p class="item-nombre">${item.nombre}</p>
           ${item.categoria ? `<p class="item-meta">${item.categoria}</p>` : ''}
           <div class="item-qty">
             <button class="qty-btn" onclick="cambiarCantidad('${item.id || item.nombre}', -1)">−</button>
             <span class="qty-num">${item.cantidad}</span>
             <button class="qty-btn" onclick="cambiarCantidad('${item.id || item.nombre}', 1)">+</button>
           </div>
         </div>
         <div class="item-precio-col">
           <span class="item-precio">$${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
           <button class="item-remove" onclick="quitarTodos('${item.id || item.nombre}')" title="Quitar">✕</button>
         </div>
       </div>`).join('');
   }
   
   // ── QUITAR ITEMS ──────────────────────────────────────────────────────────────
   function quitarItem(tipo, idx) {
     const items = carritoData.filter(i => i.tipo === tipo);
     const item  = items[idx];
     if (!item) return;
     const globalIdx = carritoData.indexOf(item);
     carritoData.splice(globalIdx, 1);
     if (tipo === 'servicio') delete turnosAsignados[idx];
     guardarYRecargar();
   }
   
   function quitarTodos(key) {
     carritoData = carritoData.filter(i => {
       const k = i.id !== undefined ? String(i.id) : i.nombre;
       return !(i.tipo === 'producto' && k === String(key));
     });
     guardarYRecargar();
   }
   
   function cambiarCantidad(key, delta) {
     if (delta > 0) {
       const base = carritoData.find(i => {
         const k = i.id !== undefined ? String(i.id) : i.nombre;
         return i.tipo === 'producto' && k === String(key);
       });
       if (base) carritoData.push({ ...base });
     } else {
       const idx = carritoData.findLastIndex?.(i => {
         const k = i.id !== undefined ? String(i.id) : i.nombre;
         return i.tipo === 'producto' && k === String(key);
       });
       if (idx !== undefined && idx >= 0) carritoData.splice(idx, 1);
     }
     guardarYRecargar();
   }
   
   function guardarYRecargar() {
     localStorage.setItem('carrito', JSON.stringify(carritoData));
     actualizarNavbar();
     cargarCarrito();
   }
   
   // ── ENTREGA ───────────────────────────────────────────────────────────────────
   function seleccionarEntrega(tipo) {
     entregaActual = tipo;
     document.getElementById('opRetiro')?.classList.toggle('active', tipo === 'retiro');
     document.getElementById('opEnvio')?.classList.toggle('active', tipo === 'envio');
     document.getElementById('envioForm')?.classList.toggle('hidden', tipo === 'retiro');
     renderResumen();
   }
   
   // ── RESUMEN ───────────────────────────────────────────────────────────────────
   function renderResumen() {
     const servicios = carritoData.filter(i => i.tipo === 'servicio');
     const productos  = carritoData.filter(i => i.tipo === 'producto');
   
     const totalServ = servicios.reduce((s, i) => s + i.precio, 0);
     const totalProd = productos.reduce((s, i) => s + i.precio, 0);
     const envio     = entregaActual === 'envio' && productos.length ? COSTO_ENVIO : 0;
   
     const lines = document.getElementById('sumLines');
     if (lines) {
       let html = '';
       if (servicios.length) {
         html += `<div class="sum-line"><span>Servicios (${servicios.length})</span><span>$${totalServ.toLocaleString('es-AR')}</span></div>`;
         const faltanTurnos = servicios.filter((_, i) => !turnosAsignados[i]).length;
         if (faltanTurnos) {
           html += `<div class="sum-line warn"><span>⚠ ${faltanTurnos} turno${faltanTurnos>1?'s':''} sin fecha</span><span></span></div>`;
         }
       }
       if (productos.length) {
         html += `<div class="sum-line"><span>Productos (${productos.length})</span><span>$${totalProd.toLocaleString('es-AR')}</span></div>`;
       }
       if (envio) {
         html += `<div class="sum-line"><span>Envío a domicilio</span><span>$${envio.toLocaleString('es-AR')}</span></div>`;
       }
       lines.innerHTML = html;
     }
   
     const opts = document.getElementById('pagoOpts');
     const pagoSection = document.getElementById('pagoOpciones');
     if (opts) {
       const ambos = servicios.length > 0 && productos.length > 0;
       if (ambos) {
         pagoSection?.classList.remove('hidden');
         opts.innerHTML = `
           <label class="pago-opt${pagoSeleccion==='todo'?' active':''}">
             <input type="radio" name="pago" value="todo" ${pagoSeleccion==='todo'?'checked':''} onchange="selPago('todo')"/>
             <div class="po-info">
               <strong>Todo junto</strong>
               <span>$${(totalServ+totalProd+envio).toLocaleString('es-AR')}</span>
             </div>
           </label>
           <label class="pago-opt${pagoSeleccion==='servicios'?' active':''}">
             <input type="radio" name="pago" value="servicios" ${pagoSeleccion==='servicios'?'checked':''} onchange="selPago('servicios')"/>
             <div class="po-info">
               <strong>Solo servicios</strong>
               <span>$${totalServ.toLocaleString('es-AR')}</span>
             </div>
           </label>
           <label class="pago-opt${pagoSeleccion==='productos'?' active':''}">
             <input type="radio" name="pago" value="productos" ${pagoSeleccion==='productos'?'checked':''} onchange="selPago('productos')"/>
             <div class="po-info">
               <strong>Solo productos</strong>
               <span>$${(totalProd+envio).toLocaleString('es-AR')}</span>
             </div>
           </label>`;
       } else {
         pagoSection?.classList.add('hidden');
         pagoSeleccion = 'todo';
       }
     }
   
     let totalFinal = 0;
     if (pagoSeleccion === 'todo')           totalFinal = totalServ + totalProd + envio;
     else if (pagoSeleccion === 'servicios') totalFinal = totalServ;
     else totalFinal = totalProd + envio;
   
     const totalEl = document.getElementById('sumTotal');
     if (totalEl) totalEl.textContent = '$' + totalFinal.toLocaleString('es-AR');
   }
   
   function selPago(val) {
     pagoSeleccion = val;
     document.querySelectorAll('.pago-opt').forEach(el => {
       el.classList.toggle('active', el.querySelector('input')?.value === val);
     });
     renderResumen();
   }
   
   // ── PROCESAR PAGO (crea turnos y pedido en la BD) ─────────────────────────────
   function procesarPago() {
     if (!requireSesion('completar tu pedido')) return;
   
     const servicios = carritoData.filter(i => i.tipo === 'servicio');
     const productos  = carritoData.filter(i => i.tipo === 'producto');
   
     if (pagoSeleccion !== 'productos' && servicios.length) {
       const sinFecha = servicios.filter((_, i) => !turnosAsignados[i]);
       if (sinFecha.length) {
         showToast('⚠ Asigná fecha y horario a todos los servicios primero');
         switchTab('services');
         document.getElementById('reservaBlock')?.scrollIntoView({ behavior: 'smooth' });
         return;
       }
     }
   
     if (entregaActual === 'envio' && pagoSeleccion !== 'servicios') {
       const dir = document.getElementById('envDireccion')?.value.trim();
       if (!dir) {
         showToast('⚠ Ingresá la dirección de envío');
         return;
       }
     }
   
     const totalServ = servicios.reduce((s, i) => s + i.precio, 0);
     const totalProd = productos.reduce((s, i) => s + i.precio, 0);
     const envio = entregaActual === 'envio' && productos.length ? COSTO_ENVIO : 0;
   
     const btnPagar = document.getElementById('btnPagar');
     if (btnPagar) { btnPagar.disabled = true; btnPagar.textContent = 'Procesando...'; }
   
     const promesas = [];
   
     // 1) Crear turnos (uno por cada fecha+horario distintos, agrupando servicios)
     if (pagoSeleccion !== 'productos' && servicios.length) {
       const grupos = {};
       servicios.forEach((srv, i) => {
         const asign = turnosAsignados[i];
         if (!asign) return;
         const key = asign.fecha + '_' + asign.horario;
         if (!grupos[key]) grupos[key] = { fecha: asign.fecha, horario: asign.horario, servicios: [] };
         grupos[key].servicios.push({
           id:       srv.id || null,
           nombre:   srv.nombre,
           duracion: parseInt(srv.duracion) || 30,
           precio:   srv.precio
         });
       });
   
       Object.values(grupos).forEach(g => {
         const duracionTotal = g.servicios.reduce((s, x) => s + x.duracion, 0);
         const precioTotal   = g.servicios.reduce((s, x) => s + x.precio, 0);
         promesas.push(
           fetch(API_TURNOS, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               fecha: g.fecha,
               horario: g.horario,
               duracion_total: duracionTotal,
               precio_total: precioTotal,
               servicios: g.servicios
             })
           }).then(r => r.json())
         );
       });
     }
   
     // 2) Crear pedido de productos
     if (pagoSeleccion !== 'servicios' && productos.length) {
       const mapa = {};
       productos.forEach(p => {
         const key = p.id !== undefined ? String(p.id) : p.nombre;
         if (!mapa[key]) mapa[key] = { ...p, cantidad: 1 };
         else mapa[key].cantidad++;
       });
       const itemsPedido = Object.values(mapa).map(p => ({
         producto_id: p.id || null,
         nombre: p.nombre,
         precio: p.precio,
         cantidad: p.cantidad
       }));
   
       promesas.push(
         fetch(API_PEDIDOS, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             total: totalProd + envio,
             items: itemsPedido
           })
         }).then(r => r.json())
       );
     }
   
     Promise.all(promesas)
       .then(resultados => {
         const falló = resultados.some(r => !r.ok);
         if (falló) {
           showToast('❌ Hubo un error al procesar tu pedido');
           if (btnPagar) { btnPagar.disabled = false; btnPagar.textContent = 'Confirmar y pagar'; }
           return;
         }
   
         // Limpiar lo que se pagó del carrito
         if (pagoSeleccion === 'todo') {
           localStorage.removeItem('carrito');
         } else if (pagoSeleccion === 'servicios') {
           localStorage.setItem('carrito', JSON.stringify(carritoData.filter(i => i.tipo !== 'servicio')));
         } else {
           localStorage.setItem('carrito', JSON.stringify(carritoData.filter(i => i.tipo !== 'producto')));
         }
   
         window.location.href = 'confirmacion.html';
       })
       .catch(() => {
         showToast('❌ Error de conexión con el servidor');
         if (btnPagar) { btnPagar.disabled = false; btnPagar.textContent = 'Confirmar y pagar'; }
       });
   }
   
   // ── TOAST ─────────────────────────────────────────────────────────────────────
   function showToast(msg) {
     const t = document.getElementById('toast');
     if (!t) return;
     t.textContent = msg;
     t.classList.add('show');
     setTimeout(() => t.classList.remove('show'), 3000);
   }