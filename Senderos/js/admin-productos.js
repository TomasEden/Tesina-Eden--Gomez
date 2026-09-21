/* =========================================================
   SENDEROS — admin-productos.js
   Conectado a la sesión PHP y a la API
   ========================================================= */

const API_URL = '../api/productos.php';

let productos = [];
let eliminarId = null;


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const autorizado = await verificarAdministrador();

  if (!autorizado) {
    return;
  }

  cargarProductos();
  activarRefreshAdmin(cargarProductos, 30000);
});


/* =========================================================
   VERIFICAR ADMINISTRADOR
   ========================================================= */

async function verificarAdministrador() {
  try {
    const response = await fetch(
      '../api/sesion.php',
      {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (
      !response.ok ||
      !data?.ok ||
      !data.logueado ||
      data.usuario?.rol !== 'admin'
    ) {
      window.location.href = 'admin-login.html';
      return false;
    }

    return true;

  } catch (error) {
    /* log removido en limpieza final */;

    window.location.href = 'admin-login.html';

    return false;
  }
}


/* =========================================================
   FETCH API
   ========================================================= */

function apiFetch(url, options = {}) {
  return fetch(
    url,
    {
      credentials: 'same-origin',
      ...options
    }
  );
}


/* =========================================================
   CARGAR PRODUCTOS
   ========================================================= */

async function cargarProductos() {
  try {
    const response = await apiFetch(
      API_URL,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (
      !response.ok ||
      !data?.ok
    ) {
      showToast(
        data?.error ||
        data?.mensaje ||
        'No pudimos mostrar los productos en este momento.'
      );

      return;
    }

    productos = Array.isArray(
      data.productos
    )
      ? data.productos
      : [];

    actualizarFiltros();

    poblarDatalists();

    renderTabla(productos);

  } catch (error) {
    productos = [];

    renderErrorTabla();

    showToast(
      'Error de conexión con el servidor'
    );
  }
}


function renderErrorTabla() {
  const tbody =
    document.getElementById(
      'productosBody'
    );

  if (!tbody) {
    return;
  }

  tbody.innerHTML = '';

  const tr =
    document.createElement('tr');

  const td =
    document.createElement('td');

  td.colSpan = 6;
  td.style.textAlign = 'center';
  td.style.padding = '2rem';

  const p =
    document.createElement('p');

  p.className = 'td-light';
  p.textContent =
    'No pudimos cargar los productos. Revisá tu conexión.';

  const btn =
    document.createElement('button');

  btn.type = 'button';
  btn.className = 'btn-ghost';
  btn.textContent = 'Reintentar';
  btn.style.marginTop = '0.8rem';
  btn.addEventListener(
    'click',
    cargarProductos
  );

  td.appendChild(p);
  td.appendChild(btn);
  tr.appendChild(td);
  tbody.appendChild(tr);
}


/* =========================================================
   ACTUALIZAR FILTROS
   ========================================================= */

function actualizarFiltros() {
  const marcaSelect =
    document.getElementById('filterMarca');

  const categoriaSelect =
    document.getElementById('filterCat');

  if (marcaSelect) {
    const marcas = [
      ...new Set(
        productos
          .map(producto => producto.marca)
          .filter(Boolean)
      )
    ].sort(
      (a, b) =>
        String(a).localeCompare(
          String(b),
          'es'
        )
    );

    const valorActual =
      marcaSelect.value;

    marcaSelect.innerHTML = `
      <option value="todas">
        Todas las marcas
      </option>

      ${marcas
        .map(
          marca => `
            <option value="${escapeHTML(
              String(marca)
            )}">
              ${escapeHTML(
                String(marca)
              )}
            </option>
          `
        )
        .join('')}
    `;

    if (
      marcas.includes(valorActual)
    ) {
      marcaSelect.value =
        valorActual;
    }
  }

  if (categoriaSelect) {
    const categorias = [
      ...new Set(
        productos
          .map(producto => producto.categoria)
          .filter(Boolean)
      )
    ].sort(
      (a, b) =>
        String(a).localeCompare(
          String(b),
          'es'
        )
    );

    const valorActual =
      categoriaSelect.value;

    categoriaSelect.innerHTML = `
      <option value="todas">
        Todas las categorías
      </option>

      ${categorias
        .map(
          categoria => `
            <option value="${escapeHTML(
              String(categoria)
            )}">
              ${escapeHTML(
                String(categoria)
              )}
            </option>
          `
        )
        .join('')}
    `;

    if (
      categorias.includes(valorActual)
    ) {
      categoriaSelect.value =
        valorActual;
    }
  }
}


/* =========================================================
   DATALISTS DEL FORMULARIO (valores reales, no se pierde nada)
   ========================================================= */

function poblarDatalists() {
  const listas = {
    datalistMarcas: [
      ...new Set(
        productos
          .map(producto =>
            String(
              producto.marca || ''
            ).trim()
          )
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b, 'es')
    ),

    datalistCategoriasProd: [
      ...new Set(
        productos
          .map(producto =>
            String(
              producto.categoria || ''
            ).trim()
          )
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b, 'es')
    )
  };

  Object.entries(listas).forEach(
    ([id, valores]) => {
      const datalist =
        document.getElementById(id);

      if (!datalist) {
        return;
      }

      datalist.innerHTML = '';

      valores.forEach(valor => {
        const opt =
          document.createElement(
            'option'
          );

        opt.value = valor;

        datalist.appendChild(opt);
      });
    }
  );
}


/* =========================================================
   RENDER TABLA
   ========================================================= */

function renderTabla(lista) {
  const tbody =
    document.getElementById(
      'productosBody'
    );

  if (!tbody) {
    return;
  }

  tbody.innerHTML = '';

  if (!Array.isArray(lista) || !lista.length) {
    const trVacio = document.createElement('tr');
    const tdVacio = document.createElement('td');
    tdVacio.colSpan = 6;
    tdVacio.className = 'td-light';
    tdVacio.style.textAlign = 'center';
    tdVacio.style.padding = '2rem';
    tdVacio.textContent = productos.length
      ? 'Ningún producto coincide con los filtros.'
      : 'No hay productos para mostrar.';
    trVacio.appendChild(tdVacio);
    tbody.appendChild(trVacio);

    return;
  }

  lista.forEach(producto => {
    const qty =
      Number(
        producto.stock_cantidad
      ) || 0;

    const tr = document.createElement('tr');

    const tdProd = document.createElement('td');
    const prodWrap = document.createElement('div');
    prodWrap.style.display = 'flex';
    prodWrap.style.alignItems = 'center';
    prodWrap.style.gap = '0.8rem';

    const img = document.createElement('img');

    if (producto.imagen) {
      img.src = String(producto.imagen);
    } else {
      img.src = '../img/placeholder.svg';
    }

    img.alt = '';
    img.style.cssText =
      'width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0';
    img.onerror = function () {
      img.onerror = null;
      img.src = '../img/placeholder.svg';
    };
    prodWrap.appendChild(img);

    const prodTxt = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = String(producto.nombre || '');
    prodTxt.appendChild(strong);

    const badgeText =
      producto.badge === 'nuevo'
        ? 'Nuevo'
        : producto.badge === 'oferta'
          ? 'Oferta'
          : '';

    if (badgeText) {
      prodTxt.appendChild(document.createElement('br'));

      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'td-light';
      badgeSpan.textContent = badgeText;
      prodTxt.appendChild(badgeSpan);
    }

    prodWrap.appendChild(prodTxt);
    tdProd.appendChild(prodWrap);
    tr.appendChild(tdProd);

    const tdMarca = document.createElement('td');
    tdMarca.className = 'td-light';
    tdMarca.textContent = String(producto.marca || '—');
    tr.appendChild(tdMarca);

    const tdCat = document.createElement('td');
    tdCat.className = 'td-light';
    tdCat.textContent = String(producto.categoria || '');
    tr.appendChild(tdCat);

    const tdPrecio = document.createElement('td');
    const strongPrecio = document.createElement('strong');
    strongPrecio.textContent =
      '$' + (Number(producto.precio) || 0).toLocaleString('es-AR');
    tdPrecio.appendChild(strongPrecio);
    tr.appendChild(tdPrecio);

    const tdStock = document.createElement('td');
    const stockBadge = document.createElement('span');
    stockBadge.className = 'badge-count' + (qty > 0 ? ' green' : '');
    stockBadge.textContent = qty > 0 ? 'Stock: ' + qty : 'Sin stock';
    tdStock.appendChild(stockBadge);
    tr.appendChild(tdStock);

    const tdAcc = document.createElement('td');
    const accBox = document.createElement('div');
    accBox.style.display = 'flex';
    accBox.style.gap = '0.4rem';

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn-icon';
    btnEditar.title = 'Editar';
    btnEditar.setAttribute('aria-label', 'Editar producto');

    const imgEditar = document.createElement('img');
    imgEditar.src = '../img/icons/formulario.svg';
    imgEditar.alt = '';
    imgEditar.width = 13;
    imgEditar.height = 13;
    btnEditar.appendChild(imgEditar);
    btnEditar.addEventListener('click', function () {
      abrirModalEditar(Number(producto.id));
    });
    accBox.appendChild(btnEditar);

    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-icon danger';
    btnEliminar.title = 'Eliminar';
    btnEliminar.setAttribute('aria-label', 'Eliminar producto');

    const imgEliminar = document.createElement('img');
    imgEliminar.src = '../img/icons/basura.svg';
    imgEliminar.alt = '';
    imgEliminar.width = 15;
    imgEliminar.height = 15;
    btnEliminar.appendChild(imgEliminar);
    btnEliminar.addEventListener('click', function () {
      abrirModalEliminar(Number(producto.id));
    });
    accBox.appendChild(btnEliminar);

    tdAcc.appendChild(accBox);
    tr.appendChild(tdAcc);

    tbody.appendChild(tr);
  });
}


/* =========================================================
   FILTRAR
   ========================================================= */

function filtrar() {
  const searchInput =
    document.getElementById(
      'searchInput'
    );

  const filterMarca =
    document.getElementById(
      'filterMarca'
    );

  const filterCat =
    document.getElementById(
      'filterCat'
    );

  const filterStock =
    document.getElementById(
      'filterStock'
    );

  const q =
    String(
      searchInput?.value || ''
    )
      .trim()
      .toLowerCase();

  const marca =
    filterMarca?.value ||
    'todas';

  const categoria =
    filterCat?.value ||
    'todas';

  const stock =
    filterStock?.value ||
    'todos';

  const resultado =
    productos.filter(producto => {
      const nombre =
        String(
          producto.nombre || ''
        )
          .toLowerCase();

      const matchQ =
        nombre.includes(q);

      const matchMarca =
        marca === 'todas' ||
        producto.marca === marca;

      const matchCat =
        categoria === 'todas' ||
        producto.categoria === categoria;

      const tieneStock =
        (
          Number(
            producto.stock_cantidad
          ) || 0
        ) > 0;

      const matchStock =
        stock === 'todos' ||
        (
          stock === 'con' &&
          tieneStock
        ) ||
        (
          stock === 'sin' &&
          !tieneStock
        );

      return (
        matchQ &&
        matchMarca &&
        matchCat &&
        matchStock
      );
    });

  renderTabla(resultado);
}


/* =========================================================
   LIMPIAR FORMULARIO
   ========================================================= */

function limpiarForm() {
  [
    'fNombre',
    'fPrecio',
    'fImg',
    'fDesc'
  ].forEach(id => {
    const elemento =
      document.getElementById(id);

    if (elemento) {
      elemento.value = '';
    }
  });

  const editId =
    document.getElementById(
      'editId'
    );

  if (editId) {
    editId.value = '';
  }

  const fMarca =
    document.getElementById(
      'fMarca'
    );

  if (fMarca) {
    fMarca.value = '';
  }

  const fCategoria =
    document.getElementById(
      'fCategoria'
    );

  if (fCategoria) {
    fCategoria.value = 'Facial';
  }

  const fStock =
    document.getElementById(
      'fStock'
    );

  if (fStock) {
    fStock.value = '';
  }

  const fBadge =
    document.getElementById(
      'fBadge'
    );

  if (fBadge) {
    fBadge.value = '';
  }

  [
    'err-nombre',
    'err-precio'
  ].forEach(id => {
    const elemento =
      document.getElementById(id);

    if (elemento) {
      elemento.textContent = '';
    }
  });
}


/* =========================================================
   NUEVO PRODUCTO
   ========================================================= */

function abrirModalNuevo() {
  limpiarForm();

  const title =
    document.getElementById(
      'modalFormTitle'
    );

  if (title) {
    title.textContent =
      'Nuevo producto';
  }

  const modal =
    document.getElementById(
      'modalForm'
    );

  if (modal) {
    modal.classList.remove(
      'hidden'
    );
  }
}


/* =========================================================
   EDITAR PRODUCTO
   ========================================================= */

function abrirModalEditar(id) {
  const producto =
    productos.find(
      item =>
        Number(item.id) ===
        Number(id)
    );

  if (!producto) {
    return;
  }

  limpiarForm();

  const title =
    document.getElementById(
      'modalFormTitle'
    );

  if (title) {
    title.textContent =
      'Editar producto';
  }

  const valores = {
    editId: producto.id,
    fNombre: producto.nombre || '',
    fMarca: producto.marca || '',
    fCategoria:
      producto.categoria ||
      'Facial',
    fPrecio:
      producto.precio ?? '',
    fStock:
      producto.stock_cantidad ??
      0,
    fBadge:
      producto.badge || '',
    fImg:
      producto.imagen || '',
    fDesc:
      producto.descripcion || ''
  };

  Object.entries(valores)
    .forEach(([idElemento, valor]) => {
      const elemento =
        document.getElementById(
          idElemento
        );

      if (elemento) {
        elemento.value =
          valor;
      }
    });

  const modal =
    document.getElementById(
      'modalForm'
    );

  if (modal) {
    modal.classList.remove(
      'hidden'
    );
  }
}


/* =========================================================
   GUARDAR PRODUCTO
   ========================================================= */

async function guardarProducto() {
  const nombreInput =
    document.getElementById(
      'fNombre'
    );

  const precioInput =
    document.getElementById(
      'fPrecio'
    );

  const nombre =
    String(
      nombreInput?.value || ''
    ).trim();

  const precio =
    Number.parseFloat(
      precioInput?.value
    );

  let valido = true;

  const errorNombre =
    document.getElementById(
      'err-nombre'
    );

  const errorPrecio =
    document.getElementById(
      'err-precio'
    );

  if (errorNombre) {
    errorNombre.textContent = '';
  }

  if (errorPrecio) {
    errorPrecio.textContent = '';
  }

  if (!nombre) {
    if (errorNombre) {
      errorNombre.textContent =
        'El nombre es obligatorio';
    }

    valido = false;
  }

  if (
    !Number.isFinite(precio) ||
    precio <= 0
  ) {
    if (errorPrecio) {
      errorPrecio.textContent =
        'Ingresá un precio válido';
    }

    valido = false;
  }

  if (!valido) {
    return;
  }

  const getValue = id => {
    const elemento =
      document.getElementById(id);

    return elemento
      ? elemento.value
      : '';
  };

  const data = {
    nombre,

    marca:
      getValue('fMarca') ||
      null,

    categoria:
      getValue('fCategoria'),

    precio,

    stock_cantidad:
      Number.parseInt(
        getValue('fStock'),
        10
      ) || 0,

    badge:
      getValue('fBadge') ||
      null,

    imagen:
      String(
        getValue('fImg')
      ).trim(),

    descripcion:
      String(
        getValue('fDesc')
      ).trim()
  };

  const editId =
    String(
      getValue('editId')
    ).trim();

  const metodo =
    editId
      ? 'PUT'
      : 'POST';

  if (editId) {
    data.id =
      Number.parseInt(
        editId,
        10
      );
  }

  try {
    const response =
      await apiFetch(
        API_URL,
        {
          method: metodo,
          headers: {
            'Content-Type':
              'application/json',
            'Accept':
              'application/json'
          },
          body:
            JSON.stringify(data)
        }
      );

    const res =
      await response.json();

    if (
      !response.ok ||
      !res?.ok
    ) {
      showToast(
        res?.error ||
        res?.mensaje ||
        'Error al guardar el producto'
      );

      return;
    }

    showToast(
      editId
        ? 'Producto actualizado'
        : 'Producto creado'
    );

    cerrarModal(
      'modalForm'
    );

    await cargarProductos();

  } catch (error) {
    /* log removido en limpieza final */;

    showToast(
      'Error de conexión con el servidor'
    );
  }
}


/* =========================================================
   ELIMINAR PRODUCTO
   ========================================================= */

function abrirModalEliminar(id) {
  eliminarId = Number(id);

  const modal =
    document.getElementById(
      'modalEliminar'
    );

  if (modal) {
    modal.classList.remove(
      'hidden'
    );
  }
}


/* =========================================================
   CONFIRMAR ELIMINACIÓN
   ========================================================= */

async function confirmarEliminar() {
  if (!eliminarId) {
    return;
  }

  try {
    const response =
      await apiFetch(
        API_URL,
        {
          method: 'DELETE',
          headers: {
            'Content-Type':
              'application/json',
            'Accept':
              'application/json'
          },
          body:
            JSON.stringify({
              id: eliminarId
            })
        }
      );

    const res =
      await response.json();

    if (
      !response.ok ||
      !res?.ok
    ) {
      showToast(
        res?.error ||
        res?.mensaje ||
        'Error al eliminar el producto'
      );

      return;
    }

    cerrarModal(
      'modalEliminar'
    );

    eliminarId = null;

    showToast(
      'Producto eliminado'
    );

    await cargarProductos();

  } catch (error) {
    /* log removido en limpieza final */;

    showToast(
      'Error de conexión con el servidor'
    );
  }
}


/* =========================================================
   CERRAR MODAL
   ========================================================= */

function cerrarModal(id) {
  const modal =
    document.getElementById(id);

  if (modal) {
    modal.classList.add(
      'hidden'
    );
  }
}


/* =========================================================
   TOAST — Fase G: compartido de admin-shell.js (sin duplicado).
   ========================================================= */


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {
  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}


/* =========================================================
   ESCAPE ATRIBUTOS
   ========================================================= */

function escapeAttribute(value) {
  return escapeHTML(value);
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

async function cerrarSesion() {
  try {
    await apiFetch(
      '../api/logout.php',
      {
        method: 'POST',
        cache: 'no-store'
      }
    );
  } catch (error) {
    /* log removido en limpieza final */;
  }

  window.location.href =
    'admin-login.html';
}


/* =========================================================
   REFRESH AUTOMÁTICO
   ========================================================= */

function activarRefreshAdmin(recargar, ms) {
  if (typeof recargar !== 'function') {
    return;
  }

  setInterval(function () {
    if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) {
      recargar();
    }
  }, ms || 30000);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !document.querySelector('.modal-overlay:not(.hidden)')) {
      recargar();
    }
  });
}