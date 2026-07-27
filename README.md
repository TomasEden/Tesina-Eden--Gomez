<div align="center">

<img src="Senderos/img/icons/logo.png" alt="Senderos" width="86" />

# Senderos

### Sistema web de reservas, ventas y gestión para spa

<p>
  <img src="https://img.shields.io/badge/Estado-En%20desarrollo-AD717E?style=for-the-badge&labelColor=39311D" alt="Estado del proyecto" />
  <img src="https://img.shields.io/badge/Versi%C3%B3n-1.1-D3A1A9?style=for-the-badge&labelColor=39311D" alt="Versión" />
  <img src="https://img.shields.io/badge/Plataforma-Web-45634D?style=for-the-badge&labelColor=39311D" alt="Plataforma" />
</p>

<p>
  <strong>Reservas, catálogo, carrito y administración interna en una experiencia digital serena, clara y responsive.</strong>
</p>

</div>

<br />

<div align="center">

| Color | Uso en la interfaz | Hex |
|---|---|---|
| <img src="https://placehold.co/18x18/AD717E/AD717E.png" alt="#AD717E" /> | Acciones principales | `#AD717E` |
| <img src="https://placehold.co/18x18/D3A1A9/D3A1A9.png" alt="#D3A1A9" /> | Acentos suaves | `#D3A1A9` |
| <img src="https://placehold.co/18x18/FAF7F5/FAF7F5.png" alt="#FAF7F5" /> | Fondos claros | `#FAF7F5` |
| <img src="https://placehold.co/18x18/45634D/45634D.png" alt="#45634D" /> | Textos y contraste natural | `#45634D` |
| <img src="https://placehold.co/18x18/39311D/39311D.png" alt="#39311D" /> | Contraste elegante | `#39311D` |

</div>

---

## Descripción general

**Senderos** es una aplicación web orientada a digitalizar la operación de un spa. El sistema reúne reservas de turnos, visualización de servicios, catálogo de productos, carrito, seguimiento de citas y administración interna en una misma plataforma.

La versión actual documentada es **1.1**. Esta actualización corresponde a una mejora de documentación y presentación del proyecto: no cambia el alcance funcional del sistema, pero sí ordena la información para reflejar mejor los módulos existentes y el propósito general de Senderos.

---

## Propósito del proyecto

La gestión tradicional de un spa puede generar conflictos de horarios, pérdida de información, baja visibilidad de servicios y dificultad para administrar productos o pedidos. Este proyecto propone una solución organizada para:

- Centralizar reservas, servicios, productos y pedidos en un mismo entorno.
- Reducir errores de agenda y mejorar el seguimiento de citas.
- Facilitar la administración de productos, ofertas, clientes, turnos y pedidos.
- Brindar una interfaz visualmente coherente con la identidad del spa.
- Optimizar la experiencia en dispositivos móviles y de escritorio.
- Mejorar la comunicación con clientes mediante confirmaciones y canales directos.

---

## Versión actual

| Versión | Tipo de actualización | Alcance |
|---|---|---|
| **1.1** | Documentación y presentación | README actualizado, información más precisa, propósito ajustado y estructura profesional. |

**Criterio de versión:** se considera **1.1** porque la actualización mejora la documentación del proyecto y reorganiza su presentación, pero no incorpora cambios funcionales en el código de la aplicación. La versión funcional base del sistema se mantiene dentro del alcance académico actual.

---

## Funcionalidades principales

<table>
  <tr>
    <td><strong>Reservas online</strong></td>
    <td>Selección de servicio, fecha y horario para coordinar turnos de manera ordenada.</td>
  </tr>
  <tr>
    <td><strong>Catálogo de productos</strong></td>
    <td>Visualización de productos de belleza con detalle, búsqueda y navegación por secciones.</td>
  </tr>
  <tr>
    <td><strong>Carrito</strong></td>
    <td>Gestión de productos y servicios seleccionados antes de confirmar la operación.</td>
  </tr>
  <tr>
    <td><strong>Confirmación por WhatsApp</strong></td>
    <td>Canal directo para reforzar la comunicación con el cliente.</td>
  </tr>
  <tr>
    <td><strong>Panel administrativo</strong></td>
    <td>Administración de servicios, productos, ofertas, clientes, pedidos y turnos.</td>
  </tr>
  <tr>
    <td><strong>Autenticación</strong></td>
    <td>Registro, inicio de sesión, cierre de sesión y control de sesión de usuarios.</td>
  </tr>
</table>

---

## Roles del sistema

| Rol | Alcance |
|---|---|
| **Cliente** | Explora servicios, consulta productos, reserva turnos, utiliza el carrito y revisa sus solicitudes. |
| **Personal** | Acompaña la disponibilidad de servicios, la atención de reservas y la organización operativa. |
| **Administrador** | Gestiona productos, servicios, ofertas, pedidos, clientes, turnos y la información general del negocio. |

---

## Módulos incluidos

### Sitio público

- Página de inicio con presentación institucional.
- Sección de servicios.
- Sistema de turnos.
- Catálogo de productos.
- Buscador.
- Carrito.
- Página de confirmación.
- Información sobre el spa.
- Políticas y páginas de soporte visual.

### Área de usuario

- Registro de cuenta.
- Inicio de sesión.
- Historial y seguimiento de turnos.
- Gestión de sesión.

### Área administrativa

- Dashboard principal.
- Administración de productos.
- Administración de servicios.
- Administración de turnos.
- Administración de clientes.
- Administración de pedidos.
- Administración de ofertas.

---

## Requisitos funcionales

- Registro e inicio de sesión de usuarios.
- Visualización de servicios disponibles.
- Reserva de turnos con fecha y horario.
- Selección de servicios como masajes, jacuzzi y tratamientos faciales.
- Confirmación de reservas mediante WhatsApp.
- Catálogo de productos de belleza.
- Alta, lectura, actualización y eliminación de productos desde administración.
- Gestión interna de turnos.
- Modificación y cancelación de reservas.
- Seguimiento de turnos por usuario.
- Dashboard con información general para administración.
- Gestión de ofertas, pedidos, clientes y reseñas desde módulos dedicados.

---

## Requisitos no funcionales

- Tiempo de carga optimizado para una experiencia ágil.
- Diseño responsive para móvil, tablet y escritorio.
- Interfaz limpia, consistente y fácil de usar.
- Manejo seguro de datos de usuarios.
- Soporte para múltiples usuarios.
- Disponibilidad permanente del sitio según el entorno de despliegue.
- Paleta visual coherente con la identidad de Senderos.
- Organización modular de estilos, vistas, scripts y endpoints para facilitar mantenimiento.

---

## Modelo de datos principal

| Entidad | Campos principales |
|---|---|
| **Usuario** | Nombre completo, teléfono, correo electrónico, contraseña y fecha de nacimiento. |
| **Turno** | Identificador, cliente, servicio seleccionado, fecha, horario y estado. |
| **Servicio** | Nombre, descripción, duración y precio. |
| **Producto** | Nombre, descripción, precio, imagen, stock y categoría. |
| **Pedido** | Usuario, productos seleccionados, total, estado y datos de confirmación. |

---

## Tecnologías utilizadas

| Capa | Tecnologías |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript |
| **Backend** | PHP |
| **Base de datos** | MySQL mediante PDO |
| **Diseño responsive** | CSS modular por vista |
| **Comunicación** | Integración con WhatsApp para confirmaciones |
| **Organización** | Separación por carpetas `api`, `css`, `html`, `img` y `js` |

---

## Estructura del proyecto

```text
Tesina-Eden--Gomez/
├── README.md
└── Senderos/
    ├── api/        # Endpoints PHP y conexión a base de datos
    ├── css/        # Estilos por pantalla y modo oscuro
    ├── html/       # Vistas públicas, usuario y administración
    ├── img/        # Imágenes, íconos y recursos visuales
    └── js/         # Lógica de interacción del cliente
```

---

## Experiencia de interfaz

La interfaz prioriza una estética cálida, natural y profesional. La paleta combina tonos rosados suaves, fondos crema y verdes orgánicos para reforzar la identidad del spa sin sobrecargar la lectura.

**Pantallas principales:**

- Inicio / landing page.
- Servicios.
- Turnos.
- Productos.
- Carrito.
- Mis turnos.
- Login y registro.
- Dashboard administrativo.

---

## Instalación local

> Los valores pueden ajustarse según el entorno local utilizado para ejecutar PHP y MySQL.

1. Clonar el repositorio.
2. Ubicar el proyecto dentro del directorio del servidor local.
3. Crear una base de datos MySQL llamada `senderos_db`.
4. Revisar la configuración de conexión en `Senderos/api/config.php`.
5. Iniciar Apache/PHP y MySQL.
6. Abrir la vista principal desde el navegador:

```text
Senderos/html/index.html
```

---

## Configuración de base de datos

La conexión principal utiliza los siguientes parámetros por defecto:

| Parámetro | Valor |
|---|---|
| Host | `localhost` |
| Usuario | `root` |
| Contraseña | Vacía |
| Base de datos | `senderos_db` |
| Puerto | `3307` |
| Charset | `utf8mb4` |

---

## Mejoras futuras

- Integración de pagos online.
- Estadísticas avanzadas para administración.
- Sistema de reseñas y calificaciones.
- Notificaciones push o recordatorios automatizados.
- Recomendaciones de servicios basadas en preferencias del usuario.
- Gestión avanzada de stock.
- Exportación de reportes administrativos.

---

## Autores

| Nombre | Proyecto |
|---|---|
| **Tomás Edén** | Senderos |
| **Malena Gómez** | Senderos |

---

## Información académica

**Materia:** Desarrollo de Aplicaciones Móviles  
**Año:** 2026

---

<div align="center">

<sub>Senderos — eficiencia, calma y gestión digital para una experiencia de bienestar más simple.</sub>

</div>
