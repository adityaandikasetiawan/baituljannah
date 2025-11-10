Todo List (Deployment baituljannah.sch.id)

Konfigurasi yang dipilih (fokus):
- Canonical host: non-www (www → non-www)
- Redirect: paksa HTTP → HTTPS

Selesai:
- [x] Update Express trust proxy untuk cookie secure di balik Nginx/HTTPS
- [x] Tambah PM2 ecosystem.config.js dengan pengaturan produksi
- [x] Tambah contoh konfigurasi Nginx reverse proxy (scripts/nginx/baituljannah.conf.example)
- [x] Tambah npm scripts untuk PM2 (start/reload/stop/status/save/startup)
- [x] Tambah .env.production.example dengan variabel yang direkomendasikan
- [x] Siapkan konfigurasi Nginx final (scripts/nginx/baituljannah.conf) dengan non-www dan HTTP→HTTPS
- [x] Putuskan canonical host (non-www) dan redirect

Langkah inti berikutnya (fokus eksekusi di server):
- [ ] Pastikan DNS baituljannah.sch.id menunjuk ke IP server
- [ ] Upload/clone kode ke server dan install dependencies di /var/www/baituljannah
- [ ] Buat dan amankan .env di server dengan secret produksi
- [ ] Build frontend assets (Tailwind) dan start app via PM2 (production)
- [ ] Konfigurasi PM2 startup dan pm2 save (auto-restart saat reboot)
- [ ] Set permissions untuk school.db, sessions.db, dan folder uploads
- [ ] Konfigurasi firewall (ufw) untuk mengizinkan HTTP/HTTPS (80, 443)
- [ ] Terbitkan dan pasang SSL via Certbot untuk baituljannah.sch.id
- [ ] Verifikasi end-to-end via domain (HTTP→HTTPS), termasuk sesi, login, dan static uploads

Catatan Eksekusi Singkat di Server:
- Nginx: salin scripts/nginx/baituljannah.conf → /etc/nginx/sites-available, symlink ke sites-enabled, lalu reload
- PM2: pm2 start ecosystem.config.js --env production, pm2 save, pm2 startup systemd
- SSL: sudo certbot --nginx -d baituljannah.sch.id -d www.baituljannah.sch.id, lalu test renew