/* ═══════════════════════════════════════
   SPA M — carrito.js (v2 - corregido)
   Productos agrupados + WA toggle + login guard
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  render();
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

// ── Toast ───────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Agrupar productos iguales ───────────────────────────────────────────────
function agruparProductos(items) {
  const mapa = {};
  items.forEach((item, idx) => {
    const key = item.nombre;
    if (!mapa[key]) {
      mapa[key] = { ...item, cantidad: 1, indices: [idx] };
    } else {
      mapa[key].cantidad++;
      mapa[key].indices.push(idx);
    }
  });
  return Object.values(mapa);
}

// ── Render completo ─────────────────────────────────────────────────────────
function render() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const empty   = document.getElementById('cartEmpty');
  const summary = document.getElementById('cartSummary');

  document.getElementById('contador').textContent = carrito.length;

  if (!carrito.length) {
    empty.classList.remove('hidden');
    summary.style.display = 'none';
    return;
  }

  empty.classList.add('hidden');
  summary.style.display = '';

  const servicios = carrito.filter(i => i.tipo === 'servicio');
  const productos  = carrito.filter(i => i.tipo === 'producto');
  const productosAgrupados = agruparProductos(productos);

  renderSeccionServicios(servicios, carrito);
  renderSeccionProductos(productosAgrupados, carrito);
  renderResumen(servicios, productos);
}

// ── Sección servicios (sin agrupar — cada turno es único) ──────────────────
function renderSeccionServicios(items, carritoCompleto) {
  const container = document.getElementById('seccionServicios');
  container.innerHTML = '';
  if (!items.length) return;

  const subtotal = items.reduce((s, i) => s + i.precio, 0);
  container.innerHTML = `
    <div class="section-title-bar">
      <h2>💆 Servicios</h2>
      <span class="section-count">${items.length}</span>
      <span class="section-subtotal">Subtotal: $${subtotal.toLocaleString()}</span>
    </div>`;

  items.forEach(item => {
    const realIndex = carritoCompleto.indexOf(item);
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img class="item-img" src="${item.img || 'https://via.placeholder.com/72'}" alt="${item.nombre}"/>
      <div class="item-info">
        <div class="item-name">${item.nombre}</div>
        <div class="item-meta">
          ${item.fecha  ? `📅 ${item.fecha}` : ''}
          ${item.horario ? ` · ⏱ ${item.horario} hs` : ''}
        </div>
      </div>
      <span class="item-price">$${item.precio.toLocaleString()}</span>
      <button class="btn-remove" onclick="eliminarItem(${realIndex})">✕</button>`;
    container.appendChild(div);
  });
}

// ── Sección productos (agrupados) ───────────────────────────────────────────
function renderSeccionProductos(agrupados, carritoCompleto) {
  const container = document.getElementById('seccionProductos');
  container.innerHTML = '';
  if (!agrupados.length) return;

  const totalUnidades = agrupados.reduce((s, p) => s + p.cantidad, 0);
  const subtotal      = agrupados.reduce((s, p) => s + p.precio * p.cantidad, 0);

  container.innerHTML = `
    <div class="section-title-bar">
      <h2>🛍️ Productos</h2>
      <span class="section-count">${totalUnidades}</span>
      <span class="section-subtotal">Subtotal: $${subtotal.toLocaleString()}</span>
    </div>`;

  agrupados.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img class="item-img" src="${item.img || 'https://via.placeholder.com/72'}" alt="${item.nombre}"/>
      <div class="item-info">
        <div class="item-name">${item.nombre}</div>
        <div class="item-meta">🛍️ Producto</div>
      </div>
      <div class="item-qty">
        <button class="qty-btn" onclick="cambiarCantidad('${item.nombre}', -1)">−</button>
        <span class="qty-num">${item.cantidad}</span>
        <button class="qty-btn" onclick="cambiarCantidad('${item.nombre}', 1)">+</button>
      </div>
      <span class="item-price">$${(item.precio * item.cantidad).toLocaleString()}</span>
      <button class="btn-remove" onclick="eliminarTodos('${item.nombre}')">✕</button>`;
    container.appendChild(div);
  });
}

// ── Cambiar cantidad de un producto agrupado ────────────────────────────────
function cambiarCantidad(nombre, delta) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  if (delta === -1) {
    // Quitar una unidad
    const idx = carrito.findIndex(i => i.nombre === nombre && i.tipo === 'producto');
    if (idx !== -1) carrito.splice(idx, 1);
  } else {
    // Agregar una unidad más (clonar el primer item de ese nombre)
    const base = carrito.find(i => i.nombre === nombre && i.tipo === 'producto');
    if (base) carrito.push({ ...base });
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));
  render();
}

// ── Eliminar todos los items de un producto ─────────────────────────────────
function eliminarTodos(nombre) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito = carrito.filter(i => !(i.nombre === nombre && i.tipo === 'producto'));
  localStorage.setItem('carrito', JSON.stringify(carrito));
  showToast('🗑️ Producto eliminado');
  render();
}

// ── Eliminar ítem por índice real (servicios) ───────────────────────────────
function eliminarItem(index) {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.splice(index, 1);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  showToast('🗑️ Item eliminado');
  render();
}

// ── Render resumen lateral ──────────────────────────────────────────────────
function renderResumen(servicios, productos) {
  const lines   = document.getElementById('summaryLines');
  const totalEl = document.getElementById('totalGeneral');
  const btn     = document.getElementById('btnCheckout');
  lines.innerHTML = '';

  const totalServ = servicios.reduce((s, i) => s + i.precio, 0);
  const totalProd = productos.reduce((s, i) => s + i.precio, 0);
  const total     = totalServ + totalProd;

  if (servicios.length) {
    lines.innerHTML += `
      <div class="summary-line">
        <span>Servicios (${servicios.length})</span>
        <strong>$${totalServ.toLocaleString()}</strong>
      </div>`;
  }
  if (productos.length) {
    lines.innerHTML += `
      <div class="summary-line">
        <span>Productos (${productos.length})</span>
        <strong>$${totalProd.toLocaleString()}</strong>
      </div>`;
  }

  totalEl.textContent = `$${total.toLocaleString()}`;
  btn.disabled = total === 0;
}

// ── Pagar todo ──────────────────────────────────────────────────────────────
function pagarTodo() {
  if (!requireSesion('completar la compra')) return;

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (!carrito.length) return;

  const totalServ = carrito.filter(i => i.tipo === 'servicio').reduce((s, i) => s + i.precio, 0);
  const totalProd = carrito.filter(i => i.tipo === 'producto').reduce((s, i) => s + i.precio, 0);
  const total     = totalServ + totalProd;

  // Si el toggle de WA está activado, abrir WhatsApp al admin con resumen del pedido
  const waCheck = document.getElementById('waClienteCheck');
  if (waCheck && waCheck.checked) {
    const sesion  = getSesion();
    const nombre  = sesion ? `${sesion.nombre} ${sesion.apellido || ''}` : 'Cliente';
    const telAdmin = '5493510000000'; // reemplazar con el número real del admin
    const lista   = carrito.map(i => `  • ${i.nombre} — $${i.precio.toLocaleString()}`).join('\n');
    const msg     = `🌸 Nuevo pedido de ${nombre}!\n\n${lista}\n\n💰 Total: $${total.toLocaleString()}\n\nPor favor avisarme cuando esté listo 😊`;
    window.open(`https://wa.me/${telAdmin}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // Agrupar productos para guardar en historial
  const productosAgrup = agruparProductos(carrito.filter(i => i.tipo === 'producto'));
  const serviciosCarrito = carrito.filter(i => i.tipo === 'servicio');
  const todosItems = [
    ...productosAgrup.map(p => ({ nombre: p.nombre, precio: p.precio, cantidad: p.cantidad, img: p.img })),
    ...serviciosCarrito.map(s => ({ nombre: s.nombre, precio: s.precio, cantidad: 1, img: s.img }))
  ];
  guardarPedido(todosItems, total);
  localStorage.removeItem('carrito');

  // Redirigir a página de confirmación
  window.location.href = 'confirmacion.html';
}
