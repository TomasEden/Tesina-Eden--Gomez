/* =========================================================
   SENDEROS — ADMIN DASHBOARD
   Datos reales desde la API
   ========================================================= */

const API = {
  sesion: '../api/sesion.php',
  turnos: '../api/turnos.php',
  pedidos: '../api/pedidos.php?todos=1',
  productos: '../api/productos.php',
  clientes: '../api/clientes.php'
};


/* =========================================================
   ESTADO
   ========================================================= */

let datosDashboard = {
  turnos: [],
  pedidos: [],
  productos: [],
  clientes: []
};


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  async function () {

    setFecha();

    const autorizado =
      await verificarAdministrador();

    if (!autorizado) {
      return;
    }

    await cargarDashboard();

    /* El dashboard se actualiza solo cada 60 s y al volver
       a la pestaña, sin pasos extra. */
    setInterval(() => {
      if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) { cargarDashboard();
      }
    }, 60000);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) { cargarDashboard();
      }
    });

  }
);


/* =========================================================
   VERIFICAR SESIÓN REAL
   ========================================================= */

async function verificarAdministrador() {

  try {

    const response =
      await fetch(
        API.sesion,
        {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store'
        }
      );


    const data =
      await response.json();


    if (
      !data ||
      !data.ok ||
      !data.logueado ||
      !data.usuario ||
      data.usuario.rol !== 'admin'
    ) {

      window.location.href =
        'admin-login.html';

      return false;
    }


    /*
     * Mostrar nombre real del administrador
     * cuando exista.
     */

    const nombre =
      [
        data.usuario.nombre,
        data.usuario.apellido
      ]
        .filter(Boolean)
        .join(' ');


    const nombreElemento =
      document.querySelector(
        '.sidebar-user-name'
      );


    const rolElemento =
      document.querySelector(
        '.sidebar-user-role'
      );


    if (
      nombreElemento &&
      nombre
    ) {

      nombreElemento.textContent =
        nombre;

    }


    if (rolElemento) {

      rolElemento.textContent =
        'Administrador';

    }


    return true;

  } catch (error) {

    /* log removido en limpieza final */;


    window.location.href =
      'admin-login.html';


    return false;

  }

}


/* =========================================================
   FECHA DEL DASHBOARD
   ========================================================= */

function setFecha() {

  const elemento =
    document.getElementById(
      'topbarDate'
    );


  if (!elemento) {
    return;
  }


  elemento.textContent =
    new Date().toLocaleDateString(
      'es-AR',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );

}


/* =========================================================
   CARGAR DATOS
   ========================================================= */

async function cargarDashboard() {

  mostrarEstadoCarga();


  try {

    const [
      turnos,
      pedidos,
      productos,
      clientes
    ] = await Promise.all([

      obtenerAPI(
        API.turnos
      ),

      obtenerAPI(
        API.pedidos
      ),

      obtenerAPI(
        API.productos
      ),

      obtenerAPI(
        API.clientes
      )

    ]);


    datosDashboard.turnos =
      Array.isArray(turnos?.turnos)
        ? turnos.turnos
        : [];


    datosDashboard.pedidos =
      Array.isArray(pedidos?.pedidos)
        ? pedidos.pedidos
        : [];


    datosDashboard.productos =
      Array.isArray(productos?.productos)
        ? productos.productos
        : [];


    datosDashboard.clientes =
      Array.isArray(clientes?.clientes)
        ? clientes.clientes
        : [];


    renderStats();

    renderTurnosRecientes();

    renderTopServicios();

    renderActividadReciente();


  } catch (error) {

    /* log removido en limpieza final */;


    mostrarErrorDashboard(
      'No se pudieron cargar los datos del panel. Verificá la conexión con la API.'
    );

  }

}


/* =========================================================
   FETCH GENERAL
   ========================================================= */

async function obtenerAPI(
  url
) {

  const response =
    await fetch(
      url,
      {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Accept':
            'application/json'
        }
      }
    );


  let data = null;


  try {

    data =
      await response.json();

  } catch (error) {

    throw new Error(
      `La API no devolvió JSON válido: ${url}`
    );

  }


  if (!response.ok) {

    throw new Error(
      data?.error ||
      `Error HTTP ${response.status}`
    );

  }


  if (
    data &&
    data.ok === false
  ) {

    throw new Error(
      data.error ||
      'La API devolvió un error.'
    );

  }


  return data;

}


/* =========================================================
   ESTADO DE CARGA
   ========================================================= */

function mostrarEstadoCarga() {

  const grid =
    document.getElementById(
      'statsGrid'
    );


  if (grid) {

    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-num">…</div>
        <div class="stat-card-label">Cargando datos</div>
      </div>
    `;

  }


  const turnos =
    document.getElementById(
      'turnosRecientes'
    );


  if (turnos) {

    turnos.innerHTML = `
      <tr>
        <td
          colspan="4"
          class="td-light"
        >
          Cargando turnos...
        </td>
      </tr>
    `;

  }


  const servicios =
    document.getElementById(
      'topServicios'
    );


  if (servicios) {

    servicios.innerHTML = `
      <div class="top-servicio-item">
        <span class="top-servicio-name">
          Cargando información...
        </span>
      </div>
    `;

  }

}


/* =========================================================
   ERROR DEL DASHBOARD
   ========================================================= */

function mostrarErrorDashboard(
  mensaje
) {

  const grid =
    document.getElementById(
      'statsGrid'
    );


  if (grid) {

    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-num">!</div>
        <div class="stat-card-label">
          ${escapeHTML(mensaje)}
        </div>
      </div>
    `;

  }


  const turnos =
    document.getElementById(
      'turnosRecientes'
    );


  if (turnos) {

    turnos.innerHTML = `
      <tr>
        <td
          colspan="4"
          class="td-light"
        >
          ${escapeHTML(mensaje)}
        </td>
      </tr>
    `;

  }


  const servicios =
    document.getElementById(
      'topServicios'
    );


  if (servicios) {

    servicios.innerHTML = `
      <div class="top-servicio-item">
        <span class="top-servicio-name">
          ${escapeHTML(mensaje)}
        </span>
      </div>
    `;

  }

}


/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function renderStats() {

  const turnos =
    datosDashboard.turnos;


  const pedidos =
    datosDashboard.pedidos;


  const productos =
    datosDashboard.productos;


  /*
   * Turnos pendientes.
   */

  const pendientes =
    turnos.filter(
      turno =>
        String(
          turno.estado || ''
        ).toLowerCase() ===
        'pendiente'
    ).length;


  /*
   * Turnos confirmados.
   */

  const confirmados =
    turnos.filter(
      turno =>
        String(
          turno.estado || ''
        ).toLowerCase() ===
        'confirmado'
    );


  /*
   * Ingresos de turnos confirmados.
   */

  const ingresosTurnos =
    confirmados.reduce(
      (
        total,
        turno
      ) => {

        return total +
          numero(
            turno.precio_total
          );

      },
      0
    );


  /*
   * Ingresos de pedidos.
   *
   * Se toman los pedidos existentes
   * en la base de datos.
   */

  const ingresosPedidos =
    pedidos.reduce(
      (
        total,
        pedido
      ) => {

        return total +
          numero(
            pedido.total
          );

      },
      0
    );


  const totalIngresos =
    ingresosTurnos +
    ingresosPedidos;


  /*
   * Productos sin stock.
   *
   * La API utiliza stock_cantidad.
   */

  const sinStock =
    productos.filter(
      producto =>
        numero(
          producto.stock_cantidad
        ) <= 0
    ).length;


  const stats = [

    {
      icon: `
        <img
          src="../img/icons/calendario.svg"
          alt=""
          width="13"
          height="13"
        >
      `,
      label:
        'Turnos totales',
      value:
        turnos.length,
      trend:
        `${pendientes} pendientes`,
      color:
        'rose'
    },


    {
      icon: `
        <img
          src="../img/icons/tarjeta.svg"
          alt=""
          width="15"
          height="15"
        >
      `,
      label:
        'Ingresos estimados',
      value:
        formatearPrecio(
          totalIngresos
        ),
      trend:
        `${confirmados.length} confirmados`,
      color:
        'green'
    },


    {
      icon: `
        <img
          src="../img/icons/bolsa.svg"
          alt=""
          width="15"
          height="15"
        >
      `,
      label:
        'Productos activos',
      value:
        productos.length,
      trend:
        sinStock > 0
          ? `${sinStock} sin stock`
          : 'Todo en stock',
      color:
        'orange'
    },


    {
      icon: `
        <img
          src="../img/icons/caja.svg"
          alt=""
          width="15"
          height="15"
        >
      `,
      label:
        'Pedidos recibidos',
      value:
        pedidos.length,
      trend:
        'Historial',
      color:
        'blue'
    }

  ];


  const grid =
    document.getElementById(
      'statsGrid'
    );


  if (!grid) {
    return;
  }


  grid.innerHTML =
    stats.map(
      stat => `
        <div class="stat-card">

          <div class="stat-card-header">

            <div
              class="stat-card-icon ${stat.color}"
            >
              ${stat.icon}
            </div>

            <span class="stat-trend up">
              ${escapeHTML(stat.trend)}
            </span>

          </div>


          <div class="stat-card-num">
            ${escapeHTML(
              String(stat.value)
            )}
          </div>


          <div class="stat-card-label">
            ${escapeHTML(stat.label)}
          </div>

        </div>
      `
    ).join('');

}


/* =========================================================
   TURNOS RECIENTES
   ========================================================= */

function renderTurnosRecientes() {

  const tbody =
    document.getElementById(
      'turnosRecientes'
    );


  if (!tbody) {
    return;
  }


  /*
   * La API ya devuelve los turnos
   * ordenados por fecha y horario.
   *
   * Tomamos los próximos/seis primeros.
   */

  const turnos =
    [...datosDashboard.turnos]
      .sort(
        ordenarTurnos
      )
      .slice(
        0,
        6
      );


  if (turnos.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="4"
          class="td-light"
        >
          No hay turnos registrados.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    turnos.map(
      turno => {

        const cliente =
          turno.cliente ||
          obtenerNombreCliente(
            turno
          ) ||
          'Cliente';


        const servicio =
          obtenerNombreServicio(
            turno
          );


        const fecha =
          formatearFecha(
            turno.fecha
          );


        const horario =
          turno.horario
            ? ` · ${escapeHTML(
                String(
                  turno.horario
                ).slice(0, 5)
              )}`
            : '';


        const estado =
          turno.estado ||
          'pendiente';


        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(
                  String(
                    cliente
                  )
                )}
              </strong>
            </td>


            <td>
              ${escapeHTML(
                String(
                  servicio
                )
              )}
            </td>


            <td class="td-light">
              ${escapeHTML(
                fecha
              )}${horario}
            </td>


            <td>
              <span
                class="badge badge-${escapeHTML(
                  String(
                    estado
                  )
                    .toLowerCase()
                    .replace(
                      /\s+/g,
                      '-'
                    )
                )}"
              >
                ${escapeHTML(
                  String(
                    estado
                  )
                )}
              </span>
            </td>

          </tr>
        `;

      }
    ).join('');

}


/* =========================================================
   SERVICIOS MÁS RESERVADOS
   ========================================================= */

function renderTopServicios() {

  const container =
    document.getElementById(
      'topServicios'
    );


  if (!container) {
    return;
  }


  const conteo = {};


  datosDashboard.turnos
    .forEach(
      turno => {

        const servicios =
          extraerServicios(
            turno
          );


        servicios.forEach(
          servicio => {

            const nombre =
              obtenerNombreDesdeServicio(
                servicio
              );


            if (!nombre) {
              return;
            }


            conteo[nombre] =
              (
                conteo[nombre] ||
                0
              ) + 1;

          }
        );

      }
    );


  const top =
    Object.entries(
      conteo
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] - a[1]
      )
      .slice(
        0,
        4
      );


  container.innerHTML =
    '';


  if (top.length === 0) {

    container.innerHTML = `
      <div class="top-servicio-item">
        <span class="top-servicio-name">
          Todavía no hay reservas.
        </span>
      </div>
    `;

    return;
  }


  top.forEach(
    (
      [
        nombre,
        cantidad
      ],
      indice
    ) => {

      container.innerHTML += `
        <div class="top-servicio-item">

          <span class="top-rank">
            ${indice + 1}
          </span>

          <span class="top-servicio-name">
            ${escapeHTML(
              nombre
            )}
          </span>

          <span class="top-servicio-count">
            ${cantidad}
            ${cantidad === 1
              ? 'reserva'
              : 'reservas'}
          </span>

        </div>
      `;

    }
  );

}


/* =========================================================
   ACTIVIDAD RECIENTE — PEDIDOS
   ========================================================= */

function renderActividadReciente() {

  const container =
    document.getElementById(
      'topServicios'
    );


  if (!container) {
    return;
  }


  const pedidos =
    [...datosDashboard.pedidos]
      .sort(
        (
          a,
          b
        ) =>
          obtenerFechaTimestamp(
            b.creado_en ||
            b.fecha
          ) -
          obtenerFechaTimestamp(
            a.creado_en ||
            a.fecha
          )
      )
      .slice(
        0,
        3
      );


  if (pedidos.length === 0) {
    return;
  }


  container.innerHTML += `
    <div
      style="
        padding:0.8rem 1.8rem 0;
        border-top:1px solid var(--cream);
        margin-top:0.5rem
      "
    >

      <p
        style="
          font-size:0.7rem;
          letter-spacing:0.1em;
          text-transform:uppercase;
          color:var(--text-light);
          font-weight:500
        "
      >
        Pedidos recientes
      </p>

    </div>
  `;


  pedidos.forEach(
    pedido => {

      const fecha =
        formatearFechaCorta(
          pedido.creado_en ||
          pedido.fecha
        );


      const cliente =
        pedido.cliente ||
        'Cliente';


      container.innerHTML += `
        <div class="top-servicio-item">

          <span class="top-rank">

            <img
              src="../img/icons/bolsa.svg"
              alt=""
              width="15"
              height="15"
            >

          </span>


          <span class="top-servicio-name">

            ${escapeHTML(
              String(
                cliente
              )
            )}

            ·

            ${escapeHTML(
              fecha
            )}

          </span>


          <span class="top-servicio-count">

            ${escapeHTML(
              formatearPrecio(
                numero(
                  pedido.total
                )
              )
            )}

          </span>

        </div>
      `;

    }
  );

}


/* =========================================================
   SERVICIOS DE UN TURNO
   ========================================================= */

function extraerServicios(
  turno
) {

  if (!turno) {
    return [];
  }


  let servicios =
    turno.servicios;


  if (
    typeof servicios ===
    'string'
  ) {

    try {

      servicios =
        JSON.parse(
          servicios
        );

    } catch (error) {

      servicios = [];

    }

  }


  if (
    Array.isArray(
      servicios
    )
  ) {

    return servicios;

  }


  if (
    servicios &&
    typeof servicios ===
    'object'
  ) {

    return [
      servicios
    ];

  }


  /*
   * Compatibilidad con datos antiguos
   * donde el servicio podía estar
   * directamente en turno.servicio.
   */

  if (
    turno.servicio
  ) {

    return [
      {
        nombre:
          turno.servicio
      }
    ];

  }


  return [];

}


/* =========================================================
   NOMBRE DEL SERVICIO
   ========================================================= */

function obtenerNombreServicio(
  turno
) {

  const servicios =
    extraerServicios(
      turno
    );


  if (
    servicios.length === 0
  ) {

    return (
      turno.servicio ||
      'Servicio'
    );

  }


  const nombres =
    servicios
      .map(
        obtenerNombreDesdeServicio
      )
      .filter(Boolean);


  return nombres.length
    ? nombres.join(
        ', '
      )
    : 'Servicio';

}


function obtenerNombreDesdeServicio(
  servicio
) {

  if (!servicio) {
    return '';
  }


  if (
    typeof servicio ===
    'string'
  ) {

    return servicio.trim();

  }


  return (
    servicio.nombre ||
    servicio.titulo ||
    servicio.servicio ||
    ''
  ).toString().trim();

}


/* =========================================================
   CLIENTE
   ========================================================= */

function obtenerNombreCliente(
  turno
) {

  if (!turno) {
    return '';
  }


  if (
    turno.cliente
  ) {

    return turno.cliente;

  }


  if (
    turno.nombre
  ) {

    return turno.nombre;

  }


  /*
   * Si el endpoint devuelve usuario_id
   * no inventamos el nombre.
   *
   * Buscamos coincidencia en la lista
   * real de clientes cargada desde API.
   */

  if (
    turno.usuario_id
  ) {

    const cliente =
      datosDashboard.clientes.find(
        item =>
          String(
            item.id
          ) ===
          String(
            turno.usuario_id
          )
      );


    if (cliente) {

      return [
        cliente.nombre,
        cliente.apellido
      ]
        .filter(Boolean)
        .join(' ');

    }

  }


  return '';

}


/* =========================================================
   ORDENAR TURNOS
   ========================================================= */

function ordenarTurnos(
  a,
  b
) {

  const fechaA =
    obtenerFechaTimestamp(
      `${a.fecha || ''} ${a.horario || ''}`
    );


  const fechaB =
    obtenerFechaTimestamp(
      `${b.fecha || ''} ${b.horario || ''}`
    );


  return fechaA - fechaB;

}


/* =========================================================
   FECHAS
   ========================================================= */

function obtenerFechaTimestamp(
  valor
) {

  if (!valor) {
    return 0;
  }


  const timestamp =
    new Date(
      valor
    ).getTime();


  return Number.isNaN(
    timestamp
  )
    ? 0
    : timestamp;

}


function formatearFecha(
  fecha
) {

  if (!fecha) {
    return '—';
  }


  /*
   * Evitamos problemas de zona horaria
   * cuando la API devuelve YYYY-MM-DD.
   */

  const texto =
    String(
      fecha
    );


  const match =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );


  if (match) {

    const [
      ,
      anio,
      mes,
      dia
    ] = match;


    return `${dia}/${mes}/${anio}`;

  }


  const date =
    new Date(
      fecha
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return texto;

  }


  return date.toLocaleDateString(
    'es-AR'
  );

}


function formatearFechaCorta(
  fecha
) {

  if (!fecha) {
    return '—';
  }


  const date =
    new Date(
      fecha
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(
      fecha
    );

  }


  return date.toLocaleDateString(
    'es-AR',
    {
      day: 'numeric',
      month: 'short'
    }
  );

}


/* =========================================================
   NÚMEROS / PRECIOS
   ========================================================= */

function numero(
  valor
) {

  if (
    valor ===
    null ||
    valor ===
    undefined ||
    valor ===
    ''
  ) {

    return 0;

  }


  const n =
    Number(
      String(
        valor
      ).replace(
        ',',
        '.'
      )
    );


  return Number.isFinite(
    n
  )
    ? n
    : 0;

}


function formatearPrecio(
  valor
) {

  return '$' +
    numero(
      valor
    ).toLocaleString(
      'es-AR',
      {
        minimumFractionDigits:
          0,
        maximumFractionDigits:
          2
      }
    );

}


/* =========================================================
   SEGURIDAD HTML
   ========================================================= */

function escapeHTML(
  valor
) {

  return String(
    valor ??
    ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

async function cerrarSesion() {

  try {

    await fetch(
      '../api/logout.php',
      {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store'
      }
    );

  } catch (error) {

    /* log removido en limpieza final */;

  }


  /*
   * Ya no se utiliza:
   *
   * sessionStorage.removeItem('adminSesion')
   *
   * La sesión se destruye en PHP.
   */

  window.location.href =
    'admin-login.html';

}