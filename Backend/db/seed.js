require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, close, client } = require('../src/config/db');

async function upsertUser(name, email, user_code, role, passwordHash) {
  const rows = await query('SELECT id FROM users WHERE email = ? OR user_code = ? LIMIT 1', [email.toLowerCase(), user_code]);
  if (rows.length) return rows[0].id;
  const result = await query(
    'INSERT INTO users (name, email, user_code, role, password_hash) VALUES (?, ?, ?, ?, ?)',
    [name, email.toLowerCase(), user_code, role, passwordHash]
  );
  return result[0].insertId;
}

async function ensureStudentProfile(userId, department) {
  const rows = await query('SELECT id FROM student_profiles WHERE user_id = ? LIMIT 1', [userId]);
  if (rows.length) return rows[0].id;
  const result = await query('INSERT INTO student_profiles (user_id, department) VALUES (?, ?)', [userId, department]);
  return result[0].insertId;
}

async function upsertCourse(code, title, section, instructorId, credit) {
  const rows = await query('SELECT id FROM courses WHERE code = ? AND section = ? LIMIT 1', [code, section]);
  if (rows.length) return rows[0].id;
  const result = await query('INSERT INTO courses (code, title, section, instructor_id, credit) VALUES (?, ?, ?, ?, ?)', [code, title, section, instructorId, credit]);
  return result[0].insertId;
}

async function upsertEnrollment(studentId, courseId, gpa) {
  const rows = await query('SELECT id FROM course_enrollments WHERE student_id = ? AND course_id = ? LIMIT 1', [studentId, courseId]);
  if (rows.length) return rows[0].id;
  const result = await query('INSERT INTO course_enrollments (student_id, course_id, gpa) VALUES (?, ?, ?)', [studentId, courseId, gpa]);
  return result[0].insertId;
}

async function upsertAssignment(title, courseId, deadline, description, createdBy) {
  const rows = await query('SELECT id FROM assignments WHERE title = ? AND course_id = ? LIMIT 1', [title, courseId]);
  if (rows.length) return rows[0].id;
  const result = await query('INSERT INTO assignments (title, course_id, deadline, description, created_by) VALUES (?, ?, ?, ?, ?)', [title, courseId, deadline, description, createdBy]);
  return result[0].insertId;
}

async function upsertSubmission(assignmentId, studentId, status, comment, feedback, gpa, submittedAt) {
  const rows = await query('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1', [assignmentId, studentId]);
  if (rows.length) {
    await query('UPDATE submissions SET status = ?, comment = ?, feedback = ?, gpa = ?, submitted_at = ? WHERE id = ?', [status, comment, feedback, gpa, submittedAt, rows[0].id]);
    return rows[0].id;
  }
  const result = await query('INSERT INTO submissions (assignment_id, student_id, status, comment, feedback, gpa, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [assignmentId, studentId, status, comment, feedback, gpa, submittedAt]);
  return result[0].insertId;
}

async function runSeed() {
  const doSeed = String(process.env.SEED_DEMO || '').toLowerCase();
  if (!(doSeed === '1' || doSeed === 'true' || doSeed === 'yes')) {
    console.log('SEED_DEMO not enabled; skipping demo data seeding. Set SEED_DEMO=true to run seeds.');
    try { await close(); } catch (_e) {}
    return;
  }

  try {
    const studentHash = bcrypt.hashSync('123456', 10);
    const instructorHash = bcrypt.hashSync('123456', 10);

    const studentId = await upsertUser('Joy E', 'student@uni.edu', '2023001', 'Student', studentHash);
    const instructorId = await upsertUser('Ms. Nabila', 'instructor@uni.edu', 'FAC101', 'Instructor', instructorHash);

    await ensureStudentProfile(studentId, 'CSE');

    const cse101 = await upsertCourse('CSE-101', 'Web Programming', 'A', instructorId, 3.0);
    const cse205 = await upsertCourse('CSE-205', 'Database Systems', 'A', instructorId, 3.0);
    const eng103 = await upsertCourse('ENG-103', 'Basic English', 'B', instructorId, 1.0);

    await upsertEnrollment(studentId, cse101, 3.75);
    await upsertEnrollment(studentId, cse205, 3.5);
    await upsertEnrollment(studentId, eng103, 4.0);

    const landingId = await upsertAssignment('Landing Page Design', cse101, '2026-10-15 23:59:59', 'Design a responsive landing page.', instructorId);
    const erId = await upsertAssignment('ER Diagram', cse205, '2026-10-18 23:59:59', 'Create an ER diagram for the given scenario.', instructorId);

    const now = new Date().toISOString();
    await upsertSubmission(landingId, studentId, 'Submitted', 'Initial submission', 'Pending review', 0.00, now);
    await upsertSubmission(erId, studentId, 'Not Submitted', '', '', 0.00, null);

    // announcements
    const annRows = await query('SELECT id FROM announcements WHERE title = ? LIMIT 1', ['Assignment Deadline Extended']);
    if (!annRows.length) {
      await query('INSERT INTO announcements (title, message, audience, created_by) VALUES (?, ?, ?, ?)', ['Assignment Deadline Extended', 'The deadline has been extended by two days.', 'All Students', instructorId]);
    }

    const extraAnn = await query('SELECT id FROM announcements WHERE title = ? LIMIT 1', ['Extra Class Notice']);
    if (!extraAnn.length) {
      await query('INSERT INTO announcements (title, message, audience, created_by) VALUES (?, ?, ?, ?)', ['Extra Class Notice', 'An extra class will be held for Web Programming.', 'Web Programming', instructorId]);
    }

    // forum posts
    const forumCheck = await query('SELECT id FROM forum_posts WHERE topic = ? LIMIT 1', ['Need help with flexbox layout']);
    if (!forumCheck.length) {
      await query('INSERT INTO forum_posts (topic, message, author_id) VALUES (?, ?, ?)', ['Need help with flexbox layout', 'How do I center a card perfectly?', studentId]);
    }

    const forumCheck2 = await query('SELECT id FROM forum_posts WHERE topic = ? LIMIT 1', ['Database project guidance']);
    if (!forumCheck2.length) {
      await query('INSERT INTO forum_posts (topic, message, author_id) VALUES (?, ?, ?)', ['Database project guidance', 'Please review the ER diagram requirements.', instructorId]);
    }

    // attendance
    const attCheck = await query('SELECT id FROM attendance_records WHERE course_id = ? AND student_id = ? AND attendance_date = ? LIMIT 1', [cse101, studentId, '2026-04-10']);
    if (!attCheck.length) {
      await query('INSERT INTO attendance_records (course_id, student_id, attendance_date, status, marked_by) VALUES (?, ?, ?, ?, ?)', [cse101, studentId, '2026-04-10', 'Present', instructorId]);
    }
    const attCheck2 = await query('SELECT id FROM attendance_records WHERE course_id = ? AND student_id = ? AND attendance_date = ? LIMIT 1', [cse101, studentId, '2026-04-11']);
    if (!attCheck2.length) {
      await query('INSERT INTO attendance_records (course_id, student_id, attendance_date, status, marked_by) VALUES (?, ?, ?, ?, ?)', [cse101, studentId, '2026-04-11', 'Present', instructorId]);
    }
    const attCheck3 = await query('SELECT id FROM attendance_records WHERE course_id = ? AND student_id = ? AND attendance_date = ? LIMIT 1', [cse205, studentId, '2026-04-12']);
    if (!attCheck3.length) {
      await query('INSERT INTO attendance_records (course_id, student_id, attendance_date, status, marked_by) VALUES (?, ?, ?, ?, ?)', [cse205, studentId, '2026-04-12', 'Absent', instructorId]);
    }

    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seed error:', error);
    process.exitCode = 1;
  } finally {
    try { await close(); } catch (_e) {}
  }
}

runSeed();
