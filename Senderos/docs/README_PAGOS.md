# Pago online con Mercado Pago (Checkout Pro)

La integración está implementada, pero **permanece desactivada hasta configurar
credenciales reales**. Sin credenciales, la opción Mercado Pago no aparece en el
carrito y el backend rechaza ese método con un error controlado.

## 1. Aplicar la migración

```sql
SOURCE db/migrations/20261028_pagos_mercadopago.sql;
```

La migración agrega el estado de pago a `pedidos` y crea la tabla `pagos`.
No modifica pedidos existentes: todos quedan con `pago_estado = 'pendiente'`.

## 2. Configurar variables de entorno

Nunca guardar credenciales dentro del repositorio. Definir en Apache/PHP-FPM o
en el entorno del servidor:

```text
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=...
MP_MODE=sandbox
SENDEROS_URL=https://tu-dominio.com
```

- `MP_MODE`: `sandbox` para pruebas, `production` para cobros reales.
- `SENDEROS_URL`: URL pública del sitio, sin barra final. Mercado Pago necesita
  que las `back_urls` y el webhook sean accesibles desde Internet. En producción
  debe ser HTTPS.
- Si `MP_ACCESS_TOKEN` o `MP_WEBHOOK_SECRET` están vacíos, la integración queda
  deshabilitada.

En XAMPP/Windows se pueden definir como variables de entorno del sistema, o en
la configuración de Apache:

```apache
SetEnv MP_ACCESS_TOKEN "APP_USR-..."
SetEnv MP_WEBHOOK_SECRET "..."
SetEnv MP_MODE "sandbox"
SetEnv SENDEROS_URL "https://tu-dominio.com"
```

Después de cambiar variables de entorno, reiniciar Apache.

## 3. Configurar el webhook

En el panel de Mercado Pago, configurar la URL:

```text
https://tu-dominio.com/api/webhook_mercadopago.php
```

El webhook valida la firma `x-signature` con `MP_WEBHOOK_SECRET`, consulta el
pago real a la API de Mercado Pago y actualiza el estado del pago. No confía en
los datos enviados por el navegador.

## 4. Flujo

1. El cliente elige Mercado Pago en el checkout.
2. `api/checkout.php` registra el pedido y crea una preferencia de Checkout Pro.
   Si Mercado Pago falla, se revierte el pedido y el carrito queda intacto.
3. El cliente es redirigido a Mercado Pago.
4. Al volver, `confirmacion.html` muestra el estado del pedido y actualiza el
   estado durante un minuto mientras espera la acreditación.
5. El webhook actualiza `pago_estado` a `aprobado`, `rechazado`, etc. El estado
   logístico del pedido no se cambia automáticamente: el local lo gestiona desde
   el panel de administración.

Estados posibles: `pendiente`, `en_proceso`, `aprobado`, `rechazado`,
`cancelado`, `reembolsado`, `revisar`, `error`.

## 5. Pruebas pendientes

No se ejecutaron pruebas contra la API real porque el proyecto todavía no tiene
credenciales. Antes de habilitar producción hay que probar como mínimo:

- pago aprobado, pendiente y rechazado en sandbox;
- recepción y validación del webhook;
- regreso a `confirmacion.html` con el estado correcto;
- coincidencia de importe y moneda;
- actualización manual del estado desde el panel admin.
