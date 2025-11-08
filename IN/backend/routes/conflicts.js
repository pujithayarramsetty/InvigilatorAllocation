const express = require('express');
const { adminAuth } = require('../middleware/auth');
const ConflictDetector = require('../utils/conflictDetector');
const Allocation = require('../models/Allocation');

const router = express.Router();
const conflictDetector = new ConflictDetector();

// Detect all conflicts in the system
router.get('/detect', adminAuth, async (req, res) => {
  try {
    const { campus, department, dateFrom, dateTo } = req.query;
    
    const filters = {};
    if (campus) filters.campus = campus;
    if (department) filters.department = department;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const conflicts = await conflictDetector.detectAllConflicts(filters);

    res.json({
      totalConflicts: conflicts.length,
      highSeverity: conflicts.filter(c => c.severity === 'high').length,
      mediumSeverity: conflicts.filter(c => c.severity === 'medium').length,
      conflicts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check conflicts for a specific allocation
router.post('/check', adminAuth, async (req, res) => {
  try {
    const { allocationId, allocation } = req.body;

    let allocationData;
    if (allocationId) {
      allocationData = await Allocation.findById(allocationId)
        .populate('invigilator', 'name email')
        .populate('exam', 'examName subject');
      
      if (!allocationData) {
        return res.status(404).json({ message: 'Allocation not found' });
      }
    } else if (allocation) {
      allocationData = allocation;
    } else {
      return res.status(400).json({ message: 'Either allocationId or allocation data is required' });
    }

    const validation = await conflictDetector.validateAllocation(
      allocationData,
      allocationId || null
    );

    res.json(validation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auto-resolve conflicts (suggest solutions)
router.post('/resolve', adminAuth, async (req, res) => {
  try {
    const { conflictIds } = req.body;
    const suggestions = [];

    // Get all conflicts
    const allConflicts = await conflictDetector.detectAllConflicts();
    const selectedConflicts = allConflicts.filter(c => 
      conflictIds.includes(c.allocation1?.id?.toString()) || 
      conflictIds.includes(c.allocation2?.id?.toString())
    );

    for (const conflict of selectedConflicts) {
      if (conflict.type === 'time_conflict') {
        // Suggest alternative faculty for one of the allocations
        const allocation1 = await Allocation.findById(conflict.allocation1.id)
          .populate('exam', 'examName subject')
          .populate('invigilator', 'name department campus');
        
        const allocation2 = await Allocation.findById(conflict.allocation2.id)
          .populate('exam', 'examName subject')
          .populate('invigilator', 'name department campus');

        suggestions.push({
          conflictId: conflict.allocation1.id,
          type: 'reassign',
          message: `Consider reassigning ${allocation1.exam?.examName || allocation1.exam?.subject} to another faculty`,
          currentFaculty: allocation1.invigilator.name,
          alternativeAction: 'Find available faculty for this time slot'
        });

        suggestions.push({
          conflictId: conflict.allocation2.id,
          type: 'reassign',
          message: `Consider reassigning ${allocation2.exam?.examName || allocation2.exam?.subject} to another faculty`,
          currentFaculty: allocation2.invigilator.name,
          alternativeAction: 'Find available faculty for this time slot'
        });
      }
    }

    res.json({
      suggestions,
      message: 'Conflict resolution suggestions generated'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

