const api = 'https://kristigoxha-github-io.onrender.com';
const resetApi = 'https://password-reset-q4wp.onrender.com';

// REGISTER
window.register = async () => {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch(`${api}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    document.getElementById('login-message').textContent = data.message || data.error;
  } catch {
    document.getElementById('login-message').textContent = '⚠️ Network error';
  }
};

// LOGIN
window.login = async () => {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('token', data.token);
      window.showApp(); // call exposed global
    } else {
      document.getElementById('login-message').textContent = data.error || 'Login failed';
    }
  } catch {
    document.getElementById('login-message').textContent = '⚠️ Network error';
  }
};

// LOGOUT
window.logout = () => {
  localStorage.removeItem('token');
  location.reload();
};

// RESET PASSWORD
window.resetPassword = async () => {
  const email = document.getElementById('reset-email').value;
  const msgEl = document.getElementById('reset-message');
  if (!email || !email.includes('@')) {
    msgEl.textContent = '❌ Please enter a valid email address.';
    return;
  }
  try {
    const res = await fetch(`${resetApi}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      msgEl.style.color = 'green';
      msgEl.textContent = '✅ ' + data.message;
    } else {
      msgEl.style.color = 'red';
      msgEl.textContent = '❌ ' + (data.error || 'Failed to send reset link');
    }
  } catch {
    msgEl.style.color = 'red';
    msgEl.textContent = '⚠️ Network error';
  }
};

// CHANGE PASSWORD
window.changePassword = async () => {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword     = document.getElementById('new-password').value;
  const token           = localStorage.getItem('token');
  if (!token) return alert("Not logged in");
  try {
    const res = await fetch(`${api}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    const msgEl = document.getElementById('password-change-message');
    msgEl.textContent = data.message || data.error || 'Something went wrong';
    if (res.ok) {
      setTimeout(window.closePasswordModal, 1500);
    }
  } catch {
    document.getElementById('password-change-message').textContent = '⚠️ Network error';
  }
};

// APP SETUP
function setupApp() {
  const emoji = document.getElementById("emoji");
  const boing = document.getElementById("boing");
  const counterSpan = document.getElementById("todayCount");
  const today = new Date().toISOString().split("T")[0];
  const data = JSON.parse(localStorage.getItem("boingData")) || { date: today, count: 0 };
  const history = JSON.parse(localStorage.getItem("boingHistory")) || {};

  if (data.date !== today) {
    data.date = today;
    data.count = 0;
  }

  function updateCounter() {
    history[data.date] = data.count;
    localStorage.setItem("boingHistory", JSON.stringify(history));
    counterSpan.textContent = data.count;
  }

  emoji.addEventListener("pointerdown", () => {
    boing.currentTime = 0;
    boing.play();
    data.count++;
    localStorage.setItem("boingData", JSON.stringify(data));
    updateCounter();
  });

  updateCounter();

  const input = document.getElementById("imageInput");
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('file-name').textContent = `🎉 File ready: ${file.name}`;
  });
}

// EXPOSE TO GLOBAL
window.setupApp = setupApp;

// SHOW APP (moved here for modular consistency)
window.showApp = () => {
  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastLogin = localStorage.getItem('lastLoginDate');
  if (lastLogin !== today) {
    const history = JSON.parse(localStorage.getItem('boingHistory')) || {};
    const yCount  = history[yesterday] || 0;
    alert(`Yesterday (${yesterday}) you boinged ${yCount} time${yCount === 1 ? '' : 's'}.`);
    localStorage.setItem('lastLoginDate', today);
  }
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'flex';
  setupApp();
};

// MODALS
window.showPasswordModal = () => {
  document.getElementById('password-modal').style.display = 'flex';
};
window.closePasswordModal = () => {
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('password-change-message').textContent = '';
};

// AUTO-LOGIN
if (localStorage.getItem('token')) {
  window.showApp();
}
