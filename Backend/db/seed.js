require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../src/config/db');

async function seed() {
  // Optional demo seeding: only run when SEED_DEMO=true to avoid creating default accounts
  const doSeed = String(process.env.SEED_DEMO || '').toLowerCase();
  if (!(doSeed === '1' || doSeed === 'true' || doSeed === 'yes')) {
    console.log('SEED_DEMO not enabled; skipping demo data seeding. Set SEED_DEMO=true to run seeds.');
    await pool.end();
    return;
  }
  const studentHash = await bcrypt.hash('123456', 10);
  const instructorHash = await bcrypt.hash('123456', 10);

  await query(
    `INSERT INTO users (name, email, user_code, role, password_hash)
     VALUES
     ('Joy E', 'student@uni.edu', '2023001', 'Student', ?),
     ('Ms. Nabila', 'instructor@uni.edu', 'FAC101', 'Instructor', ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [studentHash, instructorHash]
  );

  const users = await query('SELECT id, role, name, user_code FROM users');
  const student = users.find((u) => u.role === 'Student' && u.user_code === '2023001');
  const instructor = users.find((u) => u.role === 'Instructor' && u.user_code === 'FAC101');

  if (!student || !instructor) {
    throw new Error('Seed users not found after insert.');
  }

  await query(
    `INSERT INTO student_profiles (user_id, department)
     VALUES (?, 'CSE')
     ON DUPLICATE KEY UPDATE department = VALUES(department)`,
    [student.id]
  );

  await query(
    `INSERT INTO courses (code, title, section, instructor_id, credit)
     VALUES
     ('CSE-101', 'Web Programming', 'A', ?, 3.0),
     ('CSE-205', 'Database Systems', 'A', ?, 3.0),
     ('ENG-103', 'Basic English', 'B', ?, 1.0)
     ON DUPLICATE KEY UPDATE title = VALUES(title), instructor_id = VALUES(instructor_id), credit = VALUES(credit)`,
    [instructor.id, instructor.id, instructor.id]
  );

  const courses = await query('SELECT id, code FROM courses');
  const cse101 = courses.find((c) => c.code === 'CSE-101');
  const cse205 = courses.find((c) => c.code === 'CSE-205');
  const eng103 = courses.find((c) => c.code === 'ENG-103');

  const enrollments = [
    [student.id, cse101.id, 3.75],
    [student.id, cse205.id, 3.5],
    [student.id, eng103.id, 4.0]
  ];

  for (const [studentId, courseId, gpa] of enrollments) {
    await query(
      `INSERT INTO course_enrollments (student_id, course_id, gpa)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE gpa = VALUES(gpa)`,
      [studentId, courseId, gpa]
    );
  }

  await query(
    `INSERT INTO assignments (title, course_id, deadline, description, created_by)
     VALUES
     ('Landing Page Design', ?, '2026-10-15 23:59:59', 'Design a responsive landing page.', ?),
     ('ER Diagram', ?, '2026-10-18 23:59:59', 'Create an ER diagram for the given scenario.', ?)
     ON DUPLICATE KEY UPDATE description = VALUES(description)`,
    [cse101.id, instructor.id, cse205.id, instructor.id]
  );

  const assignments = await query('SELECT id, title FROM assignments');
  const landing = assignments.find((a) => a.title === 'Landing Page Design');
  const er = assignments.find((a) => a.title === 'ER Diagram');

  await query(
    `INSERT INTO submissions (assignment_id, student_id, status, comment, feedback, gpa, submitted_at)
     VALUES
     (?, ?, 'Submitted', 'Initial submission', 'Pending review', 0.00, NOW()),
     (?, ?, 'Not Submitted', '', '-', 0.00, NULL)
     ON DUPLICATE KEY UPDATE status = VALUES(status), feedback = VALUES(feedback), comment = VALUES(comment)`,
    [landing.id, student.id, er.id, student.id]
  );

  await query(
    `INSERT INTO announcements (title, message, audience, created_by)
     VALUES
     ('Assignment Deadline Extended', 'The deadline has been extended by two days.', 'All Students', ?),
     ('Extra Class Notice', 'An extra class will be held for Web Programming.', 'Web Programming', ?)
     ON DUPLICATE KEY UPDATE message = VALUES(message), audience = VALUES(audience)`,
    [instructor.id, instructor.id]
  );

  await query(
    `INSERT INTO forum_posts (topic, message, author_id)
     VALUES
     ('Need help with flexbox layout', 'How do I center a card perfectly?', ?),
     ('Database project guidance', 'Please review the ER diagram requirements.', ?)
     ON DUPLICATE KEY UPDATE message = VALUES(message)`,
    [student.id, instructor.id]
  );

  await query(
    `INSERT INTO attendance_records (course_id, student_id, attendance_date, status, marked_by)
     VALUES
     (?, ?, '2026-04-10', 'Present', ?),
     (?, ?, '2026-04-11', 'Present', ?),
     (?, ?, '2026-04-12', 'Absent', ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)`,
    [cse101.id, student.id, instructor.id, cse101.id, student.id, instructor.id, cse205.id, student.id, instructor.id]
  );

  console.log('Seed completed successfully.');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
