# Senderos Spa

Sitio web de una spa (turnos, productos y servicios) construido en **PHP 8.2** con
**MySQL**. Frontend estático (HTML/CSS/JS) que consume una API JSON en PHP.

---

## Requisitos

- PHP 8.2+
- MySQL 8 / MariaDB
- Apache (XAMPP sirve todo junto)
- Composer (solo para instalar PHPMailer)

---

## Instalación

1. Copiar el proyecto en `C:\xampp\htdocs\Senderos` (o en la carpeta de tu servidor).
2. Crear la base de datos y aplicar el esquema:

   ```bash
   mysql -u root senderos_db < db/senderos_db_unificado.sql
   ```

3. Aplicar la migración de verificación en dos pasos (2FA):

   ```bash
   mysql -u root senderos_db < db/migration_2026_verificacion_2fa.sql
   ```

   > Si MySQL corre en otro puerto (por ejemplo 3307 en esta instalación),
   > agregar `-P 3307` al comando.

4. Instalar dependencias de PHP:

   ```bash
   composer install
   ```

5. Crear el archivo de configuración secreta a partir de la plantilla:

   ```bash
   copy .env.example .env
   ```

   Editar `.env` y completar:
   - Credenciales SMTP (para enviar los códigos de verificación).
   - `SENDEROS_HMAC_SECRET`: clave aleatoria de 64 caracteres para firmar los códigos.
   - Datos de Mercado Pago y del costo de envío.

6. Abrir `http://localhost/Senderos/html/`.

> **`.env` nunca se sube a Git ni va dentro del ZIP de entrega.** Es el único
> archivo con credenciales reales. La plantilla `.env.example` sí se versiona.

---

## Estructura

```
Senderos/
├── api/            Endpoints PHP (JSON) y librerías de servidor
│   ├── config.php            Carga .env, sesión endurecida, conexión a BD
│   ├── login.php             Paso 1 del 2FA: valida contraseña y envía código
│   ├── verificacion.php      Paso 2 del 2FA: valida el código y crea la sesión
│   ├── verificacion_lib.php  Lógica de códigos, límites y anti fuerza bruta
│   ├── mail.php              Plantillas de correo con PHPMailer/SMTP
│   ├── mi-cuenta.php         «Mi cuenta»: datos, contraseña, email y 2FA
│   ├── favoritos.php         CRUD de favoritos (servidor = fuente de verdad)
│   ├── carrito.php           Carrito de compras
│   ├── checkout.php          Genera preferencia de Mercado Pago
│   ├── pagos_lib.php         Integración con Mercado Pago
│   ├── webhook_mercadopago.php  Webhook de confirmación de pago
│   ├── productos.php         Catálogo de productos
│   ├── servicios.php         Catálogo de servicios
│   ├── turnos.php            Reserva y gestión de turnos
│   ├── resenas.php           Reseñas de clientes
│   ├── ofertas_lib.php       Lógica de ofertas
│   ├── sesion.php            Estado de la sesión actual
│   ├── logout.php            Cierra la sesión
│   ├── registro.php          Alta de clientes
│   └── ...                   Otros endpoints auxiliares
│
├── html/           Páginas del sitio (frontend estático)
│   ├── index.html            Portada
│   ├── productos.html        Catálogo (?id=X para detalle)
│   ├── servicios.html        Servicios
│   ├── carrito.html          Carrito
│   ├── checkout/confirmacion Flujo de compra
│   ├── login.html            Ingreso (paso 1)
│   ├── verificacion.html     Ingreso (paso 2: código por correo)
│   ├── registro.html         Alta de cuenta
│   ├── mis-turnos.html       Turnos + «Mi cuenta» (pestañas)
│   ├── favoritos.html        Favoritos
│   ├── admin-*.html          Panel de administración
│   └── 404.html              Página no encontrada
│
├── css/            Hojas de estilo (una por página + base/componentes)
├── js/             Lógica del navegador (una por página + utilidades)
│   ├── config-pagos.js       Alias, CBU y datos de transferencia
│   ├── favoritos-api.js      Cliente de la API de favoritos
│   └── sesion.js             Sincroniza el estado de sesión en la UI
│
├── img/            Imágenes del sitio
├── db/             Esquemas y migraciones SQL
├── docs/           Documentación del proyecto
│   ├── SEGURIDAD_VERIFICACION.md   Cómo funciona el 2FA (fuente oficial)
│   └── README_PAGOS.md             Integración de pagos
│
├── vendor/         Dependencias de Composer (PHPMailer)
├── .env            Configuración secreta  ← NO versionar ni entregar
├── .env.example    Plantilla de configuración (segura de versionar)
└── composer.json   Dependencias PHP
```

### Convención de rutas

Las páginas viven en `html/` y referencian el resto **con rutas relativas**:

```html
<link rel="stylesheet" href="../css/base.css">
<script src="../js/sesion.js"></script>
<img src="../img/logo.png">
```

Los endpoints se llaman desde `../api/...`. Por eso **las carpetas `api/`, `css/`,
`js/`, `img/` y `html/` no deben moverse de lugar** sin reescribir cientos de
referencias.

---

## Seguridad

- **Verificación en dos pasos (2FA)** por correo al iniciar sesión. Ver
  [`docs/SEGURIDAD_VERIFICACION.md`](docs/SEGURIDAD_VERIFICACION.md).
- Los códigos se guardan **solo como HMAC-SHA256** firmado con una clave del
  servidor: jamás en texto plano, en logs ni en respuestas de la API.
- Sesión definitiva recién después de los dos pasos, con regeneración de ID y
  cookies endurecidas.
- Consultas preparadas en todo el acceso a datos.
- Límites de envío e intentos y bloqueo por fuerza bruta por IP.
- Si el correo no se puede enviar, **no se concede el acceso** (comportamiento
  seguro por defecto).

---

## Base de datos

La base `senderos_db` tiene 13 tablas. Las dos nuevas de la migración de 2FA son:

| Tabla | Para qué sirve |
|---|---|
| `verificaciones` | Desafíos de código (hash, vencimiento, intentos, estado) |
| `verificaciones_rate` | Contadores de límite por usuario, IP y tipo de operación |

---

## Puntos de entrega

- `Senderos_2FA.zip`: proyecto completo **sin `.env`** (nunca debe llevar
  credenciales reales).

## Autor

Proyecto académico —(Senderos Spa).
