import authManager from './auth.js';

// Make authManager available globally for inline onclick handlers (logout)
window.authManager = authManager;

// Initialize Auth UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    authManager.init(); // This calls updateAuthUI internally
});
