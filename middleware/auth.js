// Authentication middleware

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page',
        user: req.session.userId ? req.session : null
    });
};

// Check if user is teacher
const isTeacher = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'teacher') {
        return next();
    }
    res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page',
        user: req.session.userId ? req.session : null
    });
};

// Check if user is student
const isStudent = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'student') {
        return next();
    }
    res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page',
        user: req.session.userId ? req.session : null
    });
};

// Check if user is teacher or admin
const isTeacherOrAdmin = (req, res, next) => {
    if (req.session && req.session.userId && 
        (req.session.role === 'teacher' || req.session.role === 'admin')) {
        return next();
    }
    res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page',
        user: req.session.userId ? req.session : null
    });
};

// Redirect if already logged in
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        const role = req.session.role;
        if (role === 'admin') {
            return res.redirect('/admin/dashboard');
        } else if (role === 'teacher') {
            return res.redirect('/teacher/dashboard');
        } else if (role === 'student') {
            return res.redirect('/student/dashboard');
        }
    }
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    isTeacherOrAdmin,
    redirectIfAuthenticated
};
