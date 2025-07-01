const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config/config');

async function getConnection() {
    return await mysql.createConnection(config.db);
}

// Ruta para OBTENER TODOS los clientes
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        console.log('Petición GET a /api/clientes recibida');

        const [rows] = await connection.execute('SELECT * FROM clientes ORDER BY nombre ASC');

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// ... (aquí está la ruta router.get que ya tenías) ...

// Ruta para CREAR un nuevo cliente
router.post('/', async (req, res) => {
    let connection;
    try {
        const { nombre, cedula, correo, telefono } = req.body;

        if (!nombre) {
            return res.status(400).json({ message: 'El nombre del cliente es requerido.' });
        }

        connection = await getConnection();
        console.log('Petición POST para crear cliente:', nombre);

        const sql = 'INSERT INTO clientes (nombre, cedula, correo, telefono) VALUES (?, ?, ?, ?)';
        const [result] = await connection.execute(sql, [nombre, cedula, correo, telefono]);

        res.status(201).json({ message: 'Cliente creado exitosamente', clienteId: result.insertId });

    } catch (error) {
        console.error('Error al crear el cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});
// ... (rutas GET y POST existentes) ...

// Ruta para ELIMINAR un cliente por su ID
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        console.log(`Petición DELETE para cliente ID: ${id}`);

        const [result] = await connection.execute('DELETE FROM clientes WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        res.status(200).json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});
// ... (rutas GET, POST, DELETE existentes) ...

// Ruta para ACTUALIZAR un cliente por su ID
router.put('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nombre, cedula, correo, telefono } = req.body;

        if (!nombre) {
            return res.status(400).json({ message: 'El nombre es requerido.' });
        }
        connection = await getConnection();

        const sql = 'UPDATE clientes SET nombre = ?, cedula = ?, correo = ?, telefono = ? WHERE id = ?';
        const [result] = await connection.execute(sql, [nombre, cedula, correo, telefono, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.status(200).json({ message: 'Cliente actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});
module.exports = router;