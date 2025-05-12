require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const https = require('https');
const usersRouter = require('./api/users');
const todoRouter = require('./api/todo');
const db = require('./db');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'supersecret';

const app = express();
const port = process.env.PORT || 4131;
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Static files configuration
const staticDir = path.join(__dirname, 'static');
const keyDir = path.join(__dirname, 'keys');

// Connection test
require('./db').query('SELECT 1')
    .then(() => console.log('[+] Database Test Completed Successfully'))
    .catch(err => {
        console.log('[-] Database Connected Error: ', err);
        process.exit(1);
    });

// Authentication middleware
const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            console.error("[-] Token not found");
            return res.status(401).json({error: 'Missing token'});
        }

        // Verify token
        const decoded = jwt.verify(token, secret);

        // Get user from database and check login status
        const users = await db.query(
            'SELECT username, status FROM users WHERE username = ?',
            [decoded.username]
        );

        const user = users[0];

        if (!user || !user.username || user.status !== 'Logged In') {
            console.error('[-] User not logged in or missing');
            res.clearCookie('jwtToken');
            return res.status(403).json({ error: 'Unauthorized' });
        }

        req.user = {username: user.username};
        next();
    } catch (e) {
        console.error('[-] Token verification failed:', e);
        res.clearCookie('jwtToken');
        return res.status(401).json({error: 'Invalid token'});
    }
};

db.connect().then(() => {
    console.log('[+] Successfully connected to database');
    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use(cookieParser());

    // Static routes
    app.use(express.static(path.join(staticDir, 'html')));
    app.use('/js', express.static(path.join(staticDir, 'js')));
    app.use('/css', express.static(path.join(staticDir, 'css')));
    app.use('/images', express.static(path.join(staticDir, 'images')));

    // Routes
    app.use("/api", usersRouter);
    app.use('/todo', requireAuth, todoRouter);


    // HTML routes
    const htmlRoutes = {
        '/': 'index',
        '/contact': 'contact',
        '/about': 'about',
        '/login': 'login',
        '/register': 'register'
    };

    Object.entries(htmlRoutes).forEach(([route, file]) => {
        app.get(route, (req, res) => {
            res.sendFile(path.join(staticDir, 'html', `${file}.html`));
        });
    });

    app.get('/register/success', (req, res) => {
        res.redirect('/login');
    });

    // Error handling
    app.use((err, req, res) => {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    });

    // HTTPS setup
    const key = fs.readFileSync(path.join(keyDir, 'key.pem'));
    const cert = fs.readFileSync(path.join(keyDir, 'cert.pem'));
    const server = https.createServer({key, cert}, app);

    server.listen(port, () => {
        console.log(`[+] Server running at https://localhost:${port}`);
    });
})

process.on('SIGINT', async () => {
    await db.close();
    process.exit(0);
});