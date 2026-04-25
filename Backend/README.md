University Portal Backend (Class Project)

Stack
- Node.js + Express
- MySQL
- JWT authentication

What this backend covers
- Auth (register/login)
- Student APIs (dashboard, my courses, my attendance)
- Instructor APIs (dashboard stats)
- Courses, assignments, submissions, attendance, announcements, forum, reports
- Role-based route protection (Student/Instructor)

Project structure
- src/app.js: Express app setup
- src/server.js: Startup file
- src/config: Environment and DB pool
- src/controllers: API handlers
- src/routes: Endpoint definitions
- src/middleware: Auth and error handling
- db/migrations: SQL schema files
- db/seed.js: Demo data seed script
- scripts/migrate.js: Runs SQL migration files

Quick start
1) Create MySQL database
- CREATE DATABASE university_portal;

2) Copy env file
- Copy .env.example to .env
- Set DB credentials and JWT secret

3) Install dependencies
- npm install

4) Apply schema and seed data
- npm run migrate
- npm run seed

5) Start backend
- npm run dev

Default demo login
- Student: student@uni.edu / 123456
- Instructor: instructor@uni.edu / 123456

API base URL
- http://localhost:5000/api

Health check
- GET /api/health

Core endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/students/me/dashboard
- GET /api/students/me/courses
- GET /api/students
- GET /api/instructors/me/dashboard
- GET /api/courses
- POST /api/courses
- GET /api/assignments
- POST /api/assignments
- GET /api/submissions
- POST /api/submissions
- PATCH /api/submissions/:id
- GET /api/attendance/me
- GET /api/attendance
- PUT /api/attendance
- GET /api/announcements
- POST /api/announcements
- GET /api/forum
- POST /api/forum
- GET /api/reports/student/:studentId

Auth note
- Send token in Authorization header:
  Authorization: Bearer YOUR_TOKEN
