const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();
const fetch = global.fetch;

// Admin Login
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const admin = rows[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({ message: 'Login successful', role: admin.role || 'admin', user: { id: admin.id, username: admin.username, role: admin.role || 'admin' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delivery Login
router.post('/delivery/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM delivery_users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const delivery = rows[0];
        const match = await bcrypt.compare(password, delivery.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({ message: 'Login successful', role: 'delivery', user: { id: delivery.id, username: delivery.username } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM customers WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const customer = rows[0];
        const match = await bcrypt.compare(password, customer.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({ message: 'Login successful', role: 'customer', user: { id: customer.id, name: customer.full_name, email: customer.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Customer Signup
router.post('/customer/signup', async (req, res) => {
    const { full_name, email, password, phone, address } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO customers (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)', 
            [full_name, email, hashedPassword, phone, address]);
        res.json({ message: 'Signup successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Google OAuth config for Customer
router.get('/customer/google/config', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(400).json({ error: 'Google client not configured' });
    res.json({ client_id: clientId });
});

// Customer Google OAuth login (verify ID token)
router.post('/customer/google', async (req, res) => {
    try {
        const { credential } = req.body;
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) return res.status(400).json({ error: 'Google client not configured' });
        if (!credential) return res.status(400).json({ error: 'Missing credential' });
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
        const resp = await fetch(verifyUrl);
        if (!resp.ok) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }
        const info = await resp.json();
        if (info.aud !== clientId) {
            return res.status(401).json({ error: 'Audience mismatch' });
        }
        const email = info.email;
        const name = info.name || info.given_name || 'Customer';
        if (!email) return res.status(400).json({ error: 'Email not provided by Google' });
        // Find or create customer
        const [rows] = await db.execute('SELECT id, full_name, email FROM customers WHERE email = ?', [email]);
        let user;
        if (rows.length > 0) {
            user = rows[0];
        } else {
            const hashedPassword = await bcrypt.hash('google_oauth_account', 10);
            const [result] = await db.execute(
                'INSERT INTO customers (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
                [name, email, hashedPassword, '', '']
            );
            user = { id: result.insertId, full_name: name, email };
        }
        res.json({ message: 'Login successful', role: 'customer', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
