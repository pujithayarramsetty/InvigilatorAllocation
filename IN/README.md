# 📅 Schedulo - Invigilator Allocation System

A Smart Campus Automation & Scheduling Platform for automated invigilator allocation during exams using AI-assisted fairness allocation, faculty availability, and real-time notifications.

## 🚀 Features

### Admin Module
- **Authentication:** Secure login/logout with JWT
- **File Uploads:** Upload exam timetable, classroom details, and faculty details (CSV/Excel)
- **AI-Based Auto Allocation:** Heuristic scoring algorithm for fair workload distribution
- **Scheduling Algorithm:** Greedy + Weighted Distribution + AI-based balancing
- **🔍 Smart Conflict Detector:** Automatically detect conflicts (same faculty, overlapping time slots) - saves admin time with practical automation
- **🏫 Multi-Campus/Department Mode:** Support multiple campuses/departments with one centralized system - great for scalability
- **Reports & Notifications:** Generate PDF/Excel reports and send email notifications
- **Real-time Updates:** Socket.io notifications for schedule updates
- **Mobile Responsive:** Fully responsive design optimized for mobile devices and Play Store deployment

### Faculty Module
- **Personal Dashboard:** View assigned duties with statistics
- **Duty View:** Daily, Weekly, Monthly, and Calendar-based views
- **Change Requests:** Submit change or replacement requests
- **Real-time Notifications:** Receive live updates when duties are updated
- **Export:** Download personal duty letter as PDF
- **Calendar Export:** Export duties to iCal format for Google Calendar sync
- **Mobile Responsive:** Optimized for mobile access

## 🛠️ Tech Stack

- **Frontend:** React.js (Create React App)
- **Styling:** Pure CSS (Modern, vibrant, professional design)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **File Handling:** Multer + XLSX + Papaparse
- **PDF/Excel Reports:** jsPDF + XLSX
- **Notifications:** Socket.io
- **Email:** Nodemailer

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `env.example`):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/schedulo
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

4. Start the backend server:
```bash
npm start
# or for development
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🔐 Create Admin Account

After setting up MongoDB, create an admin account:

```bash
cd backend
npm run create-admin
```

This will create an admin user with:
- **Email:** admin@schedulo.com
- **Password:** admin123

**⚠️ Important:** Change the password after first login!

## 📝 File Upload Formats

### Exam Timetable (CSV/Excel)
```
Exam Name,Exam Date,Start Time,End Time,Subject,Campus,Room,Capacity
Midterm Exam,2024-01-15,09:00,11:00,Mathematics,Main Campus,Room 101,50
Final Exam,2024-01-20,14:00,16:00,Physics,North Campus,Room 201,60
```

### Classroom Details (CSV/Excel)
```
Campus,Room Number,Building,Capacity,Floor,Facilities
Main Campus,Room 101,Main Building,50,1,Projector,Whiteboard
North Campus,Room 201,Science Block,60,2,Projector,Whiteboard,AC
```

### Faculty Details (CSV/Excel)
```
Name,Email,Employee ID,Campus,Department,Designation,Password
John Doe,john@example.com,EMP001,Main Campus,Computer Science,Professor,password123
Jane Smith,jane@example.com,EMP002,North Campus,Physics,Associate Professor,password123
```

## 🎯 Usage

1. **Login** as Admin
2. **Upload** exam timetable, classrooms, and faculty data
3. **Configure** allocation settings (max hours per day, etc.)
4. **Generate** allocations using AI-based algorithm
5. **Review** and edit allocations if needed
6. **Generate Reports** (PDF/Excel)
7. **Send Notifications** to all faculty members

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/faculty` - Get all faculty
- `GET /api/admin/exams` - Get all exams
- `GET /api/admin/classrooms` - Get all classrooms

### Uploads
- `POST /api/upload/exams` - Upload exam timetable
- `POST /api/upload/classrooms` - Upload classroom details
- `POST /api/upload/faculty` - Upload faculty details

### Allocation
- `GET /api/allocation` - Get all allocations
- `POST /api/allocation/generate` - Generate allocations
- `PUT /api/allocation/:id` - Update allocation
- `DELETE /api/allocation/:id` - Delete allocation

### Conflicts (Smart Conflict Detector)
- `GET /api/conflicts/detect` - Detect all conflicts in the system
- `POST /api/conflicts/check` - Check conflicts for a specific allocation
- `POST /api/conflicts/resolve` - Get conflict resolution suggestions

### Reports
- `GET /api/reports/pdf/all` - Download PDF report
- `GET /api/reports/excel/all` - Download Excel report
- `POST /api/reports/notify-all` - Send email notifications

### Faculty
- `GET /api/faculty/dashboard` - Faculty dashboard
- `GET /api/faculty/duties` - Get faculty duties
- `POST /api/faculty/change-request` - Submit change request
- `GET /api/faculty/change-requests` - Get change requests

### Calendar
- `GET /api/calendar/events` - Get calendar events for faculty
- `GET /api/calendar/export/ical` - Export calendar as iCal format

## 🔧 Configuration

### Allocation Algorithm Configuration
- `maxHoursPerDay`: Maximum invigilation hours per day (default: 4)
- `noSameDayRepetition`: Prevent same-day repetition (default: true)
- `departmentBased`: Department-based allocation (default: false)
- `campus`: Filter allocations by campus (optional, leave empty for all campuses)

## 📧 Email Configuration

Configure email settings in `.env` file. For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

## 🎨 UI Features

- Modern, vibrant gradient design
- **Fully Mobile Responsive** - Optimized for mobile devices and Play Store deployment
- Real-time notifications
- Interactive calendar view
- Smooth animations and transitions
- Professional data tables
- Touch-friendly interface (44px minimum touch targets)
- Responsive sidebar navigation
- Mobile-optimized forms and tables

## 🔍 Smart Conflict Detector

The Smart Conflict Detector automatically identifies scheduling conflicts:

- **Time Conflicts:** Detects overlapping time slots for the same faculty
- **Same-Day Multiple Duties:** Identifies faculty with multiple duties on the same day
- **Real-time Validation:** Validates allocations before saving
- **Conflict Resolution:** Provides suggestions for resolving conflicts
- **Filtering:** Filter conflicts by campus, department, or date range

### How It Works

1. **Automatic Detection:** Scans all allocations for conflicts
2. **Conflict Types:**
   - High Severity: Overlapping time slots (same faculty, same day, overlapping times)
   - Medium Severity: Multiple duties on the same day
3. **Resolution Suggestions:** Provides actionable recommendations
4. **Prevention:** Validates new allocations before saving

## 🏫 Multi-Campus/Department Mode

Support for multiple campuses and departments in a single centralized system:

- **Campus Management:** Assign exams, classrooms, and faculty to specific campuses
- **Department Filtering:** Filter by department for allocation and reporting
- **Centralized Control:** Manage all campuses from one admin dashboard
- **Scalable Architecture:** Designed to handle multiple campuses efficiently
- **Campus-Based Allocation:** Generate allocations for specific campuses
- **Cross-Campus Reporting:** Generate reports filtered by campus

### Benefits

- **Scalability:** Easily add new campuses without system changes
- **Organization:** Keep data organized by campus/department
- **Flexibility:** Support different allocation rules per campus
- **Centralized Management:** One system for all campuses

## 📱 Mobile & Play Store Deployment

The application is fully optimized for mobile devices and ready for Play Store deployment:

- **Responsive Design:** Works seamlessly on all screen sizes (320px to 4K)
- **Touch-Friendly:** All interactive elements meet iOS/Android touch target guidelines (44px minimum)
- **Mobile Navigation:** Collapsible sidebar with mobile-friendly menu
- **Optimized Forms:** Mobile-optimized input fields and buttons
- **Performance:** Optimized for mobile network conditions
- **PWA Ready:** Can be converted to Progressive Web App (PWA) for app-like experience

### Deployment Options

1. **Web App:** Deploy as responsive web application
2. **PWA:** Convert to Progressive Web App for app store-like experience
3. **React Native:** Use React Native for native mobile apps (future enhancement)
4. **Hybrid:** Wrap in Cordova/PhoneGap for native app deployment

## 🚀 Future Features

The following features are planned for future releases:

### Phase 2 - Enhanced Features
- **📱 Mobile App:** Native iOS and Android apps using React Native
- **🔔 Push Notifications:** Native push notifications for mobile devices
- **📊 Advanced Analytics:** Detailed analytics dashboard with charts and insights
- **🤖 Machine Learning:** Enhanced ML-based allocation algorithm
- **📅 Recurring Schedules:** Support for recurring exam schedules
- **🔄 Auto-Replacement:** Automatic replacement suggestions for conflicts
- **📧 SMS Notifications:** SMS alerts in addition to email
- **🌐 Multi-language Support:** Support for multiple languages
- **🔐 Two-Factor Authentication:** Enhanced security with 2FA
- **📱 Offline Mode:** Offline functionality for mobile apps

### Phase 3 - Enterprise Features
- **👥 Role-Based Access Control:** Multiple admin roles with different permissions
- **📈 Workload Analytics:** Advanced workload distribution analytics
- **🔄 Integration APIs:** RESTful APIs for ERP system integration
- **📊 Custom Reports:** Customizable report templates
- **🔍 Advanced Search:** Advanced search and filtering capabilities
- **📝 Audit Logs:** Comprehensive audit trail for all actions
- **🌍 Multi-tenant Support:** Support for multiple organizations
- **💾 Data Export/Import:** Bulk data import/export functionality
- **🔗 Third-party Integrations:** Integration with Google Calendar, Outlook, etc.
- **📱 QR Code Generation:** QR codes for duty verification

### Phase 4 - AI & Automation
- **🤖 AI-Powered Suggestions:** AI suggestions for optimal allocation
- **📊 Predictive Analytics:** Predict exam scheduling needs
- **🔄 Auto-Scheduling:** Fully automated scheduling with AI
- **💬 Chatbot Support:** AI chatbot for user support
- **📈 Performance Optimization:** ML-based performance optimization
- **🎯 Smart Recommendations:** Intelligent recommendations for administrators

### Phase 5 - Collaboration & Communication
- **💬 In-App Messaging:** Direct messaging between admin and faculty
- **📢 Announcements:** System-wide announcements
- **👥 Faculty Groups:** Group management for departments
- **📅 Shared Calendars:** Shared calendar views
- **🔔 Notification Preferences:** Customizable notification preferences
- **📱 Social Features:** Faculty interaction features

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔒 Security

### Backend Vulnerability Status
- ✅ **Fixed:** 2 moderate vulnerabilities (jsPDF, Nodemailer)
- ⚠️ **Remaining:** 3 high vulnerabilities (xlsx package - acceptable risk)
- ℹ️ **Info:** Package funding messages are informational only

### Frontend Vulnerability Status
- ✅ **Fixed:** 2 vulnerabilities (jsPDF/dompurify) - Reduced from 12 to 10!
- ⚠️ **Remaining:** 10 vulnerabilities (8 react-scripts dev dependencies + 2 xlsx - all acceptable risk)
- ℹ️ **Info:** Deprecation warnings from react-scripts are safe to ignore
- ✅ **Production Safe:** All vulnerabilities are dev-only or low-risk

### Security Measures
- Admin-only file uploads (authenticated)
- File type and size validation
- Server-side processing only
- Input validation on all data
- JWT authentication with expiration
- Password hashing (bcrypt)

**For detailed security information, see:**
- `SECURITY_NOTES.md` - Complete security documentation
- `VULNERABILITY_FIX.md` - Backend vulnerability fix guide
- `QUICK_FIX.md` - Backend quick fix instructions
- `frontend/FRONTEND_WARNINGS.md` - Frontend warnings and vulnerabilities
- `frontend/QUICK_FIX_FRONTEND.md` - Frontend quick fix instructions

## 📞 Support

For issues and questions, please open an issue on the repository.

---

Built with ❤️ using MERN Stack | Ready for Play Store Deployment 🚀

