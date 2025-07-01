// Se ejecuta cuando el HTML ha cargado completamente
document.addEventListener('DOMContentLoaded', () => {
    // Llama a las funciones principales al cargar la página
    mostrarCarrito();
    actualizarContadorCarrito();
    // Añade el escuchador para el botón de finalizar compra
    document.getElementById('btn-proceder-pago').addEventListener('click', finalizarCompra);
});

/**
 * Función principal para leer el carrito de localStorage, buscar los detalles
 * de cada producto en la API y mostrarlos en la página.
 */
async function mostrarCarrito() {
    // Obtiene el carrito del almacenamiento local o lo inicializa como un array vacío
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const container = document.getElementById('items-carrito-container');
    
    // Si el carrito está vacío, muestra un mensaje y termina la función
    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="alert alert-secondary" role="alert">
                Tu carrito está vacío. <a href="index.html" class="alert-link">¡Empieza a comprar!</a>
            </div>
        `;
        actualizarResumen(0, 0); // Actualiza el resumen a cero
        return;
    }

    container.innerHTML = ''; // Limpia el contenedor para evitar duplicados
    let totalCarrito = 0;
    let totalItems = 0;

    // Crea un array de promesas para buscar los detalles de todos los productos del carrito
    const promesasProductos = carrito.map(item => 
        fetch(`http://localhost:4000/api/productos/${item.id}`).then(res => res.json())
    );

    // Espera a que todas las peticiones a la API se completen
    const productosDetallados = await Promise.all(promesasProductos);

    // Itera sobre los productos con sus detalles completos
    productosDetallados.forEach((producto, index) => {
        const itemDelCarrito = carrito[index];
        const subtotal = producto.precio * itemDelCarrito.cantidad;
        totalCarrito += subtotal;
        totalItems += itemDelCarrito.cantidad;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'card mb-3 shadow-sm';
        itemDiv.innerHTML = `
            <div class="row g-0">
                <div class="col-md-3 col-4">
                    <img src="${producto.imagen || 'https://via.placeholder.com/150'}" class="img-fluid rounded-start" alt="${producto.nombre}" style="height: 100%; object-fit: cover;">
                </div>
                <div class="col-md-9 col-8">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <button class="btn-close" aria-label="Close" onclick="removerDelCarrito(${producto.id})"></button>
                        </div>
                        <p class="card-text">
                            <small class="text-muted">Cantidad: ${itemDelCarrito.cantidad} | Precio: $${parseFloat(producto.precio).toLocaleString('es-CO')}</small>
                        </p>
                        <p class="card-text fw-bold fs-5">$${subtotal.toLocaleString('es-CO')}</p>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(itemDiv);
    });

    // Actualiza el resumen de la compra
    actualizarResumen(totalCarrito, totalItems);
}

/**
 * Actualiza el cuadro de resumen de la compra con los totales.
 * @param {number} total - El valor total de la compra.
 * @param {number} cantidadItems - La cantidad total de items.
 */
function actualizarResumen(total, cantidadItems) {
    document.getElementById('resumen-subtotal').textContent = `$${total.toLocaleString('es-CO')}`;
    document.getElementById('resumen-total').textContent = `$${total.toLocaleString('es-CO')}`;
    document.getElementById('resumen-cantidad-items').textContent = cantidadItems;
}

/**
 * Elimina un producto del carrito en localStorage y actualiza la vista.
 * @param {number} productoId - El ID del producto a eliminar.
 */
function removerDelCarrito(productoId) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito = carrito.filter(item => item.id !== productoId);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Vuelve a renderizar todo para reflejar los cambios
    mostrarCarrito();
    actualizarContadorCarrito();
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

/**
 * Simula el proceso de finalizar la compra.
 * En un sistema real, aquí se pedirían los datos del cliente y se enviaría
 * la información al backend para generar la factura.
 */
function finalizarCompra() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if(carrito.length === 0) {
        alert("Tu carrito está vacío. No puedes proceder al pago.");
        return;
    }

    // Aquí conectarías con tu panel de administración.
    // Por ahora, mostraremos un mensaje y limpiaremos el carrito para simular la compra.
    alert("¡Gracias por tu compra! Redirigiendo a la página de confirmación...");

    // Limpiamos el carrito
    localStorage.removeItem('carrito');
    
    // Actualizamos la vista
    mostrarCarrito();
    actualizarContadorCarrito();
    
    // Opcional: Redirigir a una página de agradecimiento
    // window.location.href = "gracias.html";
}