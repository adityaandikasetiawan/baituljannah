const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../database');
const { redirectIfAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        error: null,
        success: req.query.registered ? 'Registration successful! Please login.' : null
    });
});

// Login POST
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/login', {
            title: 'Login',
            error: errors.array()[0].msg,
            success: null
        });
    }

    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await dbHelpers.get(
            'SELECT * FROM users WHERE email = ? AND status = ?',
            [email, 'active']
        );

        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                success: null
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                success: null
            });
        }

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.fullName = user.full_name;
        req.session.avatar = user.avatar;

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else if (user.role === 'teacher') {
            res.redirect('/teacher/dashboard');
        } else if (user.role === 'student') {
            res.redirect('/student/dashboard');
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occurred. Please try again.',
            success: null
        });
    }
});

// Register page
router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        error: null,
        formData: {}
    });
});

// Register POST
router.post('/register', [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/register', {
            title: 'Register',
            error: errors.array()[0].msg,
            formData: req.body
        });
    }

    const { full_name, email, username, password, phone, address } = req.body;

    try {
        // Check if email already exists
        const existingEmail = await dbHelpers.get(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        if (existingEmail) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Email already registered',
                formData: req.body
            });
        }

        // Check if username already exists
        const existingUsername = await dbHelpers.get(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        if (existingUsername) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Username already taken',
                formData: req.body
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert user (default role: student)
        const result = await dbHelpers.run(
            `INSERT INTO users (username, email, password_hash, role, full_name, phone, address)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, password_hash, 'student', full_name, phone || null, address || null]
        );

        // Create student record
        const studentId = 'STD' + Date.now().toString().slice(-8);
        await dbHelpers.run(
            `INSERT INTO students (user_id, student_id, enrollment_date)
             VALUES (?, ?, date('now'))`,
            [result.id, studentId]
        );

        res.redirect('/login?registered=true');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', {
            title: 'Register',
            error: 'An error occurred. Please try again.',
            formData: req.body
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Forgot Password',
        error: null,
        success: null
    });
});

// Forgot password POST (placeholder - implement email functionality later)
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/forgot-password', {
            title: 'Forgot Password',
            error: errors.array()[0].msg,
            success: null
        });
    }

    const { email } = req.body;

    try {
        const user = await dbHelpers.get('SELECT id FROM users WHERE email = ?', [email]);
        
        // Always show success message for security (don't reveal if email exists)
        res.render('auth/forgot-password', {
            title: 'Forgot Password',
            error: null,
            success: 'If an account exists with this email, password reset instructions have been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.render('auth/forgot-password', {
            title: 'Forgot Password',
            error: 'An error occurred. Please try again.',
            success: null
        });
    }
});

module.exports = router;
