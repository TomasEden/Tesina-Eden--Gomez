/* Senderos — configuración de pago (Fase F).

   ÚNICO lugar del proyecto con el alias de transferencia.
   El alias de abajo es un dato ficticio de la etapa de prueba: cuando la
   dueña pase el alias real se reemplaza SOLO acá, nunca en HTML ni en
   carrito.js (el auditor lo revisa: php tools/auditar.php F).

   whatsappPago es el número al que se coordina el pago desde el carrito.
   Este archivo se carga antes que js/carrito.js en html/carrito.html. */

window.CONFIG_PAGOS = window.CONFIG_PAGOS || {
  alias: 'tomy2009.mp',
  whatsappPago: '3571-616113'
};
