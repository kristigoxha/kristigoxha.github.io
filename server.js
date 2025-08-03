import path from 'path';
import fs from 'fs-extra';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(express.json());
app.use(cors());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use('/login', authLimiter);
app.use('/register', authLimiter);
app.use((req, res, next) => {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, 'https://' + req.get('host') + req.url);
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});

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

function validateInput(req, res, next) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  
  next();
}

app.use(['/login', '/register'], validateInput);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`ℹ️  users.json path: ${USERS_FILE}`);
});
