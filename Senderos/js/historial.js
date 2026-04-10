/* ═══════════════════════════════════════
   SPA M — historial.js
   Módulo compartido: historial de turnos y pedidos
   ═══════════════════════════════════════ */

/**
 * Guarda una compra del carrito en el historial de pedidos.
 * Se llama desde carrito.js al confirmar el pago.
 */
function guardarPedido(items, total) {
  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  const sesion  = getSesion ? getSesion() : null;

  const pedido = {
    id:        Date.now(),
    fecha:     new Date().toISOString(),
    cliente:   sesion ? `${sesion.nombre} ${sesion.apellido || ''}`.trim() : 'Cliente',
    items:     items.map(i => ({
      nombre:   i.nombre,
      precio:   i.precio,
      cantidad: i.cantidad || 1,
      img:      i.img || ''
    })),
    total,
    estado:    'pendiente'  // pendiente | listo | entregado
  };

  pedidos.push(pedido);
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  return pedido;
}

/**
 * Retorna todos los pedidos guardados.
 */
function getPedidos() {
  return JSON.parse(localStorage.getItem('pedidos')) || [];
}

/**
 * Retorna todos los turnos guardados.
 */
function getTurnosGuardados() {
  return JSON.parse(localStorage.getItem('turnos')) || [];
}

/**
 * Formatea una fecha ISO a texto legible en español.
 */
function formatFecha(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return isoStr; }
}

/**
 * Formatea solo día/mes/año corto.
 */
function formatFechaCorta(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return isoStr; }
}
