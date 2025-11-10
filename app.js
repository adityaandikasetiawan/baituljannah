const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const methodOverride = require('method-override');
const compression = require('compression');
require('dotenv').config();

// Initialize database
require('./database');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Behind Nginx/Reverse Proxy we need to trust proxy headers
// so secure cookies work correctly on HTTPS (X-Forwarded-Proto)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development, enable in production
}));

// HTTP compression (gzip/brotli) to reduce response sizes
app.use(compression());

// Rate limiting
// Global limiter (optional, reserved for future use)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Login-specific limiter: apply ONLY to POST /login
// More relaxed in development to ease testing
const loginLimiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'production' ? (15 * 60 * 1000) : (60 * 1000),
    max: process.env.NODE_ENV === 'production' ? 5 : 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.'
});

app.use('/login', (req, res, next) => {
    if (req.method === 'POST') {
        return loginLimiter(req, res, next);
    }
    return next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Serve WebP automatically if the client supports it and a .webp exists next to JPG/PNG
app.use((req, res, next) => {
    const accept = req.headers.accept || '';
    if (!accept.includes('image/webp')) return next();

    const ext = path.extname(req.path).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) return next();

    const webpPath = req.path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    let absoluteWebpPath = null;
    let cacheMaxAge = process.env.NODE_ENV === 'production' ? '1d' : '1d';

    if (webpPath.startsWith('/assets/')) {
        // /assets/** => public/assets/**
        absoluteWebpPath = path.join(__dirname, 'public', webpPath.replace(/^\/assets\//, 'assets/'));
        cacheMaxAge = process.env.NODE_ENV === 'production' ? '30d' : '1d';
    } else if (webpPath.startsWith('/uploads/')) {
        // /uploads/** => uploads/**
        absoluteWebpPath = path.join(__dirname, webpPath.replace(/^\//, ''));
        cacheMaxAge = process.env.NODE_ENV === 'production' ? '7d' : '1d';
    }

    if (!absoluteWebpPath) return next();

    try {
        if (require('fs').existsSync(absoluteWebpPath)) {
            res.type('image/webp');
            res.set('Cache-Control', `public, max-age=${
                /d$/.test(cacheMaxAge) ? parseInt(cacheMaxAge) * 24 * 60 * 60 : 24 * 60 * 60
            }`);
            return res.sendFile(absoluteWebpPath);
        }
    } catch (e) {
        // fall through
    }
    return next();
});

// Fallback: when requesting a sized WebP (e.g., image-640.webp) that doesn't exist,
// serve the base WebP (image.webp) if available to avoid 404s in srcset.
app.use((req, res, next) => {
    if (!req.path.endsWith('.webp')) return next();
    const match = req.path.match(/^(.*)-(\d+)\.webp$/);
    if (!match) return next();
    const baseWebp = `${match[1]}.webp`;
    let absoluteBasePath = null;
    let cacheMaxAge = process.env.NODE_ENV === 'production' ? '1d' : '1d';

    if (baseWebp.startsWith('/assets/')) {
        absoluteBasePath = path.join(__dirname, 'public', baseWebp.replace(/^\/assets\//, 'assets/'));
        cacheMaxAge = process.env.NODE_ENV === 'production' ? '30d' : '1d';
    } else if (baseWebp.startsWith('/uploads/')) {
        absoluteBasePath = path.join(__dirname, baseWebp.replace(/^\//, ''));
        cacheMaxAge = process.env.NODE_ENV === 'production' ? '7d' : '1d';
    }

    if (!absoluteBasePath) return next();

    try {
        if (require('fs').existsSync(absoluteBasePath)) {
            res.type('image/webp');
            res.set('Cache-Control', `public, max-age=${
                /d$/.test(cacheMaxAge) ? parseInt(cacheMaxAge) * 24 * 60 * 60 : 24 * 60 * 60
            }`);
            return res.sendFile(absoluteBasePath);
        }
    } catch (e) {
        // ignore
    }
    return next();
});

// Static files with caching
// News uploads: serve placeholder if requested image is missing (prevents broken thumbnails)
app.get(/^\/uploads\/news\/(.+)$/i, (req, res, next) => {
    const fs = require('fs');
    const requestedRelative = req.params[0];
    const requestedPath = path.join(__dirname, 'uploads', 'news', requestedRelative);
    try {
        if (fs.existsSync(requestedPath)) {
            return res.sendFile(requestedPath);
        }
    } catch (e) {
        // fall through to placeholder
    }
    const accept = req.headers.accept || '';
    const prefersWebp = accept.includes('image/webp');
    const placeholderPath = path.join(__dirname, 'public', 'assets', 'img', 'blog', prefersWebp ? 'blog-31.webp' : 'blog-31.jpg');
    res.type(prefersWebp ? 'image/webp' : 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.sendFile(placeholderPath);
});

app.use('/assets', express.static(path.join(__dirname, 'public/assets'), {
    maxAge: process.env.NODE_ENV === 'production' ? '30d' : '1d',
    immutable: true,
    cacheControl: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : '1d',
    cacheControl: true
}));

// Session configuration
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './'
    }),
    secret: process.env.SESSION_SECRET || 'baituljannah_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Make session data available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        username: req.session.username,
        email: req.session.email,
        role: req.session.role,
        fullName: req.session.fullName,
        avatar: req.session.avatar
    } : null;
    res.locals.appName = process.env.APP_NAME || 'Baitul Jannah School';
    res.locals.currentPath = req.path;
    next();
});

// Import routes
const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/', authRoutes);
app.use('/', publicRoutes);
app.use('/student', studentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Page Not Found',
        message: 'The page you are looking for does not exist.',
        statusCode: 404
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).render('error', {
        title: 'Error',
        message: err.message || 'Something went wrong!',
        statusCode: err.status || 500
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏫 Baitul Jannah School Management System          ║
║                                                       ║
║   Server running on: http://localhost:${PORT}        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║                                                       ║
║   Default Login Credentials:                         ║
║   Admin:   admin@baituljannah.com / admin123         ║
║   Teacher: teacher@baituljannah.com / teacher123     ║
║   Student: student@baituljannah.com / student123     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
