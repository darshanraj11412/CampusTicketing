import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { dbService } from '../services/dbService.js';

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production' ? null : 'local-development-only-jwt-secret'
);

if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured before starting in production.');

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      usn: user.usn,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
};

export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No Bearer token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await dbService.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User session not found or expired.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const requireRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource.'
      });
    }
    next();
  };
};
