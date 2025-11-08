# 🚀 Quick Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Step 1: Clone and Install

```bash
# Install root dependencies (for running both servers)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 2: Configure Backend

1. Navigate to `backend` directory
2. Copy `env.example` to `.env`:
```bash
cp env.example .env
```

3. Edit `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/schedulo
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Step 3: Start MongoDB

Make sure MongoDB is running:
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
```

## Step 4: Create Admin User

```bash
cd backend
npm run create-admin
```

This creates:
- Email: `admin@schedulo.com`
- Password: `admin123`

## Step 5: Start the Application

### Option 1: Run Both Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Option 2: Run Both with Concurrently (from root)

```bash
npm run dev
```

## Step 6: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## Step 7: Login

1. Go to http://localhost:3000
2. Login with admin credentials:
   - Email: `admin@schedulo.com`
   - Password: `admin123`

## Next Steps

1. **Upload Data:**
   - Upload exam timetable (CSV/Excel)
   - Upload classroom details (CSV/Excel)
   - Upload faculty details (CSV/Excel)

2. **Generate Allocations:**
   - Configure allocation settings
   - Generate automatic allocations

3. **Manage:**
   - Review and edit allocations
   - Generate reports
   - Send notifications

## File Upload Formats

### Exam Timetable
```csv
Exam Name,Exam Date,Start Time,End Time,Subject,Room,Capacity
Midterm Exam,2024-01-15,09:00,11:00,Mathematics,Room 101,50
```

### Classroom Details
```csv
Room Number,Building,Capacity,Floor,Facilities
Room 101,Main Building,50,1,Projector,Whiteboard
```

### Faculty Details
```csv
Name,Email,Employee ID,Department,Designation,Password
John Doe,john@example.com,EMP001,Computer Science,Professor,password123
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in `.env` file
- For MongoDB Atlas, use the connection string format: `mongodb+srv://username:password@cluster.mongodb.net/schedulo`

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using the port

### Email Not Sending
- Email configuration is optional
- Configure Gmail App Password for Gmail SMTP
- Or use other email service providers

## Development

- Backend uses nodemon for auto-reload
- Frontend uses React's hot-reload
- Check console for errors

## Production Deployment

1. Build frontend: `cd frontend && npm run build`
2. Set NODE_ENV=production
3. Use process manager like PM2
4. Configure proper MongoDB connection
5. Set secure JWT_SECRET
6. Configure email service

