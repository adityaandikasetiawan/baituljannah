const { dbHelpers } = require('../database');

(async () => {
  try {
    const title = 'Test Gallery IMG-01';
    const imagePath = '/uploads/gallery/blog-31.jpg';
    const description = 'Pengujian unggah gambar galeri.';
    const category = 'Kegiatan';
    const uploadedBy = 1;

    const sql = `INSERT INTO galleries (title, image_path, description, category, uploaded_by)
                 VALUES (?, ?, ?, ?, ?)`;
    const result = await dbHelpers.run(sql, [title, imagePath, description, category, uploadedBy]);
    console.log('Inserted gallery id:', result.lastID);
  } catch (err) {
    console.error('Error inserting test gallery:', err);
    process.exit(1);
  }
})();