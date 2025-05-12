document.addEventListener('DOMContentLoaded', async () => {
    const authLink = document.getElementById('auth-link');

    if (!authLink) return;

    try {
        const res = await fetch('/api/status', {
            headers: {
                'x-auth': getCookie('jwtToken')
            }
        });

        if (!res.ok) return;
        const user = await res.json();

        if (user.status === 'Logged In') {
            authLink.textContent = 'Logout';
            authLink.href = '#';
            const newLink = document.createElement('a');
            newLink.href = '/todo';
            newLink.textContent = 'Tasks';
            authLink.parentNode.insertBefore(newLink, authLink);
            authLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('/api/logout', { method: 'POST' });
                location.href = '/login';
            });
        }
    } catch (err) {
        console.error('[-] Auth check error:', err);
    }

    function getCookie(name) {
        const parts = document.cookie.split(';').map(c => c.trim());
        for (const c of parts) {
            if (c.startsWith(name + '=')) return c.split('=')[1];
        }
        return '';
    }
});
