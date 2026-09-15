/* ═══════════════════════════════════════
   Senderos — productos.js (conectado a la API)
   Catálogo + panel lateral de detalle + filtro de marca
   ═══════════════════════════════════════ */

const API_PRODUCTOS = '../api/productos.php';

// ── Estado ───────────────────────────────────────────────────────────────────
let PRODUCTOS        = [];   // se llena desde la API
let filtroCategoria  = 'todas';
let marcaActiva      = 'todas';
let productoActivo   = null;
let cantidadPanel    = 1;
let favsGuardados    = JSON.parse(localStorage.getItem('favs') || '[]');

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  cargarProductos();

  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarPanel();
  });
});

// ── CARGAR DESDE LA API ────────────────────────────────────────────────────
function cargarProductos() {
  fetch(API_PRODUCTOS)
    .then(r => r.json())
    .then(data => {
      if (!data.ok) { showToast('No pudimos mostrar los productos en este momento.'); return; }
      PRODUCTOS = data.productos.map(normalizarProducto);

      // Recuperar item pendiente si el usuario acaba de hacer login
      if (localStorage.getItem('processPendingCart') === '1' && getSesion()) {
        localStorage.removeItem('processPendingCart');
        const pendingStr = localStorage.getItem('pendingCartItem');
        if (pendingStr) {
          try {
            const pending = JSON.parse(pendingStr);
            localStorage.removeItem('pendingCartItem');
            setTimeout(function() {
              const prod = PRODUCTOS.find(function(p) { return p.id === pending.id; });
              if (prod && prod.stock) {
                const c = JSON.parse(localStorage.getItem('carrito') || '[]');
                c.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio,
                         tipo: 'producto', img: prod.img, categoria: prod.categoria || '' });
                localStorage.setItem('carrito', JSON.stringify(c));
                actualizarContador();
                filtrarProductos();
                showToast(prod.nombre + ' agregado al carrito');
              }
            }, 400);
          } catch(e) {}
        }
      }

      renderCategorias();
      const maxPrecio = Math.max(1500, ...PRODUCTOS.map(p => p.precio || 0));
      const range = document.getElementById('rangePrecio');
      if (range) {
        range.max = Math.ceil(maxPrecio / 500) * 500;
        range.value = range.max;
      }
      const rangeValor = document.getElementById('rangeValor');
      if (rangeValor && range) rangeValor.textContent = `$${Number(range.value).toLocaleString('es-AR')}`;
      filtrarProductos();
    })
    .catch(() => showToast('Error de conexión con el servidor'));
}

// Adapta los campos de la BD al formato que usa el resto del archivo
function normalizarProducto(p) {
  const badgeText = p.badge === 'nuevo' ? 'Nuevo' : p.badge === 'oferta' ? 'Oferta' : '';
  return {
    id:         p.id,
    nombre:     p.nombre,
    categoria:  p.categoria || 'General',
    marca:      p.marca || '',
    desc:       p.descripcion || '',
    precio:     Number(p.precio),
    stockQty:   Number(p.stock_cantidad) || 0,
    stock:      Number(p.stock_cantidad) > 0,
    badge:      p.badge || null,
    badgeText:  badgeText,
    img:        p.imagen || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80'
  };
}

// ── Toast ───────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Render chips de categoría ───────────────────────────────────────────────
function renderCategorias() {
  const categorias = ['todas', ...new Set(PRODUCTOS.map(p => p.categoria))];
  const container  = document.getElementById('filterCategorias');
  container.innerHTML = '';

  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip' + (cat === 'todas' ? ' active' : '');
    btn.textContent = cat === 'todas' ? 'Todas' : cat;
    btn.dataset.cat = cat;
    btn.addEventListener('click', () => {
      filtroCategoria = cat;
      container.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtrarProductos();
    });
    container.appendChild(btn);
  });
}

// ── Filtro de marca (Selecta / Jules / Natacha Nina) ─────────────────────────
function filtrarPorMarca(marca, btn) {
  marcaActiva = marca;
  document.querySelectorAll('#filterMarcas .filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filtrarProductos();
}

// ── Filtrar y ordenar productos ─────────────────────────────────────────────
function filtrarProductos() {
  const precioMax  = parseInt(document.getElementById('rangePrecio').value);
  const soloStock  = document.getElementById('soloStock').checked;
  const orden      = document.getElementById('sortSelect').value;

  document.getElementById('rangeValor').textContent = `$${precioMax.toLocaleString()}`;

  let resultado = PRODUCTOS.filter(p => {
    if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
    if (marcaActiva !== 'todas' && p.marca !== marcaActiva) return false;
    if (p.precio > precioMax) return false;
    if (soloStock && !p.stock) return false;
    return true;
  });

  if (orden === 'precio-asc')  resultado.sort((a, b) => a.precio - b.precio);
  if (orden === 'precio-desc') resultado.sort((a, b) => b.precio - a.precio);
  if (orden === 'nombre')      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

  renderProductos(resultado);
}

// ── Render grilla ───────────────────────────────────────────────────────────
function renderProductos(lista) {
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
    card.className = 'product-card reveal' + (!p.stock ? ' sin-stock' : '');
    card.style.animationDelay = `${i * 0.06}s`;

    let badgeHTML = '';
    if (!p.stock) {
      badgeHTML = `<span class="product-badge sin-stock-badge">Sin stock</span>`;
    } else if (p.badge) {
      badgeHTML = `<span class="product-badge ${p.badge}">${p.badgeText}</span>`;
    }

    const btnHTML = p.stock
      ? `<button class="btn-add" onclick="event.stopPropagation();agregarAlCarrito(${p.id})">+ Carrito</button>`
      : `<button class="btn-add disabled" disabled>Sin stock</button>`;

    card.innerHTML = `
      <div class="product-img-wrap" onclick="abrirPanel(${p.id})">
        <img class="product-img" src="${p.img}" alt="${p.nombre}"/>
        ${badgeHTML}
      </div>
      <div class="product-body">
        <p class="product-cat">${p.marca ? p.marca + ' · ' : ''}${p.categoria}</p>
        <h3 class="product-name" onclick="abrirPanel(${p.id})">${p.nombre}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <div>
            <span class="product-price">$${p.precio.toLocaleString('es-AR')}</span>
          </div>
          <div class="product-actions">
            <button class="btn-ver-producto" onclick="event.stopPropagation();abrirPanel(${p.id})">Ver detalle</button>
            ${btnHTML}
          </div>
        </div>
      </div>`;

    grid.appendChild(card);
  });

  if (typeof IntersectionObserver !== 'undefined') {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  } else {
    grid.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

// ── PANEL LATERAL DE DETALLE ─────────────────────────────────────────────────
function abrirPanel(id) {
  const p = PRODUCTOS.find(x => x.id === id);
  if (!p) return;
  productoActivo = p;
  cantidadPanel = 1;

  const panel   = document.getElementById('srvPanel');
  const overlay = document.getElementById('srvOverlay');
  if (!panel) return;

  const liked = favsGuardados.includes(p.id);
  const stockTexto = p.stock
    ? `${p.stockQty} disponible${p.stockQty !== 1 ? 's' : ''}`
    : 'Sin stock';

  panel.innerHTML = `
    <div class="panel-img-wrap">
      <img src="${p.img}" alt="${p.nombre}" loading="lazy"/>
      <div class="panel-img-overlay"></div>
      <button class="panel-close" onclick="cerrarPanel()" aria-label="Cerrar">
        <img src="../img/icons/x.svg" alt="" width="13" height="13">
      </button>
      <div class="panel-img-info">
        <span class="service-cat">${p.marca ? p.marca + ' · ' : ''}${p.categoria}</span>
        <h2 class="panel-nombre">${p.nombre}</h2>
      </div>
      ${p.badge ? `<span class="service-badge ${p.badge}">${p.badgeText}</span>` : ''}
    </div>

    <div class="panel-body">

      <div class="panel-precio-bar">
        <div>
          <div class="panel-precio">$${p.precio.toLocaleString('es-AR')}</div>
          <div class="panel-precio-sub">${stockTexto}</div>
        </div>
        <button class="btn-favorito-panel ${liked ? 'activo' : ''}" onclick="toggleFavPanel(${p.id}, this)" aria-label="Favorito">
          <img src="../img/icons/${liked ? 'corazon2' : 'corazon1'}.svg" alt="" width="18" height="18">
        </button>
      </div>

      <p class="panel-desc">${p.desc || 'Sin descripción disponible.'}</p>

      <div class="panel-qty-row">
        <span class="panel-qty-label">Cantidad</span>
        <div class="panel-qty-controls">
          <button class="qty-btn" onclick="cambiarQtyPanel(-1)">−</button>
          <span class="qty-num" id="panelQtyNum">1</span>
          <button class="qty-btn" onclick="cambiarQtyPanel(1)">+</button>
        </div>
      </div>

      <button class="btn-reservar-panel" id="btnAgregarPanel" ${!p.stock ? 'disabled' : ''} onclick="agregarAlCarritoPanel(${p.id})">
        ${p.stock ? 'Agregar al carrito' : 'Sin stock'}
      </button>

      <div class="panel-sugeridos">
        <h4 class="panel-section-title">También podría interesarte</h4>
        <div class="sugeridos-lista">
          ${PRODUCTOS.filter(x => x.id !== id && x.categoria === p.categoria).slice(0,2).map(x => `
            <div class="sugerido-item" onclick="abrirPanel(${x.id})">
              <img src="${x.img}" alt="${x.nombre}" loading="lazy"/>
              <div>
                <div class="sugerido-nombre">${x.nombre}</div>
                <div class="sugerido-precio">$${x.precio.toLocaleString('es-AR')}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

    </div>`;

  panel.classList.add('open');
  overlay.classList.add('show');
  document.body.classList.add('panel-open');
}

function cerrarPanel() {
  document.getElementById('srvPanel')?.classList.remove('open');
  document.getElementById('srvOverlay')?.classList.remove('show');
  document.body.classList.remove('panel-open');
  productoActivo = null;
}

function cambiarQtyPanel(delta) {
  if (!productoActivo) return;
  const max = productoActivo.stockQty || 99;
  cantidadPanel = Math.max(1, Math.min(max, cantidadPanel + delta));
  const el = document.getElementById('panelQtyNum');
  if (el) el.textContent = cantidadPanel;
}

function toggleFavPanel(id, btn) {
  const idx = favsGuardados.indexOf(id);
  if (idx === -1) {
    favsGuardados.push(id);
    btn.classList.add('activo');
    btn.innerHTML = '<img src="../img/icons/corazon2.svg" alt="" width="18" height="18">';
  } else {
    favsGuardados.splice(idx, 1);
    btn.classList.remove('activo');
    btn.innerHTML = '<img src="../img/icons/corazon1.svg" alt="" width="18" height="18">';
  }
  localStorage.setItem('favs', JSON.stringify(favsGuardados));
}

function agregarAlCarritoPanel(id) {
  if (!requireSesion('agregar productos al carrito')) return;
  const producto = PRODUCTOS.find(p => p.id === id);
  if (!producto || !producto.stock) return;

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  for (let i = 0; i < cantidadPanel; i++) {
    carrito.push({
      id:        producto.id,
      nombre:    producto.nombre,
      precio:    producto.precio,
      tipo:      'producto',
      img:       producto.img,
      categoria: producto.categoria || ''
    });
  }
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContador();
  showToast(cantidadPanel + 'x ' + producto.nombre + ' agregado al carrito');

  const btn = document.getElementById('btnAgregarPanel');
  if (btn) {
    btn.innerHTML = '<img src="../img/icons/check.svg" alt="" width="13" height="13" style="vertical-align:middle;margin-right:0.3rem">Agregado';
    btn.style.background = '#5c9e6e';
    setTimeout(() => {
      btn.textContent = 'Agregar al carrito';
      btn.style.background = '';
    }, 2000);
  }
}

// ── Agregar al carrito directo desde la tarjeta ─────────────────────────────
function agregarAlCarrito(id) {
  localStorage.setItem('pendingCartItem', JSON.stringify({ id: id, tipo: 'producto' }));
  if (!requireSesion("agregar productos al carrito")) return;
  localStorage.removeItem('pendingCartItem');
  const producto = PRODUCTOS.find(p => p.id === id);
  if (!producto || !producto.stock) return;

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.push({
    id:        producto.id,
    nombre:    producto.nombre,
    precio:    producto.precio,
    tipo:      'producto',
    img:       producto.img,
    categoria: producto.categoria || ''
  });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContador();
  filtrarProductos();
  showToast(producto.nombre + ' agregado al carrito');
}

// ── Reset filtros ───────────────────────────────────────────────────────────
function resetFiltros() {
  filtroCategoria = 'todas';
  marcaActiva = 'todas';
  const rangePrecio = document.getElementById('rangePrecio');
  if (rangePrecio) rangePrecio.value = rangePrecio.max;
  document.getElementById('rangeValor').textContent = `$${Number(rangePrecio?.value || 0).toLocaleString('es-AR')}`;
  document.getElementById('soloStock').checked = false;
  document.getElementById('sortSelect').value = 'default';
  document.querySelectorAll('#filterCategorias .filter-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === 'todas');
  });
  document.querySelectorAll('#filterMarcas .filter-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.marca === 'todas');
  });
  filtrarProductos();
}
