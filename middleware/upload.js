const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directories exist
const uploadDirs = [
    './uploads/news',
    './uploads/gallery',
    './uploads/bulletins',
    './uploads/documents',
    './uploads/avatars',
    './uploads/events',
    './uploads/achievements',
    './uploads/banners'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration for news images
const newsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/news');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for gallery images
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/gallery');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for bulletins
const bulletinStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/bulletins');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bulletin-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for documents
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/documents');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/avatars');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for events
const eventStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/events');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for achievements
const achievementStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/achievements');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'achievement-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration for home banners
const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/banners');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// File filter for documents (PDF)
const documentFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF and Word documents are allowed'));
    }
};

// Upload configurations
const uploadNews = multer({
    storage: newsStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter
});

const uploadGallery = multer({
    storage: galleryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter
});

const uploadBulletin = multer({
    storage: bulletinStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: documentFilter
});

const uploadDocument = multer({
    storage: documentStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: documentFilter
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: imageFilter
});

const uploadEvent = multer({
    storage: eventStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter
});

const uploadAchievement = multer({
    storage: achievementStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter
});

const uploadBanner = multer({
    storage: bannerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter
});

module.exports = {
    uploadNews,
    uploadGallery,
    uploadBulletin,
    uploadDocument,
    uploadAvatar,
    uploadEvent,
    uploadAchievement,
    uploadBanner,
    /**
     * Middleware: jika ada req.file (hasil upload gambar), buat versi WebP di lokasi yang sama.
     * Mendukung JPG/JPEG/PNG. Jika format lain (SVG/GIF/WEBP), middleware akan skip.
     */
    convertToWebp: async (req, res, next) => {
        try {
            const file = req.file;
            if (!file) return next();

            const ext = path.extname(file.filename).toLowerCase();
            const base = file.path.replace(ext, '');
            const targetWebp = `${base}.webp`;
            const sizes = [320, 640, 1024, 1600];

            // Hanya proses jpg/jpeg/png
            if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
                return next();
            }

            // Jika sudah ada file webp, skip
            if (fs.existsSync(targetWebp)) {
                // Meskipun base .webp sudah ada, pastikan varian multi-width juga tersedia
                try {
                    const meta = await sharp(file.path, { failOnError: false }).metadata();
                    const maxWidth = meta.width || 0;
                    await Promise.all(sizes
                        .filter(w => w <= maxWidth)
                        .map(async (w) => {
                            const sizedPath = `${base}-${w}.webp`;
                            if (fs.existsSync(sizedPath)) return;
                            await sharp(file.path, { failOnError: false })
                                .resize({ width: w, fit: 'inside' })
                                .webp({ quality: 82 })
                                .toFile(sizedPath);
                        }));
                } catch (e) {
                    // ignore variant generation failure
                }
                return next();
            }

            // Konversi ke WebP
            const image = sharp(file.path, { failOnError: false });
            const meta = await image.metadata();
            await image.webp({ quality: 82 }).toFile(targetWebp);

            // Buat varian multi-width (jika ukuran asli mendukung)
            const maxWidth = meta.width || 0;
            await Promise.all(sizes
                .filter(w => w <= maxWidth)
                .map(async (w) => {
                    const sizedPath = `${base}-${w}.webp`;
                    if (fs.existsSync(sizedPath)) return;
                    await sharp(file.path, { failOnError: false })
                        .resize({ width: w, fit: 'inside' })
                        .webp({ quality: 82 })
                        .toFile(sizedPath);
                }));

            return next();
        } catch (err) {
            console.error('WebP conversion error:', err.message);
            // Jangan blok request jika konversi gagal
            return next();
        }
    }
};
