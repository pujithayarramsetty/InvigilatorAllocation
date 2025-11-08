const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  invigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campus: {
    type: String,
    default: 'A Block'
  },
  room: {
    type: String,
    required: true
  },
  date: {
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
  status: {
    type: String,
    enum: ['assigned', 'confirmed', 'replaced', 'cancelled'],
    default: 'assigned'
  },
  workloadScore: {
    type: Number,
    default: 0
  },
  isReplacement: {
    type: Boolean,
    default: false
  },
  originalInvigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
allocationSchema.index({ invigilator: 1, date: 1 });
allocationSchema.index({ exam: 1 });

module.exports = mongoose.model('Allocation', allocationSchema);

