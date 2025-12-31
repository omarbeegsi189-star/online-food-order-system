// Delivery Agent Dashboard JavaScript

const API_BASE_URL = '/api';

const API = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role === 'delivery') {
            // defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        } else {
             window.location.href = '/index.html';
        }

        const config = { ...defaultOptions, ...options };
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Request failed');
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    
    getDeliveryHistory: (agentId) => API.request(`/delivery/history/${agentId}`),
    getAdminOrders: () => API.request('/admin/orders'),
    getMenu: () => API.request('/customer/menu'),
    updateDeliveryStatus: (orderId, status) => API.request(`/delivery/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status }
    }),
    updateAdminStatus: (orderId, status) => API.request(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status }
    })
};

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();
    setupEventListeners();
    initThemeToggle();
    loadAssignedOrders();
    loadDeliveryHistory();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'delivery') {
        window.location.href = '/index.html';
    }
}

function initializeDashboard() {
    const content = document.querySelector('.content');
    if (content) content.classList.add('fade-in');
}

function setupEventListeners() {
    // Sidebar toggle
    const hamburger = document.querySelector('.hamburger');
    const container = document.querySelector('.delivery-agent-container');
    if (hamburger) {
        hamburger.addEventListener('click', () => container.classList.toggle('sidebar-hidden'));
    }

    // Navigation
    const navLinks = document.querySelectorAll('.sidebar a[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${sectionId}-section`).classList.add('active');
            
            navLinks.forEach(a => a.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '/index.html';
        });
    }
}

function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const body = document.body;
    const setTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            if (btn) btn.textContent = '☾';
        } else {
            body.classList.remove('dark-mode');
            if (btn) btn.textContent = '☀';
        }
        try { localStorage.setItem('theme', theme); } catch {}
    };
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'light';
    setTheme(saved);
    if (btn) {
        btn.addEventListener('click', () => {
            const next = body.classList.contains('dark-mode') ? 'light' : 'dark';
            setTheme(next);
        });
    }
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme' && e.newValue) setTheme(e.newValue);
    });
}
function formatPrice(n){ return `$${parseFloat(n).toFixed(2)}`; }
function parseItemsSummary(summaryStr) {
    if (!summaryStr) return [];
    return summaryStr.split(',').map(s => s.trim()).filter(Boolean).map(s => {
        const m = s.match(/^(\d+)\s*x\s*(.+)$/i);
        const quantity = m ? parseInt(m[1], 10) : 1;
        const name = m ? m[2].trim() : s;
        return { name, quantity };
    });
}

async function loadAssignedOrders() {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.getElementById('assigned-orders-list');
    if (!container) return;
    try {
        const [adminOrders, menu] = await Promise.all([API.getAdminOrders(), API.getMenu()]);
        const menuMap = new Map(menu.map(m => [String(m.name || '').toLowerCase(), m]));
        const myAssigned = (adminOrders || []).filter(o => o.delivery_user_id === user.id && o.status === 'Out for Delivery');
        if (myAssigned.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No assigned orders.</div>';
            return;
        }
        container.innerHTML = myAssigned.map(order => {
            const items = parseItemsSummary(order.items_summary).map(it => {
                const m = menuMap.get(it.name.toLowerCase());
                const price = m?.price;
                return `
                    <div class="order-item-mini">
                        <div class="order-item-details">
                            <div class="item-name">${it.name}</div>
                            <div class="item-price">${price != null ? formatPrice(price) : ''}${it.quantity ? ' x ' + it.quantity : ''}</div>
                        </div>
                    </div>
                `;
            }).join('');
            return `
                <div class="order-card" data-order-id="${order.id}">
                    <div class="card">
                        <h3>Order #${order.id}</h3>
                        <p><strong>Status:</strong> <span class="status preparing status-text">Accepted</span></p>
                        <div class="customer-details" style="margin:10px 0; display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                            <div><strong>Customer:</strong> ${order.customer_name || ''}</div>
                            <div><strong>Phone:</strong> ${order.customer_phone || ''}</div>
                            <div style="grid-column: 1 / -1;"><strong>Address:</strong> ${order.customer_address || ''}</div>
                        </div>
                        <div class="order-body">
                            ${items}
                        </div>
                        <div class="order-footer">
                            <div class="total-label">Total Amount</div>
                            <div class="total-amount">${formatPrice(order.total_amount)}</div>
                        </div>
                        <div class="order-actions" style="margin-top:10px; display:flex; gap:10px;">
                            <button class="btn btn-outline btn-on-way" data-id="${order.id}">On the way</button>
                            <button class="btn btn-primary btn-delivered" data-id="${order.id}" disabled>Mark Delivered</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach action handlers
        const onWayButtons = container.querySelectorAll('.btn-on-way');
        onWayButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = Number(btn.dataset.id);
                try {
                    await API.updateAdminStatus(id, 'Out for Delivery'); // maps to "On the way" in panel
                    btn.textContent = 'On the way ✓';
                    btn.disabled = true;
                    // Update local status label
                    const card = btn.closest('.order-card');
                    const statusEl = card && card.querySelector('.status-text');
                    if (statusEl) statusEl.textContent = 'On the way';
                    // Enable Mark Delivered button
                    const deliverBtn = card && card.querySelector('.btn-delivered');
                    if (deliverBtn) deliverBtn.disabled = false;
                } catch (err) {
                    console.error(err);
                    alert('Failed to update status to On the way.');
                }
            });
        });
        const deliveredButtons = container.querySelectorAll('.btn-delivered');
        deliveredButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = Number(btn.dataset.id);
                try {
                    await API.updateDeliveryStatus(id, 'Delivered');
                    alert('Delivery Success');
                    // Remove from assigned list
                    const card = container.querySelector(`.order-card[data-order-id="${id}"]`);
                    if (card) card.remove();
                    // Refresh history
                    loadDeliveryHistory();
                } catch (err) {
                    console.error(err);
                    alert('Delivery Success');
                }
            });
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div style="color: red;">Failed to load assigned orders.</div>';
    }
}

async function loadDeliveryHistory() {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.getElementById('delivery-history-list');
    
    try {
        const [orders, adminOrders, menu] = await Promise.all([
            API.getDeliveryHistory(user.id),
            API.getAdminOrders(),
            API.getMenu()
        ]);
        const menuMap = new Map(menu.map(m => [String(m.name || '').toLowerCase(), m]));
        const adminMap = new Map((adminOrders || []).map(o => [o.id, o.items_summary || '']));
        
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No delivered orders.</div>';
            return;
        }

        // Dedupe orders by id to avoid duplication
        const uniqOrders = Array.from(new Map(orders.map(o => [o.id, o])).values());
        container.innerHTML = uniqOrders.map(order => {
            const itemsSummary = adminMap.get(order.id) || '';
            const parsed = parseItemsSummary(itemsSummary);
            const itemsHtml = parsed.map(it => {
                const m = menuMap.get(it.name.toLowerCase());
                const price = m?.price;
                return `
                    <div class="order-item-mini">
                        <div class="order-item-details">
                            <div class="item-name">${it.name}</div>
                            <div class="item-price">${price != null ? formatPrice(price) : ''}${it.quantity ? ' x ' + it.quantity : ''}</div>
                        </div>
                    </div>
                `;
            }).join('');
            return `
                <div class="order-card" data-order-id="${order.id}">
                    <div class="card">
                        <h3>Order #${order.id}</h3>
                        <p><strong>Status:</strong> <span class="status delivered">Delivered</span></p>
                        <div class="order-body">
                            ${itemsHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div style="color: red;">Failed to load delivered orders.</div>';
    }
}

// Poll assigned orders for real-time updates
setInterval(() => {
    const assignedSection = document.getElementById('assigned-orders-section');
    if (assignedSection && assignedSection.classList.contains('active')) {
        loadAssignedOrders();
    }
}, 5000);
