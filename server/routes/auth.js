import express from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../services/dbService.js';
import { generateToken, verifyAuth } from '../middleware/auth.js';
import { loginRateLimit, registrationRateLimit } from '../middleware/authRateLimit.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (
      typeof identifier !== 'string' || !identifier.trim() || identifier.length > 254 ||
      typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({ message: 'College ID / USN / Email and Password are required.' });
    }

    const user = await dbService.findUserByUsnOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ message: 'Invalid college ID / email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid college ID / email or password.' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login could not be completed.' });
  }
});

// POST /api/auth/register
router.post('/register', registrationRateLimit, async (req, res) => {
  try {
    let { name, usn, email, password, department } = req.body;

    if (
      typeof name !== 'string' || typeof usn !== 'string' ||
      typeof email !== 'string' || typeof password !== 'string'
    ) {
      return res.status(400).json({ success: false, message: 'Name, USN, college email, and password are all required.' });
    }

    name = String(name).trim();
    usn = String(usn).trim().toUpperCase();
    email = String(email).trim().toLowerCase();

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ success: false, message: 'Full name must be 2–80 characters.' });
    }

    if (usn.length < 4 || usn.length > 32) {
      return res.status(400).json({ success: false, message: 'College USN or ID must be 4–32 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 254 || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid college email address.' });
    }

    const passwordBytes = Buffer.byteLength(password, 'utf8');
    if (password.length < 8 || passwordBytes > 72) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and no more than 72 bytes.' });
    }

    if (department !== undefined && (typeof department !== 'string' || department.length > 120)) {
      return res.status(400).json({ success: false, message: 'Department must be text of at most 120 characters.' });
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
      department: department?.trim() || 'School of CSE',
      role: 'student'
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
    console.error('Registration error:', err.message);
    res.status(500).json({ success: false, message: 'Registration could not be completed.' });
  }
});

// GET /api/auth/me
router.get('/me', verifyAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
