import path from 'path';
import fs from 'fs-extra';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Where we'll store users on disk
const USERS_FILE = path.resolve(process.cwd(), 'users.json');
const SECRET = process.env.SECRET || 'replace_me';

// 1) Ensure the file exists and has at least an empty object
await fs.ensureFile(USERS_FILE);
let users = {};
try {
  const contents = await fs.readFile(USERS_FILE, 'utf8');
  users = contents.trim() ? JSON.parse(contents) : {};
} catch (err) {
  console.error('Error reading users.json, initializing empty store', err);
  users = {};
}

// Helper to persist the current `users` object
async function saveUsers() {
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });
}

// ----------------------------------------------------------------------------
// Register
// ----------------------------------------------------------------------------
app.post('/register', async (req, res) => {
  const { email = '', password } = req.body;
  const key = email.trim().toLowerCase();
  if (users[key]) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hash = await bcrypt.hash(password, 10);
  users[key] = { password: hash };

  try {
    await saveUsers();
    return res.json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('Failed to write users.json', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------------------------------------------------------------------
// Login
// ----------------------------------------------------------------------------
app.post('/login', async (req, res) => {
  console.log('🔑 Login attempt:', req.body);
  const { email = '', password } = req.body;
  const key = email.trim().toLowerCase();
  const user = users[key];
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ email: key }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// ----------------------------------------------------------------------------
// List users (dev only — never expose in prod)
// ----------------------------------------------------------------------------
app.get('/users', (req, res) => {
  // returns all email keys (no hashes)
  return res.json(Object.keys(users));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`ℹ️  users.json path: ${USERS_FILE}`);
});
