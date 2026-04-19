/* ═══════════════════════════════════════
   SPA M — confirmacion.js
   Página de confirmación post-pago
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();

  const pedidos = getPedidos();
  if (!pedidos.length) {
    // No hay pedido — redirigir
    window.location.href = 'index.html';
    return;
  }

  // Tomar el último pedido
  const pedido = pedidos[pedidos.length - 1];

  // Número de orden
  const numEl = document.getElementById('confirmOrderNum');
  if (numEl) numEl.textContent = '#' + String(pedido.id).slice(-6);

  // Items
  const itemsEl = document.getElementById('confirmItems');
  if (itemsEl && pedido.items) {
    itemsEl.innerHTML = pedido.items.map(item => `
      <div class="confirm-item">
        <img class="confirm-item-img"
             src="${item.img || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&q=60'}"
             alt="${item.nombre}"
             onerror="this.src='https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&q=60'">
        <div class="confirm-item-info">
          <div class="confirm-item-name">${item.nombre}</div>
          <div class="confirm-item-meta">Cantidad: ${item.cantidad || 1}</div>
        </div>
        <div class="confirm-item-price">$${(item.precio * (item.cantidad || 1)).toLocaleString('es-AR')}</div>
      </div>
    `).join('');
  }

  // Totales
  const totalesEl = document.getElementById('confirmTotals');
  if (totalesEl && pedido.items) {
    const servicios = pedido.items.filter(i => i.tipo === 'servicio' || !i.tipo);
    const productos  = pedido.items.filter(i => i.tipo === 'producto');
    let rows = '';

    if (servicios.length && productos.length) {
      const tServ = servicios.reduce((s, i) => s + i.precio * (i.cantidad || 1), 0);
      const tProd = productos.reduce((s, i) => s + i.precio * (i.cantidad || 1), 0);
      rows += `
        <div class="confirm-total-row">
          <span>Servicios</span>
          <span>$${tServ.toLocaleString('es-AR')}</span>
        </div>
        <div class="confirm-total-row">
          <span>Productos</span>
          <span>$${tProd.toLocaleString('es-AR')}</span>
        </div>`;
    }

    rows += `
      <div class="confirm-total-row grand">
        <span>Total</span>
        <span>$${pedido.total.toLocaleString('es-AR')}</span>
      </div>`;
    totalesEl.innerHTML = rows;
  }

  // Botón WhatsApp — avisar cuando esté listo
  const sesion   = getSesion();
  const nombre   = sesion ? `${sesion.nombre} ${sesion.apellido || ''}`.trim() : 'Cliente';
  const telAdmin = '5493510000000';
  const lista    = pedido.items
    ? pedido.items.map(i => `  • ${i.nombre} x${i.cantidad||1} — $${(i.precio*(i.cantidad||1)).toLocaleString('es-AR')}`).join('\n')
    : '';
  const msg = `🌸 Hola! Soy ${nombre}.\nRealicé un pedido (#${String(pedido.id).slice(-6)}):\n\n${lista}\n\n💰 Total: $${pedido.total.toLocaleString('es-AR')}\n\n¿Me avisás cuando esté listo? ¡Gracias! 😊`;
  const waBtn = document.getElementById('btnWaConfirm');
  if (waBtn) waBtn.href = `https://wa.me/${telAdmin}?text=${encodeURIComponent(msg)}`;
});
