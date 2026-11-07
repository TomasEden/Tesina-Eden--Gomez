# Senderos

Sistema web de reservas, catálogo y gestión integral para spa.

Plataforma desarrollada en PHP y MySQL que reúne en una sola aplicación la reserva de turnos, la venta de productos y la administración de un negocio de spa. No utiliza frameworks ni herramientas de compilación en el frontend: todo el código del lado del cliente es HTML, CSS y JavaScript estándar.

---

## Índice

- [Descripción](#descripción)
- [Características](#características)
- [Objetivos](#objetivos)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Módulos](#módulos)
- [API](#api)
- [Base de datos](#base-de-datos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Seguridad](#seguridad)
- [Diseño adaptable y accesibilidad](#diseño-adaptable-y-accesibilidad)
- [Hoja de ruta](#hoja-de-ruta)
- [Equipo](#equipo)
- [Licencia](#licencia)

---

## Descripción

Senderos digitaliza la operación diaria de un spa: permite a los clientes reservar turnos, explorar servicios y productos, comprar en línea, dejar reseñas y consultar su historial; y permite a los administradores gestionar todo el negocio desde un panel centralizado.

El proyecto sustituye los procesos manuales (agendas en papel, pedidos por teléfono y registro de clientes en planillas) por una solución única, accesible desde cualquier dispositivo.

**Principios de diseño**

| Principio | Aplicación en el proyecto |
|-----------|---------------------------|
| Simplicidad | Interfaz clara, sin dependencias externas y con pocos pasos para completar cada tarea. |
| Organización | Toda la información del negocio reside en una única base de datos relacional. |
| Escalabilidad | Estructura modular por carpetas: cada función nueva se agrega como endpoint y página independientes. |

---

## Características

| Función | Descripción |
|---------|-------------|
| Reserva de turnos | Selección de servicio, fecha y horario disponible, con seguimiento del estado y confirmación. |
| Catálogo | Productos y servicios con búsqueda, filtros y página de detalle. |
| Carrito y checkout | Agrupa productos y servicios, permite elegir el medio de pago y confirma la compra. |
| Pagos en línea | Preferencia de pago de Mercado Pago (Checkout Pro) y transferencia, con webhook de confirmación. |
| Reseñas | Puntuación con estrellas y comentarios sobre servicios y productos, con moderación desde el panel. |
| Favoritos | Guardado de productos y servicios por usuario, persistido en el servidor. |
| Verificación en dos pasos | Código de 6 dígitos enviado por correo electrónico a los usuarios clientes. |
| WhatsApp | Enlaces directos para coordinar pagos, confirmar turnos y contactar al local. |
| Modo oscuro | Tema claro/oscuro persistente, con detección de la preferencia del sistema. |
| Área de usuario | Registro, inicio de sesión, mis turnos, favoritos, pedidos y Mi cuenta. |
| Panel administrativo | Gestión de productos, servicios, stock, clientes, pedidos, ofertas, turnos y reseñas. |

---

## Objetivos

- Centralizar la administración de un spa en una única plataforma.
- Permitir la reserva de turnos las 24 horas, sin intervención del personal.
- Organizar productos, stock y pedidos en un solo lugar.
- Mejorar la comunicación con los clientes mediante notificaciones y enlaces directos.
- Reducir los errores propios de la gestión manual.
- Brindar una experiencia moderna, accesible y adaptable a cualquier pantalla.

---

## Tecnologías

| Tecnología | Versión | Uso en el proyecto |
|------------|:-------:|--------------------|
| PHP | 8.2 | Lógica del servidor y API JSON. |
| MySQL / MariaDB | — | Persistencia de datos (InnoDB, `utf8mb4`). |
| PDO | — | Conexión a la base con consultas preparadas. |
| HTML5 | — | Estructura semántica de las 23 páginas. |
| CSS3 | — | Diseño responsive, tokens de diseño y modo oscuro. |
| JavaScript | — | Interactividad del cliente, sin librerías externas. |
| PHPMailer | 7.x | Envío de correos por SMTP autenticado (vía Composer). |
| Composer | — | Gestión de dependencias. |
| Git / GitHub | — | Control de versiones. |

---

## Arquitectura

```text
        Navegador (HTML + CSS + JavaScript)
                      │
                      ▼
        API JSON en PHP  ──  sesiones y permisos
                      │
                      ▼
              PDO (consultas preparadas)
                      │
                      ▼
           Base de datos MySQL  (senderos_db)
```

- **Separación estricta entre capas:** la interfaz vive en `html/` y el servidor en `api/`; ninguna página contiene lógica de negocio ni las páginas se sirven desde la API.
- **Comunicación mediante JSON:** las páginas consumen la API con rutas relativas (`../api/archivo.php`) y reciben siempre respuestas JSON.
- **Sesión en el servidor:** los permisos se validan con `requireLogin()` y `requireAdmin()` en cada endpoint protegido.
- **Sin frameworks ni bundlers:** no hay etapa de compilación; el código desplegado es el mismo que se escribe.

---

## Estructura del proyecto

```text
Tesina-Eden--Gomez/
│
├── README.md
│
└── Senderos/
    ├── api/        Endpoints PHP, librerías y configuración
    ├── css/        Hojas de estilo (base, componentes, modo oscuro y una por página)
    ├── db/         Esquemas y migraciones SQL
    ├── html/       Vistas del sitio público y del panel administrativo
    ├── img/        Recursos gráficos (productos, servicios e íconos)
    ├── js/         Lógica del cliente
    ├── vendor/     Dependencias de Composer (no versionada)
    ├── .env        Configuración secreta (no versionada)
    ├── .env.example Plantilla de configuración
    └── composer.json Dependencias
```

Las carpetas `api/`, `css/`, `js/`, `img/` y `html/` se enlazan entre sí mediante rutas relativas; moverlas rompería los enlaces del sitio.

---

## Módulos

### Sitio público

- Inicio, servicios con detalle y reseñas.
- Catálogo de productos con favoritos.
- Búsqueda general de productos y servicios.
- Carrito de compras, selección de medio de pago y checkout.
- Confirmación de reservas y pedidos.
- Información institucional, políticas de privacidad y página 404.

### Área de usuario

- Registro e inicio de sesión con verificación en dos pasos para clientes.
- Mis turnos, con estado de cada reserva y enlace de WhatsApp.
- Favoritos y seguimiento de pedidos.
- Mi cuenta: actualización de datos personales, contraseña y correo electrónico.

### Panel administrativo

- Dashboard con métricas del negocio.
- Gestión de productos, servicios y stock.
- Gestión de clientes, pedidos y ofertas.
- Gestión y confirmación de turnos.
- Moderación de reseñas.

El panel se accede desde `html/admin-login.html` y requiere rol de administrador.

---

## API

Todos los endpoints responden JSON con los encabezados `Content-Type: application/json; charset=utf-8` y `Cache-Control: no-store`.

| Endpoint | Función | Acceso |
|----------|---------|--------|
| `api/sesion.php` | Devuelve el usuario en sesión | Público |
| `api/registro.php` | Alta de usuario cliente | Público |
| `api/login.php` · `api/logout.php` | Autenticación y cierre de sesión | Público |
| `api/verificacion.php` | Emisión, reenvío y validación del código de 2FA | Paso intermedio |
| `api/servicios.php` · `api/productos.php` | Catálogo | Lectura pública / escritura admin |
| `api/resenas.php` | Reseñas y puntuaciones | Público / moderación admin |
| `api/favoritos.php` | Favoritos del usuario | Login |
| `api/carrito.php` | Carrito en sesión | Login |
| `api/checkout.php` | Confirma el pedido dentro de una transacción PDO | Login |
| `api/pedidos.php` | Historial y estados de pedidos | Login / admin (`?todos=1`) |
| `api/turnos.php` | Alta, consulta y estados de turnos | Login / admin |
| `api/mi-cuenta.php` | Datos, contraseña y correo del usuario | Login |
| `api/clientes.php` | Listado de clientes | Admin |
| `api/oferta.php` | Ofertas y descuentos | Público / admin |
| `api/configuracion.php` | Costo de envío, horarios y feriados | Público |
| `api/webhook_mercadopago.php` | Confirmación de pago desde Mercado Pago | Externo |

Archivos de apoyo, no expuestos como endpoints: `config.php` (conexión, sesión y utilidades), `auth.php` (permisos y fusión de carritos), `mail.php` (plantillas y envío SMTP), `verificacion_lib.php`, `ofertas_lib.php`, `pagos_lib.php` y `pago_config.php`.

---

## Base de datos

- **Nombre:** `senderos_db` — motor InnoDB, cotejamiento `utf8mb4_unicode_ci`.
- **Puerto:** `3307` (configuración habitual de XAMPP).
- **Total:** 13 tablas.

| Grupo | Tablas |
|-------|--------|
| Catálogo y negocio | `usuarios`, `productos`, `servicios`, `pedidos`, `pedido_items`, `turnos`, `resenas`, `ofertas`, `favoritos`, `pagos` |
| Seguridad | `verificaciones`, `verificaciones_rate`, `password_resets` |

Datos de ejemplo incluidos: 71 productos, 24 servicios, 13 usuarios y un cuenta administrador.

**Criterios de almacenamiento**

- Contraseñas en hash bcrypt (`password_hash` / `password_verify`), nunca en texto plano.
- Códigos de verificación únicamente como HMAC-SHA256 firmado con una clave del servidor.
- Acceso a datos siempre mediante consultas preparadas con PDO.

---

## Instalación

### Requisitos

- PHP 8.2 o superior
- MySQL / MariaDB
- Composer
- XAMPP (Apache + MariaDB) u otro servidor compatible con PHP

### 1. Obtener el código

```bash
git clone https://github.com/TomasEden/Tesina-Eden--Gomez.git
cd Tesina-Eden--Gomez
```

### 2. Ubicar el proyecto

Mover la carpeta `Senderos/` al directorio del servidor web:

```text
C:\xampp\htdocs\Senderos
```

### 3. Crear la base de datos

Crear la base con phpMyAdmin (pestaña *Bases de datos*):

```text
Nombre:    senderos_db
Collation: utf8mb4_unicode_ci
```

Importar `db/senderos_db_unificado.sql`, que incluye estructura, datos de ejemplo y el usuario administrador.

- **Desde phpMyAdmin:** seleccionar `senderos_db`, abrir *Importar*, elegir el archivo, elegir el formato SQL y ejecutar.
- **Desde la consola:**

```bash
C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3307 -uroot senderos_db < db\senderos_db_unificado.sql
```

Aplicar la migración de verificación en dos pasos:

```bash
C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3307 -uroot senderos_db < db\migration_2026_verificacion_2fa.sql
```

> El archivo unificado contiene `DROP TABLE IF EXISTS`: importarlo reemplaza las tablas existentes. En una base ya creada con una versión anterior de `resenas`, aplicar además `db/migracion_resenas_productos.sql`.

### 4. Dependencias

```bash
cd Senderos
composer install
```

### 5. Configuración secreta

Crear el archivo `.env` a partir de la plantilla:

```bash
copy .env.example .env
```

Completar las variables descriptas en la sección [Configuración](#configuración). Este archivo nunca se sube al repositorio.

Los datos de conexión a la base se definen en `Senderos/api/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3307');
define('DB_NAME', 'senderos_db');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### 6. Ejecutar

Iniciar Apache y MySQL desde el panel de XAMPP y abrir en el navegador:

```text
Sitio público:  http://localhost/Senderos/html/index.html
Panel admin:    http://localhost/Senderos/html/admin-login.html
```

El sitio debe abrirse a través de `http://localhost/...`. Abrir los archivos con `file://` hace que las llamadas a la API fallen.

---

## Configuración

Variables definidas en `Senderos/.env`:

| Variable | Descripción |
|----------|-------------|
| `SENDEROS_URL` | URL pública del sitio. En local: `http://localhost/Senderos`. |
| `SENDEROS_HMAC_SECRET` | Clave secreta para el HMAC de los códigos de verificación. Obligatoria en producción. |
| `SENDEROS_SMTP_HOST` | Servidor SMTP (por defecto `smtp.gmail.com`). |
| `SENDEROS_SMTP_PORT` | Puerto SMTP (`587` con TLS, `465` con SSL). |
| `SENDEROS_SMTP_USER` | Usuario SMTP. |
| `SENDEROS_SMTP_PASS` | Contraseña de aplicación del servidor de correo. |
| `SENDEROS_SMTP_FROM` | Dirección remitente autorizada por el servidor SMTP. |
| `SENDEROS_SMTP_FROM_NAME` | Nombre remitente que se muestra en el correo. |
| `SENDEROS_SMTP_ENCRIPTACION` | `tls` o `ssl`. |
| `MP_ACCESS_TOKEN` | Token de acceso de Mercado Pago (opcional). |
| `MP_PUBLIC_KEY` | Clave pública de Mercado Pago (opcional). |
| `MP_WEBHOOK_SECRET` | Secreto de verificación del webhook (opcional). |
| `MP_MODE` | Entorno de trabajo: `sandbox` o producción. |

Para generar una clave aleatoria para `SENDEROS_HMAC_SECRET`:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

---

## Seguridad

- **Verificación en dos pasos para usuarios clientes:** código de 6 dígitos enviado por correo electrónico, válido por 5 minutos y de un solo uso.
- **Panel de administración sin código de verificación:** la cuenta administradora utiliza una casilla de prueba que no recibe correo; el acceso se resuelve con la contraseña. De este modo el panel nunca queda bloqueado por un código que no puede llegar.
- **Códigos protegidos:** se almacenan únicamente como HMAC-SHA256 firmado con una clave del servidor; jamás se escriben en texto plano, en logs ni en las respuestas de la API.
- **Sesión definitiva después de los dos pasos:** se regenera el identificador de sesión y se endurecen las cookies.
- **Control de acceso:** límites de envío e intentos de verificación, y bloqueo por fuerza bruta por dirección IP.
- **Fallo seguro:** si el correo no puede enviarse, no se concede el acceso.
- **Contraseñas:** hash bcrypt, verificadas con `password_verify`.
- **Datos:** consultas preparadas con PDO, sin concatenación de SQL.
- **Validación:** en el cliente y en el servidor.
- **Panel administrativo:** restringido mediante `requireAdmin()`.
- **Respuestas:** JSON sin caché (`Cache-Control: no-store`).
- **Configuración:** las credenciales residen en `.env`, excluido del repositorio mediante `.gitignore`.

---

## Diseño adaptable y accesibilidad

- Diseño responsive para computadoras, teléfonos y tabletas, con menú lateral en dispositivos táctiles.
- HTML semántico y textos alternativos en las imágenes.
- Modo oscuro que respeta la preferencia declarada por el sistema.
- Navegación completa por teclado en los formularios principales.

---

## Hoja de ruta

### Implementado

- Registro, inicio de sesión y roles (cliente / administrador).
- Verificación en dos pasos por correo para clientes.
- Reserva de turnos en línea.
- Catálogo de productos y servicios.
- Carrito y checkout.
- Pagos con Mercado Pago y transferencia.
- Coordinación de pagos y turnos mediante enlaces de WhatsApp.
- Sistema de reseñas y favoritos.
- Mi cuenta: datos personales, contraseña y correo.
- Panel administrativo con métricas.
- Gestión de clientes, pedidos, ofertas y stock.
- Modo oscuro y diseño adaptable.

### Mejoras previstas

- Notificaciones automáticas por correo.
- Reportes exportables.
- Gestión avanzada de stock.
- Optimización del rendimiento.
- Mejoras de accesibilidad (WCAG 2.1 AA).
- Panel de configuración del sistema.

---

## Equipo

| Integrante | Rol | Responsabilidades |
|------------|-----|-------------------|
| Tomás Edén | Full Stack Developer | Frontend, backend, base de datos e interfaz. |
| Malena Gómez | Frontend Developer | Frontend, diseño y documentación. |

---

## Licencia

Este proyecto fue desarrollado con fines educativos.

El código puede utilizarse como referencia respetando la autoría de sus desarrolladores.

---

Senderos — Desarrollado por Tomás Edén y Malena Gómez · 2026
