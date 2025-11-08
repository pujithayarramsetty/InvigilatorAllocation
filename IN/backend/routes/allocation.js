const express = require('express');
const { adminAuth, facultyAuth } = require('../middleware/auth');
const Allocation = require('../models/Allocation');
const Exam = require('../models/Exam');
const User = require('../models/User');
const AllocationAlgorithm = require('../utils/allocationAlgorithm');
const ConflictDetector = require('../utils/conflictDetector');
const { sendNotificationEmail } = require('../utils/emailService');

const conflictDetector = new ConflictDetector();

const router = express.Router();

// Get all allocations (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate('exam', 'examName examDate startTime endTime subject room')
      .populate('invigilator', 'name email department designation')
      .sort({ date: 1, startTime: 1 });

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get allocations for a specific faculty
router.get('/my-duties', facultyAuth, async (req, res) => {
  try {
    const allocations = await Allocation.find({ invigilator: req.user.id })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .sort({ date: 1, startTime: 1 });

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate allocations (Admin)
router.post('/generate', adminAuth, async (req, res) => {
  try {
    const { config } = req.body;
    
    // Get all exams (with campus filter if provided)
    const examQuery = {};
    if (config?.campus && config.campus.trim() !== '') {
      examQuery.campus = config.campus.trim();
    }
    const exams = await Exam.find(examQuery).sort({ examDate: 1, startTime: 1 });
    
    if (exams.length === 0) {
      return res.status(400).json({ 
        message: `No exams found${config?.campus ? ` for campus: ${config.campus}` : ''}. Please upload exam timetable first.` 
      });
    }
    
    console.log(`Found ${exams.length} exams for allocation`);

    // Get existing allocations
    const existingAllocations = await Allocation.find({ status: { $ne: 'cancelled' } });

    // Initialize algorithm
    const algorithm = new AllocationAlgorithm({
      maxHoursPerDay: config?.maxHoursPerDay || 4,
      noSameDayRepetition: config?.noSameDayRepetition !== false,
      departmentBased: config?.departmentBased !== false
    });

    // Generate allocations (with campus filter if provided)
    let newAllocations = [];
    try {
      newAllocations = await algorithm.allocate(
        exams, 
        existingAllocations,
        config?.campus || null,
        null // departmentFilter - not used in admin allocation
      );
    } catch (error) {
      console.error('Error in allocation algorithm:', error);
      return res.status(400).json({ 
        message: error.message || 'Failed to generate allocations. Please check if you have faculty and exam data uploaded.'
      });
    }
    
    if (newAllocations.length === 0) {
      return res.status(400).json({ 
        message: 'No allocations could be generated. This might be because:\n- No faculty members are available\n- All faculty members have conflicts\n- No exams match the criteria\nPlease check your data and try again.' 
      });
    }
    
    console.log(`Generated ${newAllocations.length} allocations`);

    // Validate allocations for conflicts before saving
    const validatedAllocations = [];
    const conflictReports = [];

    for (const allocation of newAllocations) {
      try {
        // Ensure allocation has required fields for validation
        const allocationForValidation = {
          invigilator: allocation.invigilator,
          date: allocation.date,
          startTime: allocation.startTime,
          endTime: allocation.endTime,
          room: allocation.room,
          campus: allocation.campus
        };
        
        const validation = await conflictDetector.validateAllocation(allocationForValidation);
        if (validation.valid) {
          validatedAllocations.push(allocation);
        } else {
          conflictReports.push({
            allocation,
            conflicts: validation.conflicts
          });
        }
      } catch (error) {
        console.error('Error validating allocation:', error);
        // If validation fails, skip this allocation
        conflictReports.push({
          allocation,
          conflicts: [{ type: 'validation_error', message: error.message }]
        });
      }
    }

    // Save only validated allocations
    let savedAllocations = [];
    if (validatedAllocations.length > 0) {
      try {
        savedAllocations = await Allocation.insertMany(validatedAllocations, { ordered: false });
      } catch (error) {
        // Handle bulk write errors
        if (error.writeErrors) {
          console.error('Some allocations failed to save:', error.writeErrors);
          // Try to save valid ones individually
          for (const allocation of validatedAllocations) {
            try {
              const saved = await Allocation.create(allocation);
              savedAllocations.push(saved);
            } catch (err) {
              console.error('Failed to save allocation:', err.message);
            }
          }
        } else {
          throw error;
        }
      }
    }

    // Emit conflict warnings if any
    if (conflictReports.length > 0) {
      const io = req.app.get('io');
      if (io) {
        io.emit('allocation-conflicts', {
          message: `${conflictReports.length} allocations have conflicts and were not saved`,
          conflicts: conflictReports
        });
      }
    }

    // Update faculty workload
    for (const allocation of savedAllocations) {
      try {
        const faculty = await User.findById(allocation.invigilator);
        if (faculty) {
          const startHours = parseTime(allocation.startTime);
          const endHours = parseTime(allocation.endTime);
          const hours = endHours - startHours;
          if (!isNaN(hours) && hours > 0) {
            faculty.totalWorkloadHours = (faculty.totalWorkloadHours || 0) + hours;
            await faculty.save();
          }
        }
      } catch (error) {
        console.error('Error updating faculty workload:', error);
        // Continue with other allocations
      }
    }

    // Populate and return
    const populatedAllocations = await Allocation.find({ _id: { $in: savedAllocations.map(a => a._id) } })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .populate('invigilator', 'name email department designation');

    // Emit socket notifications to all affected users
    const io = req.app.get('io');
    if (io) {
      // Emit to all admins and exam controllers (broadcast)
      io.to('admin-room').emit('allocation-updated', {
        message: 'New invigilation schedule has been generated',
        count: populatedAllocations.length,
        type: 'allocation-generated'
      });
      io.to('exam-controller-room').emit('allocation-updated', {
        message: 'New invigilation schedule has been generated',
        count: populatedAllocations.length,
        type: 'allocation-generated'
      });
      
      // Also emit globally for any connected admins/exam controllers
      io.emit('allocation-updated', {
        message: 'New invigilation schedule has been generated',
        count: populatedAllocations.length,
        type: 'allocation-generated'
      });
      
      // Emit to each faculty member individually by their user ID
      const facultyIds = [...new Set(populatedAllocations.map(a => {
        const invigilatorId = a.invigilator._id || a.invigilator;
        return invigilatorId.toString();
      }))];
      
      console.log(`Emitting to ${facultyIds.length} faculty members:`, facultyIds);
      
      for (const facultyId of facultyIds) {
        const facultyAllocations = populatedAllocations.filter(a => {
          const invigilatorId = a.invigilator._id || a.invigilator;
          return invigilatorId.toString() === facultyId;
        });
        
        io.to(facultyId).emit('duty-assigned', {
          message: `You have been assigned ${facultyAllocations.length} new invigilation duty/duties`,
          allocations: facultyAllocations,
          count: facultyAllocations.length
        });
        
        console.log(`Emitted duty-assigned to faculty ${facultyId} with ${facultyAllocations.length} allocations`);
      }
    }

    res.json({
      message: 'Allocations generated successfully',
      count: populatedAllocations.length,
      allocations: populatedAllocations,
      conflictsDetected: conflictReports.length,
      conflicts: conflictReports.length > 0 ? conflictReports : undefined
    });
  } catch (error) {
    console.error('Error generating allocations:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to generate allocations',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update allocation (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { invigilator, status } = req.body;
    
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (invigilator) {
      allocation.invigilator = invigilator;
    }
    if (status) {
      allocation.status = status;
    }

    await allocation.save();

    const populated = await Allocation.findById(allocation._id)
      .populate('exam', 'examName examDate startTime endTime subject room')
      .populate('invigilator', 'name email department designation');

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(allocation.invigilator.toString()).emit('duty-updated', {
        message: 'Your invigilation duty has been updated',
        allocation: populated
      });
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete allocation (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    await Allocation.findByIdAndDelete(req.params.id);

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      // Emit to the specific faculty member
      io.to(allocation.invigilator.toString()).emit('duty-cancelled', {
        message: 'Your invigilation duty has been cancelled',
        allocationId: allocation._id
      });
      
      // Also emit to admin/exam controller dashboards
      io.emit('allocation-updated', {
        message: 'An allocation has been cancelled',
        allocationId: allocation._id,
        type: 'allocation-cancelled'
      });
    }

    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get allocation statistics (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalAllocations = await Allocation.countDocuments();
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalExams = await Exam.countDocuments();

    const workloadStats = await Allocation.aggregate([
      {
        $group: {
          _id: '$invigilator',
          count: { $sum: 1 },
          totalHours: { $sum: 1 } // Simplified, should calculate actual hours
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'faculty'
        }
      },
      {
        $unwind: '$faculty'
      },
      {
        $project: {
          name: '$faculty.name',
          department: '$faculty.department',
          count: 1,
          totalHours: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      totalAllocations,
      totalFaculty,
      totalExams,
      workloadStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to parse time and calculate hours
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + (minutes / 60);
}

module.exports = router;

