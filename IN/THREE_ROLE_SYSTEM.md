# Three-Role System Implementation

## Overview

Schedulo now supports **three distinct user roles** with different permissions and responsibilities:

1. **👨‍💼 Admin** - Highest authority, manages everything
2. **🎓 Exam Controller** - Department-level manager, handles scheduling for their department
3. **👨‍🏫 Faculty** - End-user, receives duties and submits requests

---

## Role Descriptions

### 👨‍💼 Admin (Superuser/IT Officer)

**Responsibilities:**
- Manages all users (create admin, exam controllers, faculty)
- Uploads exam timetables, classrooms, and faculty data
- Generates allocations for all departments/campuses
- Manages system settings and algorithm tuning
- Views all reports and notifications
- Has access to all features

**Access:**
- Full system access
- Can create Exam Controller accounts
- Can manage all departments
- Can view all allocations and reports

---

### 🎓 Exam Controller (Department Head/Controller of Examinations)

**Responsibilities:**
- Manages exams and allocations **only for their department**
- Generates allocations for department exams
- Reviews and approves/rejects change requests from faculty
- Views department-specific reports
- Cannot modify user accounts or global settings

**Access:**
- Department-specific access only
- Can view department exams
- Can generate allocations for department
- Can approve/reject change requests for department
- Cannot create users or modify system settings

**Example:**
- CSE Exam Controller can only manage CSE department exams
- Cannot see or manage exams from other departments

---

### 👨‍🏫 Faculty (End-user/Participant)

**Responsibilities:**
- Views assigned invigilation duties
- Downloads duty letters
- Views calendar and exports to Google Calendar
- Submits change requests for duty swaps
- Read-only access (except for communication features)

**Access:**
- Personal dashboard only
- Can view own duties
- Can submit change requests
- Can export calendar
- Cannot view other faculty's duties or system settings

---

## Registration & Login

### Login Page
- **Three role options:** Admin, Exam Controller, Faculty
- Users select their role before logging in
- System verifies role matches account

### Registration
- **Admin:** Only first admin can register publicly
- **Exam Controller:** Must be created by Admin (not public)
- **Faculty:** Can register publicly

---

## Creating Exam Controller Accounts

### By Admin:
1. Admin logs in
2. Go to User Management (or use API endpoint)
3. Create new user with:
   - Role: `examController`
   - **Department:** Required (e.g., "Computer Science", "Mathematics")
   - Campus: Optional (defaults to "Main Campus")
   - Employee ID: Optional
   - Designation: Auto-set to "HOD"

### API Endpoint:
```bash
POST /api/auth/register-user
Headers: Authorization: Bearer <admin_token>
Body: {
  "name": "Dr. John Doe",
  "email": "john@university.edu",
  "password": "securepassword",
  "role": "examController",
  "department": "Computer Science",
  "campus": "Main Campus",
  "employeeId": "EC001"
}
```

---

## Exam Controller Dashboard Features

### 1. Dashboard Home
- Department statistics (total exams, allocations, pending requests, faculty count)
- Recent exams list
- Pending change requests

### 2. Department Exams
- View all exams for their department
- Filter by status, date range
- See exam details (subject, date, time, room)

### 3. Allocations
- View all allocations for department exams
- Generate new allocations for department
- See which faculty are assigned to which exams

### 4. Change Requests
- View all change requests from department faculty
- Approve or reject requests
- See request details (requester, exam, reason)

---

## Department Isolation

### How It Works:
- Exam Controller is assigned a **department** when created
- All queries are filtered by `user.department`
- Exam Controller can only see:
  - Exams from their department
  - Allocations for their department exams
  - Change requests for their department exams
  - Faculty from their department

### Example:
- **CSE Exam Controller:**
  - Can see: CSE exams, CSE allocations, CSE faculty requests
  - Cannot see: Mathematics exams, other departments' data

- **Mathematics Exam Controller:**
  - Can see: Mathematics exams, Mathematics allocations, Mathematics faculty requests
  - Cannot see: CSE exams, other departments' data

---

## API Endpoints

### Exam Controller Endpoints:

```
GET    /api/exam-controller/dashboard          - Get dashboard stats
GET    /api/exam-controller/exams              - Get department exams
GET    /api/exam-controller/allocations        - Get department allocations
POST   /api/exam-controller/allocations/generate - Generate allocations
GET    /api/exam-controller/change-requests    - Get change requests
PUT    /api/exam-controller/change-requests/:id - Approve/reject request
GET    /api/exam-controller/faculty            - Get department faculty
```

---

## Frontend Routes

### Exam Controller Routes:
```
/exam-controller              - Dashboard home
/exam-controller/exams        - Department exams
/exam-controller/allocations  - Allocations
/exam-controller/requests     - Change requests
```

---

## Security & Permissions

### Role-Based Access Control:

1. **Admin:**
   - Can access all routes
   - Can create any user type
   - Can view all data

2. **Exam Controller:**
   - Can only access exam controller routes
   - Can only view department-specific data
   - Cannot create users
   - Cannot modify system settings

3. **Faculty:**
   - Can only access faculty routes
   - Can only view own data
   - Can submit change requests

### Middleware:
- `auth` - General authentication
- `adminAuth` - Admin only
- `examControllerAuth` - Exam Controller or Admin
- `facultyAuth` - Faculty, Exam Controller, or Admin

---

## Database Schema Updates

### User Model:
```javascript
role: {
  type: String,
  enum: ['admin', 'examController', 'faculty'],
  default: 'faculty'
}
```

### Exam Controller Requirements:
- `department` field is **required** for exam controllers
- `campus` field is optional (defaults to "Main Campus")
- `designation` auto-set to "HOD" for exam controllers

---

## Usage Examples

### Example 1: CSE Exam Controller Workflow

1. **Admin creates CSE Exam Controller:**
   ```json
   {
     "name": "Dr. Smith",
     "email": "smith@university.edu",
     "role": "examController",
     "department": "Computer Science",
     "password": "secure123"
   }
   ```

2. **CSE Exam Controller logs in:**
   - Selects "Exam Controller" role
   - Logs in with credentials
   - Redirected to `/exam-controller` dashboard

3. **CSE Exam Controller generates allocations:**
   - Goes to "Allocations" page
   - Clicks "Generate Allocations"
   - System generates allocations only for CSE exams
   - Only CSE faculty are assigned

4. **CSE Exam Controller reviews requests:**
   - Faculty from CSE department submit change requests
   - Exam Controller sees requests in "Change Requests" page
   - Approves or rejects requests

### Example 2: Multi-Department Setup

- **Admin:** Manages entire system
- **CSE Exam Controller:** Manages CSE department only
- **Mathematics Exam Controller:** Manages Mathematics department only
- **Physics Exam Controller:** Manages Physics department only
- Each Exam Controller is isolated to their department

---

## Benefits

✅ **Department Isolation** - Each Exam Controller manages only their department  
✅ **Scalability** - Easy to add new departments with new Exam Controllers  
✅ **Security** - Role-based access prevents unauthorized access  
✅ **Efficiency** - Department heads can manage their own exams  
✅ **Flexibility** - Admin maintains full control while delegating department management  

---

## Migration Notes

### Existing Users:
- Existing users remain unchanged
- Only new users can be created as Exam Controllers
- Admin can convert existing users if needed (manual database update)

### Data Migration:
- No data migration needed
- Existing allocations and exams work as-is
- Exam Controllers will see data based on their department assignment

---

## Testing

### Test Scenarios:

1. **Create Exam Controller:**
   - Admin creates Exam Controller for "Computer Science"
   - Verify department is set correctly
   - Verify role is "examController"

2. **Login as Exam Controller:**
   - Select "Exam Controller" role
   - Login with credentials
   - Verify redirect to `/exam-controller`

3. **Department Isolation:**
   - Create two Exam Controllers for different departments
   - Verify each only sees their department's data

4. **Generate Allocations:**
   - Exam Controller generates allocations
   - Verify only department exams are allocated
   - Verify only department faculty are assigned

5. **Change Requests:**
   - Faculty submits change request
   - Exam Controller sees request
   - Exam Controller approves/rejects
   - Verify allocation is updated

---

**The three-role system is now fully implemented and ready to use!** 🎉

