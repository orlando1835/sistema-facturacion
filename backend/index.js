const mysql = require('mysql2/promise'); // ya la tienes
const config = require('./config/config'); // ya la tienes

// Cambia la función getConnection que tienes en todos tus archivos de rutas
// para que use directamente los datos de config, que ahora leerán las variables de entorno.
async function getConnection() {
    return await mysql.createConnection(config.db);
}
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000; // Usamos el puerto 4000 para el backend

// Middlewares
app.use(cors()); // Permite la comunicación entre frontend y backend
app.use(express.json());
app.use(express.static('public'));

// Rutas de la API (las crearemos más adelante)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/facturacion', require('./routes/facturacion'));
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
