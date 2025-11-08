# 📘 Schedulo - Complete User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Admin User Guide](#admin-user-guide)
4. [Faculty User Guide](#faculty-user-guide)
5. [Workflow: How Admin and Faculty Connect](#workflow-how-admin-and-faculty-connect)
6. [Data Format Specifications](#data-format-specifications)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

**Schedulo** is a Smart Campus Automation & Scheduling Platform that automates invigilator allocation during exams. This guide will help you understand how to use the application effectively as both an Admin and Faculty member.

### Key Features
- 🔍 **Smart Conflict Detector** - Automatically detects scheduling conflicts
- 🏫 **Multi-Campus Support** - Manage multiple campuses from one system
- 📱 **Mobile Responsive** - Works on all devices
- 🤖 **AI-Based Allocation** - Fair workload distribution
- 📊 **Real-time Notifications** - Instant updates via Socket.io

---

## Getting Started

### First Time Setup

1. **Access the Application**
   - Open your web browser
   - Navigate to the application URL (provided by your administrator)
   - You'll see the login page

2. **Login Credentials**
   - **Admin:** Contact your system administrator for credentials
   - **Faculty:** You'll receive login credentials via email after admin creates your account

3. **Initial Login**
   - Enter your email and password
   - Click "Login"
   - You'll be redirected to your dashboard based on your role

---

## Admin User Guide

### Overview
As an Admin, you have full control over the invigilation scheduling system. You can upload data, generate allocations, manage conflicts, and send notifications.

### Admin Dashboard Sections

#### 1. **Dashboard (Home)**
- View system statistics (total exams, faculty, classrooms, allocations)
- See upcoming exams
- View recent allocations
- Monitor pending change requests

#### 2. **Uploads**
Upload three types of data files:

##### A. **Exam Timetable Upload**

**Purpose:** Upload all exam schedules that need invigilators.

**File Format:** CSV or Excel (.xlsx, .xls)

**Required Columns:**
```
Exam Name, Exam Date, Start Time, End Time, Subject, Campus, Room, Capacity
```

**Example Data:**
```csv
Exam Name,Exam Date,Start Time,End Time,Subject,Campus,Room,Capacity
Midterm Mathematics,2024-03-15,09:00,11:00,Mathematics,Main Campus,Room 101,50
Final Physics,2024-03-20,14:00,16:00,Physics,North Campus,Room 201,60
Chemistry Lab,2024-03-18,10:00,12:00,Chemistry,Main Campus,Lab 301,30
```

**Data Requirements:**
- **Exam Name:** Name of the exam (e.g., "Midterm Mathematics")
- **Exam Date:** Date in YYYY-MM-DD format (e.g., 2024-03-15)
- **Start Time:** Time in HH:MM format (24-hour, e.g., 09:00)
- **End Time:** Time in HH:MM format (24-hour, e.g., 11:00)
- **Subject:** Subject name (e.g., "Mathematics")
- **Campus:** Campus name (e.g., "Main Campus", "North Campus")
- **Room:** Room number or identifier (e.g., "Room 101")
- **Capacity:** Maximum number of students (numeric, e.g., 50)

**Optional Columns:**
- Course: Course code or name
- Semester: Semester information

**Steps to Upload:**
1. Go to **Uploads** → **Exam Timetable** tab
2. Click "Choose File" and select your CSV/Excel file
3. Click "Upload File"
4. Wait for confirmation message showing number of exams uploaded

**Common Issues:**
- ❌ **Date format error:** Ensure dates are in YYYY-MM-DD format
- ❌ **Time format error:** Use 24-hour format (09:00, not 9:00 AM)
- ❌ **Missing required fields:** All required columns must be present

---

##### B. **Classroom Details Upload**

**Purpose:** Upload information about all available classrooms/rooms.

**File Format:** CSV or Excel (.xlsx, .xls)

**Required Columns:**
```
Campus, Room Number, Building, Capacity, Floor, Facilities
```

**Example Data:**
```csv
Campus,Room Number,Building,Capacity,Floor,Facilities
Main Campus,Room 101,Main Building,50,1,Projector,Whiteboard
Main Campus,Room 102,Main Building,60,1,Projector,Whiteboard,AC
North Campus,Room 201,Science Block,40,2,Projector,Whiteboard,AC,Computer
North Campus,Lab 301,Science Block,30,3,Projector,Whiteboard,AC,Lab Equipment
```

**Data Requirements:**
- **Campus:** Campus name (must match campus names used in exams)
- **Room Number:** Unique room identifier (e.g., "Room 101", "Lab 301")
- **Building:** Building name (e.g., "Main Building")
- **Capacity:** Maximum seating capacity (numeric)
- **Floor:** Floor number (numeric)
- **Facilities:** Comma-separated list of facilities (e.g., "Projector,Whiteboard,AC")

**Steps to Upload:**
1. Go to **Uploads** → **Classrooms** tab
2. Click "Choose File" and select your CSV/Excel file
3. Click "Upload File"
4. Wait for confirmation message

**Important Notes:**
- Room numbers must be unique within each campus
- Campus names should match those used in exam timetable
- Facilities are optional but recommended

---

##### C. **Faculty Details Upload**

**Purpose:** Upload information about all faculty members who can be assigned as invigilators.

**File Format:** CSV or Excel (.xlsx, .xls)

**Required Columns:**
```
Name, Email, Employee ID, Campus, Department, Designation, Password
```

**Example Data:**
```csv
Name,Email,Employee ID,Campus,Department,Designation,Password
Dr. John Doe,john.doe@university.edu,EMP001,Main Campus,Computer Science,Professor,password123
Dr. Jane Smith,jane.smith@university.edu,EMP002,Main Campus,Mathematics,Associate Professor,password123
Dr. Robert Brown,robert.brown@university.edu,EMP003,North Campus,Physics,Assistant Professor,password123
Ms. Sarah Wilson,sarah.wilson@university.edu,EMP004,Main Campus,Chemistry,Lecturer,password123
```

**Data Requirements:**
- **Name:** Full name of faculty member
- **Email:** Valid email address (used for login and notifications)
- **Employee ID:** Unique employee identifier
- **Campus:** Campus where faculty is based
- **Department:** Department name
- **Designation:** One of: "Professor", "Associate Professor", "Assistant Professor", "Lecturer", "HOD"
- **Password:** Initial password (faculty should change after first login)

**Optional Columns:**
- **Total Workload Hours:** Current workload in hours (numeric)
- **Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday:** Availability (true/false or 1/0)

**Example with Availability:**
```csv
Name,Email,Employee ID,Campus,Department,Designation,Password,Monday,Tuesday,Wednesday,Thursday,Friday
Dr. John Doe,john.doe@university.edu,EMP001,Main Campus,Computer Science,Professor,password123,true,true,true,true,false
```

**Steps to Upload:**
1. Go to **Uploads** → **Faculty** tab
2. Click "Choose File" and select your CSV/Excel file
3. Click "Upload File"
4. Wait for confirmation showing created/updated faculty count

**Important Notes:**
- Email and Employee ID must be unique
- If faculty already exists, their data will be updated
- Passwords should be strong (minimum 6 characters)
- Faculty will receive email notifications with their login credentials

---

#### 3. **Allocation**

##### Generate Allocations

**Purpose:** Automatically assign invigilators to exams using AI-based algorithm.

**Steps:**
1. Go to **Allocation** page
2. Configure allocation settings:
   - **Max Hours Per Day:** Maximum invigilation hours per faculty per day (default: 4)
   - **No Same Day Repetition:** Prevent assigning same faculty multiple times on same day (recommended: enabled)
   - **Department-Based Allocation:** Prefer faculty from same department as exam subject (optional)
   - **Campus Filter:** Generate allocations for specific campus only (leave empty for all campuses)
3. Click **"Generate Allocations"**
4. Wait for the process to complete
5. Review the generated allocations

**What Happens:**
- System automatically assigns faculty to exams
- Smart Conflict Detector validates all allocations
- Conflicts are reported (if any)
- Valid allocations are saved
- Faculty workload is updated

**After Generation:**
- Review allocations in the table
- Check for any conflicts (see Conflicts section)
- Edit or delete allocations if needed
- Send notifications to faculty (see Reports section)

##### Manual Allocation Management

**Edit Allocation:**
- Click on an allocation in the table
- Modify invigilator, status, or other details
- Save changes

**Delete Allocation:**
- Click "Delete" button next to allocation
- Confirm deletion
- Allocation will be removed and faculty workload updated

---

#### 4. **Conflicts (Smart Conflict Detector)**

**Purpose:** Automatically detect and resolve scheduling conflicts.

**How to Use:**
1. Go to **Conflicts** page
2. Click **"🔍 Scan for Conflicts"**
3. View detected conflicts:
   - **High Severity:** Overlapping time slots (same faculty, same day, overlapping times)
   - **Medium Severity:** Multiple duties on same day
4. Filter conflicts by:
   - Campus
   - Department
   - Date range
5. Review conflict details
6. Resolve conflicts:
   - Click "Resolve" button
   - System suggests alternative faculty
   - Manually reassign if needed

**Conflict Types:**

**Time Conflict (High Severity):**
- Same faculty assigned to two exams with overlapping times
- Example: Faculty assigned to Exam A (09:00-11:00) and Exam B (10:00-12:00)

**Same Day Multiple (Medium Severity):**
- Faculty has multiple duties on the same day
- May be acceptable if times don't overlap

**Resolution:**
- System automatically prevents conflicts during allocation generation
- Manual resolution available for existing conflicts
- Suggestions provided for alternative faculty

---

#### 5. **Reports**

##### Generate Reports

**PDF Report:**
1. Go to **Reports** page
2. Click **"Download PDF"**
3. PDF file will be downloaded with complete allocation schedule
4. Includes: Faculty name, exam details, date, time, room, status

**Excel Report:**
1. Go to **Reports** page
2. Click **"Download Excel"**
3. Excel file will be downloaded
4. Can be opened in Excel, Google Sheets, etc.
5. Includes all allocation details in spreadsheet format

##### Send Email Notifications

**Purpose:** Notify all faculty members about their assigned duties.

**Steps:**
1. Go to **Reports** page
2. Click **"Send Notifications"**
3. Confirm the action
4. System sends emails to all faculty with assigned duties
5. View notification status (sent/failed count)

**Email Content:**
- Faculty name
- Exam details (name, date, time, room)
- Subject information
- Link to login and view details

**Important:**
- Ensure email configuration is set up in backend
- Faculty will receive emails at their registered email address
- Check email delivery status in the response

---

## Faculty User Guide

### Overview
As a Faculty member, you can view your assigned invigilation duties, request changes, and export your schedule.

### Faculty Dashboard Sections

#### 1. **Dashboard (Home)**

**What You See:**
- **Total Duties:** Number of invigilation duties assigned to you
- **Upcoming Duties:** Number of future duties
- **Completed Duties:** Number of past duties
- **Pending Requests:** Number of change requests awaiting approval
- **Upcoming Duties List:** Next 5 upcoming duties with details

**Actions:**
- **Download Duty Letter:** Click button to download PDF of your duty schedule
- View detailed statistics
- Quick access to upcoming duties

---

#### 2. **My Duties**

**Purpose:** View all your invigilation duties in different views.

##### View Options:

**All Duties:**
- Shows all duties (past and future)
- Complete list with all details

**Daily View:**
- Shows duties for today only
- Quick view of today's schedule

**Weekly View:**
- Shows duties for next 7 days
- Weekly planning view

**Monthly View:**
- Shows duties for next 30 days
- Monthly overview

##### Calendar View:
- Interactive calendar showing all duties
- Duties marked with numbers on calendar dates
- Click on a date to see duties for that day
- Visual representation of your schedule

##### Export to Calendar:
- Click **"📅 Export to Calendar"** button
- Downloads .ics file (iCal format)
- Import into Google Calendar, Outlook, Apple Calendar, etc.
- Your duties will appear in your personal calendar

**Duty Information Displayed:**
- Exam name/subject
- Date
- Start time - End time
- Room number
- Status (assigned, confirmed, etc.)

---

#### 3. **Change Requests**

**Purpose:** Request changes to your assigned duties.

##### Submit Change Request:

**Steps:**
1. Go to **Change Requests** page
2. Find the duty you want to change in "My Duties - Request Change" section
3. Click **"Request Change"** button
4. Fill in the form:
   - **Reason:** Explain why you need the change (required)
   - **Request Replacement:** Select another faculty member (optional)
5. Click **"Submit Request"**
6. Request is sent to admin for approval

**When to Use:**
- You have a scheduling conflict
- Personal emergency
- Health issues
- Other valid reasons

**Request Status:**
- **Pending:** Waiting for admin approval
- **Approved:** Request approved, duty reassigned
- **Rejected:** Request rejected (admin may provide reason)

##### View Your Requests:

**What You See:**
- All your submitted change requests
- Request details (duty, reason, replacement request)
- Status (pending/approved/rejected)
- Admin response (if any)
- Date submitted

**After Approval/Rejection:**
- You'll receive real-time notification
- Approved requests: Duty is reassigned
- Rejected requests: Original duty remains (check admin response for reason)

---

## Workflow: How Admin and Faculty Connect

### Complete Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN WORKFLOW                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        1. Upload Data (Exams, Classrooms, Faculty)
                            │
                            ▼
        2. Generate Allocations (AI-Based Algorithm)
                            │
                            ▼
        3. Review & Validate (Check Conflicts)
                            │
                            ▼
        4. Send Notifications to Faculty
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  FACULTY WORKFLOW                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        5. Receive Email Notification
                            │
                            ▼
        6. Login & View Duties
                            │
                            ▼
        7. Review Schedule (Calendar View)
                            │
                            ▼
        8. Request Changes (if needed)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN REVIEW & APPROVAL                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        9. Review Change Requests
                            │
                            ▼
        10. Approve/Reject Requests
                            │
                            ▼
        11. Faculty Receives Notification
                            │
                            ▼
        12. Final Schedule Confirmed
```

### Detailed Step-by-Step Workflow

#### Phase 1: Admin Setup (One-Time or Periodic)

**Step 1: Upload Faculty Data**
- Admin uploads faculty details CSV/Excel
- System creates faculty accounts
- Faculty receive login credentials via email
- Faculty can now access the system

**Step 2: Upload Classroom Data**
- Admin uploads classroom details
- System stores room information
- Rooms are available for exam allocation

**Step 3: Upload Exam Timetable**
- Admin uploads exam schedule
- System stores exam details
- Exams are ready for invigilator allocation

#### Phase 2: Allocation Generation (Before Each Exam Period)

**Step 4: Generate Allocations**
- Admin configures allocation settings
- Clicks "Generate Allocations"
- AI algorithm assigns faculty to exams
- Smart Conflict Detector validates allocations
- System saves valid allocations

**Step 5: Review Allocations**
- Admin reviews generated allocations
- Checks for any issues
- Makes manual adjustments if needed

**Step 6: Check Conflicts**
- Admin scans for conflicts
- Resolves any detected conflicts
- Ensures all allocations are valid

**Step 7: Send Notifications**
- Admin generates reports (PDF/Excel)
- Sends email notifications to all faculty
- Faculty receive duty assignments

#### Phase 3: Faculty Response (After Notification)

**Step 8: Faculty Login**
- Faculty receives email notification
- Logs into the system
- Views assigned duties on dashboard

**Step 9: Faculty Review**
- Faculty views duties in calendar
- Checks schedule for conflicts
- Exports to personal calendar
- Downloads duty letter (PDF)

**Step 10: Change Requests (If Needed)**
- Faculty identifies conflicts or issues
- Submits change request with reason
- Optionally suggests replacement faculty
- Request sent to admin

#### Phase 4: Admin Approval (If Changes Requested)

**Step 11: Admin Reviews Requests**
- Admin sees pending change requests
- Reviews reason and replacement suggestion
- Checks availability of replacement faculty
- Makes decision (approve/reject)

**Step 12: Request Processing**
- If approved: Duty reassigned, both faculty notified
- If rejected: Original duty remains, faculty notified with reason
- Real-time notifications sent via Socket.io

#### Phase 5: Final Confirmation

**Step 13: Schedule Finalization**
- All change requests processed
- Final schedule confirmed
- Faculty can view updated duties
- Reports generated for records

### Real-Time Connection Features

#### Socket.io Notifications

**For Faculty:**
- **Duty Updated:** Real-time notification when admin updates your duty
- **Duty Cancelled:** Notification if your duty is cancelled
- **Request Updated:** Notification when change request is approved/rejected
- **New Allocation:** Notification when new duty is assigned

**For Admin:**
- **New Change Request:** Notification when faculty submits change request
- **Allocation Conflicts:** Notification when conflicts are detected
- **System Updates:** Real-time system status updates

#### Email Notifications

**Faculty Receives:**
- Initial duty assignment email
- Change request approval/rejection email
- Duty update notifications
- System announcements

**Admin Receives:**
- Change request notifications
- System alerts
- Conflict warnings

### Communication Flow

```
Admin Action                    Faculty Notification
─────────────────────────────────────────────────────
Generate Allocations    →    Email: Duty Assignment
Update Allocation       →    Real-time: Duty Updated
Approve Change Request  →    Real-time + Email: Request Approved
Reject Change Request   →    Real-time + Email: Request Rejected
Delete Allocation       →    Real-time: Duty Cancelled

Faculty Action                  Admin Notification
─────────────────────────────────────────────────────
Submit Change Request   →    Real-time: New Request
View Duties            →    (No notification - passive action)
```

---

## Data Format Specifications

### Complete Data Examples

#### Exam Timetable (Complete Example)
```csv
Exam Name,Exam Date,Start Time,End Time,Subject,Course,Semester,Campus,Room,Capacity
Midterm Mathematics,2024-03-15,09:00,11:00,Mathematics,CS101,3rd,Main Campus,Room 101,50
Final Physics,2024-03-20,14:00,16:00,Physics,PH201,5th,North Campus,Room 201,60
Chemistry Lab,2024-03-18,10:00,12:00,Chemistry,CH301,2nd,Main Campus,Lab 301,30
English Literature,2024-03-22,11:00,13:00,English,EN101,1st,Main Campus,Room 102,45
```

#### Classroom Details (Complete Example)
```csv
Campus,Room Number,Building,Capacity,Floor,Facilities
Main Campus,Room 101,Main Building,50,1,Projector,Whiteboard
Main Campus,Room 102,Main Building,60,1,Projector,Whiteboard,AC
Main Campus,Lab 301,Science Block,30,3,Projector,Whiteboard,AC,Lab Equipment
North Campus,Room 201,Science Block,40,2,Projector,Whiteboard,AC,Computer
North Campus,Room 202,Science Block,50,2,Projector,Whiteboard,AC
```

#### Faculty Details (Complete Example)
```csv
Name,Email,Employee ID,Campus,Department,Designation,Password,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday,Total Workload Hours
Dr. John Doe,john.doe@university.edu,EMP001,Main Campus,Computer Science,Professor,SecurePass123,true,true,true,true,true,false,false,0
Dr. Jane Smith,jane.smith@university.edu,EMP002,Main Campus,Mathematics,Associate Professor,SecurePass123,true,true,true,true,false,false,false,0
Dr. Robert Brown,robert.brown@university.edu,EMP003,North Campus,Physics,Assistant Professor,SecurePass123,true,true,true,true,true,false,false,0
Ms. Sarah Wilson,sarah.wilson@university.edu,EMP004,Main Campus,Chemistry,Lecturer,SecurePass123,true,true,true,true,false,false,false,0
Dr. Michael Johnson,michael.johnson@university.edu,EMP005,Main Campus,English,Professor,SecurePass123,true,true,true,true,true,false,false,0
```

### Data Validation Rules

#### Exam Data:
- ✅ Date must be valid and in future (for new exams)
- ✅ Start time must be before end time
- ✅ Time format: HH:MM (24-hour)
- ✅ Campus must exist in classroom data
- ✅ Room must exist for that campus
- ✅ Capacity must be positive number

#### Classroom Data:
- ✅ Room number must be unique per campus
- ✅ Capacity must be positive number
- ✅ Floor must be positive number
- ✅ Campus name should be consistent

#### Faculty Data:
- ✅ Email must be unique and valid format
- ✅ Employee ID must be unique
- ✅ Designation must be from allowed list
- ✅ Password minimum 6 characters
- ✅ Campus should match exam/classroom campuses

---

## Troubleshooting

### Common Issues and Solutions

#### For Admin:

**Issue: File Upload Fails**
- ✅ Check file format (CSV or Excel)
- ✅ Verify all required columns are present
- ✅ Check data format (dates, times)
- ✅ Ensure no special characters in data
- ✅ Check file size (max 10MB)

**Issue: Allocations Not Generated**
- ✅ Ensure exams are uploaded
- ✅ Ensure faculty are uploaded
- ✅ Check if faculty are available
- ✅ Verify exam dates are valid
- ✅ Check for sufficient faculty

**Issue: Conflicts Detected**
- ✅ Review conflict details
- ✅ Manually reassign conflicting duties
- ✅ Adjust allocation settings
- ✅ Check faculty availability

**Issue: Email Not Sending**
- ✅ Verify email configuration in backend
- ✅ Check faculty email addresses are valid
- ✅ Ensure email service is configured
- ✅ Check spam folders

#### For Faculty:

**Issue: Cannot Login**
- ✅ Verify email and password
- ✅ Check if account is created by admin
- ✅ Contact admin if account doesn't exist
- ✅ Try password reset (if available)

**Issue: Duties Not Showing**
- ✅ Check if allocations are generated
- ✅ Verify you're assigned to duties
- ✅ Check date filters
- ✅ Refresh the page

**Issue: Change Request Not Approved**
- ✅ Check admin response for reason
- ✅ Ensure valid reason provided
- ✅ Contact admin for clarification
- ✅ Submit new request if needed

**Issue: Calendar Export Not Working**
- ✅ Check browser download settings
- ✅ Try different browser
- ✅ Verify duties are assigned
- ✅ Check file download permissions

### Getting Help

**For Technical Issues:**
- Contact system administrator
- Check application logs
- Review error messages

**For Data Issues:**
- Verify data format
- Check data validation rules
- Contact admin for data corrections

**For Access Issues:**
- Contact admin for account creation
- Request password reset
- Verify role permissions

---

## Best Practices

### For Admin:

1. **Data Preparation:**
   - Prepare data files in advance
   - Validate data before uploading
   - Use consistent naming conventions
   - Keep backup of data files

2. **Allocation:**
   - Generate allocations well in advance
   - Review allocations before sending notifications
   - Resolve conflicts immediately
   - Communicate changes to faculty

3. **Communication:**
   - Send notifications promptly
   - Respond to change requests quickly
   - Provide clear reasons for rejections
   - Keep faculty informed

### For Faculty:

1. **Schedule Management:**
   - Check duties regularly
   - Export to personal calendar
   - Plan ahead for duties
   - Keep duty letter for records

2. **Change Requests:**
   - Submit requests early
   - Provide clear reasons
   - Suggest replacements when possible
   - Follow up if needed

3. **Communication:**
   - Check email regularly
   - Respond to notifications
   - Contact admin for urgent issues
   - Keep contact information updated

---

## Quick Reference

### Admin Quick Actions:
- 📤 **Upload Data:** Uploads → Select tab → Choose file → Upload
- 🤖 **Generate Allocations:** Allocation → Configure → Generate
- 🔍 **Check Conflicts:** Conflicts → Scan for Conflicts
- 📊 **Generate Reports:** Reports → Download PDF/Excel
- 📧 **Send Notifications:** Reports → Send Notifications

### Faculty Quick Actions:
- 📋 **View Duties:** My Duties → Select view (All/Daily/Weekly/Monthly)
- 📅 **Export Calendar:** My Duties → Export to Calendar
- 📄 **Download Duty Letter:** Dashboard → Download Duty Letter
- 📝 **Request Change:** Change Requests → Request Change → Fill form → Submit

---

## Support and Contact

For additional support:
- **System Administrator:** [Your Admin Contact]
- **Technical Support:** [Your Tech Support]
- **Email:** [Your Support Email]

---

**Last Updated:** [Current Date]
**Version:** 1.0.0

---

*This guide covers all major features and workflows. For specific questions or advanced features, please contact your system administrator.*

