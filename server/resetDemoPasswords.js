import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import { connectDB } from './config/db.js';
import { getSeedUsers } from './data/seedData.js';

dotenv.config();

const main = async () => {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('This one-time account reset is only allowed in production mode.');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be configured; refusing to use a local database.');
  }
  if (process.env.RESET_DEMO_ACCOUNT_PASSWORDS !== 'YES') {
    throw new Error('Set RESET_DEMO_ACCOUNT_PASSWORDS=YES to confirm this one-time reset.');
  }

  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  const passwordBytes = password ? Buffer.byteLength(password, 'utf8') : 0;
  if (!password || passwordBytes < 12 || passwordBytes > 72) {
    throw new Error('DEMO_ACCOUNT_PASSWORD must contain 12–72 bytes.');
  }

  try {
    const mode = await connectDB();
    if (mode !== 'mongodb') {
      throw new Error('Connected database is not MongoDB; no accounts were changed.');
    }

    const seedUsers = await getSeedUsers();
    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    let updated = 0;

    for (const seedUser of seedUsers) {
      const result = await User.updateOne(
        { $or: [{ usn: seedUser.usn }, { email: seedUser.email }] },
        { $set: { password: passwordHash } }
      );
      updated += result.modifiedCount;
    }

    console.log(`One-time demo password reset complete. Updated ${updated} seeded account(s).`);
    if (updated !== seedUsers.length) {
      console.warn('Some seeded demo accounts were not found; no other accounts were changed.');
    }
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error(`Demo password reset stopped: ${error.message}`);
  process.exitCode = 1;
});
