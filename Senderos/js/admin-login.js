/* =========================================================
   SENDEROS — ADMIN LOGIN
   ========================================================= */

const API_LOGIN = '../api/login.php';
const API_SESION = '../api/sesion.php';

let usuarioInput;
let passwordInput;
let btnLogin;
let btnText;
let btnLoader;
let togglePassword;
let loginError;


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    usuarioInput = document.getElementById('usuario');
    passwordInput = document.getElementById('password');
    btnLogin = document.getElementById('btnLogin');
    btnText = document.getElementById('btnText');
    btnLoader = document.getElementById('btnLoader');
    togglePassword = document.getElementById('togglePassword');
    loginError = document.getElementById('loginError');

    if (!usuarioInput || !passwordInput || !btnLogin) {
        return;
    }

    verificarSesionActual();

    usuarioInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            loginAdmin();
        }
    });

    passwordInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            loginAdmin();
        }
    });

    if (togglePassword) {
        togglePassword.addEventListener('click', togglePw);
    }

    btnLogin.addEventListener('click', loginAdmin);
});


/* =========================================================
   VERIFICAR SESIÓN ACTUAL
   ========================================================= */

async function verificarSesionActual() {

    try {

        const response = await fetch(
            API_SESION,
            {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store'
            }
        );

        const data = await response.json();

        if (
            data &&
            data.ok &&
            data.logueado &&
            data.usuario &&
            data.usuario.rol === 'admin'
        ) {
            window.location.href = 'admin-dashboard.html';
        }

    } catch (error) {
    }
}


/* =========================================================
   MOSTRAR / OCULTAR CONTRASEÑA
   ========================================================= */

function togglePw() {

    if (!passwordInput) {
        return;
    }

    const mostrar = passwordInput.type === 'password';

    passwordInput.type = mostrar ? 'text' : 'password';

    if (togglePassword) {

        togglePassword.setAttribute(
            'aria-label',
            mostrar
                ? 'Ocultar contraseña'
                : 'Mostrar contraseña'
        );

        togglePassword.innerHTML = mostrar
            ? `
                <img
                    src="../img/icons/nover.svg"
                    alt=""
                    width="14"
                    height="14"
                >
            `
            : `
                <img
                    src="../img/icons/ver.svg"
                    alt=""
                    width="14"
                    height="14"
                >
            `;
    }
}


/* =========================================================
   CARGANDO
   ========================================================= */

function setLoading(loading) {

    if (!btnLogin) {
        return;
    }

    btnLogin.disabled = loading;

    if (btnText) {
        btnText.textContent = loading
            ? 'Verificando...'
            : 'Ingresar al panel';
    }

    if (btnLoader) {
        btnLoader.classList.toggle('hidden', !loading);
    }
}


/* =========================================================
   ERRORES
   ========================================================= */

function mostrarErrorCampo(id, mensaje) {

    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = mensaje || '';
    }
}


function limpiarErrores() {

    mostrarErrorCampo('err-usuario', '');
    mostrarErrorCampo('err-password', '');

    if (loginError) {
        loginError.textContent = '';
        loginError.classList.remove('show');
    }

    if (usuarioInput) {
        usuarioInput.classList.remove('error');
    }

    if (passwordInput) {
        passwordInput.classList.remove('error');
    }
}


function mostrarErrorGeneral(mensaje) {

    if (!loginError) {
        return;
    }

    loginError.textContent = mensaje;
    loginError.classList.add('show');
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginAdmin() {

    limpiarErrores();

    if (!usuarioInput || !passwordInput) {
        return;
    }

    const email = usuarioInput.value.trim();
    const password = passwordInput.value;

    let valido = true;

    if (!email) {

        mostrarErrorCampo(
            'err-usuario',
            'Ingresá el email del administrador'
        );

        usuarioInput.classList.add('error');

        valido = false;

    } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        mostrarErrorCampo(
            'err-usuario',
            'Ingresá un email válido'
        );

        usuarioInput.classList.add('error');

        valido = false;
    }

    if (!password) {

        mostrarErrorCampo(
            'err-password',
            'Ingresá la contraseña'
        );

        passwordInput.classList.add('error');

        valido = false;
    }

    if (!valido) {
        return;
    }

    setLoading(true);

    try {

        const response = await fetch(
            API_LOGIN,
            {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }
        if (!response.ok || !data || !data.ok) {

            const mensaje =
                data?.mensaje ||
                data?.error ||
                `Error HTTP ${response.status}`;

            mostrarErrorGeneral(mensaje);

            passwordInput.classList.add('error');

            setLoading(false);

            return;
        }

        const usuario = data.usuario;

        if (!usuario) {

            mostrarErrorGeneral(
                'El servidor inició sesión pero no devolvió los datos del usuario.'
            );

            setLoading(false);

            return;
        }

        if (usuario.rol !== 'admin') {

            mostrarErrorGeneral(
                'Esta cuenta no tiene permisos de administrador.'
            );

            setLoading(false);

            return;
        }

        window.location.href = 'admin-dashboard.html';

    } catch (error) {

        /* log removido en limpieza final */;

        mostrarErrorGeneral(
            'No se pudo conectar con el servidor. Verificá Apache, PHP y MySQL.'
        );

        setLoading(false);
    }
}