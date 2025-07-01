const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const mysql = require('mysql2/promise');
const config = require('../config/config');

// --- FUNCIÓN DE CONEXIÓN A LA BASE DE DATOS ---
async function getConnection() {
    return await mysql.createConnection(config.db);
}


// --- RUTAS DE LA API DE FACTURACIÓN ---

// RUTA PARA OBTENER EL HISTORIAL DE TODAS LAS FACTURAS
router.get('/historial', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const sql = `
            SELECT 
                f.id, f.fecha, f.total, c.nombre AS cliente_nombre 
            FROM facturas AS f
            JOIN clientes AS c ON f.id_cliente = c.id
            ORDER BY f.fecha DESC;
        `;
        const [rows] = await connection.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener el historial de facturas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// RUTA PARA GENERAR UNA NUEVA FACTURA Y SU PDF
router.post('/generar', async (req, res) => {
    const { clienteId, items, total } = req.body;
    if (!clienteId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Faltan datos para generar la factura.' });
    }

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const fecha = new Date();
        const [facturaResult] = await connection.execute('INSERT INTO facturas (id_cliente, fecha, total) VALUES (?, ?, ?)', [clienteId, fecha, total]);
        const facturaId = facturaResult.insertId;

        for (const item of items) {
            await connection.execute('INSERT INTO detalles_factura (id_factura, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)', [facturaId, item.id, item.cantidad, item.precio]);
            await connection.execute('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.id]);
        }

        const [clienteRows] = await connection.execute('SELECT * FROM clientes WHERE id = ?', [clienteId]);
        if (clienteRows.length === 0) throw new Error('Cliente no encontrado');
        const cliente = clienteRows[0];
        
        await connection.commit();
        console.log(`Factura ${facturaId} creada y stock actualizado exitosamente.`);

        // --- Generación del PDF ---
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura-${facturaId}.pdf`);
        doc.pipe(res);

        generateHeader(doc, config.tienda);
        generateCustomerInformation(doc, facturaId, fecha, cliente);
        generateInvoiceTable(doc, items, total);
        await generateQrCode(doc, facturaId);
        generateFooter(doc);

        doc.end();
            
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al generar la factura:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error interno al generar la factura' });
        }
    } finally {
        if (connection) await connection.end();
    }
});

// RUTA PARA OBTENER EL PDF DE UNA FACTURA EXISTENTE
router.get('/pdf/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        
        const [facturaRows] = await connection.execute('SELECT * FROM facturas WHERE id = ?', [id]);
        if (facturaRows.length === 0) return res.status(404).send('Factura no encontrada');
        const factura = facturaRows[0];

        const [clienteRows] = await connection.execute('SELECT * FROM clientes WHERE id = ?', [factura.id_cliente]);
        const cliente = clienteRows[0];
        
        const [itemsRows] = await connection.execute(`
            SELECT d.cantidad, d.precio_unitario AS precio, p.nombre 
            FROM detalles_factura d 
            JOIN productos p ON d.id_producto = p.id 
            WHERE d.id_factura = ?`, [id]);

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura-${id}.pdf`);
        doc.pipe(res);

        generateHeader(doc, config.tienda);
        generateCustomerInformation(doc, id, new Date(factura.fecha), cliente);
        generateInvoiceTable(doc, itemsRows, factura.total);
        await generateQrCode(doc, id);
        generateFooter(doc);

        doc.end();
    } catch (error) {
        console.error(`Error al regenerar PDF para factura ${id}:`, error);
        if (!res.headersSent) res.status(500).json({ message: 'Error interno' });
    } finally {
        if (connection) await connection.end();
    }
});


// --- FUNCIONES DE AYUDA PARA EL DISEÑO DEL PDF ---

function generateHeader(doc, tienda) {
    if (tienda.logo) {
        try {
            doc.image(tienda.logo, 50, 45, { width: 60 });
        } catch (error) {
            console.error(`No se pudo cargar el logo desde la ruta: ${tienda.logo}`, error);
        }
    }
    doc.fillColor('#444444')
        .fontSize(20).font('Helvetica-Bold').text(tienda.nombre, 120, 57)
        .font('Helvetica').fontSize(10)
        .text(tienda.direccion, 200, 65, { align: 'right' })
        .text(`NIT: ${tienda.nit}`, 200, 80, { align: 'right' })
        .moveDown();
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 110).lineTo(550, 110).stroke();
}

function generateCustomerInformation(doc, facturaId, fecha, cliente) {
    doc.fillColor('#444444').fontSize(12).text('Factura a:', 50, 130);
    doc.font('Helvetica').fontSize(10)
        .text(cliente.nombre, 50, 150)
        .text(cliente.correo || '', 50, 165)
        .text(cliente.telefono || '', 50, 180);

    doc.font('Helvetica-Bold').fillColor('#444444').fontSize(12).text('Factura N°:', 350, 130);
    doc.font('Helvetica').fontSize(10).text(facturaId, 420, 130);
    doc.font('Helvetica-Bold').fontSize(12).text('Fecha:', 350, 150);
    doc.font('Helvetica').fontSize(10).text(fecha.toLocaleDateString('es-CO'), 420, 150);

    doc.moveDown(2);
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 210).lineTo(550, 210).stroke();
}

function generateInvoiceTable(doc, items, total) {
    const invoiceTableTop = 230;
    doc.font('Helvetica-Bold');
    generateTableRow(doc, invoiceTableTop, 'Producto', 'Cant.', 'Precio Unit.', 'Subtotal');
    doc.font('Helvetica');

    items.forEach((item, i) => {
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            position,
            item.nombre,
            item.cantidad,
            `$${parseFloat(item.precio).toLocaleString('es-CO')}`,
            `$${parseFloat(item.cantidad * item.precio).toLocaleString('es-CO')}`
        );
    });
    
    const tableBottom = invoiceTableTop + (items.length + 1) * 30;
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableBottom).lineTo(550, tableBottom).stroke();

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`TOTAL:   $${parseFloat(total).toLocaleString('es-CO')}`, 350, tableBottom + 15, { align: 'right' });
    doc.font('Helvetica');
}

function generateTableRow(doc, y, c1, c2, c3, c4) {
    doc.fontSize(10)
        .text(c1, 50, y, { width: 220 })
        .text(c2, 280, y, { width: 40, align: 'right' })
        .text(c3, 330, y, { width: 90, align: 'right' })
        .text(c4, 430, y, { width: 90, align: 'right' });
    doc.strokeColor('#dddddd').lineWidth(0.5).moveTo(50, y + 20).lineTo(550, y + 20).stroke();
}

async function generateQrCode(doc, facturaId) {
    try {
        const qrData = await QRCode.toDataURL(`https://tudominio.com/factura/${facturaId}`);
        doc.image(qrData, 50, doc.y + 50, { fit: [100, 100] });
    } catch (qrError) {
        console.error("No se pudo generar el código QR", qrError);
    }
}

function generateFooter(doc) {
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 750).lineTo(550, 750).stroke();
    doc.fontSize(10).text('¡Gracias por tu compra!', 50, 760, {
        align: 'center',
        width: 500,
    });
}

module.exports = router;