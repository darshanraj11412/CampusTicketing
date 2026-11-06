import express from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../services/dbService.js';
import { generateToken, verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'College ID / USN / Email and Password are required.' });
    }

    const user = await dbService.findUserByUsnOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User with given USN/Email not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password. Please check and try again.' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    let { name, usn, email, password, department, role = 'student' } = req.body;

    if (!name || !usn || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, USN, college email, and password are all required.' });
    }

    name = String(name).trim();
    usn = String(usn).trim().toUpperCase();
    email = String(email).trim().toLowerCase();

    if (name.length < 2) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters.' });
    }

    if (usn.length < 4) {
      return res.status(400).json({ success: false, message: 'Valid College USN or ID is required (minimum 4 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid college email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters for security.' });
    }

    // Check if USN or Email exists
    const existing = await dbService.findUserByUsnOrEmail(usn);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this USN already exists.' });
    }
    const existingEmail = await dbService.findUserByUsnOrEmail(email);
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'An account with this Email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await dbService.createUser({
      name,
      usn,
      email,
      password: hashedPassword,
      department: department || 'School of CSE',
      role: role === 'organizer' ? 'organizer' : 'student'
    });

    const token = generateToken(newUser);
    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', verifyAuth, async (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/demo-accounts (convenience for evaluation presentation)
router.get('/demo-accounts', (req, res) => {
  res.json({
    students: [
      { name: 'Arjun N', usn: '1RUA24SCS0012', role: 'student', defaultPassword: 'password123' },
      { name: 'Darshan R', usn: '1RUA24SCS0029', role: 'student', defaultPassword: 'password123' },
      { name: 'Dakshith Saraf', usn: '1RUA24SCS0028', role: 'student', defaultPassword: 'password123' }
    ],
    organizer: { name: 'Tech Club RVU', usn: 'ORG-RVU-TECH', email: 'organizer@rvu.edu.in', role: 'organizer', defaultPassword: 'password123' },
    admin: { name: 'Dean of Student Affairs', usn: 'ADM-RVU-001', email: 'admin@rvu.edu.in', role: 'admin', defaultPassword: 'password123' }
  });
});

export default router;
