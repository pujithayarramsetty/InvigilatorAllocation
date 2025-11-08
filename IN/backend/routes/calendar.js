const express = require('express');
const { auth, adminAuth, facultyAuth } = require('../middleware/auth');
const Allocation = require('../models/Allocation');

const router = express.Router();

// Google Calendar integration endpoints (Optional)
// These are placeholder endpoints for Google Calendar API integration

// Get calendar events for faculty
router.get('/events', facultyAuth, async (req, res) => {
  try {
    const allocations = await Allocation.find({ invigilator: req.user.id })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .sort({ date: 1, startTime: 1 });

    // Format as calendar events (iCal format or JSON)
    const events = allocations.map(alloc => ({
      id: alloc._id,
      title: `Invigilation: ${alloc.exam.examName || alloc.exam.subject}`,
      start: new Date(`${alloc.date.toISOString().split('T')[0]}T${alloc.startTime}`),
      end: new Date(`${alloc.date.toISOString().split('T')[0]}T${alloc.endTime}`),
      location: alloc.room,
      description: `Subject: ${alloc.exam.subject}\nRoom: ${alloc.room}`,
      allDay: false
    }));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export calendar as iCal format
router.get('/export/ical', facultyAuth, async (req, res) => {
  try {
    const allocations = await Allocation.find({ invigilator: req.user.id })
      .populate('exam', 'examName examDate startTime endTime subject room')
      .sort({ date: 1, startTime: 1 });

    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//Schedulo//Invigilation System//EN\n';
    ical += 'CALSCALE:GREGORIAN\n';
    ical += 'METHOD:PUBLISH\n';

    allocations.forEach(alloc => {
      const start = new Date(`${alloc.date.toISOString().split('T')[0]}T${alloc.startTime}`);
      const end = new Date(`${alloc.date.toISOString().split('T')[0]}T${alloc.endTime}`);
      
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${alloc._id}@schedulo\n`;
      ical += `DTSTART:${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ical += `DTEND:${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ical += `SUMMARY:Invigilation: ${alloc.exam.examName || alloc.exam.subject}\n`;
      ical += `DESCRIPTION:Subject: ${alloc.exam.subject}\\nRoom: ${alloc.room}\n`;
      ical += `LOCATION:${alloc.room}\n`;
      ical += 'END:VEVENT\n';
    });

    ical += 'END:VCALENDAR\n';

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename=invigilation-schedule.ics`);
    res.send(ical);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google Calendar OAuth callback (placeholder)
router.get('/oauth/callback', auth, async (req, res) => {
  // This would handle Google Calendar OAuth callback
  // Implementation depends on Google Calendar API setup
  res.json({ message: 'Google Calendar integration endpoint (to be implemented)' });
});

module.exports = router;

