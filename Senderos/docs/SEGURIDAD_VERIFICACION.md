# Senderos — Verificación en dos pasos (2FA) y gestión de datos personales

Este documento describe cómo instalar, configurar y verificar el sistema de
seguridad agregado a la plataforma **Senderos**:

1. **Verificación en dos pasos por correo** al iniciar sesión.
2. **Gestión segura de datos personales** desde «Mi cuenta», con verificación
   obligatoria por correo antes de guardar y **doble verificación** para el
   cambio de correo.

> El sistema está diseñado para funcionar sobre la estructura, la identidad
> visual y las funcionalidades existentes de Senderos. No se modificó el
> esquema original de la base de datos: solo se **agregaron** dos tablas nuevas
> mediante una migración separada.

---

## 1. Requisitos

| Componente | Versión usada en desarrollo |
|---|---|
| PHP | 8.2 (XAMPP) con `pdo_mysql`, `openssl`, `mbstring` |
| MySQL | MariaDB de XAMPP (puerto `3307` en este entorno) |
| Composer | Cualquier versión reciente |
| PHPMailer | 7.x (instalado por Composer en `/vendor`) |

---

## 2. Instalación

### 2.1 Copiar el proyecto

Copiar la carpeta del proyecto dentro de `htdocs`, por ejemplo
`C:\xampp\htdocs\Senderos`.

### 2.2 Instalar PHPMailer con Composer

El proyecto ya incluye `composer.json` y `composer.lock`. Desde la carpeta
raíz del proyecto:

```bash
composer install
```

Esto genera la carpeta `/vendor` con PHPMailer. Si Composer no puede extraer
los paquetes, habilitar la extensión `extension=zip` en `php.ini` y reintentar.

> `/vendor` está excluida del repositorio (ver `.gitignore`). En el entorno de
> desarrollo ya fue instalada; en otra máquina hay que ejecutar `composer install`.

### 2.3 Aplicar la migración de base de datos

Abrir phpMyAdmin (o la consola MySQL) y ejecutar el archivo:

```
db/migration_2026_verificacion_2fa.sql
```

Crea **dos tablas nuevas** sin tocar las existentes:

- `verificaciones`: desafíos de código (login, perfil, correo actual, correo nuevo).
- `verificaciones_rate`: contadores por usuario e IP para limitar abusos.

> ⚠️ La migración **no borra ni reinicializa** ninguna tabla existente.

### 2.4 Configurar el archivo `.env`

Copiar la plantilla y completarla con credenciales reales:

```bash
copy .env.example .env
```

Editar `.env` con un editor de texto. **Nunca** subir este archivo al
repositorio (ya está en `.gitignore`).

Ejemplo para Gmail:

```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_ENCRYPTION=tls
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación
MAIL_FROM=tu-correo@gmail.com
MAIL_FROM_NAME=Senderos
SENDEROS_HMAC_SECRET=una-frase-larga-y-aleatoria-de-al-menos-32-caracteres
```

#### Obtener una contraseña de aplicación de Gmail

1. Activar la verificación en dos pasos de la cuenta de Google.
2. Ir a *Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones*.
3. Generar una contraseña para «Correo» y usarla en `SMTP_PASS`.

> ⚠️ **Importante:** si el archivo `.env` falta o el SMTP falla, el sistema
> **no deja entrar a nadie** con credenciales correctas: muestra un mensaje
> claro de «servicio de correo no disponible» y **no inicia sesión**. Esto es
> deliberado: un fallo de correo nunca debe convertirse en un hueco de seguridad.

#### Variables disponibles

| Variable | Descripción | Por defecto |
|---|---|---|
| `SMTP_HOST` | Servidor SMTP | vacío |
| `SMTP_PORT` | Puerto | `587` |
| `SMTP_ENCRYPTION` | `tls`, `ssl` o vacío | `tls` |
| `SMTP_USER` | Usuario SMTP | vacío |
| `SMTP_PASS` | Contraseña SMTP | vacío |
| `MAIL_FROM` | Remitente | `SMTP_USER` |
| `MAIL_FROM_NAME` | Nombre del remitente | `Senderos` |
| `SENDEROS_HMAC_SECRET` | Clave para el HMAC de los códigos | derivada (solo desarrollo) |

> **En desarrollo local**, si no existe `.env`, el sistema deriva una clave
> del nombre de la base de datos y imprime un aviso. Eso es **solo apto para
> desarrollo**: en producción **siempre** se debe definir
> `SENDEROS_HMAC_SECRET` con un valor propio y aleatorio.

### 2.5 Zona horaria

`api/config.php` fija la zona horaria del proyecto y **sincroniza la sesión de
MySQL con la de PHP** (`SET time_zone`). Esto evita que los vencimientos de los
códigos se calculen en una zona y se comparen en otra. No hay que hacer nada
adicional, pero conviene mantener ambas en la misma zona en producción.

---

## 3. Cómo funciona

### 3.1 Inicio de sesión con dos pasos

1. El usuario ingresa usuario y contraseña en `login.html` (o el panel de
   administrador).
2. `api/login.php` valida las credenciales. Si son correctas:
   - genera un código de **6 dígitos** con `random_int`,
   - guarda **solo un HMAC-SHA256** del código (nunca el código en claro),
   - envía el código por correo,
   - responde `requiere_verificacion` **sin crear sesión**.
3. El navegador redirige a `html/verificacion.html`, que muestra el temporizador
   y el campo de 6 dígitos.
4. El usuario ingresa el código. `api/verificacion.php` lo valida y **recién
   ahí** crea la sesión definitiva (regenerando el ID de sesión) y redirige
   según el rol.

Si el correo no se puede enviar, el paso 2 devuelve un error y **el acceso no
se concede**.

### 3.2 «Mi cuenta» (tercera pestaña de `mis-turnos.html`)

- **Ver información personal**: siempre disponible tras iniciar sesión.
- **Modificar datos**: teléfono, nacimiento, nombre y apellido requieren un
  código de verificación enviado al correo.
- **Cambiar el correo**: exige **dos** pasos:
  1. código enviado al correo **actual** (para probar que es el dueño),
  2. código enviado al correo **nuevo** (para probar que lo controla).
  El cambio se aplica recién después del segundo código, y se envía una
  notificación a la dirección anterior por seguridad.

### 3.3 Reglas de seguridad implementadas

- Código de 6 dígitos generado con `random_int` (criptográficamente seguro).
- Validez de **5 minutos**, **un solo uso**, máximo **5 intentos**.
- **Un solo desafío activo** por usuario y tipo: crear uno nuevo cancela el anterior.
- Reenvío con espera de **60 segundos** y máximo **5 reenvíos**.
- Límites por usuario (**10/hora**) e IP (**20/hora**).
- Bloqueo por intentos fallidos de login (**10 en 15 minutos** por IP).
- Solo se persiste un **HMAC-SHA256** del código, ligado al usuario y al tipo,
  con clave del servidor. Comparación con `hash_equals` (tiempo constante).
- El código **nunca** se devuelve por API, ni se registra en logs ni se muestra
  en el navegador.
- Los cambios pendientes se guardan en el servidor (`datos_pendientes`), de modo
  que el navegador no puede alterarlos después de emitirse el código.
- Consultas preparadas en todas las consultas a la base de datos.
- Cookies de sesión `HttpOnly`, `SameSite=Lax` y `Secure` cuando el sitio corre
  por HTTPS.
- Protección CSRF en las operaciones sensibles.
- Los endpoints PHP directos no exponen errores técnicos al usuario.

---

## 4. Archivos agregados o modificados

### Nuevos

| Archivo | Función |
|---|---|
| `db/migration_2026_verificacion_2fa.sql` | Migración de las tablas nuevas |
| `api/verificacion_lib.php` | Núcleo: crear, validar, reenviar, límites |
| `api/verificacion.php` | API del segundo paso del login |
| `api/mi-cuenta.php` | API de datos personales y cambio de correo |
| `api/mail.php` | PHPMailer y las plantillas de correo |
| `html/verificacion.html` | Pantalla de verificación |
| `css/verificacion.css` | Estilos de la pantalla de verificación |
| `js/verificacion.js` | Temporizador, reenvío y envío del código |
| `css/mi-cuenta.css` | Estilos de la pestaña «Mi cuenta» |
| `js/mi-cuenta.js` | Edición, verificación y flujo de cambio de correo |
| `.env.example` | Plantilla de configuración |
| `.gitignore` | Excluye `.env` y `/vendor` |

### Modificados

| Archivo | Cambio |
|---|---|
| `api/config.php` | Carga de `.env`, constantes 2FA/SMTP, endurecimiento de cookies, sincronía de zona horaria con MySQL |
| `api/login.php` | Paso 1 con 2FA: ya no crea sesión directamente |
| `js/login.js` | Redirige a `verificacion.html` cuando corresponde |
| `js/admin-login.js` | Ídem para el ingreso de administradores |
| `html/mis-turnos.html` | Pestaña «Mi cuenta» |
| `js/mis-turnos.js` | Apertura de pestaña por hash (`#tabCuenta`) |
| `js/sesion.js` | Enlace «Mi cuenta» en el menú de sesión |
| `composer.json` / `composer.lock` | PHPMailer |

---

## 5. Verificación de la instalación

Una vez configurado todo, comprobar en este orden:

1. **Migración**: en phpMyAdmin deben existir las tablas `verificaciones` y
   `verificaciones_rate`.
2. **SMTP**: iniciar sesión con credenciales correctas debe llegar el correo y
   mostrar la pantalla «Verificá tu identidad».
3. **Código**: ingresar el código recibido debe dejar entrar y abrir la sesión.
4. **Reenvío**: esperar menos de 60 s debe mostrar el mensaje de espera; pasado
   ese tiempo debe llegar un código nuevo.
5. **Vencimiento**: esperar más de 5 minutos debe rechazar el código.
6. **Mi cuenta**: modificar un dato debe pedir código; cambiar el correo debe
   pedir dos códigos (actual y nuevo) y notificar a la dirección anterior.

---

## 6. Consideraciones para producción

- Servidor web con **HTTPS** (para que la cookie de sesión sea `Secure`).
- `SENDEROS_HMAC_SECRET` con valor propio, largo y aleatorio.
- Credenciales SMTP de una cuenta dedicada, no personal.
- `.env` con permisos de lectura solo para el usuario del servidor.
- Revisión periódica de la tabla `verificaciones_rate` (el propio sistema
  limpia registros de más de 24 h de forma automática).
