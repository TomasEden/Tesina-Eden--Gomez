/* ═══════════════════════════════════════
   SPA M — confirmacion.js (conectado a la API)
   Página de confirmación post-pago
   ═══════════════════════════════════════ */

   const API_PEDIDOS = '../api/pedidos.php';

   document.addEventListener('DOMContentLoaded', () => {
     actualizarNavbar();
   
     const pedidoId = sessionStorage.getItem('ultimoPedidoId');
     if (!pedidoId) {
       // No hay pedido de productos (puede haber sido solo servicios) — igual mostramos algo genérico
       mostrarSinPedido();
       return;
     }
   
     fetch(`${API_PEDIDOS}?id=${pedidoId}`)
       .then(r => r.json())
       .then(data => {
         if (!data.ok) {
           mostrarSinPedido();
           return;
         }
         mostrarPedido(data.pedido);
         sessionStorage.removeItem('ultimoPedidoId');
       })
       .catch(() => mostrarSinPedido());
   });
   
   function mostrarSinPedido() {
     // Si no hay pedido de productos (por ej. solo se reservaron servicios), mostramos un mensaje genérico
     const numEl = document.getElementById('confirmOrderNum');
     if (numEl) numEl.textContent = '—';
   
     const itemsEl = document.getElementById('confirmItems');
     if (itemsEl) itemsEl.innerHTML = '<p style="font-size:0.88rem;color:var(--text-light)">Tu reserva de servicios fue confirmada. Podés ver el detalle en "Mis turnos".</p>';
   
     const totalesEl = document.getElementById('confirmTotals');
     if (totalesEl) totalesEl.innerHTML = '';
   
     const waBtn = document.getElementById('btnWaConfirm');
     if (waBtn) waBtn.closest('#confirmWa')?.classList.add('hidden');
   }
   
   function mostrarPedido(pedido) {
     const numEl = document.getElementById('confirmOrderNum');
     if (numEl) numEl.textContent = '#' + String(pedido.id).padStart(6, '0');
   
     const itemsEl = document.getElementById('confirmItems');
     if (itemsEl && pedido.items) {
       itemsEl.innerHTML = pedido.items.map(item => `
         <div class="confirm-item">
           <div class="confirm-item-info">
             <div class="confirm-item-name">${item.nombre}</div>
             <div class="confirm-item-meta">Cantidad: ${item.cantidad || 1}</div>
           </div>
           <div class="confirm-item-price">$${(Number(item.precio) * (item.cantidad || 1)).toLocaleString('es-AR')}</div>
         </div>
       `).join('');
     }
   
     const totalesEl = document.getElementById('confirmTotals');
     if (totalesEl) {
       totalesEl.innerHTML = `
         <div class="confirm-total-row grand">
           <span>Total</span>
           <span>$${Number(pedido.total).toLocaleString('es-AR')}</span>
         </div>`;
     }
   
     // Botón WhatsApp — avisar cuando esté listo
     const sesion   = getSesion();
     const nombre   = sesion ? `${sesion.nombre} ${sesion.apellido || ''}`.trim() : 'Cliente';
     const telAdmin = '5493571616113';
     const lista    = pedido.items
       ? pedido.items.map(i => `  • ${i.nombre} x${i.cantidad||1} — $${(Number(i.precio)*(i.cantidad||1)).toLocaleString('es-AR')}`).join('\n')
       : '';
  const msg = `Hola! Soy ${nombre}.\nRealicé un pedido (#${String(pedido.id).padStart(6,'0')}):\n\n${lista}\n\nTotal: $${Number(pedido.total).toLocaleString('es-AR')}\n\n¿Me avisás cuando esté listo? ¡Gracias! `;
     const waBtn = document.getElementById('btnWaConfirm');
     if (waBtn) waBtn.href = `https://wa.me/${telAdmin}?text=${encodeURIComponent(msg)}`;
   }