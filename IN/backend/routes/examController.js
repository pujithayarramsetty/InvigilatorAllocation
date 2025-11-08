const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, examControllerAuth } = require('../middleware/auth');
const { parseFile } = require('../utils/fileParser');
const Exam = require('../models/Exam');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const ChangeRequest = require('../models/ChangeRequest');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Get exam controller dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'examController' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const department = req.user.department;
    const campus = req.user.campus;

    // Get department-specific stats
    const totalExams = await Exam.countDocuments({ 
      department: department,
      campus: campus 
    });
    
    // Get exams for department
    const departmentExams = await Exam.find({ department, campus }).select('_id').lean();
    const examIds = departmentExams.map(e => e._id);
    
    const totalAllocations = await Allocation.countDocuments({
      exam: { $in: examIds },
      campus: campus
    });

    const pendingRequests = await ChangeRequest.countDocuments({
      status: 'pending',
      exam: { $in: examIds }
    });

    const totalFaculty = await User.countDocuments({
      role: 'faculty',
      department: department,
      campus: campus
    });

    // Get recent exams
    const recentExams = await Exam.find({
      department: department,
      campus: campus
    })
    .sort({ examDate: -1 })
    .limit(5)
    .lean();

    // Get pending change requests
    const changeRequests = await ChangeRequest.find({
      status: 'pending',
      'exam.department': department
    })
    .populate('requester', 'name email')
    .populate('exam', 'subject examDate startTime endTime')
    .limit(5)
    .lean();

    res.json({
      stats: {
        totalExams,
        totalAllocations,
        pendingRequests,
        totalFaculty
      },
      recentExams,
      changeRequests,
      department,
      campus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get department exams
router.get('/exams', auth, async (req, res) => {
  try {
    if (req.user.role !== 'examController' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const department = req.user.department;
    const campus = req.user.campus;
    const { status, startDate, endDate } = req.query;

    const query = { department, campus };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    }

    const exams = await Exam.find(query).sort({ examDate: 1 }).lean();
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get department allocations
router.get('/allocations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'examController' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const department = req.user.department;
    const campus = req.user.campus;

    // Get department exams first
    const departmentExams = await Exam.find({ department, campus }).select('_id').lean();
    const examIds = departmentExams.map(e => e._id);

    const allocations = await Allocation.find({
      exam: { $in: examIds },
      campus: campus
    })
    .populate('exam', 'subject examDate startTime endTime room department')
    .populate('invigilator', 'name email employeeId')
    .sort({ date: 1 })
    .lean();

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate allocations for department
router.post('/allocations/generate', examControllerAuth, async (req, res) => {
  try {
    const department = req.user.department;
    const campus = req.user.campus;
    const { config } = req.body;

    console.log('=== ALLOCATION GENERATION STARTED ===');
    console.log('User:', req.user.name);
    console.log('Department:', department);
    console.log('Campus:', campus);
    console.log('Config:', config);

    // Get department exams (don't filter by status to allow all exams)
    const examQuery = {
      department: department,
      campus: campus
    };
    console.log('Exam query:', examQuery);
    
    const exams = await Exam.find(examQuery).sort({ examDate: 1, startTime: 1 });
    console.log(`Found ${exams.length} exams for ${department} department`);

    if (exams.length === 0) {
      console.log('ERROR: No exams found');
      return res.status(400).json({ message: `No exams found for ${department} department in ${campus}. Please upload exam timetable first.` });
    }

    // Check for faculty
    const facultyCount = await User.countDocuments({ 
      role: 'faculty',
      department: department,
      campus: campus
    });
    console.log(`Found ${facultyCount} faculty members for ${department} department in ${campus}`);

    // Get existing allocations
    const existingAllocations = await Allocation.find({ status: { $ne: 'cancelled' } });

    // Initialize allocation algorithm with config
    const AllocationAlgorithm = require('../utils/allocationAlgorithm');
    const ConflictDetector = require('../utils/conflictDetector');
    const conflictDetector = new ConflictDetector();
    
    const algorithm = new AllocationAlgorithm({
      maxHoursPerDay: config?.maxHoursPerDay || 4,
      noSameDayRepetition: config?.noSameDayRepetition !== false,
      departmentBased: config?.departmentBased !== false
    });
    
    // Generate allocations for department
    let newAllocations = [];
    try {
      newAllocations = await algorithm.allocate(
        exams,
        existingAllocations,
        campus,
        department
      );
    } catch (error) {
      console.error('Error in allocation algorithm:', error);
      return res.status(400).json({ 
        message: error.message || 'Failed to generate allocations. Please check if you have faculty data uploaded.'
      });
    }

    if (newAllocations.length === 0) {
      console.log('ERROR: No allocations generated');
      return res.status(400).json({ 
        message: `No allocations could be generated. This might be because:\n• No faculty members found for ${department} department in ${campus}\n• All faculty members have scheduling conflicts\n• Please upload faculty data first\n\nFound: ${exams.length} exams, ${facultyCount} faculty members` 
      });
    }

    console.log(`Generated ${newAllocations.length} allocations`);

    // Validate allocations for conflicts before saving
    const validatedAllocations = [];
    const conflictReports = [];

    for (const allocation of newAllocations) {
      try {
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
        if (error.writeErrors) {
          console.error('Some allocations failed to save:', error.writeErrors);
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
      }
    }

    // Populate and return
    const populatedAllocations = await Allocation.find({ _id: { $in: savedAllocations.map(a => a._id) } })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .populate('invigilator', 'name email department designation');

    // Emit socket notifications
    const io = req.app.get('io');
    if (io) {
      // Emit to exam controllers
      io.to('exam-controller-room').emit('allocation-updated', {
        message: `New invigilation schedule generated for ${department}`,
        count: populatedAllocations.length,
        type: 'allocation-generated',
        department: department
      });
      
      // Emit to each faculty member
      const facultyIds = [...new Set(populatedAllocations.map(a => {
        const invigilatorId = a.invigilator._id || a.invigilator;
        return invigilatorId.toString();
      }))];
      
      console.log(`Emitting to ${facultyIds.length} faculty members`);
      
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
      }
    }

    res.json({
      message: `Generated ${populatedAllocations.length} allocations for ${department} department`,
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

// Helper function to parse time
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + (minutes / 60);
}

// Update allocation (Exam Controller)
router.put('/allocations/:id', examControllerAuth, async (req, res) => {
  try {
    const { invigilator, status } = req.body;
    const department = req.user.department;
    
    const allocation = await Allocation.findById(req.params.id)
      .populate('exam', 'department');
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    // Verify allocation belongs to exam controller's department
    if (allocation.exam.department !== department && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. This allocation belongs to a different department.' });
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

// Delete allocation (Exam Controller)
router.delete('/allocations/:id', examControllerAuth, async (req, res) => {
  try {
    const department = req.user.department;
    
    const allocation = await Allocation.findById(req.params.id)
      .populate('exam', 'department');
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    // Verify allocation belongs to exam controller's department
    if (allocation.exam.department !== department && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. This allocation belongs to a different department.' });
    }

    await Allocation.findByIdAndDelete(req.params.id);

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(allocation.invigilator.toString()).emit('duty-cancelled', {
        message: 'Your invigilation duty has been cancelled',
        allocationId: allocation._id
      });
      
      io.to('exam-controller-room').emit('allocation-updated', {
        message: 'An allocation has been cancelled',
        allocationId: allocation._id,
        type: 'allocation-cancelled',
        department: department
      });
    }

    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get change requests for department
router.get('/change-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'examController' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const department = req.user.department;
    const { status } = req.query;

    // Get all change requests and populate allocation
    let query = {};
    if (status && status !== 'all') query.status = status;

    const requests = await ChangeRequest.find(query)
      .populate({
        path: 'allocation',
        populate: {
          path: 'exam',
          select: 'subject examName examDate startTime endTime room department campus'
        }
      })
      .populate('requester', 'name email employeeId department')
      .populate('requestedReplacement', 'name email department')
      .sort({ createdAt: -1 })
      .lean();

    // Filter by department
    const filteredRequests = requests.filter(req => {
      return req.allocation?.exam?.department === department || 
             req.requester?.department === department;
    });

    res.json(filteredRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve/Reject change request
router.put('/change-requests/:id', examControllerAuth, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const department = req.user.department;

    const request = await ChangeRequest.findById(req.params.id)
      .populate({
        path: 'allocation',
        populate: { path: 'exam' }
      })
      .populate('requester', 'name email department')
      .populate('requestedReplacement', 'name email department');

    if (!request) {
      return res.status(404).json({ message: 'Change request not found' });
    }

    // Verify the request belongs to exam controller's department
    // Check requester's department OR exam's department OR allocation's department
    const requestDepartment = request.requester?.department || 
                              request.allocation?.exam?.department || 
                              request.allocation?.department;
    
    console.log('🔍 DEPARTMENT CHECK:', {
      examControllerName: req.user.name,
      examControllerDept: department,
      examControllerRole: req.user.role,
      requestId: req.params.id,
      requesterName: request.requester?.name,
      requesterDept: request.requester?.department,
      examDept: request.allocation?.exam?.department,
      allocationDept: request.allocation?.department,
      finalRequestDept: requestDepartment,
      willMatch: requestDepartment === department,
      isAdmin: req.user.role === 'admin'
    });
    
    if (requestDepartment !== department && req.user.role !== 'admin') {
      console.log('❌ ACCESS DENIED - Department mismatch!');
      return res.status(403).json({ 
        message: 'Access denied. This request belongs to a different department.',
        debug: {
          yourDepartment: department,
          requestDepartment: requestDepartment
        }
      });
    }
    
    console.log('✅ ACCESS GRANTED - Department match or admin override');

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    request.status = status;
    request.adminResponse = adminResponse || '';
    request.handledBy = req.user._id;
    await request.save();

    if (status === 'approved' && request.requestedReplacement) {
      // Update allocation with new invigilator
      const allocation = await Allocation.findById(request.allocation._id);
      if (allocation) {
        allocation.invigilator = request.requestedReplacement._id;
        allocation.isReplacement = true;
        allocation.originalInvigilator = request.requester._id;
        await allocation.save();
      }
    }

    // Send email notification to faculty
    const { sendNotificationEmail } = require('../utils/emailService');
    const subject = `Change Request ${status.charAt(0).toUpperCase() + status.slice(1)} - Schedulo`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${status === 'approved' ? '#10b981' : '#ef4444'}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .status { font-size: 24px; font-weight: bold; color: ${status === 'approved' ? '#10b981' : '#ef4444'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Schedulo - Change Request Update</h1>
          </div>
          <div class="content">
            <p>Dear ${request.requester.name},</p>
            <p>Your change request has been <span class="status">${status.toUpperCase()}</span></p>
            <p><strong>Exam:</strong> ${request.allocation.exam.examName || request.allocation.exam.subject}</p>
            <p><strong>Date:</strong> ${new Date(request.allocation.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${request.allocation.startTime} - ${request.allocation.endTime}</p>
            ${adminResponse ? `<p><strong>Response:</strong> ${adminResponse}</p>` : ''}
            ${status === 'approved' && request.requestedReplacement ? `<p><strong>Replacement:</strong> ${request.requestedReplacement.name}</p>` : ''}
            <p>Please log in to your Schedulo account for more details.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await sendNotificationEmail(request.requester.email, subject, html);

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(request.requester._id.toString()).emit('request-updated', {
        message: `Your change request has been ${status}`,
        request
      });
    }

    res.json({ message: `Change request ${status}`, request });
  } catch (error) {
    console.error('Error updating change request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get department faculty
router.get('/faculty', auth, async (req, res) => {
  try {
    if (req.user.role !== 'examController' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const department = req.user.department;
    const campus = req.user.campus;

    const faculty = await User.find({
      role: 'faculty',
      department: department,
      campus: campus
    })
    .select('name email employeeId designation totalWorkloadHours')
    .lean();

    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint to verify upload routes are working
router.get('/upload/test', auth, (req, res) => {
  res.json({ 
    message: 'Upload routes are working!',
    user: req.user.name,
    role: req.user.role,
    department: req.user.department
  });
});

// Upload exam timetable for department
router.post('/upload/exams', examControllerAuth, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload exams request received');
    console.log('User:', req.user.name, 'Department:', req.user.department);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);
    
    const department = req.user.department;
    const campus = req.user.campus;

    const data = parseFile(req.file.path, req.file.originalname);
    console.log('Parsed data rows:', data.length);
    
    if (!data || data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'No data found in file' });
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const row of data) {
      try {
        // Map column names (case-insensitive)
        const examName = row['Exam Name'] || row['examName'] || row['exam name'] || row['EXAM NAME'];
        const subject = row['Subject'] || row['subject'] || row['SUBJECT'] || row['Course'] || row['course'];
        const examDate = row['Exam Date'] || row['examDate'] || row['Date'] || row['date'];
        const startTime = row['Start Time'] || row['startTime'] || row['Start'] || row['start'];
        const endTime = row['End Time'] || row['endTime'] || row['End'] || row['end'];
        const room = row['Room'] || row['room'] || row['Room Number'] || row['roomNumber'];
        const block = row['Block'] || row['block'] || row['Campus'] || row['campus'] || row['BLOCK'] || row['CAMPUS'];
        const course = row['Course'] || row['course'];
        const semester = row['Semester'] || row['semester'];
        const capacity = row['Capacity'] || row['capacity'];

        if (!subject || !examDate || !startTime || !endTime || !room) {
          errors.push({ row, error: 'Missing required fields' });
          continue;
        }

        const examData = {
          examName: examName || subject,
          subject,
          examDate: new Date(examDate),
          startTime,
          endTime,
          room,
          campus: block || campus,
          department: department, // Force department
          course,
          semester,
          capacity: capacity ? parseInt(capacity) : undefined
        };

        const exam = await Exam.create(examData);
        created++;
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: `Upload successful! ${created} exams created.`,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Upload faculty data for department
router.post('/upload/faculty', examControllerAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const department = req.user.department;
    const campus = req.user.campus;

    const data = parseFile(req.file.path, req.file.originalname);
    
    if (!data || data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'No data found in file' });
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const row of data) {
      try {
        const name = row['Name'] || row['name'] || row['NAME'] || row['Full Name'] || row['fullName'];
        const email = row['Email'] || row['email'] || row['EMAIL'] || row['E-mail'];
        const employeeId = row['Employee ID'] || row['employeeId'] || row['EmployeeId'] || row['EMPLOYEE ID'] || row['ID'];
        const block = row['Block'] || row['block'] || row['Campus'] || row['campus'] || row['BLOCK'] || row['CAMPUS'];
        const dept = row['Department'] || row['department'] || row['DEPARTMENT'] || row['Dept'];
        const designation = row['Designation'] || row['designation'] || row['DESIGNATION'] || row['Title'];
        const password = row['Password'] || row['password'] || 'defaultPassword123';

        if (!name || !email) {
          errors.push({ row, error: 'Missing required fields (Name, Email)' });
          continue;
        }

        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });

        const userData = {
          name,
          email: email.toLowerCase(),
          role: 'faculty',
          employeeId,
          campus: block || campus,
          department: dept || department, // Use uploaded department or default to exam controller's
          designation: designation || 'Lecturer'
        };

        if (user) {
          // Update existing user
          Object.assign(user, userData);
          await user.save();
          updated++;
        } else {
          // Create new user
          userData.password = password;
          user = await User.create(userData);
          created++;
        }
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: `Upload successful! ${created} faculty created, ${updated} updated.`,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Upload classroom data
router.post('/upload/classrooms', examControllerAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const campus = req.user.campus;

    const data = parseFile(req.file.path, req.file.originalname);
    
    if (!data || data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'No data found in file' });
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const row of data) {
      try {
        const roomNumber = row['Room Number'] || row['roomNumber'] || row['Room'] || row['room'];
        const block = row['Block'] || row['block'] || row['Campus'] || row['campus'] || row['BLOCK'] || row['CAMPUS'];
        const capacity = row['Capacity'] || row['capacity'];
        const floor = row['Floor'] || row['floor'];
        const facilities = row['Facilities'] || row['facilities'];
        const available = row['Available'] || row['available'];

        if (!roomNumber) {
          errors.push({ row, error: 'Missing required field: Room Number' });
          continue;
        }

        // Check if classroom exists
        let classroom = await Classroom.findOne({ roomNumber, campus: block || campus });

        const classroomData = {
          roomNumber,
          campus: block || campus,
          capacity: capacity ? parseInt(capacity) : undefined,
          floor: floor ? parseInt(floor) : undefined,
          facilities: facilities ? facilities.split(',').map(f => f.trim()) : [],
          available: available !== undefined ? (available === 'TRUE' || available === true || available === '1') : true
        };

        if (classroom) {
          // Update existing classroom
          Object.assign(classroom, classroomData);
          await classroom.save();
          updated++;
        } else {
          // Create new classroom
          classroom = await Classroom.create(classroomData);
          created++;
        }
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: `Upload successful! ${created} classrooms created, ${updated} updated.`,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${error.message}` });
  } else if (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: error.message || 'Upload failed' });
  }
  next();
});

module.exports = router;

