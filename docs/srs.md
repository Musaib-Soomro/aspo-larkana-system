# Software Requirements Specification (SRS) - ASPO Larkana System

## 1. Introduction
### 1.1 Purpose
The purpose of this document is to provide a detailed description of the software requirements for the ASPO Larkana System. It will outline the functional and non-functional requirements, project scope, and system constraints.

### 1.2 Scope
The ASPO Larkana System is a digital management platform designed for the Assistant Superintendent of Post Offices (ASPO) in Larkana. It automates manual record-keeping for post offices, staff, leave, inspections, revenue, complaints, and inquiries. It also includes specialized modules for ASPO office staff, such as attendance and delivery tracking.

### 1.3 Definitions, Acronyms, and Abbreviations
- **ASPO**: Assistant Superintendent of Post Offices.
- **RBAC**: Role-Based Access Control.
- **SPA**: Single Page Application.
- **GPO**: General Post Office.
- **EDBO**: Extra-Departmental Branch Office.

## 2. Overall Description
### 2.1 Product Perspective
The system is a self-contained web application with a React frontend and a Node.js/Express backend, using a PostgreSQL database.

### 2.2 Product Functions (Functional Requirements)
- **User Authentication & Authorization**: Secure login with Role-Based Access Control (Admin, Postmaster, Viewer).
- **Office Management**: Create, update, and view details of post offices (Tehsil, District, Shift, type).
- **Staff Management**: Tracking staff details (Designation, BPS, Employee ID, Posting history).
- **Leave Management**: Registration and balance tracking for staff leave.
- **Transfer Tracking**: Full lifecycle tracking of staff transfers (Ordered → Relieved → Completed).
- **Look-after Assignments**: Managing temporary assignments for vacant posts.
- **Inspection Management**: Yearly programme planning and visit tracking for EDBOs.
- **Revenue & Article Tracking**: Logging daily revenue, VP articles, and delivery logs.
- **Complaint & Inquiry Management**: Registering and tracking the status of complaints and inquiries.
- **ASPO Office Specifics**:
    - Daily Attendance Register.
    - DSPS Leave Memo registration.
    - Overseer Weekly Diaries & Work Assignments.
    - Village Postman Route Lists & Delivery Logs.
- **Audit Logging**: Tracking all administrative actions (INSERT/UPDATE/DELETE).
- **Dual-Language Support**: Complete UI in both English and Urdu with RTL support.

### 2.3 User Classes and Characteristics
- **Admin**: Full access to all modules, configuration, and user management.
- **Postmaster**: Limited access, primarily focused on revenue and articles for their specific office.
- **Viewer**: Read-only access to specific reports.

### 2.4 Operating Environment
- **Server**: Node.js 18+, PostgreSQL 14+.
- **Client**: Modern web browsers (Chrome, Firefox, Edge, Safari).

## 3. Non-Functional Requirements
### 3.1 Performance
- Dashboard and list pages should load within 2 seconds.
- Concurrent user support for at least 50 users.

### 3.2 Security
- JWT-based authentication.
- Password hashing using bcrypt.
- Input validation on both frontend and backend.

### 3.3 Reliability
- Automatic database migrations and idempotent schema updates.
- Global error handling for both API and UI.

### 3.4 Accessibility & Internationalization
- Support for English (LTR) and Urdu (RTL).
- Responsive design for mobile and desktop access.

## 4. Business Rules
- Staff cannot be assigned to more than one "Look-after" position simultaneously.
- Transfers must follow a strict state machine (Ordered → Relieved → Completed).
- EDBO inspections are planned annually.
