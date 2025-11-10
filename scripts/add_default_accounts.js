const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'school.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function ensureTeacherDefault() {
  const email = 'teacher@baituljannah.com';
  const exists = await get('SELECT id FROM users WHERE email = ?', [email]);
  if (exists) {
    console.log('✓ Default teacher account already exists:', email);
    return;
  }
  const password_hash = await bcrypt.hash('teacher123', 10);
  const user = await run(
    `INSERT INTO users (username, email, password_hash, role, full_name, phone, status)
     VALUES (?, ?, ?, 'teacher', ?, ?, 'active')`,
    ['teacher', email, password_hash, 'Default Teacher', '081234567899']
  );
  const teacherId = 'TCH' + Date.now().toString().slice(-8);
  await run(
    `INSERT INTO teachers (user_id, teacher_id, subject, qualification, join_date)
     VALUES (?, ?, ?, ?, date('now'))`,
    [user.id, teacherId, 'Umum', 'Default',]
  );
  console.log('✓ Default teacher account created:', email);
}

async function ensureStudentDefault() {
  const email = 'student@baituljannah.com';
  const exists = await get('SELECT id FROM users WHERE email = ?', [email]);
  if (exists) {
    console.log('✓ Default student account already exists:', email);
    return;
  }
  const password_hash = await bcrypt.hash('student123', 10);
  const user = await run(
    `INSERT INTO users (username, email, password_hash, role, full_name, phone, status)
     VALUES (?, ?, ?, 'student', ?, ?, 'active')`,
    ['student', email, password_hash, 'Default Student', '081234567898']
  );
  const studentId = 'STD' + Date.now().toString().slice(-8);
  await run(
    `INSERT INTO students (user_id, student_id, class, program, enrollment_date, parent_name, parent_phone)
     VALUES (?, ?, ?, ?, date('now'), ?, ?)`,
    [user.id, studentId, '1A', 'SDIT', 'Orang Tua Default', '081234567897']
  );
  console.log('✓ Default student account created:', email);
}

async function main() {
  try {
    await ensureTeacherDefault();
    await ensureStudentDefault();
    db.close();
    console.log('\nAll done.');
  } catch (e) {
    console.error('Error creating default accounts:', e);
    db.close();
    process.exit(1);
  }
}

main();