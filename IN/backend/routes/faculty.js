const express = require('express');
const { facultyAuth } = require('../middleware/auth');
const Allocation = require('../models/Allocation');
const ChangeRequest = require('../models/ChangeRequest');
const User = require('../models/User');

const router = express.Router();

// Get faculty dashboard
router.get('/dashboard', facultyAuth, async (req, res) => {
  try {
    // Debug: Log user info
    console.log('Faculty dashboard request - User ID:', req.user.id);
    console.log('Faculty dashboard request - User Email:', req.user.email);
    
    // Find allocations by user ID
    let allocations = await Allocation.find({ invigilator: req.user.id })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .populate('invigilator', 'name email')
      .sort({ date: 1, startTime: 1 });

    // Debug: Log allocation count
    console.log(`Found ${allocations.length} allocations for user ${req.user.email} (ID: ${req.user.id})`);
    
    // If no allocations found, check if there's a user ID mismatch
    if (allocations.length === 0) {
      // Check all allocations to see if any have this email
      const allAllocations = await Allocation.find()
        .populate('invigilator', 'name email')
        .populate('exam', 'examName examDate startTime endTime subject room')
        .sort({ date: 1, startTime: 1 });
      
      // Find allocations where invigilator email matches
      const allocationsByEmail = allAllocations.filter(alloc => {
        if (alloc.invigilator && alloc.invigilator.email) {
          return alloc.invigilator.email.toLowerCase() === req.user.email.toLowerCase();
        }
        return false;
      });
      
      if (allocationsByEmail.length > 0) {
        console.log(`Warning: Found ${allocationsByEmail.length} allocations by email match for ${req.user.email}`);
        console.log(`Allocation invigilator IDs:`, allocationsByEmail.map(a => a.invigilator._id));
        console.log(`Current user ID: ${req.user.id}`);
        
        // Update allocations to use correct user ID
        for (const alloc of allocationsByEmail) {
          if (alloc.invigilator._id.toString() !== req.user.id.toString()) {
            console.log(`Updating allocation ${alloc._id} from invigilator ${alloc.invigilator._id} to ${req.user.id}`);
            alloc.invigilator = req.user.id;
            await alloc.save();
          }
        }
        
        // Fetch again with correct ID
        allocations = await Allocation.find({ invigilator: req.user.id })
          .populate('exam', 'examName examDate startTime endTime subject room')
          .populate('invigilator', 'name email')
          .sort({ date: 1, startTime: 1 });
        
        console.log(`After fix: Found ${allocations.length} allocations for user ${req.user.email}`);
      }
    }

    const upcomingDuties = allocations.filter(a => new Date(a.date) >= new Date()).slice(0, 5);
    const pastDuties = allocations.filter(a => new Date(a.date) < new Date()).length;

    const pendingRequests = await ChangeRequest.countDocuments({
      requester: req.user.id,
      status: 'pending'
    });

    res.json({
      totalDuties: allocations.length,
      upcomingDuties: upcomingDuties.length,
      pastDuties,
      pendingRequests,
      duties: allocations
    });
  } catch (error) {
    console.error('Error fetching faculty dashboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get my duties
router.get('/duties', facultyAuth, async (req, res) => {
  try {
    const { view } = req.query; // 'daily', 'weekly', 'monthly', 'all'
    const allocations = await Allocation.find({ invigilator: req.user.id })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .sort({ date: 1, startTime: 1 });

    let filtered = allocations;

    if (view === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = allocations.filter(a => {
        const dutyDate = new Date(a.date);
        return dutyDate >= today && dutyDate < tomorrow;
      });
    } else if (view === 'weekly') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = allocations.filter(a => {
        const dutyDate = new Date(a.date);
        return dutyDate >= today && dutyDate < nextWeek;
      });
    } else if (view === 'monthly') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      filtered = allocations.filter(a => {
        const dutyDate = new Date(a.date);
        return dutyDate >= today && dutyDate < nextMonth;
      });
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create change request
router.post('/change-request', facultyAuth, async (req, res) => {
  try {
    const { allocationId, reason, requestedReplacementId } = req.body;

    const allocation = await Allocation.findById(allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (allocation.invigilator.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only request changes for your own duties' });
    }

    const changeRequest = new ChangeRequest({
      allocation: allocationId,
      requester: req.user.id,
      reason,
      requestedReplacement: requestedReplacementId || null,
      status: 'pending'
    });

    await changeRequest.save();

    // Populate the change request for notification
    await changeRequest.populate([
      { path: 'allocation', populate: { path: 'exam' } },
      { path: 'requester', select: 'name email department' },
      { path: 'requestedReplacement', select: 'name email' }
    ]);

    // Emit socket notification to admin and exam controller room
    const io = req.app.get('io');
    if (io) {
      // Notify admin room
      io.to('admin-room').emit('new-change-request', {
        message: `New change request from ${req.user.name}`,
        request: changeRequest,
        department: req.user.department
      });
      
      // Notify exam controller room (department-specific)
      io.to('exam-controller-room').emit('new-change-request', {
        message: `New change request from ${req.user.name} (${req.user.department})`,
        request: changeRequest,
        department: req.user.department
      });
    }

    res.status(201).json(changeRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my change requests
router.get('/change-requests', facultyAuth, async (req, res) => {
  try {
    const requests = await ChangeRequest.find({ requester: req.user.id })
      .populate('allocation')
      .populate('requestedReplacement', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available faculty for replacement
router.get('/available-faculty', facultyAuth, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;

    // Get all faculty except current user
    const allFaculty = await User.find({
      role: 'faculty',
      _id: { $ne: req.user.id }
    }).select('name email department designation');

    // Filter by availability (simplified - can be enhanced)
    const availableFaculty = allFaculty.filter(faculty => {
      // Check if faculty has availability set for that day
      if (date) {
        const dutyDate = new Date(date);
        const dayOfWeek = dutyDate.getDay();
        const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
        
        // Handle both Map and plain object
        if (faculty.availability) {
          let isUnavailable = false;
          if (faculty.availability instanceof Map || (faculty.availability.get && typeof faculty.availability.get === 'function')) {
            isUnavailable = faculty.availability.get(dayKey) === false;
          } else if (typeof faculty.availability === 'object') {
            isUnavailable = faculty.availability[dayKey] === false;
          }
          if (isUnavailable) {
            return false;
          }
        }
      }
      return true;
    });

    res.json(availableFaculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

