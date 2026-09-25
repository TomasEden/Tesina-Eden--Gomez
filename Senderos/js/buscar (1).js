/* ═══════════════════════════════════════
   SPA M — buscar.js
   Buscador global de servicios y productos
   ═══════════════════════════════════════ */

let filtroActivo = 'todo';
let queryActual  = '';
let debounceTimer = null;

// ── Datos ───────────────────────────────────────────────────────────────────
// SERVICIOS y PRODUCTOS vienen de servicios.js y productos.js cargados antes

function getDatos() {
  // sync-admin si está disponible
  const adminServ = JSON.parse(localStorage.getItem('adminServicios') || 'null');
  const adminProd = JSON.parse(localStorage.getItem('adminProductos') || 'null');
  const servs = adminServ || (typeof SERVICIOS !== 'undefined' ? SERVICIOS : []);
  const prods = adminProd || (typeof PRODUCTOS !== 'undefined' ? PRODUCTOS : []);
  return { servs, prods };
}

// ── Inicialización ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();

  // Si viene ?q= en la URL, ejecutar búsqueda directamente
  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('q');
  if (qParam) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = qParam;
      buscar(qParam);
    }
  }
});

// ── Buscar ──────────────────────────────────────────────────────────────────
function buscar(query) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => _ejecutarBusqueda(query), 180);
}

function _ejecutarBusqueda(query) {
  queryActual = query.trim().toLowerCase();
  const clearBtn = document.getElementById('btnClear');
  if (clearBtn) clearBtn.classList.toggle('hidden', !queryActual);

  if (queryActual.length < 2) {
    mostrarEstado('initial');
    return;
  }

  const { servs, prods } = getDatos();

  // Filtrar servicios
  const rServs = servs.filter(s =>
    s.nombre.toLowerCase().includes(queryActual) ||
    (s.desc || '').toLowerCase().includes(queryActual) ||
    (s.categoria || '').toLowerCase().includes(queryActual)
  );

  // Filtrar productos
  const rProds = prods.filter(p =>
    p.nombre.toLowerCase().includes(queryActual) ||
    (p.desc || '').toLowerCase().includes(queryActual) ||
    (p.categoria || '').toLowerCase().includes(queryActual)
  );

  // Aplicar filtro de tipo
  const mostrarServ = filtroActivo === 'todo' || filtroActivo === 'servicio';
  const mostrarProd = filtroActivo === 'todo' || filtroActivo === 'producto';

  const totalServFilt = mostrarServ ? rServs.length : 0;
  const totalProdFilt = mostrarProd ? rProds.length : 0;
  const total = totalServFilt + totalProdFilt;

  if (total === 0) {
    document.getElementById('emptyQuery').textContent = queryActual;
    mostrarEstado('empty');
    return;
  }

  mostrarEstado('results');

  // Contador
  const countEl = document.getElementById('resultsCount');
  if (countEl) countEl.textContent = `${total} resultado${total !== 1 ? 's' : ''} para "${queryActual}"`;

  // Secciones
  const secServ = document.getElementById('secServicios');
  const secProd = document.getElementById('secProductos');

  if (secServ) {
    if (mostrarServ && rServs.length) {
      secServ.classList.remove('hidden');
      document.getElementById('gridServicios').innerHTML = rServs.map(s => renderCardServicio(s)).join('');
    } else {
      secServ.classList.add('hidden');
    }
  }

  if (secProd) {
    if (mostrarProd && rProds.length) {
      secProd.classList.remove('hidden');
      document.getElementById('gridProductos').innerHTML = rProds.map(p => renderCardProducto(p)).join('');
    } else {
      secProd.classList.add('hidden');
    }
  }
}

// ── Render cards ────────────────────────────────────────────────────────────
function highlight(text) {
  if (!queryActual) return text;
  const esc = queryActual.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(esc, 'gi'), m => `<mark>${m}</mark>`);
}

function renderCardServicio(s) {
  const precio = typeof s.precio === 'number' ? '$' + s.precio.toLocaleString('es-AR') : s.precio;
  return `
    <a href="servicios.html" class="result-card">
      <img class="result-card-img"
           src="${s.img || 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&q=70'}"
           alt="${s.nombre}"
           onerror="this.src='https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&q=70'">
      <div class="result-card-body">
        <div class="result-card-tipo tipo-servicio">Servicio · ${s.duracion || ''}</div>
        <div class="result-card-name">${highlight(s.nombre)}</div>
        <div class="result-card-desc">${highlight(s.desc || '')}</div>
        <div class="result-card-footer">
          <span class="result-card-price">${precio}</span>
          <span class="result-card-cta">Reservar →</span>
        </div>
      </div>
    </a>`;
}

function renderCardProducto(p) {
  const precio = typeof p.precio === 'number' ? '$' + p.precio.toLocaleString('es-AR') : p.precio;
  return `
    <a href="producto-detalle.html?id=${p.id}" class="result-card">
      <img class="result-card-img"
           src="${p.img || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=70'}"
           alt="${p.nombre}"
           onerror="this.src='https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=70'">
      <div class="result-card-body">
        <div class="result-card-tipo">${p.categoria || 'Producto'}</div>
        <div class="result-card-name">${highlight(p.nombre)}</div>
        <div class="result-card-desc">${highlight(p.desc || '')}</div>
        <div class="result-card-footer">
          <span class="result-card-price">${precio}</span>
          <span class="result-card-cta">${p.stock ? 'Ver →' : 'Sin stock'}</span>
        </div>
      </div>
    </a>`;
}

// ── Helpers UI ──────────────────────────────────────────────────────────────
function mostrarEstado(estado) {
  document.getElementById('stateInitial').classList.toggle('hidden', estado !== 'initial');
  document.getElementById('stateEmpty').classList.toggle('hidden', estado !== 'empty');
  document.getElementById('searchResults').classList.toggle('hidden', estado !== 'results');
}

function limpiarBusqueda() {
  const input = document.getElementById('searchInput');
  if (input) { input.value = ''; input.focus(); }
  mostrarEstado('initial');
  document.getElementById('btnClear').classList.add('hidden');
  queryActual = '';
}

function setQuery(q) {
  const input = document.getElementById('searchInput');
  if (input) { input.value = q; input.focus(); }
  buscar(q);
}

function cambiarFiltro(btn) {
  document.querySelectorAll('.sf-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  filtroActivo = btn.dataset.tipo;
  if (queryActual.length >= 2) _ejecutarBusqueda(queryActual);
}
