# Setup Guide - Baitul Jannah School Management System

## 📋 Quick Start Guide

Follow these steps to get the system up and running:

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages:
- express (web framework)
- sqlite3 (database)
- ejs (template engine)
- bcrypt (password hashing)
- express-session (session management)
- multer (file uploads)
- express-validator (form validation)
- helmet (security)
- and more...

### Step 2: Copy Template Assets

You need to copy the template assets from the existing template folder to the public folder:

```bash
# On Windows (PowerShell)
xcopy /E /I "dreamslms.dreamstechnologies.com\html\template\assets" "public\assets"

# On Windows (Command Prompt)
xcopy /E /I dreamslms.dreamstechnologies.com\html\template\assets public\assets

# On Linux/Mac
cp -r dreamslms.dreamstechnologies.com/html/template/assets public/assets
```

Or manually:
1. Create folder: `public/assets`
2. Copy all contents from `dreamslms.dreamstechnologies.com/html/template/assets/` to `public/assets/`

### Step 3: Initialize Database

Run the seed script to create database tables and populate with sample data:

```bash
npm run seed
```

This will create:
- 1 admin user
- 3 teachers
- 5 students
- 10 news articles
- 5 events
- Sample registrations, contacts, achievements, and grades

### Step 4: Start the Application

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### Step 5: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## 🔑 Default Login Credentials

### Admin Dashboard
- **URL**: http://localhost:3000/login
- **Email**: admin@baituljannah.com
- **Password**: admin123
- **Access**: Full system management

### Teacher Dashboard
- **URL**: http://localhost:3000/login
- **Email**: teacher1@baituljannah.com
- **Password**: teacher123
- **Access**: Student management, grades

### Student Dashboard
- **URL**: http://localhost:3000/login
- **Email**: student1@baituljannah.com
- **Password**: student123
- **Access**: View grades, profile

## 📁 What's Been Created

### Backend (Complete ✅)
- ✅ Database schema with 11 tables
- ✅ Authentication system with role-based access
- ✅ File upload system for images and documents
- ✅ Public routes (home, news, events, gallery, contact, SPMB)
- ✅ Student routes (dashboard, profile, grades)
- ✅ Teacher routes (dashboard, students, grades)
- ✅ Admin routes (full CRUD for all entities)
- ✅ Seed data for testing

### Frontend (To Be Created 🚧)
The view templates need to be created. The backend is ready and waiting for the EJS templates.

## 🎨 Creating View Templates

The next major task is creating the EJS view templates. Here's the priority order:

### Priority 1: Essential Templates
1. **Layouts**
   - `views/layouts/main.ejs` - Main layout
   - `views/layouts/dashboard.ejs` - Dashboard layout

2. **Partials**
   - `views/partials/header.ejs`
   - `views/partials/footer.ejs`
   - `views/partials/sidebar-admin.ejs`
   - `views/partials/sidebar-teacher.ejs`
   - `views/partials/sidebar-student.ejs`

3. **Authentication**
   - `views/auth/login.ejs`
   - `views/auth/register.ejs`

4. **Error Page**
   - `views/error.ejs`

### Priority 2: Public Pages
- `views/public/home.ejs` (using index-4.html)
- `views/public/news/list.ejs`
- `views/public/news/detail.ejs`
- And other public pages...

### Priority 3: Dashboard Pages
- Admin, Teacher, and Student dashboard pages

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=baituljannah_secret_key_change_in_production_2024
DB_PATH=./school.db
```

### Database Location
- SQLite database: `school.db`
- Session database: `sessions.db`

### Upload Directories
All uploads go to the `uploads/` folder:
- `uploads/news/` - News images
- `uploads/gallery/` - Gallery photos
- `uploads/bulletins/` - E-bulletin PDFs
- `uploads/events/` - Event images
- `uploads/achievements/` - Achievement images
- `uploads/documents/` - Other documents
- `uploads/avatars/` - User avatars

## 🐛 Troubleshooting

### Issue: "Cannot find module"
**Solution**: Run `npm install` again

### Issue: "Database locked"
**Solution**: Close the application and delete `school.db` and `sessions.db`, then run `npm run seed` again

### Issue: "Port 3000 already in use"
**Solution**: Change PORT in .env file or kill the process using port 3000

### Issue: "Template not found"
**Solution**: The view templates haven't been created yet. This is expected at this stage.

### Issue: Assets not loading (404 errors)
**Solution**: Make sure you've copied the template assets to `public/assets/`

## 📊 Database Schema Overview

### Users & Roles
- **users**: All users (students, teachers, admins)
- **students**: Student-specific data
- **teachers**: Teacher-specific data

### Content Management
- **news**: News articles
- **events**: School events/agenda
- **galleries**: Photo gallery
- **bulletins**: E-bulletins (PDF files)
- **achievements**: Student achievements

### Operations
- **registrations**: SPMB registrations
- **contacts**: Contact form submissions
- **grades**: Student grades
- **settings**: System settings

## 🚀 Next Steps

1. **Copy template assets** to `public/assets/`
2. **Create view templates** starting with layouts and partials
3. **Test the application** with different user roles
4. **Customize content** for Baitul Jannah School
5. **Deploy to production** when ready

## 📞 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure database is properly seeded
4. Check that template assets are copied
5. Review the TODO.md for implementation status

## 🎓 Learning Resources

- **Express.js**: https://expressjs.com/
- **EJS Templates**: https://ejs.co/
- **SQLite**: https://www.sqlite.org/
- **Bootstrap**: https://getbootstrap.com/

---

**Ready to start?** Run `npm install` then `npm run seed` then `npm start`!
