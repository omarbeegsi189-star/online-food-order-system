// Admin Dashboard JavaScript
// Backend Integration with async API calls and error handling

// Reusing Utils from customer/js/utils.js concept but tailored for Admin
const API_BASE_URL = '/api'; 

const API = {
    async request(endpoint, options = {}, isFormData = false) {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {},
        };

        if (!isFormData) {
            defaultOptions.headers['Content-Type'] = 'application/json';
        }

        // Get token (using session storage or local storage as per implementation)
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && (user.role === 'admin' || user.role === 'super-admin')) {
            // In a real JWT setup: defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        } else {
             // Redirect if not admin
             // window.location.href = '/public/index.html';
        }
        if (user && user.role) {
            defaultOptions.headers['x-admin-role'] = user.role;
        }

        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    getStats: () => API.request('/admin/stats'),
    getReports: () => API.request('/admin/reports'),
    getOrders: () => API.request('/admin/orders'),
    updateOrderStatus: (id, status) => API.request(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    }),
    assignOrder: (id, deliveryUserId) => API.request(`/admin/orders/${id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ delivery_user_id: deliveryUserId })
    }),
    getMenu: () => API.request('/admin/menu'),
    // For admin, we might want to add/edit/delete
    addMenuItem: (item) => {
        const isFormData = item instanceof FormData;
        const options = {
            method: 'POST',
            body: isFormData ? item : JSON.stringify(item)
        };
        // If FormData, let browser set Content-Type
        if (isFormData) {
            return API.request('/admin/menu', options, true);
        }
        return API.request('/admin/menu', options);
    },
    updateMenuItem: (id, item) => {
        const isFormData = item instanceof FormData;
        const options = {
            method: 'PUT',
            body: isFormData ? item : JSON.stringify(item)
        };
        if (isFormData) {
            return API.request(`/admin/menu/${id}`, options, true);
        }
        return API.request(`/admin/menu/${id}`, options);
    },
    deleteMenuItem: (id) => API.request(`/admin/menu/${id}`, { method: 'DELETE' }),
    
    getUsers: () => API.request('/admin/users'), // Need to implement this route if not exists
    createUser: (user) => API.request('/admin/users', { method: 'POST', body: JSON.stringify(user) }),
    deleteUser: (id) => API.request(`/admin/users/${id}`, { method: 'DELETE' }),
    getAdmins: () => API.request('/admin/admins'),
    addAdmin: (data) => API.request('/admin/admins', { method: 'POST', body: JSON.stringify(data) }),
    deleteAdmin: (id) => API.request(`/admin/admins/${id}`, { method: 'DELETE' }),
    getDeliveryUsers: () => API.request('/admin/delivery-users'),
    addDeliveryUser: (data) => API.request('/admin/delivery-users', { method: 'POST', body: JSON.stringify(data) }),
    deleteDeliveryUser: (id) => API.request(`/admin/delivery-users/${id}`, { method: 'DELETE' }),
};

// UI Functions
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboard();
    loadReports();
    setupLogout();
});

function checkAuth() {
    // Basic auth check - in production use JWT validation
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '/index.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin' && user.role !== 'super-admin') {
        window.location.href = '/index.html';
    }
}

function setupLogout() {
    const btn = document.getElementById('logout-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '/index.html';
        });
    }

    // Header Icons Listeners
    const notifBtn = document.getElementById('notifications-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            alert('No new notifications');
        });
    }

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            openSettingsPanel();
        });
    }

    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('user'));
            alert(`Logged in as: ${user ? user.username : 'Admin'}`);
        });
    }
    
    // Theme Toggle (re-implement if needed, but usually handled by theme.js or similar)
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeBtn.textContent = isDark ? '☾' : '☀';
        });
    }
}

function ensureSettingsPanel() {
    const existing = document.getElementById('settings-panel');
    if (existing) return existing;
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.4)';
    overlay.style.display = 'none';
    overlay.style.zIndex = '1000';
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSettingsPanel();
    });
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.style.position = 'fixed';
    panel.style.right = '20px';
    panel.style.top = '70px';
    panel.style.width = '320px';
    panel.style.maxWidth = '90vw';
    panel.style.background = 'var(--card-bg, #fff)';
    panel.style.color = 'var(--text-color, #222)';
    panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
    panel.style.borderRadius = '12px';
    panel.style.padding = '16px';
    panel.style.display = 'none';
    panel.style.zIndex = '1001';
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    const title = document.createElement('h3');
    title.textContent = 'Settings';
    title.style.margin = '0';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', () => {
        closeSettingsPanel();
    });
    header.appendChild(title);
    header.appendChild(closeBtn);
    const body = document.createElement('div');
    body.style.display = 'grid';
    body.style.gap = '12px';
    const themeToggleOption = document.createElement('button');
    themeToggleOption.className = 'btn';
    themeToggleOption.textContent = 'Toggle Theme';
    themeToggleOption.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            const isDark = document.body.classList.contains('dark-mode');
            themeBtn.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }
    });
    body.appendChild(themeToggleOption);
    panel.appendChild(header);
    panel.appendChild(body);
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    return panel;
}

function openSettingsPanel() {
    const panel = ensureSettingsPanel();
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.style.display = 'block';
    panel.style.display = 'block';
}

function closeSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    if (panel) panel.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

async function loadDashboard() {
    // Only load if on dashboard home
    if (!document.getElementById('dashboard-stats')) return;

    try {
        const stats = await API.getStats();
        
        // Update Stats Cards
        updateStat('total-orders', stats.total_orders);
        updateStat('revenue', `$${parseFloat(stats.total_revenue || 0).toFixed(2)}`);
        updateStat('active-customers', stats.total_customers);
        updateStat('menu-items', stats.total_menu_items);

        // Update Recent Orders
        const recentOrdersTable = document.getElementById('recent-orders-tbody');
        if (recentOrdersTable && stats.recent_orders) {
            recentOrdersTable.innerHTML = stats.recent_orders.map(order => `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.customer_name}</td>
                    <td>${order.items_summary || 'View details'}</td>
                    <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateStat(target, value) {
    const card = document.querySelector(`[data-api-target="${target}"]`);
    if (card) {
        const valEl = card.querySelector('p:nth-child(2)');
        if (valEl) valEl.textContent = value;
    }
}

// Global scope for potential inline event handlers
window.API = API;

async function loadReports() {
    const revenueSummary = document.getElementById('revenue-summary');
    if (!revenueSummary) return;
    try {
        const stats = await API.getReports();
        const setCardValue = (target, value) => {
            const card = document.querySelector(`.grid#revenue-summary .card[data-report-target="${target}"]`);
            if (!card) return;
            const valEl = card.querySelector('p:nth-of-type(2)');
            if (valEl) valEl.textContent = value;
        };
        setCardValue('total-revenue', `$${parseFloat(stats.total_revenue || 0).toFixed(2)}`);
        setCardValue('orders', stats.total_orders != null ? parseInt(stats.total_orders, 10) : '');
        setCardValue('customers', stats.total_customers != null ? parseInt(stats.total_customers, 10) : '');
        const growthElCard = document.querySelector(`.grid#revenue-summary .card[data-report-target="growth"]`);
        if (growthElCard) {
            const valEl = growthElCard.querySelector('p:nth-of-type(2)');
            if (valEl) {
                if (stats.growth_percent == null) {
                    valEl.textContent = '';
                } else {
                    const val = Number(stats.growth_percent);
                    const sign = val >= 0 ? '+' : '';
                    valEl.textContent = `${sign}${val.toFixed(1)}%`;
                }
            }
        }
        const topItemsTbody = document.getElementById('top-items-tbody');
        if (topItemsTbody) {
            const items = Array.isArray(stats.top_items) ? stats.top_items : [];
            if (items.length === 0) {
                topItemsTbody.innerHTML = '';
            } else {
                topItemsTbody.innerHTML = items.map((it, idx) => `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${it.name}</td>
                        <td>${it.category}</td>
                        <td>${parseInt(it.total_qty || 0, 10)}</td>
                        <td>$${parseFloat(it.total_revenue || 0).toFixed(2)}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load reports:', err);
    }
}
