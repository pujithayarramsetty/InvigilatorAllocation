const express = require('express');
const { adminAuth, facultyAuth } = require('../middleware/auth');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const Exam = require('../models/Exam');
const jsPDF = require('jspdf');
const autoTable = require('jspdf-autotable');
const XLSX = require('xlsx');

const router = express.Router();

// Generate PDF report (Admin - All allocations)
router.get('/pdf/all', adminAuth, async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate('exam', 'examName examDate startTime endTime subject room')
      .populate('invigilator', 'name email department designation')
      .sort({ date: 1, startTime: 1 });

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('Schedulo - Invigilation Schedule Report', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Allocations: ${allocations.length}`, 14, 37);

    // Table data
    const tableData = allocations.map(alloc => [
      alloc.invigilator.name,
      alloc.invigilator.department,
      alloc.exam.examName || alloc.exam.subject,
      new Date(alloc.date).toLocaleDateString(),
      alloc.startTime,
      alloc.endTime,
      alloc.campus || alloc.exam.campus || 'N/A',
      alloc.room,
      alloc.status
    ]);

    autoTable(doc, {
      head: [['Faculty', 'Department', 'Exam', 'Date', 'Start', 'End', 'Block', 'Room', 'Status']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [102, 126, 234] }
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invigilation-schedule.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate Excel report (Admin - All allocations)
router.get('/excel/all', adminAuth, async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate('exam', 'examName examDate startTime endTime subject room')
      .populate('invigilator', 'name email department designation')
      .sort({ date: 1, startTime: 1 });

    const workbook = XLSX.utils.book_new();
    
    const data = allocations.map(alloc => ({
      'Faculty Name': alloc.invigilator.name,
      'Email': alloc.invigilator.email,
      'Department': alloc.invigilator.department,
      'Designation': alloc.invigilator.designation,
      'Exam Name': alloc.exam.examName || alloc.exam.subject,
      'Subject': alloc.exam.subject,
      'Date': new Date(alloc.date).toLocaleDateString(),
      'Start Time': alloc.startTime,
      'End Time': alloc.endTime,
      'Block': alloc.campus || alloc.exam.campus || 'N/A',
      'Room': alloc.room,
      'Status': alloc.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invigilation Schedule');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=invigilation-schedule.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate personal duty letter PDF (Faculty)
router.get('/pdf/my-duties', facultyAuth, async (req, res) => {
  try {
    const allocations = await Allocation.find({ invigilator: req.user.id })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .sort({ date: 1, startTime: 1 });

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('Invigilation Duty Letter', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Faculty: ${req.user.name}`, 14, 35);
    doc.text(`Department: ${req.user.department || 'N/A'}`, 14, 42);
    doc.text(`Employee ID: ${req.user.employeeId || 'N/A'}`, 14, 49);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 56);

    if (allocations.length === 0) {
      doc.text('No duties assigned.', 14, 70);
    } else {
      const tableData = allocations.map(alloc => [
        alloc.exam.examName || alloc.exam.subject,
        new Date(alloc.date).toLocaleDateString(),
        alloc.startTime,
        alloc.endTime,
        alloc.campus || alloc.exam.campus || 'N/A',
        alloc.room,
        alloc.status
      ]);

      autoTable(doc, {
        head: [['Exam', 'Date', 'Start', 'End', 'Block', 'Room', 'Status']],
        body: tableData,
        startY: 65,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [102, 126, 234] }
      });
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=duty-letter-${req.user.employeeId || req.user._id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send email notifications to all faculty (Admin)
router.post('/notify-all', adminAuth, async (req, res) => {
  try {
    const { sendNotificationEmail, sendAllocationEmail } = require('../utils/emailService');
    
    const allocations = await Allocation.find({ status: 'assigned' })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .populate('invigilator', 'name email department designation');

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const allocation of allocations) {
      try {
        const result = await sendAllocationEmail(allocation.invigilator, allocation);
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ email: allocation.invigilator.email, error: result.message });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ email: allocation.invigilator.email, error: error.message });
      }
    }

    res.json({
      message: 'Email notifications processed',
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

