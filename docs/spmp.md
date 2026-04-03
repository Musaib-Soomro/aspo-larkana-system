# Software Project Management Plan (SPMP) - ASPO Larkana System

## 1. Project Overview
### 1.1 Project Objectives
The objective of the ASPO Larkana System is to digitize and maintain the records of the ASPO office in Larkana. This includes moving from manual Excel and paper-based tracking to a centralized web-based system for increased efficiency, accuracy, and accountability.

### 1.2 Project Scope
The scope includes the development of the frontend and backend, database design, user authentication, and specialized modules for post office operations.

## 2. Project Lifecycle
The project follows an **Iterative and Incremental** lifecycle, as evidenced by the `PROGRESS.md` log, where features are planned, implemented, and refined in sequence.

## 3. Milestones and Current Status

| Phase | Description | Status |
|---|---|---|
| **Phase 1: Core System** | Authentication, Basic Office and Staff Management | **Completed** |
| **Phase 2: Leave & Inspections** | Leave Balance, EDBO Programme Planning | **Completed** |
| **Phase 3: Revenue & Articles** | Revenue Logging, Daily/VP Articles, Late Deliveries | **Completed** |
| **Phase 4: Transfer Tracking** | Lifecycle of Staff Transfers (Ordered → Completed) | **Completed** |
| **Phase 5: Look-After System** | Vacancy Management, Look-after Assignments | **Completed** |
| **Phase 6: ASPO Office Staff** | Attendance, Delivery Logs, Overseer Diaries | **Completed** |
| **Phase 7: Documentation** | Comprehensive documentation suite (SRS, SDD, User Manual, etc.) | **In Progress** |

## 4. Organization and Resources
- **Tech Stack**:
    - **Frontend**: React (with React Router v7).
    - **Backend**: Node.js/Express.
    - **Database**: PostgreSQL.
    - **CSS**: Tailwind CSS.
- **Repository**: Git-based version control with migration-led schema updates.

## 5. Risk Management
- **Risk**: Data loss during migrations.
    - **Mitigation**: All migrations are idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- **Risk**: User adoption for dual-language users.
    - **Mitigation**: Full UI translation (English/Urdu) with consistent terminology.
- **Risk**: Session issues on cold load.
    - **Mitigation**: Monitoring `auth/me` errors and ensuring silent recovery on login.

## 6. Schedule and Deliverables
The project deliverables include the source code, database migrations, and the documentation suite being generated now.
- **Start Date**: Unknown (Initial `PROGRESS.md` dates go back to 2024).
- **Current Version**: 0.9.0 (Approaching full feature set).
- **Final Deliverable**: Documentation suite (Phase 7).
