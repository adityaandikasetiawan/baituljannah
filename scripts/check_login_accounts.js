const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'school.db');
const db = new sqlite3.Database(dbPath);

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function main() {
  try {
    const targets = [
      'admin@baituljannah.com',
      'teacher@baituljannah.com',
      'student@baituljannah.com',
      'teacher1@baituljannah.com',
      'student1@baituljannah.com'
    ];

    const result = {};
    for (const email of targets) {
      const user = await get('SELECT id, email, role, status FROM users WHERE email = ?', [email]);
      result[email] = user || null;
    }

    const counts = {
      users: await get('SELECT COUNT(*) as c FROM users'),
      students: await get('SELECT COUNT(*) as c FROM students'),
      teachers: await get('SELECT COUNT(*) as c FROM teachers')
    };

    console.log('Users summary:', counts);
    console.log('Specific accounts:', result);

    // Check role relations for teacher1/student1 if present
    const teacher1 = result['teacher1@baituljannah.com'];
    const student1 = result['student1@baituljannah.com'];
    if (teacher1) {
      const tRel = await get('SELECT id, teacher_id FROM teachers WHERE user_id = ?', [teacher1.id]);
      console.log('teacher1 relation:', tRel || null);
    }
    if (student1) {
      const sRel = await get('SELECT id, student_id FROM students WHERE user_id = ?', [student1.id]);
      console.log('student1 relation:', sRel || null);
    }

    db.close();
  } catch (err) {
    console.error('Check accounts error:', err);
    db.close();
    process.exit(1);
  }
}

main();