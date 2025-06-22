import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import fs from 'fs-extra';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3000;
const SECRET = 'super-pookie-secret';
const USERS_FILE = './users.json';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

await fs.ensureFile(USERS_FILE);
let users = await fs.readJson(USERS_FILE).catch(() => ({}));

// Register
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (users[email]) return res.status(400).json({ error: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  users[email] = { password: hashed };
  await fs.writeJson(USERS_FILE, users);
  res.json({ message: 'Registered' });
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ email }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Protected route
app.get('/profile', (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(auth, SECRET);
    res.json({ email: decoded.email });
  } catch {
    res.sendStatus(403);
  }
});

app.listen(PORT, () => console.log(`🔐 Server running at http://localhost:${PORT}`));
