const showCustomerAuthPrompt = () => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'auth-overlay';
    modal.innerHTML = `
      <div class="auth-overlay-bg"></div>
      <div class="auth-card-modal">
        <h3>Authentication Required</h3>
        <p>Please log in or sign up to continue your order.</p>
        <div class="auth-modal-actions">
          <button id="cust-auth-login" class="modal-btn primary">Login</button>
          <button id="cust-auth-signup" class="modal-btn secondary">Sign Up</button>
          <button id="cust-auth-cancel" class="modal-btn ghost">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const cleanup = () => {
      modal.classList.add('fade-out');
      setTimeout(() => modal.remove(), 300);
    };

    document.getElementById('cust-auth-login').onclick = () => { cleanup(); resolve('login'); };
    document.getElementById('cust-auth-signup').onclick = () => { cleanup(); resolve('signup'); };
    document.getElementById('cust-auth-cancel').onclick = () => { cleanup(); resolve('cancel'); };
  });
};
window.showCustomerAuthPrompt = showCustomerAuthPrompt;
