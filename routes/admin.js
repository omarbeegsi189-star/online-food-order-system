const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../customer/media/uploads');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get All Menu Items
router.get('/menu', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM menu');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Menu Item
router.post('/menu', upload.single('image'), async (req, res) => {
    const toNull = (v) => {
        if (v === undefined || v === null) return null;
        if (typeof v === 'string') {
            const t = v.trim();
            if (t === '' || t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return null;
            return t;
        }
        return v;
    };
    const toNumberOrNull = (v) => {
        const n = parseFloat(v);
        if (!Number.isFinite(n)) return null;
        return Math.round(n * 100) / 100;
    };
    const nameV = toNull(req.body.name);
    const descV = toNull(req.body.description);
    const priceV = toNumberOrNull(req.body.price);
    const categoryV = toNull(req.body.category);
    const imageV = req.file ? '/media/uploads/' + req.file.filename : toNull(req.body.image_url);
    try {
        const params = [nameV, descV, priceV, categoryV, imageV].map(v => (v === undefined ? null : v));
        await db.execute('INSERT INTO menu (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)', 
            params);
        res.json({ message: 'Menu item added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Menu Item
router.put('/menu/:id', upload.single('image'), async (req, res) => {
    const toNull = (v) => {
        if (v === undefined || v === null) return null;
        if (typeof v === 'string') {
            const t = v.trim();
            if (t === '' || t.toLowerCase() === 'null') return null;
            return t;
        }
        return v;
    };
    const toNumberOrNull = (v) => {
        const n = parseFloat(v);
        if (!Number.isFinite(n)) return null;
        return Math.round(n * 100) / 100;
    };
    const nameV = toNull(req.body.name);
    const descV = toNull(req.body.description);
    const priceV = toNumberOrNull(req.body.price);
    const categoryV = toNull(req.body.category);
    const imageV = req.file ? '/media/uploads/' + req.file.filename : toNull(req.body.image_url);
    try {
        const params = [nameV, descV, priceV, categoryV, imageV, req.params.id].map(v => (v === undefined ? null : v));
        await db.execute('UPDATE menu SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?', 
            params);
        res.json({ message: 'Menu item updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Menu Item
router.delete('/menu/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM menu WHERE id = ?', [req.params.id]);
        res.json({ message: 'Menu item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Orders
router.get('/orders', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                o.*,
                c.full_name AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_address,
                (
                    SELECT GROUP_CONCAT(CONCAT(oi.quantity, 'x ', m.name) SEPARATOR ', ')
                    FROM order_items oi
                    LEFT JOIN menu m ON oi.menu_id = m.id
                    WHERE oi.order_id = o.id
                ) AS items_summary
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Order Status
router.put('/orders/:id/status', async (req, res) => {
    const { status, delivery_user_id } = req.body;
    const allowed = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    try {
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        if (delivery_user_id && status !== 'Out for Delivery') {
            return res.status(400).json({ error: 'Assignment requires status "Out for Delivery"' });
        }
        if (delivery_user_id) {
            const [du] = await db.execute('SELECT id FROM delivery_users WHERE id = ?', [delivery_user_id]);
            if (!du || du.length === 0) {
                return res.status(404).json({ error: 'Delivery user not found' });
            }
            await db.execute('UPDATE orders SET status = ?, delivery_user_id = ? WHERE id = ?', [status, delivery_user_id, req.params.id]);
        } else {
            await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        }
        res.json({ message: 'Order status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign Order to Delivery User
router.put('/orders/:id/assign', async (req, res) => {
    const { delivery_user_id } = req.body;
    try {
        if (!delivery_user_id) {
            return res.status(400).json({ error: 'delivery_user_id is required' });
        }
        const [ord] = await db.execute('SELECT status FROM orders WHERE id = ?', [req.params.id]);
        if (!ord || ord.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (ord[0].status === 'Delivered' || ord[0].status === 'Cancelled') {
            return res.status(400).json({ error: 'Cannot assign delivered or cancelled order' });
        }
        const [du] = await db.execute('SELECT id FROM delivery_users WHERE id = ?', [delivery_user_id]);
        if (!du || du.length === 0) {
            return res.status(404).json({ error: 'Delivery user not found' });
        }
        await db.execute('UPDATE orders SET delivery_user_id = ?, status = ? WHERE id = ?', [delivery_user_id, 'Out for Delivery', req.params.id]);
        res.json({ message: 'Order assigned' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Reports
router.get('/reports', async (req, res) => {
    try {
        const [totalOrders] = await db.execute('SELECT COUNT(*) as count FROM orders');
        const [totalRevenue] = await db.execute('SELECT SUM(total_amount) as total FROM orders');
        const [totalCustomers] = await db.execute('SELECT COUNT(*) as count FROM customers');
        const [currentMonthRevenueRows] = await db.execute(`
            SELECT COALESCE(SUM(total_amount),0) as total
            FROM orders
            WHERE YEAR(created_at) = YEAR(CURRENT_DATE)
              AND MONTH(created_at) = MONTH(CURRENT_DATE)
        `);
        const [lastMonthRevenueRows] = await db.execute(`
            SELECT COALESCE(SUM(total_amount),0) as total
            FROM orders
            WHERE YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))
              AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))
        `);
        const currentMonthRevenue = currentMonthRevenueRows[0]?.total || 0;
        const lastMonthRevenue = lastMonthRevenueRows[0]?.total || 0;
        const growth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null;
        const [topItems] = await db.execute(`
            SELECT 
                m.id,
                m.name,
                m.category,
                COALESCE(SUM(oi.quantity),0) AS total_qty,
                COALESCE(SUM(oi.price * oi.quantity),0) AS total_revenue
            FROM order_items oi
            LEFT JOIN menu m ON oi.menu_id = m.id
            GROUP BY m.id, m.name, m.category
            ORDER BY total_qty DESC
            LIMIT 10
        `);
        res.json({
            total_orders: totalOrders[0].count,
            total_revenue: totalRevenue[0].total || 0,
            total_customers: totalCustomers[0].count,
            growth_percent: growth,
            top_items: topItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manage Delivery Users (Get)
router.get('/delivery-users', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, full_name, phone, vehicle, area, status FROM delivery_users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Delivery User
router.post('/delivery-users', async (req, res) => {
    const { username, password, full_name, phone, vehicle, area } = req.body;
    try {
        if ((req.headers['x-admin-role'] || '').toLowerCase() !== 'super-admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO delivery_users (username, password, full_name, phone, vehicle, area) VALUES (?, ?, ?, ?, ?, ?)', 
            [username, hashedPassword, full_name, phone, vehicle, area]
        );
        res.json({ message: 'Delivery user created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/delivery-users/:id', async (req, res) => {
    try {
        const role = (req.headers['x-admin-role'] || '').toLowerCase();
        if (role !== 'admin' && role !== 'super-admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await db.execute('DELETE FROM delivery_users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Delivery user deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Admins
router.get('/admins', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, full_name, phone, role FROM admins');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Admin
router.post('/admins', async (req, res) => {
    const { username, password, full_name, phone, role } = req.body;
    try {
        if ((req.headers['x-admin-role'] || '').toLowerCase() !== 'super-admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO admins (username, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?)', 
            [username, hashedPassword, full_name, phone, role]
        );
        res.json({ message: 'Admin created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/admins/:id', async (req, res) => {
    try {
        const role = (req.headers['x-admin-role'] || '').toLowerCase();
        if (role !== 'admin' && role !== 'super-admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const [rows] = await db.execute('SELECT role FROM admins WHERE id = ?', [req.params.id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        await db.execute('DELETE FROM admins WHERE id = ?', [req.params.id]);
        res.json({ message: 'Admin deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const [totalOrders] = await db.execute('SELECT COUNT(*) as count FROM orders');
        const [totalRevenue] = await db.execute('SELECT SUM(total_amount) as total FROM orders');
        const [totalCustomers] = await db.execute('SELECT COUNT(*) as count FROM customers');
        const [totalMenuItems] = await db.execute('SELECT COUNT(*) as count FROM menu');
        
        const [recentOrders] = await db.execute(`
            SELECT o.id, c.full_name as customer_name, o.total_amount, o.status, o.created_at
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            ORDER BY o.created_at DESC 
            LIMIT 5
        `);
        
        res.json({
            total_orders: totalOrders[0].count,
            total_revenue: totalRevenue[0].total || 0,
            total_customers: totalCustomers[0].count,
            total_menu_items: totalMenuItems[0].count,
            recent_orders: recentOrders
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
