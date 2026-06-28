document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorAlert = document.getElementById('error-alert');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // refresh token cookie ko browser me save hone do
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('username', result.username);
            localStorage.setItem('role', result.role);

            if (result.department) {
                localStorage.setItem('department', result.department);
            } else {
                localStorage.removeItem('department');
            }

            // Role ke according sahi screen pe redirect karo
            if (result.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'dept-dashboard.html';
            }
        } else {
            errorAlert.innerText = result.message || 'Login Failed';
            errorAlert.classList.remove('d-none');
        }
    } catch (err) {
        errorAlert.innerText = 'Server connection error. Please make sure the server is running.';
        errorAlert.classList.remove('d-none');
        console.error(err);
    }
});
