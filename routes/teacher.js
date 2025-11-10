const express = require('express');
const router = express.Router();
const { isTeacher } = require('../middleware/auth');
const { dbHelpers } = require('../database');

// All routes require teacher authentication
router.use(isTeacher);

// Teacher Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.session.userId;

        // Get teacher info
        const teacher = await dbHelpers.get(
            `SELECT t.*, u.full_name, u.email, u.phone, u.avatar
             FROM teachers t
             JOIN users u ON t.user_id = u.id
             WHERE t.user_id = ?`,
            [userId]
        );

        // Get statistics
        const totalStudents = await dbHelpers.get(
            'SELECT COUNT(*) as count FROM students'
        );

        const totalClasses = 5; // Placeholder

        const recentGrades = await dbHelpers.all(
            `SELECT g.*, s.student_id, u.full_name as student_name
             FROM grades g
             JOIN students s ON g.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE g.teacher_id = ?
             ORDER BY g.updated_at DESC LIMIT 5`,
            [teacher.id]
        );

        res.render('teacher/dashboard', {
            title: 'Teacher Dashboard',
            teacher,
            stats: {
                totalStudents: totalStudents.count,
                totalClasses,
                totalGrades: recentGrades.length
            },
            recentGrades
        });
    } catch (error) {
        console.error('Teacher dashboard error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred loading the dashboard',
            statusCode: 500
        });
    }
});

// Teacher Profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.session.userId;

        const teacher = await dbHelpers.get(
            `SELECT t.*, u.full_name, u.email, u.phone, u.address, u.avatar
             FROM teachers t
             JOIN users u ON t.user_id = u.id
             WHERE t.user_id = ?`,
            [userId]
        );

        res.render('teacher/profile', {
            title: 'My Profile',
            teacher,
            success: req.query.success,
            error: null
        });
    } catch (error) {
        console.error('Teacher profile error:', error);
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
        const { full_name, phone, address, subject, qualification, specialization } = req.body;

        // Update user info
        await dbHelpers.run(
            `UPDATE users SET full_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [full_name, phone, address, userId]
        );

        // Update teacher info
        const teacher = await dbHelpers.get('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        await dbHelpers.run(
            `UPDATE teachers SET subject = ?, qualification = ?, specialization = ?
             WHERE id = ?`,
            [subject, qualification, specialization, teacher.id]
        );

        // Update session
        req.session.fullName = full_name;

        res.redirect('/teacher/profile?success=Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
        res.redirect('/teacher/profile?error=An error occurred');
    }
});

// Manage Students
router.get('/students', async (req, res) => {
    try {
        const search = req.query.search || '';
        const program = req.query.program || '';

        let query = `SELECT s.*, u.full_name, u.email, u.phone
                     FROM students s
                     JOIN users u ON s.user_id = u.id
                     WHERE 1=1`;
        let params = [];

        if (search) {
            query += ` AND (u.full_name LIKE ? OR s.student_id LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (program) {
            query += ` AND s.program = ?`;
            params.push(program);
        }

        query += ` ORDER BY u.full_name ASC`;

        const students = await dbHelpers.all(query, params);

        res.render('teacher/students', {
            title: 'Manage Students',
            students,
            search,
            program
        });
    } catch (error) {
        console.error('Students list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// View Student Detail
router.get('/students/:id', async (req, res) => {
    try {
        const student = await dbHelpers.get(
            `SELECT s.*, u.full_name, u.email, u.phone, u.address, u.avatar
             FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE s.id = ?`,
            [req.params.id]
        );

        if (!student) {
            return res.status(404).render('error', {
                title: '404 - Not Found',
                message: 'Student not found',
                statusCode: 404
            });
        }

        // Get student grades
        const grades = await dbHelpers.all(
            `SELECT g.*, u.full_name as teacher_name
             FROM grades g
             JOIN teachers t ON g.teacher_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE g.student_id = ?
             ORDER BY g.semester DESC, g.subject ASC`,
            [student.id]
        );

        res.render('teacher/student-detail', {
            title: 'Student Detail',
            student,
            grades
        });
    } catch (error) {
        console.error('Student detail error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Add/Edit Grade
router.get('/students/:id/grades/add', async (req, res) => {
    try {
        const userId = req.session.userId;
        const teacher = await dbHelpers.get('SELECT id FROM teachers WHERE user_id = ?', [userId]);

        const student = await dbHelpers.get(
            `SELECT s.*, u.full_name FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE s.id = ?`,
            [req.params.id]
        );

        res.render('teacher/grade-form', {
            title: 'Add Grade',
            student,
            grade: null,
            error: null
        });
    } catch (error) {
        console.error('Grade form error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Save Grade
router.post('/students/:id/grades', async (req, res) => {
    try {
        const userId = req.session.userId;
        const teacher = await dbHelpers.get('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        const { subject, semester, grade, remarks } = req.body;

        await dbHelpers.run(
            `INSERT INTO grades (student_id, subject, semester, grade, remarks, teacher_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.id, subject, semester, grade, remarks, teacher.id]
        );

        res.redirect(`/teacher/students/${req.params.id}?success=Grade added successfully`);
    } catch (error) {
        console.error('Save grade error:', error);
        res.redirect(`/teacher/students/${req.params.id}?error=An error occurred`);
    }
});

// View All Grades
router.get('/grades', async (req, res) => {
    try {
        const userId = req.session.userId;
        const teacher = await dbHelpers.get('SELECT id FROM teachers WHERE user_id = ?', [userId]);

        const grades = await dbHelpers.all(
            `SELECT g.*, s.student_id, u.full_name as student_name
             FROM grades g
             JOIN students s ON g.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE g.teacher_id = ?
             ORDER BY g.updated_at DESC`,
            [teacher.id]
        );

        res.render('teacher/grades', {
            title: 'All Grades',
            grades
        });
    } catch (error) {
        console.error('Grades list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Materials (placeholder)
router.get('/materials', (req, res) => {
    res.render('teacher/materials', {
        title: 'Course Materials',
        materials: []
    });
});

// Messages
router.get('/messages', (req, res) => {
    res.render('teacher/messages', {
        title: 'Messages'
    });
});

// Settings
router.get('/settings', async (req, res) => {
    try {
        const userId = req.session.userId;

        const user = await dbHelpers.get(
            'SELECT username, email FROM users WHERE id = ?',
            [userId]
        );

        res.render('teacher/settings', {
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
            return res.redirect('/teacher/settings?error=Passwords do not match');
        }

        // Verify current password
        const user = await dbHelpers.get('SELECT password_hash FROM users WHERE id = ?', [userId]);
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(current_password, user.password_hash);

        if (!isValid) {
            return res.redirect('/teacher/settings?error=Current password is incorrect');
        }

        // Update password
        const newHash = await bcrypt.hash(new_password, 10);
        await dbHelpers.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newHash, userId]
        );

        res.redirect('/teacher/settings?success=Password changed successfully');
    } catch (error) {
        console.error('Change password error:', error);
        res.redirect('/teacher/settings?error=An error occurred');
    }
});

module.exports = router;
