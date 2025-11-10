const { dbHelpers } = require('../database');

(async () => {
  try {
    const title = 'Test Achievement IMG-01';
    const description = 'Pengujian unggah gambar prestasi.';
    const achievementDate = new Date().toISOString().slice(0, 10);
    const category = 'Prestasi';
    const image = '/uploads/achievements/blog-31.jpg';
    const createdBy = 1;

    const sql = `INSERT INTO achievements (title, description, achievement_date, category, image, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const result = await dbHelpers.run(sql, [title, description, achievementDate, category, image, createdBy]);
    console.log('Inserted achievement id:', result.lastID);
  } catch (err) {
    console.error('Error inserting test achievement:', err);
    process.exit(1);
  }
})();