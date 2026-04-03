# Software Design Document (SDD) - ASPO Larkana System

## 1. Design Principles
The ASPO Larkana System follows modern design principles to provide a premium user experience:
- **Consistency**: Unified typography (Playfair Display for headings), colors (Brand Red, Warm Cream), and layout patterns.
- **Responsiveness**: Mobile-first design with a sidebar that adapts to desktop views.
- **Accessibility**: Semantic HTML, proper form labellings, and ARIA attributes where needed.
- **Dual-Language UX**: RTL (Right-to-Left) mirroring for Urdu-speaking users.

## 2. UI/UX Design (Frontend)

### 2.1 Reusable Components
The React frontend uses a library of custom components found in `frontend/src/components/common`:
- **`<DataTable>`**: A standardized table with pagination, loading states, and customizable columns.
- **`<StatusBadge>`**: Dynamic badges with status-specific colors (e.g., success=green, danger=red).
- **`<PageHeader>`**: Centralized header for page titles and main actions.
- **`<FormField>`**: Wrapper for consistent form input layouts (labeling, error messages, requirements).
- **`<ConfirmModal>`**: Reusable confirmation dialog for dangerous actions (delete, submit).

### 2.2 Layout & Navigation
- **Sidebar**: The primary navigation link repository. It supports icons, role-based visibility, and divider sections.
- **BottomNav**: A mobile-optimized navigation bar for quick access to core features (Dashboard, Staff, Revenue).
- **AppShell**: The main wrapper providing the top bar, sidebar, and content area with smooth transitions.

## 3. Backend Implementation Patterns

### 3.1 Controller Pattern
All backend controllers use a consistent asynchronous pattern for data fetching and modification:
```javascript
async function listEntity(req, res, next) {
  try {
    const { page, limit, filter } = req.query;
    // Dynamic query building...
    const result = await pool.query(`SELECT ... LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ success: true, data: result.rows, pagination: { ... } });
  } catch(err) { next(err); }
}
```

### 3.2 Audit Log Integration
Every database modification (INSERT, UPDATE, DELETE) is recorded via the `audit.log` service:
```javascript
const audit = require('../services/auditLog');
// After successful DB update:
await audit.log({
  userId: req.user.id,
  action: 'UPDATE',
  table: 'staff',
  recordId: staffId,
  before: oldRecord,
  after: newRecord
});
```

## 4. Security Design
- **JWT (JSON Web Tokens)**: Used for stateless user authentication. The token is typically stored in an HTTP-only cookie to prevent XSS.
- **Role-Based Access Control (RBAC)**: The `requireRole('admin')` middleware restricts sensitive routes.
- **Input Validation**: Backend routes use validation logic before interacting with the database.

## 5. Performance Optimization
- **Database Indexing**: Strategically placed indexes on `staff_id`, `date`, and `office_id` columns.
- **Pagination**: All list-based APIs use pagination to limit the amount of data transferred and rendered at once.
- **React Optimization**: Use of `useEffect` for data fetching and `useState` for local UI states, ensuring efficient re-renders.
