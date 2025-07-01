// Se ejecuta cuando el HTML ha cargado completamente
document.addEventListener('DOMContentLoaded', () => {
    // Creamos un objeto para leer los parámetros de la URL (ej: ?id=123)
    const params = new URLSearchParams(window.location.search);
    // Obtenemos el valor del parámetro 'id'
    const productoId = params.get('id');

    // Si encontramos un ID en la URL, cargamos los detalles de ese producto
    if (productoId) {
        cargarDetalleProducto(productoId);
    } else {
        // Si no hay ID, mostramos un error
        document.getElementById('detalle-producto').innerHTML = 
            '<p class="text-danger">No se ha especificado un producto para mostrar.</p>';
    }
    
    // Actualizamos el contador del carrito al cargar la página
    actualizarContadorCarrito();
});

/**
 * Busca los detalles de un producto específico en la API y los muestra en la página.
 * @param {number | string} id - El ID del producto a buscar.
 */
async function cargarDetalleProducto(id) {
    try {
        const response = await fetch(`https://cosmifactura-backend.onrender.com/api/productos/${id}`);
        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }

        const producto = await response.json();
        const detalleDiv = document.getElementById('detalle-producto');
        
        // Cambia el título de la pestaña del navegador al nombre del producto
        document.title = producto.nombre;

        // Inserta el HTML con los detalles del producto en el contenedor
        detalleDiv.innerHTML = `
            <div class="col-lg-6">
                <img src="${producto.imagen || 'https://via.placeholder.com/600x400'}" alt="${producto.nombre}" class="img-fluid rounded shadow-sm w-100">
            </div>
            <div class="col-lg-6">
                <h1 class="display-5">${producto.nombre}</h1>
                <p class="lead text-muted">${producto.categoria || 'Sin categoría'}</p>
                <p class="mt-4">${producto.descripcion || 'No hay descripción disponible.'}</p>
                <h2 class="display-4 text-primary my-4">$${parseFloat(producto.precio).toLocaleString('es-CO')}</h2>
                <div class="d-grid gap-2">
                     <button class="btn btn-primary btn-lg" onclick="agregarAlCarrito(${producto.id})">
                        <i class="bi bi-cart-plus-fill me-2"></i>Añadir al Carrito
                     </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar el detalle del producto:', error);
        document.getElementById('detalle-producto').innerHTML = 
            '<div class="alert alert-danger">El producto que buscas no existe o no se pudo cargar.</div>';
    }
}

/**
 * Añade un producto al carrito en localStorage.
 * @param {number} productoId - El ID del producto a añadir.
 */
function agregarAlCarrito(productoId) {
    // Obtiene el carrito actual de localStorage o crea uno nuevo si no existe
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Busca si el producto ya está en el carrito
    const productoExistente = carrito.find(item => item.id === productoId);

    if (productoExistente) {
        // Si ya existe, simplemente incrementa la cantidad
        productoExistente.cantidad++;
    } else {
        // Si es un producto nuevo, lo añade al array con cantidad 1
        carrito.push({ id: productoId, cantidad: 1 });
    }

    // Guarda el carrito actualizado de vuelta en localStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Da feedback al usuario y actualiza el contador visual
    alert('¡Producto añadido al carrito!');
    actualizarContadorCarrito();
}

/**
 * Actualiza el contador de items en el ícono del carrito en la barra de navegación.
 */
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contadorSpan = document.getElementById('contador-carrito');
    if (!contadorSpan) return; // Si no existe el elemento, no hace nada

    // Suma las cantidades de todos los items en el carrito
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    if (totalItems > 0) {
        contadorSpan.textContent = totalItems;
        contadorSpan.style.display = 'inline-block'; // Lo hace visible
    } else {
        contadorSpan.style.display = 'none'; // Lo oculta si está en cero
    }
}
