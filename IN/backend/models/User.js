const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'examController', 'faculty'],
    default: 'faculty'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  campus: {
    type: String,
    default: 'A Block'
  },
  department: {
    type: String
  },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD'],
    default: 'Lecturer'
  },
  availability: {
    type: Map,
    of: Boolean,
    default: {}
  },
  totalWorkloadHours: {
    type: Number,
    default: 0
  },
  assignedDuties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Allocation'
  }],
  changeRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChangeRequest'
  }],
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

