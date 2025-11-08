const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schedulo');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@schedulo.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@schedulo.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
      employeeId: 'ADMIN001',
      department: 'Administration',
      designation: 'HOD'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@schedulo.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

