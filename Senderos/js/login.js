/* ═══════════════════════════════════════
   SPA M — login.js
   ═══════════════════════════════════════ */

// ── Mostrar / ocultar contraseña ────────────────────────────────────────────
function togglePassword() {
  const input = document.getElementById('password');
  const btn   = document.querySelector('.toggle-pw');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// ── Helpers de validación ───────────────────────────────────────────────────
function mostrarError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function limpiarErrores() {
  mostrarError('err-email', '');
  mostrarError('err-password', '');
  document.getElementById('email').classList.remove('error');
  document.getElementById('password').classList.remove('error');
}

// ── Estado del botón ────────────────────────────────────────────────────────
function setLoading(loading) {
  const btn    = document.getElementById('btnLogin');
  const text   = document.getElementById('btnText');
  const loader = document.getElementById('btnLoader');
  btn.disabled = loading;
  text.textContent = loading ? 'Ingresando...' : 'Ingresar';
  loader.classList.toggle('hidden', !loading);
}

// ── Olvidé mi contraseña ────────────────────────────────────────────────────
function olvidoPassword(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (!email) {
    mostrarError('err-email', 'Ingresá tu email para recuperar la contraseña');
    document.getElementById('email').classList.add('error');
    return;
  }
  // En una app real aquí iría la llamada al backend
  alert(`📧 Si el email "${email}" está registrado, recibirás un enlace para recuperar tu contraseña.`);
}

// ── Iniciar sesión ──────────────────────────────────────────────────────────
function iniciarSesion() {
  limpiarErrores();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const recordar = document.getElementById('recordar').checked;

  let valido = true;

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    mostrarError('err-email', 'El email es obligatorio');
    document.getElementById('email').classList.add('error');
    valido = false;
  } else if (!emailRegex.test(email)) {
    mostrarError('err-email', 'Ingresá un email válido');
    document.getElementById('email').classList.add('error');
    valido = false;
  }

  // Validar contraseña
  if (!password) {
    mostrarError('err-password', 'La contraseña es obligatoria');
    document.getElementById('password').classList.add('error');
    valido = false;
  }

  if (!valido) return;

  // Simular carga
  setLoading(true);

  setTimeout(() => {
    // Verificar credenciales contra localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (!usuario) {
      setLoading(false);
      mostrarError('err-email', 'No existe ninguna cuenta registrada');
      document.getElementById('email').classList.add('error');
      mostrarDemoHint(null);
      return;
    }

    if (usuario.email !== email) {
      setLoading(false);
      mostrarError('err-email', 'Email incorrecto');
      document.getElementById('email').classList.add('error');
      return;
    }

    if (usuario.password !== password) {
      setLoading(false);
      mostrarError('err-password', 'Contraseña incorrecta');
      document.getElementById('password').classList.add('error');
      return;
    }

    // ✅ Login correcto
    const sesion = {
      nombre:  usuario.nombre,
      apellido: usuario.apellido,
      email:   usuario.email,
      telefono: usuario.telefono,
      loginAt: new Date().toISOString()
    };

    // Recordar sesión o solo para esta pestaña
    if (recordar) {
      localStorage.setItem('sesion', JSON.stringify(sesion));
    } else {
      sessionStorage.setItem('sesion', JSON.stringify(sesion));
    }

    // Redirigir a la página desde donde vino, o al index
    const redirect = sessionStorage.getItem('redirectAfterLogin') || localStorage.getItem('redirectAfterLogin') || 'index.html';
    sessionStorage.removeItem('redirectAfterLogin');
    localStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect;
  }, 1000);
}

// ── Hint de demo si no hay usuario registrado ───────────────────────────────
function mostrarDemoHint(usuario) {
  const hint = document.getElementById('demoHint');
  if (!usuario) {
    hint.textContent = '💡 No hay ninguna cuenta creada aún. Podés registrarte primero.';
    hint.classList.remove('hidden');
  }
}

// ── Enter para enviar ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Si ya hay sesión activa, redirigir directo
  const sesionActiva =
    JSON.parse(localStorage.getItem('sesion')) ||
    JSON.parse(sessionStorage.getItem('sesion'));

  if (sesionActiva) {
    window.location.href = 'index.html';
    return;
  }

  // Enter en cualquier campo dispara el login
  ['email', 'password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') iniciarSesion();
    });
  });

  // Mostrar hint si no hay usuario registrado
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) mostrarDemoHint(null);
});
