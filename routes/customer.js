const express = require('express');
const db = require('../db');
const router = express.Router();
const fetch = require('node-fetch');
const Stripe = require('stripe');
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

// Get Menu
router.get('/menu', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM menu');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Profile
router.get('/profile/:id', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, full_name, email, phone, address FROM customers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Profile
router.put('/profile/:id', async (req, res) => {
    const { full_name, phone, address } = req.body;
    try {
        await db.execute('UPDATE customers SET full_name = ?, phone = ?, address = ? WHERE id = ?', 
            [full_name, phone, address, req.params.id]);
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/order', async (req, res) => {
    const { customer_id, items, total_amount, phone, address } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const phoneV = typeof phone === 'string' ? phone.trim() : null;
        const addressV = typeof address === 'string' ? address.trim() : null;
        if (phoneV || addressV) {
            const sets = [];
            const params = [];
            if (phoneV) { sets.push('phone = ?'); params.push(phoneV); }
            if (addressV) { sets.push('address = ?'); params.push(addressV); }
            params.push(customer_id);
            await connection.execute(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`, params);
        }

        const [orderResult] = await connection.execute(
            'INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)',
            [customer_id, total_amount]
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.execute(
                'INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.menu_id, item.quantity, item.price]
            );
        }

        await connection.commit();
        res.json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Stripe Checkout (Card Payment)
router.post('/checkout/stripe', async (req, res) => {
    try {
        const { total_amount } = req.body;
        const publishable = process.env.STRIPE_PUBLISHABLE_KEY;
        if (!stripe || !publishable) {
            return res.status(500).json({ error: 'Stripe not configured' });
        }
        const amountCents = Math.round(Number(total_amount) * 100);
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            success_url: 'http://localhost:3001/cart.html?paid=true&session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:3001/cart.html?paid=false',
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Healthy Bites Order' },
                    unit_amount: amountCents
                }
            }]
        });
        res.json({ id: session.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Publishable key endpoint
router.get('/stripe/publishable', async (req, res) => {
    try {
        const publishable = process.env.STRIPE_PUBLISHABLE_KEY;
        if (!publishable) return res.status(500).json({ error: 'Stripe not configured' });
        res.json({ key: publishable });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Confirm Stripe payment and place order
router.post('/checkout/confirm', async (req, res) => {
    const { session_id, customer_id, items, total_amount, phone, address } = req.body;
    try {
        const publishable = process.env.STRIPE_PUBLISHABLE_KEY;
        if (!stripe || !publishable) {
            return res.status(500).json({ error: 'Stripe not configured' });
        }
        if (!session_id) {
            return res.status(400).json({ error: 'Missing session_id' });
        }
        const sess = await stripe.checkout.sessions.retrieve(session_id);
        if (!sess || sess.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Payment not completed' });
        }
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const phoneV = typeof phone === 'string' ? phone.trim() : null;
            const addressV = typeof address === 'string' ? address.trim() : null;
            if (phoneV || addressV) {
                const sets = [];
                const params = [];
                if (phoneV) { sets.push('phone = ?'); params.push(phoneV); }
                if (addressV) { sets.push('address = ?'); params.push(addressV); }
                params.push(customer_id);
                await connection.execute(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`, params);
            }
            const [orderResult] = await connection.execute(
                'INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)',
                [customer_id, total_amount]
            );
            const orderId = orderResult.insertId;
            for (const item of (items || [])) {
                await connection.execute(
                    'INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [orderId, item.menu_id, item.quantity, item.price]
                );
            }
            await connection.commit();
            res.json({ message: 'Order placed successfully', orderId });
        } catch (errInner) {
            await connection.rollback();
            res.status(500).json({ error: errInner.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// (publishable key endpoint removed as part of revert)

// Get Order History
router.get('/orders/:customerId', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [req.params.customerId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Favorites
router.get('/favorites/:customerId', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT m.* 
            FROM favorites f 
            JOIN menu m ON f.menu_id = m.id 
            WHERE f.customer_id = ?
        `, [req.params.customerId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to Favorites
router.post('/favorites', async (req, res) => {
    const { customer_id, menu_id } = req.body;
    try {
        await db.execute('INSERT IGNORE INTO favorites (customer_id, menu_id) VALUES (?, ?)', [customer_id, menu_id]);
        res.json({ message: 'Added to favorites' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove from Favorites
router.delete('/favorites/:customerId/:menuId', async (req, res) => {
    try {
        await db.execute('DELETE FROM favorites WHERE customer_id = ? AND menu_id = ?', [req.params.customerId, req.params.menuId]);
        res.json({ message: 'Removed from favorites' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
