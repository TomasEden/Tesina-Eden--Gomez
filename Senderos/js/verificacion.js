/* ═══════════════════════════════════════
   Senderos — verificacion.js
   Pantalla de verificación en dos pasos.
   Usa api/verificacion.php (acciones:
   estado, verificar, reenviar, cancelar).
   ═══════════════════════════════════════ */

var VERIF_API = '../api/verificacion.php';

var verifContadorTimer = null;
var verifEsperaTimer = null;
var verifExpiraEn = null;     /* timestamp epoch (segundos) */
var verifReenvios = 0;
var verifUltimoEnvio = null;

/* ─────────────────────────────────────
   UTILIDADES
   ───────────────────────────────────── */

function verifMostrarError(idCampo, mensaje) {
  if (typeof window.setFieldError === 'function') {
    window.setFieldError(idCampo, mensaje);
  }
}

function verifLimpiarError() {
  if (typeof window.limpiarErrores === 'function') {
    window.limpiarErrores(['codigo']);
  }
}

function verifSetLoading(boton, activo, texto) {
  if (typeof window.setLoading === 'function') {
    window.setLoading(boton, activo, texto || 'Verificando...');
  }
}

/* Convierte "2026-01-01 10:00:00" (hora del servidor) a epoch. */
function verifParseFechaServidor(fecha) {
  if (!fecha) {
    return null;
  }

  var limpia = String(fecha).replace(' ', 'T');
  var d = new Date(limpia);

  return isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000);
}

/* ─────────────────────────────────────
   CONTADOR REGRESIVO
   ───────────────────────────────────── */

function verifDetenerContador() {
  if (verifContadorTimer) {
    clearInterval(verifContadorTimer);
    verifContadorTimer = null;
  }
}

function verifIniciarContador() {
  verifDetenerContador();

  var etiqueta = document.getElementById('verifTiempo');
  var contador = document.getElementById('verifContador');

  if (!etiqueta || !contador) {
    return;
  }

  if (!verifExpiraEn) {
    etiqueta.classList.add('hidden');
    return;
  }

  function pintar() {
    var restantes = verifExpiraEn - Math.floor(Date.now() / 1000);

    if (restantes <= 0) {
      contador.textContent = '00:00';
      etiqueta.classList.add('agotado');
      etiqueta.childNodes[0].nodeValue = 'El código venció. Solicitá uno nuevo. ';
      verifDetenerContador();
      return;
    }

    var min = Math.floor(restantes / 60);
    var seg = restantes % 60;

    contador.textContent =
      (min < 10 ? '0' : '') + min + ':' + (seg < 10 ? '0' : '') + seg;
  }

  pintar();
  verifContadorTimer = setInterval(pintar, 1000);
}

/* ─────────────────────────────────────
   ESPERA DE REENVÍO (60 s)
   ───────────────────────────────────── */

function verifDetenerEspera() {
  if (verifEsperaTimer) {
    clearInterval(verifEsperaTimer);
    verifEsperaTimer = null;
  }
}

function verifIniciarEspera(segundos) {
  verifDetenerEspera();

  var boton = document.getElementById('btnReenviar');
  var etiqueta = document.getElementById('verifEspera');

  if (!boton || !etiqueta) {
    return;
  }

  var restantes = Math.max(1, Math.floor(segundos));

  boton.disabled = true;
  etiqueta.classList.remove('hidden');

  function pintar() {
    if (restantes <= 0) {
      verifDetenerEspera();
      boton.disabled = false;
      etiqueta.classList.add('hidden');
      return;
    }

    etiqueta.textContent =
      'Podés reenviar en ' + restantes + ' segundo' + (restantes === 1 ? '' : 's') + '.';

    restantes--;
  }

  pintar();
  verifEsperaTimer = setInterval(pintar, 1000);
}

/* ─────────────────────────────────────
   ESTADO INICIAL
   ───────────────────────────────────── */

function verifCargarEstado() {
  return fetch(VERIF_API + '?accion=estado', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          return { ok: false, data: data };
        }

        return { ok: true, data: data };
      });
    })
    .catch(function () {
      return { ok: false, data: null };
    });
}

function verifPintarEstado(data) {
  var wrapForm = document.getElementById('verif-form-wrap');
  var wrapSin = document.getElementById('verifSinDesafio');
  var txtSin = document.getElementById('verifSinDesafioTxt');
  var subtitulo = document.getElementById('verif-subtitulo');

  if (!data || !data.ok) {
    /* No hay desafío pendiente: se muestra el estado alternativo. */
    if (wrapForm) {
      wrapForm.classList.add('hidden');
    }

    if (wrapSin) {
      wrapSin.classList.remove('hidden');
    }

    if (txtSin) {
      txtSin.textContent =
        (data && data.data && data.data.mensaje) ||
        'No hay ninguna verificación pendiente. Ingresá tus datos nuevamente.';
    }

    if (subtitulo) {
      subtitulo.textContent = 'Volvé a ingresar para continuar.';
    }

    return;
  }

  var info = data.data;

  if (subtitulo && info.email_enmascarado) {
    subtitulo.textContent =
      'Enviamos un código de 6 dígitos a ' + info.email_enmascarado + '.';
  }

  verifExpiraEn = verifParseFechaServidor(info.expira_en);
  verifReenvios = Number(info.reenvios) || 0;
  verifUltimoEnvio = verifParseFechaServidor(info.ultimo_envio);

  verifIniciarContador();

  /* Si ya se usaron los reenvíos máximos, se oculta el botón. */
  var boton = document.getElementById('btnReenviar');

  if (boton && verifReenvios >= 5) {
    boton.disabled = true;
    boton.textContent = 'Reenvíos agotados';
  } else if (verifUltimoEnvio) {
    /* Aplica la espera inicial desde el último envío. */
    var transcurrido = Math.floor(Date.now() / 1000) - verifUltimoEnvio;
    var espera = 60 - transcurrido;

    if (espera > 0) {
      verifIniciarEspera(espera);
    }
  }
}

/* ─────────────────────────────────────
   VERIFICAR CÓDIGO
   ───────────────────────────────────── */

function verifEnviarCodigo() {
  verifLimpiarError();

  var campo = document.getElementById('codigo');
  var codigo = campo ? campo.value.trim() : '';

  if (!/^\d{6}$/.test(codigo)) {
    verifMostrarError('codigo', 'Ingresá el código de 6 dígitos.');

    if (campo) {
      campo.focus();
    }

    return Promise.resolve();
  }

  var boton = document.getElementById('btnVerificar');

  verifSetLoading(boton, true);

  return fetch(VERIF_API + '?accion=verificar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ codigo: codigo })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          var mensaje =
            (data && (data.mensaje || data.error)) ||
            'El código no es válido.';

          /*
            Los motivos que agotan el desafío (vencido, usado,
            límite de intentos) redirigen al login tras el aviso.
          */
          var fatales = ['vencido', 'usado', 'cancelado', 'intentos', 'sin_desafio'];
          var fatal = fatales.indexOf(data && data.codigo) !== -1;

          verifMostrarError('codigo', mensaje);

          if (fatal) {
            setTimeout(function () {
              window.location.href = 'login.html';
            }, 2200);
          }

          return null;
        }

        return data.usuario;
      });
    })
    .then(function (usuario) {
      if (!usuario) {
        return;
      }

      verifDetenerContador();
      verifDetenerEspera();

      /* Éxito: se muestra confirmación y se redirige según el rol. */
      var wrapForm = document.getElementById('verif-form-wrap');

      if (wrapForm) {
        wrapForm.innerHTML =
          '<div class="verif-exito">' +
          '<p class="verif-exito-txt">Verificación correcta</p>' +
          '</div>';
      }

      try {
        window.localStorage.setItem('senderos-sesion', JSON.stringify(usuario));
        window.localStorage.removeItem('sesion');
        window.sessionStorage.removeItem('sesion');
      } catch (e) {}

      setTimeout(function () {
        window.location.href =
          usuario.rol === 'admin' ? 'admin-dashboard.html' : 'index.html';
      }, 900);
    })
    .catch(function (error) {
      if (
        error &&
        (error.message === 'Failed to fetch' ||
          error.message === 'Error del servidor')
      ) {
        if (typeof window.mostrarErrorConexion === 'function') {
          window.mostrarErrorConexion(verifEnviarCodigo);
          return;
        }
      }

      verifMostrarError('codigo', 'No se pudo verificar el código. Intentá de nuevo.');
    })
    .finally(function () {
      verifSetLoading(boton, false);
    });
}

/* ─────────────────────────────────────
   REENVIAR CÓDIGO
   ───────────────────────────────────── */

function verifReenviarCodigo() {
  var boton = document.getElementById('btnReenviar');

  if (boton && boton.disabled) {
    return;
  }

  if (boton) {
    boton.disabled = true;
  }

  fetch(VERIF_API + '?accion=reenviar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({})
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          var mensaje =
            (data && (data.mensaje || data.error)) ||
            'No se pudo reenviar el código.';

          if (typeof window.showToast === 'function') {
            window.showToast(mensaje, 'error');
          }

          /* Si el motivo es de espera, se inicia el contador. */
          if (data && data.codigo === 'espera') {
            verifIniciarEspera(60);
            return;
          }

          if (boton) {
            boton.disabled = false;
          }

          return;
        }

        if (data.expira_en) {
          verifExpiraEn = verifParseFechaServidor(data.expira_en);
          verifIniciarContador();
        }

        verifReenvios++;
        verifUltimoEnvio = Math.floor(Date.now() / 1000);

        if (verifReenvios >= 5 && boton) {
          boton.textContent = 'Reenvíos agotados';
          boton.disabled = true;
          return;
        }

        verifIniciarEspera(60);

        /* Limpia el campo para que se ingrese el código nuevo. */
        var campo = document.getElementById('codigo');

        if (campo) {
          campo.value = '';
          campo.focus();
        }

        verifLimpiarError();

        if (typeof window.showToast === 'function') {
          window.showToast('Enviamos un código nuevo a tu correo.', 'ok');
        }
      });
    })
    .catch(function () {
      if (typeof window.showToast === 'function') {
        window.showToast('No se pudo reenviar el código. Revisá tu conexión.', 'error');
      }

      if (boton) {
        boton.disabled = false;
      }
    });
}

/* ─────────────────────────────────────
   CANCELAR (volver al login)
   ───────────────────────────────────── */

function verifCancelar() {
  fetch(VERIF_API + '?accion=cancelar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({})
  })
    .catch(function () {})
    .finally(function () {
      verifDetenerContador();
      verifDetenerEspera();
      window.location.href = 'login.html';
    });
}

/* ─────────────────────────────────────
   INICIALIZACIÓN
   ───────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  /* Solo carga el estado si no hay sesión ya iniciada. */
  fetch('../api/sesion.php', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      if (data && data.ok && data.logueado && data.usuario) {
        window.location.href =
          data.usuario.rol === 'admin' ? 'admin-dashboard.html' : 'index.html';
        return;
      }

      /* No hay sesión: carga el estado del desafío. */
      verifCargarEstado().then(verifPintarEstado);
    })
    .catch(function () {
      verifCargarEstado().then(verifPintarEstado);
    });

  /* Formulario. */
  var form = document.getElementById('verifForm');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      verifEnviarCodigo();
    });
  }

  /* Reenviar. */
  var btnReenviar = document.getElementById('btnReenviar');

  if (btnReenviar) {
    btnReenviar.addEventListener('click', verifReenviarCodigo);
  }

  /* Volver / cancelar. */
  var btnVolver = document.getElementById('btnVolver');

  if (btnVolver) {
    btnVolver.addEventListener('click', function (event) {
      event.preventDefault();
      verifCancelar();
    });
  }

  /* Solo números en el campo + limpieza de error al escribir. */
  var campoCodigo = document.getElementById('codigo');

  if (campoCodigo) {
    campoCodigo.addEventListener('input', function () {
      campoCodigo.value = campoCodigo.value.replace(/\D/g, '').slice(0, 6);
      verifLimpiarError();
    });

    /* Al pegar un código completo, se procesa automáticamente. */
    campoCodigo.addEventListener('paste', function (event) {
      var texto = (event.clipboardData || window.clipboardData).getData('text');
      var limpio = String(texto).replace(/\D/g, '').slice(0, 6);

      if (limpio.length === 6) {
        event.preventDefault();
        campoCodigo.value = limpio;
        verifEnviarCodigo();
      }
    });

    campoCodigo.focus();
  }
});
