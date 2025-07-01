// Se ejecuta cuando el HTML ha cargado completamente
document.addEventListener('DOMContentLoaded', () => {
    // Llama a las funciones para construir la página del catálogo
    cargarCategorias();
    cargarCatalogo(); // Carga todos los productos por defecto
    actualizarContadorCarrito();
});

/**
 * Busca las categorías únicas en la API y crea los botones de filtro.
 */
async function cargarCategorias() {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/productos/categorias');
        const categorias = await response.json();
        const filtrosDiv = document.getElementById('filtros-categoria');
        if (!filtrosDiv) return; // Si no está el div de filtros, no hace nada

        // Botón para mostrar "Todos"
        const btnTodos = document.createElement('button');
        btnTodos.className = 'btn btn-outline-primary m-1 active';
        btnTodos.textContent = 'Todos';
        btnTodos.onclick = (e) => {
            document.querySelector('#filtros-categoria .btn.active').classList.remove('active');
            e.target.classList.add('active');
            cargarCatalogo();
        };
        filtrosDiv.appendChild(btnTodos);

        // Botones para cada categoría
        categorias.forEach(categoria => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary m-1';
            btn.textContent = categoria;
            btn.onclick = (e) => {
                document.querySelector('#filtros-categoria .btn.active').classList.remove('active');
                e.target.classList.add('active');
                cargarCatalogo(categoria);
            };
            filtrosDiv.appendChild(btn);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

/**
 * Busca los productos en la API y los muestra en el catálogo.
 * Opcionalmente filtra por una categoría.
 * @param {string | null} categoria - La categoría por la cual filtrar.
 */
async function cargarCatalogo(categoria = null) {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/productos');
        if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
        
        let productos = await response.json();

        // Si se pasa una categoría, filtra el array de productos
        if (categoria) {
            productos = productos.filter(p => p.categoria === categoria);
        }

        const catalogoDiv = document.getElementById('catalogo-productos');
        if (!catalogoDiv) return;
        catalogoDiv.innerHTML = ''; // Limpia el contenedor

        productos.forEach(producto => {
            if (producto.stock > 0) {
                const col = document.createElement('div');
                col.classList.add('col');
                col.innerHTML = `
                    <div class="card h-100 shadow-sm">
                        <img src="${producto.imagen || 'https://via.placeholder.com/300x200'}" class="card-img-top" alt="${producto.nombre}">
                        <div class="card-body">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <p class="card-text fw-bold text-primary">$${parseFloat(producto.precio).toLocaleString('es-CO')}</p>
                            <a href="producto.html?id=${producto.id}" class="btn btn-outline-primary w-100">Ver Detalles</a>
                        </div>
                    </div>
                `;
                catalogoDiv.appendChild(col);
            }
        });
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
        document.getElementById('catalogo-productos').innerHTML = '<p class="text-danger">No se pudieron cargar los productos.</p>';
    }
}

/**
 * Actualiza el contador de items en el ícono del carrito en la barra de navegación.
 */
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contadorSpan = document.getElementById('contador-carrito');
    if (!contadorSpan) return;

    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    if (totalItems > 0) {
        contadorSpan.textContent = totalItems;
        contadorSpan.style.display = 'inline-block';
    } else {
        contadorSpan.style.display = 'none';
    }
}
