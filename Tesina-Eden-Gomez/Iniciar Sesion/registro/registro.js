document.getElementById("registroBtn").addEventListener("click", () => {

  const nombre = document.getElementById("nombre").value;
  const email = document.getElementById("email").value;
  const telefono = document.getElementById("telefono").value;
  const password = document.getElementById("password").value;

  if (!nombre || !email || !telefono || !password) {
    document.getElementById("mensaje").textContent = "Completá todos los campos";
    return;
  }

  const usuario = {
    nombre,
    email,
    telefono,
    password
  };

  localStorage.setItem("usuario", JSON.stringify(usuario));

  document.getElementById("mensaje").textContent = "Cuenta creada correctamente";

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
});