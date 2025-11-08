const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  allocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Allocation',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  requestedReplacement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    type: String
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);

