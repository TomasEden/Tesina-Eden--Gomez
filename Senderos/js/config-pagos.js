/* Senderos — configuración de pago (Fase F).

   ÚNICO lugar del proyecto con los datos de transferencia.
   Los valores de abajo son de PRUEBA: tienen formato real pero no
   corresponden a una cuenta verdadera. Antes de usar el sitio en
   producción hay que reemplazarlos por los datos que pase la dueña
   (se cambia SOLO acá, nunca en HTML ni en carrito.js: el auditor
   lo revisa con php tools/auditar.php F).

   cbu y titular muestran el dato porque el carrito permite copiarlo
   para coordinar la transferencia.

   whatsappPago es el número al que se coordina el pago desde el carrito.
   Este archivo se carga antes que js/carrito.js en html/carrito.html.

   Hay dos formas de pago convencionales (transferencia y efectivo/QR a
   coordinar por WhatsApp) y, cuando Mercado Pago está configurado, el
   carrito muestra además la opción de pago online con redirección
   (Checkout Pro). Si MP falla, el pedido se revierte y el carrito queda
   intacto. */

window.CONFIG_PAGOS = window.CONFIG_PAGOS || {
  alias: 'senderos.spa.mp',
  cbu: '0170012345000001234567',
  titular: 'Senderos Spa',
  whatsappPago: '3571-616113'
};
