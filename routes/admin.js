const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { isAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { dbHelpers } = require('../database');
const { uploadNews, uploadGallery, uploadBulletin, uploadEvent, uploadAchievement, uploadBanner, convertToWebp } = require('../middleware/upload');

// All routes require admin authentication
router.use(isAdmin);

// Admin Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        // Get statistics
        const stats = {
            totalStudents: await dbHelpers.get('SELECT COUNT(*) as count FROM students'),
            totalTeachers: await dbHelpers.get('SELECT COUNT(*) as count FROM teachers'),
            totalNews: await dbHelpers.get('SELECT COUNT(*) as count FROM news WHERE status = "published"'),
            totalEvents: await dbHelpers.get('SELECT COUNT(*) as count FROM events WHERE status = "upcoming"'),
            pendingRegistrations: await dbHelpers.get('SELECT COUNT(*) as count FROM registrations WHERE status = "pending"'),
            newContacts: await dbHelpers.get('SELECT COUNT(*) as count FROM contacts WHERE status = "new"')
        };

        // Recent activities
        const recentRegistrations = await dbHelpers.all(
            'SELECT * FROM registrations ORDER BY created_at DESC LIMIT 5'
        );

        const recentContacts = await dbHelpers.all(
            'SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5'
        );

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats,
            recentRegistrations,
            recentContacts
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred loading the dashboard',
            statusCode: 500
        });
    }
});

// ==================== USERS MANAGEMENT ====================

// List all users
router.get('/users', async (req, res) => {
    try {
        const role = req.query.role || '';
        const search = req.query.search || '';

        let query = 'SELECT * FROM users WHERE 1=1';
        let params = [];

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        if (search) {
            query += ' AND (full_name LIKE ? OR email LIKE ? OR username LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const users = await dbHelpers.all(query, params);

        res.render('admin/users/list', {
            title: 'Manage Users',
            users,
            role,
            search,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Users list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Add user form
router.get('/users/add', (req, res) => {
    res.render('admin/users/form', {
        title: 'Add User',
        user: null,
        error: null
    });
});

// Create user
router.post('/users', async (req, res) => {
    try {
        const { username, email, password, role, full_name, phone, address } = req.body;

        // Check if email exists
        const existingEmail = await dbHelpers.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) {
            return res.render('admin/users/form', {
                title: 'Add User',
                user: null,
                error: 'Email already exists'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await dbHelpers.run(
            `INSERT INTO users (username, email, password_hash, role, full_name, phone, address)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, password_hash, role, full_name, phone, address]
        );

        // Create role-specific record
        if (role === 'student') {
            const studentId = 'STD' + Date.now().toString().slice(-8);
            await dbHelpers.run(
                'INSERT INTO students (user_id, student_id, enrollment_date) VALUES (?, ?, date("now"))',
                [result.id, studentId]
            );
        } else if (role === 'teacher') {
            const teacherId = 'TCH' + Date.now().toString().slice(-8);
            await dbHelpers.run(
                'INSERT INTO teachers (user_id, teacher_id, join_date) VALUES (?, ?, date("now"))',
                [result.id, teacherId]
            );
        }

        res.redirect('/admin/users?success=User created successfully');
    } catch (error) {
        console.error('Create user error:', error);
        res.redirect('/admin/users?error=An error occurred');
    }
});

// Edit user form
router.get('/users/:id/edit', async (req, res) => {
    try {
        const user = await dbHelpers.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
        
        if (!user) {
            return res.redirect('/admin/users?error=User not found');
        }

        res.render('admin/users/form', {
            title: 'Edit User',
            user,
            error: null
        });
    } catch (error) {
        console.error('Edit user error:', error);
        res.redirect('/admin/users?error=An error occurred');
    }
});

// Update user
router.post('/users/:id', async (req, res) => {
    try {
        const { full_name, phone, address, status } = req.body;

        await dbHelpers.run(
            `UPDATE users SET full_name = ?, phone = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [full_name, phone, address, status, req.params.id]
        );

        res.redirect('/admin/users?success=User updated successfully');
    } catch (error) {
        console.error('Update user error:', error);
        res.redirect('/admin/users?error=An error occurred');
    }
});

// Delete user
router.post('/users/:id/delete', async (req, res) => {
    try {
        await dbHelpers.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.redirect('/admin/users?success=User deleted successfully');
    } catch (error) {
        console.error('Delete user error:', error);
        res.redirect('/admin/users?error=An error occurred');
    }
});

// ==================== NEWS MANAGEMENT ====================

// List news
router.get('/news', async (req, res) => {
    try {
        const news = await dbHelpers.all(
            `SELECT n.*, u.full_name as author_name
             FROM news n
             JOIN users u ON n.author_id = u.id
             ORDER BY n.created_at DESC`
        );

        res.render('admin/news/list', {
            title: 'Manage News',
            news,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('News list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Add news form
router.get('/news/add', (req, res) => {
    res.render('admin/news/form', {
        title: 'Add News',
        news: null,
        error: null
    });
});

// Create news
// Helper: handle Multer upload errors for Add News
function handleNewsUploadErrorAdd(req, res, next) {
    uploadNews.single('image')(req, res, function(err) {
        if (!err) return next();
        let message = err.message || 'Upload gambar gagal';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Ukuran file melebihi batas 5MB';
        } else if (/Only image files/i.test(err.message)) {
            message = 'Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif, webp)';
        }
        return res.status(400).render('admin/news/form', {
            title: 'Add News',
            news: null,
            error: message
        });
    });
}

router.post('/news',
    handleNewsUploadErrorAdd,
    convertToWebp,
    [
        body('title').trim().notEmpty().withMessage('Judul wajib diisi'),
        body('excerpt').trim().notEmpty().withMessage('Excerpt wajib diisi'),
        body('content').trim().notEmpty().withMessage('Konten wajib diisi'),
        body('category').isIn(['Akademik', 'Prestasi', 'Kegiatan', 'Program', 'Pengumuman', 'Fasilitas', 'Teknologi', 'Pengembangan']).withMessage('Kategori tidak valid'),
        body('status').isIn(['draft','published','archived']).withMessage('Status tidak valid')
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const message = errors.array().map(e => e.msg).join(', ');
            return res.status(400).render('admin/news/form', {
                title: 'Add News',
                news: null,
                error: message
            });
        }

        const { title, content, excerpt, category, status } = req.body;
        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const image = req.file ? `/uploads/news/${req.file.filename}` : null;
        const authorId = req.session.userId;

        if (!authorId) {
            return res.status(403).render('error', {
                title: 'Access Denied',
                message: 'Session tidak valid',
                statusCode: 403
            });
        }

        // Ensure unique slug
        const baseSlug = slug;
        let suffix = 2;
        while (await dbHelpers.get('SELECT id FROM news WHERE slug = ?', [slug])) {
            slug = `${baseSlug}-${suffix++}`;
        }

        await dbHelpers.run(
            `INSERT INTO news (title, slug, content, excerpt, image, category, author_id, status, published_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [title, slug, content, excerpt, image, category, authorId, status]
        );

        res.redirect('/admin/news?success=News created successfully');
    } catch (error) {
        console.error('Create news error:', error);
        res.redirect('/admin/news?error=An error occurred');
    }
});

// Edit news form
router.get('/news/:id/edit', async (req, res) => {
    try {
        const news = await dbHelpers.get('SELECT * FROM news WHERE id = ?', [req.params.id]);
        
        if (!news) {
            return res.redirect('/admin/news?error=News not found');
        }

        res.render('admin/news/form', {
            title: 'Edit News',
            news,
            error: null
        });
    } catch (error) {
        console.error('Edit news error:', error);
        res.redirect('/admin/news?error=An error occurred');
    }
});

// Update news
// Wrap Multer to handle errors gracefully (Edit)
function handleNewsUploadErrorEdit(req, res, next) {
    uploadNews.single('image')(req, res, async function(err) {
        if (!err) return next();
        let message = err.message || 'Upload gambar gagal';
        if (err.code === 'LIMIT_FILE_SIZE' || /file too large/i.test(err.message)) {
            message = 'Ukuran file melebihi batas 5MB';
        } else if (/Only image files/i.test(err.message)) {
            message = 'Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif, webp)';
        }
        let news = null;
        try {
            news = await dbHelpers.get('SELECT * FROM news WHERE id = ?', [req.params.id]);
        } catch (e) {}
        return res.status(400).render('admin/news/form', {
            title: 'Edit News',
            news,
            error: message
        });
    });
}

router.post('/news/:id',
    handleNewsUploadErrorEdit,
    convertToWebp,
    [
        body('title').trim().notEmpty().withMessage('Judul wajib diisi'),
        body('excerpt').trim().notEmpty().withMessage('Excerpt wajib diisi'),
        body('content').trim().notEmpty().withMessage('Konten wajib diisi'),
        body('category').isIn(['Akademik', 'Prestasi', 'Kegiatan', 'Program', 'Pengumuman', 'Fasilitas', 'Teknologi', 'Pengembangan']).withMessage('Kategori tidak valid'),
        body('status').isIn(['draft','published','archived']).withMessage('Status tidak valid')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const message = errors.array().map(e => e.msg).join(', ');
                const news = await dbHelpers.get('SELECT * FROM news WHERE id = ?', [req.params.id]);
                return res.status(400).render('admin/news/form', {
                    title: 'Edit News',
                    news,
                    error: message
                });
            }

            const { title, content, excerpt, category, status } = req.body;
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            let query = `UPDATE news SET title = ?, slug = ?, content = ?, excerpt = ?, category = ?, status = ?, updated_at = CURRENT_TIMESTAMP`;
            let params = [title, slug, content, excerpt, category, status];

            if (req.file) {
                query += ', image = ?';
                params.push(`/uploads/news/${req.file.filename}`);
            }

            query += ' WHERE id = ?';
            params.push(req.params.id);

            await dbHelpers.run(query, params);

            res.redirect('/admin/news?success=News updated successfully');
        } catch (error) {
            console.error('Update news error:', error);
            res.redirect('/admin/news?error=An error occurred');
        }
    }
);

// Delete news
router.post('/news/:id/delete', async (req, res) => {
    try {
        // Remove image file from disk if exists
        const existing = await dbHelpers.get('SELECT image FROM news WHERE id = ?', [req.params.id]);
        if (existing && existing.image) {
            const diskPath = path.resolve('.', existing.image.replace(/^\//, ''));
            try {
                if (fs.existsSync(diskPath)) {
                    fs.unlinkSync(diskPath);
                }
            } catch (fileErr) {
                console.warn('Failed to delete image file:', diskPath, fileErr);
            }
        }

        await dbHelpers.run('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.redirect('/admin/news?success=News deleted successfully');
    } catch (error) {
        console.error('Delete news error:', error);
        res.redirect('/admin/news?error=An error occurred');
    }
});

// ==================== EVENTS MANAGEMENT ====================

// List events
router.get('/events', async (req, res) => {
    try {
        const events = await dbHelpers.all(
            `SELECT e.*, u.full_name as creator_name
             FROM events e
             JOIN users u ON e.created_by = u.id
             ORDER BY e.event_date DESC`
        );

        res.render('admin/events/list', {
            title: 'Manage Events',
            events,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Events list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Add event form
router.get('/events/add', (req, res) => {
    res.render('admin/events/form', {
        title: 'Add Event',
        event: null,
        error: null
    });
});

// Create event
router.post('/events', uploadEvent.single('image'), convertToWebp, async (req, res) => {
    try {
        const { title, description, event_date, event_time, location, category, status } = req.body;
        const image = req.file ? `/uploads/events/${req.file.filename}` : null;
        const createdBy = req.session.userId;

        await dbHelpers.run(
            `INSERT INTO events (title, description, event_date, event_time, location, image, category, created_by, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, event_date, event_time, location, image, category, createdBy, status]
        );

        res.redirect('/admin/events?success=Event created successfully');
    } catch (error) {
        console.error('Create event error:', error);
        res.redirect('/admin/events?error=An error occurred');
    }
});

// Edit event form
router.get('/events/:id/edit', async (req, res) => {
    try {
        const event = await dbHelpers.get('SELECT * FROM events WHERE id = ?', [req.params.id]);
        
        if (!event) {
            return res.redirect('/admin/events?error=Event not found');
        }

        res.render('admin/events/form', {
            title: 'Edit Event',
            event,
            error: null
        });
    } catch (error) {
        console.error('Edit event error:', error);
        res.redirect('/admin/events?error=An error occurred');
    }
});

// Update event
router.post('/events/:id', uploadEvent.single('image'), convertToWebp, async (req, res) => {
    try {
        const { title, description, event_date, event_time, location, category, status } = req.body;
        
        let query = `UPDATE events SET title = ?, description = ?, event_date = ?, event_time = ?, location = ?, category = ?, status = ?, updated_at = CURRENT_TIMESTAMP`;
        let params = [title, description, event_date, event_time, location, category, status];

        if (req.file) {
            query += ', image = ?';
            params.push(`/uploads/events/${req.file.filename}`);
        }

        query += ' WHERE id = ?';
        params.push(req.params.id);

        await dbHelpers.run(query, params);

        res.redirect('/admin/events?success=Event updated successfully');
    } catch (error) {
        console.error('Update event error:', error);
        res.redirect('/admin/events?error=An error occurred');
    }
});

// Delete event
router.post('/events/:id/delete', async (req, res) => {
    try {
        await dbHelpers.run('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.redirect('/admin/events?success=Event deleted successfully');
    } catch (error) {
        console.error('Delete event error:', error);
        res.redirect('/admin/events?error=An error occurred');
    }
});

// ==================== GALLERY MANAGEMENT ====================

// List gallery
router.get('/gallery', async (req, res) => {
    try {
        const galleries = await dbHelpers.all(
            `SELECT g.*, u.full_name as uploader_name
             FROM galleries g
             JOIN users u ON g.uploaded_by = u.id
             ORDER BY g.upload_date DESC`
        );

        res.render('admin/gallery/list', {
            title: 'Manage Gallery',
            galleries,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Gallery list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Add gallery form
router.get('/gallery/add', (req, res) => {
    res.render('admin/gallery/form', {
        title: 'Add Gallery Image',
        gallery: null,
        error: null
    });
});

// Create gallery
router.post('/gallery', uploadGallery.single('image'), convertToWebp, async (req, res) => {
    try {
        const { title, description, category } = req.body;
        const imagePath = req.file ? `/uploads/gallery/${req.file.filename}` : null;
        const uploadedBy = req.session.userId;

        if (!imagePath) {
            return res.redirect('/admin/gallery?error=Image is required');
        }

        await dbHelpers.run(
            `INSERT INTO galleries (title, image_path, description, category, uploaded_by)
             VALUES (?, ?, ?, ?, ?)`,
            [title, imagePath, description, category, uploadedBy]
        );

        res.redirect('/admin/gallery?success=Image uploaded successfully');
    } catch (error) {
        console.error('Create gallery error:', error);
        res.redirect('/admin/gallery?error=An error occurred');
    }
});

// Delete gallery
router.post('/gallery/:id/delete', async (req, res) => {
    try {
        await dbHelpers.run('DELETE FROM galleries WHERE id = ?', [req.params.id]);
        res.redirect('/admin/gallery?success=Image deleted successfully');
    } catch (error) {
        console.error('Delete gallery error:', error);
        res.redirect('/admin/gallery?error=An error occurred');
    }
});

// ==================== REGISTRATIONS MANAGEMENT ====================

// List registrations
router.get('/registrations', async (req, res) => {
    try {
        const status = req.query.status || '';
        
        let query = 'SELECT * FROM registrations WHERE 1=1';
        let params = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const registrations = await dbHelpers.all(query, params);

        res.render('admin/registrations/list', {
            title: 'SPMB Registrations',
            registrations,
            status,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Registrations list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// View registration detail
router.get('/registrations/:id', async (req, res) => {
    try {
        const registration = await dbHelpers.get(
            'SELECT * FROM registrations WHERE id = ?',
            [req.params.id]
        );

        if (!registration) {
            return res.redirect('/admin/registrations?error=Registration not found');
        }

        res.render('admin/registrations/detail', {
            title: 'Registration Detail',
            registration,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Registration detail error:', error);
        res.redirect('/admin/registrations?error=An error occurred');
    }
});

// Update registration status
router.post('/registrations/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;

        await dbHelpers.run(
            `UPDATE registrations SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [status, notes, req.params.id]
        );

        res.redirect(`/admin/registrations/${req.params.id}?success=Status updated successfully`);
    } catch (error) {
        console.error('Update registration status error:', error);
        res.redirect(`/admin/registrations/${req.params.id}?error=An error occurred`);
    }
});

// ==================== CONTACTS MANAGEMENT ====================

// List contacts
router.get('/contacts', async (req, res) => {
    try {
        const type = req.query.type || '';
        const status = req.query.status || '';
        
        let query = 'SELECT * FROM contacts WHERE 1=1';
        let params = [];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const contacts = await dbHelpers.all(query, params);

        res.render('admin/contacts/list', {
            title: 'Manage Contacts',
            contacts,
            type,
            status,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Contacts list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// View contact detail
router.get('/contacts/:id', async (req, res) => {
    try {
        const contact = await dbHelpers.get(
            'SELECT * FROM contacts WHERE id = ?',
            [req.params.id]
        );

        if (!contact) {
            return res.redirect('/admin/contacts?error=Contact not found');
        }

        // Mark as read
        if (contact.status === 'new') {
            await dbHelpers.run(
                'UPDATE contacts SET status = "read" WHERE id = ?',
                [req.params.id]
            );
        }

        res.render('admin/contacts/detail', {
            title: 'Contact Detail',
            contact,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Contact detail error:', error);
        res.redirect('/admin/contacts?error=An error occurred');
    }
});

// Reply to contact
router.post('/contacts/:id/reply', async (req, res) => {
    try {
        const { reply } = req.body;

        await dbHelpers.run(
            `UPDATE contacts SET reply = ?, status = 'replied', updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [reply, req.params.id]
        );

        res.redirect(`/admin/contacts/${req.params.id}?success=Reply saved successfully`);
    } catch (error) {
        console.error('Reply contact error:', error);
        res.redirect(`/admin/contacts/${req.params.id}?error=An error occurred`);
    }
});

// ==================== BULLETINS MANAGEMENT ====================

// List bulletins
router.get('/bulletins', async (req, res) => {
    try {
        const bulletins = await dbHelpers.all(
            `SELECT b.*, u.full_name as uploader_name
             FROM bulletins b
             JOIN users u ON b.uploaded_by = u.id
             ORDER BY b.published_date DESC`
        );

        res.render('admin/bulletins/list', {
            title: 'Manage E-Bulletins',
            bulletins,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Bulletins list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Add bulletin form
router.get('/bulletins/add', (req, res) => {
    res.render('admin/bulletins/form', {
        title: 'Add E-Bulletin',
        bulletin: null,
        error: null
    });
});

// Create bulletin
router.post('/bulletins', uploadBulletin.single('file'), async (req, res) => {
    try {
        const { title, description, published_date } = req.body;
        const filePath = req.file ? `/uploads/bulletins/${req.file.filename}` : null;
        const uploadedBy = req.session.userId;

        if (!filePath) {
            return res.redirect('/admin/bulletins?error=File is required');
        }

        await dbHelpers.run(
            `INSERT INTO bulletins (title, file_path, description, published_date, uploaded_by)
             VALUES (?, ?, ?, ?, ?)`,
            [title, filePath, description, published_date, uploadedBy]
        );

        res.redirect('/admin/bulletins?success=Bulletin uploaded successfully');
    } catch (error) {
        console.error('Create bulletin error:', error);
        res.redirect('/admin/bulletins?error=An error occurred');
    }
});

// Delete bulletin
router.post('/bulletins/:id/delete', async (req, res) => {
    try {
        await dbHelpers.run('DELETE FROM bulletins WHERE id = ?', [req.params.id]);
        res.redirect('/admin/bulletins?success=Bulletin deleted successfully');
    } catch (error) {
        console.error('Delete bulletin error:', error);
        res.redirect('/admin/bulletins?error=An error occurred');
    }
});

// ==================== ACHIEVEMENTS MANAGEMENT ====================

// List achievements
router.get('/achievements', async (req, res) => {
    try {
        const achievements = await dbHelpers.all(
            `SELECT a.*, s.student_id, u.full_name as student_name
             FROM achievements a
             LEFT JOIN students s ON a.student_id = s.id
             LEFT JOIN users u ON s.user_id = u.id
             ORDER BY a.achievement_date DESC`
        );

        res.render('admin/achievements/list', {
            title: 'Manage Achievements',
            achievements,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Achievements list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Add achievement form
router.get('/achievements/add', async (req, res) => {
    try {
        const students = await dbHelpers.all(
            `SELECT s.id, s.student_id, u.full_name
             FROM students s
             JOIN users u ON s.user_id = u.id
             ORDER BY u.full_name ASC`
        );

        res.render('admin/achievements/form', {
            title: 'Add Achievement',
            achievement: null,
            students,
            error: null
        });
    } catch (error) {
        console.error('Add achievement form error:', error);
        res.redirect('/admin/achievements?error=An error occurred');
    }
});

// Create achievement
router.post('/achievements', uploadAchievement.single('image'), convertToWebp, async (req, res) => {
    try {
        const { title, description, achievement_date, category, student_id } = req.body;
        const image = req.file ? `/uploads/achievements/${req.file.filename}` : null;
        const createdBy = req.session.userId;

        await dbHelpers.run(
            `INSERT INTO achievements (title, description, achievement_date, category, image, student_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description, achievement_date, category, image, student_id || null, createdBy]
        );

        res.redirect('/admin/achievements?success=Achievement created successfully');
    } catch (error) {
        console.error('Create achievement error:', error);
        res.redirect('/admin/achievements?error=An error occurred');
    }
});

// Edit achievement form
router.get('/achievements/:id/edit', async (req, res) => {
    try {
        const achievement = await dbHelpers.get('SELECT * FROM achievements WHERE id = ?', [req.params.id]);
        if (!achievement) {
            return res.redirect('/admin/achievements?error=Achievement not found');
        }

        const students = await dbHelpers.all(
            `SELECT s.id, s.student_id, u.full_name
             FROM students s
             JOIN users u ON s.user_id = u.id
             ORDER BY u.full_name ASC`
        );

        res.render('admin/achievements/form', {
            title: 'Edit Achievement',
            achievement,
            students,
            error: null
        });
    } catch (error) {
        console.error('Edit achievement form error:', error);
        res.redirect('/admin/achievements?error=An error occurred');
    }
});

// Update achievement
router.post('/achievements/:id', uploadAchievement.single('image'), convertToWebp, async (req, res) => {
    try {
        const { title, description, achievement_date, category, student_id, existing_image } = req.body;
        const image = req.file ? `/uploads/achievements/${req.file.filename}` : (existing_image || null);

        const existing = await dbHelpers.get('SELECT * FROM achievements WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.redirect('/admin/achievements?error=Achievement not found');
        }

        await dbHelpers.run(
            `UPDATE achievements
             SET title = ?, description = ?, achievement_date = ?, category = ?, image = ?, student_id = ?
             WHERE id = ?`,
            [
                title || existing.title,
                description || existing.description,
                achievement_date || existing.achievement_date,
                (typeof category !== 'undefined' ? category : existing.category),
                image,
                (student_id ? Number(student_id) : existing.student_id),
                req.params.id
            ]
        );

        res.redirect('/admin/achievements?success=Achievement updated successfully');
    } catch (error) {
        console.error('Update achievement error:', error);
        res.redirect('/admin/achievements?error=An error occurred');
    }
});

// Delete achievement
router.post('/achievements/:id/delete', async (req, res) => {
    try {
        await dbHelpers.run('DELETE FROM achievements WHERE id = ?', [req.params.id]);
        res.redirect('/admin/achievements?success=Achievement deleted successfully');
    } catch (error) {
        console.error('Delete achievement error:', error);
        res.redirect('/admin/achievements?error=An error occurred');
    }
});

// ==================== HOME BANNERS MANAGEMENT ====================

// List banners
router.get('/banners', async (req, res) => {
    try {
        const banners = await dbHelpers.all(
            `SELECT * FROM home_banners ORDER BY order_index ASC, created_at DESC`
        );

        res.render('admin/banners/list', {
            title: 'Manage Home Banners',
            banners,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Banners list error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Add banner form
router.get('/banners/add', (req, res) => {
    res.render('admin/banners/form', {
        title: 'Add Home Banner',
        banner: null,
        error: null
    });
});

// Create banner
router.post('/banners', uploadBanner.single('image'), convertToWebp, async (req, res) => {
    try {
        const { title, subtitle, link, order_index, status } = req.body;
        const imagePath = req.file ? `/uploads/banners/${req.file.filename}` : null;

        if (!imagePath) {
            return res.redirect('/admin/banners?error=Image is required');
        }

        await dbHelpers.run(
            `INSERT INTO home_banners (title, subtitle, image, link, order_index, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, subtitle, imagePath, link, parseInt(order_index || 0, 10), status || 'active']
        );

        res.redirect('/admin/banners?success=Banner added successfully');
    } catch (error) {
        console.error('Create banner error:', error);
        res.redirect('/admin/banners?error=An error occurred');
    }
});

// Edit banner form
router.get('/banners/:id/edit', async (req, res) => {
    try {
        const banner = await dbHelpers.get('SELECT * FROM home_banners WHERE id = ?', [req.params.id]);
        if (!banner) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Banner not found',
                statusCode: 404
            });
        }
        res.render('admin/banners/form', {
            title: 'Edit Home Banner',
            banner,
            error: null
        });
    } catch (error) {
        console.error('Edit banner form error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Update banner
router.post('/banners/:id', uploadBanner.single('image'), convertToWebp, async (req, res) => {
    try {
        const existing = await dbHelpers.get('SELECT * FROM home_banners WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.redirect('/admin/banners?error=Banner not found');
        }

        const { title, subtitle, link, order_index, status } = req.body;
        const imagePath = req.file ? `/uploads/banners/${req.file.filename}` : existing.image;

        await dbHelpers.run(
            `UPDATE home_banners
             SET title = ?, subtitle = ?, image = ?, link = ?, order_index = ?, status = ?
             WHERE id = ?`,
            [
                title || existing.title,
                subtitle || existing.subtitle,
                imagePath,
                link || existing.link,
                parseInt(order_index != null ? order_index : existing.order_index, 10),
                status || existing.status,
                req.params.id
            ]
        );

        res.redirect('/admin/banners?success=Banner updated successfully');
    } catch (error) {
        console.error('Update banner error:', error);
        res.redirect('/admin/banners?error=An error occurred');
    }
});

// Delete banner
router.post('/banners/:id/delete', async (req, res) => {
    try {
        await dbHelpers.run('DELETE FROM home_banners WHERE id = ?', [req.params.id]);
        res.redirect('/admin/banners?success=Banner deleted successfully');
    } catch (error) {
        console.error('Delete banner error:', error);
        res.redirect('/admin/banners?error=An error occurred');
    }
});

module.exports = router;
