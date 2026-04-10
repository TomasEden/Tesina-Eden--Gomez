/* SPA M — admin-login.js */

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

function togglePw() {
  const input = document.getElementById('password');
  const btn   = document.querySelector('.toggle-pw');
  input.type  = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

function setLoading(v) {
  const btn    = document.getElementById('btnLogin');
  const text   = document.getElementById('btnText');
  const loader = document.getElementById('btnLoader');
  btn.disabled = v;
  text.textContent = v ? 'Verificando...' : 'Ingresar al panel';
  loader.classList.toggle('hidden', !v);
}

function mostrarError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function loginAdmin() {
  mostrarError('err-usuario', '');
  mostrarError('err-password', '');
  document.getElementById('usuario').classList.remove('error');
  document.getElementById('password').classList.remove('error');

  const usuario  = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value;
  let valido = true;

  if (!usuario) {
    mostrarError('err-usuario', 'Ingresá el usuario');
    document.getElementById('usuario').classList.add('error');
    valido = false;
  }
  if (!password) {
    mostrarError('err-password', 'Ingresá la contraseña');
    document.getElementById('password').classList.add('error');
    valido = false;
  }
  if (!valido) return;

  setLoading(true);
  setTimeout(() => {
    if (usuario !== ADMIN_USER || password !== ADMIN_PASS) {
      setLoading(false);
      mostrarError('err-password', 'Usuario o contraseña incorrectos');
      document.getElementById('password').classList.add('error');
      return;
    }
    sessionStorage.setItem('adminSesion', JSON.stringify({ usuario, loginAt: new Date().toISOString() }));
    window.location.href = 'admin-dashboard.html';
  }, 900);
}

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adminSesion')) window.location.href = 'admin-dashboard.html';
  ['usuario', 'password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') loginAdmin(); });
  });
});
