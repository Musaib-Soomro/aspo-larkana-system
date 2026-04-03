# ASPO Larkana — Master Reference & Session Protocol

---

## ◆ CLAUDE: MANDATORY INSTRUCTIONS (Read First, Every Session)

> These rules apply to **every session**, for **every feature**, forever. Not just for transfers.

### Session Start Protocol
1. **ALWAYS read this file first** before doing anything else
2. **Do NOT explore project files** for information already documented here — use this file as the source of truth
3. Check the **Active Plan** section — if a plan exists with a progress tracker, resume from the first `⬜ Not started` or `🔄 In progress` step
4. If no active plan exists, check **Future Plans** queue — tell the user what's queued and ask if they want to start the next one or work on something else

### Planning Protocol (for any new feature)
1. Explore only what's needed to understand the scope
2. Design the plan — get user approval
3. If an Active Plan is currently in progress: write the new plan into the **Future Plans** section (do not disrupt the active plan)
4. If no Active Plan exists: write the new plan directly into the **Active Plan** section and begin implementing
5. Every plan must include: DB schema changes, backend steps, frontend steps, wiring, translation keys, verification checklist, and a **progress tracker table**

### Multi-Plan Queue Rules
- **Only one Active Plan at a time** — never implement two plans simultaneously
- When the user says "save this for later" or describes a future feature: add it to **Future Plans** with a brief description
- When Active Plan completes: move its one-line summary to **Completed Work**, delete the Active Plan section, then promote the first Future Plan into Active Plan position and ask the user to confirm before starting
- Future Plans are stored in order — implement top-to-bottom unless the user reorders them
- The user can add, remove, or reorder Future Plans at any time by telling you to update this file

### Implementation Protocol
1. Work through the active plan **one step at a time**, in order
2. After completing each step, **immediately update the tracker** from `⬜ Not started` → `✅ Done`
3. If a step is partially done, mark it `🔄 In progress` before stopping
4. Never batch-update the tracker — update it after each individual step
5. After each file is written/edited, confirm it worked before moving to the next

### Session Recovery (after limit reset or restart)
- User will say: *"Read PROGRESS.md and continue"*
- You: read this file → find first `⬜` or `🔄` in the Active Plan tracker → resume from there
- **Do not re-explore files already documented here**

### What NOT to do
- Do not read files whose content is already in this document
- Do not re-design things already planned — implement the plan as written
- Do not start a Future Plan without user confirmation
- Do not add unrequested features during implementation
- Do not skip the tracker update after each step
- Do not ask "shall I proceed?" mid-implementation unless you hit something unexpected

---

## ◆ Environment & Commands

```
Project root:  E:\ClaudeCode\aspo-larkana-system\
Backend:       backend/      → runs on port 5000
Frontend:      frontend/     → runs on port 3000 (proxies API to :5000)
Database:      PostgreSQL, DB name: aspo_larkana
```

### Start Dev Environment
```bash
# Terminal 1 — Backend
cd backend && npm run dev        # nodemon src/server.js

# Terminal 2 — Frontend
cd frontend && npm start         # react-scripts start

# Run migrations (after adding a new .sql file)
cd backend && npm run migrate    # runs ALL migration files in order
```

### Migration Runner Behavior
- Reads every `.sql` file in `backend/database/migrations/` sorted alphabetically
- Runs ALL of them every time — no tracking table
- **All migrations MUST be idempotent**: use `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DO $$ BEGIN...END $$` blocks
- Last migration run: **019** — next file must be **020_...**

---

## ◆ Project Structure

```
aspo-larkana-system/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express app setup (CORS, middleware, routes)
│   │   ├── server.js                 # Entry point (DB connect + listen)
│   │   ├── controllers/              # One file per domain
│   │   ├── routes/
│   │   │   ├── index.js              # ← Register all routes here
│   │   │   └── [auth, offices, staff, leave, inspections,
│   │   │        complaints, revenue, articles, inquiries,
│   │   │        dashboard, pdf, settings, auditLog, users].js
│   │   ├── middleware/
│   │   │   ├── auth.js               # authenticate, requireRole('admin')
│   │   │   └── errorHandler.js       # Global error handler → { success:false, error:msg }
│   │   ├── models/db.js              # pg Pool — const pool = require('../models/db')
│   │   └── services/auditLog.js      # audit.log({ userId, action, table, recordId, before, after })
│   └── database/
│       ├── migrate.js                # Migration runner
│       ├── migrations/               # 001–023 done; add 024 next
│       └── seeds/
└── frontend/
    └── src/
        ├── App.js                    # ALL routes defined here
        ├── components/
        │   ├── common/               # DataTable, StatusBadge, PageHeader, FormField,
        │   │                         # ConfirmModal, LoadingSpinner
        │   └── layout/               # Sidebar, TopBar, BottomNav
        ├── context/
        │   ├── AuthContext.jsx        # useAuth(), useIsAdmin()
        │   ├── LanguageContext.jsx    # useLanguage() → { t, lang, toggleLang }
        │   └── NotificationContext.jsx
        ├── locales/
        │   ├── en.json               # English — add all new keys here
        │   └── ur.json               # Urdu — must stay in sync with en.json
        ├── pages/                    # One folder per domain
        └── utils/
            ├── api.js                # Axios instance (baseURL: /api/v1)
            ├── constants.js          # DESIGNATIONS, LEAVE_STATUSES, etc.
            └── dateFormat.js         # formatDate(dateStr) → "29 Aug 2024"
```

---

## ◆ Backend Patterns (copy exactly)

### Controller structure
```js
const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listFoo(req, res, next) {
  try {
    const { page = 1, limit = 20, filter1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = []; const conditions = [];
    if (filter1) { params.push(filter1); conditions.push(`col = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit)); params.push(offset);
    const result = await pool.query(`SELECT ... ${where} LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    const count = await pool.query(`SELECT COUNT(*) FROM foo ${where}`, params.slice(0,-2));
    const total = parseInt(count.rows[0].count);
    return res.json({ success: true, data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total/limit) } });
  } catch(err) { next(err); }
}

async function createFoo(req, res, next) {
  try {
    const { field1, field2 } = req.body;
    const result = await pool.query(
      `INSERT INTO foo (field1, field2) VALUES ($1,$2) RETURNING *`, [field1, field2]);
    await audit.log({ userId: req.user.id, action: 'INSERT', table: 'foo',
      recordId: result.rows[0].id, after: result.rows[0] });
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch(err) { next(err); }
}

async function updateFoo(req, res, next) {
  try {
    const { id } = req.params;
    const before = (await pool.query('SELECT * FROM foo WHERE id=$1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Not found.' });
    // build updates dynamically...
    const result = await pool.query(`UPDATE foo SET ..., updated_at=NOW() WHERE id=$N RETURNING *`, params);
    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'foo',
      recordId: parseInt(id), before, after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch(err) { next(err); }
}

module.exports = { listFoo, createFoo, updateFoo };
```

### Transaction pattern (multi-table updates)
```js
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const r = await client.query('UPDATE table1 SET ... WHERE id=$1 RETURNING *', [...]);
  await client.query('UPDATE table2 SET ... WHERE id=$1', [...]);
  await client.query('COMMIT');
  return res.json({ success: true, data: r.rows[0] });
} catch(err) {
  await client.query('ROLLBACK');
  next(err);
} finally { client.release(); }
```

### Route file
```js
const express = require('express');
const router = express.Router();
const { listFoo, getFoo, createFoo, updateFoo } = require('../controllers/fooController');
const { authenticate, requireRole } = require('../middleware/auth');
router.use(authenticate);
router.get('/', listFoo);
router.get('/:id', getFoo);
router.post('/', requireRole('admin'), createFoo);
router.put('/:id', requireRole('admin'), updateFoo);
module.exports = router;
```

### Register in `backend/src/routes/index.js`
```js
router.use('/foo', require('./foo'));   // add this line
```

---

## ◆ Frontend Patterns (copy exactly)

### API calls
```js
import api from '../../utils/api';
// baseURL = '/api/v1', withCredentials: true, 401 → redirect to /login
api.get('/foo', { params: { page: 1, filter: 'x' } })
api.post('/foo', { field1: 'val' })
api.put(`/foo/${id}`, { field1: 'updated' })
```

### Hooks
```js
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../../utils/dateFormat';

const { t, lang } = useLanguage();   // t('keyName'), lang === 'ur' or 'en'
const isAdmin = useIsAdmin();         // true/false
const navigate = useNavigate();
const { id } = useParams();
```

### List Page pattern
```jsx
const [data, setData] = useState([]);
const [pagination, setPagination] = useState(null);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({ status: '', search: '', page: 1 });

useEffect(() => {
  setLoading(true);
  const params = { page: filters.page };
  if (filters.status) params.status = filters.status;
  if (filters.search) params.search = filters.search;
  api.get('/foo', { params })
    .then(res => { setData(res.data.data); setPagination(res.data.pagination); })
    .finally(() => setLoading(false));
}, [filters]);
```

### Form Page pattern
```jsx
const [form, setForm] = useState({ field1: '', field2: '' });
const [error, setError] = useState('');
const [saving, setSaving] = useState(false);
function set(field) { return (e) => setForm({ ...form, [field]: e.target.value }); }

async function handleSubmit(e) {
  e.preventDefault(); setError(''); setSaving(true);
  try {
    await api.post('/foo', { ...form, numeric_id: parseInt(form.numeric_id) });
    navigate('/foo');
  } catch(err) { setError(err.response?.data?.error || 'Failed to save.'); }
  finally { setSaving(false); }
}
```

### Detail Page pattern
```jsx
const { id } = useParams();
const [record, setRecord] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  api.get(`/foo/${id}`).then(r => setRecord(r.data.data)).finally(() => setLoading(false));
}, [id]);
if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;
if (!record) return <p className="text-center text-gray-400 py-12">Not found.</p>;
```

---

## ◆ Component API Reference

### `<PageHeader>`
```jsx
import PageHeader from '../../components/common/PageHeader';
<PageHeader title={t('foo')} action={t('newFoo')} onAction={() => navigate('/foo/new')} />
<PageHeader title={t('newFoo')} backTo="/foo" />
```

### `<DataTable>`
```jsx
import DataTable from '../../components/common/DataTable';
const columns = [
  { key: 'name', label: t('name') },
  { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
  { key: 'date', label: t('date'), render: (r) => formatDate(r.date) },
  { key: 'actions', label: t('actions'), render: (r) => (
    <button onClick={() => navigate(`/foo/${r.id}`)} className="text-primary text-xs hover:underline">
      {t('view')} →
    </button>
  )},
];
<DataTable columns={columns} data={data} loading={loading}
  pagination={pagination} onPageChange={(p) => setFilters({...filters, page: p})}
  emptyMessage={t('noData')} />
```

### `<StatusBadge>`
```jsx
import StatusBadge from '../../components/common/StatusBadge';
<StatusBadge status={r.status} />

// To add new statuses, edit StatusBadge.jsx:
// STATUS_COLORS: { 'MyStatus': 'bg-blue-100 text-blue-700 border-blue-300' }
// STATUS_KEY_MAP: { 'MyStatus': 'myStatusLocaleKey' }
// Existing colors: success=green, alert=amber, danger=red, blue, orange, purple, gray
```

### `<FormField>` + inputs
```jsx
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
// FormField wraps children in <label> — never nest another <label> inside
<FormField label={t('name')} required>
  <Input type="text" value={form.name} onChange={set('name')} required />
</FormField>
<FormField label={t('type')} required>
  <Select value={form.type} onChange={set('type')} required>
    <option value="">— {t('select')} —</option>
    {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
  </Select>
</FormField>
<FormField label={t('notes')}>
  <Textarea value={form.notes} onChange={set('notes')} rows={3} />
</FormField>
```

### `<ConfirmModal>`
```jsx
import ConfirmModal from '../../components/common/ConfirmModal';
const [showConfirm, setShowConfirm] = useState(false);
<ConfirmModal open={showConfirm} title="Are you sure?" message="This cannot be undone."
  danger onConfirm={handleDelete} onCancel={() => setShowConfirm(false)} />
```

### `<LoadingSpinner>`
```jsx
import LoadingSpinner from '../../components/common/LoadingSpinner';
if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;
```

---

## ◆ Sidebar Nav — How to Add a Link

The Sidebar uses a `NAV_ITEMS` array in `frontend/src/components/layout/Sidebar.jsx`. Each item:
```js
{ to: '/foo', icon: 'iconName', key: 'localeKey', roles: ['admin'], dividerBefore: false }
// roles: omit = visible to all; ['admin'] = admin only; ['admin','viewer'] = admin+viewer
// dividerBefore: true = renders a separator line above this item
// icon: must exist as a key in the Icons object at top of Sidebar.jsx
```

**To add a new nav item:**
1. Add an SVG entry to the `Icons` object in `Sidebar.jsx`
2. Add an entry to `NAV_ITEMS` array in the correct position
3. Add the locale key to `en.json` and `ur.json`
4. **BottomNav** (`BottomNav.jsx`) is mobile-only quick access — only add to TABS if it's a primary action used frequently by all roles

---

## ◆ App.js — How to Add Routes

```jsx
// 1. Import at top
import FooListPage   from './pages/foo/FooListPage';
import FooFormPage   from './pages/foo/FooFormPage';
import FooDetailPage from './pages/foo/FooDetailPage';

// 2. Inside <Route element={<RequireAuth />}>:
//    For admin-only: inside <Route element={<AdminOnly />}>
<Route path="/foo"       element={<FooListPage />} />
<Route path="/foo/new"   element={<FooFormPage />} />
<Route path="/foo/:id"   element={<FooDetailPage />} />
<Route path="/foo/:id/edit" element={<FooFormPage />} />

// Role wrappers available:
// <AdminOnly /> — redirects postmaster to /postmaster-dashboard
// No viewer-only wrapper exists — use isAdmin hook in component for UI differences
```

---

## ◆ Tailwind Design System

```
bg-surface        warm cream #F8F5F1
bg-primary        brand red #E8192C
text-primary      brand red
text-danger       red (errors)
text-success      green
text-alert        amber
border-border     warm beige #E0D4C8
shadow-card       standard card shadow
shadow-card-hover hover state shadow
rounded-xl        standard card radius
font-display      Playfair Display (headings only)
btn-primary       red button (defined in index.css)
```

### Card pattern
```jsx
<div className="bg-white rounded-xl shadow-card p-5 mb-4">
  <h2 className="font-display text-base font-semibold text-gray-800 mb-3">{t('sectionTitle')}</h2>
  {/* content */}
</div>
```

### Info row pattern (detail pages)
```jsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('label')}</p>
    <p className="text-sm text-gray-800 font-medium mt-0.5">{value || '—'}</p>
  </div>
</div>
```

---

## ◆ Existing Database Schemas

### staff
```
id, office_id→offices, full_name, designation CHECK('Postmaster','Postman','Mail Peon','Mail Runner'),
bps, employee_id, date_of_joining, current_posting_date(019), date_of_birth(019),
is_active, is_on_leave, is_on_lookafter, lookafter_office_id→offices, created_at, updated_at
```

### offices
```
id, name UNIQUE, type, shift, tehsil, district, account_office, bps_category, has_edbos, created_at, updated_at
```

### leave_records
```
id, staff_id→staff, leave_type, start_date, end_date, total_days, reason,
approved_by DEFAULT 'ASPO Larkana', status CHECK('Active','Completed','Cancelled'),
substitute_staff_id→staff, notes, created_at
```

### users
```
id, username UNIQUE, password_hash, role CHECK('admin','postmaster','viewer'), office_id→offices, created_at, updated_at
```

### Other existing tables (no schema changes needed for transfer feature)
`leave_type_config, inspection_programme, inspection_visits, complaints, revenue_entries,
revenue_data, inquiries, audit_log, settings, daily_articles, vp_articles, late_deliveries`

---

## ◆ Completed Work

| # | Feature | Details |
|---|---------|---------|
| 1 | Dual Language EN/UR | 360 keys in en.json/ur.json; RTL via `document.documentElement.dir` |
| 2 | Visual Redesign | Design tokens in tailwind.config.js; Sidebar, TopBar, BottomNav, AppShell |
| 3 | Migration 016 | Fixed offices unique constraint (`DO $$ BEGIN...END $$`) |
| 4 | Migration 017 | Created `daily_articles` table |
| 5 | Migration 018 | Created `vp_articles` + `late_deliveries` tables |
| 6 | Migration 019 | Added `current_posting_date`, `date_of_birth` to staff table |
| 7 | Accessibility | FormField nested label pattern; id/name/htmlFor across all forms |
| 8 | Browser fixes | Favicon, theme-color, React Router v7 future flags |
| 9 | Transfer Tracking System | Migration 020; full transfer lifecycle (Ordered→Relieved→Completed); transit overdue detection; 35 EN/UR keys |
| 10 | Transfer UX fixes | Searchable staff input in TransferFormPage; Delete transfer on list page (guards Completed); backend DELETE route |
| 11 | Acting Postmaster (removed) | Deprecated — replaced by Look-After Assignments feature |
| 12 | Look-After Assignments | Migration 024; standalone `lookafter_assignments` table; decoupled from transfers; vacancy + single-assignment guards; full history with search/filter; staff detail card; 21 EN/UR keys |

---

## ◆ Known Issues

- `auth/me` 500 on cold load — harmless, fires before session is established, resolves on login
- Always run `cd backend && npm run migrate` after adding any new migration file

---

---

# ★ FUTURE PLANS (Queue)

> No future plans queued.

---

# ★ ACTIVE PLAN: ASPO Office Staff System

> **Next migration**: 025 (024 = lookafter_assignments)

### Context
The ASPO Larkana office has 3 direct staff: Mail Overseer, Orderly Mail Peon, Village Postman. No attendance or work tracking exists for them. Leave for these staff is NOT granted by ASPO — it comes via written memo from DSPS, so leave registration needs a DSPS memo reference. Beyond attendance, the Mail Overseer needs EDBO inspection programme tracking, weekly diary submissions, and work assignment logging. The Village Postman needs a route list and daily delivery log. The Orderly Mail Peon needs attendance only.

### Scope

| Staff | Modules |
|-------|---------|
| All 3 | Daily Attendance Register + DSPS Leave Memo registration |
| Mail Overseer | EDBO Yearly Inspection Programme + Weekly Diary + Work Assignments |
| Village Postman | Route List + Daily Delivery Log |
| Orderly Mail Peon | Attendance only |

---

### Progress Tracker

| Step | Task | Status |
|------|------|--------|
| 1 | `025_extend_leave_records_dsps_memo.sql` | ✅ Done |
| 2 | `026_create_attendance_records.sql` | ✅ Done |
| 3 | `027_create_edbo_programmes.sql` | ✅ Done |
| 4 | `028_create_overseer_diaries.sql` | ✅ Done |
| 5 | `029_create_work_assignments.sql` | ✅ Done |
| 6 | `030_create_vp_routes.sql` | ✅ Done |
| 7 | `031_create_vp_delivery_logs.sql` | ✅ Done |
| 8 | `backend/src/controllers/attendanceController.js` | ✅ Done |
| 9 | `backend/src/controllers/edboProgrammeController.js` | ✅ Done |
| 10 | `backend/src/controllers/overseerDiaryController.js` | ✅ Done |
| 11 | `backend/src/controllers/workAssignmentController.js` | ✅ Done |
| 12 | `backend/src/controllers/vpRouteController.js` | ✅ Done |
| 13 | `backend/src/controllers/vpDeliveryController.js` | ✅ Done |
| 14 | `backend/src/routes/` — 6 new route files | ✅ Done |
| 15 | `backend/src/routes/index.js` — register 6 routes | ✅ Done |
| 16 | `frontend/src/pages/attendance/` — 3 pages | ✅ Done |
| 17 | `frontend/src/pages/edbo/` — 2 pages | ✅ Done |
| 18 | `frontend/src/pages/overseerDiary/` — 2 pages | ✅ Done |
| 19 | `frontend/src/pages/workAssignments/` — 2 pages | ✅ Done |
| 20 | `frontend/src/pages/vpDelivery/` — 3 pages | ✅ Done |
| 21 | `frontend/src/App.js` — add all routes | ✅ Done |
| 22 | `frontend/src/components/layout/Sidebar.jsx` — ASPO Office section | ✅ Done |
| 23 | `frontend/src/components/common/StatusBadge.jsx` — On Duty, Holiday | ✅ Done |
| 24 | `frontend/src/locales/en.json` + `ur.json` — ~40 keys | ✅ Done |
| 25 | `frontend/src/utils/constants.js` — ATTENDANCE_STATUSES, ASSIGNMENT_STATUSES | ✅ Done |
| 26 | Run `cd backend && npm run migrate` and verify all 7 migrations | ✅ Done |

---

### Step 1 — Migration 021: Extend leave_records

**Create:** `backend/database/migrations/023_extend_leave_records_dsps_memo.sql`
```sql
ALTER TABLE leave_records
  ADD COLUMN IF NOT EXISTS dsps_memo_no   VARCHAR(80),
  ADD COLUMN IF NOT EXISTS dsps_memo_date DATE;
```
- ASPO office staff leaves: both fields filled in, `approved_by = 'DSPS Larkana'`
- Sub-office staff leaves: both fields remain NULL (no change to existing behaviour)

---

### Step 2 — Migration 022: attendance_records

**Create:** `backend/database/migrations/024_create_attendance_records.sql`
```sql
CREATE TABLE IF NOT EXISTS attendance_records (
  id         SERIAL PRIMARY KEY,
  staff_id   INTEGER NOT NULL REFERENCES staff(id),
  date       DATE    NOT NULL,
  status     VARCHAR(20) NOT NULL
             CHECK (status IN ('Present','Absent','On Leave','On Duty','Holiday')),
  leave_id   INTEGER REFERENCES leave_records(id),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, date)
);
CREATE INDEX IF NOT EXISTS idx_att_staff ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_att_date  ON attendance_records(date);
```
Status meanings: `Present`=at office, `Absent`=no leave, `On Leave`=DSPS memo leave (link leave_id), `On Duty`=working off-site, `Holiday`=public holiday/weekly off

---

### Step 3 — Migration 023: edbo_programmes + edbo_assignments

**Create:** `backend/database/migrations/025_create_edbo_programmes.sql`
```sql
CREATE TABLE IF NOT EXISTS edbo_programmes (
  id         SERIAL PRIMARY KEY,
  year       INTEGER NOT NULL,
  staff_id   INTEGER NOT NULL REFERENCES staff(id),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, year)
);

CREATE TABLE IF NOT EXISTS edbo_assignments (
  id             SERIAL PRIMARY KEY,
  programme_id   INTEGER NOT NULL REFERENCES edbo_programmes(id) ON DELETE CASCADE,
  edbo_name      VARCHAR(150) NOT NULL,
  assigned_month INTEGER NOT NULL CHECK (assigned_month BETWEEN 1 AND 12),
  status         VARCHAR(20) NOT NULL DEFAULT 'Pending'
                 CHECK (status IN ('Pending','Completed','Carried Forward')),
  completed_date DATE,
  remarks        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_edbo_prog  ON edbo_assignments(programme_id);
CREATE INDEX IF NOT EXISTS idx_edbo_month ON edbo_assignments(assigned_month);
```

---

### Step 4 — Migration 024: overseer_diaries

**Create:** `backend/database/migrations/026_create_overseer_diaries.sql`
```sql
CREATE TABLE IF NOT EXISTS overseer_diaries (
  id              SERIAL PRIMARY KEY,
  staff_id        INTEGER NOT NULL REFERENCES staff(id),
  week_start_date DATE    NOT NULL,
  week_end_date   DATE    NOT NULL,
  places_visited  TEXT,
  work_summary    TEXT,
  observations    TEXT,
  submitted_date  DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, week_start_date)
);
CREATE INDEX IF NOT EXISTS idx_diary_staff ON overseer_diaries(staff_id);
```

---

### Step 5 — Migration 025: work_assignments

**Create:** `backend/database/migrations/027_create_work_assignments.sql`
```sql
CREATE TABLE IF NOT EXISTS work_assignments (
  id               SERIAL PRIMARY KEY,
  staff_id         INTEGER NOT NULL REFERENCES staff(id),
  assigned_date    DATE    NOT NULL,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  order_type       VARCHAR(10) NOT NULL CHECK (order_type IN ('Written','Verbal')),
  order_reference  VARCHAR(80),
  due_date         DATE,
  status           VARCHAR(20) NOT NULL DEFAULT 'Open'
                   CHECK (status IN ('Open','In Progress','Completed')),
  completion_date  DATE,
  completion_notes TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assign_staff  ON work_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_assign_status ON work_assignments(status);
```

---

### Step 6 — Migration 026: vp_routes

**Create:** `backend/database/migrations/028_create_vp_routes.sql`
```sql
CREATE TABLE IF NOT EXISTS vp_routes (
  id             SERIAL PRIMARY KEY,
  staff_id       INTEGER NOT NULL REFERENCES staff(id),
  route_name     VARCHAR(150) NOT NULL,
  villages       TEXT NOT NULL,
  frequency      VARCHAR(50),
  source         VARCHAR(100) NOT NULL DEFAULT 'Larkana GPO',
  effective_date DATE NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### Step 7 — Migration 027: vp_delivery_logs

**Create:** `backend/database/migrations/029_create_vp_delivery_logs.sql`
```sql
CREATE TABLE IF NOT EXISTS vp_delivery_logs (
  id                   SERIAL PRIMARY KEY,
  staff_id             INTEGER NOT NULL REFERENCES staff(id),
  route_id             INTEGER REFERENCES vp_routes(id),
  date                 DATE    NOT NULL,
  articles_received    INTEGER NOT NULL DEFAULT 0,
  articles_delivered   INTEGER NOT NULL DEFAULT 0,
  articles_undelivered INTEGER NOT NULL DEFAULT 0,
  undelivered_reason   TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, date)
);
CREATE INDEX IF NOT EXISTS idx_delivery_staff ON vp_delivery_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_delivery_date  ON vp_delivery_logs(date);
```

---

### Steps 8–13 — Backend Controllers

**Register all in `backend/src/routes/index.js` (Step 15):**
```js
router.use('/attendance',       require('./attendance'));
router.use('/edbo-programmes',  require('./edboProgrammes'));
router.use('/overseer-diaries', require('./overseerDiaries'));
router.use('/work-assignments', require('./workAssignments'));
router.use('/vp-routes',        require('./vpRoutes'));
router.use('/vp-delivery',      require('./vpDelivery'));
```

**`attendanceController.js`** — functions:
- `getMonthlyRegister(req, res, next)`: params `month`, `year`, `office_id`. Returns all staff for that office with a day-keyed object of their attendance status for every day of the month. Null = not yet marked. Shape: `{ staff: [{ id, name, designation, days: { "2026-03-01": "Present", ... } }] }`
- `markAttendance(req, res, next)`: UPSERT on `(staff_id, date)`. If `status='On Leave'`, requires `leave_id` and validates leave record covers that date. Audit log.
- `getAttendanceReport(req, res, next)`: params `staff_id`, `month` (optional), `year`. Returns totals: `{ present, absent, on_leave, on_duty, holidays, working_days, attendance_pct }`. Month omitted = full year.
- `createLeaveMemo(req, res, next)`: required `staff_id`, `dsps_memo_no`, `dsps_memo_date`, `leave_type`, `start_date`, `end_date`. Inserts into `leave_records` with `approved_by='DSPS Larkana'`, `dsps_memo_no`, `dsps_memo_date`. Returns leave record with `id` for attendance linking.

**`edboProgrammeController.js`** — functions:
- `listProgrammes`: paginated list with counts (total/completed/pending/carried forward)
- `getProgramme`: single programme with all `edbo_assignments` grouped by month
- `createProgramme`: creates programme + bulk-insert assignments array
- `updateAssignment`: update single `edbo_assignments` row — set status, completed_date, remarks. Audit log.

**`overseerDiaryController.js`** — functions:
- `listDiaries`: filter by `year`, paginated
- `getDiary`: single record
- `createDiary`: insert, UNIQUE constraint handles duplicates
- `updateDiary`: update fields

**`workAssignmentController.js`** — functions:
- `listAssignments`: filter by `staff_id`, `status`; paginated
- `getAssignment`: single record
- `createAssignment`: insert
- `updateAssignment`: update — if status changes to `Completed`, validate `completion_date` is provided

**`vpRouteController.js`** — functions:
- `listRoutes`: filter by `staff_id`, `is_active`
- `getRoute`: single record
- `createRoute`: insert
- `updateRoute`: update (deactivate old route before creating new one for same staff)

**`vpDeliveryController.js`** — functions:
- `listDeliveryLogs`: filter by `staff_id`, `month`, `year`; paginated
- `getMonthlyDelivery`: aggregate totals for a month (received/delivered/undelivered)
- `createLog`: insert, auto-set `articles_undelivered = received - delivered`
- `updateLog`: update

---

### Steps 16–20 — Frontend Pages

**Sidebar — new "ASPO Office" section** (admin only, `dividerBefore: true`):
```js
{ to: '/attendance',      icon: 'attendance',    key: 'attendanceRegister', roles: ['admin'], dividerBefore: true },
{ to: '/edbo-programme',  icon: 'edbo',          key: 'edboProgramme',      roles: ['admin'] },
{ to: '/overseer-diary',  icon: 'diary',         key: 'overseerDiary',      roles: ['admin'] },
{ to: '/work-assignments',icon: 'assignments',   key: 'workAssignments',    roles: ['admin'] },
{ to: '/vp-delivery',     icon: 'vpDelivery',    key: 'vpDelivery',         roles: ['admin'] },
```
Add matching SVG icons to the `Icons` object for: `attendance`, `edbo`, `diary`, `assignments`, `vpDelivery`.

---

**`/attendance` — AttendanceRegisterPage**
- Month/year selector at top
- Grid: rows = staff (fetched via `GET /api/v1/staff?office_id=ASPO_ID&limit=50`), columns = day 1–31
- Each cell: colored pill (green=Present, red=Absent, amber=On Leave, blue=On Duty, gray=Holiday, white=not marked)
- Click cell → dropdown to select status → calls `POST /api/v1/attendance` with `{ staff_id, date, status }`
- On Leave selection: shows sub-dropdown of existing leave memos for that staff → sets `leave_id`
- Buttons: "View Report" → `/attendance/report`, "Register DSPS Leave Memo" → `/attendance/leave-memo/new`

**`/attendance/report` — AttendanceReportPage**
- Filters: staff dropdown (all or individual), month+year selectors, toggle for monthly vs yearly
- Summary table: Staff | Working Days | Present | Absent | On Leave | On Duty | Holidays | Attendance %
- Sub-table below: Leave records for selected period showing DSPS Memo No, Memo Date, Leave Type, Dates, Days

**`/attendance/leave-memo/new` — LeaveMemoFormPage**
- Fields: Staff (dropdown), DSPS Memo No. (required), DSPS Memo Date (required), Leave Type (dropdown from leave_type_config), Start Date, End Date, total days (auto-calc, read-only), Notes
- `POST /api/v1/attendance/leave-memo` → navigate to `/attendance`

---

**`/edbo-programme` — EDBOProgrammeListPage**
- DataTable: Year | Overseer | Total EDBOs | Completed | Pending | Carried Forward | Actions (View)
- "New Programme" button

**`/edbo-programme/new` — EDBOProgrammeFormPage** (not in original tracker — add as step 17b):
- Fields: Year (number), Overseer (staff dropdown filtered to designation=Mail Overseer), Notes
- Dynamic table below: add EDBO rows with `edbo_name` and `assigned_month` (month dropdown)
- `POST /api/v1/edbo-programmes`

**`/edbo-programme/:id` — EDBOProgrammeDetailPage**
- Header: Year, Overseer, summary counts
- Table grouped by month: EDBO Name | Month | Status badge | Completed Date | Remarks | Actions
- Action buttons per row (admin only): "Mark Complete" (date picker inline) | "Carry Forward"

---

**`/overseer-diary` — OverseerDiaryListPage**
- DataTable: Week | Places Visited (truncated to 40 chars) | Work Summary (truncated) | Submitted Date | Actions (View/Edit)
- Year filter
- "Submit Diary" → `/overseer-diary/new`

**`/overseer-diary/new` + `/:id` — OverseerDiaryFormPage**
- Week Start Date (date) → auto-fills Week End Date = start + 6 days (shown read-only)
- Places Visited (text, hint: "EDBO Faiz Ganj, EDBO Tando, ...")
- Summary of Work Done (textarea, required)
- Observations / Issues (textarea)
- Submission Date (date, default today)

---

**`/work-assignments` — WorkAssignmentListPage**
- DataTable: Title | Staff | Assigned Date | Order Type badge (Written=blue/Verbal=gray) | Ref No | Due Date | Status badge | Actions (Edit)
- Filters: status dropdown, staff dropdown
- "New Assignment" button

**`/work-assignments/new` + `/:id` — WorkAssignmentFormPage**
- Staff (dropdown), Title, Description (textarea), Order Type (Written/Verbal radio), Reference No (shown only if Written), Assigned Date, Due Date
- Status (dropdown, default Open), Completion Date (shown only if Completed), Completion Notes (shown only if Completed)

---

**`/vp-delivery` — VPDeliveryPage (two-tab layout)**
- Tab "Daily Log": DataTable with month/year filter — Date | Route | Received | Delivered | Undelivered | Actions (Edit)
- Monthly totals row at bottom of table
- "Add Entry" button → `/vp-delivery/log/new`
- Tab "Route List": cards showing each route — Route Name, Villages, Frequency, Effective Date, Active badge; "Edit" and "Add New Route" buttons

**`/vp-delivery/log/new` — VPDeliveryFormPage**
- Date, Route (dropdown of active routes), Articles Received, Articles Delivered, Articles Undelivered (auto = received - delivered, read-only), Undelivered Reason (shown if undelivered > 0), Notes

**`/vp-routes/new` + `/:id/edit` — VPRouteFormPage**
- Route Name, Villages (textarea, one per line), Frequency (text), Source (default Larkana GPO), Effective Date, Is Active (checkbox), Notes

---

### Step 21 — App.js Routes (all inside AdminOnly)
```jsx
import AttendanceRegisterPage  from './pages/attendance/AttendanceRegisterPage';
import AttendanceReportPage    from './pages/attendance/AttendanceReportPage';
import LeaveMemoFormPage       from './pages/attendance/LeaveMemoFormPage';
import EDBOProgrammeListPage   from './pages/edbo/EDBOProgrammeListPage';
import EDBOProgrammeFormPage   from './pages/edbo/EDBOProgrammeFormPage';
import EDBOProgrammeDetailPage from './pages/edbo/EDBOProgrammeDetailPage';
import OverseerDiaryListPage   from './pages/overseerDiary/OverseerDiaryListPage';
import OverseerDiaryFormPage   from './pages/overseerDiary/OverseerDiaryFormPage';
import WorkAssignmentListPage  from './pages/workAssignments/WorkAssignmentListPage';
import WorkAssignmentFormPage  from './pages/workAssignments/WorkAssignmentFormPage';
import VPDeliveryPage          from './pages/vpDelivery/VPDeliveryPage';
import VPDeliveryFormPage      from './pages/vpDelivery/VPDeliveryFormPage';
import VPRouteFormPage         from './pages/vpDelivery/VPRouteFormPage';

// Routes inside <Route element={<AdminOnly />}>:
<Route path="/attendance"                 element={<AttendanceRegisterPage />} />
<Route path="/attendance/report"          element={<AttendanceReportPage />} />
<Route path="/attendance/leave-memo/new"  element={<LeaveMemoFormPage />} />
<Route path="/edbo-programme"             element={<EDBOProgrammeListPage />} />
<Route path="/edbo-programme/new"         element={<EDBOProgrammeFormPage />} />
<Route path="/edbo-programme/:id"         element={<EDBOProgrammeDetailPage />} />
<Route path="/overseer-diary"             element={<OverseerDiaryListPage />} />
<Route path="/overseer-diary/new"         element={<OverseerDiaryFormPage />} />
<Route path="/overseer-diary/:id"         element={<OverseerDiaryFormPage />} />
<Route path="/work-assignments"           element={<WorkAssignmentListPage />} />
<Route path="/work-assignments/new"       element={<WorkAssignmentFormPage />} />
<Route path="/work-assignments/:id"       element={<WorkAssignmentFormPage />} />
<Route path="/vp-delivery"               element={<VPDeliveryPage />} />
<Route path="/vp-delivery/log/new"       element={<VPDeliveryFormPage />} />
<Route path="/vp-routes/new"             element={<VPRouteFormPage />} />
<Route path="/vp-routes/:id/edit"        element={<VPRouteFormPage />} />
```

---

### Step 23 — StatusBadge additions
```js
// STATUS_COLORS:
'On Duty':   'bg-blue-100 text-blue-700 border-blue-300',
'Holiday':   'bg-gray-100 text-gray-500 border-gray-300',
'Open':      'bg-yellow-100 text-yellow-700 border-yellow-300',
'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',  // already exists
// STATUS_KEY_MAP:
'On Duty':   'onDuty',
'Holiday':   'holiday',
'Open':      'open',
```

---

### Step 24 — Translation Keys (en.json + ur.json)

**en.json:**
```json
"attendanceRegister": "Attendance Register",
"attendanceReport": "Attendance Report",
"markAttendance": "Mark Attendance",
"leaveMemo": "Leave Memo",
"dspsMemoNo": "DSPS Memo No.",
"dspsMemoDate": "DSPS Memo Date",
"registerLeaveMemo": "Register DSPS Leave Memo",
"noAttendanceMarked": "No attendance marked yet.",
"present": "Present",
"absent": "Absent",
"onDuty": "On Duty",
"holiday": "Holiday",
"notMarked": "Not Marked",
"workingDays": "Working Days",
"attendancePct": "Attendance %",
"edboProgramme": "EDBO Programme",
"newEdboProgramme": "New EDBO Programme",
"edboName": "EDBO Name",
"assignedMonth": "Assigned Month",
"edboAssignments": "EDBO Assignments",
"overseerDiary": "Overseer Diary",
"submitDiary": "Submit Diary",
"weekStartDate": "Week Start Date",
"weekEndDate": "Week End Date",
"placesVisited": "Places Visited",
"workSummary": "Summary of Work Done",
"observationsIssues": "Observations / Issues",
"submittedDate": "Submitted Date",
"workAssignments": "Work Assignments",
"newAssignment": "New Assignment",
"orderType": "Order Type",
"written": "Written",
"verbal": "Verbal",
"orderReference": "Reference No.",
"completionDate": "Completion Date",
"completionNotes": "Completion Notes",
"open": "Open",
"vpDelivery": "VP Delivery",
"vpRoutes": "VP Routes",
"dailyLog": "Daily Log",
"routeList": "Route List",
"updateRoute": "Update Route",
"articlesReceived": "Articles Received",
"articlesDelivered": "Articles Delivered",
"articlesUndelivered": "Undelivered",
"undeliveredReason": "Undelivered Reason",
"routeName": "Route Name",
"villages": "Villages",
"frequency": "Frequency",
"effectiveDate": "Effective Date",
"aspoOffice": "ASPO Office"
```

**ur.json** (same keys, Urdu values):
```json
"attendanceRegister": "حاضری رجسٹر",
"attendanceReport": "حاضری رپورٹ",
"markAttendance": "حاضری لگائیں",
"leaveMemo": "چھٹی میمو",
"dspsMemoNo": "DSPS میمو نمبر",
"dspsMemoDate": "DSPS میمو تاریخ",
"registerLeaveMemo": "DSPS چھٹی میمو درج کریں",
"noAttendanceMarked": "ابھی تک حاضری نہیں لگائی گئی۔",
"present": "حاضر",
"absent": "غیر حاضر",
"onDuty": "ڈیوٹی پر",
"holiday": "چھٹی",
"notMarked": "نہیں لگائی",
"workingDays": "کام کے دن",
"attendancePct": "حاضری %",
"edboProgramme": "EDBO پروگرام",
"newEdboProgramme": "نیا EDBO پروگرام",
"edboName": "EDBO کا نام",
"assignedMonth": "مقررہ مہینہ",
"edboAssignments": "EDBO تفویض",
"overseerDiary": "اوورسیئر ڈائری",
"submitDiary": "ڈائری جمع کریں",
"weekStartDate": "ہفتے کی شروعات",
"weekEndDate": "ہفتے کا اختتام",
"placesVisited": "دورہ کردہ مقامات",
"workSummary": "کام کا خلاصہ",
"observationsIssues": "مشاہدات / مسائل",
"submittedDate": "جمع کرانے کی تاریخ",
"workAssignments": "کام کی تفویض",
"newAssignment": "نئی تفویض",
"orderType": "حکم کی قسم",
"written": "تحریری",
"verbal": "زبانی",
"orderReference": "حوالہ نمبر",
"completionDate": "تکمیل کی تاریخ",
"completionNotes": "تکمیل کے نوٹس",
"open": "کھلا",
"vpDelivery": "وی پی ڈیلیوری",
"vpRoutes": "وی پی روٹ",
"dailyLog": "روزانہ لاگ",
"routeList": "روٹ فہرست",
"updateRoute": "روٹ اپ ڈیٹ کریں",
"articlesReceived": "موصول اشیاء",
"articlesDelivered": "تحویل اشیاء",
"articlesUndelivered": "غیر تحویل",
"undeliveredReason": "وجہ عدم تحویل",
"routeName": "روٹ کا نام",
"villages": "گاؤں",
"frequency": "تعدد",
"effectiveDate": "مؤثر تاریخ",
"aspoOffice": "ASPO دفتر"
```

### Step 25 — constants.js additions
```js
export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'On Leave', 'On Duty', 'Holiday'];
export const ASSIGNMENT_STATUSES  = ['Open', 'In Progress', 'Completed'];
export const ORDER_TYPES          = ['Written', 'Verbal'];
```

---

### Verification
1. Run `cd backend && npm run migrate` — all 7 migrations (021–027) run cleanly
2. Mark attendance for 3 staff for a week — grid updates correctly with colors
3. Register DSPS leave memo → mark that day as On Leave linking to memo → report shows memo reference
4. Create EDBO programme for 2026 → mark one EDBO as Completed → status updates
5. Submit weekly diary → appears in list with truncated places visited
6. Create written assignment → change to Completed with completion date → verified in list
7. Create VP route → log daily delivery → undelivered auto-calculates = received - delivered
8. Monthly report shows correct totals and attendance percentage

---

*When this plan is complete, move a one-line summary to Completed Work, delete this section, and check the Future Plans queue for the next item.*
