import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const defaultUsers = [
  {
    name: 'Dheivalakshmi',
    email: 'dheivalakshmi7@gmail.com',
    phone: '+91 98401 23456',
    password: process.env.ADMIN_DEFAULT_PASSWORD || 'Rohini#7',
    role: 'admin',
  },
  {
    name: 'Priya Sharma',
    email: 'customer@zestro.com',
    phone: '+91 98765 43210',
    password: 'Customer@123',
    role: 'customer',
  },
  {
    name: 'Chef Murugesan P.',
    email: 'chef@zestro.com',
    phone: '+91 98421 88901',
    password: 'Chef@123',
    role: 'chef',
  },
  {
    name: 'Dheiva (Manager)',
    email: 'manager@zestro.com',
    phone: '+91 98940 11223',
    password: 'Manager@123',
    role: 'restaurantManager',
  },
  {
    name: 'Suresh Kumar',
    email: 'delivery@zestro.com',
    phone: '+91 97890 55443',
    password: 'Delivery@123',
    role: 'deliveryPartner',
  },
];

export const seedDefaultUsers = async () => {
  try {
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`[Seed] Created ${userData.role} user: ${userData.email}`);
      } else {
        // Ensure role and active status are preserved
        existingUser.role = userData.role;
        existingUser.name = userData.name;
        existingUser.phone = userData.phone;
        existingUser.isActive = true;
        await existingUser.save();
        console.log(`[Seed] Verified ${userData.role} user: ${userData.email}`);
      }
    }
    console.log('[Seed] All 5 role accounts successfully seeded/verified in MongoDB Atlas.');
  } catch (error) {
    console.error('[Seed Error] Failed to seed users:', error.message);
  }
};

// If run directly from command line
if (process.argv[1]?.endsWith('seedUsers.js')) {
  (async () => {
    await connectDB();
    await seedDefaultUsers();
    process.exit(0);
  })();
}

export default seedDefaultUsers;
