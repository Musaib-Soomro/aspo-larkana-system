# Database Design Document (DDD) - ASPO Larkana System

## 1. Entity-Relationship Model (Overview)
The database structure is designed to be highly normalized, ensuring data integrity across staff, offices, and their historical records (transfers, leave, etc.).

### 1.1 Core Entities
- **Users**: Authentication and authorization details for Admin/Postmaster/Viewer.
- **Offices**: Postal offices in the Larkana region.
- **Staff**: Dedicated personnel details (Designation, BPS, Posting).

### 1.2 Administrative Entities
- **Leave Records**: Tracking of approved staff leave.
- **Transfers**: History and current state of staff reassignments.
- **Look-after Assignments**: Temporary roles for vacant positions.

### 1.3 Operational Entities
- **Inspection Programmes & Visits**: Planning and recording office inspections.
- **Complaints & Inquiries**: Public and internal grievance tracking.
- **Revenue & Articles**: Logging financial and physical postal items.
- **ASPO Office Logs**: Attendance and delivery logs for the main office.

## 2. Table Schemas (Key Tables)

### 2.1 `users`
- `id` (SERIAL PRIMARY KEY)
- `username` (VARCHAR UNIQUE)
- `password_hash` (TEXT)
- `role` (ENUM: admin, postmaster, viewer)
- `office_id` (REFERENCES offices)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.2 `offices`
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR UNIQUE)
- `type` (VARCHAR)
- `shift` (VARCHAR)
- `tehsil` (VARCHAR)
- `district` (VARCHAR)
- `account_office`, `bps_category`, `has_edbos`
- `created_at`, `updated_at`

### 2.3 `staff`
- `id` (SERIAL PRIMARY KEY)
- `office_id` (REFERENCES offices)
- `full_name` (VARCHAR)
- `designation` (CHECK: Postmaster, Postman, Mail Peon, etc.)
- `bps`, `employee_id`, `date_of_joining`, `current_posting_date`, `date_of_birth`
- `is_active`, `is_on_leave`, `is_on_lookafter`
- `lookafter_office_id` (REFERENCES offices)

### 2.4 `leave_records`
- `id` (SERIAL PRIMARY KEY)
- `staff_id` (REFERENCES staff)
- `leave_type`, `start_date`, `end_date`, `total_days`, `reason`
- `approved_by`, `status` (Active, Completed, Cancelled)
- `substitute_staff_id` (REFERENCES staff)
- `dsps_memo_no`, `dsps_memo_date`

### 2.5 `transfer_records`
- `id` (SERIAL PRIMARY KEY)
- `staff_id` (REFERENCES staff)
- `from_office_id`, `to_office_id` (REFERENCES offices)
- `order_no`, `order_date`, `relieving_date`, `completion_date`
- `status` (Ordered, Relieved, Completed)

### 2.6 `lookafter_assignments`
- `id` (SERIAL PRIMARY KEY)
- `staff_id` (REFERENCES staff)
- `office_id` (REFERENCES offices)
- `order_no`, `order_date`, `start_date`, `end_date`, `is_active`

## 3. Indexing Strategy
The system uses several key indexes to optimize search and reporting performance:
- **`idx_att_staff` / `idx_att_date`**: Optimized attendance record searching.
- **`idx_edbo_prog` / `idx_edbo_month`**: Fast lookup for inspection assignments.
- **`idx_diary_staff`**: Efficiency for overseer weekly reports.
- **`idx_assign_staff` / `idx_assign_status`**: Performance for work assignment tracking.

## 4. Migration Strategy
Schema changes are managed through a custom migration runner (`backend/database/migrate.js`).
- **Idempotency**: All SQL files use `CREATE TABLE IF NOT EXISTS` or similar patterns to ensure they can be re-run safely without damaging existing data.
- **Execution Order**: Migration files are prefixed with a three-digit sequence (e.g., `001_`, `002_`) to guarantee they execute in the correct order.
