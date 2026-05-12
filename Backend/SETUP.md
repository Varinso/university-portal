# Quick Start Guide

Your backend is now ready to run with **SQLite (zero database installation needed)!**

## 1. Install Dependencies

```bash
cd Backend
npm install
```

## 2. Run Database Migration

```bash
npm run migrate
```

This creates the SQLite database file `university_portal.sqlite` and initializes all tables.

## 3. (Optional) Seed Demo Data

To create demo accounts and sample data:

```bash
# Edit .env and set:
SEED_DEMO=true

# Then run:
npm run seed
```

Demo accounts created:
- **Student**: `student@uni.edu` / `123456`
- **Instructor**: `instructor@uni.edu` / `123456`

## 4. Start the Backend Server

```bash
npm run dev
```

Server runs on **http://localhost:5000**

## 5. Test Frontend

Open in browser: `file:///path/to/university-portal/Frontend/index.html`

or use a live server and navigate to `http://localhost:8000/Frontend/index.html` (depending on your server config).

## Features Working

✅ Real signup/login (no default credentials required)
✅ Student dashboard (view courses, assignments, attendance, GPA)
✅ Instructor dashboard (view pending submissions, students, course stats)
✅ Courses (list/create)
✅ Assignments (list/create/submit)
✅ Submissions (view/grade/provide feedback)
✅ Attendance (mark/view)
✅ Announcements (view/post)
✅ Forum (discussions)
✅ Reports (student academic summary)

## Database

SQLite database file: `university_portal.sqlite` (created after first migration)

All data persists locally. To reset the database, delete `university_portal.sqlite` and re-run `npm run migrate`.

## Architecture

- **Frontend**: Static HTML + JavaScript (assets/app.js) - calls backend APIs
- **Backend**: Node.js + Express + SQLite
- **Auth**: JWT tokens stored in localStorage
- **Role-based routes**: Student and Instructor access controlled

## Troubleshooting

### Port 5000 already in use
Edit `.env` and change `PORT=5000` to another port (e.g., `PORT=5001`)

### Module not found errors
Run `npm install` again in the Backend directory

### Database lock errors
Close the server and any other processes accessing the SQLite file, then restart

### CORS errors
Ensure the frontend is calling `http://localhost:5000/api/...` (check `assets/app.js` line 8 for `API_BASE`)
