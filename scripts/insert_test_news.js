// Inserts a test News entry pointing to an image under /uploads/news
// Usage: node scripts/insert_test_news.js

(async () => {
  try {
    const { dbHelpers } = require('../database');

    const admin = await dbHelpers.get('SELECT id FROM users WHERE email = ?', ['admin@baituljannah.com']);
    if (!admin) {
      console.error('Admin user not found. Please run seed or create admin account.');
      process.exit(1);
    }

    const title = 'Test Upload Berita IMG-01';
    let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Ensure unique slug
    const existing = await dbHelpers.get('SELECT id FROM news WHERE slug = ?', [slug]);
    if (existing) {
      slug = slug + '-2';
    }

    const image = '/uploads/news/blog-31.jpg';
    const category = 'Kegiatan';
    const status = 'published';

    const result = await dbHelpers.run(
      `INSERT INTO news (title, slug, content, excerpt, image, category, author_id, status, published_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        title,
        slug,
        'Konten lengkap untuk pengujian upload gambar.',
        'Ini adalah pengujian unggah gambar untuk berita.',
        image,
        category,
        admin.id,
        status,
      ]
    );

    console.log('Inserted news id:', result.id, 'slug:', slug, 'image:', image);
    process.exit(0);
  } catch (e) {
    console.error('Error inserting test news:', e);
    process.exit(1);
  }
})();