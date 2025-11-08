# 📤 Exam Controller Upload Guide

## Welcome, Exam Controller! 👋

This guide will help you upload **Exam Timetables**, **Faculty Data**, and **Classroom Information** for your department using Excel or CSV files.

---

## 📋 Table of Contents

1. [Exam Timetable Upload](#1-exam-timetable-upload)
2. [Faculty Data Upload](#2-faculty-data-upload)
3. [Classroom Details Upload](#3-classroom-details-upload)
4. [File Format Guidelines](#file-format-guidelines)
5. [Common Errors & Solutions](#common-errors--solutions)

---

## 1. 📅 Exam Timetable Upload

### Required Fields

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| **Subject** | ✅ Yes | Subject/Course name | Data Structures |
| **Exam Date** | ✅ Yes | Date of exam | 2024-12-15 or 15/12/2024 |
| **Start Time** | ✅ Yes | Exam start time | 09:00 or 9:00 AM |
| **End Time** | ✅ Yes | Exam end time | 12:00 or 12:00 PM |
| **Room** | ✅ Yes | Room number | A-101 or H-205 |

### Optional Fields

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| Exam Name | ❌ No | Full exam name | Mid-Term Examination |
| Block | ❌ No | Block/Campus location | A Block, H Block |
| Course | ❌ No | Course code | CSE301 |
| Semester | ❌ No | Semester number | 5 or V |
| Capacity | ❌ No | Number of students | 60 |

### Accepted Column Name Variations

The system accepts these variations (case-insensitive):
- **Subject**: `Subject`, `SUBJECT`, `subject`, `Course`, `course`
- **Exam Date**: `Exam Date`, `examDate`, `Date`, `date`
- **Start Time**: `Start Time`, `startTime`, `Start`, `start`
- **End Time**: `End Time`, `endTime`, `End`, `end`
- **Room**: `Room`, `room`, `Room Number`, `roomNumber`
- **Block**: `Block`, `block`, `Campus`, `campus`, `BLOCK`, `CAMPUS`

### Sample Excel File

```
| Exam Name           | Subject              | Exam Date  | Start Time | End Time | Room  | Block   | Course | Semester | Capacity |
|---------------------|----------------------|------------|------------|----------|-------|---------|--------|----------|----------|
| Mid-Term Exam       | Data Structures      | 2024-12-15 | 09:00      | 12:00    | A-101 | A Block | CSE301 | 5        | 60       |
| Final Exam          | Database Systems     | 2024-12-16 | 14:00      | 17:00    | H-205 | H Block | CSE302 | 5        | 55       |
| Internal Assessment | Operating Systems    | 2024-12-17 | 10:00      | 13:00    | A-102 | A Block | CSE303 | 5        | 60       |
| Practical Exam      | Computer Networks    | 2024-12-18 | 09:00      | 12:00    | L-301 | L Block | CSE304 | 5        | 30       |
```

### CSV Format Example

```csv
Exam Name,Subject,Exam Date,Start Time,End Time,Room,Block,Course,Semester,Capacity
Mid-Term Exam,Data Structures,2024-12-15,09:00,12:00,A-101,A Block,CSE301,5,60
Final Exam,Database Systems,2024-12-16,14:00,17:00,H-205,H Block,CSE302,5,55
Internal Assessment,Operating Systems,2024-12-17,10:00,13:00,A-102,A Block,CSE303,5,60
Practical Exam,Computer Networks,2024-12-18,09:00,12:00,L-301,L Block,CSE304,5,30
```

### Important Notes

- ✅ **Department is automatically set** to your department
- ✅ **Block defaults to your campus** if not specified
- ✅ **Date formats accepted**: `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`
- ✅ **Time formats accepted**: `HH:MM`, `H:MM AM/PM`

---

## 2. 👥 Faculty Data Upload

### Required Fields

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| **Name** | ✅ Yes | Full name of faculty | Dr. John Smith |
| **Email** | ✅ Yes | Email address (must be unique) | john.smith@university.edu |

### Optional Fields

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| Employee ID | ❌ No | Unique employee identifier | EMP001 |
| Block | ❌ No | Campus/Block assignment | A Block |
| Department | ❌ No | Department name | Computer Science |
| Designation | ❌ No | Job title/position | Professor |
| Password | ❌ No | Login password | Pass@123 |

### Accepted Column Name Variations

- **Name**: `Name`, `name`, `NAME`, `Full Name`, `fullName`
- **Email**: `Email`, `email`, `EMAIL`, `E-mail`
- **Employee ID**: `Employee ID`, `employeeId`, `EmployeeId`, `EMPLOYEE ID`, `ID`
- **Block**: `Block`, `block`, `Campus`, `campus`, `BLOCK`, `CAMPUS`
- **Department**: `Department`, `department`, `DEPARTMENT`, `Dept`
- **Designation**: `Designation`, `designation`, `DESIGNATION`, `Title`

### Sample Excel File

```
| Name              | Email                    | Employee ID | Block   | Department         | Designation        | Password      |
|-------------------|--------------------------|-------------|---------|--------------------|--------------------|---------------|
| Dr. John Smith    | john.smith@uni.edu       | EMP001      | A Block | Computer Science   | Professor          | Pass@123      |
| Dr. Sarah Johnson | sarah.johnson@uni.edu    | EMP002      | H Block | Computer Science   | Associate Professor| Pass@456      |
| Mr. Michael Brown | michael.brown@uni.edu    | EMP003      | A Block | Computer Science   | Assistant Professor| Pass@789      |
| Ms. Emily Davis   | emily.davis@uni.edu      | EMP004      | L Block | Computer Science   | Lecturer           | Pass@101      |
```

### CSV Format Example

```csv
Name,Email,Employee ID,Block,Department,Designation,Password
Dr. John Smith,john.smith@uni.edu,EMP001,A Block,Computer Science,Professor,Pass@123
Dr. Sarah Johnson,sarah.johnson@uni.edu,EMP002,H Block,Computer Science,Associate Professor,Pass@456
Mr. Michael Brown,michael.brown@uni.edu,EMP003,A Block,Computer Science,Assistant Professor,Pass@789
Ms. Emily Davis,emily.davis@uni.edu,EMP004,L Block,Computer Science,Lecturer,Pass@101
```

### Important Notes

- ✅ **Email must be unique** - Duplicate emails will update existing faculty
- ✅ **Department defaults to your department** if not specified
- ✅ **Block defaults to your campus** if not specified
- ✅ **Default password is `defaultPassword123`** if not provided
- ✅ **Role is automatically set to `faculty`**
- ⚠️ **Faculty should change password** after first login

---

## 3. 🏫 Classroom Details Upload

### Required Fields

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| **Room Number** | ✅ Yes | Unique room identifier | A-101 or H-205 |

### Optional Fields

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| Block | ❌ No | Block/Campus location | A Block |
| Capacity | ❌ No | Seating capacity | 60 |
| Floor | ❌ No | Floor number | 1, 2, 3 |
| Facilities | ❌ No | Comma-separated list | Projector, AC, WiFi |
| Available | ❌ No | Availability status | TRUE or FALSE |

### Accepted Column Name Variations

- **Room Number**: `Room Number`, `roomNumber`, `Room`, `room`
- **Block**: `Block`, `block`, `Campus`, `campus`, `BLOCK`, `CAMPUS`
- **Capacity**: `Capacity`, `capacity`
- **Floor**: `Floor`, `floor`
- **Facilities**: `Facilities`, `facilities`
- **Available**: `Available`, `available`

### Sample Excel File

```
| Room Number | Block   | Capacity | Floor | Facilities                    | Available |
|-------------|---------|----------|-------|-------------------------------|-----------|
| A-101       | A Block | 60       | 1     | Projector, AC, WiFi           | TRUE      |
| A-102       | A Block | 55       | 1     | Projector, AC                 | TRUE      |
| H-205       | H Block | 70       | 2     | Projector, AC, WiFi, Speakers | TRUE      |
| L-301       | L Block | 30       | 3     | Computers, AC, WiFi           | TRUE      |
| A-103       | A Block | 50       | 1     | Projector                     | FALSE     |
```

### CSV Format Example

```csv
Room Number,Block,Capacity,Floor,Facilities,Available
A-101,A Block,60,1,"Projector, AC, WiFi",TRUE
A-102,A Block,55,1,"Projector, AC",TRUE
H-205,H Block,70,2,"Projector, AC, WiFi, Speakers",TRUE
L-301,L Block,30,3,"Computers, AC, WiFi",TRUE
A-103,A Block,50,1,Projector,FALSE
```

### Important Notes

- ✅ **Block defaults to your campus** if not specified
- ✅ **Facilities should be comma-separated** (e.g., "Projector, AC, WiFi")
- ✅ **Available defaults to TRUE** if not specified
- ✅ **Duplicate room numbers** in same block will update existing records

---

## 📁 File Format Guidelines

### Supported File Types

| Format | Extension | Description |
|--------|-----------|-------------|
| CSV | `.csv` | Comma-Separated Values |
| Excel 2007+ | `.xlsx` | Modern Excel format |
| Excel 97-2003 | `.xls` | Legacy Excel format |

### File Requirements

- ✅ **Maximum file size**: 10 MB
- ✅ **First row must contain column headers**
- ✅ **Headers are case-insensitive** (e.g., "Name" = "name" = "NAME")
- ✅ **Empty rows are automatically skipped**
- ✅ **At least one data row required**

### Date & Time Formats

#### Date Formats (All Accepted)
- `2024-12-15` (YYYY-MM-DD) ✅ Recommended
- `15/12/2024` (DD/MM/YYYY) ✅
- `12/15/2024` (MM/DD/YYYY) ✅
- `15-Dec-2024` ✅
- `December 15, 2024` ✅

#### Time Formats (All Accepted)
- `09:00` (24-hour) ✅ Recommended
- `9:00` (24-hour) ✅
- `09:00 AM` (12-hour) ✅
- `9:00 AM` (12-hour) ✅

### Excel Tips

1. **Use the first row for headers** - Don't skip rows
2. **Keep it simple** - Avoid merged cells or complex formatting
3. **One sheet only** - System reads the first sheet
4. **Save as CSV** - For best compatibility
5. **Test with small file first** - Upload 2-3 rows to verify format

---

## ❌ Common Errors & Solutions

### Error: "No file uploaded"

**Cause**: File not selected or upload interrupted

**Solution**:
- Ensure file is selected before clicking upload
- Check file size is under 10MB
- Try a different browser if issue persists

---

### Error: "No data found in file"

**Cause**: File is empty or has no data rows

**Solution**:
- Ensure file has at least one data row (besides headers)
- Check that cells are not all empty
- Verify file is not corrupted

---

### Error: "Missing required fields"

**Cause**: Required columns are missing or misspelled

**Solution**:

**For Exams**, ensure these columns exist:
- Subject ✅
- Exam Date ✅
- Start Time ✅
- End Time ✅
- Room ✅

**For Faculty**, ensure these columns exist:
- Name ✅
- Email ✅

**For Classrooms**, ensure this column exists:
- Room Number ✅

---

### Error: "Upload failed"

**Cause**: Various reasons - check details

**Solution**:
1. Open browser console (Press F12)
2. Look for detailed error message
3. Check backend terminal for server logs
4. Verify you're logged in as Exam Controller
5. Ensure file format is correct

---

### Error: "File too large"

**Cause**: File exceeds 10MB limit

**Solution**:
- Split large files into smaller batches
- Remove unnecessary columns
- Save as CSV instead of XLSX (smaller size)

---

### Error: "Only CSV and Excel files are allowed"

**Cause**: Wrong file format uploaded

**Solution**:
- Ensure file has extension: `.csv`, `.xlsx`, or `.xls`
- Don't upload `.txt`, `.doc`, or other formats
- Save your file in correct format

---

## 🎯 Upload Workflow

```
1. Prepare Excel/CSV file with required columns
   ↓
2. Login to Exam Controller Dashboard
   ↓
3. Navigate to "Uploads" page from sidebar
   ↓
4. Click "Choose File" under desired upload type
   ↓
5. Select your file
   ↓
6. Upload starts automatically
   ↓
7. Wait for success message
   ↓
8. Check results: ✓ Created, ↻ Updated, ⚠ Errors
   ↓
9. Verify data in respective pages
```

---

## 📊 Upload Results Explained

### Success Message Format

```
✓ Upload successful! 25 exams created.
✓ 25 Created
```

### With Updates

```
✓ Upload successful! 15 faculty created, 5 updated.
✓ 15 Created  ↻ 5 Updated
```

### With Errors

```
✓ Upload successful! 30 classrooms created, 10 updated.
✓ 30 Created  ↻ 10 Updated  ⚠ 2 Errors
```

### What Each Means

- **✓ Created**: New records added to database
- **↻ Updated**: Existing records updated (based on email/room number)
- **⚠ Errors**: Rows that failed validation (check format)

---

## 🔐 Security & Permissions

### Automatic Settings

When you upload data, the system automatically:

- ✅ **Sets department** to your department
- ✅ **Sets campus/block** to your campus (if not specified)
- ✅ **Validates your permissions** before processing
- ✅ **Logs all upload activities** for audit

### Data Scope

As an Exam Controller, you can:

- ✅ Upload exams for **your department only**
- ✅ Upload faculty for **your department** (or any department if specified)
- ✅ Upload classrooms for **your campus**
- ✅ View and manage **your department's data**

---

## 📞 Need Help?

### Before Uploading

1. ✅ Review this guide carefully
2. ✅ Prepare a small test file (2-3 rows)
3. ✅ Test upload with small file first
4. ✅ Verify data appears correctly
5. ✅ Then upload full dataset

### If You Encounter Issues

1. **Check browser console** (F12) for error details
2. **Check file format** matches examples above
3. **Verify required columns** are present
4. **Try smaller file** to isolate issue
5. **Contact system administrator** with error details

---

## 📥 Quick Reference Templates

### Minimal Exam Template (CSV)

```csv
Subject,Exam Date,Start Time,End Time,Room
Data Structures,2024-12-15,09:00,12:00,A-101
Database Systems,2024-12-16,14:00,17:00,H-205
```

### Minimal Faculty Template (CSV)

```csv
Name,Email
Dr. John Smith,john.smith@uni.edu
Dr. Sarah Johnson,sarah.johnson@uni.edu
```

### Minimal Classroom Template (CSV)

```csv
Room Number,Capacity
A-101,60
H-205,70
```

---

## ✅ Best Practices

1. **Start small** - Test with 2-3 rows first
2. **Use consistent formatting** - Same date/time format throughout
3. **Verify data** - Check uploaded data in respective pages
4. **Keep backups** - Save original files before uploading
5. **Update regularly** - Keep data current for accurate allocations
6. **Use templates** - Follow examples provided above
7. **Check results** - Review success/error messages after upload

---

**Last Updated**: November 7, 2024  
**Version**: 1.0  
**For**: Exam Controller Dashboard

---

## 🎓 Quick Start Checklist

- [ ] Read this guide completely
- [ ] Prepare Excel/CSV file with correct columns
- [ ] Verify file size is under 10MB
- [ ] Test with small file first (2-3 rows)
- [ ] Login as Exam Controller
- [ ] Navigate to Uploads page
- [ ] Upload file and check results
- [ ] Verify data in respective pages
- [ ] Upload remaining data if test successful

**Happy Uploading! 🚀**
