// =================================================================
// ARCHIVO: frontend/js/dashboard.js
// FUNCIÓN: Controla toda la interactividad del panel de control.
// =================================================================

// VARIABLE GLOBAL PARA LA FACTURA EN CURSO
let facturaActual = {
    clienteId: null,
    items: [],
    total: 0
};

// --- 1. CARGA INICIAL Y ESCUCHADORES DE PESTAÑAS ---

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    cargarProductos();
});

document.getElementById('clientes-tab').addEventListener('click', () => cargarClientes());
document.getElementById('facturacion-tab').addEventListener('click', () => {
    popularDropdownClientes();
    cargarSugerenciasProductos();
});
document.getElementById('historial-tab').addEventListener('click', () => cargarHistorialFacturas());


// --- 2. SECCIÓN DE PRODUCTOS (CRUD) ---

async function cargarProductos() {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/productos', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Error al cargar productos');
        const productos = await response.json();
        const tbody = document.getElementById('listaProductos');
        tbody.innerHTML = '';
        productos.forEach(producto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${producto.imagen || 'https://via.placeholder.com/50'}" alt="${producto.nombre}" width="50" height="50" style="object-fit: cover; border-radius: 5px;"></td>
                <td>${producto.nombre}</td>
                <td>$${parseFloat(producto.precio).toLocaleString('es-CO')}</td>
                <td>${producto.stock}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-editar" data-id="${producto.id}">Editar</button>
                    <button class="btn btn-sm btn-danger btn-borrar" data-id="${producto.id}">Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error(error); }
}

document.getElementById('listaProductos').addEventListener('click', function (e) {
    if (!e.target) return;
    const id = e.target.getAttribute('data-id');
    if (e.target.classList.contains('btn-borrar')) {
        if (confirm(`¿Eliminar producto con ID ${id}?`)) eliminarProducto(id);
    }
    if (e.target.classList.contains('btn-editar')) {
        abrirModalEditar(id);
    }
});

document.getElementById('formAgregarProducto').addEventListener('submit', async function (e) {
    e.preventDefault();
    const producto = {
        nombre: document.getElementById('nombreProducto').value,
        categoria: document.getElementById('categoriaProducto').value,
        precio: document.getElementById('precioProducto').value,
        stock: document.getElementById('stockProducto').value,
        imagen: document.getElementById('imagenProducto').value,
        descripcion: document.getElementById('descripcionProducto').value
    };
    try {
        await fetch('https://cosmifactura-backend.onrender.com/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(producto)
        });
        bootstrap.Modal.getInstance(document.getElementById('agregarProductoModal')).hide();
        this.reset();
        cargarProductos();
    } catch (error) { console.error(error); }
});

async function abrirModalEditar(id) {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/productos', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const productos = await response.json();
        const producto = productos.find(p => p.id == id);
        if (!producto) return;

        document.getElementById('editProductoId').value = producto.id;
        document.getElementById('editNombreProducto').value = producto.nombre;
        document.getElementById('editCategoriaProducto').value = producto.categoria;
        document.getElementById('editPrecioProducto').value = producto.precio;
        document.getElementById('editStockProducto').value = producto.stock;
        document.getElementById('editImagenProducto').value = producto.imagen;
        document.getElementById('editDescripcionProducto').value = producto.descripcion;
        new bootstrap.Modal(document.getElementById('editarProductoModal')).show();
    } catch (error) { console.error(error); }
}

document.getElementById('formEditarProducto').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('editProductoId').value;
    const datos = {
        nombre: document.getElementById('editNombreProducto').value,
        categoria: document.getElementById('editCategoriaProducto').value,
        precio: document.getElementById('editPrecioProducto').value,
        stock: document.getElementById('editStockProducto').value,
        imagen: document.getElementById('editImagenProducto').value,
        descripcion: document.getElementById('editDescripcionProducto').value
    };
    try {
        await fetch(`https://cosmifactura-backend.onrender.com/api/productos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(datos)
        });
        bootstrap.Modal.getInstance(document.getElementById('editarProductoModal')).hide();
        cargarProductos();
    } catch (error) { console.error(error); }
});

async function eliminarProducto(id) {
    try {
        await fetch(`https://cosmifactura-backend.onrender.com/api/productos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        cargarProductos();
    } catch (error) { console.error(error); }
}


// --- 3. SECCIÓN DE CLIENTES (CRUD) ---

async function cargarClientes() {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/clientes', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (!response.ok) throw new Error('Error al cargar clientes');
        const clientes = await response.json();
        const tbody = document.getElementById('listaClientes');
        tbody.innerHTML = '';
        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.correo}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.cedula}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-editar-cliente" data-id="${cliente.id}">Editar</button>
                    <button class="btn btn-sm btn-danger btn-borrar-cliente" data-id="${cliente.id}">Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error(error); }
}

document.getElementById('listaClientes').addEventListener('click', function (e) {
    if (!e.target) return;
    const id = e.target.getAttribute('data-id');
    if (e.target.classList.contains('btn-borrar-cliente')) {
        if (confirm(`¿Eliminar cliente con ID ${id}?`)) eliminarCliente(id);
    }
    if (e.target.classList.contains('btn-editar-cliente')) {
        abrirModalEditarCliente(id);
    }
});

document.getElementById('formAgregarCliente').addEventListener('submit', async function (e) {
    e.preventDefault();
    const cliente = {
        nombre: document.getElementById('nombreCliente').value,
        cedula: document.getElementById('cedulaCliente').value,
        correo: document.getElementById('correoCliente').value,
        telefono: document.getElementById('telefonoCliente').value
    };
    try {
        await fetch('https://cosmifactura-backend.onrender.com/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(cliente)
        });
        bootstrap.Modal.getInstance(document.getElementById('agregarClienteModal')).hide();
        this.reset();
        cargarClientes();
    } catch (error) { console.error(error); }
});

async function abrirModalEditarCliente(id) {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/clientes', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const clientes = await response.json();
        const cliente = clientes.find(c => c.id == id);
        if (!cliente) return;

        document.getElementById('editClienteId').value = cliente.id;
        document.getElementById('editNombreCliente').value = cliente.nombre;
        document.getElementById('editCedulaCliente').value = cliente.cedula;
        document.getElementById('editCorreoCliente').value = cliente.correo;
        document.getElementById('editTelefonoCliente').value = cliente.telefono;
        new bootstrap.Modal(document.getElementById('editarClienteModal')).show();
    } catch (error) { console.error(error); }
}

document.getElementById('formEditarCliente').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('editClienteId').value;
    const datos = {
        nombre: document.getElementById('editNombreCliente').value,
        cedula: document.getElementById('editCedulaCliente').value,
        correo: document.getElementById('editCorreoCliente').value,
        telefono: document.getElementById('editTelefonoCliente').value,
    };
    try {
        await fetch(`https://cosmifactura-backend.onrender.com/api/clientes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(datos)
        });
        bootstrap.Modal.getInstance(document.getElementById('editarClienteModal')).hide();
        cargarClientes();
    } catch (error) { console.error(error); }
});

async function eliminarCliente(id) {
    try {
        await fetch(`https://cosmifactura-backend.onrender.com/api/clientes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        cargarClientes();
    } catch (error) { console.error(error); }
}


// --- 4. SECCIÓN DE FACTURACIÓN ---

async function popularDropdownClientes() {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/clientes', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (!response.ok) throw new Error('No se pudieron cargar los clientes');
        const clientes = await response.json();
        const selectCliente = document.getElementById('seleccionarCliente');
        selectCliente.innerHTML = '<option selected disabled value="">Elige un cliente...</option>';
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nombre} (C.C: ${cliente.cedula || 'N/A'})`;
            selectCliente.appendChild(option);
        });
    } catch (error) { console.error(error); }
}

async function cargarSugerenciasProductos() {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/productos', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (!response.ok) throw new Error('No se pudieron cargar las sugerencias');
        const productos = await response.json();
        const datalist = document.getElementById('sugerencias-productos');
        datalist.innerHTML = '';
        productos.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.nombre;
            datalist.appendChild(option);
        });
    } catch (error) { console.error(error); }
}

document.getElementById('btnAnadirProducto').addEventListener('click', async () => {
    const nombreProductoBuscado = document.getElementById('buscarProductoFactura').value;
    const cantidad = parseInt(document.getElementById('cantidadProductoFactura').value);
    if (!nombreProductoBuscado || cantidad <= 0) return;

    facturaActual.clienteId = document.getElementById('seleccionarCliente').value;
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/productos', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const productos = await response.json();
        const productoEncontrado = productos.find(p => p.nombre && p.nombre.toLowerCase().includes(nombreProductoBuscado.toLowerCase()));
        if (!productoEncontrado) return alert('Producto no encontrado.');
        if (productoEncontrado.stock < cantidad) return alert(`Stock insuficiente. Solo quedan ${productoEncontrado.stock} unidades.`);

        const itemExistente = facturaActual.items.find(item => item.id === productoEncontrado.id);
        if (itemExistente) { itemExistente.cantidad += cantidad; }
        else {
            facturaActual.items.push({ id: productoEncontrado.id, nombre: productoEncontrado.nombre, precio: productoEncontrado.precio, cantidad: cantidad });
        }
        actualizarVistaFactura();
        document.getElementById('buscarProductoFactura').value = '';
        document.getElementById('cantidadProductoFactura').value = 1;
    } catch (error) { console.error(error); }
});

function actualizarVistaFactura() {
    const tbody = document.getElementById('itemsFactura');
    tbody.innerHTML = '';
    let totalGeneral = 0;
    facturaActual.items.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        totalGeneral += subtotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.cantidad}</td>
            <td>$${parseFloat(item.precio).toLocaleString('es-CO')}</td>
            <td>$${parseFloat(subtotal).toLocaleString('es-CO')}</td>
            <td><button class="btn btn-sm btn-danger btn-remover-item" data-index="${index}">Quitar</button></td>
        `;
        tbody.appendChild(tr);
    });
    facturaActual.total = totalGeneral;
    document.getElementById('totalFactura').textContent = `$${parseFloat(totalGeneral).toLocaleString('es-CO')}`;
}

document.getElementById('itemsFactura').addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('btn-remover-item')) {
        const index = e.target.getAttribute('data-index');
        facturaActual.items.splice(index, 1);
        actualizarVistaFactura();
    }
});

document.getElementById('generarFacturaBtn').addEventListener('click', async () => {
    if (!facturaActual.clienteId) return alert('Por favor, selecciona un cliente.');
    if (facturaActual.items.length === 0) return alert('No hay productos en la factura.');
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/facturacion/generar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(facturaActual)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al generar el PDF.');
        }
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `factura-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        facturaActual = { clienteId: null, items: [], total: 0 };
        actualizarVistaFactura();
        document.getElementById('seleccionarCliente').value = '';
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});


// --- 5. SECCIÓN DE HISTORIAL ---

async function cargarHistorialFacturas() {
    try {
        const response = await fetch('https://cosmifactura-backend.onrender.com/api/facturacion/historial', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (!response.ok) throw new Error('No se pudo cargar el historial.');
        const facturas = await response.json();
        const tbody = document.getElementById('listaFacturas');
        tbody.innerHTML = '';
        facturas.forEach(factura => {
            const fecha = new Date(factura.fecha);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${factura.id}</td>
                <td>${fecha.toLocaleDateString('es-CO')} ${fecha.toLocaleTimeString('es-CO')}</td>
                <td>${factura.cliente_nombre}</td>
                <td>$${parseFloat(factura.total).toLocaleString('es-CO')}</td>
                <td><button class="btn btn-sm btn-primary btn-ver-pdf" data-id="${factura.id}">Ver PDF</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error(error); }
}

document.getElementById('listaFacturas').addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('btn-ver-pdf')) {
        const facturaId = e.target.getAttribute('data-id');
        try {
            const response = await fetch(`https://cosmifactura-backend.onrender.com/api/facturacion/pdf/${facturaId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            if (!response.ok) throw new Error('No se pudo descargar el PDF.');
            const pdfBlob = await response.blob();
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `factura-${facturaId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) { console.error(error); }
    }
});
