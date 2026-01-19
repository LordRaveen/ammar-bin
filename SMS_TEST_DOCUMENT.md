# SCHOOL MANAGEMENT SYSTEM (SMS) - TEST DOCUMENT
## Features Completed 80%+ | Organized by Portal

**Document Version:** 1.0  
**Date:** January 18, 2026  
**Project:** Ammar Bin Yasir Institute SMS

---

## TEST ASSESSMENT COLUMNS KEY

| Column | Description |
|--------|-------------|
| **Feature** | Name of the feature being tested |
| **Test Case** | Specific scenario to test |
| **Expected Result** | What should happen when tested |
| **Status** | Pass / Fail / Blocked / Not Tested |
| **Tester** | Name of person who tested |
| **Date Tested** | Date the test was conducted |
| **Notes/Bugs** | Any issues found or comments |
| **Severity** | Critical / High / Medium / Low |

---

# PORTAL 1: ADMIN DASHBOARD (Super Admin & Admin)

## 1.1 AUTHENTICATION & ACCESS CONTROL

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Admin Login | Enter valid admin credentials | Successfully redirected to admin dashboard | | | | | |
| Super Admin Login | Enter valid super_admin credentials | Successfully redirected to admin dashboard with full access | | | | | |
| Invalid Credentials | Enter incorrect password | Error message displayed, login blocked | | | | | |
| Session Timeout | Leave session idle for extended period | User logged out, redirected to login | | | | | |
| Role-based Redirect | Login with different role accounts | Each role redirected to appropriate dashboard | | | | | |
| Access Denied | Try accessing admin URL as teacher | Access denied message displayed | | | | | |

## 1.2 DASHBOARD OVERVIEW

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Total Students Card | View dashboard | Shows correct count of all students | | | | | |
| Total Teachers Card | View dashboard | Shows correct count of all teachers | | | | | |
| Total Guardians Card | View dashboard | Shows correct count of all guardians | | | | | |
| Total Revenue Card | View dashboard | Shows accurate revenue calculation | | | | | |
| Outstanding Fees | View dashboard | Shows correct outstanding balance | | | | | |
| Collection Rate | View dashboard | Shows accurate percentage calculation | | | | | |
| Students by Section | View chart | Displays enrollment distribution correctly | | | | | |
| Recent Registrations | View list | Shows latest 5 student registrations | | | | | |
| Active Session Display | View session info | Shows current academic session and term | | | | | |

## 1.3 STUDENT MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Student List | Navigate to Students page | All students displayed in table | | | | | |
| Search by Name | Enter student name in search | Filtered results shown | | | | | |
| Search by Student ID | Enter student ID in search | Filtered results shown | | | | | |
| Filter by Gender | Select gender filter | Only matching students shown | | | | | |
| Filter by Status | Select Active/Inactive | Only matching students shown | | | | | |
| Pagination - Next | Click next page | Shows next set of students | | | | | |
| Pagination - Previous | Click previous page | Shows previous set of students | | | | | |
| Rows Per Page | Change to 20/50/100 | Correct number of rows displayed | | | | | |
| Register New Student | Fill form, click Register | Student created, appears in list | | | | | |
| Student ID Generation | Register student | Auto-generated ID in correct format | | | | | |
| View Student Details | Click student row | Details sheet opens with full info | | | | | |
| Edit Student | Click edit button | Edit modal opens, changes saved | | | | | |
| Delete Student | Click delete, confirm | Student soft-deleted from system | | | | | |
| Student Photo Upload | Upload photo during registration | Photo displayed in profile | | | | | |
| Checkbox Selection | Select multiple students | Checkboxes work, count shown | | | | | |
| Serial Number | View table | SN column shows correct numbers | | | | | |

## 1.4 TEACHER MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Teacher List | Navigate to Teachers page | All teachers with role=Teacher shown | | | | | |
| Search by Name | Enter teacher name | Filtered results shown | | | | | |
| Search by Staff ID | Enter staff ID | Filtered results shown | | | | | |
| Pagination | Navigate between pages | Correct teachers shown per page | | | | | |
| Add Teacher | Fill form, submit | Teacher created with staff ID | | | | | |
| Auto-generate Staff ID | Add teacher | Staff ID auto-generated correctly | | | | | |
| Create User Account | Check "Create account" option | Auth user created, credentials logged | | | | | |
| View Teacher Details | Click teacher row | Details sheet opens | | | | | |
| Edit Teacher | Click pencil icon | Edit dialog opens, saves changes | | | | | |
| Delete Teacher | Click trash icon, confirm | Teacher soft-deleted | | | | | |
| Teacher Status Toggle | Change Active/Inactive | Status updated in database | | | | | |
| Checkbox Selection | Select teachers | Checkboxes functional | | | | | |

## 1.5 USERS MANAGEMENT (Non-Teaching Staff)

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Users List | Navigate to Users page | Shows all non-teacher staff | | | | | |
| Filter by Role | Filter admins, cashiers, etc. | Correct users shown | | | | | |
| Search Users | Search by name/email | Filtered results shown | | | | | |
| Pagination | Navigate pages | Correct pagination behavior | | | | | |

## 1.6 GUARDIAN MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Guardian List | Navigate to Guardians page | All guardians displayed | | | | | |
| Search Guardian | Search by name/phone | Filtered results shown | | | | | |
| Pagination | Navigate pages | Correct guardians shown | | | | | |
| Add Guardian | Fill form, submit | Guardian created | | | | | |
| View Guardian Details | Click guardian row | Details sheet opens | | | | | |
| Link Child to Guardian | Add student link | Relationship created | | | | | |
| Edit Guardian | Click edit button | Edit dialog, changes saved | | | | | |
| Delete Guardian | Click delete, confirm | Guardian soft-deleted | | | | | |
| View Linked Children | Open guardian details | Shows all linked students | | | | | |
| Activate Portal | Click activate button | Parent portal access enabled | | | | | |

## 1.7 CLASS MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Classes by Section | Navigate to Classes page | Classes grouped by section | | | | | |
| Section Tabs | Click different section tabs | Correct classes shown | | | | | |
| Search Classes | Enter class name | Filtered results shown | | | | | |
| Add Section | Click Add Section | New section created | | | | | |
| Add Class | Fill class form | New class created in section | | | | | |
| Assign Class Teacher | Click Assign Teacher | Teacher assigned to class | | | | | |
| View Class Details | Click class card | Full class details page opens | | | | | |
| Student Count | View class card | Shows correct enrolled count | | | | | |
| Subject Count | View class card | Shows correct subject count | | | | | |
| Class Capacity | View/edit capacity | Capacity tracking works | | | | | |

## 1.8 FINANCE MODULE

### 1.8.1 Invoice Management

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View All Invoices | Navigate to Invoices | All invoices listed | | | | | |
| Generate Invoice | Select student, generate | Invoice created with items | | | | | |
| Invoice Number | Generate invoice | Auto-generated invoice number | | | | | |
| Invoice Status | View invoice | Shows Pending/Paid/Partial | | | | | |
| Invoice Items | View invoice details | All fee items listed | | | | | |
| Invoice Balance | View invoice | Correct balance calculation | | | | | |
| Filter by Status | Filter Pending/Paid | Correct invoices shown | | | | | |

### 1.8.2 Payment Recording

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Record Payment | Enter amount, method | Payment recorded | | | | | |
| Payment Methods | Select Cash/Transfer/POS | All methods work | | | | | |
| Receipt Generation | Record payment | Receipt generated | | | | | |
| Print Receipt | Click print button | Receipt prints correctly | | | | | |
| Invoice Update | Make payment | Invoice balance updated | | | | | |
| Partial Payment | Pay less than balance | Partial status, balance updated | | | | | |
| Full Payment | Pay full balance | Invoice marked Paid | | | | | |

### 1.8.3 Payment Reversals

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Submit Reversal Request | Fill form, submit | Request created, pending approval | | | | | |
| View Reversal Requests | Navigate to reversals | All requests listed | | | | | |
| Approve Reversal | Admin approves | Payment reversed, invoice updated | | | | | |
| Reject Reversal | Admin rejects | Request marked rejected | | | | | |

### 1.8.4 Discounts & Waivers

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Apply Discount | Select invoice, apply % | Discount applied to balance | | | | | |
| Flat Amount Discount | Apply fixed amount | Correct amount deducted | | | | | |
| Percentage Discount | Apply percentage | Correct calculation | | | | | |
| Request Waiver | Submit waiver request | Request sent for approval | | | | | |
| Approve Waiver | Admin approves | Waiver applied to invoice | | | | | |

### 1.8.5 Student Fee Search

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Search by Name | Enter student name | Fee status displayed | | | | | |
| Search by ID | Enter student ID | Fee status displayed | | | | | |
| View Fee History | Select student | Complete history shown | | | | | |
| View Invoices | Click invoices tab | All student invoices | | | | | |
| View Payments | Click payments tab | All student payments | | | | | |

## 1.9 ASSESSMENTS & GRADING

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Navigate to Assessments | Click Assessments menu | Assessment page loads | | | | | |
| Score Entry Link | Click Score Entry | Redirects to score entry | | | | | |
| View Results Link | Click View Results | Redirects to results | | | | | |
| Active Session Display | View page | Shows current session/term | | | | | |
| No Active Session | When no session active | Shows setup message | | | | | |

## 1.10 ATTENDANCE MANAGEMENT (Admin View)

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View All Attendance | Navigate to Attendance | All records displayed | | | | | |
| Filter by Date | Select date | Records for date shown | | | | | |
| Filter by Class | Select class | Class records shown | | | | | |
| Filter by Status | Select Present/Absent/etc. | Matching records shown | | | | | |
| Attendance Statistics | View stats cards | Correct counts displayed | | | | | |
| Search Records | Enter student name | Filtered results shown | | | | | |

## 1.11 ANNOUNCEMENTS

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Announcements | Navigate to Announcements | All announcements listed | | | | | |
| Create Announcement | Fill form, submit | Announcement created | | | | | |
| Set Target Audience | Select Students/Parents/All | Correct targeting | | | | | |
| Set Priority | Select Urgent/High/Normal | Priority badge shown | | | | | |
| Set Category | Select category | Category tag displayed | | | | | |
| Edit Announcement | Click edit | Changes saved | | | | | |
| Delete Announcement | Click delete, confirm | Announcement removed | | | | | |

## 1.12 SETTINGS & CONFIGURATION

### 1.12.1 General Settings

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View School Settings | Navigate to Settings > General | Current settings displayed | | | | | |
| Update School Name | Change name, save | Name updated | | | | | |
| Update School Logo | Upload new logo | Logo updated | | | | | |
| Update Contact Info | Change address/phone/email | Info updated | | | | | |

### 1.12.2 Academic Sessions

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Sessions | Navigate to Sessions tab | All sessions listed | | | | | |
| Create Session | Fill form, create | Session created | | | | | |
| Activate Session | Click activate | Session becomes active | | | | | |
| Create Term | Add term to session | Term created | | | | | |
| Activate Term | Click activate term | Term becomes active | | | | | |
| Edit Session | Click edit | Changes saved | | | | | |

### 1.12.3 Fee Management

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Fee Categories | Navigate to Fees tab | Categories listed | | | | | |
| Add Fee Category | Fill form, add | Category created | | | | | |
| Create Fee Structure | Select class, add fees | Structure created | | | | | |
| Edit Fee Structure | Change amounts | Structure updated | | | | | |

### 1.12.4 Grading System

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Grading Scheme | Navigate to Grading tab | All grades displayed | | | | | |
| Add Grade | Fill min/max/grade/remark | Grade added | | | | | |
| Edit Grade | Change values | Grade updated | | | | | |
| Delete Grade | Remove grade | Grade deleted | | | | | |

### 1.12.5 Subject Management

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Subjects | Navigate to Subjects tab | All subjects listed | | | | | |
| Add Subject | Fill name/code | Subject created | | | | | |
| Edit Subject | Change details | Subject updated | | | | | |
| Delete Subject | Remove subject | Subject deleted | | | | | |

## 1.13 REPORTS

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Student List Report | Click generate | Report generated/downloaded | | | | | |
| Enrollment Report | Click generate | Report generated | | | | | |
| Class List Report | Click generate | Report generated | | | | | |
| Academic Performance | Click generate | Report generated | | | | | |
| Termly Results | Click generate | Report generated | | | | | |
| Daily Cash Report | Click generate | Report generated | | | | | |
| Revenue Report | Click generate | Report generated | | | | | |
| Outstanding Fees | Click generate | Report generated | | | | | |
| Defaulters List | Click generate | Report generated | | | | | |
| Payment History | Click generate | Report generated | | | | | |
| Custom Report Builder | Build custom report | Report generated | | | | | |

---

# PORTAL 2: TEACHER DASHBOARD

## 2.1 AUTHENTICATION

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Teacher Login | Enter valid teacher credentials | Redirected to teacher dashboard | | | | | |
| Invalid Login | Enter wrong password | Error message shown | | | | | |
| Access Control | Try accessing admin pages | Access denied | | | | | |

## 2.2 DASHBOARD OVERVIEW

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Classes Assigned Card | View dashboard | Shows correct count | | | | | |
| Total Students Card | View dashboard | Shows students in assigned classes | | | | | |
| Subjects Assigned Card | View dashboard | Shows correct count | | | | | |
| Average Score Card | View dashboard | Shows calculated average | | | | | |
| My Classes List | View dashboard | All assigned classes shown | | | | | |
| Class Teacher Badge | View class card | Shows if class teacher | | | | | |
| Active Session Display | View dashboard | Current session/term shown | | | | | |
| Quick Actions | Click shortcuts | Navigate to correct pages | | | | | |

## 2.3 SCORE ENTRY

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Select Class | Choose from dropdown | Students for class loaded | | | | | |
| Select Subject | Choose subject | Subject selected | | | | | |
| Select Assessment Type | Choose CA/Exam | Type selected | | | | | |
| Enter Scores | Input student scores | Scores accepted | | | | | |
| Score Validation | Enter invalid score (>max) | Validation error shown | | | | | |
| Save Scores | Click save | Scores saved to database | | | | | |
| Batch Entry | Enter multiple scores | All saved correctly | | | | | |
| Edit Existing Score | Change saved score | Score updated | | | | | |

## 2.4 RESULTS MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Class Results | Select class | Results table displayed | | | | | |
| Subject-wise Scores | View details | CA, Exam, Total shown | | | | | |
| Grade Calculation | View grades | Correct grades displayed | | | | | |
| Student Comparison | View class | Compare student performance | | | | | |

## 2.5 ATTENDANCE MARKING

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Assigned Classes | Navigate to Attendance | All classes shown | | | | | |
| Select Class | Click class | Attendance form opens | | | | | |
| Select Date | Choose date | Date selected | | | | | |
| Mark Present | Click Present button | Status set to Present | | | | | |
| Mark Absent | Click Absent button | Status set to Absent | | | | | |
| Mark Late | Click Late button | Status set to Late | | | | | |
| Mark Excused | Click Excused button | Status set to Excused | | | | | |
| Mark All Present | Click bulk button | All students marked Present | | | | | |
| Add Remarks | Enter remarks | Remarks saved | | | | | |
| Save Attendance | Click save | Attendance saved to database | | | | | |
| View Existing | Select past date | Previously marked attendance shown | | | | | |
| Edit Attendance | Change status | Status updated | | | | | |
| Attendance Statistics | View stats cards | Correct counts shown | | | | | |
| Marked Today Badge | View class list | Shows which classes marked | | | | | |
| Recent Records | View dashboard | Latest entries shown | | | | | |

## 2.6 CLASS MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Class Details | Click class | Full details shown | | | | | |
| Student Roster | View students tab | All enrolled students listed | | | | | |
| Class Information | View info | Section, capacity, etc. | | | | | |

---

# PORTAL 3: PARENT PORTAL

## 3.1 AUTHENTICATION

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Parent Login | Enter valid credentials | Redirected to parent dashboard | | | | | |
| Invalid Login | Enter wrong password | Error message shown | | | | | |
| Account Activation | First login after activation | Account works | | | | | |
| Password Reset | Request reset | Reset email sent | | | | | |

## 3.2 DASHBOARD OVERVIEW

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Children Count Card | View dashboard | Correct number of children | | | | | |
| Outstanding Fees Card | View dashboard | Total fees across children | | | | | |
| Overdue Invoices Card | View dashboard | Count of overdue | | | | | |
| Children Cards | View dashboard | All children displayed | | | | | |
| Child Status | View card | Active/Inactive status | | | | | |
| Financial Summary | View dashboard | Fees summary shown | | | | | |
| Recent Announcements | View dashboard | Latest announcements | | | | | |
| Active Session | View dashboard | Current session displayed | | | | | |

## 3.3 CHILDREN MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View All Children | Navigate to Children | All children listed | | | | | |
| Child Profile | Click child card | Full profile displayed | | | | | |
| Personal Details | View profile | Name, DOB, gender, etc. | | | | | |
| Student ID | View profile | ID displayed | | | | | |
| Photo | View profile | Photo shown if exists | | | | | |
| Current Enrollment | View profile | Current class shown | | | | | |
| Class Teacher Info | View profile | Teacher contact displayed | | | | | |
| Enrollment History | View history tab | Past enrollments listed | | | | | |
| Guardian Information | View guardians | All linked guardians shown | | | | | |

## 3.4 ACADEMIC RESULTS

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Select Child | Choose from dropdown | Child selected | | | | | |
| Select Session | Choose session | Session selected | | | | | |
| Select Term | Choose term | Term selected | | | | | |
| View Results | Load results | Results table displayed | | | | | |
| Subject Scores | View table | CA, Exam, Total shown | | | | | |
| Grades | View table | Grade for each subject | | | | | |
| Remarks | View table | Remarks displayed | | | | | |
| Overall Performance | View summary | Total, average, position | | | | | |
| Switch Children | Select different child | Results update | | | | | |

## 3.5 PAYMENTS & FINANCE

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View All Invoices | Navigate to Payments | All invoices listed | | | | | |
| Filter by Child | Select child | Child's invoices shown | | | | | |
| Invoice Details | Click invoice | Itemized breakdown shown | | | | | |
| Invoice Status | View list | Status badges displayed | | | | | |
| Due Dates | View list | Due dates shown | | | | | |
| Overdue Highlighting | View overdue | Highlighted/marked | | | | | |
| Payment History | View payments tab | All payments listed | | | | | |
| Payment Details | View payment | Amount, method, date | | | | | |
| Fee Summary | View summary | Total fees vs paid | | | | | |

## 3.6 ATTENDANCE TRACKING

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Select Child | Choose from dropdown | Child selected | | | | | |
| View Calendar | Load attendance | Calendar displayed | | | | | |
| Color Coding | View calendar | Present=Green, Absent=Red, etc. | | | | | |
| Attendance Summary | View stats | Percentage, counts shown | | | | | |
| Monthly Filter | Select month | Month's attendance shown | | | | | |
| Click Date | Click calendar date | Details for date shown | | | | | |
| Attendance Trends | View trends | Pattern visualization | | | | | |

## 3.7 ANNOUNCEMENTS

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Announcements | Navigate to Announcements | Parent-targeted shown | | | | | |
| Priority Display | View list | Urgent/High/Normal badges | | | | | |
| Category Tags | View list | Categories displayed | | | | | |
| Date Sorting | View list | Latest first | | | | | |
| Read Announcement | Click announcement | Full content shown | | | | | |

## 3.8 MESSAGES

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Inbox | Navigate to Messages | All received messages | | | | | |
| View Sent | Click sent tab | Sent messages shown | | | | | |
| Compose Message | Click compose | Message form opens | | | | | |
| Select Student | Choose child | Student tagged | | | | | |
| Send to Teacher | Select teacher, send | Message sent | | | | | |
| View Message | Click message | Full content shown | | | | | |
| Unread Count | View inbox | Unread badge shown | | | | | |
| Mark as Read | Open message | Read status updated | | | | | |

## 3.9 PROFILE MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View Profile | Navigate to Profile | Guardian info displayed | | | | | |
| Edit Contact Info | Change phone/email | Info updated | | | | | |
| View Linked Children | View children section | All children listed | | | | | |
| Change Password | Enter new password | Password updated | | | | | |
| Profile Photo | Upload photo | Photo updated | | | | | |

## 3.10 NOTIFICATIONS

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Email Alerts Toggle | Enable/disable | Setting saved | | | | | |
| SMS Alerts Toggle | Enable/disable | Setting saved | | | | | |
| In-App Alerts Toggle | Enable/disable | Setting saved | | | | | |
| Fee Reminders | Enable/disable | Setting saved | | | | | |
| New Results Alert | Enable/disable | Setting saved | | | | | |
| Announcement Alerts | Enable/disable | Setting saved | | | | | |
| Attendance Alerts | Enable/disable | Setting saved | | | | | |
| Message Alerts | Enable/disable | Setting saved | | | | | |

---

# PORTAL 4: CASHIER/ACCOUNTANT DASHBOARD

## 4.1 AUTHENTICATION

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Cashier Login | Enter valid credentials | Redirected to cashier dashboard | | | | | |
| Accountant Login | Enter valid credentials | Redirected to cashier dashboard | | | | | |
| Access Control | Try admin pages | Access denied | | | | | |

## 4.2 DASHBOARD OVERVIEW

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Today's Collection Card | View dashboard | Correct total shown | | | | | |
| Pending Invoices Card | View dashboard | Correct count shown | | | | | |
| Overdue Students Card | View dashboard | Correct count shown | | | | | |
| Collection Rate Card | View dashboard | Correct percentage | | | | | |
| Payment Breakdown | View dashboard | Cash/Transfer/POS split | | | | | |
| Quick Payment Entry | Use inline form | Payment recorded | | | | | |
| Recent Transactions | View list | Latest payments shown | | | | | |
| Overdue Alerts | View alerts | Highlighted students | | | | | |

## 4.3 PAYMENT RECORDING

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Search Student | Enter name/ID | Student found | | | | | |
| Select Invoice | Choose invoice | Invoice selected | | | | | |
| Enter Amount | Input payment amount | Amount accepted | | | | | |
| Select Cash | Choose payment method | Cash selected | | | | | |
| Select Bank Transfer | Choose method | Transfer selected | | | | | |
| Select POS | Choose method | POS selected | | | | | |
| Record Payment | Click submit | Payment saved | | | | | |
| Generate Receipt | After payment | Receipt generated | | | | | |
| Print Receipt | Click print | Receipt prints | | | | | |
| Invoice Balance Update | After payment | Balance reduced | | | | | |

## 4.4 INVOICE MANAGEMENT

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| View All Invoices | Navigate to Invoices | All invoices listed | | | | | |
| Filter Pending | Click Pending filter | Only pending shown | | | | | |
| Filter Paid | Click Paid filter | Only paid shown | | | | | |
| View Invoice Details | Click invoice | Details displayed | | | | | |
| Search Invoice | Enter invoice number | Invoice found | | | | | |

## 4.5 STUDENT FEE SEARCH

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Search by Name | Enter student name | Results shown | | | | | |
| Search by ID | Enter student ID | Results shown | | | | | |
| View Fee Status | Select student | Complete status shown | | | | | |
| View Invoices | Click invoices tab | Student invoices listed | | | | | |
| View Payments | Click payments tab | Student payments listed | | | | | |
| Outstanding Balance | View summary | Correct balance shown | | | | | |

## 4.6 REPORTS ACCESS

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Daily Cash Report | Generate report | Report displayed | | | | | |
| Payment Collection | Generate report | Report displayed | | | | | |

---

# CROSS-PORTAL FEATURES

## 5.1 NAVIGATION & UI

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Sidebar Navigation | Click menu items | Navigate correctly | | | | | |
| Role-based Menus | Login as different roles | Correct menus shown | | | | | |
| Responsive Design | Resize browser | Layout adapts | | | | | |
| Mobile Sidebar | View on mobile | Hamburger menu works | | | | | |
| Dark/Light Mode | Toggle theme | Theme changes | | | | | |
| Table Responsiveness | Narrow viewport | Table scrolls internally | | | | | |
| Form Validation | Submit invalid data | Validation errors shown | | | | | |
| Loading States | Slow connection | Loading indicators shown | | | | | |
| Error Messages | Trigger error | User-friendly message | | | | | |
| Success Messages | Complete action | Toast notification | | | | | |

## 5.2 DATA INTEGRITY

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| Soft Delete | Delete student | Record hidden, not destroyed | | | | | |
| Audit Trail | Make changes | Changes logged | | | | | |
| Data Consistency | Check related records | Foreign keys maintained | | | | | |
| Duplicate Prevention | Create duplicate | Prevented/warned | | | | | |

## 5.3 SECURITY

| Feature | Test Case | Expected Result | Status | Tester | Date Tested | Notes/Bugs | Severity |
|---------|-----------|-----------------|--------|--------|-------------|------------|----------|
| RLS Policies | Query as different users | Only authorized data returned | | | | | |
| Session Security | Check session handling | Secure session management | | | | | |
| Input Sanitization | Enter malicious input | Input sanitized | | | | | |
| CSRF Protection | Check form submissions | CSRF tokens present | | | | | |

---

## TEST SUMMARY TEMPLATE

| Portal | Total Features | Passed | Failed | Blocked | Not Tested | Pass Rate |
|--------|---------------|--------|--------|---------|------------|-----------|
| Admin Dashboard | | | | | | |
| Teacher Dashboard | | | | | | |
| Parent Portal | | | | | | |
| Cashier Dashboard | | | | | | |
| Cross-Portal | | | | | | |
| **TOTAL** | | | | | | |

---

## SIGN-OFF

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Project Manager | | | |
| Client Representative | | | |

---

**Document prepared by:** v0 AI Assistant  
**Date:** January 18, 2026
