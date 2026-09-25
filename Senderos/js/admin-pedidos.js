/* =========================================================
   SENDEROS — ADMIN PEDIDOS
   Gestión de pedidos desde la API
   ========================================================= */

const API_PEDIDOS = '../api/pedidos.php';
const API_SESION = '../api/sesion.php';

let pedidos = [];
let pedidoActivo = null;


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {

  const fecha =
    document.getElementById('topbarDate');

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


  await cargarPedidos();

  /* Los pedidos nuevos aparecen solos: se recarga cada 30 s
     y al volver a la pestaña. */
  setInterval(() => {
    if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) { cargarPedidos();
    }
  }, 30000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) { cargarPedidos();
    }
  });

});


/* =========================================================
   SESIÓN
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


    if (
      nombreElemento &&
      nombre
    ) {

      nombreElemento.textContent =
        nombre;

    }


    const rolElemento =
      document.querySelector(
        '.sidebar-user-role'
      );


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
   CARGAR PEDIDOS
   ========================================================= */

async function cargarPedidos() {

  try {

    const response =
      await fetch(
        `${API_PEDIDOS}?todos=1`,
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
        'No se pudieron cargar los pedidos.'
      );

    }


    pedidos =
      Array.isArray(
        data.pedidos
      )
        ? data.pedidos.map(
            normalizarPedido
          )
        : [];


    renderStats();

    filtrarPedidos();

  } catch (error) {

    /* log removido en limpieza final */;


    pedidos = [];

    renderStats();

    renderTabla([]);


    showToast(
      'No se pudieron cargar los pedidos.'
    );

  }

}


/* =========================================================
   NORMALIZAR
   ========================================================= */

function normalizarPedido(
  pedido
) {

  return {

    id:
      Number(
        pedido.id
      ),

    cliente:
      pedido.cliente ||
      [
        pedido.nombre,
        pedido.apellido
      ]
        .filter(Boolean)
        .join(' ') ||
      'Cliente web',

    email:
      pedido.email ||
      '',

    telefono:
      pedido.telefono ||
      '',

    total:
      Number(
        pedido.total ||
        0
      ),

    estado:
      pedido.estado ||
      'pendiente',

    metodo_pago:
      pedido.metodo_pago ||
      pedido.metodoPago ||
      '',

    creado_en:
      pedido.creado_en ||
      pedido.fecha ||
      '',

    items:
      normalizarItems(
        pedido.items ||
        pedido.detalles ||
        pedido.productos
      )

  };

}


/* =========================================================
   ITEMS
   ========================================================= */

function normalizarItems(
  items
) {

  if (
    typeof items ===
    'string'
  ) {

    try {

      items =
        JSON.parse(
          items
        );

    } catch (error) {

      return [];

    }

  }


  if (
    Array.isArray(
      items
    )
  ) {

    return items;

  }


  if (
    items &&
    typeof items ===
    'object'
  ) {

    return [
      items
    ];

  }


  return [];

}


/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function renderStats() {

  const total =
    pedidos.length;


  const pendientes =
    pedidos.filter(
      pedido =>
        normalizarEstado(
          pedido.estado
        ) ===
        'pendiente'
    ).length;


  const confirmados =
    pedidos.filter(
      pedido =>
        normalizarEstado(
          pedido.estado
        ) ===
        'confirmado'
    ).length;


  const cancelados =
    pedidos.filter(
      pedido =>
        normalizarEstado(
          pedido.estado
        ) ===
        'cancelado'
    ).length;


  const recaudacion =
    pedidos
      .filter(
        pedido =>
          normalizarEstado(
            pedido.estado
          ) !==
          'cancelado'
      )
      .reduce(
        (
          total,
          pedido
        ) =>
          total +
          pedido.total,
        0
      );


  const stats = [

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
        'Pedidos',
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
          src="../img/icons/tarjeta.svg"
          alt=""
          width="15"
          height="15"
        >
      `,
      label:
        'Total no cancelado',
      value:
        formatearPrecio(
          recaudacion
        ),
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
      'pedidosBody'
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
    pedido => {

      const estado =
        normalizarEstado(
          pedido.estado
        );


      tbody.innerHTML += `

        <tr>

          <td>

            <strong>
              #${escapeHTML(
                pedido.id
              )}
            </strong>

          </td>


          <td>

            <strong>
              ${escapeHTML(
                pedido.cliente
              )}
            </strong>

          </td>


          <td class="td-light">

            ${escapeHTML(
              resumenItems(
                pedido.items
              )
            )}

          </td>


          <td>

            <strong>
              ${escapeHTML(
                formatearPrecio(
                  pedido.total
                )
              )}
            </strong>

          </td>


          <td class="td-light">

            ${escapeHTML(
              formatearFecha(
                pedido.creado_en
              )
            )}

          </td>


          <td>

            <span
              class="badge badge-${escapeHTML(
                estado
              )}"
            >
              ${escapeHTML(
                formatearEstado(
                  estado
                )
              )}
            </span>

          </td>


          <td>

            <div
              style="
                display:flex;
                gap:.4rem
              "
            >

              <button
                type="button"
                class="btn-icon"
                title="Ver pedido"
                onclick="abrirPedido(${pedido.id})"
              >

                <img
                  src="../img/icons/ver.svg"
                  alt=""
                  width="15"
                  height="15"
                >

              </button>


              <button
                type="button"
                class="btn-icon"
                title="Cambiar estado"
                onclick="abrirEstadoPedido(${pedido.id})"
              >

                <img
                  src="../img/icons/formulario.svg"
                  alt=""
                  width="13"
                  height="13"
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
   RESUMEN ITEMS
   ========================================================= */

function resumenItems(
  items
) {

  if (
    !items ||
    !items.length
  ) {

    return 'Sin detalle';

  }


  const nombres =
    items
      .slice(
        0,
        2
      )
      .map(
        item => {

          const nombre =
            item.nombre ||
            item.titulo ||
            item.producto ||
            item.servicio ||
            'Producto';


          const cantidad =
            Number(
              item.cantidad ||
              1
            );


          return `${nombre} × ${cantidad}`;

        }
      );


  if (
    items.length > 2
  ) {

    nombres.push(
      `+${items.length - 2} más`
    );

  }


  return nombres.join(
    ', '
  );

}


/* =========================================================
   FILTROS
   ========================================================= */

function filtrarPedidos() {

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
    pedidos.filter(
      pedido => {

        const texto =
          [
            pedido.id,
            pedido.cliente,
            pedido.email,
            pedido.metodo_pago,
            resumenItems(
              pedido.items
            )
          ]
            .join(' ')
            .toLowerCase();


        const coincideTexto =
          !busqueda ||
          texto.includes(
            busqueda
          );


        const coincideEstado =
          estado ===
            'todos' ||
          normalizarEstado(
            pedido.estado
          ) === estado;


        return (
          coincideTexto &&
          coincideEstado
        );

      }
    );


  renderTabla(
    resultado
  );

}


/* =========================================================
   VER PEDIDO
   ========================================================= */

function abrirPedido(
  id
) {

  pedidoActivo =
    pedidos.find(
      pedido =>
        pedido.id ===
        Number(id)
    );


  if (!pedidoActivo) {
    return;
  }


  const cliente =
    document.getElementById(
      'detalleCliente'
    );


  if (cliente) {

    cliente.textContent =
      pedidoActivo.cliente;

  }


  const email =
    document.getElementById(
      'detalleEmail'
    );


  if (email) {

    email.textContent =
      pedidoActivo.email ||
      'Sin email';

  }


  const telefono =
    document.getElementById(
      'detalleTelefono'
    );


  if (telefono) {

    telefono.textContent =
      pedidoActivo.telefono ||
      'Sin teléfono';

  }


  const fecha =
    document.getElementById(
      'detalleFecha'
    );


  if (fecha) {

    fecha.textContent =
      formatearFecha(
        pedidoActivo.creado_en
      );

  }


  const metodo =
    document.getElementById(
      'detalleMetodo'
    );


  if (metodo) {

    let grupoTxt = 'solo productos';

    if (pedidoActivo.pago_grupo === 'servicios') {
      grupoTxt = 'solo servicios';
    } else if (pedidoActivo.pago_grupo === 'productos') {
      grupoTxt = 'solo productos';
    } else if (pedidoActivo.pago_grupo === 'todo') {
      grupoTxt = 'todo junto';
    }

    metodo.textContent =
      etiquetaMetodoPago(pedidoActivo.metodo_pago) +
      ' (' + grupoTxt + ')';

  }


  const entrega =
    document.getElementById(
      'detalleEntrega'
    );


  if (entrega) {

    entrega.textContent =
      pedidoActivo.entrega === 'envio'
        ? 'Envío a domicilio'
        : 'Retiro en el local';

  }


  const direccion =
    document.getElementById(
      'detalleDireccion'
    );


  if (direccion) {

    direccion.textContent =
      pedidoActivo.direccion_envio ||
      '—';

  }


  const envio =
    document.getElementById(
      'detalleEnvio'
    );


  if (envio) {

    const costo =
      pedidoActivo.entrega === 'envio'
        ? Number(
            pedidoActivo.costo_envio ?? 800
          ) || 0
        : 0;

    envio.textContent =
      costo > 0
        ? formatearPrecio(costo)
        : 'Sin costo';

  }


  const avisar =
    document.getElementById(
      'btnAvisarWhatsApp'
    );


  if (avisar) {

    const tel =
      String(
        pedidoActivo.telefono || ''
      ).replace(/\D/g, '');

    const estadoTxt =
      normalizarEstado(
        pedidoActivo.estado
      );

    const mensaje =
      'Hola ' +
      String(
        pedidoActivo.cliente ||
        ''
      ).trim() +
      ', te escribimos desde Senderos: tu pedido #' +
      String(
        pedidoActivo.id || ''
      ).padStart(6, '0') +
      ' está "' +
      estadoTxt +
      '". Total: ' +
      formatearPrecio(
        pedidoActivo.total
      ) +
      '. ¡Gracias por tu compra!';

    if (tel) {
      avisar.href =
        'https://wa.me/549' +
        tel +
        '?text=' +
        encodeURIComponent(mensaje);

      avisar.style.display = '';
    } else {
      avisar.style.display = 'none';
    }

  }


  const total =
    document.getElementById(
      'detalleTotal'
    );


  if (total) {

    total.textContent =
      formatearPrecio(
        pedidoActivo.total
      );

  }


  const items =
    document.getElementById(
      'detalleItems'
    );  if (items) {

    items.innerHTML =
      pedidoActivo.items.length
        ? pedidoActivo.items
            .map(
              item => {

                const nombre =
                  item.nombre ||
                  item.titulo ||
                  item.producto ||
                  item.servicio ||
                  'Producto';


                const cantidad =
                  Number(
                    item.cantidad ||
                    1
                  );


                const precio =
                  Number(
                    item.precio ||
                    item.precio_unitario ||
                    0
                  );


                return `

                  <div
                    style="
                      display:flex;
                      justify-content:space-between;
                      gap:1rem;
                      padding:.65rem 0;
                      border-bottom:1px solid var(--cream)
                    "
                  >

                    <span>
                      ${escapeHTML(
                        nombre
                      )}
                      ×
                      ${cantidad}
                    </span>

                    <strong>
                      ${escapeHTML(
                        formatearPrecio(
                          precio *
                          cantidad
                        )
                      )}
                    </strong>

                  </div>

                `;

              }
            )
            .join('')
        : `
            <p class="td-light">
              No hay detalle disponible.
            </p>
          `;

  }


  const modal =
    document.getElementById(
      'modalPedido'
    );


  if (modal) {

    modal.classList.remove(
      'hidden'
    );

  }

}


/* =========================================================
   CAMBIAR ESTADO
   ========================================================= */

function abrirEstadoPedido(
  id
) {

  pedidoActivo =
    pedidos.find(
      pedido =>
        pedido.id ===
        Number(id)
    );


  if (!pedidoActivo) {
    return;
  }


  const select =
    document.getElementById(
      'nuevoEstadoPedido'
    );


  if (select) {

    select.value =
      normalizarEstado(
        pedidoActivo.estado
      );

  }


  const info =
    document.getElementById(
      'estadoPedidoInfo'
    );


  if (info) {

    info.textContent =
      `Pedido #${pedidoActivo.id} — ${pedidoActivo.cliente}`;

  }


  const modal =
    document.getElementById(
      'modalEstadoPedido'
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

async function guardarEstadoPedido() {

  if (!pedidoActivo) {
    return;
  }


  const select =
    document.getElementById(
      'nuevoEstadoPedido'
    );


  const estado =
    select
      ? select.value
      : 'pendiente';


  try {

    const response =
      await fetch(
        API_PEDIDOS,
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
              pedidoActivo.id,

            estado:
              estado

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
        'No se pudo actualizar el pedido.'
      );

    }


    const index =
      pedidos.findIndex(
        pedido =>
          pedido.id ===
          pedidoActivo.id
      );


    if (
      index !== -1
    ) {

      pedidos[index] = {

        ...pedidos[index],

        estado:
          estado

      };

    }


    cerrarModal(
      'modalEstadoPedido'
    );


    renderStats();

    filtrarPedidos();


    showToast(
      'Estado del pedido actualizado.'
    );


  } catch (error) {

    /* log removido en limpieza final */;


    showToast(
      error.message ||
      'No se pudo actualizar el pedido.'
    );

  }

}


/* =========================================================
   MODALES
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
        method:
          'POST',
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

/* Etiqueta legible del método de pago. Las tarjetas se guardan como
   "visa ****1234": se muestran marca + últimos 4 dígitos solamente. */
function etiquetaMetodoPago(metodo) {
  const raw = String(metodo || '').trim();

  if (!raw) {
    return 'No especificado';
  }

  const m = raw.toLowerCase();

  if (m === 'transferencia') {
    return 'Transferencia';
  }

  if (m === 'debito') {
    return 'Débito';
  }

  const partes = raw.split('****');
  const marca = String(partes[0] || '').trim().toLowerCase();
  const ultimos = partes[1]
    ? String(partes[1]).replace(/\D/g, '')
    : '';

  const marcas = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    cabal: 'Cabal',
    naranja_x: 'Naranja X',
    amex: 'American Express'
  };

  if (marcas[marca]) {
    return marcas[marca] +
      (ultimos ? ' ****' + ultimos : '');
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}


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
      'Cancelado',

    preparado:
      'Preparado',

    enviado:
      'Enviado',

    entregado:
      'Entregado'

  };


  return (
    estados[
      estado
    ] ||
    estado
  );

}


function formatearPrecio(
  valor
) {

  return '$' +
    Number(
      valor ||
      0
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
      /^(\d{4})-(\d{2})-(\d{2})/
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