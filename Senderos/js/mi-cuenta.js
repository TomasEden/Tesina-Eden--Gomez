/* ═══════════════════════════════════════
   Senderos — mi-cuenta.js
   Consulta y modificación segura de datos
   personales desde api/mi-cuenta.php.
   ═══════════════════════════════════════ */

var MC_API = '../api/mi-cuenta.php';

var mcDatos = null;         /* datos actuales del usuario */
var mcEditando = false;
var mcVerificando = false;  /* hay una verificación de código activa */
var mcEsperaTimer = null;

/* ─────────────────────────────────────
   UTILIDADES
   ───────────────────────────────────── */

function mcMostrarError(campo, mensaje) {
  if (typeof window.setFieldError === 'function') {
    window.setFieldError(campo, mensaje);
  }
}

function mcLimpiarErrores() {
  if (typeof window.limpiarErrores === 'function') {
    window.limpiarErrores(['nombre', 'apellido', 'telefono', 'email', 'codigo-verif']);
  }
}

function mcToast(mensaje, tipo) {
  if (typeof window.showToast === 'function') {
    window.showToast(mensaje, tipo || 'ok');
  }
}

function mcEscape(valor) {
  if (typeof window.escapeHTML === 'function') {
    return window.escapeHTML(valor);
  }

  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ─────────────────────────────────────
   CARGA DE DATOS
   ───────────────────────────────────── */

function mcCargar() {
  fetch(MC_API + '?accion=datos', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          throw new Error((data && data.mensaje) || 'No se pudieron cargar tus datos.');
        }

        return data;
      });
    })
    .then(function (data) {
      mcDatos = data.usuario;
      mcRenderInfo();
    })
    .catch(function (error) {
      mcToast(error.message || 'No se pudieron cargar tus datos.', 'error');
    });
}

/* ─────────────────────────────────────
   RENDER: SOLO LECTURA
   ───────────────────────────────────── */

function mcRenderInfo() {
  var cont = document.getElementById('mcInfoLista');

  if (!cont || !mcDatos) {
    return;
  }

  var campos = [
    ['Nombre', mcDatos.nombre],
    ['Apellido', mcDatos.apellido],
    ['Email', mcDatos.email],
    ['Teléfono', mcDatos.telefono],
    ['Fecha de nacimiento', mcDatos.nacimiento]
  ];

  var html = '';

  campos.forEach(function (par) {
    var valor = par[1];

    html +=
      '<div class="mc-info-fila">' +
      '<span class="mc-info-label">' + mcEscape(par[0]) + '</span>' +
      '<span class="mc-info-valor' + (valor ? '' : ' vacio') + '">' +
      (valor ? mcEscape(valor) : 'No informado') +
      '</span>' +
      '</div>';
  });

  cont.innerHTML = html;
}

/* ─────────────────────────────────────
   MODO EDICIÓN
   ───────────────────────────────────── */

function mcActivarEdicion() {
  if (!mcDatos) {
    return;
  }

  mcEditando = true;
  mcVerificando = false;

  /* Rellena el formulario con los valores actuales. */
  var fNombre = document.getElementById('mcNombre');
  var fApellido = document.getElementById('mcApellido');
  var fTelefono = document.getElementById('mcTelefono');
  var fEmail = document.getElementById('mcEmail');

  if (fNombre) fNombre.value = mcDatos.nombre || '';
  if (fApellido) fApellido.value = mcDatos.apellido || '';
  if (fTelefono) fTelefono.value = mcDatos.telefono || '';
  if (fEmail) fEmail.value = mcDatos.email || '';

  mcLimpiarErrores();

  document.getElementById('mcSoloLectura').classList.add('hidden');
  document.getElementById('mcEdicion').classList.remove('hidden');
  document.getElementById('mcVerificacion').classList.add('hidden');

  if (fNombre) fNombre.focus();
}

function mcCancelarEdicion() {
  mcEditando = false;
  mcVerificando = false;
  mcDetenerEspera();

  mcLimpiarErrores();

  document.getElementById('mcEdicion').classList.add('hidden');
  document.getElementById('mcVerificacion').classList.add('hidden');
  document.getElementById('mcSoloLectura').classList.remove('hidden');
}

/* ─────────────────────────────────────
   GUARDAR (genera el desafío)
   ───────────────────────────────────── */

function mcGuardar() {
  mcLimpiarErrores();

  var fNombre = document.getElementById('mcNombre');
  var fApellido = document.getElementById('mcApellido');
  var fTelefono = document.getElementById('mcTelefono');
  var fEmail = document.getElementById('mcEmail');

  var campos = {
    nombre: fNombre ? fNombre.value.trim() : '',
    apellido: fApellido ? fApellido.value.trim() : '',
    telefono: fTelefono ? fTelefono.value.trim() : '',
    email: fEmail ? fEmail.value.trim() : ''
  };

  /* Validaciones básicas (el servidor también valida). */
  var valido = true;

  if (!campos.nombre) {
    mcMostrarError('nombre', 'Ingresá tu nombre.');
    valido = false;
  }

  if (!campos.apellido) {
    mcMostrarError('apellido', 'Ingresá tu apellido.');
    valido = false;
  }

  if (!campos.telefono) {
    mcMostrarError('telefono', 'Ingresá tu teléfono.');
    valido = false;
  } else if (!/^[0-9+\-\s()]{6,40}$/.test(campos.telefono)) {
    mcMostrarError('telefono', 'El teléfono solo puede contener números y los símbolos + - ( ).');
    valido = false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email)) {
    mcMostrarError('email', 'Ingresá un email válido.');
    valido = false;
  }

  if (!valido) {
    var primero = document.querySelector('#mcEdicion .form-group.error input');

    if (primero) primero.focus();
    return;
  }

  var boton = document.getElementById('mcBtnGuardar');

  if (typeof window.setLoading === 'function') {
    window.setLoading(boton, true, 'Enviando...');
  }

  fetch(MC_API + '?accion=guardar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ campos: campos })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          if (data && data.codigo === 'sin_cambios') {
            mcToast(data.mensaje || 'No detectamos cambios para guardar.', 'info');
            return null;
          }

          if (data && data.campo) {
            mcMostrarError(data.campo, data.mensaje);
            return null;
          }

          throw new Error((data && data.mensaje) || 'No se pudieron guardar los cambios.');
        }

        return data;
      });
    })
    .then(function (data) {
      if (!data) {
        return;
      }

      /* Se requiere verificación: se muestra el bloque de código. */
      mcVerificando = true;
      mcMostrarVerificacion(data);
    })
    .catch(function (error) {
      mcToast(error.message || 'No se pudieron guardar los cambios.', 'error');
    })
    .finally(function () {
      if (typeof window.setLoading === 'function') {
        window.setLoading(boton, false);
      }
    });
}

/* ─────────────────────────────────────
   VERIFICACIÓN (código de 6 dígitos)
   ───────────────────────────────────── */

function mcMostrarVerificacion(data) {
  var bloque = document.getElementById('mcVerificacion');
  var desc = document.getElementById('mcVerifDesc');

  if (desc) {
    desc.textContent =
      (data && data.mensaje) ||
      'Enviamos un código de verificación a tu correo electrónico.';
  }

  /* Limpia el campo de código. */
  var campo = document.getElementById('mcCodigo');

  if (campo) {
    campo.value = '';
  }

  mcLimpiarErrores();

  bloque.classList.remove('hidden');

  /* El formulario de edición permanece visible pero deshabilitado. */
  var form = document.getElementById('mcFormEdicion');

  if (form) {
    form.classList.add('mc-form-bloqueado');
  }

  if (campo) {
    campo.focus();
  }
}

function mcVerificarCodigo() {
  var campo = document.getElementById('mcCodigo');
  var codigo = campo ? campo.value.trim() : '';

  if (!/^\d{6}$/.test(codigo)) {
    mcMostrarError('codigo-verif', 'Ingresá el código de 6 dígitos.');

    if (campo) campo.focus();
    return;
  }

  var boton = document.getElementById('mcBtnVerificar');

  if (typeof window.setLoading === 'function') {
    window.setLoading(boton, true, 'Verificando...');
  }

  fetch(MC_API + '?accion=confirmar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ codigo: codigo })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          var fatales = ['vencido', 'usado', 'cancelado', 'intentos', 'sin_desafio'];

          if (data && fatales.indexOf(data.codigo) !== -1) {
            /* Se cancela la edición y se vuelve al modo lectura. */
            mcCancelarEdicion();
            mcCargar();
          }

          throw new Error((data && data.mensaje) || 'El código no es válido.');
        }

        return data;
      });
    })
    .then(function (data) {
      /*
        Si el servidor pide un segundo código (cambio de correo),
        se muestra el mismo bloque con el nuevo mensaje.
      */
      if (data && data.requiere_verificacion) {
        mcToast(data.mensaje, 'info');
        mcMostrarVerificacion(data);
        return;
      }

      /* Éxito: se vuelve al modo lectura con los datos actualizados. */
      mcToast((data && data.mensaje) || 'Tus datos fueron actualizados.', 'ok');

      mcEditando = false;
      mcVerificando = false;
      mcDetenerEspera();

      document.getElementById('mcVerificacion').classList.add('hidden');
      document.getElementById('mcEdicion').classList.add('hidden');

      var form = document.getElementById('mcFormEdicion');

      if (form) {
        form.classList.remove('mc-form-bloqueado');
      }

      document.getElementById('mcSoloLectura').classList.remove('hidden');

      mcCargar();
    })
    .catch(function (error) {
      mcToast(error.message || 'El código no es válido.', 'error');
    })
    .finally(function () {
      if (typeof window.setLoading === 'function') {
        window.setLoading(boton, false);
      }
    });
}

/* ─────────────────────────────────────
   REENVÍO Y CANCELACIÓN
   ───────────────────────────────────── */

function mcReenviarCodigo() {
  var boton = document.getElementById('mcBtnReenviar');

  if (boton && boton.disabled) {
    return;
  }

  fetch(MC_API + '?accion=reenviar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({})
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (!respuesta.ok || !data.ok) {
          if (data && data.codigo === 'espera') {
            var espera = 60;
            mcIniciarEspera(espera);
            return;
          }

          throw new Error((data && data.mensaje) || 'No se pudo reenviar el código.');
        }

        mcToast('Enviamos un código nuevo a tu correo.', 'ok');
        mcIniciarEspera(60);

        var campo = document.getElementById('mcCodigo');

        if (campo) {
          campo.value = '';
          campo.focus();
        }

        mcLimpiarErrores();
      });
    })
    .catch(function (error) {
      mcToast(error.message || 'No se pudo reenviar el código.', 'error');
    });
}

function mcCancelarOperacion() {
  fetch(MC_API + '?accion=cancelar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({})
  })
    .catch(function () {})
    .finally(function () {
      mcCancelarEdicion();
      mcCargar();
      mcToast('Operación cancelada. Tus datos no fueron modificados.', 'info');
    });
}

/* ─────────────────────────────────────
   ESPERA DE REENVÍO
   ───────────────────────────────────── */

function mcDetenerEspera() {
  if (mcEsperaTimer) {
    clearInterval(mcEsperaTimer);
    mcEsperaTimer = null;
  }

  var etiqueta = document.getElementById('mcVerifEspera');
  var boton = document.getElementById('mcBtnReenviar');

  if (etiqueta) etiqueta.classList.add('hidden');
  if (boton) boton.disabled = false;
}

function mcIniciarEspera(segundos) {
  mcDetenerEspera();

  var etiqueta = document.getElementById('mcVerifEspera');
  var boton = document.getElementById('mcBtnReenviar');

  if (!etiqueta || !boton) return;

  var restantes = Math.max(1, Math.floor(segundos));

  boton.disabled = true;
  etiqueta.classList.remove('hidden');

  function pintar() {
    if (restantes <= 0) {
      mcDetenerEspera();
      return;
    }

    etiqueta.textContent =
      'Podés reenviar en ' + restantes + ' segundo' + (restantes === 1 ? '' : 's') + '.';

    restantes--;
  }

  pintar();
  mcEsperaTimer = setInterval(pintar, 1000);
}

/* ─────────────────────────────────────
   INICIALIZACIÓN
   ───────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  /* Solo se inicializa si el panel de mi cuenta existe en la página. */
  if (!document.getElementById('tabCuenta')) {
    return;
  }

  /* Botones de solo lectura. */
  var btnEditar = document.getElementById('mcBtnEditar');

  if (btnEditar) {
    btnEditar.addEventListener('click', mcActivarEdicion);
  }

  /* Botones del formulario de edición. */
  var btnGuardar = document.getElementById('mcBtnGuardar');

  if (btnGuardar) {
    btnGuardar.addEventListener('click', mcGuardar);
  }

  var btnCancelar = document.getElementById('mcBtnCancelar');

  if (btnCancelar) {
    btnCancelar.addEventListener('click', function () {
      if (mcVerificando) {
        /* Si hay verificación pendiente, se cancela la operación. */
        mcCancelarOperacion();
      } else {
        mcCancelarEdicion();
      }
    });
  }

  /* Botones de verificación. */
  var btnVerificar = document.getElementById('mcBtnVerificar');

  if (btnVerificar) {
    btnVerificar.addEventListener('click', mcVerificarCodigo);
  }

  var btnReenviar = document.getElementById('mcBtnReenviar');

  if (btnReenviar) {
    btnReenviar.addEventListener('click', mcReenviarCodigo);
  }

  /* Submit del formulario de edición (Enter). */
  var form = document.getElementById('mcFormEdicion');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      mcGuardar();
    });
  }

  /* Submit del formulario de verificación (Enter). */
  var formVerif = document.getElementById('mcFormVerificacion');

  if (formVerif) {
    formVerif.addEventListener('submit', function (event) {
      event.preventDefault();
      mcVerificarCodigo();
    });
  }

  /* Solo números en el campo de código + limpieza de errores. */
  var campoCodigo = document.getElementById('mcCodigo');

  if (campoCodigo) {
    campoCodigo.addEventListener('input', function () {
      campoCodigo.value = campoCodigo.value.replace(/\D/g, '').slice(0, 6);
      mcMostrarError('codigo-verif', '');
    });

    campoCodigo.addEventListener('paste', function (event) {
      var texto = (event.clipboardData || window.clipboardData).getData('text');
      var limpio = String(texto).replace(/\D/g, '').slice(0, 6);

      if (limpio.length === 6) {
        event.preventDefault();
        campoCodigo.value = limpio;
        mcVerificarCodigo();
      }
    });
  }

  /* Limpieza de errores al escribir en el formulario. */
  ['mcNombre', 'mcApellido', 'mcTelefono', 'mcEmail'].forEach(function (id) {
    var input = document.getElementById(id);

    if (input) {
      input.addEventListener('input', function () {
        var mapa = {
          mcNombre: 'nombre',
          mcApellido: 'apellido',
          mcTelefono: 'telefono',
          mcEmail: 'email'
        };

        mcMostrarError(mapa[id], '');
      });
    }
  });

  /* Carga inicial. */
  mcCargar();
});
