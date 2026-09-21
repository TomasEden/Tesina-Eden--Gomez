/* ═══════════════════════════════════════
   Senderos — login.js
   Login conectado a la API (recordarme real + redirectAfterLogin).
   ═══════════════════════════════════════ */

var LOGIN_API = '../api/login.php';

function mostrarErrorLogin(idCampo, mensaje) {
  if (typeof window.setFieldError === 'function') {
    window.setFieldError(idCampo, mensaje);
  }
}

function limpiarErroresLogin() {
  if (typeof window.limpiarErrores === 'function') {
    window.limpiarErrores(['email', 'password']);
  }
}

function olvidoPassword(event) {
  if (event) {
    event.preventDefault();
  }

  var campoEmail = document.getElementById('email');
  var email = campoEmail ? campoEmail.value.trim() : '';

  if (!email) {
    mostrarErrorLogin('email', 'Ingresá tu email para recuperar la contraseña.');

    if (campoEmail) {
      campoEmail.focus();
    }

    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mostrarErrorLogin('email', 'Ingresá un email válido.');

    if (campoEmail) {
      campoEmail.focus();
    }

    return;
  }

  /*
    La recuperación de contraseña todavía
    no tiene un endpoint propio en la API.
    No se simula ninguna recuperación.
  */

  mostrarErrorLogin(
    'email',
    'Para recuperar tu contraseña, comunicate con Senderos por WhatsApp.'
  );
}

function iniciarSesion() {
  limpiarErroresLogin();

  var campoEmail = document.getElementById('email');
  var campoPassword = document.getElementById('password');

  var email = campoEmail ? campoEmail.value.trim() : '';
  var password = campoPassword ? campoPassword.value : '';
  var recordar = document.getElementById('recordar');
  var recordarme = recordar ? recordar.checked : false;

  var valido = true;

  if (!email) {
    mostrarErrorLogin('email', 'El email es obligatorio.');
    valido = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mostrarErrorLogin('email', 'Ingresá un email válido.');
    valido = false;
  }

  if (!password) {
    mostrarErrorLogin('password', 'La contraseña es obligatoria.');
    valido = false;
  }

  if (!valido) {
    var primerCampoInvalido = document.querySelector('#email.error, #password.error');

    if (primerCampoInvalido) {
      primerCampoInvalido.focus();
    }

    return Promise.resolve();
  }

  var boton = document.getElementById('btnLogin');

  if (typeof window.setLoading === 'function') {
    window.setLoading(boton, true, 'Ingresando...');
  }

  return fetch(LOGIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ email: email, password: password, recordarme: recordarme })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (data) {
        if (respuesta.status >= 500) {
          throw new Error('El servidor no está disponible.');
        }

        if (!respuesta.ok || !data.ok) {
          var mensaje =
            (data && (data.mensaje || data.error || data.message)) ||
            'Email o contraseña incorrectos.';

          mostrarErrorLogin('email', mensaje);

          if (campoEmail) {
            campoEmail.focus();
          }

          return null;
        }

        if (!data.usuario) {
          throw new Error('El servidor no devolvió los datos del usuario.');
        }

        return data.usuario;
      });
    })
    .then(function (usuario) {
      if (!usuario) {
        return;
      }

      /*
        El backend ya creó la sesión PHP (con cookie larga si
        se tildó "recordarme"). Acá solo se cachea para la UI;
        la fuente de verdad sigue siendo api/sesion.php.
      */
      try {
        window.localStorage.setItem('senderos-sesion', JSON.stringify(usuario));
        window.localStorage.removeItem('sesion');
        window.sessionStorage.removeItem('sesion');
      } catch (e) {}

      var redirect = null;

      try {
        redirect =
          window.localStorage.getItem('redirectAfterLogin') ||
          window.sessionStorage.getItem('redirectAfterLogin') ||
          null;
      } catch (e) {}

      try {
        window.localStorage.removeItem('redirectAfterLogin');
        window.sessionStorage.removeItem('redirectAfterLogin');
      } catch (e) {}

      if (!redirect) {
        redirect = usuario.rol === 'admin' ? 'admin-dashboard.html' : 'index.html';
      }

      window.location.href = redirect;
    })
    .catch(function (error) {
      if (
        error &&
        (error.message === 'El servidor no está disponible.' ||
          error.message === 'Failed to fetch')
      ) {
        if (typeof window.mostrarErrorConexion === 'function') {
          window.mostrarErrorConexion(iniciarSesion);
          return;
        }
      }

      if (error && error.message) {
        mostrarErrorLogin('email', error.message);
      }
    })
    .finally(function () {
      if (typeof window.setLoading === 'function') {
        window.setLoading(boton, false);
      }
    });
}

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('loginForm');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      iniciarSesion();
    });
  }

  var olvido = document.getElementById('linkOlvido');

  if (olvido) {
    olvido.addEventListener('click', olvidoPassword);
  }

  var botonPassword = document.getElementById('btnTogglePw') || document.querySelector('.toggle-pw');

  if (botonPassword) {
    if (typeof window.iconoHTML === 'function') {
      botonPassword.innerHTML = window.iconoHTML('ver.svg', 14);
    }

    botonPassword.addEventListener('click', function () {
      if (typeof window.togglePassword === 'function') {
        window.togglePassword('password', botonPassword);
      }
    });
  }

  ['email', 'password'].forEach(function (id) {
    var input = document.getElementById(id);

    if (!input) {
      return;
    }

    input.addEventListener('input', function () {
      if (typeof window.setFieldError === 'function') {
        window.setFieldError(id, '');
      }
    });
  });
});
