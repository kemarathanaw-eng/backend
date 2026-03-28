# Employee Portal - Project Structure Reference

## Complete Directory Tree

```
employee-portal/
├── src/
│   ├── config/
│   │   ├── redis.js                       # Upstash Redis singleton
│   │   └── supabase.js                    # Supabase client singleton
│   │
│   ├── controllers/
│   │   ├── attendance.controller.js       # Attendance/Leave HTTP handlers
│   │   ├── auth.controller.js             # Auth HTTP handlers
│   │   ├── department.controller.js       # Department HTTP handlers
│   │   ├── employee.controller.js         # Employee HTTP handlers
│   │   └── role.controller.js             # Role HTTP handlers
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js             # JWT + Redis blacklist verification
│   │   ├── cors.middleware.js             # CORS policy configuration
│   │   ├── sanitise.middleware.js         # NoSQL injection + XSS prevention
│   │   └── validate.middleware.js         # Joi schema validation factory
│   │
│   ├── models/
│   │   ├── attendance.model.js            # Attendance + leave schemas
│   │   ├── department.model.js            # Department schemas
│   │   ├── employee.model.js              # Employee + auth schemas
│   │   └── role.model.js                  # Role schemas
│   │
│   ├── repositories/
│   │   ├── attendance.repository.js       # Attendance/leave database queries
│   │   ├── auth.repository.js             # Auth database queries
│   │   ├── department.repository.js       # Department database queries
│   │   ├── employee.repository.js         # Employee database queries
│   │   └── role.repository.js             # Role database queries
│   │
│   ├── routes/
│   │   ├── attendance.routes.js           # /api/attendance endpoints
│   │   ├── auth.routes.js                 # /api/auth endpoints
│   │   ├── department.routes.js           # /api/departments endpoints
│   │   ├── employee.routes.js             # /api/employees endpoints
│   │   ├── index.js                       # Root router (mounts all sub-routers)
│   │   └── role.routes.js                 # /api/roles endpoints
│   │
│   ├── services/
│   │   ├── attendance.service.js          # Attendance business logic + caching
│   │   ├── auth.service.js                # Auth business logic
│   │   ├── department.service.js          # Department logic + caching
│   │   ├── employee.service.js            # Employee logic + caching
│   │   └── role.service.js                # Role logic + caching
│   │
│   └── utils/
│       ├── AppError.js                    # Custom error class
│       ├── catchAsync.js                  # Async error wrapper
│       ├── errorHandler.js                # Global error middleware
│       └── responseHandler.js             # sendSuccess/sendError helpers
│
├── app.js                                 # Express app setup (middleware + routes)
├── server.js                              # Server entry point
├── package.json                           # Dependencies + npm scripts
├── .env.example                           # Environment variables template
├── .gitignore                             # Git ignore patterns
├── README.md                              # Complete documentation
├── IMPLEMENTATION_SUMMARY.md              # Project completion summary
├── REDIS_CACHING_STRATEGY.md              # Caching strategy details
└── Employee_Portal_API.postman_collection.json # Postman request collection
```

## File Count Summary

| Category | Count |
|----------|-------|
| Controllers | 5 |
| Repositories | 5 |
| Services | 5 |
| Routes | 6 |
| Models | 4 |
| Middlewares | 4 |
| Utils | 4 |
| Config | 2 |
| Core Files | 2 |
| Documentation | 4 |
| Configuration | 2 |
| **Total** | **43 files** |

## Layer Responsibilities

### 1. Routes Layer (`src/routes/`)
- URL mapping only
- No business logic
- Links to controllers
- Applies validation & auth middleware
- **Files**: auth, employee, department, role, attendance routes + index router

### 2. Controllers Layer (`src/controllers/`)
- Parse HTTP request
- Call service methods
- Send standardized responses via `sendSuccess`
- Thin — no business logic
- Error forwarding to `catchAsync`
- **Files**: auth, employee, department, role, attendance controllers

### 3. Services Layer (`src/services/`)
- Business logic orchestration
- Cache-aside pattern implementation
- Data validation
- No req/res objects
- Calls repositories + caching logic
- **Files**: auth, employee, department, role, attendance services

### 4. Repositories Layer (`src/repositories/`)
- All Supabase queries
- Data access only
- No business logic
- Error thrown to service layer
- **Files**: auth, employee, department, role, attendance repositories

### 5. Models Layer (`src/models/`)
- Schema documentation
- Joi validation schemas
- Field definitions
- Exported schemas used in routes
- **Files**: employee, department, role, attendance models

## Middleware Chain

```
Request
  ↓
CORS Middleware (corsOptions)
  ↓
express.json() + express.urlencoded()
  ↓
Input Sanitisers (mongoSanitize + xss)
  ↓
Route Handler
  ├─ Public Route (e.g., /api/auth/login)
  └─ Protected Route
      ├─ Validation Middleware (Joi)
      ├─ Auth Middleware (JWT + Redis check)
      ├─ Controller
      └─ Error forwarding via next(error)
  ↓
Global Error Handler (last middleware)
  ↓
Response
```

## Data Flow Example: Get Employee

```
GET /api/employees/123
  ↓
[auth.middleware] Verify JWT + check Redis blacklist
  ↓
[employee.controller.getById]
  - Extract: req.params.id
  - Call: employeeService.getEmployeeById(id)
  - Return: sendSuccess(res, data, message)
  ↓
[employee.service.getEmployeeById]
  - Check Redis cache (key: employees:single:123)
  - Cache HIT → return cached data
  - Cache MISS → call repo.findById(id) → store in Redis → return
  ↓
[employee.repository.findById]
  - Supabase query with joins
  - Return data or throw AppError
  ↓
Response JSON
{
  "success": true,
  "message": "Employee retrieved",
  "data": { ... }
}
```

## Database Relationships

```
users (Authentication)
  ↓
departments ← employees → roles
  ↓
attendance (time tracking)
  ↓
leave_requests (leave management)
```

## Key Files Deep Dive

### `server.js` (Entry Point)
- Loads dotenv config
- Imports express app
- Listens on PORT (default 5000)
- Logs startup message

### `app.js` (Express Setup)
- Applies middleware in order
- Mounts routes at `/api`
- Global error handler (last)
- Health check endpoint

### `src/utils/AppError.js` (Error Class)
- Constructor: (message, statusCode)
- Properties: status (fail/error), isOperational
- Used throughout codebase

### `src/utils/catchAsync.js` (Error Wrapper)
- Wraps async controller functions
- Catches errors and forwards to next(error)
- Prevents unhandled promise rejects

### `src/middlewares/auth.middleware.js` (Auth)
- Extract token from Authorization header
- Check Redis blacklist
- Verify JWT signature
- Attach decoded user to req.user

### `src/services/*.service.js` (Caching)
- All caching logic isolated here
- Cache-aside pattern
- Console logging for debugging
- Invalidation on mutations

## Environment Variables

Required in `.env`:
- `NODE_ENV` - development/production
- `PORT` - Server port (default 5000)
- `SUPABASE_URL` - PostgreSQL database URL
- `SUPABASE_SERVICE_KEY` - Server-side API key
- `JWT_SECRET` - Token signing key (32+ chars)
- `JWT_EXPIRES_IN` - Token expiration time (default 8h)
- `UPSTASH_REDIS_REST_URL` - Redis endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication
- `ALLOWED_ORIGINS` - CORS whitelist (comma-separated)

## npm Scripts

```bash
npm start          # Production: node server.js
npm run dev        # Development: nodemon server.js
npm install        # Install dependencies
```

## Import/Export Convention

All files use ES6 modules:
```javascript
// Import
import express from 'express';
import { functionName } from './path.js';

// Export
export const functionName = () => {};
export default ClassName;
```

## Response Format

All API responses follow this pattern:

**Success:**
```json
{
  "success": true,
  "message": "Descriptive message",
  "data": { /* actual data */ }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Status Codes Used

- `200` - OK (GET/PUT/PATCH/DELETE success)
- `201` - Created (POST success)
- `400` - Bad Request (validation error, FK error)
- `401` - Unauthorized (no token, invalid token, expired token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate email, unique constraint)
- `500` - Internal Server Error (database/server error)

## Error Types Handled

| Error Type | Handled By | Example |
|-----------|-----------|---------|
| Validation | Joi middleware | Missing required field |
| JWT Invalid | globalErrorHandler | Tampered token |
| JWT Expired | globalErrorHandler | Token > 8 hours old |
| FK Constraint | handleSupabaseError | Department ID doesn't exist |
| Duplicate | handleSupabaseError | Email already registered |
| Not Found | Repository throw | Employee ID doesn't exist |
| All others | AppError + operational flag | Business logic errors |

## Testing Quick Start

1. **Register**: POST /api/auth/register
   - Create user account
   - Returns: user object (password excluded)

2. **Login**: POST /api/auth/login
   - Get JWT token
   - Store token for subsequent requests

3. **Protected Request**: GET /api/employees
   - Add `Authorization: Bearer {token}` header
   - Cache will show [CACHE HIT] / [DB QUERY]

4. **Logout**: POST /api/auth/logout
   - Token is blacklisted in Redis
   - Next request with same token fails

---

**This project implements industry-standard patterns and practices for backend development.**
