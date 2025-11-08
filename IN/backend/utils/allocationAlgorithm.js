const Allocation = require('../models/Allocation');
const User = require('../models/User');

/**
 * AI-Based Fair Allocation Algorithm
 * Uses heuristic scoring to balance workload fairly
 */
class AllocationAlgorithm {
  constructor(config = {}) {
    this.maxHoursPerDay = config.maxHoursPerDay || 4;
    this.noSameDayRepetition = config.noSameDayRepetition !== false;
    this.departmentBased = config.departmentBased !== false;
  }

  /**
   * Safely get availability value from Map or plain object
   */
  getAvailabilityValue(availability, key) {
    if (!availability || typeof availability !== 'object') {
      return undefined;
    }
    
    // Check if it's a Map object
    if (availability instanceof Map || (availability.get && typeof availability.get === 'function')) {
      try {
        return availability.get(key);
      } catch (e) {
        // Fall back to object access
        return availability[key];
      }
    }
    
    // It's a plain object
    return availability[key];
  }

  /**
   * Calculate workload score for a faculty member
   */
  calculateWorkloadScore(faculty, allocations, exam) {
    let score = 0;

    // Base score from current workload
    score += (faculty.totalWorkloadHours || 0) * 10;

    // Count allocations on the same day
    const examDate = new Date(exam.examDate);
    const sameDayAllocations = allocations.filter(a => {
      const allocDate = new Date(a.date);
      return allocDate.toDateString() === examDate.toDateString() &&
             a.invigilator.toString() === faculty._id.toString();
    });
    score += sameDayAllocations.length * 50;

    // Designation weight (higher designation = lower priority for more duties)
    const designationWeights = {
      'HOD': 30,
      'Professor': 25,
      'Associate Professor': 20,
      'Assistant Professor': 15,
      'Lecturer': 10
    };
    score += designationWeights[faculty.designation] || 10;

    // Check availability
    const examDateObj = new Date(exam.examDate);
    const dayOfWeek = examDateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    
    // Safely check availability
    const availabilityValue = this.getAvailabilityValue(faculty.availability, dayKey);
    if (availabilityValue === false) {
      score += 1000; // Very high penalty for unavailable
    }

    // Department match bonus (negative score = better)
    if (this.departmentBased && faculty.department === exam.department) {
      score -= 20;
    }

    // Recent duty penalty (avoid assigning same person too frequently)
    const recentAllocations = allocations.filter(a => {
      try {
        const allocDate = new Date(a.date);
        const daysDiff = Math.abs(allocDate - examDateObj) / (1000 * 60 * 60 * 24);
        return a.invigilator.toString() === faculty._id.toString() && daysDiff < 7; // Within 7 days
      } catch (e) {
        return false;
      }
    });
    score += recentAllocations.length * 15;

    return score;
  }

  /**
   * Check if faculty can be assigned (no conflicts)
   */
  canAssign(faculty, allocations, exam) {
    const examDate = new Date(exam.examDate);
    const examStart = this.parseTime(exam.startTime);
    const examEnd = this.parseTime(exam.endTime);

    // Check same day repetition
    if (this.noSameDayRepetition) {
      const sameDayAllocations = allocations.filter(a => {
        const allocDate = new Date(a.date);
        return allocDate.toDateString() === examDate.toDateString() &&
               a.invigilator.toString() === faculty._id.toString();
      });
      if (sameDayAllocations.length > 0) {
        return false;
      }
    }

    // Check time conflicts
    for (const allocation of allocations) {
      if (allocation.invigilator.toString() === faculty._id.toString()) {
        const allocDate = new Date(allocation.date);
        if (allocDate.toDateString() === examDate.toDateString()) {
          const allocStart = this.parseTime(allocation.startTime);
          const allocEnd = this.parseTime(allocation.endTime);

          // Check for overlap - compare time values
          const examStartTime = examStart.getHours() * 60 + examStart.getMinutes();
          const examEndTime = examEnd.getHours() * 60 + examEnd.getMinutes();
          const allocStartTime = allocStart.getHours() * 60 + allocStart.getMinutes();
          const allocEndTime = allocEnd.getHours() * 60 + allocEnd.getMinutes();

          // Check for overlap: not (examEnd <= allocStart || examStart >= allocEnd)
          if (!(examEndTime <= allocStartTime || examStartTime >= allocEndTime)) {
            return false; // Time conflict
          }
        }
      }
    }

    // Check max hours per day
    const sameDayAllocations = allocations.filter(a => {
      const allocDate = new Date(a.date);
      return allocDate.toDateString() === examDate.toDateString() &&
             a.invigilator.toString() === faculty._id.toString();
    });
    let totalHours = 0;
    for (const alloc of sameDayAllocations) {
      const start = this.parseTime(alloc.startTime);
      const end = this.parseTime(alloc.endTime);
      totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    const examHours = (examEnd.getTime() - examStart.getTime()) / (1000 * 60 * 60);
    if (totalHours + examHours > this.maxHoursPerDay) {
      return false;
    }

    return true;
  }

  /**
   * Parse time string to Date object (for comparison)
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Main allocation algorithm
   */
  async allocate(exams, existingAllocations = [], campusFilter = null, departmentFilter = null) {
    const allocations = [];
    const facultyQuery = { role: 'faculty' };
    if (campusFilter && campusFilter.trim() !== '') {
      facultyQuery.campus = campusFilter.trim();
    }
    if (departmentFilter && departmentFilter.trim() !== '') {
      facultyQuery.department = departmentFilter.trim();
    }
    const facultyList = await User.find(facultyQuery).lean();
    
    if (!facultyList || facultyList.length === 0) {
      throw new Error(`No faculty members found${campusFilter ? ` for campus: ${campusFilter}` : ''}${departmentFilter ? ` in department: ${departmentFilter}` : ''}. Please upload faculty data first.`);
    }
    
    console.log(`Found ${facultyList.length} faculty members for allocation`);
    
    // Create a map of existing allocations by invigilator
    const allocationsByFaculty = {};
    for (const alloc of existingAllocations) {
      if (!allocationsByFaculty[alloc.invigilator]) {
        allocationsByFaculty[alloc.invigilator] = [];
      }
      allocationsByFaculty[alloc.invigilator].push(alloc);
    }

    // Sort exams by date and time
    const sortedExams = [...exams].sort((a, b) => {
      const dateA = new Date(a.examDate);
      const dateB = new Date(b.examDate);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    // Allocate each exam
    for (const exam of sortedExams) {
      // Calculate scores for all faculty
      const facultyScores = facultyList.map(faculty => {
        const canAssign = this.canAssign(faculty, [...existingAllocations, ...allocations], exam);
        const score = this.calculateWorkloadScore(faculty, [...existingAllocations, ...allocations], exam);
        
        return {
          faculty,
          score: canAssign ? score : Infinity,
          canAssign
        };
      });

      // Sort by score (lower is better)
      facultyScores.sort((a, b) => a.score - b.score);

      // Find the best available faculty
      let assigned = false;
      for (const { faculty, canAssign, score } of facultyScores) {
        if (canAssign && score !== Infinity) {
          const allocation = {
            exam: exam._id || exam,
            invigilator: faculty._id,
            campus: exam.campus || 'A Block',
            room: exam.room,
            date: new Date(exam.examDate),
            startTime: exam.startTime,
            endTime: exam.endTime,
            workloadScore: facultyScores.find(fs => fs.faculty._id.toString() === faculty._id.toString())?.score || 0
          };
          
          allocations.push(allocation);
          
          // Update allocationsByFaculty for next iterations
          if (!allocationsByFaculty[faculty._id]) {
            allocationsByFaculty[faculty._id] = [];
          }
          allocationsByFaculty[faculty._id].push(allocation);
          
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        console.warn(`Could not assign invigilator for exam: ${exam.examName || exam.subject}`);
      }
    }

    return allocations;
  }
}

module.exports = AllocationAlgorithm;

