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


  showToast(nombre + ' agregado al carrito');
}

// ── Formulario de contacto ─────────────────────────────────────────────────
function enviarConsulta() {
  showToast('¡Mensaje enviado! Te contactamos pronto 🌸');
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  renderServicios();
  renderProductos();
});
