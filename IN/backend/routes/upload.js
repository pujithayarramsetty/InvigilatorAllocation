const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminOrExamControllerAuth } = require('../middleware/auth');
const { parseFile } = require('../utils/fileParser');
const Exam = require('../models/Exam');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

const router = express.Router();

// Test endpoint to verify auth is working
router.get('/test-auth', adminOrExamControllerAuth, (req, res) => {
  res.json({ 
    message: 'Auth working!', 
    user: req.user.name, 
    role: req.user.role,
    department: req.user.department 
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
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

// Upload exam timetable
router.post('/exams', adminOrExamControllerAuth, upload.single('file'), async (req, res) => {
  try {
    console.log('=== EXAM UPLOAD REQUEST ===');
    console.log('User:', req.user.name, 'Role:', req.user.role);
    console.log('File received:', req.file ? req.file.originalname : 'NO FILE');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseFile(req.file.path, req.file.originalname);
    
    // Get user's department and campus for exam controllers
    const userDepartment = req.user.role === 'examController' ? req.user.department : null;
    const userCampus = req.user.role === 'examController' ? req.user.campus : null;
    
    // Map CSV/Excel columns to Exam model
    const exams = data.map(row => {
      // Handle different column name variations
      const examDate = row['Exam Date'] || row['examDate'] || row['Date'] || row['date'];
      const startTime = row['Start Time'] || row['startTime'] || row['Start'] || row['start'];
      const endTime = row['End Time'] || row['endTime'] || row['End'] || row['end'];
      const subject = row['Subject'] || row['subject'] || row['Course'] || row['course'];
      const room = row['Room'] || row['room'] || row['Room Number'] || row['roomNumber'];
      const campus = row['Block'] || row['block'] || row['Campus'] || row['campus'] || row['BLOCK'] || row['CAMPUS'] || userCampus || 'Main Block';
      const department = row['Department'] || row['department'] || row['DEPARTMENT'] || row['Dept'] || userDepartment;
      
      return {
        examName: row['Exam Name'] || row['examName'] || subject || 'Exam',
        examDate: new Date(examDate),
        startTime: startTime,
        endTime: endTime,
        subject: subject,
        course: row['Course'] || row['course'] || '',
        semester: row['Semester'] || row['semester'] || '',
        campus: campus,
        department: department,
        room: room,
        capacity: parseInt(row['Capacity'] || row['capacity'] || 0),
        duration: calculateDuration(startTime, endTime)
      };
    }).filter(exam => exam.examDate && exam.startTime && exam.endTime);

    // Save to database
    const savedExams = await Exam.insertMany(exams, { ordered: false });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Exams uploaded successfully',
      count: savedExams.length,
      exams: savedExams
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Upload classroom details
router.post('/classrooms', adminOrExamControllerAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseFile(req.file.path, req.file.originalname);
    
    const classrooms = data.map(row => ({
      campus: row['Block'] || row['block'] || row['Campus'] || row['campus'] || row['BLOCK'] || row['CAMPUS'] || 'Main Block',
      roomNumber: row['Room Number'] || row['roomNumber'] || row['Room'] || row['room'],
      building: row['Building'] || row['building'] || 'Main',
      capacity: parseInt(row['Capacity'] || row['capacity'] || 0),
      floor: parseInt(row['Floor'] || row['floor'] || 1),
      facilities: (row['Facilities'] || row['facilities'] || '').split(',').map(f => f.trim()).filter(f => f),
      isAvailable: row['Available'] !== 'false' && row['available'] !== 'false'
    })).filter(room => room.roomNumber);

    const savedClassrooms = await Classroom.insertMany(classrooms, { ordered: false });

    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Classrooms uploaded successfully',
      count: savedClassrooms.length,
      classrooms: savedClassrooms
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Upload faculty details
router.post('/faculty', adminOrExamControllerAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseFile(req.file.path, req.file.originalname);
    
    // Get user's department and campus for exam controllers
    const userDepartment = req.user.role === 'examController' ? req.user.department : null;
    const userCampus = req.user.role === 'examController' ? req.user.campus : null;
    
    // Debug: Log parsed data
    console.log('Parsed faculty data:', data.length, 'rows');
    if (data.length > 0) {
      console.log('First row sample:', data[0]);
      console.log('Available columns:', Object.keys(data[0]));
    }
    
    if (!data || data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'No data found in file. Please check the file format and ensure it has data rows.',
        created: 0,
        updated: 0,
        errors: 0
      });
    }
    
    const results = {
      created: [],
      updated: [],
      errors: []
    };

    for (const row of data) {
      try {
        // Try multiple column name variations (case-insensitive)
        const email = row['Email'] || row['email'] || row['EMAIL'] || row['E-mail'] || row['e-mail'];
        const employeeId = row['Employee ID'] || row['employeeId'] || row['EmployeeId'] || row['EMPLOYEE ID'] || row['Employee_ID'] || row['ID'];
        const name = row['Name'] || row['name'] || row['NAME'] || row['Full Name'] || row['fullName'] || row['FullName'];
        const campus = row['Block'] || row['block'] || row['Campus'] || row['campus'] || row['BLOCK'] || row['CAMPUS'] || userCampus || 'Main Block';
        const department = row['Department'] || row['department'] || row['DEPARTMENT'] || row['Dept'] || row['dept'] || userDepartment;
        const designation = row['Designation'] || row['designation'] || row['DESIGNATION'] || row['Title'] || row['title'] || 'Lecturer';
        const password = row['Password'] || row['password'] || row['PASSWORD'] || 'defaultPassword123';

        // Skip empty rows
        if (!email && !name && !employeeId) {
          continue; // Skip completely empty rows
        }

        if (!email || !name) {
          results.errors.push({ 
            row: { name, email, employeeId }, 
            error: `Missing required field: ${!email ? 'Email' : ''}${!email && !name ? ' and ' : ''}${!name ? 'Name' : ''}` 
          });
          continue;
        }

        // Parse availability (if provided)
        const availability = new Map();
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
          const dayKey = day.charAt(0).toUpperCase() + day.slice(1);
          const value = row[dayKey] || row[day];
          availability.set(day, value !== 'false' && value !== false && value !== '0');
        });

        const facultyData = {
          name,
          email: email.toLowerCase(),
          password, // Will be hashed by User model's pre-save hook
          role: 'faculty',
          employeeId: employeeId || undefined,
          campus,
          department: department || undefined,
          designation,
          availability,
          totalWorkloadHours: parseFloat(row['Total Workload Hours'] || row['totalWorkloadHours'] || 0) || 0
        };

        // Build query to find existing user
        const query = { email: email.toLowerCase() };
        if (employeeId) {
          query.$or = [{ email: email.toLowerCase() }, { employeeId }];
        }
        
        const existingUser = await User.findOne(query);
        
        if (existingUser) {
          // Update existing user (don't update password unless it's explicitly provided and different)
          existingUser.name = name;
          existingUser.email = email.toLowerCase();
          existingUser.role = 'faculty';
          if (employeeId) existingUser.employeeId = employeeId;
          existingUser.campus = campus;
          if (department) existingUser.department = department;
          existingUser.designation = designation;
          if (facultyData.totalWorkloadHours !== undefined) {
            existingUser.totalWorkloadHours = facultyData.totalWorkloadHours;
          }
          // Only update password if it's provided and different from default
          if (password && password !== 'defaultPassword123') {
            existingUser.password = password; // Will be hashed by pre-save hook
          }
          await existingUser.save();
          results.updated.push({ _id: existingUser._id, name, email });
        } else {
          // Create new user (password will be hashed by pre-save hook)
          const newUser = new User(facultyData);
          await newUser.save();
          results.created.push({ _id: newUser._id, name, email });
        }
      } catch (error) {
        console.error('Error processing faculty row:', error);
        results.errors.push({ 
          row: { name: row['Name'] || row['name'], email: row['Email'] || row['email'] }, 
          error: error.message 
        });
      }
    }

    fs.unlinkSync(req.file.path);

    const totalProcessed = results.created.length + results.updated.length;
    
    res.json({
      message: totalProcessed > 0 
        ? `Faculty data processed successfully` 
        : 'No faculty records were processed. Please check your file format.',
      created: results.created.length,
      updated: results.updated.length,
      errors: results.errors.length,
      totalProcessed: totalProcessed,
      details: process.env.NODE_ENV === 'development' ? results : undefined
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate duration in minutes
function calculateDuration(startTime, endTime) {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const start = new Date();
  start.setHours(startHours, startMinutes, 0, 0);
  const end = new Date();
  end.setHours(endHours, endMinutes, 0, 0);
  return Math.round((end - start) / (1000 * 60));
}

module.exports = router;

