const api = 'http://localhost:3000';

window.register = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`${api}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  document.getElementById('message').textContent = data.message || data.error;
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
    document.getElementById('message').textContent = 'Logged in!';
    // Optional: redirect or show app
  } else {
    document.getElementById('message').textContent = data.error;
  }
};
