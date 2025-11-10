const path = require('path');
const { dbHelpers } = require('../database');

(async () => {
  try {
    const title = 'Test Event IMG-01';
    const description = 'Pengujian unggah gambar untuk events.';
    const eventDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const eventTime = '09:00';
    const location = 'Aula Utama';
    const image = '/uploads/events/blog-31.jpg';
    const category = 'Kegiatan';
    const status = 'upcoming';
    const createdBy = 1;

    const sql = `INSERT INTO events (title, description, event_date, event_time, location, image, category, status, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const result = await dbHelpers.run(sql, [title, description, eventDate, eventTime, location, image, category, status, createdBy]);
    console.log('Inserted event id:', result.lastID);
  } catch (err) {
    console.error('Error inserting test event:', err);
    process.exit(1);
  }
})();