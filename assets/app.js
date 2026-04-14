(function () {
  const path = location.pathname.split('/').pop() || 'index.html';

  const STORAGE_KEYS = {
    users: 'ump_users',
    session: 'ump_session',
    announcements: 'ump_announcements',
    assignments: 'ump_assignments',
    submissions: 'ump_submissions',
    forum: 'ump_forum',
    attendance: 'ump_attendance',
    courses: 'ump_courses',
    students: 'ump_students'
  };

  const defaults = {
    users: [
      { name: 'Joy E', email: 'student@uni.edu', id: '2023001', role: 'Student', password: '123456' },
      { name: 'Ms. Nabila', email: 'instructor@uni.edu', id: 'FAC101', role: 'Instructor', password: '123456' }
    ],
    announcements: [
      { title: 'Assignment Deadline Extended', message: 'The deadline has been extended by two days.', date: '10 Oct 2026', audience: 'All Students', authorRole: 'Instructor' },
      { title: 'Extra Class Notice', message: 'An extra class will be held for Web Programming.', date: '08 Oct 2026', audience: 'Web Programming', authorRole: 'Instructor' }
    ],
    assignments: [
      { title: 'Landing Page Design', course: 'Web Programming', courseCode: 'CSE-101', deadline: '2026-10-15', description: 'Design a responsive landing page.' },
      { title: 'ER Diagram', course: 'Database Systems', courseCode: 'CSE-205', deadline: '2026-10-18', description: 'Create an ER diagram for the given scenario.' }
    ],
    submissions: [
      { assignment: 'Landing Page Design', courseCode: 'CSE-101', studentName: 'Joy E', status: 'Submitted', feedback: 'Pending', gpa: '' },
      { assignment: 'ER Diagram', courseCode: 'CSE-205', studentName: 'Joy E', status: 'Not Submitted', feedback: '-', gpa: '' }
    ],
    forum: [
      { topic: 'Need help with flexbox layout', message: 'How do I center a card perfectly?', author: 'Joy E', role: 'Student', date: '12 Apr 2026' },
      { topic: 'Database project guidance', message: 'Please review the ER diagram requirements.', author: 'Ms. Nabila', role: 'Instructor', date: '11 Apr 2026' }
    ],
    attendance: [
      { name: 'Joy E', id: '2023001', status: 'Present' },
      { name: 'Nadia Islam', id: '2023002', status: 'Present' },
      { name: 'Rafi Hasan', id: '2023003', status: 'Absent' }
    ],
    courses: [
      { code: 'CSE-101', title: 'Web Programming', section: 'A', instructor: 'Ms. Nabila', credit: '3 Cr', gpa: '3.75' },
      { code: 'CSE-205', title: 'Database Systems', section: 'A', instructor: 'Ms. Nabila', credit: '3 Cr', gpa: '3.50' },
      { code: 'ENG-103', title: 'Basic English', section: 'B', instructor: 'Mr. Rahman', credit: '1 Cr', gpa: '4.00' }
    ],
    students: [
      { name: 'Joy E', id: '2023001', email: 'student@uni.edu', department: 'CSE' },
      { name: 'Nadia Islam', id: '2023002', email: 'nadia@uni.edu', department: 'CSE' },
      { name: 'Rafi Hasan', id: '2023003', email: 'rafi@uni.edu', department: 'CSE' }
    ]
  };

  function initStore() {
    Object.entries(defaults).forEach(([key, value]) => {
      const storageKey = STORAGE_KEYS[key];
      if (storageKey && !localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
    });
  }

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS[key])) || [];
    } catch (e) {
      return Array.isArray(defaults[key]) ? [...defaults[key]] : null;
    }
  }

  function write(key, value) {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.session)) || null;
    } catch (e) {
      return null;
    }
  }

  function setSession(user) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  function pageRole() {
    if (path.startsWith('student-')) return 'Student';
    if (path.startsWith('instructor-')) return 'Instructor';
    return null;
  }

  function showMessage(message, ok) {
    let box = document.getElementById('app-toast-message');
    if (!box) {
      box = document.createElement('div');
      box.id = 'app-toast-message';
      box.style.position = 'fixed';
      box.style.right = '20px';
      box.style.bottom = '20px';
      box.style.zIndex = '9999';
      box.style.padding = '12px 16px';
      box.style.borderRadius = '10px';
      box.style.color = '#fff';
      box.style.fontFamily = 'Arial, sans-serif';
      box.style.fontSize = '14px';
      box.style.boxShadow = '0 10px 25px rgba(0,0,0,.15)';
      document.body.appendChild(box);
    }
    box.style.background = ok ? '#1f8f4d' : '#c0392b';
    box.textContent = message;
    box.style.display = 'block';
    clearTimeout(box._timer);
    box._timer = setTimeout(() => { box.style.display = 'none'; }, 2500);
  }

  function formatDate(isoDate) {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function setText(selector, value, all) {
    if (all) return qsa(selector).forEach((el) => { el.textContent = value; });
    const el = qs(selector);
    if (el) el.textContent = value;
  }

  function requireAuth() {
    const requiredRole = pageRole();
    if (!requiredRole) return;
    const session = getSession();
    if (!session) {
      location.href = 'index.html';
      return;
    }
    if (session.role !== requiredRole) {
      location.href = session.role === 'Instructor' ? 'instructor-dashboard.html' : 'student-dashboard.html';
      return;
    }
    hydrateUser(session);
  }

  function hydrateUser(session) {
    qsa('.user-box span:first-child').forEach((el) => { el.textContent = session.name; });
    qsa('.role-tag').forEach((el) => { el.textContent = session.role; });
  }

  function wireLogout() {
    qsa('a').forEach((a) => {
      if (a.textContent.trim().toLowerCase() === 'logout') {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          clearSession();
          showMessage('Logged out successfully.', true);
          setTimeout(() => { location.href = 'index.html'; }, 250);
        });
      }
    });
  }

  function wireLogin() {
    if (path !== 'index.html') return;
<<<<<<< HEAD
    const emailInput = qs('input[type="email"]');
    const passInput = qs('input[type="password"]');
    const studentBtn = qsa('.btn-row .btn')[0];
    const instructorBtn = qsa('.btn-row .btn')[1];

    function doLogin(role) {
      const email = (emailInput.value || '').trim().toLowerCase();
      const password = (passInput.value || '').trim();
      const users = read('users');
      const user = users.find((u) => u.email.toLowerCase() === email && u.password === password && u.role === role);

      if (!email || !password) return showMessage('Enter email and password.', false);
      if (!user) return showMessage('Invalid credentials for ' + role + '.', false);

      setSession(user);
      showMessage('Login successful.', true);
      location.href = role === 'Student' ? 'student-dashboard.html' : 'instructor-dashboard.html';
    }

    if (studentBtn) studentBtn.addEventListener('click', (e) => { e.preventDefault(); doLogin('Student'); });
    if (instructorBtn) instructorBtn.addEventListener('click', (e) => { e.preventDefault(); doLogin('Instructor'); });
=======
    const rolePanel = qs('#role-choice-panel');
    const loginPanel = qs('#login-panel');
    const roleButtons = qsa('[data-role]');
    const backBtn = qs('#back-to-role');
    const loginBtn = qs('#login-submit');
    const emailInput = qs('#login-email');
    const passInput = qs('#login-password');
    const selectedRolePill = qs('#selected-role-pill');
    const loginRoleLabel = qs('#login-role-label');
    let activeRole = '';

    function showRoleStep() {
      activeRole = '';
      roleButtons.forEach((btn) => btn.classList.remove('active'));
      if (rolePanel) rolePanel.classList.remove('hidden-panel');
      if (loginPanel) loginPanel.classList.add('hidden-panel');
      if (emailInput) emailInput.value = '';
      if (passInput) passInput.value = '';
    }

    function showLoginStep(role) {
      activeRole = role;
      roleButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.role === role));
      if (rolePanel) rolePanel.classList.add('hidden-panel');
      if (loginPanel) loginPanel.classList.remove('hidden-panel');
      if (selectedRolePill) selectedRolePill.textContent = role + ' Portal';
      if (loginRoleLabel) loginRoleLabel.textContent = role + ' Email Address';
      if (emailInput) {
        emailInput.placeholder = 'Enter your email';
        emailInput.focus();
      }
    }

    function doLogin() {
      const email = (emailInput && emailInput.value || '').trim().toLowerCase();
      const password = (passInput && passInput.value || '').trim();
      const users = read('users');
      const user = users.find((u) => u.email.toLowerCase() === email && u.password === password && u.role === activeRole);

      if (!activeRole) return showMessage('Select Student or Instructor first.', false);
      if (!email || !password) return showMessage('Enter email and password.', false);
      if (!user) return showMessage('Invalid credentials for ' + activeRole + '.', false);

      setSession(user);
      showMessage('Login successful.', true);
      location.href = activeRole === 'Student' ? 'student-dashboard.html' : 'instructor-dashboard.html';
    }

    roleButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        showLoginStep(btn.dataset.role);
      });
    });

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        showRoleStep();
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        doLogin();
      });
    }

    [emailInput, passInput].forEach((input) => {
      if (input) {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            doLogin();
          }
        });
      }
    });

    showRoleStep();
>>>>>>> e41daee (ui update and js added)
  }

  function wireRegister() {
    if (path !== 'register.html') return;
    const inputs = qsa('.form-box input');
    const roleSelect = qs('.form-box select');
    const createBtn = qs('.btn-row .btn');
    if (!createBtn || inputs.length < 5) return;

    createBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const [nameInput, emailInput, idInput, passInput, confirmInput] = inputs;
      const name = nameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const id = idInput.value.trim();
      const role = roleSelect.value.trim();
      const password = passInput.value.trim();
      const confirm = confirmInput.value.trim();
      const users = read('users');

      if (!name || !email || !id || !password || !confirm) return showMessage('Please fill in all fields.', false);
      if (password.length < 6) return showMessage('Password must be at least 6 characters.', false);
      if (password !== confirm) return showMessage('Passwords do not match.', false);
      if (users.some((u) => u.email.toLowerCase() === email)) return showMessage('This email is already registered.', false);

      const user = { name, email, id, role, password };
      users.push(user);
      write('users', users);
      if (role === 'Student') {
        const students = read('students');
        students.push({ name, id, email, department: 'General' });
        write('students', students);
      }
      showMessage('Account created. Redirecting to login...', true);
      setTimeout(() => { location.href = 'index.html'; }, 500);
    });
  }

  function renderAnnouncements() {
    if (!path.includes('announcements')) return;
    const announcements = read('announcements');
    const tables = qsa('table');
    const table = tables[tables.length - 1];
    if (!table) return;

    const tbody = announcements.map((item) => (
      `<tr><td>${item.title}</td><td>${item.date}</td><td>${item.audience || item.authorRole || '-'}</td></tr>`
    )).join('');
    table.innerHTML = `<tr><th>Title</th><th>Date</th><th>Audience</th></tr>${tbody}`;

    if (path.startsWith('instructor-')) {
      const [titleInput, messageInput] = qsa('.card input, .card textarea').filter((el) => !el.closest('table'));
      const btn = qsa('.btn').find((el) => /post announcement/i.test(el.textContent));
      if (btn && titleInput && messageInput) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const title = titleInput.value.trim();
          const message = messageInput.value.trim();
          if (!title || !message) return showMessage('Add title and message.', false);
          announcements.unshift({ title, message, date: formatDate(new Date().toISOString()), audience: 'All Students', authorRole: 'Instructor' });
          write('announcements', announcements);
          titleInput.value = '';
          messageInput.value = '';
          renderAnnouncements();
          showMessage('Announcement posted.', true);
        }, { once: true });
      }
    }
  }

  function renderAssignments() {
    if (!(path.includes('assignment') || path.includes('submissions'))) return;
    const assignments = read('assignments');

    if (path === 'instructor-create-assignment.html') {
      const titleInput = qsa('.card input[type="text"]')[0];
      const courseSelect = qsa('.card select')[0];
      const dateInput = qsa('.card input[type="date"]')[0];
      const descInput = qsa('.card textarea')[0];
      const btn = qsa('.btn').find((el) => /publish assignment/i.test(el.textContent));
      const table = qsa('table')[0];
      if (table) {
        table.innerHTML = `<tr><th>Title</th><th>Course</th><th>Deadline</th></tr>` + assignments.map((a) => `
          <tr><td>${a.title}</td><td>${a.course}</td><td>${formatDate(a.deadline)}</td></tr>`).join('');
      }
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const title = titleInput.value.trim();
          const course = courseSelect.value.trim();
          const deadline = dateInput.value;
          const description = descInput.value.trim();
          if (!title || !course || !deadline || !description) return showMessage('Complete all assignment fields.', false);
          assignments.unshift({ title, course, courseCode: course === 'Database Systems' ? 'CSE-205' : 'CSE-101', deadline, description });
          write('assignments', assignments);
          titleInput.value = '';
          dateInput.value = '';
          descInput.value = '';
          renderAssignments();
          populateStudentSubmissionDefaults();
          showMessage('Assignment published.', true);
        }, { once: true });
      }
    }

    if (path === 'student-assignments.html') {
      const table = qsa('table')[0];
      const select = qsa('select')[0];
      const fileInput = qsa('input[type="file"]')[0];
      const comment = qsa('textarea')[0];
      const btn = qsa('.btn').find((el) => /submit assignment/i.test(el.textContent));
      const statusTable = qsa('table')[1];
      const session = getSession();
      const submissions = read('submissions');

      if (table) {
        table.innerHTML = `<tr><th>Title</th><th>Course Code</th><th>Deadline</th></tr>` + assignments.map((a) => `
          <tr><td>${a.title}</td><td>${a.courseCode}</td><td>${formatDate(a.deadline)}</td></tr>`).join('');
      }
      if (select) {
        select.innerHTML = assignments.map((a) => `<option>${a.title}</option>`).join('');
      }
      if (statusTable && session) {
        const mySubs = submissions.filter((s) => s.studentName === session.name);
        statusTable.innerHTML = `<tr><th>Assignment</th><th>Course Code</th><th>Status</th><th>Feedback</th></tr>` + mySubs.map((s) => `
          <tr><td>${s.assignment}</td><td>${s.courseCode}</td><td><span class="badge${s.status === 'Submitted' ? '' : ' blue'}">${s.status}</span></td><td>${s.feedback}</td></tr>`).join('');
      }
      if (btn && session) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const selected = select.value;
          const found = assignments.find((a) => a.title === selected);
          const submissionsNow = read('submissions');
          const row = submissionsNow.find((s) => s.studentName === session.name && s.assignment === selected);
          if (!selected || !found) return showMessage('Select an assignment.', false);
          if (!fileInput.value) return showMessage('Choose a file to submit.', false);
          if (row) {
            row.status = 'Submitted';
            row.feedback = comment.value.trim() || 'Pending review';
          } else {
            submissionsNow.push({ assignment: selected, courseCode: found.courseCode, studentName: session.name, status: 'Submitted', feedback: comment.value.trim() || 'Pending review', gpa: '' });
          }
          write('submissions', submissionsNow);
          comment.value = '';
          fileInput.value = '';
          renderAssignments();
          showMessage('Assignment submitted.', true);
        }, { once: true });
      }
    }

    if (path === 'instructor-submissions.html') {
      const subs = read('submissions');
      const table = qsa('table')[0];
      if (table) {
        table.innerHTML = `<tr><th>Student</th><th>Assignment</th><th>Course</th><th>Status</th><th>Feedback</th></tr>` + subs.map((s) => `
          <tr><td>${s.studentName}</td><td>${s.assignment}</td><td>${s.courseCode}</td><td>${s.status}</td><td>${s.feedback}</td></tr>`).join('');
      }
      const inputs = qsa('input[type="text"]');
      const select = qsa('select')[0];
      const feedback = qsa('textarea')[0];
      const btn = qsa('.btn').find((el) => /save/i.test(el.textContent) || /submit/i.test(el.textContent) || /update/i.test(el.textContent));
      if (btn && inputs.length >= 3 && select && feedback) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const studentName = inputs[0].value.trim();
          const courseCode = inputs[1].value.trim();
          const status = select.value.trim();
          const gpa = inputs[2].value.trim();
          const note = feedback.value.trim();
          if (!studentName || !courseCode) return showMessage('Enter student and course.', false);
          const row = subs.find((s) => s.studentName.toLowerCase() === studentName.toLowerCase() && s.courseCode.toLowerCase() === courseCode.toLowerCase());
          if (!row) return showMessage('No matching submission found.', false);
          row.status = status;
          row.feedback = note || row.feedback;
          row.gpa = gpa || row.gpa;
          write('submissions', subs);
          renderAssignments();
          showMessage('Submission updated.', true);
        }, { once: true });
      }
    }
  }

  function populateStudentSubmissionDefaults() {
    const assignments = read('assignments');
    const users = read('users').filter((u) => u.role === 'Student');
    const existing = read('submissions');
    users.forEach((u) => {
      assignments.forEach((a) => {
        if (!existing.some((s) => s.studentName === u.name && s.assignment === a.title)) {
          existing.push({ assignment: a.title, courseCode: a.courseCode, studentName: u.name, status: 'Not Submitted', feedback: '-', gpa: '' });
        }
      });
    });
    write('submissions', existing);
  }

  function renderForum() {
    if (!path.includes('forum')) return;
    const posts = read('forum');
    let displayCard = qsa('.card').find((c) => /discussion|recent|topics|forum/i.test(c.textContent));
    if (!displayCard) displayCard = qsa('.card')[qsa('.card').length - 1];

    if (displayCard) {
      const listHtml = posts.map((p) => `
        <div style="padding:12px 0;border-bottom:1px solid #e7e7e7;">
          <strong>${p.topic}</strong>
          <p style="margin:6px 0;">${p.message}</p>
          <small>${p.author} • ${p.role} • ${p.date}</small>
        </div>`).join('');
      if (!/Recent Discussions|Forum Topics|Discussion Board/i.test(displayCard.innerHTML)) {
        displayCard.innerHTML += `<h2 style="margin-top:20px;">Recent Discussions</h2>${listHtml}`;
      } else {
        const heading = displayCard.querySelector('h2') ? displayCard.querySelector('h2').outerHTML : '<h2>Recent Discussions</h2>';
        displayCard.innerHTML = `${heading}${listHtml}`;
      }
    }

    const topicInput = qsa('input[type="text"]')[0];
    const messageInput = qsa('textarea')[0];
    const btn = qsa('.btn').find((el) => /post|ask|publish|create/i.test(el.textContent));
    const session = getSession();
    if (btn && topicInput && messageInput && session) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const topic = topicInput.value.trim();
        const message = messageInput.value.trim();
        if (!topic || !message) return showMessage('Enter topic and message.', false);
        posts.unshift({ topic, message, author: session.name, role: session.role, date: formatDate(new Date().toISOString()) });
        write('forum', posts);
        topicInput.value = '';
        messageInput.value = '';
        renderForum();
        showMessage('Discussion posted.', true);
      }, { once: true });
    }
  }

  function renderAttendance() {
    if (!path.includes('attendance')) return;
    const attendance = read('attendance');
    const session = getSession();
    const table = qsa('table')[0];

    if (path === 'student-attendance.html' && table && session) {
      const mine = attendance.find((a) => a.name === session.name) || { status: 'Present' };
      table.innerHTML = `<tr><th>Student</th><th>ID</th><th>Status</th></tr><tr><td>${session.name}</td><td>${session.id || '-'}</td><td><span class="badge${mine.status === 'Present' ? '' : ' blue'}">${mine.status}</span></td></tr>`;
    }

    if (path === 'instructor-attendance.html' || path === 'attendance.html') {
      if (table) {
        table.innerHTML = `<tr><th>Name</th><th>ID</th><th>Status</th></tr>` + attendance.map((a) => `
          <tr><td>${a.name}</td><td>${a.id}</td><td><select><option ${a.status === 'Present' ? 'selected' : ''}>Present</option><option ${a.status === 'Absent' ? 'selected' : ''}>Absent</option></select></td></tr>`).join('');
      }
      const saveBtn = qsa('.btn').find((el) => /save|update/i.test(el.textContent));
      if (saveBtn && table) {
        saveBtn.addEventListener('click', function (e) {
          e.preventDefault();
          const rows = qsa('tr', table).slice(1);
          const updated = rows.map((row, index) => ({
            name: row.children[0].textContent.trim(),
            id: row.children[1].textContent.trim(),
            status: row.querySelector('select').value
          }));
          write('attendance', updated);
          showMessage('Attendance saved.', true);
        });
      }
      if (!saveBtn && table) {
        const wrapper = table.closest('.card') || document.body;
        const action = document.createElement('div');
        action.className = 'btn-row';
        action.innerHTML = '<a href="#" class="btn small-btn">Save Attendance</a>';
        wrapper.appendChild(action);
        action.querySelector('a').addEventListener('click', function (e) {
          e.preventDefault();
          const rows = qsa('tr', table).slice(1);
          const updated = rows.map((row) => ({
            name: row.children[0].textContent.trim(),
            id: row.children[1].textContent.trim(),
            status: row.querySelector('select').value
          }));
          write('attendance', updated);
          showMessage('Attendance saved.', true);
        });
      }
    }
  }

  function renderCourses() {
    if (!(path.includes('courses') || path === 'student-dashboard.html' || path === 'instructor-dashboard.html')) return;
    const courses = read('courses');
    if (path === 'student-courses.html') {
      const table = qsa('table')[0];
      if (table) {
        table.innerHTML = `<tr><th>Course Code</th><th>Course Title</th><th>Credit</th><th>Instructor</th></tr>` + courses.map((c) => `
          <tr><td>${c.code}</td><td>${c.title}</td><td>${c.credit}</td><td>${c.instructor}</td></tr>`).join('');
      }
    }
    if (path === 'instructor-courses.html') {
      const table = qsa('table')[0];
      if (table) {
        table.innerHTML = `<tr><th>Course Code</th><th>Course Title</th><th>Section</th><th>Instructor</th></tr>` + courses.map((c) => `
          <tr><td>${c.code}</td><td>${c.title}</td><td>${c.section}</td><td>${c.instructor}</td></tr>`).join('');
      }
      const inputs = qsa('input[type="text"]');
      const btn = qsa('.btn').find((el) => /add|create|save/i.test(el.textContent));
      if (btn && inputs.length >= 4) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const [codeInput, titleInput, sectionInput, instructorInput] = inputs;
          const item = {
            code: codeInput.value.trim(),
            title: titleInput.value.trim(),
            section: sectionInput.value.trim(),
            instructor: instructorInput.value.trim(),
            credit: '3 Cr',
            gpa: '0.00'
          };
          if (!item.code || !item.title || !item.section || !item.instructor) return showMessage('Complete course details.', false);
          courses.unshift(item);
          write('courses', courses);
          inputs.forEach((i) => { i.value = ''; });
          renderCourses();
          showMessage('Course added.', true);
        }, { once: true });
      }
    }
    if (path === 'student-dashboard.html') {
      const currentCourses = courses.slice(0, 3);
      const table = qsa('table')[0];
      if (table) {
        table.innerHTML = `<tr><th>Course Code</th><th>Credit</th><th>GPA</th></tr>` + currentCourses.map((c) => `
          <tr><td>${c.code}</td><td>${c.credit}</td><td>${c.gpa}</td></tr>`).join('');
      }
      const statCards = qsa('.stat-card p');
      if (statCards[0]) statCards[0].textContent = String(courses.length);
    }
  }

  function renderStudents() {
    if (!(path.includes('students') || path.includes('reports'))) return;
    const students = read('students');
    if (path === 'instructor-students.html' || path === 'students.html') {
      const table = qsa('table')[0];
      if (table) {
        table.innerHTML = `<tr><th>Name</th><th>ID</th><th>Email</th><th>Department</th></tr>` + students.map((s) => `
          <tr><td>${s.name}</td><td>${s.id}</td><td>${s.email}</td><td>${s.department}</td></tr>`).join('');
      }
    }
    if (path === 'instructor-reports.html') {
      const select = qs('#studentSelect');
      if (select) {
        select.innerHTML = students.map((s, idx) => `<option value="student_report_${idx}">${s.name}</option>`).join('');
      }
      const host = qsa('.student-report');
      host.forEach((el) => el.remove());
      const container = qs('.main-area');
      if (container) {
        students.forEach((s, idx) => {
          const studentSubs = read('submissions').filter((sub) => sub.studentName === s.name);
          const avg = studentSubs.length ? (studentSubs.reduce((acc, sub) => acc + (parseFloat(sub.gpa) || 0), 0) / studentSubs.length).toFixed(2) : '0.00';
          const attendance = read('attendance').find((a) => a.name === s.name);
          const rate = attendance ? (attendance.status === 'Present' ? '100%' : '0%') : '0%';
          const submitted = studentSubs.filter((sub) => sub.status === 'Submitted').length;
          const subRate = studentSubs.length ? Math.round((submitted / studentSubs.length) * 100) + '%' : '0%';
          const report = document.createElement('div');
          report.id = `student_report_${idx}`;
          report.className = 'student-report';
          report.style.display = idx === 0 ? 'block' : 'none';
          report.innerHTML = `
            <div class="cards-row">
              <div class="card stat-card"><h3>Average GPA</h3><p>${avg}</p></div>
              <div class="card stat-card"><h3>Attendance Rate</h3><p>${rate}</p></div>
              <div class="card stat-card"><h3>Submission Rate</h3><p>${subRate}</p></div>
            </div>
            <div class="two-col">
              <div class="card">
                <h2>Student GPA Report</h2>
                <table>
                  <tr><th>Assignment</th><th>Course Code</th><th>Status</th><th>GPA</th></tr>
                  ${studentSubs.map((sub) => `<tr><td>${sub.assignment}</td><td>${sub.courseCode}</td><td>${sub.status}</td><td>${sub.gpa || '-'}</td></tr>`).join('') || '<tr><td colspan="4">No data available</td></tr>'}
                </table>
              </div>
              <div class="card">
                <h2>Academic Summary</h2>
                <ul class="info-list">
                  <li>Student name: ${s.name}</li>
                  <li>Student ID: ${s.id}</li>
                  <li>Department: ${s.department}</li>
                  <li>Total assignments: ${studentSubs.length}</li>
                  <li>Submitted assignments: ${submitted}</li>
                </ul>
              </div>
            </div>`;
          container.appendChild(report);
        });
        if (select) {
          select.onchange = function () {
            qsa('.student-report').forEach((r) => { r.style.display = 'none'; });
            const chosen = qs('#' + select.value);
            if (chosen) chosen.style.display = 'block';
          };
          select.dispatchEvent(new Event('change'));
        }
      }
    }
  }

<<<<<<< HEAD
=======

  function pageMeta() {
    const session = getSession();
    const role = pageRole() || (path.includes('instructor') ? 'Instructor' : (path.includes('student') ? 'Student' : 'Portal'));
    const name = session && session.name ? session.name : 'University Portal';
    return { session, role, name };
  }

  function enhanceSidebar() {
    const sidebar = qs('.sidebar');
    if (!sidebar || sidebar.dataset.enhanced === '1') return;
    sidebar.dataset.enhanced = '1';

    const sideHead = qs('.side-head', sidebar);
    if (sideHead && !qs('.nav-section-label', sidebar)) {
      const label = document.createElement('div');
      label.className = 'nav-section-label';
      label.textContent = 'Navigation';
      sideHead.insertAdjacentElement('afterend', label);
    }

    const links = qsa('a', sidebar);
    const logout = links.find((link) => link.textContent.trim().toLowerCase() === 'logout');
    if (logout) sidebar.appendChild(logout);

    if (!qs('.sidebar-footer', sidebar)) {
      const footer = document.createElement('div');
      footer.className = 'sidebar-footer';
      footer.innerHTML = '<strong>Portal system</strong><div class="status-line">Online and ready</div>';
      sidebar.appendChild(footer);
    }
  }

  function enhanceTopbar() {
    const { session, role } = pageMeta();
    qsa('.topbar').forEach((bar) => {
      if (bar.dataset.enhanced === '1') return;
      bar.dataset.enhanced = '1';
      const titleBox = bar.children[0];
      const userBox = bar.children[1];
      if (titleBox && !qs('.page-kicker', titleBox)) {
        const kicker = document.createElement('div');
        kicker.className = 'page-kicker';
        kicker.textContent = role === 'Portal' ? 'University workspace' : role + ' workspace';
        titleBox.insertBefore(kicker, titleBox.firstChild);
      }
      if (titleBox && !qs('.topbar-actions', titleBox)) {
        const actions = document.createElement('div');
        actions.className = 'topbar-actions';
        actions.innerHTML = '<span class="meta-chip">Professional UI</span><span class="meta-chip">Responsive layout</span>';
        titleBox.appendChild(actions);
      }
      if (userBox && !qs('small', userBox)) {
        const note = document.createElement('small');
        const idText = session && session.id ? 'ID: ' + session.id : 'Session active';
        note.textContent = idText;
        userBox.appendChild(note);
      }
    });
  }

  function iconForCard(title) {
    const text = (title || '').toLowerCase();
    if (text.includes('course')) return '📘';
    if (text.includes('student')) return '👥';
    if (text.includes('assignment')) return '📝';
    if (text.includes('attendance')) return '📍';
    if (text.includes('gpa') || text.includes('cgpa')) return '📈';
    if (text.includes('submission')) return '📤';
    if (text.includes('announcement')) return '📣';
    if (text.includes('report')) return '📊';
    return '✨';
  }

  function enhanceStatCards() {
    qsa('.stat-card').forEach((card) => {
      if (card.dataset.enhanced === '1') return;
      card.dataset.enhanced = '1';
      const heading = qs('h3', card);
      card.dataset.icon = iconForCard(heading ? heading.textContent : '');
      if (!qs('small', card)) {
        const sub = document.createElement('small');
        sub.textContent = 'Live front-end summary';
        card.appendChild(sub);
      }
    });
  }

  function enhanceTables() {
    qsa('table').forEach((table) => {
      if (table.parentElement && table.parentElement.classList.contains('table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function applyProfessionalUI() {
    document.body.classList.add('ui-professional');
    const role = pageRole();
    if (role) document.body.classList.add('role-' + role.toLowerCase());
    enhanceSidebar();
    enhanceTopbar();
    enhanceStatCards();
    enhanceTables();
  }

>>>>>>> e41daee (ui update and js added)
  function wireFallbackButtons() {
    qsa('a.btn[href="#"]').forEach((btn) => {
      if (!btn.dataset.boundFallback) {
        btn.dataset.boundFallback = '1';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
        });
      }
    });
  }

  initStore();
  populateStudentSubmissionDefaults();
  requireAuth();
  wireLogout();
  wireLogin();
  wireRegister();
  renderAnnouncements();
  renderAssignments();
  renderForum();
  renderAttendance();
  renderCourses();
  renderStudents();
<<<<<<< HEAD
=======
  applyProfessionalUI();
>>>>>>> e41daee (ui update and js added)
  wireFallbackButtons();
})();
