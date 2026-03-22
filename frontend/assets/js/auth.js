(function () {
    const API_URL = 'http://127.0.0.1:8000';

    // Handle Login
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('username', document.getElementById('loginUsername').value);
        formData.append('password', document.getElementById('loginPassword').value);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                window.location.href = 'dashboard.html';
            } else {
                alert('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Handle Register
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            username: document.getElementById('regUsername').value,
            email: document.getElementById('regEmail').value,
            full_name: document.getElementById('regName').value,
            department: document.getElementById('regDept').value,
            password: document.getElementById('regPass').value,
            year: 1 // Default to year 1
        };

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                alert('Registration successful! Please login.');
                document.getElementById('pills-login-tab').click();
            } else {
                const error = await response.json();
                alert(`Registration failed: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Logout function
    window.logout = function () {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    };

    // Global Logout Listener
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.logout-btn, #logoutBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.logout();
            });
        });
    });
})();
