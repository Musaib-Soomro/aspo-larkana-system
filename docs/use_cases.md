# Use Case Document - ASPO Larkana System

## 1. Actors
- **Admin**: The primary user who manages all offices, staff, and records.
- **Postmaster**: A specific office user who logs revenue and article data.
- **Viewer**: A user with read-only access to specific dashboards.

## 2. Primary Use Cases

### 2.1 Staff Management
- **Actor**: Admin
- **Description**: Add new staff, update staff details, and deactivate staff.
- **Pre-conditions**: Admin must be logged in.
- **Post-conditions**: Staff record is updated in the database and audit logged.

### 2.2 Leave Registration
- **Actor**: Admin
- **Description**: Register staff leave, assign a substitute, and update leave balance.
- **Pre-conditions**: Staff and substitute must exist.
- **Post-conditions**: Leave record is created, and staff status is updated.

### 2.3 Transfer Tracking
- **Actor**: Admin
- **Description**: Create a transfer order, mark staff as relieved, and mark transfer as completed.
- **Pre-conditions**: Staff must be active.
- **Post-conditions**: Transfer status changes, and staff's current posting is updated.

### 2.4 Revenue Logging
- **Actor**: Admin, Postmaster
- **Description**: Log daily/monthly revenue for an office.
- **Pre-conditions**: Office must exist and user must have permission.
- **Post-conditions**: Revenue data is saved and aggregated in the dashboard.

### 2.5 Inspection Planning (EDBO)
- **Actor**: Admin
- **Description**: Create an annual inspection programme for an EDBO and assign months.
- **Pre-conditions**: EDBO (office) and Overseer (staff) must exist.
- **Post-conditions**: Inspection programme is saved and displayed in the overseer's schedule.

### 2.6 Attendance Marking (ASPO Office)
- **Actor**: Admin
- **Description**: Mark daily attendance for ASPO office staff (Present, On Duty, On Leave, etc.).
- **Pre-conditions**: ASPO staff must be registered.
- **Post-conditions**: Attendance record is saved for the specific date.

### 2.7 View Audit Log
- **Actor**: Admin
- **Description**: Review history of all changes made to the system (who, what, when, before/after).
- **Pre-conditions**: Admin must be logged in.
- **Post-conditions**: Display filtered list of audit records.

## 3. Use Case Diagram (Simplified View)

```mermaid
usecaseDiagram
    actor Admin
    actor Postmaster
    actor Viewer

    Admin --> (Manage Staff)
    Admin --> (Manage Offices)
    Admin --> (Register Leave)
    Admin --> (Track Transfers)
    Admin --> (Plan Inspections)
    Admin --> (Mark Attendance)
    Admin --> (View Audit Logs)

    Postmaster --> (Log Revenue)
    Postmaster --> (Log Articles)
    Postmaster --> (View Dashboard)

    Viewer --> (View Reports)
```
