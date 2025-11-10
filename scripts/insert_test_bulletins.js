const path = require('path');
const { dbHelpers } = require('../database');

(async () => {
  try {
    const title = 'Test Bulletin File-01';
    const description = 'Pengujian unggah file bulletin + cover image.';
    const coverImage = '/uploads/bulletins/blog-31.jpg';
    const filePath = path.join(__dirname, '..', 'uploads', 'bulletins', 'test-bulletin.txt');
    const publishedDate = new Date().toISOString().slice(0, 10);
    const uploadedBy = 1;

    const sql = `INSERT INTO bulletins (title, description, cover_image, file_path, published_date, uploaded_by, downloads)
                 VALUES (?, ?, ?, ?, ?, ?, 0)`;
    const result = await dbHelpers.run(sql, [title, description, coverImage, filePath, publishedDate, uploadedBy]);
    console.log('Inserted bulletin id:', result.lastID);
  } catch (err) {
    console.error('Error inserting test bulletin:', err);
    process.exit(1);
  }
})();