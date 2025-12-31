const express = require('express');
const db = require('../db');
const router = express.Router();

// Get Assigned Orders
router.get('/orders/:deliveryId', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT o.*, c.full_name as customer_name, c.address as customer_address, c.phone as customer_phone
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            WHERE o.delivery_user_id = ? AND o.status = 'Delivered'
            ORDER BY o.created_at DESC
        `, [req.params.deliveryId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Order Status
router.put('/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        if (status !== 'Delivered') {
            return res.status(400).json({ error: 'Invalid status for delivery. Only "Delivered" allowed.' });
        }
        await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        const [[order]] = await db.query('SELECT delivery_user_id FROM orders WHERE id = ?', [req.params.id]);
        if (order && order.delivery_user_id) {
            const [[existsRow]] = await db.query(
                'SELECT COUNT(*) AS cnt FROM delivery_history WHERE order_id = ? AND delivery_user_id = ?',
                [req.params.id, order.delivery_user_id]
            );
            if (!existsRow || Number(existsRow.cnt) === 0) {
                await db.execute(
                    'INSERT INTO delivery_history (order_id, delivery_user_id) VALUES (?, ?)',
                    [req.params.id, order.delivery_user_id]
                );
            }
        }
        res.json({ message: 'Order delivered and recorded' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get My History (Delivered Orders)
router.get('/history/:deliveryId', async (req, res) => {
    try {
         const [rows] = await db.execute(`
            SELECT o.*, c.full_name as customer_name
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            WHERE o.delivery_user_id = ? AND o.status = 'Delivered'
            ORDER BY o.created_at DESC
        `, [req.params.deliveryId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
