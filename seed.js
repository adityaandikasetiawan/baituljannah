const bcrypt = require('bcrypt');
const { dbHelpers } = require('./database');

async function seed() {
    console.log('Starting database seeding...');

    try {
        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        const adminResult = await dbHelpers.run(
            `INSERT INTO users (username, email, password_hash, role, full_name, phone, address)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['admin', 'admin@baituljannah.com', adminPassword, 'admin', 'Administrator', '081234567890', 'Jakarta']
        );
        console.log('✓ Admin user created');

        // Ensure default teacher account (teacher@baituljannah.com)
        const teacherDefaultEmail = 'teacher@baituljannah.com';
        const teacherDefaultUser = await dbHelpers.get('SELECT * FROM users WHERE email = ?', [teacherDefaultEmail]);
        const teacherPassword = await bcrypt.hash('teacher123', 10);
        if (!teacherDefaultUser) {
            const teacherUserRes = await dbHelpers.run(
                `INSERT INTO users (username, email, password_hash, role, full_name, phone)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['teacher', teacherDefaultEmail, teacherPassword, 'teacher', 'Default Teacher', '081234567890']
            );
            const teacherId = 'TCH' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4);
            await dbHelpers.run(
                `INSERT INTO teachers (user_id, teacher_id, subject, qualification, join_date)
                 VALUES (?, ?, ?, ?, date('now'))`,
                [teacherUserRes.id, teacherId, 'Umum', 'S1 Pendidikan',]
            );
            console.log('✓ Default teacher (teacher@baituljannah.com) created');
        } else {
            // Ensure relation exists in teachers table
            const teacherRel = await dbHelpers.get('SELECT * FROM teachers WHERE user_id = ?', [teacherDefaultUser.id]);
            if (!teacherRel) {
                const teacherId = 'TCH' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4);
                await dbHelpers.run(
                    `INSERT INTO teachers (user_id, teacher_id, subject, qualification, join_date)
                     VALUES (?, ?, ?, ?, date('now'))`,
                    [teacherDefaultUser.id, teacherId, 'Umum', 'S1 Pendidikan']
                );
            }
        }

        // Create teachers (sample data)
        const teachers = [
            { username: 'teacher1', email: 'teacher1@baituljannah.com', name: 'Ahmad Fauzi', subject: 'Matematika', qualification: 'S1 Pendidikan Matematika' },
            { username: 'teacher2', email: 'teacher2@baituljannah.com', name: 'Siti Nurhaliza', subject: 'Bahasa Indonesia', qualification: 'S1 Pendidikan Bahasa Indonesia' },
            { username: 'teacher3', email: 'teacher3@baituljannah.com', name: 'Budi Santoso', subject: 'IPA', qualification: 'S1 Pendidikan Biologi' }
        ];

        for (const teacher of teachers) {
            const userResult = await dbHelpers.run(
                `INSERT INTO users (username, email, password_hash, role, full_name, phone)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [teacher.username, teacher.email, teacherPassword, 'teacher', teacher.name, '081234567891']
            );

            const teacherId = 'TCH' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4);
            await dbHelpers.run(
                `INSERT INTO teachers (user_id, teacher_id, subject, qualification, join_date)
                 VALUES (?, ?, ?, ?, date('now'))`,
                [userResult.id, teacherId, teacher.subject, teacher.qualification]
            );
        }
        console.log('✓ Teachers created');

        // Ensure default student account (student@baituljannah.com)
        const studentDefaultEmail = 'student@baituljannah.com';
        const studentDefaultUser = await dbHelpers.get('SELECT * FROM users WHERE email = ?', [studentDefaultEmail]);
        const studentPassword = await bcrypt.hash('student123', 10);
        if (!studentDefaultUser) {
            const studentUserRes = await dbHelpers.run(
                `INSERT INTO users (username, email, password_hash, role, full_name, phone)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['student', studentDefaultEmail, studentPassword, 'student', 'Default Student', '081234567891']
            );
            const studentId = 'STD' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4);
            await dbHelpers.run(
                `INSERT INTO students (user_id, student_id, class, program, enrollment_date, parent_name, parent_phone)
                 VALUES (?, ?, ?, ?, date('now'), ?, ?)`,
                [studentUserRes.id, studentId, '5A', 'SDIT', 'Orang Tua Default Student', '081234567892']
            );
            console.log('✓ Default student (student@baituljannah.com) created');
        } else {
            // Ensure relation exists in students table
            const studentRel = await dbHelpers.get('SELECT * FROM students WHERE user_id = ?', [studentDefaultUser.id]);
            if (!studentRel) {
                const studentId = 'STD' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4);
                await dbHelpers.run(
                    `INSERT INTO students (user_id, student_id, class, program, enrollment_date, parent_name, parent_phone)
                     VALUES (?, ?, ?, ?, date('now'), ?, ?)`,
                    [studentDefaultUser.id, studentId, '5A', 'SDIT', 'Orang Tua Default Student', '081234567892']
                );
            }
        }

        // Create students (sample data)
        const students = [
            { username: 'student1', email: 'student1@baituljannah.com', name: 'Muhammad Rizki', program: 'SDIT', class: '5A' },
            { username: 'student2', email: 'student2@baituljannah.com', name: 'Fatimah Azzahra', program: 'SMPIT', class: '7B' },
            { username: 'student3', email: 'student3@baituljannah.com', name: 'Abdullah Rahman', program: 'SMAIT', class: '10A' },
            { username: 'student4', email: 'student4@baituljannah.com', name: 'Aisyah Putri', program: 'SDIT', class: '6A' },
            { username: 'student5', email: 'student5@baituljannah.com', name: 'Umar Faruq', program: 'SMPIT', class: '8C' }
        ];

        for (const student of students) {
            const userResult = await dbHelpers.run(
                `INSERT INTO users (username, email, password_hash, role, full_name, phone)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [student.username, student.email, studentPassword, 'student', student.name, '081234567892']
            );

            const studentId = 'STD' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4);
            await dbHelpers.run(
                `INSERT INTO students (user_id, student_id, class, program, enrollment_date, parent_name, parent_phone)
                 VALUES (?, ?, ?, ?, date('now'), ?, ?)`,
                [userResult.id, studentId, student.class, student.program, 'Orang Tua ' + student.name, '081234567893']
            );
        }
        console.log('✓ Students created');

        // Create news articles
        const newsArticles = [
            {
                title: 'Pembukaan Tahun Ajaran Baru 2024/2025',
                slug: 'pembukaan-tahun-ajaran-baru-2024-2025',
                content: 'Alhamdulillah, Baitul Jannah School telah membuka tahun ajaran baru 2024/2025 dengan penuh semangat. Kegiatan pembukaan dihadiri oleh seluruh siswa, guru, dan orang tua. Tema tahun ini adalah "Membangun Generasi Qurani yang Berakhlak Mulia".',
                excerpt: 'Pembukaan tahun ajaran baru dengan tema Membangun Generasi Qurani',
                category: 'Akademik'
            },
            {
                title: 'Prestasi Siswa dalam Olimpiade Sains Nasional',
                slug: 'prestasi-siswa-dalam-olimpiade-sains-nasional',
                content: 'Siswa Baitul Jannah School berhasil meraih medali emas dalam Olimpiade Sains Nasional tingkat provinsi. Ini merupakan prestasi yang membanggakan dan hasil dari kerja keras siswa dan pembimbing.',
                excerpt: 'Siswa meraih medali emas dalam OSN tingkat provinsi',
                category: 'Prestasi'
            },
            {
                title: 'Program Tahfidz Quran Intensif',
                slug: 'program-tahfidz-quran-intensif',
                content: 'Baitul Jannah School meluncurkan program tahfidz Quran intensif untuk siswa yang ingin menghafal Al-Quran dengan bimbingan ustadz dan ustadzah yang berpengalaman.',
                excerpt: 'Program tahfidz intensif dengan bimbingan berpengalaman',
                category: 'Program'
            },
            {
                title: 'Kegiatan Bakti Sosial di Panti Asuhan',
                slug: 'kegiatan-bakti-sosial-di-panti-asuhan',
                content: 'Siswa dan guru Baitul Jannah School mengadakan kegiatan bakti sosial di panti asuhan setempat. Kegiatan ini bertujuan untuk menumbuhkan rasa empati dan kepedulian sosial.',
                excerpt: 'Bakti sosial untuk menumbuhkan empati siswa',
                category: 'Kegiatan'
            },
            {
                title: 'Workshop Parenting untuk Orang Tua',
                slug: 'workshop-parenting-untuk-orang-tua',
                content: 'Sekolah mengadakan workshop parenting dengan tema "Mendidik Anak di Era Digital". Workshop ini dihadiri oleh puluhan orang tua siswa dan dipandu oleh psikolog anak.',
                excerpt: 'Workshop parenting tentang mendidik anak di era digital',
                category: 'Kegiatan'
            },
            {
                title: 'Peningkatan Fasilitas Laboratorium Komputer',
                slug: 'peningkatan-fasilitas-laboratorium-komputer',
                content: 'Baitul Jannah School terus meningkatkan fasilitas dengan menambah komputer baru di laboratorium. Ini untuk mendukung pembelajaran teknologi informasi yang lebih baik.',
                excerpt: 'Penambahan komputer baru di laboratorium',
                category: 'Fasilitas'
            },
            {
                title: 'Lomba Cerdas Cermat Antar Kelas',
                slug: 'lomba-cerdas-cermat-antar-kelas',
                content: 'Sekolah mengadakan lomba cerdas cermat antar kelas untuk meningkatkan semangat belajar dan kompetisi sehat di kalangan siswa. Lomba ini diikuti oleh seluruh kelas.',
                excerpt: 'Lomba cerdas cermat untuk meningkatkan semangat belajar',
                category: 'Kegiatan'
            },
            {
                title: 'Kunjungan Industri ke Museum Nasional',
                slug: 'kunjungan-industri-ke-museum-nasional',
                content: 'Siswa kelas 9 dan 10 melakukan kunjungan edukatif ke Museum Nasional Jakarta. Kegiatan ini bertujuan untuk menambah wawasan sejarah dan budaya Indonesia.',
                excerpt: 'Kunjungan edukatif ke Museum Nasional Jakarta',
                category: 'Kegiatan'
            },
            {
                title: 'Peluncuran Aplikasi Mobile Baitul Jannah',
                slug: 'peluncuran-aplikasi-mobile-baitul-jannah',
                content: 'Sekolah meluncurkan aplikasi mobile untuk memudahkan komunikasi antara sekolah, siswa, dan orang tua. Aplikasi ini dapat diunduh di Play Store dan App Store.',
                excerpt: 'Aplikasi mobile untuk komunikasi sekolah-orang tua',
                category: 'Teknologi'
            },
            {
                title: 'Pelatihan Guru tentang Metode Pembelajaran Aktif',
                slug: 'pelatihan-guru-tentang-metode-pembelajaran-aktif',
                content: 'Seluruh guru mengikuti pelatihan tentang metode pembelajaran aktif dan inovatif. Pelatihan ini bertujuan untuk meningkatkan kualitas pembelajaran di kelas.',
                excerpt: 'Pelatihan metode pembelajaran aktif untuk guru',
                category: 'Pengembangan'
            }
        ];

        for (const news of newsArticles) {
            await dbHelpers.run(
                `INSERT INTO news (title, slug, content, excerpt, category, author_id, status, published_date)
                 VALUES (?, ?, ?, ?, ?, ?, 'published', datetime('now', '-' || (? || ' days')))`,
                [news.title, news.slug, news.content, news.excerpt, news.category, adminResult.id, Math.floor(Math.random() * 30)]
            );
        }
        console.log('✓ News articles created');

        // Create events
        const events = [
            {
                title: 'Ujian Tengah Semester',
                description: 'Pelaksanaan Ujian Tengah Semester untuk semua tingkat',
                event_date: '2024-03-15',
                location: 'Ruang Kelas',
                category: 'Akademik',
                status: 'upcoming'
            },
            {
                title: 'Peringatan Maulid Nabi Muhammad SAW',
                description: 'Peringatan Maulid Nabi dengan berbagai kegiatan islami',
                event_date: '2024-03-20',
                location: 'Aula Sekolah',
                category: 'Keagamaan',
                status: 'upcoming'
            },
            {
                title: 'Lomba Tahfidz Quran',
                description: 'Lomba tahfidz Quran tingkat sekolah',
                event_date: '2024-04-05',
                location: 'Masjid Sekolah',
                category: 'Keagamaan',
                status: 'upcoming'
            },
            {
                title: 'Outing Class ke Taman Safari',
                description: 'Kegiatan outing class untuk siswa kelas 1-6',
                event_date: '2024-04-12',
                location: 'Taman Safari Bogor',
                category: 'Rekreasi',
                status: 'upcoming'
            },
            {
                title: 'Rapat Orang Tua Siswa',
                description: 'Rapat koordinasi dengan orang tua siswa',
                event_date: '2024-04-20',
                location: 'Aula Sekolah',
                category: 'Rapat',
                status: 'upcoming'
            }
        ];

        for (const event of events) {
            await dbHelpers.run(
                `INSERT INTO events (title, description, event_date, location, category, created_by, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [event.title, event.description, event.event_date, event.location, event.category, adminResult.id, event.status]
            );
        }
        console.log('✓ Events created');

        // Create sample registrations
        const registrations = [
            {
                full_name: 'Ahmad Zaki',
                email: 'zaki@example.com',
                phone: '081234567894',
                birth_date: '2015-05-10',
                birth_place: 'Jakarta',
                gender: 'male',
                address: 'Jl. Merdeka No. 123, Jakarta',
                program: 'SDIT',
                parent_name: 'Bapak Ahmad',
                parent_phone: '081234567895',
                status: 'pending'
            },
            {
                full_name: 'Zahra Amelia',
                email: 'zahra@example.com',
                phone: '081234567896',
                birth_date: '2013-08-15',
                birth_place: 'Bandung',
                gender: 'female',
                address: 'Jl. Sudirman No. 456, Bandung',
                program: 'SMPIT',
                parent_name: 'Ibu Siti',
                parent_phone: '081234567897',
                status: 'approved'
            },
            {
                full_name: 'Farhan Maulana',
                email: 'farhan@example.com',
                phone: '081234567898',
                birth_date: '2011-03-20',
                birth_place: 'Surabaya',
                gender: 'male',
                address: 'Jl. Pahlawan No. 789, Surabaya',
                program: 'SMAIT',
                parent_name: 'Bapak Hasan',
                parent_phone: '081234567899',
                status: 'pending'
            }
        ];

        for (const reg of registrations) {
            await dbHelpers.run(
                `INSERT INTO registrations (full_name, email, phone, birth_date, birth_place, gender, address, program, parent_name, parent_phone, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [reg.full_name, reg.email, reg.phone, reg.birth_date, reg.birth_place, reg.gender, reg.address, reg.program, reg.parent_name, reg.parent_phone, reg.status]
            );
        }
        console.log('✓ Sample registrations created');

        // Create sample contacts
        const contacts = [
            {
                name: 'Ibu Dewi',
                email: 'dewi@example.com',
                phone: '081234567800',
                subject: 'Pertanyaan tentang biaya pendaftaran',
                message: 'Assalamualaikum, saya ingin menanyakan tentang biaya pendaftaran untuk tahun ajaran baru. Terima kasih.',
                type: 'contact',
                status: 'new'
            },
            {
                name: 'Bapak Rudi',
                email: 'rudi@example.com',
                phone: '081234567801',
                subject: 'Permohonan kunjungan sekolah',
                message: 'Saya ingin mengajukan permohonan untuk berkunjung ke sekolah minggu depan. Mohon informasinya.',
                type: 'visit',
                status: 'read'
            }
        ];

        for (const contact of contacts) {
            await dbHelpers.run(
                `INSERT INTO contacts (name, email, phone, subject, message, type, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [contact.name, contact.email, contact.phone, contact.subject, contact.message, contact.type, contact.status]
            );
        }
        console.log('✓ Sample contacts created');

        // Create sample achievements
        const achievements = [
            {
                title: 'Juara 1 Olimpiade Matematika Tingkat Provinsi',
                description: 'Muhammad Rizki berhasil meraih juara 1 dalam Olimpiade Matematika tingkat provinsi',
                achievement_date: '2024-02-15',
                category: 'Akademik'
            },
            {
                title: 'Juara 2 Lomba Tahfidz Quran',
                description: 'Fatimah Azzahra meraih juara 2 dalam lomba tahfidz Quran tingkat kota',
                achievement_date: '2024-02-20',
                category: 'Keagamaan'
            },
            {
                title: 'Juara 1 Lomba Pidato Bahasa Inggris',
                description: 'Abdullah Rahman menjadi juara 1 lomba pidato bahasa Inggris tingkat kabupaten',
                achievement_date: '2024-02-25',
                category: 'Bahasa'
            }
        ];

        // Get first student for achievements
        const firstStudent = await dbHelpers.get('SELECT id FROM students LIMIT 1');

        for (const achievement of achievements) {
            await dbHelpers.run(
                `INSERT INTO achievements (title, description, achievement_date, category, student_id, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [achievement.title, achievement.description, achievement.achievement_date, achievement.category, firstStudent.id, adminResult.id]
            );
        }
        console.log('✓ Sample achievements created');

        // Create sample grades
        const teacher = await dbHelpers.get('SELECT id FROM teachers LIMIT 1');
        const student = await dbHelpers.get('SELECT id FROM students LIMIT 1');

        const grades = [
            { subject: 'Matematika', semester: '2023/2024 Ganjil', grade: 85, remarks: 'Baik' },
            { subject: 'Bahasa Indonesia', semester: '2023/2024 Ganjil', grade: 90, remarks: 'Sangat Baik' },
            { subject: 'IPA', semester: '2023/2024 Ganjil', grade: 88, remarks: 'Baik' },
            { subject: 'IPS', semester: '2023/2024 Ganjil', grade: 87, remarks: 'Baik' },
            { subject: 'Bahasa Inggris', semester: '2023/2024 Ganjil', grade: 92, remarks: 'Sangat Baik' }
        ];

        for (const grade of grades) {
            await dbHelpers.run(
                `INSERT INTO grades (student_id, subject, semester, grade, remarks, teacher_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [student.id, grade.subject, grade.semester, grade.grade, grade.remarks, teacher.id]
            );
        }
        console.log('✓ Sample grades created');

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('Admin:   admin@baituljannah.com / admin123');
        console.log('Teacher: teacher1@baituljannah.com / teacher123');
        console.log('Student: student1@baituljannah.com / student123');
        console.log('\n🚀 Run "npm start" to start the application');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

// Run seed
seed();
