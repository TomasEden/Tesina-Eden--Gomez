/* ═══════════════════════════════════════
   SPA M — turnos.js (v2)
   Multiservicio + duración total + horarios bloqueados reales
   ═══════════════════════════════════════ */

// ── Catálogo de servicios ───────────────────────────────────────────────────
const SERVICIOS = [
  { id: 'masaje',      nombre: 'Masaje Relajante',   duracionMin: 60, precio: 5000, img: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=300&q=80' },
  { id: 'facial',      nombre: 'Tratamiento Facial',  duracionMin: 30, precio: 3000, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80' },
  { id: 'jacuzzi',     nombre: 'Jacuzzi Privado',     duracionMin: 80, precio: 5000, img: 'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=300&q=80' },
  { id: 'unas',        nombre: 'Manicura & Pedicura', duracionMin: 45, precio: 2500, img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80' },
  { id: 'depilacion',  nombre: 'Depilación',          duracionMin: 40, precio: 2000, img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300&q=80' },
  { id: 'aromaterapia',nombre: 'Aromaterapia',        duracionMin: 50, precio: 4000, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80' },
];

// ── Todos los slots posibles del día ────────────────────────────────────────
const SLOTS_DIA = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00'
];

// ── Estado ──────────────────────────────────────────────────────────────────
let estado = {
  servicios: [],   // array de objetos servicio seleccionados
  fecha:     null,
  horario:   null
};

let calFecha = new Date();

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  renderServicios();
  renderCalendario();

  // Pre-seleccionar servicio si viene por URL (?servicio=masaje)
  const params = new URLSearchParams(window.location.search);
  const servicioId = params.get('servicio');
  if (servicioId) {
    const s = SERVICIOS.find(x => x.id === servicioId);
    if (s) {
      setTimeout(() => {
        const btn = document.querySelector(`.servicio-btn[data-id="${servicioId}"]`);
        if (btn) toggleServicio(s, btn);
        // Scroll al paso 1
        document.getElementById('card-servicio').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay'))
      document.getElementById('modalOverlay').classList.add('hidden');
  });

  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

// ── Navbar ──────────────────────────────────────────────────────────────────


`; btn.href = 'mis-turnos.html'; }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Helpers de duración ─────────────────────────────────────────────────────
function duracionTotal() {
  return estado.servicios.reduce((sum, s) => sum + s.duracionMin, 0);
}

function formatearDuracion(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function precioTotal() {
  return estado.servicios.reduce((sum, s) => sum + s.precio, 0);
}

// ── Render servicios (selección múltiple) ───────────────────────────────────
function renderServicios() {
  const grid = document.getElementById('serviciosGrid');
  grid.innerHTML = '';

  // Instrucción de selección múltiple
  const hint = document.createElement('p');
  hint.className = 'servicios-hint';
  hint.textContent = 'Podés elegir más de uno 👇';
  grid.appendChild(hint);

  SERVICIOS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'servicio-btn';
    btn.dataset.id = s.id;
    btn.innerHTML = `
      <div class="servicio-check">✓</div>
      <img src="${s.img}" alt="${s.nombre}"/>
      <span class="servicio-btn-name">${s.nombre}</span>
      <div class="servicio-btn-meta">
        <span>⏱ ${formatearDuracion(s.duracionMin)}</span>
        <span class="servicio-btn-price">$${s.precio.toLocaleString()}</span>
      </div>`;
    btn.addEventListener('click', () => toggleServicio(s, btn));
    grid.appendChild(btn);
  });
}

function toggleServicio(s, btn) {
  const idx = estado.servicios.findIndex(x => x.id === s.id);

  if (idx === -1) {
    // Agregar
    estado.servicios.push(s);
    btn.classList.add('selected');
    showToast(`✅ ${s.nombre} agregado`);
  } else {
    // Quitar
    estado.servicios.splice(idx, 1);
    btn.classList.remove('selected');
    showToast(`❌ ${s.nombre} quitado`);
  }

  // Activar/desactivar paso 2 según si hay servicios seleccionados
  if (estado.servicios.length > 0) {
    document.getElementById('card-fecha').classList.remove('dimmed');
  } else {
    document.getElementById('card-fecha').classList.add('dimmed');
    document.getElementById('card-horario').classList.add('dimmed');
    estado.fecha   = null;
    estado.horario = null;
  }

  actualizarResumen();

  // Si ya había fecha elegida, re-renderizar horarios (duración cambió)
  if (estado.fecha) renderHorarios();
}

// ── Calendario ──────────────────────────────────────────────────────────────
function cambiarMes(dir) {
  calFecha.setMonth(calFecha.getMonth() + dir);
  renderCalendario();
}

function renderCalendario() {
  const hoy      = new Date();
  const year     = calFecha.getFullYear();
  const month    = calFecha.getMonth();
  const primerDia = new Date(year, month, 1).getDay();
  const diasMes  = new Date(year, month + 1, 0).getDate();

  document.getElementById('calMonth').textContent =
    calFecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const container = document.getElementById('calDays');
  container.innerHTML = '';

  for (let i = 0; i < primerDia; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    container.appendChild(empty);
  }

  for (let d = 1; d <= diasMes; d++) {
    const fechaBtn = new Date(year, month, d);
    const div = document.createElement('div');
    div.className = 'cal-day';
    div.textContent = d;

    const esHoy    = fechaBtn.toDateString() === hoy.toDateString();
    const esPasado = fechaBtn < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const esSelec  = estado.fecha && fechaBtn.toDateString() === estado.fecha.toDateString();
    const esDomingo = fechaBtn.getDay() === 0; // domingos cerrado

    if (esHoy)    div.classList.add('today');
    if (esPasado || esDomingo) div.classList.add('disabled');
    if (esSelec)  div.classList.add('selected');

    if (!esPasado && !esDomingo) {
      div.addEventListener('click', () => seleccionarFecha(fechaBtn));
    }
    container.appendChild(div);
  }
}

function seleccionarFecha(fecha) {
  if (!estado.servicios.length) return;
  estado.fecha   = fecha;
  estado.horario = null;

  renderCalendario();
  renderHorarios();
  document.getElementById('card-horario').classList.remove('dimmed');
  actualizarResumen();
}

// ── Horarios — bloqueados según turnos ya reservados ───────────────────────
function getHorariosOcupadosParaFecha(fecha) {
  const turnos = JSON.parse(localStorage.getItem('turnos')) || [];
  const fechaStr = fecha.toDateString();

  // Recopilar todos los slots que ya están tomados ese día
  const ocupados = new Set();
  turnos.forEach(t => {
    if (t.estado === 'cancelado') return;
    const tFecha = new Date(t.fecha);
    if (tFecha.toDateString() !== fechaStr) return;

    // Bloquear el slot inicial + los slots que ocupa la duración del turno
    const durMin  = t.duracionTotal || t.duracionMin || 60;
    const inicio  = slotAMinutos(t.horario);
    const fin     = inicio + durMin;

    SLOTS_DIA.forEach(slot => {
      const slotMin = slotAMinutos(slot);
      // Bloquear si el slot cae dentro del rango del turno
      if (slotMin >= inicio && slotMin < fin) ocupados.add(slot);
    });
  });

  return ocupados;
}

function slotAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function slotDisponible(slot, duracionNecesaria, ocupados) {
  // El slot en sí está ocupado
  if (ocupados.has(slot)) return false;

  // Verificar que todos los slots que necesita la reserva también estén libres
  const inicio = slotAMinutos(slot);
  const fin    = inicio + duracionNecesaria;

  for (const s of SLOTS_DIA) {
    const sMin = slotAMinutos(s);
    if (sMin > inicio && sMin < fin && ocupados.has(s)) return false;
  }

  // Verificar que no se pase del horario de cierre (21:00 = 1260 min)
  if (fin > 1260) return false;

  return true;
}

function renderHorarios() {
  const grid = document.getElementById('horariosGrid');
  grid.innerHTML = '';

  const durNecesaria = duracionTotal();
  const ocupados     = getHorariosOcupadosParaFecha(estado.fecha);

  // Subtítulo con duración necesaria
  const sub = document.createElement('p');
  sub.className = 'horarios-hint';
  sub.textContent = `Tu reserva ocupa ${formatearDuracion(durNecesaria)} en total`;
  grid.appendChild(sub);

  SLOTS_DIA.forEach(hora => {
    const disponible = slotDisponible(hora, durNecesaria, ocupados);
    const btn = document.createElement('button');
    btn.className = 'horario-btn' + (!disponible ? ' ocupado' : '');
    btn.textContent = hora;
    btn.disabled = !disponible;
    if (disponible) {
      btn.addEventListener('click', () => seleccionarHorario(hora, btn));
    }
    grid.appendChild(btn);
  });
}

function seleccionarHorario(hora, btn) {
  estado.horario = hora;
  document.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  actualizarResumen();
}

// ── Resumen ─────────────────────────────────────────────────────────────────
function actualizarResumen() {
  const empty   = document.getElementById('summaryEmpty');
  const details = document.getElementById('summaryDetails');
  const btnRes  = document.getElementById('btnReservar');
  const btnWA   = document.getElementById('btnWhatsapp');

  const completo = estado.servicios.length > 0 && estado.fecha && estado.horario;

  if (estado.servicios.length > 0) {
    empty.style.display = 'none';
    details.classList.remove('hidden');

    // Lista de servicios seleccionados
    const lista = estado.servicios.map(s =>
      `<div class="sum-servicio-item">
        <span>${s.nombre}</span>
        <span>$${s.precio.toLocaleString()}</span>
      </div>`
    ).join('');

    document.getElementById('sum-servicio').innerHTML = lista;
    document.getElementById('sum-duracion').textContent =
      `${formatearDuracion(duracionTotal())} total`;
    document.getElementById('sum-precio').textContent =
      `$${precioTotal().toLocaleString()}`;
  } else {
    empty.style.display = '';
    details.classList.add('hidden');
  }

  if (estado.fecha) {
    document.getElementById('sum-fecha').textContent =
      estado.fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  if (estado.horario) {
    // Calcular hora de fin
    const inicioMin = slotAMinutos(estado.horario);
    const finMin    = inicioMin + duracionTotal();
    const finH      = String(Math.floor(finMin / 60)).padStart(2, '0');
    const finM      = String(finMin % 60).padStart(2, '0');
    document.getElementById('sum-horario').textContent =
      `${estado.horario} → ${finH}:${finM} hs`;
  }

  btnRes.disabled = !completo;

  // Mostrar/ocultar toggle de WhatsApp
  const waWrap = document.getElementById('waToggleWrap');
  if (waWrap) {
    if (completo) waWrap.classList.remove('hidden');
    else          waWrap.classList.add('hidden');
  }
}

// ── WhatsApp ────────────────────────────────────────────────────────────────
function generarLinkWhatsApp() {
  const tel    = '5493510000000';
  const sesion = JSON.parse(localStorage.getItem('sesion')) || JSON.parse(sessionStorage.getItem('sesion'));
  const nombre = sesion ? `${sesion.nombre} ${sesion.apellido}` : 'un cliente';
  const fecha  = estado.fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const listaServicios = estado.servicios.map(s =>
    `  • ${s.nombre} (${formatearDuracion(s.duracionMin)}) — $${s.precio.toLocaleString()}`
  ).join('\n');

  const finMin = slotAMinutos(estado.horario) + duracionTotal();
  const finH   = String(Math.floor(finMin / 60)).padStart(2, '0');
  const finM   = String(finMin % 60).padStart(2, '0');

  const mensaje =
    `Hola! Quiero confirmar mi turno 🌸\n\n` +
    `👤 Nombre: ${nombre}\n` +
    `📅 Fecha: ${fecha}\n` +
    `🕐 Horario: ${estado.horario} → ${finH}:${finM} hs\n` +
    `💆 Servicios:\n${listaServicios}\n` +
    `⏱ Duración total: ${formatearDuracion(duracionTotal())}\n` +
    `💰 Total: $${precioTotal().toLocaleString()}\n\n` +
    `¡Muchas gracias!`;

  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
}

// ── Confirmar reserva ───────────────────────────────────────────────────────
function confirmarReserva() {
  if (!requireSesion("reservar un turno")) return;
  if (!estado.servicios.length || !estado.fecha || !estado.horario) return;

  const turnos = JSON.parse(localStorage.getItem('turnos')) || [];

  // Un turno por cada servicio seleccionado, todos con mismo fecha/horario
  const nuevosTurnos = estado.servicios.map(s => ({
    id:            Date.now() + Math.random(),
    servicio:      s.nombre,
    duracionMin:   s.duracionMin,
    duracionTotal: duracionTotal(),   // para calcular bloqueo de slots
    precio:        s.precio,
    fecha:         estado.fecha.toISOString(),
    horario:       estado.horario,
    estado:        'pendiente',
    creadoEn:      new Date().toISOString()
  }));

  turnos.push(...nuevosTurnos);
  localStorage.setItem('turnos', JSON.stringify(turnos));

  // Agregar al carrito
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  estado.servicios.forEach(s => {
    carrito.push({
      nombre:  s.nombre,
      precio:  s.precio,
      tipo:    'servicio',
      img:     s.img,
      fecha:   estado.fecha.toLocaleDateString('es-AR'),
      horario: estado.horario
    });
  });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContador();

  // Modal de confirmación
  const fechaStr = estado.fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const listaHTML = estado.servicios.map(s =>
    `<div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.3rem">
      <span>${s.nombre}</span><strong>$${s.precio.toLocaleString()}</strong>
    </div>`
  ).join('');

  const finMin = slotAMinutos(estado.horario) + duracionTotal();
  const finH   = String(Math.floor(finMin / 60)).padStart(2, '0');
  const finM   = String(finMin % 60).padStart(2, '0');

  document.getElementById('modalDesc').innerHTML =
    `${listaHTML}
     <div style="border-top:1px solid #f2c4cf;margin-top:0.8rem;padding-top:0.8rem">
       📅 ${fechaStr}<br>
       🕐 ${estado.horario} → ${finH}:${finM} hs<br>
       ⏱ ${formatearDuracion(duracionTotal())} en total<br>
       💰 Total: <strong>$${precioTotal().toLocaleString()}</strong>
     </div>`;

  // Notificar al admin por WhatsApp automáticamente
  const sesion = getSesion ? getSesion() : null;
  const nombreCliente = sesion ? `${sesion.nombre} ${sesion.apellido || ''}` : 'Un cliente';
  const telAdmin = '5493510000000'; // reemplazar con número real
  const fechaStr2 = estado.fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const listaAdmin = estado.servicios.map(s => `• ${s.nombre}`).join(', ');
  const msgAdmin = `🌸 Nueva reserva!
👤 ${nombreCliente}
💆 ${listaAdmin}
📅 ${fechaStr2} · ${estado.horario} hs
💰 $${precioTotal().toLocaleString()}`;
  // Abrir WA al admin en background (el cliente no lo ve, solo se dispara)
  const waAdmin = `https://wa.me/${telAdmin}?text=${encodeURIComponent(msgAdmin)}`;
  // Guardamos el link para mostrarlo en el modal también
  document.getElementById('modalWhatsapp').href = generarLinkWhatsApp();
  // Link al admin (se abre en nueva pestaña silenciosa)
  const adminNotif = document.createElement('a');
  adminNotif.href = waAdmin; adminNotif.target = '_blank';
  adminNotif.style.display = 'none';
  document.body.appendChild(adminNotif);
  adminNotif.click();
  setTimeout(() => adminNotif.remove(), 1000);

  document.getElementById('modalOverlay').classList.remove('hidden');

  // Cuenta regresiva y redirección automática a mis-turnos
  let seg = 5;
  const intervalo = setInterval(() => {
    seg--;
    const el = document.getElementById('cuentaRegresiva');
    if (el) el.textContent = seg;
    if (seg <= 0) {
      clearInterval(intervalo);
      window.location.href = 'mis-turnos.html';
    }
  }, 1000);
}

// ── Toggle WhatsApp confirm ─────────────────────────────────────────────────
function toggleWaConfirm(checkbox) {
  if (checkbox.checked) {
    // Abrir WhatsApp con el mensaje pre-armado
    window.open(generarLinkWhatsApp(), '_blank');
  }
}
