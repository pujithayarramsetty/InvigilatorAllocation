const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schedulo';
mongoose.connect(MONGODB_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`User ${userId} joined room`);
    }
  });

  // Join admin room for broadcast notifications
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log('User joined admin room');
  });

  // Join exam-controller room
  socket.on('join-exam-controller-room', () => {
    socket.join('exam-controller-room');
    console.log('User joined exam-controller room');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/exam-controller', require('./routes/examController'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/allocation', require('./routes/allocation'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/conflicts', require('./routes/conflicts'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Schedulo API is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

