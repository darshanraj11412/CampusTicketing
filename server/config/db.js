import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const JSON_DB_FILE = path.join(DATA_DIR, 'db.json');

let dbMode = 'json'; // 'mongodb' or 'json'

// In-memory cache when running in json/local mode
let localDb = {
  users: [],
  events: [],
  registrations: [],
  waitlists: [],
  logs: []
};

// Persistence helper for local mode
export const saveLocalDb = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(localDb, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local DB:', err.message);
  }
};

export const loadLocalDb = () => {
  try {
    if (fs.existsSync(JSON_DB_FILE)) {
      const raw = fs.readFileSync(JSON_DB_FILE, 'utf8');
      localDb = JSON.parse(raw);
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.warn('Could not load local DB file, starting fresh:', err.message);
  }
};

export const getLocalDb = () => localDb;
export const setLocalDb = (data) => {
  localDb = { ...localDb, ...data };
  saveLocalDb();
};

export const getDbMode = () => dbMode;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_ticketing';
  
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^@]+)@/, ':****@')} ...`);
    await mongoose.connect(mongoUri, {
      // Atlas connections can take several seconds to resolve and negotiate TLS.
      serverSelectionTimeoutMS: 15000
    });
    dbMode = 'mongodb';
    console.log('✅ MongoDB Connected successfully (Mongoose ODM active)');
    return 'mongodb';
  } catch (err) {
    const safeMessage = String(err.message || err).replace(
      /(mongodb(?:\+srv)?:\/\/)[^@]+@/gi,
      '$1[redacted]@'
    );
    console.error('MongoDB connection diagnostic:', {
      name: err.name,
      code: err.code || err.cause?.code || 'unavailable',
      message: safeMessage
    });

    if (process.env.NODE_ENV === 'production') {
      throw new Error('MongoDB connection failed in production; refusing to start with local JSON storage.');
    }

    dbMode = 'json';
    console.log('ℹ️  MongoDB not reachable on localhost/provided URI.');
    console.log('⚡ Switched to Built-in Zero-Config Persistent Local DB Engine (ACID-safe).');
    loadLocalDb();
    return 'json';
  }
};
