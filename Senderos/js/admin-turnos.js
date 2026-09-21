/* =========================================================
   SENDEROS — ADMIN TURNOS
   Gestión real de turnos desde la API
   ========================================================= */

const API_TURNOS = '../api/turnos.php';
const API_SESION = '../api/sesion.php';

let turnos = [];
let turnoActivo = null;
let eliminarId = null;


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {

  const fecha = document.getElementById('topbarDate');

  if (fecha) {
    fecha.textContent =
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


  const autorizado =
    await verificarAdministrador();

  if (!autorizado) {
    return;
  }


  await cargarTurnos();

  /* Los turnos nuevos aparecen solos: se recarga cada 30 s
     y al volver a la pestaña. */
  setInterval(() => {
    if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) { cargarTurnos();
    }
  }, 30000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) { cargarTurnos();
    }
  });

});


/* =========================================================
   VERIFICAR ADMIN
   ========================================================= */

async function verificarAdministrador() {

  try {

    const response =
      await fetch(
        API_SESION,
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
   CARGAR TURNOS
   ========================================================= */

async function cargarTurnos() {

  try {

    const response =
      await fetch(
        `${API_TURNOS}?todos=1`,
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


    const data =
      await response.json();


    if (
      !response.ok ||
      !data ||
      !data.ok
    ) {

      throw new Error(
        data?.error ||
        'No se pudieron cargar los turnos.'
      );

    }


    turnos =
      Array.isArray(
        data.turnos
      )
        ? data.turnos.map(
            normalizarTurno
          )
        : [];


    renderStats();

    filtrar();


  } catch (error) {

    /* log removido en limpieza final */;


    turnos = [];

    renderStats();

    renderTabla([]);


    showToast(
      'No se pudieron cargar los turnos desde la base de datos.'
    );

  }

}


/* =========================================================
   NORMALIZAR TURNO
   ========================================================= */

function normalizarTurno(
  turno
) {

  return {

    id:
      Number(
        turno.id
      ),

    cliente:
      turno.cliente ||
      [
        turno.nombre,
        turno.apellido
      ]
        .filter(Boolean)
        .join(' ') ||
      'Cliente web',

    servicio:
      obtenerServiciosTexto(
        turno
      ),

    servicios:
      turno.servicios,

    fecha:
      turno.fecha ||
      '',

    horario:
      String(
        turno.horario ||
        ''
      ).slice(
        0,
        5
      ),

    precio:
      Number(
        turno.precio_total ||
        0
      ),

    estado:
      turno.estado ||
      'pendiente',

    telefono:
      turno.telefono ||
      '',

    usuario_id:
      turno.usuario_id ||
      null

  };

}


/* =========================================================
   SERVICIOS
   ========================================================= */

function obtenerServicios(
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


  return [];

}


function obtenerNombreServicio(
  servicio
) {

  if (!servicio) {
    return '';
  }


  if (
    typeof servicio ===
    'string'
  ) {

    return servicio;

  }


  return (
    servicio.nombre ||
    servicio.titulo ||
    servicio.servicio ||
    ''
  ).toString();

}


function obtenerServiciosTexto(
  turno
) {

  const servicios =
    obtenerServicios(
      turno
    );


  if (
    servicios.length
  ) {

    const nombres =
      servicios
        .map(
          obtenerNombreServicio
        )
        .filter(Boolean);


    if (
      nombres.length
    ) {

      return nombres.join(
        ', '
      );

    }

  }


  if (
    turno.servicio
  ) {

    return String(
      turno.servicio
    );

  }


  return 'Servicio';

}


/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function renderStats() {

  const total =
    turnos.length;


  const pendientes =
    turnos.filter(
      t =>
        normalizarEstado(
          t.estado
        ) ===
        'pendiente'
    ).length;


  const confirmados =
    turnos.filter(
      t =>
        normalizarEstado(
          t.estado
        ) ===
        'confirmado'
    ).length;


  const cancelados =
    turnos.filter(
      t =>
        normalizarEstado(
          t.estado
        ) ===
        'cancelado'
    ).length;


  const stats = [

    {
      icon: `
        <img
          src="../img/icons/formulario.svg"
          alt=""
          width="15"
          height="15"
        >
      `,
      label:
        'Total turnos',
      value:
        total,
      color:
        'rose'
    },

    {
      icon: `
        <img
          src="../img/icons/tiempo.svg"
          alt=""
          width="13"
          height="13"
        >
      `,
      label:
        'Pendientes',
      value:
        pendientes,
      color:
        'orange'
    },

    {
      icon: `
        <img
          src="../img/icons/check.svg"
          alt=""
          width="13"
          height="13"
        >
      `,
      label:
        'Confirmados',
      value:
        confirmados,
      color:
        'green'
    },

    {
      icon: `
        <img
          src="../img/icons/x.svg"
          alt=""
          width="13"
          height="13"
        >
      `,
      label:
        'Cancelados',
      value:
        cancelados,
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

          </div>

          <div class="stat-card-num">
            ${escapeHTML(
              stat.value
            )}
          </div>

          <div class="stat-card-label">
            ${escapeHTML(
              stat.label
            )}
          </div>

        </div>
      `
    ).join('');

}


/* =========================================================
   TABLA
   ========================================================= */

function renderTabla(
  lista
) {

  const tbody =
    document.getElementById(
      'turnosBody'
    );


  const empty =
    document.getElementById(
      'tableEmpty'
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML =
    '';


  if (
    !lista ||
    !lista.length
  ) {

    if (empty) {
      empty.classList.remove(
        'hidden'
      );
    }

    return;

  }


  if (empty) {
    empty.classList.add(
      'hidden'
    );
  }


  lista.forEach(
    turno => {

      const estado =
        normalizarEstado(
          turno.estado
        );


      const estadoTexto =
        formatearEstado(
          estado
        );


      tbody.innerHTML += `
        <tr>

          <td>

            <strong>
              ${escapeHTML(
                turno.cliente
              )}
            </strong>

          </td>


          <td>
            ${escapeHTML(
              turno.servicio
            )}
          </td>


          <td class="td-light">

            ${escapeHTML(
              formatearFecha(
                turno.fecha
              )
            )}

            ·

            ${escapeHTML(
              turno.horario ||
              '—'
            )}

          </td>


          <td>

            <span
              class="badge badge-${escapeHTML(
                estado
              )}"
            >
              ${escapeHTML(
                estadoTexto
              )}
            </span>

          </td>


          <td>

            <div
              style="
                display:flex;
                gap:0.4rem
              "
            >

              <button
                class="btn-icon"
                title="Cambiar estado"
                type="button"
                onclick="abrirModalEstado(${turno.id})"
              >

                <img
                  src="../img/icons/formulario.svg"
                  alt=""
                  width="13"
                  height="13"
                >

              </button>


              <button
                class="btn-icon danger"
                title="Cancelar turno"
                type="button"
                onclick="abrirModalEliminar(${turno.id})"
              >

                <img
                  src="../img/icons/basura.svg"
                  alt=""
                  width="15"
                  height="15"
                >

              </button>

            </div>

          </td>

        </tr>
      `;

    }
  );

}


/* =========================================================
   FILTROS
   ========================================================= */

function filtrar() {

  const input =
    document.getElementById(
      'searchInput'
    );


  const select =
    document.getElementById(
      'filterEstado'
    );


  const busqueda =
    input
      ? input.value
          .trim()
          .toLowerCase()
      : '';


  const estado =
    select
      ? select.value
      : 'todos';


  const resultado =
    turnos.filter(
      turno => {

        const texto =
          [
            turno.cliente,
            turno.servicio,
            turno.fecha,
            turno.horario
          ]
            .join(' ')
            .toLowerCase();


        const matchBusqueda =
          !busqueda ||
          texto.includes(
            busqueda
          );


        const matchEstado =
          estado ===
            'todos' ||
          normalizarEstado(
            turno.estado
          ) === estado;


        return (
          matchBusqueda &&
          matchEstado
        );

      }
    );


  renderTabla(
    resultado
  );

}


/* =========================================================
   MODAL ESTADO
   ========================================================= */

function abrirModalEstado(
  id
) {

  turnoActivo =
    turnos.find(
      turno =>
        turno.id ===
        Number(id)
    );


  if (!turnoActivo) {
    return;
  }


  const info =
    document.getElementById(
      'modalTurnoInfo'
    );


  if (info) {

    info.textContent =
      `${turnoActivo.cliente} — ${turnoActivo.servicio} — ${formatearFecha(turnoActivo.fecha)} ${turnoActivo.horario || ''}`;

  }


  const select =
    document.getElementById(
      'nuevoEstado'
    );


  if (select) {

    select.value =
      normalizarEstado(
        turnoActivo.estado
      );

  }


  const modal =
    document.getElementById(
      'modalEstado'
    );


  if (modal) {

    modal.classList.remove(
      'hidden'
    );

  }

}


/* =========================================================
   GUARDAR ESTADO
   ========================================================= */

async function guardarEstado() {

  if (!turnoActivo) {
    return;
  }


  const select =
    document.getElementById(
      'nuevoEstado'
    );


  const nuevoEstado =
    select
      ? select.value
      : 'pendiente';


  const estadoAnterior =
    normalizarEstado(
      turnoActivo.estado
    );


  try {

    const response =
      await fetch(
        API_TURNOS,
        {
          method: 'PUT',

          credentials:
            'same-origin',

          headers: {
            'Content-Type':
              'application/json',

            'Accept':
              'application/json'
          },

          body: JSON.stringify({

            id:
              turnoActivo.id,

            estado:
              nuevoEstado

          })
        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data ||
      !data.ok
    ) {

      throw new Error(
        data?.error ||
        'No se pudo actualizar el turno.'
      );

    }


    turnoActivo.estado =
      nuevoEstado;


    const index =
      turnos.findIndex(
        turno =>
          turno.id ===
          turnoActivo.id
      );


    if (index !== -1) {

      turnos[index] =
        {
          ...turnos[index],
          estado:
            nuevoEstado
        };

    }


    cerrarModal(
      'modalEstado'
    );


    renderStats();

    filtrar();


    showToast(
      'Estado actualizado correctamente.'
    );


    /*
     * Si se confirmó, ofrecemos
     * notificación por WhatsApp.
     */

    if (
      nuevoEstado ===
        'confirmado' &&
      estadoAnterior !==
        'confirmado'
    ) {

      ofrecerWhatsApp(
        turnoActivo
      );

    }

  } catch (error) {

    /* log removido en limpieza final */;


    showToast(
      error.message ||
      'No se pudo actualizar el turno.'
    );

  }

}


/* =========================================================
   WHATSAPP
   ========================================================= */

function ofrecerWhatsApp(
  turno
) {

  const telefono =
    String(
      turno.telefono ||
      ''
    )
      .replace(
        /\D/g,
        ''
      );


  if (!telefono) {
    return;
  }


  const fecha =
    formatearFecha(
      turno.fecha
    );


  const mensaje =
    `Hola! Tu turno de ${turno.servicio} del ${fecha} a las ${turno.horario || ''} hs está CONFIRMADO. ¡Te esperamos!`;


  const url =
    `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;


  /*
   * Si existe el modal personalizado
   * del proyecto, lo usamos.
   */

  if (
    typeof mostrarModalValidacion ===
    'function'
  ) {

    mostrarModalValidacion({

      icono:
        'whatsapp.svg',

      titulo:
        '¿Notificar al cliente?',

      mensaje:
        'El turno fue confirmado. Podés avisarle al cliente por WhatsApp.',

      botones: [

        {
          texto:
            'Sí, notificar',

          clase:
            'primary',

          accion:
            () => {

              window.open(
                url,
                '_blank',
                'noopener,noreferrer'
              );


              if (
                typeof cerrarModalValidacion ===
                'function'
              ) {

                cerrarModalValidacion();

              }

            }

        },

        {
          texto:
            'No, gracias',

          clase:
            'outline',

          accion:
            () => {

              if (
                typeof cerrarModalValidacion ===
                'function'
              ) {

                cerrarModalValidacion();

              }

            }

        }

      ]

    });


    return;

  }


  /*
   * Confirmación con modal propio (sin confirm del navegador).
   */

  if (
    typeof mostrarModalValidacion ===
    'function'
  ) {

    mostrarModalValidacion({

      titulo:
        'Turno confirmado',

      mensaje:
        'El turno fue confirmado. ¿Querés notificar al cliente por WhatsApp?',

      icono:
        'whatsapp.svg',

      botones: [

        {
          texto:
            'No, gracias',

          clase:
            'outline',

          accion:
            () => {

              if (
                typeof cerrarModalValidacion ===
                'function'
              ) {

                cerrarModalValidacion();

              }

            }

        },

        {
          texto:
            'Abrir WhatsApp',

          clase:
            'primary',

          accion:
            () => {

              window.open(
                url,
                '_blank',
                'noopener,noreferrer'
              );


              if (
                typeof cerrarModalValidacion ===
                'function'
              ) {

                cerrarModalValidacion();

              }

            }

        }

      ]

    });


    return;

  }

  /*
   * Fallback sin modal disponible: se avisa con toast
   * (nunca se usa confirm del navegador).
   */

  if (
    typeof showToast ===
    'function'
  ) {

    showToast(
      'El turno fue confirmado.'
    );

  }

}


/* =========================================================
   CANCELAR TURNO
   ========================================================= */

function abrirModalEliminar(
  id
) {

  eliminarId =
    Number(id);


  const modal =
    document.getElementById(
      'modalEliminar'
    );


  if (modal) {

    modal.classList.remove(
      'hidden'
    );

  }

}


async function confirmarEliminar() {

  if (!eliminarId) {
    return;
  }


  try {

    const response =
      await fetch(
        API_TURNOS,
        {
          method: 'PUT',

          credentials:
            'same-origin',

          headers: {
            'Content-Type':
              'application/json',

            'Accept':
              'application/json'
          },

          body: JSON.stringify({

            id:
              eliminarId,

            estado:
              'cancelado'

          })
        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data ||
      !data.ok
    ) {

      throw new Error(
        data?.error ||
        'No se pudo cancelar el turno.'
      );

    }


    turnos =
      turnos.map(
        turno =>
          turno.id ===
          eliminarId
            ? {
                ...turno,
                estado:
                  'cancelado'
              }
            : turno
      );


    cerrarModal(
      'modalEliminar'
    );


    renderStats();

    filtrar();


    showToast(
      'Turno cancelado correctamente.'
    );


    eliminarId =
      null;

  } catch (error) {

    /* log removido en limpieza final */;


    showToast(
      error.message ||
      'No se pudo cancelar el turno.'
    );

  }

}


/* =========================================================
   CERRAR MODAL
   ========================================================= */

function cerrarModal(
  id
) {

  const modal =
    document.getElementById(
      id
    );


  if (modal) {

    modal.classList.add(
      'hidden'
    );

  }

}


/* =========================================================
   TOAST — Fase G: compartido de admin-shell.js (sin duplicado).
   ========================================================= */


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

async function cerrarSesion() {

  try {

    await fetch(
      '../api/logout.php',
      {
        method: 'POST',
        credentials:
          'same-origin',
        cache:
          'no-store'
      }
    );

  } catch (error) {

    /* log removido en limpieza final */;

  }


  window.location.href =
    'admin-login.html';

}


/* =========================================================
   UTILIDADES
   ========================================================= */

function normalizarEstado(
  estado
) {

  return String(
    estado ||
    'pendiente'
  )
    .trim()
    .toLowerCase();

}


function formatearEstado(
  estado
) {

  const estados = {

    pendiente:
      'Pendiente',

    confirmado:
      'Confirmado',

    cancelado:
      'Cancelado'

  };


  return (
    estados[estado] ||
    estado
  );

}


function formatearFecha(
  fecha
) {

  if (!fecha) {
    return '—';
  }


  const texto =
    String(
      fecha
    );


  const match =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );


  if (match) {

    return `${match[3]}/${match[2]}/${match[1]}`;

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