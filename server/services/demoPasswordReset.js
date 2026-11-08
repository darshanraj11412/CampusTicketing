import mongoose from 'mongoose';
import User from '../models/User.js';
import { getSeedUsers } from '../data/seedData.js';

const RESET_MARKER_ID = 'seeded-demo-password-reset-v1';

export const resetSeededDemoPasswordsIfRequested = async (mode) => {
  if (process.env.RESET_DEMO_ACCOUNT_PASSWORDS !== 'YES') return;
  if (mode !== 'mongodb') {
    throw new Error('Demo-account password reset requires MongoDB mode.');
  }

  const settings = mongoose.connection.collection('application_settings');
  const alreadyReset = await settings.findOne({ _id: RESET_MARKER_ID });
  if (alreadyReset) {
    console.log('Seeded demo-account password reset was already completed; skipping.');
    return;
  }

  const seedUsers = await getSeedUsers();
  let matched = 0;

  for (const seedUser of seedUsers) {
    const result = await User.updateOne(
      { $or: [{ usn: seedUser.usn }, { email: seedUser.email }] },
      { $set: { password: seedUser.password } }
    );
    matched += result.matchedCount;
  }

  if (matched !== seedUsers.length) {
    console.warn(`Demo password reset matched ${matched} of ${seedUsers.length} seeded accounts; marker was not recorded.`);
    return;
  }

  await settings.insertOne({
    _id: RESET_MARKER_ID,
    completedAt: new Date(),
    accountsUpdated: matched
  });
  console.log(`One-time demo password reset complete. Updated ${matched} seeded accounts.`);
};
