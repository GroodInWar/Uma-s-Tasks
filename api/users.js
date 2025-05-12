const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');

const secret = process.env.JWT_SECRET || 'supersecret';

// User registration
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Missing username/password' });
        }

        const existing = await db.query(
            'SELECT username FROM users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (username, passwordHash, status) VALUES (?, ?, ?)',
            [username, hashedPassword, 'Logged out']
        );

        res.status(201).redirect('/login');
    } catch (error) {
        res.status(400).redirect('/register');
    }
});

// User authentication
router.post('/auth', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(401).json({ error: 'Missing credentials' });
        }

        const users = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await db.query(
            'UPDATE users SET status = ? WHERE username = ?',
            ['Logged In', username]
        );
        console.log('[+] Updated login status for', username);

        const token = jwt.sign({ username: user.username }, secret, { expiresIn: '1h' });
        console.log('[Token]', token);

        res.cookie('jwtToken', token, {
            httpOnly: false, // Reminder: use true
            secure: false,   // Reminder: use true
            sameSite: 'lax',
            maxAge: 3600000
        });

        res.status(200).json({
            success: true,
            redirect: '/todo'
        });
    } catch (error) {
        console.error('[-] Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
});

// Log out
router.post('/logout', (req, res) => {
    res.clearCookie('jwtToken');
    res.redirect('/login');
});

// Get user status
router.get('/status', async (req, res) => {
    try {
        const token = req.headers['x-auth'];
        if (!token) {
            return res.status(401).json({ error: 'Missing token' });
        }

        const decoded = jwt.verify(token, secret);

        const users = await db.query(
            'SELECT username, status FROM users WHERE username = ?',
            [decoded.username]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('[-] Status check error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;