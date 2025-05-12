document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    if (!form) return;

    function showError(message) {
        document.querySelectorAll('.error').forEach(el => el.remove());

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.style.color = 'red';
        errorDiv.style.marginTop = '10px';
        errorDiv.textContent = message;

        const formContainer = document.querySelector('form fieldset') || document.body;
        formContainer.prepend(errorDiv);
    }

    function validateRegisterForm() {
        const usernameRegex = /^(?=[A-Za-z])[A-Za-z0-9_.]{4,20}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        const username = form.username.value.trim();
        const password = form.password.value.trim();
        const confirmPassword = form.confirmPassword.value.trim();

        if (!usernameRegex.test(username)) {
            showError('Username must be 4-20 characters starting with a letter');
            return false;
        }

        if (!passwordRegex.test(password)) {
            showError('Password needs 8+ characters with uppercase, lowercase, and number');
            return false;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return false;
        }

        return true;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.querySelectorAll('.error').forEach(err => err.remove());

        if (!validateRegisterForm()) return;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username.value.trim(),
                    password: form.password.value.trim()
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                window.location.href = '/login';
            } else {
                showError(data.error || 'Registration failed');
            }
        } catch (error) {
            showError('Network error - please try again later');
        }
    });
});
