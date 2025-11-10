const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../database');

// Home page
router.get('/', async (req, res) => {
    try {
        // Get active home banners (up to 3)
        const banners = await dbHelpers.all(
            `SELECT id, title, subtitle, image, link, order_index
             FROM home_banners WHERE status = 'active'
             ORDER BY order_index ASC, created_at DESC LIMIT 3`
        );
        // Get latest news (3 items)
        const latestNews = await dbHelpers.all(
            `SELECT id, title, slug, excerpt, image, published_date, category
             FROM news WHERE status = 'published'
             ORDER BY published_date DESC LIMIT 3`
        );

        // Get upcoming events (3 items)
        const upcomingEvents = await dbHelpers.all(
            `SELECT id, title, description, event_date, location, image
             FROM events WHERE status = 'upcoming' AND event_date >= date('now')
             ORDER BY event_date ASC LIMIT 3`
        );

        // Get latest gallery images (6 items)
        const galleryImages = await dbHelpers.all(
            `SELECT id, title, image_path, category
             FROM galleries ORDER BY upload_date DESC LIMIT 6`
        );

        // Get statistics
        const stats = {
            students: await dbHelpers.get('SELECT COUNT(*) as count FROM students'),
            teachers: await dbHelpers.get('SELECT COUNT(*) as count FROM teachers'),
            programs: 5,
            achievements: await dbHelpers.get('SELECT COUNT(*) as count FROM achievements')
        };

        // Education levels props
        const educationLevels = [
            { slug: 'pgit-tkit', name: 'PGIT–TKIT', href: '/profile/pgit-tkit', icon: 'fa-child' },
            { slug: 'sdit',      name: 'SDIT',      href: '/profile/sdit',     icon: 'fa-school' },
            { slug: 'smpit',     name: 'SMPIT',     href: '/profile/smpit',    icon: 'fa-user-graduate' },
            { slug: 'smait',     name: 'SMAIT',     href: '/profile/smait',    icon: 'fa-graduation-cap' },
            { slug: 'slbit',     name: 'SLBIT',     href: '/profile/slbit',    icon: 'fa-universal-access' },
            { slug: 'asrama',    name: 'ASRAMA',    href: '/about/fasilitas#asrama', icon: 'fa-house-chimney' }
        ];

        res.render('public/home', {
            title: 'Home',
            banners,
            latestNews,
            upcomingEvents,
            galleryImages,
            stats,
            educationLevels
        });
    } catch (error) {
        console.error('Home page error:', error);
        const educationLevels = [
            { slug: 'pgit-tkit', name: 'PGIT–TKIT', href: '/profile/pgit-tkit', icon: 'fa-child' },
            { slug: 'sdit',      name: 'SDIT',      href: '/profile/sdit',     icon: 'fa-school' },
            { slug: 'smpit',     name: 'SMPIT',     href: '/profile/smpit',    icon: 'fa-user-graduate' },
            { slug: 'smait',     name: 'SMAIT',     href: '/profile/smait',    icon: 'fa-graduation-cap' },
            { slug: 'slbit',     name: 'SLBIT',     href: '/profile/slbit',    icon: 'fa-universal-access' },
            { slug: 'asrama',    name: 'ASRAMA',    href: '/about/fasilitas#asrama', icon: 'fa-house-chimney' }
        ];
        res.render('public/home', {
            title: 'Home',
            banners: [],
            latestNews: [],
            upcomingEvents: [],
            galleryImages: [],
            stats: { students: { count: 0 }, teachers: { count: 0 }, programs: 5, achievements: { count: 0 } },
            educationLevels
        });
    }
});

// About pages
router.get('/about/sejarah', (req, res) => {
    res.render('public/about/sejarah', { title: 'Sejarah' });
});

router.get('/about/visi-misi', (req, res) => {
    res.render('public/about/visi-misi', { title: 'Visi & Misi' });
});

router.get('/about/kepengurusan', (req, res) => {
    res.render('public/about/kepengurusan', { title: 'Kepengurusan' });
});

router.get('/about/fasilitas', (req, res) => {
    res.render('public/about/fasilitas', { title: 'Fasilitas' });
});

// Profile pages
router.get('/profile/pgit-tkit', (req, res) => {
    res.render('public/profile/pgit-tkit', { title: 'PGIT-TKIT' });
});

router.get('/profile/sdit', (req, res) => {
    res.render('public/profile/sdit', { title: 'SDIT' });
});

router.get('/profile/smpit', (req, res) => {
    res.render('public/profile/smpit', { title: 'SMPIT' });
});

router.get('/profile/smait', (req, res) => {
    res.render('public/profile/smait', { title: 'SMAIT' });
});

router.get('/profile/slbit', (req, res) => {
    res.render('public/profile/slbit', { title: 'SLBIT' });
});

// News listing
router.get('/news', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const offset = (page - 1) * limit;
        const category = req.query.category || null;

        let query = `SELECT id, title, slug, excerpt, image, published_date, category
                     FROM news WHERE status = 'published'`;
        let params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY published_date DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const news = await dbHelpers.all(query, params);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM news WHERE status = "published"';
        if (category) {
            countQuery += ' AND category = ?';
            const total = await dbHelpers.get(countQuery, [category]);
            var totalPages = Math.ceil(total.total / limit);
        } else {
            const total = await dbHelpers.get(countQuery);
            var totalPages = Math.ceil(total.total / limit);
        }

        res.render('public/news/list', {
            title: 'Berita',
            news,
            currentPage: page,
            totalPages,
            category
        });
    } catch (error) {
        console.error('News listing error:', error);
        res.render('public/news/list', {
            title: 'Berita',
            news: [],
            currentPage: 1,
            totalPages: 1,
            category: null
        });
    }
});

// News detail
router.get('/news/:slug', async (req, res) => {
    try {
        const news = await dbHelpers.get(
            `SELECT n.*, u.full_name as author_name
             FROM news n
             JOIN users u ON n.author_id = u.id
             WHERE n.slug = ? AND n.status = 'published'`,
            [req.params.slug]
        );

        if (!news) {
            return res.status(404).render('error', {
                title: '404 - Not Found',
                message: 'News article not found',
                statusCode: 404
            });
        }

        // Increment views
        await dbHelpers.run('UPDATE news SET views = views + 1 WHERE id = ?', [news.id]);

        // Get related news
        const relatedNews = await dbHelpers.all(
            `SELECT id, title, slug, excerpt, image, published_date
             FROM news WHERE status = 'published' AND id != ? AND category = ?
             ORDER BY published_date DESC LIMIT 3`,
            [news.id, news.category]
        );

        res.render('public/news/detail', {
            title: news.title,
            news,
            relatedNews
        });
    } catch (error) {
        console.error('News detail error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred',
            statusCode: 500
        });
    }
});

// Events/Agenda
router.get('/events', async (req, res) => {
    try {
        const events = await dbHelpers.all(
            `SELECT id, title, description, event_date, event_time, location, image, category
             FROM events WHERE status IN ('upcoming', 'ongoing')
             ORDER BY event_date ASC`
        );

        res.render('public/events', {
            title: 'Agenda Sekolah',
            events
        });
    } catch (error) {
        console.error('Events error:', error);
        res.render('public/events', {
            title: 'Agenda Sekolah',
            events: []
        });
    }
});

// Gallery
router.get('/gallery', async (req, res) => {
    try {
        const category = req.query.category || null;
        let query = 'SELECT id, title, image_path, description, category FROM galleries';
        let params = [];

        if (category) {
            query += ' WHERE category = ?';
            params.push(category);
        }

        query += ' ORDER BY upload_date DESC';

        const galleries = await dbHelpers.all(query, params);

        res.render('public/gallery', {
            title: 'Galeri Foto',
            galleries,
            category
        });
    } catch (error) {
        console.error('Gallery error:', error);
        res.render('public/gallery', {
            title: 'Galeri Foto',
            galleries: [],
            category: null
        });
    }
});

// Achievements/Prestasi
router.get('/achievements', async (req, res) => {
    try {
        const achievements = await dbHelpers.all(
            `SELECT a.*, s.student_id, u.full_name as student_name
             FROM achievements a
             LEFT JOIN students s ON a.student_id = s.id
             LEFT JOIN users u ON s.user_id = u.id
             ORDER BY a.achievement_date DESC`
        );

        res.render('public/achievements', {
            title: 'Prestasi',
            achievements
        });
    } catch (error) {
        console.error('Achievements error:', error);
        res.render('public/achievements', {
            title: 'Prestasi',
            achievements: []
        });
    }
});

// E-Bulletins
router.get('/bulletins', async (req, res) => {
    try {
        const bulletins = await dbHelpers.all(
            `SELECT id, title, description, cover_image, published_date, downloads
             FROM bulletins ORDER BY published_date DESC`
        );

        res.render('public/bulletins', {
            title: 'E-Buletin',
            bulletins
        });
    } catch (error) {
        console.error('Bulletins error:', error);
        res.render('public/bulletins', {
            title: 'E-Buletin',
            bulletins: []
        });
    }
});

// Download bulletin
router.get('/bulletins/:id/download', async (req, res) => {
    try {
        const bulletin = await dbHelpers.get(
            'SELECT file_path FROM bulletins WHERE id = ?',
            [req.params.id]
        );

        if (!bulletin) {
            return res.status(404).send('Bulletin not found');
        }

        // Increment download count
        await dbHelpers.run('UPDATE bulletins SET downloads = downloads + 1 WHERE id = ?', [req.params.id]);

        res.download(bulletin.file_path);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Error downloading file');
    }
});

// SPMB Registration page
router.get('/spmb', (req, res) => {
    res.render('public/spmb/info', {
        title: 'Pendaftaran SPMB'
    });
});

router.get('/spmb/register', (req, res) => {
    res.render('public/spmb/register', {
        title: 'Daftar SPMB',
        error: null,
        success: null,
        formData: {}
    });
});

// SPMB Registration POST
router.post('/spmb/register', [
    body('full_name').notEmpty().withMessage('Nama lengkap wajib diisi'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('phone').notEmpty().withMessage('Nomor telepon wajib diisi'),
    body('birth_date').notEmpty().withMessage('Tanggal lahir wajib diisi'),
    body('program').notEmpty().withMessage('Program wajib dipilih'),
    body('parent_name').notEmpty().withMessage('Nama orang tua wajib diisi'),
    body('parent_phone').notEmpty().withMessage('Nomor telepon orang tua wajib diisi')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('public/spmb/register', {
            title: 'Daftar SPMB',
            error: errors.array()[0].msg,
            success: null,
            formData: req.body
        });
    }

    try {
        const {
            full_name, email, phone, birth_date, birth_place, gender,
            address, program, previous_school, parent_name, parent_phone, parent_occupation
        } = req.body;

        await dbHelpers.run(
            `INSERT INTO registrations (
                full_name, email, phone, birth_date, birth_place, gender,
                address, program, previous_school, parent_name, parent_phone, parent_occupation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email, phone, birth_date, birth_place, gender,
             address, program, previous_school, parent_name, parent_phone, parent_occupation]
        );

        res.render('public/spmb/register', {
            title: 'Daftar SPMB',
            error: null,
            success: 'Pendaftaran berhasil! Kami akan menghubungi Anda segera.',
            formData: {}
        });
    } catch (error) {
        console.error('SPMB registration error:', error);
        res.render('public/spmb/register', {
            title: 'Daftar SPMB',
            error: 'Terjadi kesalahan. Silakan coba lagi.',
            success: null,
            formData: req.body
        });
    }
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('public/contact', {
        title: 'Kontak Kami',
        error: null,
        success: null
    });
});

// Contact POST
router.post('/contact', [
    body('name').notEmpty().withMessage('Nama wajib diisi'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('subject').notEmpty().withMessage('Subjek wajib diisi'),
    body('message').notEmpty().withMessage('Pesan wajib diisi')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('public/contact', {
            title: 'Kontak Kami',
            error: errors.array()[0].msg,
            success: null
        });
    }

    try {
        const { name, email, phone, subject, message, type } = req.body;

        await dbHelpers.run(
            `INSERT INTO contacts (name, email, phone, subject, message, type)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, phone || null, subject, message, type || 'contact']
        );

        res.render('public/contact', {
            title: 'Kontak Kami',
            error: null,
            success: 'Pesan Anda telah terkirim. Kami akan segera menghubungi Anda.'
        });
    } catch (error) {
        console.error('Contact error:', error);
        res.render('public/contact', {
            title: 'Kontak Kami',
            error: 'Terjadi kesalahan. Silakan coba lagi.',
            success: null
        });
    }
});

// FAQ page
router.get('/faq', (req, res) => {
    res.render('public/faq', {
        title: 'FAQ'
    });
});

module.exports = router;
