/* ═══════════════════════════════════════
   SPA M — productos.js
   ═══════════════════════════════════════ */

// ── Catálogo completo de productos ─────────────────────────────────────────
const PRODUCTOS = [
  {
    id: 1,
    nombre: 'Crema Hidratante',
    categoria: 'Facial',
    desc: 'Hidratación profunda para piel seca. Fórmula enriquecida con ácido hialurónico.',
    precio: 500,
    stock: true,
    badge: 'nuevo',
    badgeText: 'Nuevo',
    img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=80'
  },
  {
    id: 2,
    nombre: 'Aceite de Lavanda',
    categoria: 'Facial',
    desc: 'Aceite esencial para piel mixta. Equilibra y calma la piel sensible.',
    precio: 500,
    stock: true,
    badge: null,
    img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80'
  },
  {
    id: 3,
    nombre: 'Sérum de Crecimiento',
    categoria: 'Capilar',
    desc: 'Estimula el crecimiento del cabello. Con biotina y extractos naturales.',
    precio: 500,
    stock: false,
    badge: null,
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80'
  },
  {
    id: 4,
    nombre: 'Kit Capilar',
    categoria: 'Capilar',
    desc: 'Shampoo + acondicionador + mascarilla. Cuidado completo para tu cabello.',
    precio: 800,
    stock: true,
    badge: 'oferta',
    badgeText: 'Oferta',
    img: 'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=500&q=80'
  },
  {
    id: 5,
    nombre: 'Aceite de Coco',
    categoria: 'Corporal',
    desc: 'Aceite 100% natural para hidratación corporal y capilar.',
    precio: 600,
    stock: true,
    badge: null,
    img: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=500&q=80'
  },
  {
    id: 6,
    nombre: 'Bálsamo Natural',
    categoria: 'Corporal',
    desc: 'Hidratación intensa con manteca de karité y aceite de argán.',
    precio: 450,
    stock: true,
    badge: null,
    img: 'https://images.unsplash.com/photo-1585386959984-a41552231658?w=500&q=80'
  },
  {
    id: 7,
    nombre: 'Mascarilla Facial',
    categoria: 'Facial',
    desc: 'Mascarilla purificante de arcilla blanca. Para todo tipo de piel.',
    precio: 650,
    stock: true,
    badge: 'nuevo',
    badgeText: 'Nuevo',
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80'
  },
  {
    id: 8,
    nombre: 'Contorno de Ojos',
    categoria: 'Facial',
    desc: 'Reduce ojeras y bolsas. Con vitamina C y péptidos activos.',
    precio: 900,
    stock: false,
    badge: null,
    img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500&q=80'
  },
  {
    id: 9,
    nombre: 'Exfoliante Corporal',
    categoria: 'Corporal',
    desc: 'Exfoliante con azúcar y aceites naturales. Piel suave y renovada.',
    precio: 550,
    stock: true,
    badge: null,
    img: 'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=500&q=80'
  }
];

// ── Estado de filtros ───────────────────────────────────────────────────────
let filtroCategoria = 'todas';

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  renderCategorias();
  filtrarProductos();

  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
});

// ── Navbar ──────────────────────────────────────────────────────────────────


`;
    btn.href = 'mis-turnos.html';
  }
}

// ── Toast ───────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Render chips de categoría ───────────────────────────────────────────────
function renderCategorias() {
  const categorias = ['todas', ...new Set(PRODUCTOS.map(p => p.categoria))];
  const container  = document.getElementById('filterCategorias');

  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip' + (cat === 'todas' ? ' active' : '');
    btn.textContent = cat === 'todas' ? 'Todas' : cat;
    btn.dataset.cat = cat;
    btn.addEventListener('click', () => {
      filtroCategoria = cat;
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtrarProductos();
    });
    container.appendChild(btn);
  });
}

// ── Filtrar y ordenar productos ─────────────────────────────────────────────
function filtrarProductos() {
  const precioMax  = parseInt(document.getElementById('rangePrecio').value);
  const soloStock  = document.getElementById('soloStock').checked;
  const orden      = document.getElementById('sortSelect').value;

  document.getElementById('rangeValor').textContent = `$${precioMax.toLocaleString()}`;

  let resultado = PRODUCTOS.filter(p => {
    if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
    if (p.precio > precioMax) return false;
    if (soloStock && !p.stock) return false;
    return true;
  });

  // Ordenar
  if (orden === 'precio-asc')  resultado.sort((a, b) => a.precio - b.precio);
  if (orden === 'precio-desc') resultado.sort((a, b) => b.precio - a.precio);
  if (orden === 'nombre')      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

  renderProductos(resultado);
}

// ── Render grilla ───────────────────────────────────────────────────────────
function renderProductos(lista) {
  // Sincronizar stockQty desde admin si hay cambios guardados
  const adminProds = JSON.parse(localStorage.getItem('adminProductos'));
  if (adminProds) {
    lista = lista.map(p => {
      const admin = adminProds.find(a => a.id === p.id);
      return admin ? { ...p, stockQty: admin.stockQty, stock: admin.stock } : p;
    });
  }
  const grid  = document.getElementById('productsGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('catalogCount');

  grid.innerHTML = '';

  if (lista.length === 0) {
    empty.classList.remove('hidden');
    count.textContent = 'Sin resultados';
    return;
  }

  empty.classList.add('hidden');
  count.textContent = `${lista.length} producto${lista.length !== 1 ? 's' : ''}`;

  lista.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card' + (!p.stock ? ' sin-stock' : '');
    card.style.animationDelay = `${i * 0.06}s`;

    const qty = p.stockQty ?? (p.stock ? 99 : 0);
    let badgeHTML = '';
    if (!p.stock || qty === 0) {
      badgeHTML = `<span class="product-badge sin-stock-badge">Sin stock</span>`;
    } else if (p.badge) {
      badgeHTML = `<span class="product-badge ${p.badge}">${p.badgeText}</span>`;
    }

    const btnHTML = p.stock
      ? `<button class="btn-add" onclick="agregarAlCarrito(${p.id})">+ Carrito</button>`
      : `<button class="btn-add disabled" disabled>Sin stock</button>`;

    card.innerHTML = `
      <a href="producto-detalle.html?id=${p.id}" class="product-img-wrap" style="display:block;text-decoration:none">
        <img class="product-img" src="${p.img}" alt="${p.nombre}"/>
        ${badgeHTML}
      </a>
      <div class="product-body">
        <p class="product-cat">${p.categoria}</p>
        <h3 class="product-name"><a href="producto-detalle.html?id=${p.id}" style="text-decoration:none;color:inherit">${p.nombre}</a></h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="product-price">$${p.precio.toLocaleString()}</span>
          ${btnHTML}
        </div>
      </div>`;

    grid.appendChild(card);
  });
}

// ── Agregar al carrito ──────────────────────────────────────────────────────
function agregarAlCarrito(id) {
  if (!requireSesion("agregar productos al carrito")) return;
  const producto = PRODUCTOS.find(p => p.id === id);
  if (!producto || !producto.stock) return;

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.push({
    nombre: producto.nombre,
    precio: producto.precio,
    tipo:   'producto',
    img:    producto.img
  });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContador();
  filtrarProductos(); // re-render para actualizar stock visible
  showToast(`🛒 ${producto.nombre} agregado al carrito`);
}

// ── Reset filtros ───────────────────────────────────────────────────────────
function resetFiltros() {
  filtroCategoria = 'todas';
  document.getElementById('rangePrecio').value = 1500;
  document.getElementById('rangeValor').textContent = '$1500';
  document.getElementById('soloStock').checked = false;
  document.getElementById('sortSelect').value = 'default';
  document.querySelectorAll('.filter-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === 'todas');
  });
  filtrarProductos();
}
