(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  const STORAGE_KEYS = {
    token: 'ump_token',
    session: 'ump_session'
  };

  const API_BASE = (window.UMP_API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(input) {
    if (!input) return '-';
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return input;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
    box._timer = setTimeout(() => { box.style.display = 'none'; }, 2800);
  }

  function getToken() {
    return localStorage.getItem(STORAGE_KEYS.token) || '';
  }

  function setToken(token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
  }

  function clearToken() {
    localStorage.removeItem(STORAGE_KEYS.token);
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.session)) || null;
    } catch (_error) {
      return null;
    }
  }

  function setSession(user) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
    clearToken();
  }

  async function apiRequest(pathname, options) {
    const requestOptions = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, requestOptions.headers || {});
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const response = await fetch(API_BASE + pathname, {
      method: requestOptions.method || 'GET',
      headers,
      body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.message || 'Request failed.';
      if (response.status === 401) {
        clearSession();
      }
      throw new Error(message);
    }

    return payload;
  }

  function pageRole() {
    if (path.startsWith('student-')) return 'Student';
    if (path.startsWith('instructor-')) return 'Instructor';
    return null;
  }

  function hydrateUser(session) {
    qsa('.user-box span:first-child').forEach((el) => { el.textContent = session.name || '-'; });
    qsa('.role-tag').forEach((el) => { el.textContent = session.role || '-'; });
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
      if (loginRoleLabel) loginRoleLabel.textContent = role + ' Email or ID';
      if (emailInput) {
        emailInput.placeholder = 'Enter your email or ID';
        emailInput.focus();
      }
    }

    async function doLogin() {
      const identifier = (emailInput && emailInput.value || '').trim();
      const password = (passInput && passInput.value || '').trim();

      if (!activeRole) return showMessage('Select Student or Instructor first.', false);
      if (!identifier || !password) return showMessage('Enter email or ID and password.', false);

      try {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: { identifier, password, role: activeRole }
        });
        setToken(data.token);
        setSession(data.user);
        showMessage('Login successful.', true);
        location.href = data.user.role === 'Instructor' ? 'instructor-dashboard.html' : 'student-dashboard.html';
      } catch (error) {
        const demoHint = activeRole === 'Student'
          ? 'Try student@uni.edu / 123456'
          : 'Try instructor@uni.edu / 123456';
        showMessage((error.message || 'Login failed.') + ' ' + demoHint, false);
      }
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
  }

  function wireRegister() {
    if (path !== 'register.html') return;
    const inputs = qsa('.form-box input');
    const roleSelect = qs('.form-box select');
    const createBtn = qs('.btn-row .btn');
    if (!createBtn || inputs.length < 5) return;

    createBtn.onclick = async function (e) {
      e.preventDefault();
      const [nameInput, emailInput, idInput, passInput, confirmInput] = inputs;
      const name = nameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const id = idInput.value.trim();
      const role = roleSelect.value.trim();
      const password = passInput.value.trim();
      const confirm = confirmInput.value.trim();

      if (!name || !email || !id || !password || !confirm) return showMessage('Please fill in all fields.', false);
      if (password.length < 6) return showMessage('Password must be at least 6 characters.', false);
      if (password !== confirm) return showMessage('Passwords do not match.', false);

      try {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: { name, email, id, role, password, department: 'General' }
        });
        showMessage('Account created. Redirecting to login...', true);
        setTimeout(() => { location.href = 'index.html'; }, 500);
      } catch (error) {
        showMessage(error.message || 'Registration failed.', false);
      }
    };
  }

  async function renderAnnouncements() {
    if (!path.includes('announcements')) return;
    const tables = qsa('table');
    const table = tables[tables.length - 1];
    if (!table) return;

    try {
      const announcements = await apiRequest('/announcements');
      const body = announcements.map((item) => (
        '<tr><td>' + escapeHtml(item.title) + '</td><td>' + escapeHtml(formatDate(item.date)) + '</td><td>' + escapeHtml(item.audience || item.authorRole || '-') + '</td></tr>'
      )).join('');
      table.innerHTML = '<tr><th>Title</th><th>Date</th><th>Audience</th></tr>' + body;

      if (path.startsWith('instructor-')) {
        const titleInput = qsa('.card input')[0];
        const messageInput = qsa('.card textarea')[0];
        const btn = qsa('.btn').find((el) => /post announcement/i.test(el.textContent));
        if (btn && titleInput && messageInput) {
          btn.onclick = async function (e) {
            e.preventDefault();
            const title = titleInput.value.trim();
            const message = messageInput.value.trim();
            if (!title || !message) return showMessage('Add title and message.', false);
            await apiRequest('/announcements', { method: 'POST', body: { title, message, audience: 'All Students' } });
            titleInput.value = '';
            messageInput.value = '';
            await renderAnnouncements();
            showMessage('Announcement posted.', true);
          };
        }
      }
    } catch (error) {
      showMessage('Announcements failed to load: ' + error.message, false);
    }
  }

  async function renderAssignments() {
    if (!(path.includes('assignment') || path.includes('submissions'))) return;

    try {
      const assignments = await apiRequest('/assignments');

      if (path === 'instructor-create-assignment.html') {
        const titleInput = qsa('.card input[type="text"]')[0];
        const courseSelect = qsa('.card select')[0];
        const dateInput = qsa('.card input[type="date"]')[0];
        const descInput = qsa('.card textarea')[0];
        const btn = qsa('.btn').find((el) => /publish assignment/i.test(el.textContent));
        const table = qsa('table')[0];

        const courses = await apiRequest('/courses');
        if (courseSelect) {
          courseSelect.innerHTML = courses.map((c) => '<option value="' + c.id + '">' + escapeHtml(c.title + ' (' + c.code + ')') + '</option>').join('');
        }

        if (table) {
          table.innerHTML = '<tr><th>Title</th><th>Course</th><th>Deadline</th></tr>' + assignments.map((a) => (
            '<tr><td>' + escapeHtml(a.title) + '</td><td>' + escapeHtml(a.course) + '</td><td>' + escapeHtml(formatDate(a.deadline)) + '</td></tr>'
          )).join('');
        }

        if (btn && courseSelect) {
          btn.onclick = async function (e) {
            e.preventDefault();
            const title = titleInput.value.trim();
            const courseId = Number(courseSelect.value || 0);
            const deadline = dateInput.value;
            const description = descInput.value.trim();
            if (!title || !courseId || !deadline || !description) return showMessage('Complete all assignment fields.', false);
            await apiRequest('/assignments', { method: 'POST', body: { title, courseId, deadline, description } });
            titleInput.value = '';
            dateInput.value = '';
            descInput.value = '';
            await renderAssignments();
            showMessage('Assignment published.', true);
          };
        }
      }

      if (path === 'student-assignments.html') {
        const table = qsa('table')[0];
        const select = qsa('select')[0];
        const comment = qsa('textarea')[0];
        const fileInput = qsa('input[type="file"]')[0];
        const btn = qsa('.btn').find((el) => /submit assignment/i.test(el.textContent));
        const statusTable = qsa('table')[1];
        const submissions = await apiRequest('/submissions');

        if (table) {
          table.innerHTML = '<tr><th>Title</th><th>Course Code</th><th>Deadline</th></tr>' + assignments.map((a) => (
            '<tr><td>' + escapeHtml(a.title) + '</td><td>' + escapeHtml(a.courseCode) + '</td><td>' + escapeHtml(formatDate(a.deadline)) + '</td></tr>'
          )).join('');
        }

        if (select) {
          select.innerHTML = assignments.map((a) => '<option value="' + a.id + '">' + escapeHtml(a.title) + '</option>').join('');
        }

        if (statusTable) {
          statusTable.innerHTML = '<tr><th>Assignment</th><th>Course Code</th><th>Status</th><th>Feedback</th></tr>' + submissions.map((s) => (
            '<tr><td>' + escapeHtml(s.assignment) + '</td><td>' + escapeHtml(s.courseCode) + '</td><td><span class="badge' + (s.status === 'Submitted' ? '' : ' blue') + '">' + escapeHtml(s.status) + '</span></td><td>' + escapeHtml(s.feedback || '-') + '</td></tr>'
          )).join('');
        }

        if (btn && select) {
          btn.onclick = async function (e) {
            e.preventDefault();
            if (fileInput && !fileInput.value) return showMessage('Choose a file to submit.', false);
            await apiRequest('/submissions', {
              method: 'POST',
              body: { assignmentId: Number(select.value), comment: comment ? comment.value.trim() : '' }
            });
            if (comment) comment.value = '';
            if (fileInput) fileInput.value = '';
            await renderAssignments();
            showMessage('Assignment submitted.', true);
          };
        }
      }

      if (path === 'instructor-submissions.html') {
        const subs = await apiRequest('/submissions');
        const table = qsa('table')[0];
        if (table) {
          table.innerHTML = '<tr><th>Student</th><th>Assignment</th><th>Course</th><th>Status</th><th>Feedback</th></tr>' + subs.map((s) => (
            '<tr><td>' + escapeHtml(s.studentName) + '</td><td>' + escapeHtml(s.assignment) + '</td><td>' + escapeHtml(s.courseCode) + '</td><td>' + escapeHtml(s.status) + '</td><td>' + escapeHtml(s.feedback || '-') + '</td></tr>'
          )).join('');
        }

        const inputs = qsa('input[type="text"]');
        const statusSelect = qsa('select')[0];
        const feedback = qsa('textarea')[0];
        const btn = qsa('.btn').find((el) => /save|submit|update/i.test(el.textContent));
        if (btn && inputs.length >= 3 && statusSelect && feedback) {
          btn.onclick = async function (e) {
            e.preventDefault();
            const studentName = inputs[0].value.trim();
            const courseCode = inputs[1].value.trim().toLowerCase();
            const gpa = inputs[2].value.trim();
            const row = subs.find((s) => s.studentName.toLowerCase() === studentName.toLowerCase() && s.courseCode.toLowerCase() === courseCode);
            if (!row) return showMessage('No matching submission found.', false);
            await apiRequest('/submissions/' + row.id, {
              method: 'PATCH',
              body: {
                status: statusSelect.value.trim(),
                feedback: feedback.value.trim(),
                gpa: gpa ? Number(gpa) : undefined
              }
            });
            await renderAssignments();
            showMessage('Submission updated.', true);
          };
        }
      }
    } catch (error) {
      showMessage('Assignments failed to load: ' + error.message, false);
    }
  }

  async function renderForum() {
    if (!path.includes('forum')) return;

    try {
      const posts = await apiRequest('/forum');
      let displayCard = qsa('.card').find((c) => /discussion|recent|topics|forum/i.test(c.textContent));
      if (!displayCard) displayCard = qsa('.card')[qsa('.card').length - 1];

      if (displayCard) {
        const listHtml = posts.map((p) => (
          '<div style="padding:12px 0;border-bottom:1px solid #e7e7e7;"><strong>' + escapeHtml(p.topic) + '</strong><p style="margin:6px 0;">' + escapeHtml(p.message) + '</p><small>' + escapeHtml(p.author) + ' • ' + escapeHtml(p.role) + ' • ' + escapeHtml(formatDate(p.date)) + '</small></div>'
        )).join('');
        const heading = displayCard.querySelector('h2') ? displayCard.querySelector('h2').outerHTML : '<h2>Recent Discussions</h2>';
        displayCard.innerHTML = heading + listHtml;
      }

      const topicInput = qsa('input[type="text"]')[0];
      const messageInput = qsa('textarea')[0];
      const btn = qsa('.btn').find((el) => /post|ask|publish|create/i.test(el.textContent));
      if (btn && topicInput && messageInput) {
        btn.onclick = async function (e) {
          e.preventDefault();
          const topic = topicInput.value.trim();
          const message = messageInput.value.trim();
          if (!topic || !message) return showMessage('Enter topic and message.', false);
          await apiRequest('/forum', { method: 'POST', body: { topic, message } });
          topicInput.value = '';
          messageInput.value = '';
          await renderForum();
          showMessage('Discussion posted.', true);
        };
      }
    } catch (error) {
      showMessage('Forum failed to load: ' + error.message, false);
    }
  }

  async function renderAttendance() {
    if (!path.includes('attendance')) return;

    try {
      if (path === 'student-attendance.html') {
        const data = await apiRequest('/attendance/me');
        const statCards = qsa('.stat-card p');
        if (statCards[0]) statCards[0].textContent = String(data.stats.present || 0);
        if (statCards[1]) statCards[1].textContent = String(data.stats.absent || 0);
        if (statCards[2]) statCards[2].textContent = data.stats.rate || '0%';

        const table = qsa('table')[0];
        if (table) {
          table.innerHTML = '<tr><th>Course</th><th>Total Classes</th><th>Present</th><th>Percentage</th></tr>' + (data.courses || []).map((row) => (
            '<tr><td>' + escapeHtml(row.courseTitle || row.courseCode) + '</td><td>' + escapeHtml(row.totalClasses) + '</td><td>' + escapeHtml(row.presentClasses) + '</td><td>' + escapeHtml(row.percentage) + '</td></tr>'
          )).join('');
        }
      }

      if (path === 'instructor-attendance.html' || path === 'attendance.html') {
        const [students, courses] = await Promise.all([
          apiRequest('/students'),
          apiRequest('/courses')
        ]);

        const courseSelect = qsa('select')[0];
        if (courseSelect && courses.length) {
          courseSelect.innerHTML = courses.map((c) => '<option value="' + c.id + '">' + escapeHtml(c.title + ' (' + c.code + ')') + '</option>').join('');
        }

        const table = qsa('table')[0];
        if (table) {
          table.innerHTML = '<tr><th>Name</th><th>ID</th><th>Status</th></tr>' + students.map((s) => (
            '<tr data-student-id="' + s.id + '"><td>' + escapeHtml(s.name) + '</td><td>' + escapeHtml(s.studentId) + '</td><td><select><option selected>Present</option><option>Absent</option></select></td></tr>'
          )).join('');
        }

        const saveBtn = qsa('.btn').find((el) => /save|update/i.test(el.textContent));
        if (saveBtn && table) {
          saveBtn.onclick = async function (e) {
            e.preventDefault();
            const courseId = Number(courseSelect ? courseSelect.value : 0);
            if (!courseId) return showMessage('Select a course first.', false);
            const rows = qsa('tr', table).slice(1);
            const records = rows.map((row) => ({
              studentId: Number(row.dataset.studentId),
              status: row.querySelector('select').value
            }));
            const today = new Date().toISOString().slice(0, 10);
            await apiRequest('/attendance', {
              method: 'PUT',
              body: { courseId, date: today, records }
            });
            showMessage('Attendance saved.', true);
          };
        }
      }
    } catch (error) {
      showMessage('Attendance failed to load: ' + error.message, false);
    }
  }

  async function renderCourses() {
    if (!(path.includes('courses') || path === 'student-dashboard.html')) return;

    try {
      const courses = await apiRequest('/courses');

      if (path === 'student-courses.html') {
        const table = qsa('table')[0];
        if (table) {
          table.innerHTML = '<tr><th>Course Code</th><th>Course Title</th><th>Credit</th><th>GPA</th></tr>' + courses.map((c) => (
            '<tr><td>' + escapeHtml(c.code) + '</td><td>' + escapeHtml(c.title) + '</td><td>' + escapeHtml(c.credit) + ' Cr</td><td>' + escapeHtml(Number(c.gpa || 0).toFixed(2)) + '</td></tr>'
          )).join('');
        }
      }

      if (path === 'instructor-courses.html') {
        const table = qsa('table')[0];
        if (table) {
          table.innerHTML = '<tr><th>Course Code</th><th>Course Title</th><th>Section</th><th>Instructor</th></tr>' + courses.map((c) => (
            '<tr><td>' + escapeHtml(c.code) + '</td><td>' + escapeHtml(c.title) + '</td><td>' + escapeHtml(c.section || '-') + '</td><td>' + escapeHtml(c.instructor || '-') + '</td></tr>'
          )).join('');
        }

        const inputs = qsa('input[type="text"]');
        const btn = qsa('.btn').find((el) => /add|create|save/i.test(el.textContent));
        if (btn && inputs.length >= 3) {
          btn.onclick = async function (e) {
            e.preventDefault();
            const code = inputs[0].value.trim();
            const title = inputs[1].value.trim();
            const section = inputs[2].value.trim() || 'A';
            if (!code || !title || !section) return showMessage('Complete course details.', false);
            await apiRequest('/courses', {
              method: 'POST',
              body: { code, title, section, credit: 3 }
            });
            inputs.forEach((i) => { i.value = ''; });
            await renderCourses();
            showMessage('Course added.', true);
          };
        }
      }

      if (path === 'student-dashboard.html') {
        const table = qsa('table')[0];
        if (table) {
          table.innerHTML = '<tr><th>Course Code</th><th>Credit</th><th>GPA</th></tr>' + courses.slice(0, 3).map((c) => (
            '<tr><td>' + escapeHtml(c.code) + '</td><td>' + escapeHtml(c.credit) + ' Cr</td><td>' + escapeHtml(Number(c.gpa || 0).toFixed(2)) + '</td></tr>'
          )).join('');
        }

        const statCards = qsa('.stat-card p');
        if (statCards[0]) statCards[0].textContent = String(courses.length);
        try {
          const dashboard = await apiRequest('/students/me/dashboard');
          if (statCards[1]) statCards[1].textContent = dashboard.currentGpa;
          if (statCards[2]) statCards[2].textContent = dashboard.overallCgpa;
        } catch (_error) {
        }
      }
    } catch (error) {
      showMessage('Courses failed to load: ' + error.message, false);
    }
  }

  async function renderStudents() {
    if (!(path.includes('students') || path.includes('reports') || path === 'instructor-dashboard.html')) return;

    try {
      if (path === 'instructor-dashboard.html') {
        const stats = await apiRequest('/instructors/me/dashboard');
        const statCards = qsa('.stat-card p');
        if (statCards[0]) statCards[0].textContent = String(stats.totalStudents || 0);
        if (statCards[1]) statCards[1].textContent = String(stats.myCourses || 0);
        if (statCards[2]) statCards[2].textContent = String(stats.pendingSubmissions || 0);
        if (statCards[3]) statCards[3].textContent = String(stats.announcements || 0);
      }

      if (path === 'instructor-students.html' || path === 'students.html') {
        const students = await apiRequest('/students');
        const table = qsa('table')[0];
        if (table) {
          table.innerHTML = '<tr><th>Name</th><th>ID</th><th>Email</th><th>Department</th></tr>' + students.map((s) => (
            '<tr><td>' + escapeHtml(s.name) + '</td><td>' + escapeHtml(s.studentId) + '</td><td>' + escapeHtml(s.email) + '</td><td>' + escapeHtml(s.department) + '</td></tr>'
          )).join('');
        }
      }

      if (path === 'instructor-reports.html') {
        const students = await apiRequest('/students');
        const select = qs('#studentSelect');
        if (!select) return;

        select.innerHTML = students.map((s) => (
          '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>'
        )).join('');

        qsa('.student-report').forEach((el) => el.remove());
        const container = qs('.main-area');
        if (!container) return;

        for (let idx = 0; idx < students.length; idx += 1) {
          const student = students[idx];
          const reportData = await apiRequest('/reports/student/' + student.id);
          const report = document.createElement('div');
          report.id = 'student_report_' + student.id;
          report.className = 'student-report';
          report.style.display = idx === 0 ? 'block' : 'none';
          report.innerHTML =
            '<div class="cards-row">' +
            '<div class="card stat-card"><h3>Average GPA</h3><p>' + escapeHtml(reportData.summary.averageGpa) + '</p></div>' +
            '<div class="card stat-card"><h3>Attendance Rate</h3><p>' + escapeHtml(reportData.summary.attendanceRate) + '</p></div>' +
            '<div class="card stat-card"><h3>Submission Rate</h3><p>' + escapeHtml(reportData.summary.submissionRate) + '</p></div>' +
            '</div>' +
            '<div class="two-col">' +
            '<div class="card"><h2>Student GPA Report</h2><table><tr><th>Assignment</th><th>Course Code</th><th>Status</th><th>GPA</th></tr>' +
            (reportData.rows.length ? reportData.rows.map((row) => (
              '<tr><td>' + escapeHtml(row.assignment) + '</td><td>' + escapeHtml(row.courseCode) + '</td><td>' + escapeHtml(row.status) + '</td><td>' + escapeHtml(row.gpa || '-') + '</td></tr>'
            )).join('') : '<tr><td colspan="4">No data available</td></tr>') +
            '</table></div>' +
            '<div class="card"><h2>Academic Summary</h2><ul class="info-list">' +
            '<li>Student name: ' + escapeHtml(reportData.student.name) + '</li>' +
            '<li>Student ID: ' + escapeHtml(reportData.student.studentCode) + '</li>' +
            '<li>Department: ' + escapeHtml(reportData.student.department) + '</li>' +
            '<li>Total completed credits: ' + escapeHtml(reportData.summary.totalCredits) + ' Cr</li>' +
            '<li>Submitted assignments: ' + escapeHtml(reportData.summary.submittedAssignments) + ' / ' + escapeHtml(reportData.summary.totalAssignments) + '</li>' +
            '</ul></div>' +
            '</div>';
          container.appendChild(report);
        }

        select.onchange = function () {
          qsa('.student-report').forEach((r) => { r.style.display = 'none'; });
          const chosen = qs('#student_report_' + select.value);
          if (chosen) chosen.style.display = 'block';
        };
        select.dispatchEvent(new Event('change'));
      }
    } catch (error) {
      showMessage('Student/report data failed to load: ' + error.message, false);
    }
  }

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
    const meta = pageMeta();
    qsa('.topbar').forEach((bar) => {
      if (bar.dataset.enhanced === '1') return;
      bar.dataset.enhanced = '1';
      const titleBox = bar.children[0];
      const userBox = bar.children[1];
      if (titleBox && !qs('.page-kicker', titleBox)) {
        const kicker = document.createElement('div');
        kicker.className = 'page-kicker';
        kicker.textContent = meta.role === 'Portal' ? 'University workspace' : meta.role + ' workspace';
        titleBox.insertBefore(kicker, titleBox.firstChild);
      }
      if (titleBox && !qs('.topbar-actions', titleBox)) {
        const actions = document.createElement('div');
        actions.className = 'topbar-actions';
        titleBox.appendChild(actions);
      }
      if (userBox && !qs('small', userBox)) {
        const note = document.createElement('small');
        note.textContent = meta.session && meta.session.user_code ? 'ID: ' + meta.session.user_code : 'Session active';
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
        sub.textContent = 'Live backend summary';
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

  function setupMobileNav() {
    const sidebar = qs('.sidebar');
    const toggle = qs('.mobile-nav-toggle');
    const overlay = qs('.mobile-nav-overlay');
    if (!sidebar || !toggle || !overlay) return;

    function setOpen(open) {
      document.body.classList.toggle('mobile-nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    toggle.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('mobile-nav-open'));
    });

    overlay.addEventListener('click', function () {
      setOpen(false);
    });

    qsa('a', sidebar).forEach((link) => {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 960) setOpen(false);
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) setOpen(false);
    });
  }

  function wireFallbackButtons() {
    qsa('a.btn[href="#"]').forEach((btn) => {
      if (!btn.dataset.boundFallback) {
        btn.dataset.boundFallback = '1';
        btn.onclick = function (e) {
          e.preventDefault();
        };
      }
    });
  }

  async function boot() {
    requireAuth();
    wireLogout();
    wireLogin();
    wireRegister();

    await renderAnnouncements();
    await renderAssignments();
    await renderForum();
    await renderAttendance();
    await renderCourses();
    await renderStudents();

    applyProfessionalUI();
    setupMobileNav();
    wireFallbackButtons();
  }

  boot();
})();
