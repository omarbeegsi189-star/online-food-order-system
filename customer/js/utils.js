const DEV_MODE = false; // Set to false to use real API

// Utility functions for localStorage
const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    }
};

// Standardized localStorage keys
const STORAGE_KEYS = {
    USER: 'healthy_user',
    TOKEN: 'healthy_token',
    CART: 'healthy_cart',
    FAVORITES: 'healthy_favorites',
    ORDERS: 'healthy_orders'
};

// API helper functions
const API = {
    async request(endpoint, options = {}) {
        const baseURL = (window.location && window.location.port === '3001') ? 'http://localhost:3000/api' : '/api';
        const url = `${baseURL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Add token if exists
        const token = Storage.get(STORAGE_KEYS.TOKEN);
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { ...defaultOptions, ...options };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

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

    // Specific API methods
    async login(credentials) {
        return this.request('/auth/customer/login', {
            method: 'POST',
            body: credentials
        });
    },

    async signup(userData) {
        return this.request('/auth/customer/signup', {
            method: 'POST',
            body: userData
        });
    },
    
    async getMenu() {
        return this.request('/customer/menu');
    },

    async getProfile(id) {
        return this.request(`/customer/profile/${id}`);
    },

    async updateProfile(id, data) {
        return this.request(`/customer/profile/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    async placeOrder(orderData) {
        return this.request('/customer/order', {
            method: 'POST',
            body: orderData
        });
    },

    async getOrders(customerId) {
        return this.request(`/customer/orders/${customerId}`);
    },

    async getFavorites(customerId) {
        return this.request(`/customer/favorites/${customerId}`);
    },

    async addFavorite(customerId, menuId) {
        return this.request('/customer/favorites', {
            method: 'POST',
            body: { customer_id: customerId, menu_id: menuId }
        });
    },

    async removeFavorite(customerId, menuId) {
        return this.request(`/customer/favorites/${customerId}/${menuId}`, {
            method: 'DELETE'
        });
    }
};

const Utils = {
    showNotification: (message, type = 'info') => {
        // Simple alert for now, can be improved with a toast
        // alert(message);
        // Create a toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '10px 20px';
        toast.style.backgroundColor = type === 'success' ? '#27ae60' : '#e74c3c';
        toast.style.color = 'white';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '1000';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },
    formatPrice: (price) => {
        return `$${parseFloat(price).toFixed(2)}`;
    }
};

export { Storage, STORAGE_KEYS, API, Utils };
