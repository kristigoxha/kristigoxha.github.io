const api = 'https://kristigoxha-github-io.onrender.com';
const resetApi = 'https://password-reset-q4wp.onrender.com'; // Your password reset backend

window.register = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`${api}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  document.getElementById('login-message').textContent = data.message || data.error;
};

window.login = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`${api}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    showApp();
    setupApp();
  } else {
    document.getElementById('login-message').textContent = data.error;
  }
};

window.logout = () => {
  localStorage.removeItem('token');
  location.reload();
};

function showApp() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'flex';
}

function setupApp() {
  const emoji = document.getElementById("emoji");
  const boing = document.getElementById("boing");
  const counter = document.getElementById("counter");
  const today = new Date().toISOString().split("T")[0];
  const data = JSON.parse(localStorage.getItem("boingData")) || { date: today, count: 0 };

  if (data.date !== today) {
    data.date = today;
    data.count = 0;
  }

  function updateCounter() {
    counter.textContent = `Boings today: ${data.count}`;
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

if (localStorage.getItem('token')) {
  showApp();
  setupApp();
}

window.showPasswordModal = () => {
  document.getElementById('password-modal').style.display = 'flex';
};

window.closePasswordModal = () => {
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('password-change-message').textContent = '';
};

window.changePassword = async () => {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;

  const token = localStorage.getItem('token');
  if (!token) return alert("Not logged in");

  const res = await fetch(`${api}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await res.json();
  document.getElementById('password-change-message').textContent =
    data.message || data.error || 'Something went wrong';

  if (res.ok) {
    setTimeout(() => closePasswordModal(), 1500);
  }
};

window.resetPassword = async () => {
  const email = document.getElementById('reset-email').value;
  const message = document.getElementById('reset-message');

  if (!email || !email.includes('@')) {
    message.textContent = '❌ Please enter a valid email address.';
    message.style.color = 'red';
    return;
  }

  const res = await fetch(`${resetApi}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (res.ok) {
    message.textContent = '✅ ' + data.message;
    message.style.color = 'green';
  } else {
    message.textContent = '❌ ' + (data.error || 'Failed to send reset link');
    message.style.color = 'red';
  }
};
