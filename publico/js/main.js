// Se ejecuta cuando el HTML de la página de inicio ha cargado
document.addEventListener('DOMContentLoaded', () => {
    // Llama a las funciones para cargar productos destacados y el contador
    cargarProductosDestacados();
    actualizarContadorCarrito();
});

/**
 * Busca todos los productos pero solo muestra los primeros 4 como "destacados".
 */
async function cargarProductosDestacados() {
    try {
        const response = await fetch('http://localhost:4000/api/productos');
        if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
        
        let productos = await response.json();

        // Tomamos solo los primeros 4 productos
        const productosDestacados = productos.slice(0, 4);

        const catalogoDiv = document.getElementById('catalogo-productos');
        if (!catalogoDiv) return;
        catalogoDiv.innerHTML = ''; // Limpia el contenedor

        productosDestacados.forEach(producto => {
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
        console.error('Error al cargar productos destacados:', error);
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