const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  campus: {
    type: String,
    default: 'Main Campus'
  },
  roomNumber: {
    type: String,
    required: true
  },
  building: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  floor: {
    type: Number
  },
  facilities: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for campus and roomNumber
classroomSchema.index({ campus: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Classroom', classroomSchema);

