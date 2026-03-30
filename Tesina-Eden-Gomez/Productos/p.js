document.addEventListener("DOMContentLoaded", () => {

  const lista = document.getElementById("listaCarrito");
  const totalEl = document.getElementById("total");
  const contador = document.getElementById("contador");

  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  function render() {
    lista.innerHTML = "";

    let servicios = carrito.filter(i => i.tipo === "servicio");
    let productos = carrito.filter(i => i.tipo === "producto");

    let totalServicios = 0;
    let totalProductos = 0;

    // SERVICIOS
    if (servicios.length) {
      const div = document.createElement("div");
      div.className = "seccion";
      div.innerHTML = "<h2>Servicios</h2>";

      servicios.forEach((item, i) => {
        totalServicios += item.precio;
        div.innerHTML += itemHTML(item, i);
      });

      div.innerHTML += `
        <p><strong>Total: $${totalServicios}</strong></p>
        <button class="btn-seccion" onclick="pagarServicios()">Pagar Servicios</button>
      `;

      lista.appendChild(div);
    }

    // PRODUCTOS
    if (productos.length) {
      const div = document.createElement("div");
      div.className = "seccion";
      div.innerHTML = "<h2>Productos</h2>";

      productos.forEach((item, i) => {
        totalProductos += item.precio;
        div.innerHTML += itemHTML(item, i);
      });

      div.innerHTML += `
        <p><strong>Total: $${totalProductos}</strong></p>
        <button class="btn-seccion" onclick="pagarProductos()">Pagar Productos</button>
      `;

      lista.appendChild(div);
    }

    totalEl.textContent = totalServicios + totalProductos;
    contador.textContent = carrito.length;
  }

  function itemHTML(item, index) {
    return `
      <div class="item-carrito">
        <div class="item-info">
          <img src="${item.img}">
          <div>
            <h3>${item.nombre}</h3>
            <p>$${item.precio}</p>
          </div>
        </div>
        <button class="eliminar" onclick="eliminar(${index})">X</button>
      </div>
    `;
  }

  window.eliminar = (index) => {
    carrito.splice(index, 1);
    guardar();
  };

  window.pagarServicios = () => {
    carrito = carrito.filter(i => i.tipo !== "servicio");
    alert("Pagaste servicios");
    guardar();
  };

  window.pagarProductos = () => {
    carrito = carrito.filter(i => i.tipo !== "producto");
    alert("Pagaste productos");
    guardar();
  };

  document.getElementById("comprarBtn").addEventListener("click", () => {
    if (!carrito.length) return alert("Carrito vacío");

    carrito = [];
    alert("Pagaste todo");
    guardar();
  });

  function guardar() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    render();
  }

  render();
});