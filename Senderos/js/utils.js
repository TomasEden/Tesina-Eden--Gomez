/* ═══════════════════════════════════════════════════════════════
   Senderos — utils.js
   Utilidades compartidas.
   Cargar antes de los scripts específicos de cada página.
   ═══════════════════════════════════════════════════════════════ */


/* =========================================================
   TEXTO / HTML
   ========================================================= */

function escapeHTML(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* =========================================================
   FORMATO
   ========================================================= */

function formatoPrecio(valor) {
  return '$' + Number(valor || 0).toLocaleString('es-AR');
}


function fmtFecha(fecha) {
  if (!fecha) {
    return '—';
  }

  const valor = fecha instanceof Date
    ? fecha
    : new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return String(fecha);
  }

  return valor.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}


function fmtHora(hora) {
  if (!hora) {
    return '—';
  }

  const texto = String(hora).trim();

  const match = texto.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return texto;
  }

  return `${match[1].padStart(2, '0')}:${match[2]}`;
}


function slugify(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


/* =========================================================
   IMÁGENES
   ========================================================= */

function resolverImagen(ruta) {
  ruta = String(ruta || '').trim();

  if (!ruta) {
    return '';
  }

  if (
    /^(https?:)?\/\//i.test(ruta) ||
    ruta.startsWith('data:') ||
    ruta.startsWith('../') ||
    ruta.startsWith('/')
  ) {
    return ruta;
  }

  return '../' + ruta.replace(/^\.\//, '');
}


function imgHTML(ruta, clase = '', alt = '') {
  const src = resolverImagen(ruta);

  if (!src) {
    return '';
  }

  return `
    <img
      class="${escapeHTML(clase)}"
      src="${escapeHTML(src)}"
      alt="${escapeHTML(alt)}"
      loading="lazy"
      onerror="this.remove()"
    >
  `;
}


function iconoHTML(nombre, tam = 15) {
  const archivo = String(nombre || '').trim();

  if (!archivo) {
    return '';
  }

  const tamaño = Number(tam) || 15;

  return `
    <img
      class="ico"
      src="../img/icons/${escapeHTML(archivo)}"
      alt=""
      width="${tamaño}"
      height="${tamaño}"
    >
  `;
}


/* =========================================================
   FETCH / API
   ========================================================= */

async function fetchJSON(url, opciones = {}) {
  const response = await fetch(url, {
    ...opciones,
    credentials: 'same-origin'
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error('JSON inválido');
  }

  if (response.status >= 500) {
    throw new Error('Error del servidor');
  }

  return data;
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(mensaje, tipo = 'ok', accion = null) {
  const toast = document.getElementById('toast');

  if (!toast) {
    return;
  }

  toast.className = `toast show ${tipo || 'ok'}`;
  toast.setAttribute('role', 'status');

  toast.innerHTML = `
    ${mensaje}
    ${
      accion
        ? `
          <a
            class="toast-accion"
            href="${escapeHTML(accion.href || '#')}"
            ${
              accion.nuevaPestana
                ? 'target="_blank" rel="noopener"'
                : ''
            }
          >
            ${escapeHTML(accion.texto || '')}
          </a>
        `
        : ''
    }
  `;

  clearTimeout(toast._tm);

  toast._tm = setTimeout(
    () => {
      toast.classList.remove('show');
    },
    accion ? 6000 : 2800
  );
}


/* =========================================================
   VALIDACIÓN DE CAMPOS
   ========================================================= */

function setFieldError(idCampo, mensaje = '') {
  const campo = document.getElementById(idCampo);

  const error =
    document.getElementById(`err-${idCampo}`) ||
    document.getElementById(`${idCampo}-error`);

  if (campo) {
    campo.classList.toggle('error', Boolean(mensaje));

    if (mensaje) {
      campo.setAttribute('aria-invalid', 'true');
    } else {
      campo.removeAttribute('aria-invalid');
    }
  }

  if (error) {
    error.textContent = mensaje || '';
    error.classList.toggle('show', Boolean(mensaje));
  }
}


function limpiarErrores(ids = []) {
  if (!Array.isArray(ids)) {
    return;
  }

  ids.forEach(idCampo => {
    setFieldError(idCampo, '');
  });
}


/* =========================================================
   PASSWORD
   ========================================================= */

function togglePassword(inputId, boton) {
  const input = document.getElementById(inputId);

  if (!input || !boton) {
    return;
  }

  const mostrar = input.type === 'password';

  input.type = mostrar ? 'text' : 'password';

  boton.setAttribute(
    'aria-label',
    mostrar
      ? 'Ocultar contraseña'
      : 'Mostrar contraseña'
  );

  boton.setAttribute(
    'aria-pressed',
    String(mostrar)
  );

  boton.innerHTML = iconoHTML(
    mostrar ? 'nover.svg' : 'ver.svg',
    14
  );
}


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(boton, activo, textoActivo = 'Cargando...') {
  if (!boton) {
    return;
  }

  if (activo) {
    if (!boton.dataset.textoOriginal) {
      boton.dataset.textoOriginal = boton.textContent.trim();
    }

    boton.disabled = true;
    boton.setAttribute('aria-busy', 'true');

    if (textoActivo) {
      boton.textContent = textoActivo;
    }

    return;
  }

  boton.disabled = false;
  boton.setAttribute('aria-busy', 'false');

  if (boton.dataset.textoOriginal) {
    boton.textContent = boton.dataset.textoOriginal;
    delete boton.dataset.textoOriginal;
  }
}


/* =========================================================
   DEBOUNCE
   ========================================================= */

function debounce(fn, ms = 300) {
  let timer = null;

  return function (...args) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, ms);
  };
}


/* =========================================================
   CONFIGURACIÓN DEL NEGOCIO
   ========================================================= */

let __cfgPromise = null;

function cargarConfig() {
  if (!__cfgPromise) {
    __cfgPromise = fetchJSON('../api/configuracion.php')
      .then(data => {
        if (!data || data.ok === false) {
          throw new Error(
            data?.error ||
            'No se pudo cargar la configuración'
          );
        }

        return {
          costoEnvio: data.costoEnvio ?? null,

          ventanas: Array.isArray(data.ventanas)
            ? data.ventanas
            : [
                ['08:00', '12:30'],
                ['16:00', '20:00']
              ],

          diasCerrados: Array.isArray(data.diasCerrados)
            ? data.diasCerrados
            : [0],

          feriados: Array.isArray(data.feriados)
            ? data.feriados
            : [],

          pasoMin: Number(data.pasoMin) || 30
        };
      })
      .catch(() => ({
        costoEnvio: null,

        ventanas: [
          ['08:00', '12:30'],
          ['16:00', '20:00']
        ],

        diasCerrados: [0],

        feriados: [],

        pasoMin: 30
      }));
  }

  return __cfgPromise;
}


/* =========================================================
   NORMALIZACIÓN DE SERVICIOS
   ========================================================= */

function normServicio(servicio) {
  return {
    id: servicio.slug,

    dbId: Number(servicio.id),

    nombre: servicio.nombre,

    categoria: servicio.categoria,

    desc: servicio.descripcion,

    duracionMin: Number(servicio.duracion),

    duracion:
      Number(servicio.duracion) + ' min',

    precio: Number(servicio.precio),

    badge:
      (servicio.badge || '').toLowerCase() || null,

    badgeText:
      servicio.badge_texto ||
      servicio.badge ||
      '',

    img:
      resolverImagen(servicio.imagen),

    incluye: servicio.incluye
      ? servicio.incluye
          .split('|')
          .map(item => item.trim())
          .filter(Boolean)
      : []
  };
}


/* =========================================================
   NORMALIZACIÓN DE PRODUCTOS
   ========================================================= */

function normProducto(producto) {
  const stockQty =
    Number(producto.stock_cantidad);

  return {
    id: Number(producto.id),

    nombre: producto.nombre,

    categoria: producto.categoria,

    marca: producto.marca,

    desc: producto.descripcion,

    precio: Number(producto.precio),

    stockQty,

    stock: stockQty > 0,

    badge:
      (producto.badge || '').toLowerCase() || null,

    img:
      resolverImagen(producto.imagen)
  };
}


/* =========================================================
   MODAL DE VALIDACIÓN
   ========================================================= */

function mostrarModalValidacion({
  titulo,
  mensaje,
  icono = 'advertencia.svg',
  botones = []
}) {
  let modal =
    document.getElementById('modalValidacion');

  if (!modal) {
    modal = document.createElement('div');

    modal.id = 'modalValidacion';
    modal.className = 'modal-validacion';

    modal.innerHTML = `
      <div class="modal-validacion-content">

        <div
          class="modal-validacion-icon"
          id="modalIcon"
        ></div>

        <h3
          class="modal-validacion-title"
          id="modalTitle"
        ></h3>

        <p
          class="modal-validacion-message"
          id="modalMessage"
        ></p>

        <div
          class="modal-validacion-buttons"
          id="modalButtons"
        ></div>

      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', event => {
      if (event.target === modal) {
        cerrarModalValidacion();
      }
    });
  }

  const iconEl =
    document.getElementById('modalIcon');

  iconEl.innerHTML = `
    <img
      src="../img/icons/${escapeHTML(icono)}"
      alt=""
      width="40"
      height="40"
    >
  `;

  document.getElementById('modalTitle').textContent =
    titulo || '';

  document.getElementById('modalMessage').textContent =
    mensaje || '';

  const buttonsContainer =
    document.getElementById('modalButtons');

  buttonsContainer.innerHTML = '';

  if (!Array.isArray(botones) || botones.length === 0) {
    botones = [
      {
        texto: 'Aceptar',
        clase: 'primary',
        accion: cerrarModalValidacion
      }
    ];
  }

  botones.forEach(config => {
    const boton =
      document.createElement('button');

    boton.type = 'button';

    boton.className =
      `modal-btn-validacion ${
        config.clase || 'primary'
      }`;

    boton.textContent =
      config.texto || '';

    boton.addEventListener('click', () => {
      if (typeof config.accion === 'function') {
        config.accion();
      } else {
        cerrarModalValidacion();
      }
    });

    buttonsContainer.appendChild(boton);
  });

  modal.classList.add('show');

  document.body.style.overflow = 'hidden';
}


function cerrarModalValidacion() {
  const modal =
    document.getElementById('modalValidacion');

  if (!modal) {
    return;
  }

  modal.classList.remove('show');

  document.body.style.overflow = '';
}


/* =========================================================
   CONFIRMACIÓN DE ACCIONES
   ========================================================= */

function confirmarAccion({
  titulo = '¿Confirmar acción?',
  mensaje = '',
  textoBoton = 'Confirmar',
  peligro = false,
  onConfirmar
} = {}) {
  mostrarModalValidacion({
    titulo,
    mensaje,
    icono: peligro
      ? 'advertencia.svg'
      : 'advertencia.svg',

    botones: [
      {
        texto: 'Cancelar',
        clase: 'outline',
        accion: cerrarModalValidacion
      },

      {
        texto: textoBoton,
        clase: peligro
          ? 'danger'
          : 'primary',

        accion: async () => {
          cerrarModalValidacion();

          if (typeof onConfirmar === 'function') {
            await onConfirmar();
          }
        }
      }
    ]
  });
}


/* =========================================================
   CIERRE DEL MODAL CON ESC
   ========================================================= */

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    cerrarModalValidacion();
  }
});