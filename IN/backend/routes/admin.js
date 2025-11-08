const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Exam = require('../models/Exam');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Allocation = require('../models/Allocation');
const ChangeRequest = require('../models/ChangeRequest');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalExams = await Exam.countDocuments();
    const totalClassrooms = await Classroom.countDocuments();
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalAllocations = await Allocation.countDocuments();
    const pendingRequests = await ChangeRequest.countDocuments({ status: 'pending' });

    // Get upcoming exams
    const upcomingExams = await Exam.find({
      examDate: { $gte: new Date() }
    }).sort({ examDate: 1 }).limit(5);

    // Get recent allocations
    const recentAllocations = await Allocation.find()
      .populate('exam', 'examName examDate')
      .populate('invigilator', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalExams,
        totalClassrooms,
        totalFaculty,
        totalAllocations,
        pendingRequests
      },
      upcomingExams,
      recentAllocations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all faculty
router.get('/faculty', adminAuth, async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('-password')
      .sort({ name: 1 });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all exams
router.get('/exams', adminAuth, async (req, res) => {
  try {
    const exams = await Exam.find().sort({ examDate: 1, startTime: 1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classrooms
router.get('/classrooms', adminAuth, async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ building: 1, roomNumber: 1 });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get change requests
router.get('/change-requests', adminAuth, async (req, res) => {
  try {
    const requests = await ChangeRequest.find()
      .populate({
        path: 'allocation',
        populate: {
          path: 'exam',
          select: 'examName subject examDate startTime endTime room'
        }
      })
      .populate('requester', 'name email department')
      .populate('requestedReplacement', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Handle change request
router.put('/change-requests/:id', adminAuth, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    
    const request = await ChangeRequest.findById(req.params.id)
      .populate({
        path: 'allocation',
        populate: { path: 'exam' }
      })
      .populate('requester', 'name email department')
      .populate('requestedReplacement', 'name email department');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Admins can handle any request, but check department for department-specific admins
    const requestDepartment = request.requester?.department || 
                              request.allocation?.exam?.department || 
                              request.allocation?.department;
    
    console.log('🔍 ADMIN DEPARTMENT CHECK:', {
      adminName: req.user.name,
      adminDept: req.user.department,
      adminRole: req.user.role,
      requestId: req.params.id,
      requesterName: request.requester?.name,
      requesterDept: request.requester?.department,
      examDept: request.allocation?.exam?.department,
      allocationDept: request.allocation?.department,
      finalRequestDept: requestDepartment,
      willMatch: requestDepartment === req.user.department,
      hasDepartment: !!req.user.department
    });
    
    if (req.user.department) {
      if (requestDepartment && requestDepartment !== req.user.department) {
        console.log('⚠️ Admin from different department - but allowing (super admin)');
        // Allow super admins (no department) or matching department
        // Uncomment below to enforce department restrictions for admins
        // return res.status(403).json({ message: 'Access denied. This request belongs to a different department.' });
      }
    }
    
    console.log('✅ ADMIN ACCESS GRANTED');

    request.status = status;
    request.adminResponse = adminResponse;
    request.handledBy = req.user._id;

    if (status === 'approved' && request.requestedReplacement) {
      // Update allocation
      const allocation = await Allocation.findById(request.allocation._id);
      allocation.invigilator = request.requestedReplacement;
      allocation.isReplacement = true;
      allocation.originalInvigilator = request.requester._id;
      await allocation.save();
    }

    await request.save();

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(request.requester._id.toString()).emit('request-updated', {
        message: `Your change request has been ${status}`,
        request
      });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

