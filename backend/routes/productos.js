const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config/config');

async function getConnection() {
    return await mysql.createConnection(config.db);
}

// --- ORDEN CORRECTO DE RUTAS ---

// 1. Rutas específicas (con texto fijo) van primero.
router.get('/categorias', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT DISTINCT categoria FROM productos WHERE categoria IS NOT NULL AND categoria != ""');
        const categorias = rows.map(row => row.categoria);
        res.status(200).json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// 2. Ruta para obtener TODOS los productos.
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM productos ORDER BY id DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// 3. Rutas con parámetros (generales) van después de las específicas.
router.get('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM productos WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// 4. Ruta para CREAR un producto.
router.post('/', async (req, res) => {
    let connection;
    try {
        const { nombre, categoria, precio, stock, imagen, descripcion } = req.body;
        if (!nombre || !precio || !stock) {
            return res.status(400).json({ message: 'Nombre, precio y stock son campos requeridos.' });
        }
        connection = await getConnection();
        const sql = 'INSERT INTO productos (nombre, categoria, precio, stock, imagen, descripcion) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await connection.execute(sql, [nombre, categoria, precio, stock, imagen, descripcion]);
        res.status(201).json({ message: 'Producto creado exitosamente', productoId: result.insertId });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// 5. Ruta para ACTUALIZAR un producto.
router.put('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nombre, categoria, precio, stock, imagen, descripcion } = req.body;
        if (!nombre || !precio || !stock) {
            return res.status(400).json({ message: 'Nombre, precio y stock son requeridos.' });
        }
        connection = await getConnection();
        const sql = `UPDATE productos SET nombre = ?, categoria = ?, precio = ?, stock = ?, imagen = ?, descripcion = ? WHERE id = ?`;
        const [result] = await connection.execute(sql, [nombre, categoria, precio, stock, imagen, descripcion, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// 6. Ruta para ELIMINAR un producto.
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.execute('DELETE FROM productos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;