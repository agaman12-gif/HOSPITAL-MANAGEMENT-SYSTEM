const api = '/api';
const patientState = { doctors: [], patients: [], appointments: [] };

const message = (text, error = false) => {
  const target = document.getElementById('auth-message');
  if (target) { target.textContent = text; target.className = `small mt-3 ${error ? 'text-danger' : 'text-success'}`; }
};
const toast = (text) => {
  const target = document.getElementById('toast');
  if (!target) return;
  target.innerHTML = `<div class="toast show text-bg-dark">${text}</div>`;
  setTimeout(() => { target.innerHTML = ''; }, 2200);
};
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('patientToken') || ''}` });
const decode = (token) => {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
  catch (error) { return {}; }
};
const loggedIn = () => Boolean(localStorage.getItem('patientToken'));

function openView(name) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === name));
  document.querySelectorAll('[data-view]').forEach((link) => link.classList.toggle('active', link.dataset.view === name));
  document.getElementById('patient-back-dashboard')?.classList.toggle('d-none', name === 'home');
  if (name === 'appointments') populateDoctors();
}

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(await response.text() || 'Request failed');
  return response.json();
}

async function loadData() {
  try {
    const [doctors, patient, appointments] = await Promise.all([
      request('/doctors'), request('/patients/me'), request('/appointments')
    ]);
    patientState.doctors = doctors;
    patientState.patients = patient ? [patient] : [];
    patientState.appointments = appointments;
    renderAppointments();
    populateDoctors();
  } catch (error) {
    console.error(error);
    toast('Unable to load hospital data right now.');
  }
}

function populateDoctors() {
  const select = document.getElementById('doctor');
  if (!select) return;
  select.innerHTML = '<option value="">Select a doctor</option>' + patientState.doctors.map((doctor) =>
    `<option value="${doctor.id}">${doctor.fullName || 'Doctor'} · ${doctor.specialty || 'General Medicine'}</option>`
  ).join('');
}

function renderAppointments() {
  const items = patientState.appointments.slice(0, 5);
  document.getElementById('appointment-count').textContent = patientState.appointments.length;
  const html = items.length ? items.map((item) =>
    `<div class="border rounded-3 p-3 mb-2"><strong>${item.doctor?.fullName || 'Doctor'}</strong><div class="small text-muted">${item.appointmentTime || 'Time pending'} · ${item.status || 'Scheduled'}</div></div>`
  ).join('') : '<p class="text-muted mb-0">No appointments yet. Book your first visit.</p>';
  document.getElementById('upcoming').innerHTML = html;
  document.getElementById('appointment-list').innerHTML = html;
}

async function login(event) {
  event.preventDefault();
  try {
    const response = await fetch(`${api}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: document.getElementById('login-username').value, password: document.getElementById('login-password').value })
    });
    if (!response.ok) throw new Error('Invalid patient credentials');
    const data = await response.json();
    const token = data.token;
    const roles = decode(token).roles || [];
    if (!roles.includes('ROLE_PATIENT')) throw new Error('Use the admin portal for this account');
    localStorage.setItem('patientToken', token);
    showApp();
  } catch (error) { message(error.message, true); }
}

async function register(event) {
  event.preventDefault();
  try {
    const response = await fetch(`${api}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: document.getElementById('register-username').value, password: document.getElementById('register-password').value })
    });
    if (!response.ok) throw new Error(await response.text() || 'Registration failed');
    message('Account created. You can now log in.');
    document.getElementById('register-form').reset();
  } catch (error) { message(error.message, true); }
}

async function book(event) {
  event.preventDefault();
  try {
    const doctorId = Number(document.getElementById('doctor').value);
    const visitTime = document.getElementById('visit-time').value;
    if (!doctorId || !visitTime) throw new Error('Please select a doctor and visit time.');
    await request('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        doctor: { id: doctorId },
        appointmentTime: visitTime,
        notes: document.getElementById('reason').value,
        status: 'Scheduled'
      })
    });
    toast('Appointment booked successfully.');
    event.target.reset();
    await loadData();
    openView('home');
  } catch (error) { toast(error.message); }
}

function showApp() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  const username = decode(localStorage.getItem('patientToken')).sub || 'Patient';
  document.getElementById('patient-name').textContent = username;
  document.getElementById('profile-username').textContent = username;
  loadData();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-tab').onclick = () => {
    document.getElementById('login-form').classList.remove('d-none');
    document.getElementById('register-form').classList.add('d-none');
  };
  document.getElementById('register-tab').onclick = () => {
    document.getElementById('login-form').classList.add('d-none');
    document.getElementById('register-form').classList.remove('d-none');
  };
  document.getElementById('login-form').onsubmit = login;
  document.getElementById('register-form').onsubmit = register;
  document.getElementById('booking-form').onsubmit = book;
  document.querySelectorAll('[data-view]').forEach((link) => link.onclick = (event) => { event.preventDefault(); openView(link.dataset.view); });
  document.querySelectorAll('[data-message]').forEach((button) => button.onclick = () => toast(button.dataset.message));
  const leavePatientPortal = (event) => {
    event.preventDefault();
    localStorage.removeItem('patientToken');
    localStorage.removeItem('token');
    window.location.replace('/');
  };
  document.getElementById('logout').onclick = leavePatientPortal;
  document.getElementById('hospital-portal-link').onclick = leavePatientPortal;
  document.getElementById('patient-back-dashboard').onclick = () => openView('home');
  if (loggedIn()) showApp();
});
