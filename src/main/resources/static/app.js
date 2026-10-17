const apiBase = '/api';
const state = {
  currentView: 'dashboard',
  currentRole: null,
  patients: [],
  appointments: [],
  doctors: [],
  billing: [],
  charts: null
};

function setAuthResult(msg) {
  const el = document.getElementById('auth-result');
  if (el) el.innerText = msg;
}

function showToast(message, type = 'info') {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>${message}`;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function attachRippleEffect() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.btn-ripple');
    if (!button) return;
    const circle = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    circle.className = 'ripple';
    circle.style.width = circle.style.height = `${size}px`;
    circle.style.left = `${event.clientX - rect.left - size / 2}px`;
    circle.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  });
}

function attachTiltEffect() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.tilt-card').forEach((card) => {
    if (card.dataset.tiltReady) return;
    card.dataset.tiltReady = 'true';
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -5;
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function setButtonLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.disabled = true;
    button.innerHTML = '<span class="me-2"><i class="fas fa-spinner fa-spin"></i></span>Working...';
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
  }
}

function toggleAuthMode(mode) {
  const loginPanel = document.getElementById('login-form-panel');
  const registerPanel = document.getElementById('register-form-panel');
  const loginToggle = document.getElementById('show-login-btn');
  const registerToggle = document.getElementById('show-register-btn');

  if (mode === 'register') {
    loginPanel?.classList.add('d-none');
    registerPanel?.classList.remove('d-none');
    loginToggle?.classList.remove('active');
    registerToggle?.classList.add('active');
  } else {
    loginPanel?.classList.remove('d-none');
    registerPanel?.classList.add('d-none');
    loginToggle?.classList.add('active');
    registerToggle?.classList.remove('active');
  }
}

function showView(viewName) {
  document.querySelectorAll('.view-section').forEach((section) => {
    section.classList.toggle('d-none', section.id !== `${viewName}-view`);
  });
  document.querySelectorAll('.nav-link[data-view]').forEach((link) => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });
  state.currentView = viewName;
  const sectionSelect = document.getElementById('dashboard-section-select');
  if (sectionSelect) sectionSelect.value = viewName;
  document.getElementById('admin-back-dashboard')?.classList.toggle('d-none', viewName === 'dashboard');
  if (viewName === 'dashboard') {
    renderDashboardCharts();
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('show');
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }
    : { 'Content-Type': 'application/json' };
}

function decodeToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload.padEnd(payload.length + ((4 - payload.length % 4) % 4), '=')));
  } catch {
    return {};
  }
}

function applyRoleLayout() {
  const profile = decodeToken(localStorage.getItem('token') || '');
  const roles = Array.isArray(profile.roles) ? profile.roles : [];
  state.currentRole = roles.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : roles.includes('ROLE_HOST') ? 'ROLE_HOST' : null;
  const profileName = document.getElementById('user-profile-name');
  const roleLabel = document.getElementById('user-role-label');
  const title = document.getElementById('app-title');
  const subtitle = document.getElementById('app-subtitle');
  if (profileName) profileName.textContent = profile.sub || 'User';
  if (roleLabel) roleLabel.textContent = state.currentRole === 'ROLE_HOST' ? 'Hospital Staff' : 'Hospital Admin';
  if (title) title.textContent = state.currentRole === 'ROLE_HOST' ? 'Hospital Staff Dashboard' : 'Hospital Management Dashboard';
  if (subtitle) subtitle.textContent = state.currentRole === 'ROLE_HOST' ? 'Daily hospital operations' : 'Professional patient and care operations';
  document.querySelector('.admin-nav[data-view="settings"]')?.classList.toggle('d-none', state.currentRole !== 'ROLE_ADMIN');
}

async function register() {
  const username = document.getElementById('register-username')?.value || document.getElementById('username').value;
  const password = document.getElementById('register-password')?.value || document.getElementById('password').value;
  const res = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const text = await res.text();
  setAuthResult(text);
  showToast('Registration request submitted', 'success');
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const loginButton = document.querySelector('#login-screen .btn-primary');
  loginButton.dataset.originalText = loginButton.innerHTML;
  setButtonLoading(loginButton, true);

  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      setAuthResult('Login failed');
      showToast('Login failed. Please verify your credentials.', 'error');
      return;
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    const roles = Array.isArray(data.roles) ? data.roles : decodeToken(data.token).roles || [];
    if (roles.includes('ROLE_PATIENT')) {
      window.location.replace('/patient.html');
      return;
    }
    setAuthResult('Welcome back!');
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('app-shell').classList.remove('d-none');
    applyRoleLayout();
    showToast('Welcome back to CityCare dashboard', 'success');
    await loadDashboardData();
    showView('dashboard');
  } finally {
    setButtonLoading(loginButton, false);
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('patientToken');
  document.getElementById('app-shell').classList.add('d-none');
  document.getElementById('login-screen').classList.remove('d-none');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('register-username').value = '';
  document.getElementById('register-password').value = '';
  toggleAuthMode('login');
  setAuthResult('You have been logged out.');
  showToast('Logged out successfully', 'info');
}

async function loadDashboardData() {
  try {
    const [patientsResult, appointmentsResult, doctorsResult, billingResult] = await Promise.allSettled([
      fetch(`${apiBase}/patients`, { headers: authHeaders() }),
      fetch(`${apiBase}/appointments`, { headers: authHeaders() }),
      fetch(`${apiBase}/doctors`, { headers: authHeaders() }),
      fetch(`${apiBase}/billing`, { headers: authHeaders() })
    ]);

    if (patientsResult.status === 'fulfilled' && patientsResult.value.ok) {
      state.patients = await patientsResult.value.json();
    }
    if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value.ok) {
      state.appointments = await appointmentsResult.value.json();
    }
    if (doctorsResult.status === 'fulfilled' && doctorsResult.value.ok) {
      state.doctors = await doctorsResult.value.json();
    }
    if (billingResult.status === 'fulfilled' && billingResult.value.ok) {
      state.billing = await billingResult.value.json();
    }
  } catch (error) {
    console.error(error);
  }

  if (!state.doctors.length) {
    state.doctors = [
      { fullName: 'Dr. Asha Rao', specialty: 'Cardiology', experience: 12, status: 'Available' },
      { fullName: 'Dr. Neeraj Singh', specialty: 'Neurology', experience: 8, status: 'Busy' },
      { fullName: 'Dr. Meera Shah', specialty: 'Pediatrics', experience: 10, status: 'Available' },
      { fullName: 'Dr. Rahul Menon', specialty: 'Orthopedics', experience: 15, status: 'Available' }
    ];
  }

  if (!state.billing.length) {
    state.billing = [
      { invoice: 'INV-1042', patient: 'Naina K', amount: '₹420', status: 'Paid', date: '2026-07-29' },
      { invoice: 'INV-1043', patient: 'Sanjay R', amount: '₹295', status: 'Pending', date: '2026-07-30' },
      { invoice: 'INV-1044', patient: 'Mina T', amount: '₹610', status: 'Paid', date: '2026-07-31' }
    ];
  }

  populateAppointmentSelectors();
  renderDashboard();
  renderPatientTable();
  renderAppointmentTable();
  renderDoctorCards();
  renderBillingTable();
  renderReportsTable();
  renderDashboardCharts();
}

function populateAppointmentSelectors() {
  const patientSelect = document.getElementById('a-patient-id');
  const doctorSelect = document.getElementById('a-doctor-id');
  if (patientSelect) {
    patientSelect.innerHTML = '<option value="">Select patient</option>' + state.patients.map((patient) =>
      `<option value="${patient.id}">${patient.fullName || `Patient #${patient.id}`}</option>`
    ).join('');
  }
  if (doctorSelect) {
    doctorSelect.innerHTML = '<option value="">Select doctor</option>' + state.doctors.map((doctor) =>
      `<option value="${doctor.id}">${doctor.fullName || `Doctor #${doctor.id}`} · ${doctor.specialty || 'General Medicine'}</option>`
    ).join('');
  }
}

function renderDashboard() {
  const totalPatients = state.patients.length;
  const totalAppointments = state.appointments.length;
  const emergencyCases = Math.max(3, Math.min(9, totalPatients + 2));
  const availableBeds = 42 - Math.min(20, totalPatients + 3);
  const revenue = state.billing.reduce((sum, item) => sum + Number((item.amount || '₹0').replace(/[^\d.]/g, '')), 0);

  document.getElementById('patient-count').textContent = totalPatients;
  document.getElementById('doctor-count').textContent = state.doctors.length;
  document.getElementById('appointment-count').textContent = totalAppointments;
  document.getElementById('bed-count').textContent = availableBeds;
  document.getElementById('emergency-count').textContent = emergencyCases;
  document.getElementById('revenue-count').textContent = `₹${Math.round(revenue).toLocaleString()}`;

  const recentActivity = document.getElementById('recent-activity');
  recentActivity.innerHTML = state.appointments.slice(0, 4).map((item) => {
    const patientName = item.patient?.fullName || 'Patient';
    const status = item.status || 'Scheduled';
    return `<li class="list-group-item border-0 px-0"><div class="d-flex justify-content-between"><span>${patientName}</span><span class="badge bg-light text-dark">${status}</span></div></li>`;
  }).join('');
}

async function createPatient() {
  const payload = {
    fullName: document.getElementById('p-name').value,
    phone: document.getElementById('p-phone').value,
    address: document.getElementById('p-address').value,
    gender: document.getElementById('p-gender').value,
    dateOfBirth: document.getElementById('p-dob').value,
    medicalHistory: document.getElementById('p-history').value
  };

  const button = document.querySelector('#patient-form button[type="submit"]');
  button.dataset.originalText = button.innerHTML;
  setButtonLoading(button, true);

  try {
    const res = await fetch(`${apiBase}/patients`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      showToast('Failed to create patient', 'error');
      return;
    }

    document.getElementById('patient-form').reset();
    showToast('Patient saved successfully', 'success');
    await loadDashboardData();
    showView('patients');
  } finally {
    setButtonLoading(button, false);
  }
}

function renderPatientTable() {
  const tbody = document.getElementById('patients-table-body');
  if (!tbody) return;
  tbody.innerHTML = state.patients.map((patient) => `
    <tr>
      <td>${patient.fullName || 'Unknown'}</td>
      <td>${patient.phone || '-'}</td>
      <td>${patient.gender || '-'}</td>
      <td>${patient.address || '-'}</td>
      <td><span class="badge badge-pill bg-success-subtle text-success">Active</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2 btn-ripple"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-ripple"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function createAppointment() {
  const patientId = Number(document.getElementById('a-patient-id').value);
  const doctorId = Number(document.getElementById('a-doctor-id').value);
  const appointmentTimeRaw = document.getElementById('a-time').value;

  if (!patientId || !doctorId) {
    showToast('Please enter valid patient and doctor IDs.', 'error');
    return;
  }

  const payload = {
    patient: { id: patientId },
    doctor: { id: doctorId },
    appointmentTime: appointmentTimeRaw ? `${appointmentTimeRaw}:00` : null,
    notes: document.getElementById('a-notes').value,
    status: document.getElementById('a-status').value
  };

  const button = document.querySelector('#appointment-form button[type="submit"]');
  button.dataset.originalText = button.innerHTML;
  setButtonLoading(button, true);

  try {
    const res = await fetch(`${apiBase}/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      showToast(errorText || 'Failed to book appointment', 'error');
      return;
    }

    document.getElementById('appointment-form').reset();
    showToast('Appointment booked successfully', 'success');
    await loadDashboardData();
    showView('appointments');
  } finally {
    setButtonLoading(button, false);
  }
}

function renderAppointmentTable() {
  const tbody = document.getElementById('appointments-table-body');
  if (!tbody) return;
  tbody.innerHTML = state.appointments.map((item) => `
    <tr>
      <td>${item.patient?.fullName || 'Patient'}</td>
      <td>${item.doctor?.fullName || 'Doctor'}</td>
      <td>${item.appointmentTime || '-'}</td>
      <td><span class="badge badge-pill bg-info-subtle text-info">${item.status || 'Scheduled'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2 btn-ripple"><i class="fas fa-eye"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-ripple"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function renderDoctorCards() {
  const container = document.getElementById('doctor-grid');
  if (!container) return;
  container.innerHTML = state.doctors.map((doctor) => `
    <div class="col-md-6 col-xl-3">
      <div class="module-card p-4">
        <div class="d-flex align-items-center mb-3">
          <div class="stat-icon me-3"><i class="fas fa-user-md"></i></div>
          <div>
            <h6 class="mb-0">${doctor.fullName || 'Doctor'}</h6>
            <small class="text-muted">${doctor.specialty || 'General'}</small>
          </div>
        </div>
        <p class="text-muted mb-2">Experience: ${doctor.experience || '8'} years</p>
        <span class="badge ${doctor.status === 'Busy' ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}">${doctor.status || 'Available'}</span>
      </div>
    </div>
  `).join('');
}

function renderBillingTable() {
  const tbody = document.getElementById('billing-table-body');
  if (!tbody) return;
  const amounts = state.billing.map((item) => Number(String(item.amount || '0').replace(/[^\d.]/g, '')) || 0);
  const revenue = amounts.reduce((sum, amount) => sum + amount, 0);
  const pending = state.billing.filter((item) => String(item.status).toLowerCase() === 'pending').length;
  const paid = state.billing.filter((item) => String(item.status).toLowerCase() === 'paid').length;
  const revenueEl = document.getElementById('billing-revenue');
  const pendingEl = document.getElementById('billing-pending');
  const collectedEl = document.getElementById('billing-collected');
  if (revenueEl) revenueEl.textContent = `₹${Math.round(revenue).toLocaleString()}`;
  if (pendingEl) pendingEl.textContent = pending;
  if (collectedEl) collectedEl.textContent = state.billing.length ? `${Math.round((paid / state.billing.length) * 100)}%` : '0%';
  tbody.innerHTML = state.billing.map((item) => `
    <tr>
      <td>${item.invoice || '-'}</td>
      <td>${item.patient || '-'}</td>
      <td>${item.amount || '-'}</td>
      <td><span class="badge ${item.status === 'Pending' ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}">${item.status || '-'}</span></td>
      <td>${item.date || '-'}</td>
    </tr>
  `).join('');
  attachTiltEffect();
}

function renderReportsTable() {
  const tbody = document.getElementById('reports-table-body');
  if (!tbody) return;
  tbody.innerHTML = [
    { report: 'Appointment Census', period: 'Today', status: `${state.appointments.length} visits`, owner: 'Operations' },
    { report: 'Revenue Summary', period: 'Current data', status: `₹${Math.round(state.billing.reduce((sum, item) => sum + (Number(String(item.amount || '0').replace(/[^\d.]/g, '')) || 0), 0))}`, owner: 'Finance' },
    { report: 'Patient Register', period: 'Current data', status: `${state.patients.length} patients`, owner: 'Clinical Team' }
  ].map((report) => `
    <tr>
      <td>${report.report}</td>
      <td>${report.period}</td>
      <td><span class="badge bg-info-subtle text-info">${report.status}</span></td>
      <td>${report.owner}</td>
    </tr>
  `).join('');
}

function exportReport() {
  const revenue = state.billing.reduce((sum, item) => sum + (Number(String(item.amount || '0').replace(/[^\d.]/g, '')) || 0), 0);
  const rows = [
    ['CityCare Operations Report', new Date().toLocaleString()],
    ['Patients', state.patients.length],
    ['Doctors', state.doctors.length],
    ['Appointments', state.appointments.length],
    ['Invoices', state.billing.length],
    ['Revenue', `₹${Math.round(revenue)}`]
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `citycare-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Report downloaded successfully', 'success');
}

function renderDashboardCharts() {
  if (!window.Chart) return;
  const patientCtx = document.getElementById('patient-stats-chart');
  const appointmentCtx = document.getElementById('appointment-analytics-chart');
  const monthlyCtx = document.getElementById('monthly-report-chart');

  if (state.charts) {
    Object.values(state.charts).forEach((chart) => chart.destroy());
  }
  state.charts = {};

  if (patientCtx) {
    state.charts.patient = new Chart(patientCtx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Patients',
          data: [Math.max(8, state.patients.length - 5), Math.max(10, state.patients.length - 2), Math.max(12, state.patients.length), Math.max(14, state.patients.length + 3), Math.max(16, state.patients.length + 6), Math.max(18, state.patients.length + 9)],
          backgroundColor: ['#2168f2', '#4fb3ff', '#2bb673', '#f4b942', '#e85151', '#2168f2'],
          borderRadius: 10
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(18,49,74,.08)' } }, x: { grid: { display: false } } } }
    });
  }

  if (appointmentCtx) {
    state.charts.appointment = new Chart(appointmentCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [{
          label: 'Appointments',
          data: [3, 5, 4, 7, 8, Math.max(3, state.appointments.length)],
          borderColor: '#2168f2',
          backgroundColor: 'rgba(33,104,242,0.12)',
          fill: true,
          tension: 0.35
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
    });
  }

  if (monthlyCtx) {
    state.charts.monthly = new Chart(monthlyCtx, {
      type: 'doughnut',
      data: {
        labels: ['Admissions', 'Consultations', 'Diagnostics'],
        datasets: [{
          data: [state.patients.length, state.appointments.length, state.billing.length],
          backgroundColor: ['#2168f2', '#4fb3ff', '#2bb673']
        }]
      },
      options: { responsive: true, cutout: '68%', plugins: { legend: { position: 'bottom' } } }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  attachRippleEffect();
  attachTiltEffect();
  toggleAuthMode('login');

  document.querySelectorAll('.nav-link[data-view]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showView(link.dataset.view);
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('admin-back-dashboard')?.addEventListener('click', () => showView('dashboard'));
  document.getElementById('dashboard-section-select')?.addEventListener('change', (event) => {
    showView(event.target.value);
  });
  document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('book-appointment-btn')?.addEventListener('click', () => {
    document.getElementById('appointment-form')?.requestSubmit();
  });
  document.getElementById('export-report-btn')?.addEventListener('click', exportReport);
  document.getElementById('create-invoice-btn')?.addEventListener('click', () => {
    showView('billing');
    showToast('Invoice counter ready. Connect a patient and amount to create an invoice.', 'info');
  });
  document.querySelector('.topbar .btn-outline-secondary')?.addEventListener('click', () => {
    showToast('You have no new notifications.', 'info');
  });
  document.querySelector('#patients-view .hero-panel button')?.addEventListener('click', () => {
    document.getElementById('p-name')?.focus();
  });
  document.querySelector('#doctors-view .hero-panel button')?.addEventListener('click', () => {
    showToast('Doctor creation can be added by an administrator after selecting a department.', 'info');
  });

  document.getElementById('patient-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    createPatient();
  });

  document.getElementById('appointment-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    createAppointment();
  });

  document.addEventListener('click', (event) => {
    if (event.target.id === 'sidebar' || event.target.closest('.sidebar')) return;
    document.getElementById('sidebar')?.classList.remove('show');
  });
});
