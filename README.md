# Baitul Jannah School Management System

Sistem Manajemen Sekolah berbasis web yang lengkap untuk Baitul Jannah School, dibangun dengan Node.js, Express, SQLite, dan EJS.

## 🌟 Fitur Utama

### Halaman Publik
- **Beranda**: Menampilkan berita terbaru, agenda, dan galeri
- **Tentang Kami**: Sejarah, Visi Misi, Kepengurusan, Fasilitas
- **Profile Sekolah**: PGIT-TKIT, SDIT, SMPIT, SMAIT, SLBIT
- **Informasi**: Berita, Prestasi, Agenda, E-Buletin, Galeri Foto
- **Pendaftaran SPMB**: Form pendaftaran online
- **Kontak**: Form kontak dan permohonan kunjungan

### Dashboard Siswa
- Melihat profil dan nilai
- Melihat jadwal pelajaran
- Melihat pengumuman
- Mengubah password

### Dashboard Guru
- Mengelola data siswa
- Input dan edit nilai siswa
- Upload materi pembelajaran
- Melihat jadwal mengajar

### Dashboard Admin
- **Manajemen Pengguna**: CRUD untuk siswa, guru, dan admin
- **Manajemen Berita**: Buat, edit, hapus berita
- **Manajemen Agenda**: Kelola event dan kegiatan sekolah
- **Manajemen Galeri**: Upload dan kelola foto
- **Manajemen SPMB**: Approve/reject pendaftaran
- **Manajemen Kontak**: Lihat dan balas pesan
- **Manajemen E-Buletin**: Upload buletin sekolah
- **Manajemen Prestasi**: Kelola prestasi siswa
- **Dashboard Statistik**: Lihat statistik sekolah

## 🛠️ Teknologi yang Digunakan

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Template Engine**: EJS
- **Authentication**: express-session, bcrypt
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: Helmet, Rate Limiting
- **Frontend**: HTML, CSS, JavaScript, Bootstrap (dari template)

## 📋 Prasyarat

- Node.js (v14 atau lebih baru)
- npm atau yarn

## 🚀 Instalasi

1. **Clone atau download project ini**
   ```bash
   cd baituljannah
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   File `.env` sudah tersedia dengan konfigurasi default. Anda dapat mengubahnya sesuai kebutuhan.

4. **Inisialisasi database dan seed data**
   ```bash
   npm run seed
   ```

5. **Jalankan aplikasi**
   ```bash
   npm start
   ```

6. **Akses aplikasi**
   Buka browser dan akses: `http://localhost:3000`

## 👤 Login Credentials

Setelah menjalankan seed, gunakan kredensial berikut:

### Admin
- Email: `admin@baituljannah.com`
- Password: `admin123`

### Guru
- Email: `teacher1@baituljannah.com`
- Password: `teacher123`

### Siswa
- Email: `student1@baituljannah.com`
- Password: `student123`

## 📁 Struktur Project

```
baituljannah-school/
├── app.js                  # Main application file
├── database.js             # Database configuration
├── seed.js                 # Database seeding script
├── package.json            # Dependencies
├── .env                    # Environment variables
├── middleware/
│   ├── auth.js            # Authentication middleware
│   └── upload.js          # File upload configuration
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── public.js          # Public pages routes
│   ├── student.js         # Student dashboard routes
│   ├── teacher.js         # Teacher dashboard routes
│   └── admin.js           # Admin dashboard routes
├── views/
│   ├── layouts/           # Layout templates
│   ├── partials/          # Reusable components
│   ├── auth/              # Login/register pages
│   ├── public/            # Public pages
│   ├── student/           # Student dashboard pages
│   ├── teacher/           # Teacher dashboard pages
│   └── admin/             # Admin dashboard pages
├── public/
│   └── assets/            # Static files (CSS, JS, images)
└── uploads/               # Uploaded files
    ├── news/
    ├── gallery/
    ├── bulletins/
    ├── events/
    └── documents/
```

## 🔐 Keamanan

- Password di-hash menggunakan bcrypt
- Session-based authentication
- CSRF protection
- Rate limiting untuk login
- Input validation
- SQL injection prevention
- XSS protection dengan Helmet

## 📝 Penggunaan

### Sebagai Admin
1. Login dengan kredensial admin
2. Akses dashboard admin di `/admin/dashboard`
3. Kelola users, berita, events, galeri, dll melalui menu sidebar

### Sebagai Guru
1. Login dengan kredensial guru
2. Akses dashboard guru di `/teacher/dashboard`
3. Kelola siswa dan nilai melalui menu yang tersedia

### Sebagai Siswa
1. Login dengan kredensial siswa
2. Akses dashboard siswa di `/student/dashboard`
3. Lihat nilai, jadwal, dan informasi lainnya

## 🔄 Development

Untuk development dengan auto-reload:

```bash
npm run dev
```

## 📦 Build untuk Production

1. Update `.env` dengan `NODE_ENV=production`
2. Ganti `SESSION_SECRET` dengan nilai yang aman
3. Enable HTTPS
4. Setup reverse proxy (nginx/apache)
5. Jalankan dengan process manager (PM2)

```bash
npm install -g pm2
pm2 start app.js --name baituljannah-school
```

## 🤝 Kontribusi

Untuk berkontribusi pada project ini:
1. Fork repository
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

MIT License - lihat file LICENSE untuk detail

## 📞 Kontak

Baitul Jannah School
- Website: http://localhost:3000
- Email: admin@baituljannah.com

## 🙏 Acknowledgments

- Bootstrap untuk UI framework
- Express.js community
- SQLite untuk database yang ringan dan efisien

---

**Note**: Ini adalah sistem manajemen sekolah yang siap pakai. Pastikan untuk mengubah kredensial default dan konfigurasi keamanan sebelum deployment ke production.

## 🚀 Deployment ke Server (PM2 + Nginx + HTTPS)

Langkah ini untuk menjalankan aplikasi di baituljannah.sch.id menggunakan PM2 dan Nginx.

1) Prasyarat
- Pasang Node.js LTS (18/20), NPM, PM2, Nginx, Certbot (Let’s Encrypt):
  - Ubuntu/Debian:
    - sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
    - curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    - sudo apt install -y nodejs
    - sudo npm i -g pm2
- Pastikan DNS domain baituljannah.sch.id mengarah ke IP server.

2) Siapkan proyek di server
- Taruh kode di /var/www/baituljannah (atau direktori lain), lalu:
  - cd /var/www/baituljannah
  - npm ci
  - Salin dan sesuaikan file .env (production):
    - NODE_ENV=production
    - PORT=3000
    - SESSION_SECRET=ubah_dengan_secret_yang_kuat
- Build Tailwind CSS:
  - npm run build:tailwind

3) Jalankan dengan PM2
- pm2 start ecosystem.config.js --env production
- pm2 status
- Agar otomatis hidup setelah reboot:
  - pm2 save
  - pm2 startup systemd (ikuti instruksi yang muncul)

Catatan: Aplikasi sudah di-set app.set('trust proxy', 1) agar cookie secure berfungsi di balik Nginx/HTTPS.

4) Nginx reverse proxy
- Contoh konfigurasi tersedia di scripts/nginx/baituljannah.conf.example
- Salin ke /etc/nginx/sites-available/baituljannah.conf, enable, lalu reload:
  - sudo ln -s /etc/nginx/sites-available/baituljannah.conf /etc/nginx/sites-enabled/
  - sudo nginx -t && sudo systemctl reload nginx

5) Pasang SSL HTTPS
- Jalankan Certbot untuk otomatis mengonfigurasi HTTPS:
  - sudo certbot --nginx -d baituljannah.sch.id -d www.baituljannah.sch.id
- Test auto-renewal:
  - sudo certbot renew --dry-run

6) Update aplikasi
- Pull/push perubahan, lalu:
  - npm ci
  - npm run build:tailwind
  - pm2 reload baituljannah

7) Akses file dan database
- Pastikan user yang menjalankan PM2 punya akses tulis ke school.db, sessions.db, dan folder uploads.
- Contoh:
- sudo chown -R <user_pm2>:<group> /var/www/baituljannah/uploads /var/www/baituljannah/school.db /var/www/baituljannah/sessions.db

8) Skrip PM2 via npm (opsional)
- npm run pm2:start
- npm run pm2:reload
- npm run pm2:stop
- npm run pm2:status
- npm run pm2:save
- npm run pm2:startup
#   b a i t u l j a n n a h 
 
 
