const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  course: {
    type: String
  },
  semester: {
    type: String
  },
  campus: {
    type: String,
    default: 'A Block'
  },
  room: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in minutes
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);

