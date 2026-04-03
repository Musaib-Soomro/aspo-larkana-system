# Test Plan & Test Cases - ASPO Larkana System

## 1. Introduction
The objective of testing is to ensure that the ASPO Larkana System functions correctly, securely, and provides a stable experience for all users.

## 2. Testing Strategy
- **Manual Testing**: Verifying UI workflows, form validations, and user navigation.
- **API Testing**: Using tools (e.g., Postman) to verify endpoint responses and error handling.
- **Regression Testing**: Ensuring new updates (e.g., transfers, look-after) do not break existing modules (e.g., staff, offices).
- **Internationalization Testing**: Verifying that English and Urdu (RTL) views are consistent and accurate.

## 3. Test Cases

### 3.1 Authentication
| Case ID | Feature | Test Case | Expected Result |
|---|---|---|---|
| AUTH-001 | Login | Login with correct credentials | Successful redirect to Dashboard. |
| AUTH-002 | Login | Login with incorrect credentials | Error message "Invalid username or password". |
| AUTH-003 | Role | Postmaster attempts to access `/audit-log` | Redirect to `/postmaster-dashboard` or 403 error. |
| AUTH-004 | Session | Close browser, reopen and visit Dashboard | User should remain logged in (if cookie is active). |

### 3.2 Staff & Office Management
| Case ID | Feature | Test Case | Expected Result |
|---|---|---|---|
| SOM-001 | Office | Create an office with an existing name | Database returns a "UNIQUE" constraint error; UI shows "Office already exists". |
| SOM-002 | Staff | Add staff with empty required fields | Form shows "This field is required" error. |
| SOM-003 | Staff | Deactivate a staff member | Staff record marked `is_active = false`; login (if user) is revoked. |

### 3.3 Leave & Transfers
| Case ID | Feature | Test Case | Expected Result |
|---|---|---|---|
| LEA-001 | Leave | Register leave longer than available balance | System provides a warning or error message. |
| TRA-001 | Transfer | Mark a staff as "Relieved" | Their status changes to "In Transit"; they no longer appear in the "To" office until "Completed". |
| TRA-002 | Transfer | Complete a transfer | Staff's `office_id` is updated to the new office in the `staff` table. |

### 3.4 ASPO Office Specifics
| Case ID | Feature | Test Case | Expected Result |
|---|---|---|---|
| ASPO-001 | Attendance | Mark status as "On Leave" without a memo | UI prompts to "Select DSPS Leave Memo". |
| ASPO-002 | Attendance | Mark status as "Holiday" | The cell color changes to gray; no further details required. |
| ASPO-003 | VP Deliver | Articles delivered > articles received | System prevents entry or flags a mathematical error. |

### 3.5 UI/UX & Dual-Language
| Case ID | Feature | Test Case | Expected Result |
|---|---|---|---|
| UI-001 | Language | Toggle from English to Urdu | UI text changes to Urdu; layout mirrors (Sidebar moves from left to right). |
| UI-002 | Responsive | Open Dashboard on a mobile screen | Sidebar collapses into a hamburger menu; Bottom navigation bar appears. |

## 4. Defect Reporting
Any failures found during testing should be recorded in the **Maintenance & Support** log with:
- **Case ID**
- **Observed Result**
- **Severity** (Low, Medium, High, Critical)
- **Steps to Reproduce**
