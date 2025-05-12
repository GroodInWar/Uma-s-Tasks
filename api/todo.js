const router = require('express').Router();
const db = require('../db');
// Get todo.pug
router.get('/', async (req, res) => {
    try {

        const items = await db.query(
            'SELECT * FROM items WHERE user_id = (SELECT user_id FROM users WHERE username = ?)',
            [req.user.username]
        );

        res.render('pages/todo', {
            user: req.user.username,
            items
        });
    } catch (err) {
        console.error('[-] Failed to load todo items:', err);
        res.status(500).send('Server error loading todo list');
    }
});

// Render form for new to-do item
router.route('/add')
    .get(async (req, res) => {
        res.render('pages/add', {
            user: req.user.username
        });
    })
    .post(async (req, res) => {
        const {title, day, category, description} = req.body;

        try {
            // Get the user's ID
            const users = await db.query(
                'SELECT user_id FROM users WHERE username = ?',
                [req.user.username]
            );

            if (!users || users.length === 0) {
                return res.status(400).send('User not found');
            }

            const user_id = users[0].user_id;

            // Insert the new item
            await db.query(
                'INSERT INTO items (user_id, title, day, category, description, status) VALUES (?, ?, ?, ?, ?, ?)',
                [user_id, title, day, category, description, 'In progress']
            );

            res.redirect('/todo');
        } catch (err) {
            console.error('[-] Failed to insert item:', err);
            res.status(500).send('Failed to add item');
        }
    });

// Mark as complete
router.post('/complete/:id', async (req, res) => {
    const id = req.params.id;
    await db.query('UPDATE items SET status = ? WHERE item_id = ?', ['Complete', id]);
    res.redirect('/todo');
});

// Delete item
router.post('/delete/:id', async (req, res) => {
    console.log('[Delete Route] item_id =', req.params.id);
    const id = req.params.id;
    if (!id || isNaN(id)) return res.status(400).send('Invalid item ID');

    await db.query('DELETE FROM items WHERE item_id = ?', [id]);
    res.redirect('/todo');
});

// Edit page
router.get('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const rows = await db.query('SELECT * FROM items WHERE item_id = ?', [id]);
    if (rows.length === 0) return res.redirect('/todo');
    res.render('pages/edit', {item: rows[0]});
});

// Save edits (optional POST route)
router.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const {title, description, day, category} = req.body;
    await db.query(
        'UPDATE items SET title = ?, description = ?, day = ?, category = ? WHERE item_id = ?',
        [title, description, day, category, id]
    );
    res.redirect('/todo');
});

module.exports = router;