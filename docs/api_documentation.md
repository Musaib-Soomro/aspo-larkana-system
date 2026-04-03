# API Documentation - ASPO Larkana System

## 1. Introduction
The ASPO Larkana System API is a RESTful service that communicates via JSON. All requests must be authenticated using a valid JWT token.

- **Base URL**: `/api/v1`
- **Default Port**: `5000`
- **Response Format**:
    ```json
    {
      "success": true,
      "data": { ... },
      "pagination": { "page": 1, "total": 100, "pages": 5 }
    }
    ```

## 2. Authentication
- **POST `/auth/login`**: Authenticate a user and receive a JWT.
    - **Request Body**: `{ "username": "...", "password": "..." }`
- **GET `/auth/me`**: Get details of the currently logged-in user.
- **POST `/auth/logout`**: Terminate the current session.

## 3. Core Entities API

### 3.1 Staff Management (`/staff`)
- **GET `/`**: List all staff. Supports `page`, `limit`, `office_id`, `search`.
- **POST `/`**: Add new staff.
- **GET `/:id`**: Get specific staff details (including posting history).
- **PUT `/:id`**: Update staff details.
- **DELETE `/:id`**: Deactivate/Remove staff.

### 3.2 Office Management (`/offices`)
- **GET `/`**: List all post offices.
- **POST `/`**: Create a new office record.
- **GET `/:id`**: View office details.
- **PUT `/:id`**: Update office configuration.

### 3.3 Leave Records (`/leave`)
- **GET `/`**: Filter staff leave records.
- **POST `/`**: Register a new leave application.
- **GET `/balance/:staffId`**: Calculate remaining leave balance.

## 4. Specialized Modules API

### 4.1 Attendance (`/attendance`)
- **GET `/register`**: Fetch monthly attendance register for an office.
- **POST `/`**: Mark attendance for a specific day.
- **POST `/leave-memo`**: Link a DSPS leave memo.
- **GET `/report`**: Generate detailed attendance/absence reports.

### 4.2 Transfers (`/transfers`)
- **GET `/`**: List current and historical transfers.
- **POST `/`**: Create a new transfer order.
- **PUT `/:id/relieve`**: Mark member as relieved from their current post.
- **PUT `/:id/complete`**: Finalize the transfer at the new office.

### 4.3 Look-After Assignments (`/look-after`)
- **GET `/`**: View all temporary staff assignments.
- **POST `/`**: Assign a member to look-after a vacant office.
- **PUT `/:id/end`**: Terminate a look-after assignment.

## 5. Operations & Logs

### 5.1 Revenue & Articles
- **GET `/revenue`**: Fetch historical revenue data.
- **POST `/revenue`**: Log daily revenue.
- **POST `/articles`**: Record count of delivered/undelivered articles.

### 5.2 Audit Log (`/audit-log`)
- **GET `/`**: (Admin only) Filter and view administrative change history (action, table, timestamp, user).

## 6. Error Handling
The API uses standardized HTTP status codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Missing or invalid token.
- `403 Forbidden`: User lacks required permissions.
- `404 Not Found`: Resource does not exist.
- `500 Internal Server Error`: An unexpected server error occurred.
