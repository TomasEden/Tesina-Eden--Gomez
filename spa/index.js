/* ═══════════════════════════════════════
   SPA M — index.js
   ═══════════════════════════════════════ */

// ── Datos de servicios destacados ──────────────────────────────────────────
const servicios = [
  {
    nombre: 'Masaje Relajante',
    descripcion: 'Técnica sueca de 60 min para liberar tensiones.',
    duracion: '60 min',
    precio: 5000,
    img: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80'
  },
  {
    nombre: 'Tratamiento Facial',
    descripcion: 'Limpieza profunda e hidratación intensiva.',
    duracion: '30 min',
    precio: 3000,
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80'
  },
  {
    nombre: 'Jacuzzi Privado',
    descripcion: 'Sesión privada de relajación en jacuzzi.',
    duracion: '80 min',
    precio: 5000,
    img: 'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=600&q=80'
  }
];

// ── Datos de productos destacados ──────────────────────────────────────────
const productos = [
  {
    nombre: 'Crema Hidratante',
    categoria: 'Facial · Piel Seca',
    precio: 500,
    stock: true,
    img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80'
  },
  {
    nombre: 'Aceite de Lavanda',
    categoria: 'Facial · Piel Mixta',
    precio: 500,
    stock: true,
    img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80'
  },
  {
    nombre: 'Sérum de Crecimiento',
    categoria: 'Capilar',
    precio: 500,
    stock: false,
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80'
  },
  {
    nombre: 'Kit Capilar',
    categoria: 'Cuidado Completo',
    precio: 800,
    stock: true,
    img: 'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=400&q=80'
  }
];

// ── Navbar: efecto sombra al hacer scroll ───────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

// ── Carrito: actualizar badge con cantidad ──────────────────────────────────
function actualizarContador() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  document.getElementById('contador').textContent = carrito.length;
}

// ── Toast de confirmación ───────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = '✅ ' + msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Renderizar servicios destacados ────────────────────────────────────────
function renderServicios() {
  const grid = document.getElementById('serviciosGrid');
  servicios.forEach(s => {
    grid.innerHTML += `
      <div class="service-card">
        <img class="service-img" src="${s.img}" alt="${s.nombre}"/>
        <div class="service-body">
          <div class="service-meta">
            <span class="service-duration">⏱ ${s.duracion}</span>
            <span class="service-price">$${s.precio.toLocaleString()}</span>
          </div>
          <h3 class="service-name">${s.nombre}</h3>
          <p class="service-desc">${s.descripcion}</p>
          <a href="turnos.html" class="btn-reservar">Reservar turno</a>
        </div>
      </div>`;
  });
}

// ── Renderizar productos destacados ────────────────────────────────────────
function renderProductos() {
  const grid = document.getElementById('productosGrid');
  productos.forEach(p => {
    const btnHTML = p.stock
      ? `<button class="btn-add" onclick="agregarProducto('${p.nombre}', ${p.precio})">+ Carrito</button>`
      : `<button class="btn-add sin-stock" disabled>Sin stock</button>`;

    grid.innerHTML += `
      <div class="product-card">
        <img class="product-img" src="${p.img}" alt="${p.nombre}"/>
        <div class="product-body">
          <p class="product-cat">${p.categoria}</p>
          <h3 class="product-name">${p.nombre}</h3>
          <div class="product-footer">
            <span class="product-price">$${p.precio.toLocaleString()}</span>
            ${btnHTML}
          </div>
        </div>
      </div>`;
  });
}

// ── Agregar producto al carrito ────────────────────────────────────────────
function agregarProducto(nombre, precio) {
  if (!requireSesion("agregar productos al carrito")) return;
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.push({
    nombre,
    precio,
    tipo: 'producto',
    img: 'https://via.placeholder.com/80'
  });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContador();
  showToast(nombre + ' agregado al carrito');
}

// ── Formulario de contacto ─────────────────────────────────────────────────
function enviarConsulta() {
  showToast('¡Mensaje enviado! Te contactamos pronto 🌸');
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarContador();
  renderServicios();
  renderProductos();
});
