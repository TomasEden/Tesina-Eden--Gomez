/* ═══════════════════════════════════════
   SPA M — registro.js
   ═══════════════════════════════════════ */

// ── Datos del paso 1 (se guardan al avanzar) ────────────────────────────────
let datosPaso1 = {};

// ── Mostrar / ocultar contraseña ────────────────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// ── Indicador de fuerza de contraseña ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('password');
  const pwStrength = document.getElementById('pwStrength');

  if (pwInput) {
    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      pwStrength.className = 'pw-strength';
      if (!val) { pwStrength.textContent = ''; return; }

      const fuerte = val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val);
      const media  = val.length >= 6;

      if (fuerte) {
        pwStrength.classList.add('strong');
        pwStrength.textContent = '✅ Contraseña fuerte';
      } else if (media) {
        pwStrength.classList.add('medium');
        pwStrength.textContent = '⚠️ Contraseña regular';
      } else {
        pwStrength.classList.add('weak');
        pwStrength.textContent = '❌ Contraseña débil';
      }
    });
  }
});

// ── Helpers de validación ───────────────────────────────────────────────────
function mostrarError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function limpiarErrores(...ids) {
  ids.forEach(id => mostrarError(id, ''));
}
function marcarError(inputId, errorId, msg) {
  const input = document.getElementById(inputId);
  if (input) input.classList.add('error');
  mostrarError(errorId, msg);
}
function limpiarMarca(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.classList.remove('error');
}

// ── Ir al paso 2 (valida paso 1) ───────────────────────────────────────────
function irPaso2() {
  limpiarErrores('err-nombre', 'err-apellido', 'err-telefono', 'err-nacimiento');
  limpiarMarca('nombre'); limpiarMarca('apellido');
  limpiarMarca('telefono'); limpiarMarca('nacimiento');

  const nombre    = document.getElementById('nombre').value.trim();
  const apellido  = document.getElementById('apellido').value.trim();
  const telefono  = document.getElementById('telefono').value.trim();
  const nacimiento = document.getElementById('nacimiento').value;

  let valido = true;

  if (!nombre) {
    marcarError('nombre', 'err-nombre', 'El nombre es obligatorio');
    valido = false;
  }
  if (!apellido) {
    marcarError('apellido', 'err-apellido', 'El apellido es obligatorio');
    valido = false;
  }
  if (!telefono) {
    marcarError('telefono', 'err-telefono', 'El teléfono es obligatorio');
    valido = false;
  }
  if (!nacimiento) {
    marcarError('nacimiento', 'err-nacimiento', 'La fecha de nacimiento es obligatoria');
    valido = false;
  }

  if (!valido) return;

  // Guardar datos del paso 1
  datosPaso1 = { nombre, apellido, telefono, nacimiento };

  // Cambiar al paso 2 con animación
  const paso1 = document.getElementById('step1');
  const paso2 = document.getElementById('step2');
  paso1.classList.add('hidden');
  paso2.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Volver al paso 1 ────────────────────────────────────────────────────────
function irPaso1() {
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
}

// ── Registrar (valida paso 2 y guarda) ─────────────────────────────────────
function registrar() {
  limpiarErrores('err-email', 'err-password', 'err-confirmar', 'err-terminos');
  limpiarMarca('email'); limpiarMarca('password'); limpiarMarca('confirmar');

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmar = document.getElementById('confirmar').value;
  const terminos = document.getElementById('terminos').checked;

  let valido = true;

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    marcarError('email', 'err-email', 'El email es obligatorio');
    valido = false;
  } else if (!emailRegex.test(email)) {
    marcarError('email', 'err-email', 'Ingresá un email válido');
    valido = false;
  }

  // Contraseña
  if (!password) {
    marcarError('password', 'err-password', 'La contraseña es obligatoria');
    valido = false;
  } else if (password.length < 6) {
    marcarError('password', 'err-password', 'Mínimo 6 caracteres');
    valido = false;
  }

  // Confirmar
  if (!confirmar) {
    marcarError('confirmar', 'err-confirmar', 'Confirmá tu contraseña');
    valido = false;
  } else if (password !== confirmar) {
    marcarError('confirmar', 'err-confirmar', 'Las contraseñas no coinciden');
    valido = false;
  }

  // Términos
  if (!terminos) {
    mostrarError('err-terminos', 'Debés aceptar los términos y condiciones');
    valido = false;
  }

  if (!valido) return;

  // Verificar si el email ya está registrado
  const usuarioExistente = JSON.parse(localStorage.getItem('usuario'));
  if (usuarioExistente && usuarioExistente.email === email) {
    marcarError('email', 'err-email', 'Este email ya está registrado');
    return;
  }

  // Guardar usuario en localStorage
  const usuario = {
    ...datosPaso1,
    email,
    password,
    fechaRegistro: new Date().toISOString()
  };
  localStorage.setItem('usuario', JSON.stringify(usuario));

  // Mostrar pantalla de éxito y redirigir
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('stepExito').classList.remove('hidden');

  setTimeout(() => {
    window.location.href = 'login.html';
  }, 2500);
}
