<div align="center">

<img src="Senderos/img/icons/logo.svg" alt="Logo de Senderos" width="92"/>

# 🌿 Senderos

### Sistema web de reservas, catálogo y gestión integral para spa

**Una plataforma moderna para digitalizar la experiencia de clientes y administradores.**

<br/>

<img src="https://img.shields.io/badge/Estado-En_desarrollo-AD717E?style=for-the-badge&labelColor=39311D" alt="Estado: en desarrollo"/>
<img src="https://img.shields.io/badge/Versión-1.1-D3A1A9?style=for-the-badge&labelColor=39311D" alt="Versión 1.1"/>
<img src="https://img.shields.io/badge/Seguridad-2FA-45634D?style=for-the-badge&labelColor=39311D" alt="Seguridad con 2FA"/>

<br/>

<img src="https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white" alt="PHP 8.2"/>
<img src="https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white" alt="MySQL"/>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript"/>
<img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5"/>
<img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3"/>

</div>

---

## 📖 Descripción

**Senderos** es una aplicación web que unifica en una sola plataforma la gestión de un spa: reservar turnos, consultar servicios, explorar el catálogo de productos, dejar reseñas y administrar el negocio desde un panel centralizado.

Reemplaza los procesos manuales por una solución digital moderna, intuitiva y completamente responsive.

> **Principios del proyecto** — **Simplicidad** (interfaz clara y accesible) · **Organización** (toda la información en un único lugar) · **Escalabilidad** (estructura modular que facilita sumar funcionalidades).

---

## ✨ Características

<table>
<tr>
<td width="50%">

#### 📅 Reservas online

Programá turnos seleccionando servicio, fecha y horario disponible.

</td>
<td width="50%">

#### 🛍️ Catálogo

Explorá productos con filtros, búsqueda y navegación organizada.

</td>
</tr>
<tr>
<td>

#### 🛒 Carrito y checkout

Agrupá productos y servicios, elegí el medio de pago y confirmá.

</td>
<td>

#### 💳 Pagos online

Preferencias de Mercado Pago y transferencia, con webhook de confirmación.

</td>
</tr>
<tr>
<td>

#### ⭐ Reseñas y favoritos

Valora servicios con estrellas, dejá comentarios y guardá favoritos.

</td>
<td>

#### 🔐 Acceso en dos pasos

Código de verificación por correo antes de iniciar sesión.

</td>
</tr>
<tr>
<td>

#### 📲 WhatsApp

Confirmación de turnos y pedidos mediante integración con WhatsApp.

</td>
<td>

#### 🌙 Modo oscuro

Tema claro/oscuro persistente, accesible desde la barra de navegación.

</td>
</tr>
<tr>
<td>

#### 👤 Área de usuario

Registro, inicio de sesión, mis turnos, favoritos y seguimiento de pedidos.

</td>
<td>

#### ⚙️ Administración

Gestión de servicios, productos, clientes, pedidos, ofertas, turnos y reseñas.

</td>
</tr>
</table>

---

## 🎯 Objetivos

- Centralizar la administración de un spa en una única plataforma.
- Facilitar la reserva de turnos las 24 horas.
- Organizar productos, stock y pedidos.
- Mejorar la comunicación con los clientes.
- Reducir errores administrativos.
- Brindar una experiencia moderna, accesible y responsive.

---

## 🚀 Tecnologías

<div align="center">

| Frontend | Backend | Base de datos | Herramientas |
|:--------:|:-------:|:-------------:|:------------:|
| <img src="https://skillicons.dev/icons?i=html,css,js" height="42" alt="HTML, CSS, JavaScript"/> | <img src="https://skillicons.dev/icons?i=php" height="42" alt="PHP"/> | <img src="https://skillicons.dev/icons?i=mysql" height="42" alt="MySQL"/> | <img src="https://skillicons.dev/icons?i=git,github,vscode" height="42" alt="Git, GitHub, VS Code"/> |

</div>

| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura semántica de la interfaz |
| **CSS3** | Diseño responsive, tokens de diseño y modo oscuro |
| **JavaScript** | Interactividad del cliente (vanilla, sin librerías) |
| **PHP 8.2** | Lógica del servidor y API JSON |
| **MySQL / MariaDB** | Persistencia de datos |
| **PDO** | Conexión segura con consultas preparadas |
| **PHPMailer** | Envío de correos por SMTP autenticado |

---

## 🏗️ Arquitectura

```text
                    Usuario
                        │
                        ▼
           HTML • CSS • JavaScript
                        │
                        ▼
              API JSON en PHP (PDO)
                        │
                        ▼
               Base de datos MySQL
```

- **Sin frameworks ni bundlers:** todo el frontend es HTML, CSS y JS vanilla.
- Las páginas consumen la API con rutas relativas (`../api/archivo.php`) y siempre reciben JSON.
- La sesión vive en el servidor y los permisos se validan con `requireLogin()` / `requireAdmin()`.
- El backend está separado de la interfaz: `api/` nunca se mezcla con `html/`.

---

## 📂 Estructura del proyecto

```text
Tesina-Eden--Gomez/
│
├── README.md
│
└── Senderos/
    ├── api/        # Endpoints PHP + librerías y configuración
    ├── css/        # Hojas de estilo (base, componentes, darkmode + una por página)
    ├── db/         # Esquema y migraciones SQL
    ├── docs/       # Documentación del proyecto
    ├── html/       # Vistas del sitio público y del panel admin
    ├── img/        # Recursos gráficos (productos, servicios, íconos)
    ├── js/         # Lógica del cliente
    └── vendor/     # Dependencias de Composer (PHPMailer)
```

> Las carpetas `api/`, `css/`, `js/`, `img/` y `html/` se referencian entre sí con **rutas relativas**; moverlas rompería los enlaces del sitio.

---

## 🖥️ Módulos principales

<details>
<summary><b>🌐 Sitio público</b></summary>

- Página de inicio
- Servicios con detalle y reseñas
- Catálogo de productos con favoritos
- Búsqueda
- Carrito de compras y checkout
- Confirmación de reservas y pedidos
- Información institucional y políticas
- Página 404

</details>

<details>
<summary><b>👤 Área de usuario</b></summary>

- Registro e inicio de sesión con verificación en dos pasos
- Mi cuenta (datos personales, contraseña y correo)
- Mis turnos
- Favoritos
- Seguimiento de pedidos

</details>

<details>
<summary><b>⚙️ Panel administrativo</b></summary>

- Dashboard con métricas
- Gestión de productos, servicios y stock
- Gestión de clientes, pedidos y ofertas
- Gestión de turnos
- Moderación de reseñas

</details>

---

## 🔌 API

Todos los endpoints responden JSON con `Content-Type: application/json; charset=utf-8` y `Cache-Control: no-store`.

| Endpoint | Función | Acceso |
|----------|---------|--------|
| `api/sesion.php` | Usuario en sesión | Público |
| `api/login.php` · `api/logout.php` · `api/registro.php` | Autenticación | Público |
| `api/verificacion.php` | Código de verificación (2FA) | Paso intermedio |
| `api/servicios.php` · `api/productos.php` | Catálogo | Lectura pública / escritura admin |
| `api/resenas.php` | Reseñas y puntuaciones | Público / moderación admin |
| `api/favoritos.php` | Favoritos del usuario | Login |
| `api/carrito.php` | Carrito en sesión | Login |
| `api/checkout.php` | Confirma el pedido (transacción PDO) | Login |
| `api/pedidos.php` | Historial y estados de pedidos | Login / admin (`?todos=1`) |
| `api/turnos.php` | Alta, consulta y estados de turnos | Login / admin |
| `api/mi-cuenta.php` | Datos, contraseña y correo del usuario | Login |
| `api/clientes.php` | Listado de clientes | Admin |
| `api/oferta.php` | Ofertas y descuentos | Público / admin |
| `api/configuracion.php` | Costo de envío, horarios, feriados | Público |
| `api/webhook_mercadopago.php` | Confirmación de pago desde Mercado Pago | Externo |

---

## 🗄️ Base de datos

- **Nombre:** `senderos_db` — InnoDB, `utf8mb4` / `utf8mb4_unicode_ci`.
- **Puerto:** `3307` (configuración habitual de XAMPP).

| Grupo | Tablas |
|-------|--------|
| **Catálogo y negocio** | `usuarios`, `productos`, `servicios`, `pedidos`, `pedido_items`, `turnos`, `resenas`, `ofertas`, `favoritos`, `pagos` |
| **Seguridad** | `verificaciones`, `verificaciones_rate`, `password_resets` |

- **Contraseñas:** guardadas como hash bcrypt (`password_hash`) y verificadas con `password_verify`; nunca en texto plano.
- **Códigos de verificación:** guardados únicamente como HMAC-SHA256 firmado con una clave del servidor.

---

## ⚙️ Instalación

### Requisitos

- PHP 8.2 o superior
- MySQL / MariaDB
- Composer (para instalar PHPMailer)
- XAMPP (Apache + MariaDB) o cualquier servidor compatible con PHP

### 1. Clonar el repositorio

```bash
git clone https://github.com/TomasEden/Tesina-Eden--Gomez.git
cd Tesina-Eden--Gomez
```

### 2. Ubicar el proyecto

Mover la carpeta **`Senderos/`** al directorio del servidor web:

```text
C:\xampp\htdocs\Senderos
```

### 3. Base de datos

Crear la base con phpMyAdmin (pestaña *Bases de datos*):

```text
Nombre:    senderos_db
Collation: utf8mb4_unicode_ci
```

Luego importar **`db/senderos_db_unificado.sql`** (estructura + datos de ejemplo + usuario administrador).

- **Por phpMyAdmin:** seleccionar `senderos_db` → *Importar* → elegir el archivo → formato SQL → *Ejecutar*.
- **Por consola:**

```bash
C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3307 -uroot senderos_db < db\senderos_db_unificado.sql
```

Aplicar la migración de verificación en dos pasos:

```bash
C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3307 -uroot senderos_db < db\migration_2026_verificacion_2fa.sql
```

> ⚠️ El archivo unificado contiene `DROP TABLE IF EXISTS`: importarlo **reemplaza** las tablas existentes.

### 4. Dependencias

```bash
cd Senderos
composer install
```

### 5. Configuración secreta

Crear el archivo `.env` a partir de la plantilla y completarlo con tus valores:

```bash
copy .env.example .env
```

Contiene las credenciales SMTP (para enviar los códigos de verificación), la clave HMAC y los datos de pago. **Nunca se sube a Git.**

Los valores de conexión a la base viven en `Senderos/api/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3307');
define('DB_NAME', 'senderos_db');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### 6. Ejecutar

Iniciar **Apache** y **MySQL** desde el panel de XAMPP y abrir en el navegador:

```text
Sitio público:  http://localhost/Senderos/html/index.html
Panel admin:    http://localhost/Senderos/html/admin-login.html
```

> **Nota:** el sitio debe abrirse por `http://localhost/...`. Abrir los archivos con `file://` hace que las llamadas a la API fallen.

---

## 🔒 Seguridad

- **Verificación en dos pasos (2FA)** al iniciar sesión: código de 6 dígitos enviado por correo, válido por 5 minutos y de un solo uso.
- Los códigos se guardan **solo como HMAC-SHA256** firmado con una clave del servidor: jamás en texto plano, en logs ni en respuestas de la API.
- Sesión definitiva recién después de los dos pasos, con regeneración de ID y cookies endurecidas.
- Límites de envío e intentos, y bloqueo por fuerza bruta por IP.
- Si el correo no se puede enviar, **no se concede el acceso** (comportamiento seguro por defecto).
- Contraseñas con hash bcrypt, nunca en texto plano.
- Consultas preparadas con PDO (sin concatenar SQL).
- Validación de formularios en cliente **y** servidor.
- Acceso restringido al panel administrativo con `requireAdmin()`.
- Respuestas JSON sin cachear (`Cache-Control: no-store`).

> 📖 Documentación completa en [`Senderos/docs/SEGURIDAD_VERIFICACION.md`](Senderos/docs/SEGURIDAD_VERIFICACION.md).

---

## 📱 Responsive y accesibilidad

- Diseño adaptable para 💻 computadoras, 📱 teléfonos y 📲 tablets.
- Navegación con menú lateral en dispositivos táctiles.
- HTML semántico y textos alternativos en las imágenes.
- Modo oscuro que respeta la preferencia del sistema.

---

## 🗺️ Roadmap

### ✅ Implementado

- [x] Registro, login y roles (cliente / administrador)
- [x] Verificación en dos pasos por correo (2FA)
- [x] Reservas de turnos online
- [x] Catálogo de productos y servicios
- [x] Carrito y checkout
- [x] Pagos con Mercado Pago y transferencia
- [x] Confirmación por WhatsApp
- [x] Sistema de reseñas y favoritos
- [x] Mi cuenta (datos, contraseña y correo)
- [x] Dashboard administrativo con métricas
- [x] Gestión de clientes, pedidos, ofertas y stock
- [x] Modo oscuro y diseño responsive

### 🔜 Próximas mejoras

- [ ] Notificaciones automáticas
- [ ] Reportes exportables
- [ ] Gestión avanzada de stock
- [ ] Optimización del rendimiento
- [ ] Mejoras de accesibilidad (WCAG AA)
- [ ] Panel de configuración del sistema

---

## 👨‍💻 Equipo

<table>
<tr>
<td align="center">

### Tomás Edén

**Full Stack Developer**

Frontend · Backend · Base de datos · Diseño UI

</td>
<td align="center">

### Malena Gómez

**Frontend Developer**

Frontend · Diseño · Documentación

</td>
</tr>
</table>

---

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos y de aprendizaje.

El código puede utilizarse como referencia respetando la autoría de sus desarrolladores.

---

<div align="center">

<img src="Senderos/img/icons/logo.svg" alt="Logo de Senderos" width="64"/>

### Senderos

#### Una experiencia digital para la gestión inteligente de spas.

<br/>

Desarrollado por **Tomás Edén** y **Malena Gómez** · 2026

</div>
