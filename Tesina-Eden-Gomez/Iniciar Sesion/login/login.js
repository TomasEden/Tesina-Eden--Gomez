document.getElementById("loginBtn").addEventListener("click", () => {

  const email = document.getElementById("mail").value;
  const password = document.getElementById("password").value;

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    document.getElementById("mensaje").textContent = "No hay usuarios registrados";
    return;
  }

  if (email === usuario.email && password === usuario.password) {
    document.getElementById("mensaje").textContent = "Login correcto";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

  } else {
    document.getElementById("mensaje").textContent = "Datos incorrectos";
  }
});