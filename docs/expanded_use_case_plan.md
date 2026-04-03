# Expanded Use Case Documentation Plan

The user indicated that the previous Use Case document was incomplete. This plan outlines a deep dive into every functional module to create a granular, detailed Use Case Document that accurately reflects the system's capabilities.

## User Review Required

> [!IMPORTANT]
> I will expand the Use Case Document to include detailed "Step-by-Step" flows, specific guards (e.g., vacancy checks for look-after), and actor-specific outcomes for all 20+ functional domains.

## Proposed Changes

### [NEW] [use_cases_detailed.md](file:///C:/Users/soomr/.gemini/antigravity/brain/7c5d54ef-9d71-4b8b-bf7c-85f322218b7c/use_cases_detailed.md)
I will create a new, much more detailed Use Case document. If you prefer to replace the original, I will do that instead.

#### Content to be added:
1. **Core Admin Actions**:
    - Detailed Staff/Office lifecycle.
    - User/Role management and permission guards.
2. **Staff Transition Logic**:
    - **Transfers**: Ordered → Relieved → Completed (with transit overdue logic).
    - **Look-after**: Vacancy checks, single-assignment guards, and history tracking.
3. **Office Operations**:
    - **Revenue**: Daily vs Monthly aggregation logic.
    - **Articles**: Daily Articles, VP Articles, and Late Delivery logging.
4. **Governance & Audit**:
    - **Complaints & Inquiries**: Registration, status updates, and reporting.
    - **Audit Log**: Detailed filtering and before/after state comparison.
5. **ASPO Office Specializations**:
    - **Attendance**: DSPS Memo linking and automated leave-id association.
    - **Overseer Module**: Annual EDBO programme planning, Weekly Diary submission, and Work Assignments.
    - **Village Postman**: Route identification and Daily Delivery logging (with balance checks).

## Open Questions
- Do you want me to replace the existing `use_cases.md` or create a new file `use_cases_detailed.md`?
- Should I include "Edge Cases" (e.g., what happens when a transfer is cancelled) in the use case descriptions?

## Verification Plan
### Manual Verification
- I will cross-reference every use case with the corresponding `backend/src/controllers` logic to ensure the "Expected Outcomes" match the code exactly.
- I will verify the "Guards" (e.g., vacancy checks) against the SQL queries in the controllers.
