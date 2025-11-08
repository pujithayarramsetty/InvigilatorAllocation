const Allocation = require('../models/Allocation');

/**
 * Smart Conflict Detector
 * Automatically detects conflicts in invigilation schedules
 */
class ConflictDetector {
  /**
   * Parse time string to minutes since midnight
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Check if two time slots overlap
   */
  timeSlotsOverlap(start1, end1, start2, end2) {
    const start1Min = this.timeToMinutes(start1);
    const end1Min = this.timeToMinutes(end1);
    const start2Min = this.timeToMinutes(start2);
    const end2Min = this.timeToMinutes(end2);

    // Check for overlap: not (end1 <= start2 || start1 >= end2)
    return !(end1Min <= start2Min || start1Min >= end2Min);
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * Detect conflicts for a specific allocation
   */
  async detectConflicts(allocation, excludeAllocationId = null) {
    const conflicts = [];
    const allocationDate = new Date(allocation.date);

    // Find all allocations for the same invigilator
    const query = {
      invigilator: allocation.invigilator,
      status: { $ne: 'cancelled' },
      date: {
        $gte: new Date(allocationDate.getFullYear(), allocationDate.getMonth(), allocationDate.getDate()),
        $lt: new Date(allocationDate.getFullYear(), allocationDate.getMonth(), allocationDate.getDate() + 1)
      }
    };

    if (excludeAllocationId) {
      query._id = { $ne: excludeAllocationId };
    }

    const existingAllocations = await Allocation.find(query)
      .populate('exam', 'examName subject');

    // Check for time conflicts
    for (const existing of existingAllocations) {
      if (this.isSameDay(existing.date, allocation.date)) {
        if (this.timeSlotsOverlap(
          allocation.startTime,
          allocation.endTime,
          existing.startTime,
          existing.endTime
        )) {
          conflicts.push({
            type: 'time_conflict',
            severity: 'high',
            message: `Time conflict: Overlapping with ${existing.exam?.examName || existing.exam?.subject} (${existing.startTime} - ${existing.endTime})`,
            conflictingAllocation: existing._id,
            conflictingExam: existing.exam?.examName || existing.exam?.subject,
            conflictingTime: `${existing.startTime} - ${existing.endTime}`,
            conflictingRoom: existing.room
          });
        }
      }
    }

    // Check for same-day multiple assignments (if configured)
    const sameDayCount = existingAllocations.length;
    if (sameDayCount > 0 && !conflicts.some(c => c.type === 'time_conflict')) {
      conflicts.push({
        type: 'same_day_multiple',
        severity: 'medium',
        message: `Faculty has ${sameDayCount} other duty(ies) on the same day`,
        count: sameDayCount
      });
    }

    return conflicts;
  }

  /**
   * Detect all conflicts in the system
   */
  async detectAllConflicts(filters = {}) {
    const allConflicts = [];
    const query = { status: { $ne: 'cancelled' } };

    // Apply filters
    if (filters.campus) {
      query.campus = filters.campus;
    }
    if (filters.department) {
      query.department = filters.department;
    }
    if (filters.dateFrom) {
      query.date = { ...query.date, $gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      query.date = { ...query.date, $lte: new Date(filters.dateTo) };
    }

    const allocations = await Allocation.find(query)
      .populate('invigilator', 'name email department campus')
      .populate('exam', 'examName subject');

    // Group allocations by invigilator and date for efficient checking
    const allocationsByFaculty = {};
    for (const alloc of allocations) {
      const key = `${alloc.invigilator._id}_${alloc.date.toISOString().split('T')[0]}`;
      if (!allocationsByFaculty[key]) {
        allocationsByFaculty[key] = [];
      }
      allocationsByFaculty[key].push(alloc);
    }

    // Check for conflicts within each group
    for (const [key, allocs] of Object.entries(allocationsByFaculty)) {
      if (allocs.length > 1) {
        // Sort by start time
        allocs.sort((a, b) => {
          const timeA = this.timeToMinutes(a.startTime);
          const timeB = this.timeToMinutes(b.startTime);
          return timeA - timeB;
        });

        // Check adjacent allocations for overlaps
        for (let i = 0; i < allocs.length; i++) {
          for (let j = i + 1; j < allocs.length; j++) {
            if (this.timeSlotsOverlap(
              allocs[i].startTime,
              allocs[i].endTime,
              allocs[j].startTime,
              allocs[j].endTime
            )) {
              allConflicts.push({
                type: 'time_conflict',
                severity: 'high',
                faculty: allocs[i].invigilator.name,
                facultyId: allocs[i].invigilator._id,
                date: allocs[i].date,
                allocation1: {
                  id: allocs[i]._id,
                  exam: allocs[i].exam?.examName || allocs[i].exam?.subject,
                  time: `${allocs[i].startTime} - ${allocs[i].endTime}`,
                  room: allocs[i].room
                },
                allocation2: {
                  id: allocs[j]._id,
                  exam: allocs[j].exam?.examName || allocs[j].exam?.subject,
                  time: `${allocs[j].startTime} - ${allocs[j].endTime}`,
                  room: allocs[j].room
                },
                message: `${allocs[i].invigilator.name} has overlapping duties: ${allocs[i].exam?.examName || allocs[i].exam?.subject} (${allocs[i].startTime}-${allocs[i].endTime}) and ${allocs[j].exam?.examName || allocs[j].exam?.subject} (${allocs[j].startTime}-${allocs[j].endTime})`
              });
            }
          }
        }
      }
    }

    return allConflicts;
  }

  /**
   * Validate allocation before saving
   */
  async validateAllocation(allocation, excludeAllocationId = null) {
    const conflicts = await this.detectConflicts(allocation, excludeAllocationId);
    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }
}

module.exports = ConflictDetector;

