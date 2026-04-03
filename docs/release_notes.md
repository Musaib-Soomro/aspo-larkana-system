# Version Control & Release Notes - ASPO Larkana System

## 1. Versioning Strategy
The project uses semantic versioning (**Major.Minor.Patch**).
- **Major**: Significant architectural changes or full module additions.
- **Minor**: New features and functional updates.
- **Patch**: Bug fixes and minor UI tweaks.

## 2. Release History

### v0.9.0 - ASPO Office Staff & Documentation (Current)
- **Features**:
    - Comprehensive Documentation Suite (SRS, SDD, API, User Manual).
    - Attendance Register for ASPO main office.
    - DSPS Leave Memo integration.
    - Overseer Weekly Diaries and EDBO Inspection Programmes.
    - Village Postman Route Lists and Delivery Logs.
- **Migrations**: `025_` to `031_`.

### v0.8.0 - Transfer & Look-After Refactor
- **Features**:
    - Full lifecycle for staff transfers (Ordered → Relieved → Completed).
    - Transit overdue detection for staff in between offices.
    - Dedicated "Look-After Assignments" module to manage vacant posts.
    - Decoupled acting assignments from the transfer system.
- **Migrations**: `020_` to `024_`.

### v0.7.0 - Revenue & Article Tracking
- **Features**:
    - Daily and aggregate revenue reporting for all offices.
    - Tracking for VP articles and late deliveries.
    - Dashboard visualizations for revenue trends.
- **Migrations**: `017_` to `019_`.

### v0.6.0 - Governance & Audit
- **Features**:
    - Centralized Audit Logging for all administrative actions.
    - Complaints and Inquiries modules.
    - Office settings and user management.
- **Migrations**: `008_` to `016_`.

### v0.1.0 - The Foundation
- **Features**:
    - Core Staff and Office management.
    - JWT-based authentication with role-based access.
    - Dual-language (EN/UR) support with RTL mirroring.
- **Migrations**: `001_` to `007_`.

## 3. Version Control Practices
- **Branching**: The main development branch is tracked, with feature-specific work integrated iteratively.
- **Migrations**: All database schema changes are strictly versioned within `backend/database/migrations/` and executed in order via the migration runner.
- **Environment**: Configuration is managed through `.env` files for both backend and frontend.
