const express = require('express');
const router = express.Router();
const { isStudent } = require('../middleware/auth');
const { dbHelpers } = require('../database');

// All routes require student authentication
router.use(isStudent);

// Student Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.session.userId;

        // Get student info
        const student = await dbHelpers.get(
            `SELECT s.*, u.full_name, u.email, u.phone, u.avatar
             FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE s.user_id = ?`,
            [userId]
        );

        // Get enrolled courses count (placeholder - you can add courses table later)
        const enrolledCourses = 12;
        const activeCourses = 3;
        const completedCourses = 10;

        // Get recent grades
        const recentGrades = await dbHelpers.all(
            `SELECT g.*, t.teacher_id, u.full_name as teacher_name
             FROM grades g
             JOIN teachers t ON g.teacher_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE g.student_id = ?
             ORDER BY g.created_at DESC LIMIT 5`,
            [student.id]
        );

        // Get latest news for students
        const latestNews = await dbHelpers.all(
            `SELECT id, title, slug, excerpt, published_date
             FROM news WHERE status = 'published'
             ORDER BY published_date DESC LIMIT 3`
        );

        res.render('student/dashboard', {
            title: 'Student Dashboard',
            student,
            stats: {
                enrolledCourses,
                activeCourses,
                completedCourses
            },
            recentGrades,
            latestNews
        });
    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred loading the dashboard',
            statusCode: 500
        });
    }
});

// Student Profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.session.userId;

        const student = await dbHelpers.get(
            `SELECT s.*, u.full_name, u.email, u.phone, u.address, u.avatar
             FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE s.user_id = ?`,
            [userId]
        );

        res.render('student/profile', {
            title: 'My Profile',
            student,
            success: req.query.success,
            error: null
        });
    } catch (error) {
        console.error('Student profile error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Update Profile
router.post('/profile', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { full_name, phone, address, parent_name, parent_phone } = req.body;

        // Update user info
        await dbHelpers.run(
            `UPDATE users SET full_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [full_name, phone, address, userId]
        );

        // Update student info
        const student = await dbHelpers.get('SELECT id FROM students WHERE user_id = ?', [userId]);
        await dbHelpers.run(
            `UPDATE students SET parent_name = ?, parent_phone = ?
             WHERE id = ?`,
            [parent_name, parent_phone, student.id]
        );

        // Update session
        req.session.fullName = full_name;

        res.redirect('/student/profile?success=Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
        res.redirect('/student/profile?error=An error occurred');
    }
});

// View Grades
router.get('/grades', async (req, res) => {
    try {
        const userId = req.session.userId;

        const student = await dbHelpers.get(
            'SELECT id FROM students WHERE user_id = ?',
            [userId]
        );

        const grades = await dbHelpers.all(
            `SELECT g.*, u.full_name as teacher_name
             FROM grades g
             JOIN teachers t ON g.teacher_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE g.student_id = ?
             ORDER BY g.semester DESC, g.subject ASC`,
            [student.id]
        );

        // Group by semester
        const gradesBySemester = {};
        grades.forEach(grade => {
            if (!gradesBySemester[grade.semester]) {
                gradesBySemester[grade.semester] = [];
            }
            gradesBySemester[grade.semester].push(grade);
        });

        res.render('student/grades', {
            title: 'My Grades',
            gradesBySemester
        });
    } catch (error) {
        console.error('Grades error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// View Schedule (placeholder)
router.get('/schedule', (req, res) => {
    res.render('student/schedule', {
        title: 'My Schedule'
    });
});

// View Certificates
router.get('/certificates', async (req, res) => {
    try {
        // Placeholder - implement certificate system later
        res.render('student/certificates', {
            title: 'My Certificates',
            certificates: []
        });
    } catch (error) {
        console.error('Certificates error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Student Messages
router.get('/messages', (req, res) => {
    res.render('student/messages', {
        title: 'Messages'
    });
});

// Student Settings
router.get('/settings', async (req, res) => {
    try {
        const userId = req.session.userId;

        const user = await dbHelpers.get(
            'SELECT username, email FROM users WHERE id = ?',
            [userId]
        );

        res.render('student/settings', {
            title: 'Settings',
            user,
            success: req.query.success,
            error: null
        });
    } catch (error) {
        console.error('Settings error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Change Password
router.post('/settings/password', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { current_password, new_password, confirm_password } = req.body;

        if (new_password !== confirm_password) {
            return res.redirect('/student/settings?error=Passwords do not match');
        }

        // Verify current password
        const user = await dbHelpers.get('SELECT password_hash FROM users WHERE id = ?', [userId]);
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(current_password, user.password_hash);

        if (!isValid) {
            return res.redirect('/student/settings?error=Current password is incorrect');
        }

        // Update password
        const newHash = await bcrypt.hash(new_password, 10);
        await dbHelpers.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newHash, userId]
        );

        res.redirect('/student/settings?success=Password changed successfully');
    } catch (error) {
        console.error('Change password error:', error);
        res.redirect('/student/settings?error=An error occurred');
    }
});

module.exports = router;
