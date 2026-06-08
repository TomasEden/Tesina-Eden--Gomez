/* ═══════════════════════════════════════
   Senderos — buscar.js
   Buscador global de servicios y productos
   ═══════════════════════════════════════ */

let filtroActivo = 'todo';
let queryActual  = '';
let debounceTimer = null;

// ── Datos ───────────────────────────────────────────────────────────────────
// SERVICIOS y PRODUCTOS vienen de servicios.js y productos.js cargados antes

// Datos embebidos para que buscar.html no dependa de servicios.js ni productos.js
const DATOS_SERVICIOS_BUSCAR = [
  { id:'masaje-relajante',  nombre:'Masaje Relajante',         categoria:'Masajes',        desc:'Técnica sueca de cuerpo completo para liberar tensiones musculares.',      duracion:'60 min', precio:5000, img:'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&q=70' },
  { id:'masaje-piedras',    nombre:'Masaje con Piedras Calientes', categoria:'Masajes',     desc:'Piedras volcánicas de basalto que penetran calor profundo en los músculos.', duracion:'75 min', precio:6500, img:'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=70' },
  { id:'masaje-deportivo',  nombre:'Masaje Deportivo',         categoria:'Masajes',        desc:'Técnica de alta presión para deportistas y recuperación muscular.',         duracion:'50 min', precio:5500, img:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=70' },
  { id:'reflexologia',      nombre:'Reflexología Podal',       categoria:'Masajes',        desc:'Presión en puntos reflejos del pie que activan la energía del cuerpo.',     duracion:'40 min', precio:3500, img:'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=400&q=70' },
  { id:'facial-premium',    nombre:'Tratamiento Facial Premium', categoria:'Faciales',     desc:'Limpieza profunda, exfoliación e hidratación intensiva con productos naturales.', duracion:'30 min', precio:3000, img:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=70' },
  { id:'facial-antiage',    nombre:'Facial Anti-Age',          categoria:'Faciales',       desc:'Tratamiento reafirmante con ácido hialurónico y vitamina C.',              duracion:'45 min', precio:4500, img:'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=70' },
  { id:'jacuzzi',           nombre:'Jacuzzi Privado',          categoria:'Spa & Relax',    desc:'Sesión privada de hidroterapia con sales minerales y aceites esenciales.',  duracion:'80 min', precio:5000, img:'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=400&q=70' },
  { id:'aromaterapia',      nombre:'Aromaterapia',             categoria:'Spa & Relax',    desc:'Masaje suave con aceites esenciales premium. Alivia el estrés y mejora el sueño.', duracion:'50 min', precio:4000, img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=70' },
  { id:'manicura',          nombre:'Manicura & Pedicura',      categoria:'Uñas & Estética', desc:'Cuidado completo de manos y pies con esmaltado semipermanente incluido.',  duracion:'45 min', precio:2500, img:'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=70' },
  { id:'depilacion',        nombre:'Depilación con Cera',      categoria:'Uñas & Estética', desc:'Depilación profesional con cera natural. Resultado duradero y piel suave.', duracion:'40 min', precio:2000, img:'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=70' },
];

const DATOS_PRODUCTOS_BUSCAR = [
  { id:1, nombre:'Crema Hidratante',     categoria:'Facial',  desc:'Hidratación profunda para piel seca y mixta.',            precio:500,  stock:true,  img:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=70' },
  { id:2, nombre:'Aceite de Lavanda',    categoria:'Facial',  desc:'Para piel mixta y sensible. Aroma relajante.',            precio:500,  stock:true,  img:'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=70' },
  { id:3, nombre:'Serum de Crecimiento', categoria:'Capilar', desc:'Con biotina y extractos naturales para el cabello.',      precio:500,  stock:false, img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=70' },
  { id:4, nombre:'Kit Capilar',          categoria:'Capilar', desc:'Cuidado completo para tu cabello.',                       precio:800,  stock:true,  img:'https://images.unsplash.com/photo-1598454444936-cf0b6f87f2b0?w=400&q=70' },
  { id:5, nombre:'Aceite de Coco',       categoria:'Corporal', desc:'Hidratación y nutrición profunda para el cuerpo.',       precio:600,  stock:true,  img:'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&q=70' },
  { id:6, nombre:'Bálsamo Natural',      categoria:'Corporal', desc:'Bálsamo con extractos de plantas medicinales.',          precio:450,  stock:true,  img:'https://images.unsplash.com/photo-1585386959984-a41552231658?w=400&q=70' },
  { id:7, nombre:'Mascarilla Facial',    categoria:'Facial',  desc:'Limpieza profunda con arcilla y aloe vera.',              precio:650,  stock:true,  img:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=70' },
  { id:8, nombre:'Contorno de Ojos',     categoria:'Facial',  desc:'Reduce ojeras y bolsas con retinol y cafeína.',           precio:900,  stock:false, img:'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=70' },
  { id:9, nombre:'Exfoliante Corporal',  categoria:'Corporal', desc:'Exfoliación suave con azúcar y aceites esenciales.',     precio:550,  stock:true,  img:'https://images.unsplash.com/photo-1610289982320-1a4c5b60f67c?w=400&q=70' },
];

function getDatos() {
  const adminServ = JSON.parse(localStorage.getItem('adminServicios') || 'null');
  const adminProd = JSON.parse(localStorage.getItem('adminProductos') || 'null');
  const servs = adminServ || DATOS_SERVICIOS_BUSCAR;
  const prods = adminProd || DATOS_PRODUCTOS_BUSCAR;
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
