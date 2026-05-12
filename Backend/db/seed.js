require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, query } = require('../src/config/db');

function seed() {
  // Optional demo seeding: only run when SEED_DEMO=true to avoid creating default accounts
  const doSeed = String(process.env.SEED_DEMO || '').toLowerCase();
  if (!(doSeed === '1' || doSeed === 'true' || doSeed === 'yes')) {
    console.log('SEED_DEMO not enabled; skipping demo data seeding. Set SEED_DEMO=true to run seeds.');
    db.close();
    return;
  }

  try {
    const studentHash = bcrypt.hashSync('123456', 10);
    const instructorHash = bcrypt.hashSync('123456', 10);

    query(
      `INSERT OR REPLACE INTO users (name, email, user_code, role, password_hash)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      ['Joy E', 'student@uni.edu', '2023001', 'Student', studentHash, 'Ms. Nabila', 'instructor@uni.edu', 'FAC101', 'Instructor', instructorHash]
    );

    const users = query('SELECT id, role, name, user_code FROM users');
    const student = users.find((u) => u.role === 'Student' && u.user_code === '2023001');
    const instructor = users.find((u) => u.role === 'Instructor' && u.user_code === 'FAC101');

    if (!student || !instructor) {
      throw new Error('Seed users not found after insert.');
    }

    query(
      `INSERT OR REPLACE INTO student_profiles (user_id, department)
       VALUES (?, ?)`,
      [student.id, 'CSE']
    );

    query(
      `INSERT OR REPLACE INTO courses (code, title, section, instructor_id, credit)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      ['CSE-101', 'Web Programming', 'A', instructor.id, 3.0, 'CSE-205', 'Database Systems', 'A', instructor.id, 3.0, 'ENG-103', 'Basic English', 'B', instructor.id, 1.0]
    );

    const courses = query('SELECT id, code FROM courses');
    const cse101 = courses.find((c) => c.code === 'CSE-101');
    const cse205 = courses.find((c) => c.code === 'CSE-205');
    const eng103 = courses.find((c) => c.code === 'ENG-103');

    const enrollments = [
      [student.id, cse101.id, 3.75],
      [student.id, cse205.id, 3.5],
      [student.id, eng103.id, 4.0]
    ];

    for (const [studentId, courseId, gpa] of enrollments) {
      query(
        `INSERT OR REPLACE INTO course_enrollments (student_id, course_id, gpa)
         VALUES (?, ?, ?)`,
        [studentId, courseId, gpa]
      );
    }

    query(
      `INSERT OR REPLACE INTO assignments (title, course_id, deadline, description, created_by)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      ['Landing Page Design', cse101.id, '2026-10-15 23:59:59', 'Design a responsive landing page.', instructor.id, 'ER Diagram', cse205.id, '2026-10-18 23:59:59', 'Create an ER diagram for the given scenario.', instructor.id]
    );

    const assignments = query('SELECT id, title FROM assignments');
    const landing = assignments.find((a) => a.title === 'Landing Page Design');
    const er = assignments.find((a) => a.title === 'ER Diagram');

    query(
      `INSERT OR REPLACE INTO submissions (assignment_id, student_id, status, comment, feedback, gpa, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)`,
      [landing.id, student.id, 'Submitted', 'Initial submission', 'Pending review', 0.00, new Date().toISOString(), er.id, student.id, 'Not Submitted', '', '-', 0.00, null]
    );

    query(
      `INSERT OR REPLACE INTO announcements (title, message, audience, created_by)
       VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
      ['Assignment Deadline Extended', 'The deadline has been extended by two days.', 'All Students', instructor.id, 'Extra Class Notice', 'An extra class will be held for Web Programming.', 'Web Programming', instructor.id]
    );

    query(
      `INSERT OR REPLACE INTO forum_posts (topic, message, author_id)
       VALUES (?, ?, ?), (?, ?, ?)`,
      ['Need help with flexbox layout', 'How do I center a card perfectly?', student.id, 'Database project guidance', 'Please review the ER diagram requirements.', instructor.id]
    );

    query(
      `INSERT OR REPLACE INTO attendance_records (course_id, student_id, attendance_date, status, marked_by)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [cse101.id, student.id, '2026-04-10', 'Present', instructor.id, cse101.id, student.id, '2026-04-11', 'Present', instructor.id, cse205.id, student.id, '2026-04-12', 'Absent', instructor.id]
    );

    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seed error:', error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

seed();
