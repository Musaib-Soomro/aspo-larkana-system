# Maintenance & Support Document - ASPO Larkana System

## 1. System Maintenance
To ensure the ASPO Larkana System runs smoothly, regular maintenance tasks should be performed.

### 1.1 Database Backups
It is highly recommended to perform periodic backups of the PostgreSQL database.
- **Backup Command**: `pg_dump -U postgres aspo_larkana > backup_YYYY-MM-DD.sql`
- **Restoration**: `psql -U postgres aspo_larkana < backup_file.sql`

### 1.2 Environment Updates
- **Node.js**: The system is built on Node.js 18+. Update as part of the standard server maintenance cycle.
- **NPM Packages**: Regularly run `npm update` in both `backend` and `frontend` directories after reviewing breaking changes.

## 2. Managing Data and Migrations

### 2.1 Schema Updates
All database schema changes **MUST** be done via migrations.
- **Location**: `backend/database/migrations/`
- **Naming**: `XXX_description.sql` (where XXX is the next available three-digit number).
- **Execution**: Run `cd backend && npm run migrate` after adding a new migration file.

### 2.2 Seed Data
For testing or fresh installations, seed data can be found and updated in `backend/database/seeds/`.

## 3. Logs and Debugging
- **API Logs**: Access the standard output of the backend process or use a tool (e.g., PM2) to monitor `combined.log` and `error.log`.
- **Frontend Errors**: Use the browser's developer console (F12) to inspect network requests and JavaScript exceptions.
- **Audit Logs**: The `audit_log` table tracks all administrative actions and can be viewed via the system's "Audit Log" module.

## 4. Common Issues and Resolutions
### 4.1 "Not Found" errors on page reload (Frontend)
- **Problem**: React Router's client-side routing may conflict with the server's static file serving.
- **Fix**: Ensure the web server (Nginx/Apache) is configured to proxy all non-API requests back to `index.html`.

### 4.2 Database Connectivity
- **Problem**: Backend fails to connect to PostgreSQL.
- **Fix**: Verify the `.env` file credentials and ensure the PostgreSQL service is running.

## 5. Support and Contact
System administrators can be reached for technical issues.
- **Primary Technical Support**: System Admin.
- **Documentation Source**: Refer to the `SRS`, `SDD`, and `API Documentation` for deeper technical insights.
