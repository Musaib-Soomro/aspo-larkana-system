# Change Request Document (CRD) Template - ASPO Larkana System

## 1. Overview
This document provides a template and guidelines for requesting new features or changes to the ASPO Larkana System.

## 2. Change Request Form (Template)

### 2.1 Requester Information
- **Name**: [Insert Name]
- **Role**: [Insert Role]
- **Date**: [Insert Date]

### 2.2 Description of Change
- **Goal**: [What is the desired outcome?]
- **Feature/Issue**: [New feature or modification to an existing one?]
- **Priority**: [Low / Medium / High / Critical]

### 2.3 Business Rationale
- **Reason**: [Why is this change needed? What problem does it solve?]
- **Impact**: [How will this benefit the ASPO Larkana operation?]

### 2.4 Technical Scope
- **Frontend Changes**: [New pages, components, translation keys]
- **Backend Changes**: [New API endpoints, controllers, models]
- **Database Changes**: [New tables, columns, migrations]

## 3. Change Management Review
- **Approver**: [Admin / Developer]
- **Status**: [Proposed / Approved / In Progress / Completed / Rejected]
- **Target Release**: [v0.X.X]

## 4. Implementation Guidelines
Any approved change **MUST** follow the project's established patterns:
1. **Migrations First**: Database schema changes must use an idempotent SQL migration.
2. **Translation Keys**: All UI text must be added to both `en.json` and `ur.json`.
3. **Audit Logging**: Any data modification must be recorded via the `auditLog` service.
4. **Consistency**: UI components must use the common Tailwind classes and React components (e.g., `DataTable`, `FormField`).

## 5. Recent Examples of Change Requests
- **Addition of Transfer Tracking**: Migrated from simple staff updates to a full lifecycle state machine.
- **Look-after Assignments**: Decoupled temporary roles from the primary staff posting for better vacancy management.
- **ASPO Attendance**: Specialized logging for the main office staff, including DSPS memo linking.
- **Dual-Language i18n**: Implementation of Urdu RTL support throughout the application.
- **Visual Redesign**: Introduction of a premium Tailwind-based design system with custom branding.
