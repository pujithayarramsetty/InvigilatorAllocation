const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/emailService');

const router = express.Router();

// Handle OPTIONS for CORS preflight
router.options('/register', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Public Register (Faculty can register themselves, Admin registration requires approval)
router.post('/register', async (req, res) => {
  try {
    // Log for debugging
    console.log('Registration attempt:', { body: req.body, headers: req.headers });
    
    const { name, email, password, role, employeeId, campus, department, designation } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, password, and role are required' 
      });
    }

    // Validate role
    if (!role || !['admin', 'examController', 'faculty'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, examController, or faculty' });
    }

    // Check if user already exists
    const existingUserQuery = employeeId 
      ? { $or: [{ email }, { employeeId }] }
      : { email };
    const existingUser = await User.findOne(existingUserQuery);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or employee ID already exists' });
    }

    // For admin registration, employee ID is recommended but not required
    if (role === 'admin' && !employeeId) {
      // Employee ID is recommended for admin but not mandatory
      console.warn('Admin registration without Employee ID');
    }

    // For examController registration, department is required
    if (role === 'examController' && !department) {
      return res.status(400).json({ message: 'Department is required for Exam Controller registration' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role || 'faculty',
      employeeId: employeeId || null,
      campus: campus || 'A Block',
      department: department || '',
      designation: role === 'examController' ? 'HOD' : (designation || 'Lecturer')
    });

    await user.save();

    // Generate token for auto-login after registration
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only register (for creating other users including exam controllers)
router.post('/register-user', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can register users' });
    }

    const { name, email, password, role, employeeId, campus, department, designation } = req.body;
    
    if (role === 'examController' && !department) {
      return res.status(400).json({ message: 'Department is required for Exam Controller accounts' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { employeeId: employeeId || '' }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'faculty',
      employeeId: employeeId || null,
      campus: campus || 'A Block',
      department: department || '',
      designation: designation || 'Lecturer'
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update current user profile
router.put('/me', auth, async (req, res) => {
  try {
    const allowed = ['name', 'employeeId', 'campus', 'department', 'designation'];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    // Optional: basic validation
    if (updates.name !== undefined && !updates.name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    // Enforce unique employeeId if provided
    if (updates.employeeId) {
      const exists = await User.findOne({ employeeId: updates.employeeId, _id: { $ne: req.user.id } });
      if (exists) {
        return res.status(400).json({ message: 'Employee ID already in use' });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true, select: '-password' }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Request reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Send email
    const subject = 'Password Reset Request - Schedulo';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Schedulo - Password Reset</h1>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>You requested a password reset for your Schedulo account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p><strong>For Mobile/Phone Access:</strong></p>
            <p>If you're accessing from a phone, make sure your phone is on the same Wi-Fi network as your computer, then use this link:</p>
            <p style="word-break: break-all; color: #667eea; font-weight: bold; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            <p><strong>Or manually enter the reset token:</strong></p>
            <p style="word-break: break-all; color: #667eea; font-weight: bold; background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">${resetToken}</p>
            <p>Go to: <strong>${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/[TOKEN]</strong></p>
            <p><strong>This link will expire in 10 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Schedulo System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const emailResult = await sendNotificationEmail(user.email, subject, html);
      
      if (!emailResult.success) {
        console.error('Email send failed:', emailResult.error || emailResult.message);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ 
          message: emailResult.message || 'Email could not be sent. Please check email configuration.' 
        });
      }
      
      console.log('Password reset email sent successfully to:', user.email);
      res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.',
        resetLink: resetUrl, // Include reset link in response for mobile access
        token: resetToken // Include token for manual entry
      });
    } catch (error) {
      console.error('Error in forgot password route:', error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ 
        message: 'Email could not be sent: ' + (error.message || 'Unknown error') 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash token to compare with stored token
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

