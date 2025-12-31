// ===============================================
// Authentication and Session Management System
// ===============================================

import { Storage, STORAGE_KEYS, API } from './utils.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    init() {
        // Load stored session on page load
        this.loadStoredSession();
        // Update UI based on current auth state
        this.updateAuthUI();
    }

    // Load stored session
    loadStoredSession() {
        try {
            // Check localStorage first, then sessionStorage
            let storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
            let storedUser = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);

            if (storedToken && storedUser) {
                this.token = JSON.parse(storedToken);
                this.currentUser = JSON.parse(storedUser);
            }
        } catch (error) {
            console.error('Error loading stored session:', error);
            this.logout();
        }
    }

    // Store session
    storeSession(token, user, remember = true) {
        try {
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(token));
            storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

            this.token = token;
            this.currentUser = user;
        } catch (error) {
            console.error('Error storing session:', error);
        }
    }

    // Clear stored session
    clearSession() {
        Storage.remove(STORAGE_KEYS.TOKEN);
        Storage.remove(STORAGE_KEYS.USER);

        // Also clear from sessionStorage
        try {
            sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
            sessionStorage.removeItem(STORAGE_KEYS.USER);
        } catch (e) { console.error(e); }

        this.token = null;
        this.currentUser = null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!(this.token && this.currentUser);
    }

    // Get current user role
    getCurrentRole() {
        return this.currentUser?.role || null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Login function
    async login(email, password) {
        try {
            const data = await API.login({ email, password });

            // data should contain { message, role, user, token? }
            // If my backend doesn't return token (it returns user object), I might need to adjust.
            // My backend currently doesn't implement JWT, just simple response. 
            // For now, I'll simulate a token or just rely on user object if no token.
            // Wait, my backend implementation of auth.js (routes) does NOT return a token.
            // I should probably update backend to return a simple token or just ID.
            // But since I'm using localStorage for session, I can just store the user object.

            const token = 'session_' + data.user.id; // Mock token since backend doesn't provide one yet
            this.storeSession(token, { ...data.user, role: 'customer' });
            this.updateAuthUI();

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async signup(userData) {
        try {
            await API.signup(userData);
            return { success: true };
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    }

    logout() {
        this.clearSession();
        this.updateAuthUI();
        window.location.href = 'index.html';
    }

    updateAuthUI() {
        const accountLink = document.getElementById('account-link');
        const logoutBtn = document.getElementById('logout-btn');
        const userNameDisplay = document.getElementById('user-name-display');

        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                this.logout();
            };
        }

        if (this.isAuthenticated()) {
            if (accountLink) {
                accountLink.textContent = 'Profile';
                accountLink.href = 'customer_profile.html';
            }
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (userNameDisplay) {
                userNameDisplay.textContent = `Hi, ${this.currentUser.name || this.currentUser.full_name || 'User'}`;
                userNameDisplay.style.display = 'inline-block';
            }
        } else {
            if (accountLink) {
                accountLink.textContent = 'Account';
                accountLink.href = 'auth.html';
            }
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userNameDisplay) userNameDisplay.style.display = 'none';
        }
    }
}

export default new AuthManager();
