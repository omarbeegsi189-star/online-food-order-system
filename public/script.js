function openTab(tabName) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    // Show selected
    document.getElementById(tabName).classList.remove('hidden');
    
    // Activate button
    const buttons = document.querySelectorAll('.tab-btn');
    if (tabName === 'admin') buttons[0]?.classList.add('active');
    if (tabName === 'delivery') buttons[1]?.classList.add('active');

    if (tabName === 'admin') {
        const aUser = document.getElementById('admin-username');
        const aPass = document.getElementById('admin-password');
        if (aUser && aUser.value.trim() === '') aUser.value = 'admin';
        if (aPass && aPass.value.trim() === '') aPass.value = 'password';
    }
    if (tabName === 'delivery') {
        const dUser = document.getElementById('delivery-username');
        const dPass = document.getElementById('delivery-password');
        if (dUser && dUser.value.trim() === '') dUser.value = 'delivery';
        if (dPass && dPass.value.trim() === '') dPass.value = 'password';
    }
}

// Handle Forms
// Customer login removed — customer auth happens within customer flow

document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    await login('/api/auth/admin/login', { username, password }, '/admin/index.html');
});

document.getElementById('delivery-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('delivery-username').value;
    const password = document.getElementById('delivery-password').value;
    
    await login('/api/auth/delivery/login', { username, password }, '/delivery/index.html');
});

async function login(url, data, redirectUrl) {
    try {
        // Prefill defaults if user left fields blank (admin/delivery convenience)
        if (url.includes('/admin/login')) {
            data.username = data.username || 'admin';
            data.password = data.password || 'password';
        }
        if (url.includes('/delivery/login')) {
            data.username = data.username || 'delivery';
            data.password = data.password || 'password';
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Save user info to localStorage
            const userWithRole = { ...result.user, role: result.role };
            localStorage.setItem('user', JSON.stringify(userWithRole)); // For Admin/Delivery
            localStorage.setItem('healthy_user', JSON.stringify(userWithRole)); // For Customer
            localStorage.setItem('role', result.role);
            
            // Set mock token for Customer AuthManager (consistent with utils.js)
            const token = 'session_' + result.user.id;
            localStorage.setItem('healthy_token', JSON.stringify(token));

            window.location.href = redirectUrl;
        } else {
            alert(result.error || 'Login failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred. Please try again.');
    }
}
