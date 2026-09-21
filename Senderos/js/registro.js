/* ═══════════════════════════════════════
   Senderos — registro.js
   Registro conectado a la API
   ═══════════════════════════════════════ */

let datosPaso1 = {};

const API_REGISTRO = '../api/registro.php';


/* =========================================================
   FUERZA DE CONTRASEÑA
   ========================================================= */

function actualizarFuerzaPassword() {
  const password =
    document.getElementById('password');

  const strength =
    document.getElementById('pwStrength');

  if (!password || !strength) {
    return;
  }

  const value = password.value;

  strength.className = 'pw-strength';
  strength.textContent = '';

  if (!value) {
    return;
  }

  const fuerte =
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value);

  const media =
    value.length >= 6;

  if (fuerte) {
    strength.classList.add('strong');

    strength.innerHTML = `
      ${iconoHTML('check.svg', 13)}
      Contraseña fuerte
    `;

  } else if (media) {
    strength.classList.add('medium');

    strength.innerHTML = `
      ${iconoHTML('advertencia.svg', 13)}
      Contraseña regular
    `;

  } else {
    strength.classList.add('weak');

    strength.innerHTML = `
      ${iconoHTML('x.svg', 13)}
      Contraseña débil
    `;
  }
}


/* =========================================================
   PASO 1
   ========================================================= */

function irPaso2() {
  limpiarErrores([
    'nombre',
    'apellido',
    'telefono',
    'nacimiento'
  ]);

  const nombre =
    document
      .getElementById('nombre')
      ?.value
      .trim() || '';

  const apellido =
    document
      .getElementById('apellido')
      ?.value
      .trim() || '';

  const telefono =
    document
      .getElementById('telefono')
      ?.value
      .trim() || '';

  const nacimiento =
    document
      .getElementById('nacimiento')
      ?.value || '';

  let valido = true;


  if (!nombre) {
    setFieldError(
      'nombre',
      'El nombre es obligatorio.'
    );

    valido = false;
  }


  if (!apellido) {
    setFieldError(
      'apellido',
      'El apellido es obligatorio.'
    );

    valido = false;
  }


  if (!telefono) {
    setFieldError(
      'telefono',
      'El teléfono es obligatorio.'
    );

    valido = false;
  }


  if (!nacimiento) {
    setFieldError(
      'nacimiento',
      'La fecha de nacimiento es obligatoria.'
    );

    valido = false;
  }


  if (!valido) {
    const primerCampoInvalido =
      document.querySelector(
        '#nombre.error, ' +
        '#apellido.error, ' +
        '#telefono.error, ' +
        '#nacimiento.error'
      );

    primerCampoInvalido?.focus();

    return;
  }


  datosPaso1 = {
    nombre,
    apellido,
    telefono,
    nacimiento
  };


  document
    .getElementById('step1')
    ?.classList.add('hidden');

  document
    .getElementById('step2')
    ?.classList.remove('hidden');


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


/* =========================================================
   VOLVER AL PASO 1
   ========================================================= */

function irPaso1() {
  document
    .getElementById('step2')
    ?.classList.add('hidden');

  document
    .getElementById('step1')
    ?.classList.remove('hidden');

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


/* =========================================================
   REGISTRAR
   ========================================================= */

async function registrar() {
  limpiarErrores([
    'email',
    'password',
    'confirmar'
  ]);

  setFieldError(
    'terminos',
    ''
  );

  const errorTerminos =
    document.getElementById('err-terminos');

  if (errorTerminos) {
    errorTerminos.textContent = '';
  }


  const email =
    document
      .getElementById('email')
      ?.value
      .trim() || '';

  const password =
    document
      .getElementById('password')
      ?.value || '';

  const confirmar =
    document
      .getElementById('confirmar')
      ?.value || '';

  const terminos =
    document
      .getElementById('terminos')
      ?.checked || false;

  let valido = true;


  /* ---------- Email ---------- */

  if (!email) {
    setFieldError(
      'email',
      'El email es obligatorio.'
    );

    valido = false;

  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    setFieldError(
      'email',
      'Ingresá un email válido.'
    );

    valido = false;
  }


  /* ---------- Contraseña ---------- */

  if (!password) {
    setFieldError(
      'password',
      'La contraseña es obligatoria.'
    );

    valido = false;

  } else if (password.length < 6) {
    setFieldError(
      'password',
      'La contraseña debe tener al menos 6 caracteres.'
    );

    valido = false;
  }


  /* ---------- Confirmación ---------- */

  if (!confirmar) {
    setFieldError(
      'confirmar',
      'Confirmá tu contraseña.'
    );

    valido = false;

  } else if (password !== confirmar) {
    setFieldError(
      'confirmar',
      'Las contraseñas no coinciden.'
    );

    valido = false;
  }


  /* ---------- Términos ---------- */

  if (!terminos) {
    const error =
      document.getElementById('err-terminos');

    if (error) {
      error.textContent =
        'Debés aceptar los términos y condiciones.';
    }

    valido = false;
  }


  if (!valido) {
    const primerCampoInvalido =
      document.querySelector(
        '#email.error, ' +
        '#password.error, ' +
        '#confirmar.error'
      );

    primerCampoInvalido?.focus();

    return;
  }


  /* ---------- Datos del paso 1 ---------- */

  if (
    !datosPaso1.nombre ||
    !datosPaso1.apellido ||
    !datosPaso1.telefono ||
    !datosPaso1.nacimiento
  ) {
    irPaso1();
    return;
  }


  const boton =
    document.getElementById(
      'btnRegistrar'
    );

  setLoading(
    boton,
    true,
    'Creando cuenta...'
  );


  try {
    const respuesta =
      await fetch(
        API_REGISTRO,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'Accept':
              'application/json'
          },

          credentials: 'same-origin',

          body: JSON.stringify({
            nombre:
              datosPaso1.nombre,

            apellido:
              datosPaso1.apellido,

            telefono:
              datosPaso1.telefono,

            nacimiento:
              datosPaso1.nacimiento,

            email,

            password
          })
        }
      );


    let data;

    try {
      data =
        await respuesta.json();

    } catch {
      throw new Error(
        'El servidor devolvió una respuesta inválida.'
      );
    }


    /*
      Un 500 es un error del servidor.
      Los errores de validación de la API
      permanecen como errores inline.
    */

    if (respuesta.status >= 500) {
      throw new Error(
        'El servidor no está disponible.'
      );
    }


    if (!respuesta.ok || !data.ok) {
      const mensaje =
        data?.mensaje ||
        data?.error ||
        data?.message ||
        'No se pudo crear la cuenta.';


      if (respuesta.status === 409) {
        const bajo = mensaje.toLowerCase();

        if (bajo.includes('teléfono') || bajo.includes('telefono')) {
          setFieldError(
            'telefono',
            mensaje
          );

          irPaso1();

          document
            .getElementById('telefono')
            ?.focus();
        } else {
          setFieldError(
            'email',
            mensaje
          );

          document
            .getElementById('email')
            ?.focus();
        }

        return;
      }


      setFieldError(
        'email',
        mensaje
      );

      return;
    }


    /* ---------- Éxito ---------- */

    document
      .getElementById('step2')
      ?.classList.add('hidden');

    document
      .getElementById('stepExito')
      ?.classList.remove('hidden');


    setTimeout(() => {
      window.location.href =
        'login.html';
    }, 2500);


  } catch (error) {

    mostrarErrorConexion(() => {
      registrar();
    });

  } finally {

    setLoading(
      boton,
      false
    );
  }
}


/* =========================================================
   FECHA DE NACIMIENTO (día / mes / año)
   ========================================================= */

function prepararNacimiento() {
  const dia = document.getElementById('nacDia');
  const mes = document.getElementById('nacMes');
  const anio = document.getElementById('nacAnio');
  const oculto = document.getElementById('nacimiento');

  if (!dia || !mes || !anio || !oculto) {
    return;
  }

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  meses.forEach((nombre, i) => {
    const opt = document.createElement('option');
    opt.value = String(i + 1).padStart(2, '0');
    opt.textContent = nombre;
    mes.appendChild(opt);
  });

  const anioActual = new Date().getFullYear();

  for (let a = anioActual; a >= anioActual - 100; a--) {
    const opt = document.createElement('option');
    opt.value = String(a);
    opt.textContent = String(a);
    anio.appendChild(opt);
  }

  function diasDelMes() {
    const m = parseInt(mes.value, 10);
    const a = parseInt(anio.value, 10);

    if (!m || !a) {
      return 31;
    }

    return new Date(a, m, 0).getDate();
  }

  function refrescarDias() {
    const max = diasDelMes();
    const previo = dia.value;

    while (dia.options.length > 1) {
      dia.remove(1);
    }

    for (let d = 1; d <= max; d++) {
      const opt = document.createElement('option');
      opt.value = String(d).padStart(2, '0');
      opt.textContent = String(d);
      dia.appendChild(opt);
    }

    if (previo && Number(previo) <= max) {
      dia.value = previo;
    }
  }

  function sincronizar() {
    refrescarDias();

    if (dia.value && mes.value && anio.value) {
      oculto.value = anio.value + '-' + mes.value + '-' + dia.value;
    } else {
      oculto.value = '';
    }

    setFieldError('nacimiento', '');
  }

  [dia, mes, anio].forEach(sel => {
    sel.addEventListener('change', sincronizar);
  });

  refrescarDias();
}


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    prepararNacimiento();

    const btnPaso2 = document.getElementById('btnPaso2');

    if (btnPaso2) {
      btnPaso2.addEventListener('click', irPaso2);
    }

    const btnVolver1 = document.getElementById('btnVolver1');

    if (btnVolver1) {
      btnVolver1.addEventListener('click', irPaso1);
    }

    const btnRegistrar = document.getElementById('btnRegistrar');

    if (btnRegistrar) {
      btnRegistrar.addEventListener('click', registrar);
    }

    document.querySelectorAll('[data-toggle-pw]').forEach(boton => {
      if (typeof iconoHTML === 'function' && !boton.innerHTML.trim()) {
        boton.innerHTML = iconoHTML('ver.svg', 14);
      }

      boton.addEventListener('click', () => {
        togglePassword(boton.dataset.togglePw, boton);
      });
    });

    const password =
      document.getElementById(
        'password'
      );


    if (password) {
      password.addEventListener(
        'input',
        actualizarFuerzaPassword
      );
    }


    [
      'nombre',
      'apellido',
      'telefono',
      'nacimiento',
      'email',
      'password',
      'confirmar'
    ].forEach(inputId => {
      const input =
        document.getElementById(
          inputId
        );

      if (!input) {
        return;
      }

      input.addEventListener(
        'input',
        () => {
          setFieldError(
            inputId,
            ''
          );
        }
      );
    });


    const terminos =
      document.getElementById(
        'terminos'
      );

    terminos?.addEventListener(
      'change',
      () => {
        const error =
          document.getElementById(
            'err-terminos'
          );

        if (error) {
          error.textContent = '';
        }
      }
    );

  }
);