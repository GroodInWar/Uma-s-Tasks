document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = form.title.value.trim();
        const day = form.day.value;
        const category = form.category.value.trim();
        const description = form.description.value.trim();

        if (!title || !day) {
            alert('Title and due date are required.');
            return;
        }

        try {
            const response = await fetch('/todo/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({title, day, category, description}),
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/todo';
            } else {
                const data = await response.text();
                alert(data || 'Failed to add item.');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        }
    });
});
