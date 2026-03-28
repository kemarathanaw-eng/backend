# Employee Portal - Full Backend System

A production-grade RESTful backend built with Node.js, Express, Supabase, and Upstash Redis. This system implements a clean architecture pattern with four CRUD modules (Employees, Departments, Roles, Attendance/Leave) and secure JWT authentication.

## 📋 Project Overview

This is a comprehensive Employee Management System backend that includes:
- **Secure Authentication**: JWT-based auth with bcryptjs password hashing
- **CRUD Modules**: Employees, Departments, Roles, Attendance/Leave management
- **Caching Layer**: Upstash Redis with cache-aside pattern for performance
- **Clean Architecture**: Layered structure with clear separation of concerns
- **Error Handling**: Global error middleware with operational error classification
- **Input Validation**: Joi schema validation for all request bodies
- **Security**: CORS, input sanitization (NoSQL injection & XSS protection), auth middleware

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js v18+ |
| **Framework** | Express.js |
| **Database** | PostgreSQL (via Supabase) |
| **ORM** | Supabase JS client |
| **Authentication** | JWT (HS256) + bcryptjs |
| **Caching** | Upstash Redis (serverless, HTTP-based) |
| **Validation** | Joi |
| **Security** | CORS, express-mongo-sanitize, xss-clean |
| **Dev Tools** | nodemon, dotenv |

## 📁 Project Structure

```
employee-portal/
├── src/
│   ├── config/
│   │   ├── supabase.js           # Supabase singleton
│   │   └── redis.js              # Upstash Redis singleton
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verification + blacklist
│   │   ├── cors.middleware.js    # CORS policy
│   │   ├── sanitise.middleware.js# Input sanitizer
│   │   └── validate.middleware.js# Joi validation factory
│   │
│   ├── models/
│   │   ├── employee.model.js     # Employee schema + validation
│   │   ├── department.model.js   # Department schema + validation
│   │   ├── role.model.js         # Role schema + validation
│   │   └── attendance.model.js   # Attendance schema + validation
│   │
│   ├── repositories/
│   │   ├── employee.repository.js # Employee data access
│   │   ├── department.repository.js
│   │   ├── role.repository.js
│   │   ├── attendance.repository.js
│   │   └── auth.repository.js
│   │
│   ├── services/
│   │   ├── employee.service.js   # Employee business logic + caching
│   │   ├── department.service.js
│   │   ├── role.service.js
│   │   ├── attendance.service.js
│   │   └── auth.service.js
│   │
│   ├── controllers/
│   │   ├── employee.controller.js # Thin request/response handlers
│   │   ├── department.controller.js
│   │   ├── role.controller.js
│   │   ├── attendance.controller.js
│   │   └── auth.controller.js
│   │
│   ├── routes/
│   │   ├── employee.routes.js    # Employee endpoints
│   │   ├── department.routes.js
│   │   ├── role.routes.js
│   │   ├── attendance.routes.js
│   │   ├── auth.routes.js
│   │   └── index.js              # Root router
│   │
│   └── utils/
│       ├── AppError.js           # Custom error class
│       ├── catchAsync.js         # Async error wrapper
│       ├── responseHandler.js    # Success/error response helpers
│       └── errorHandler.js       # Global error middleware
│
├── app.js                        # Express app setup
├── server.js                     # Server entry point
├── package.json                  # Dependencies + scripts
├── .env.example                  # Environment template
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- Supabase account (free tier available at https://supabase.com)
- Upstash account (free tier at https://console.upstash.com)

### Installation

1. **Clone/Set up the project:**
   ```bash
   cd employee-portal
   npm install
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** (see section below)

4. **Set up Supabase database** (see schema section below)

5. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Or production:
   ```bash
   npm start
   ```

Server will run on http://localhost:5000

## ⚙️ Environment Configuration

Create `.env` file with the following variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Supabase (PostgreSQL Database)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci... # Service role key (server-side only)

# JWT Authentication
JWT_SECRET=generate_a_random_string_at_least_32_characters_long
JWT_EXPIRES_IN=8h

# Upstash Redis (Cache)
UPSTASH_REDIS_REST_URL=https://[region-id].upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx... # REST token

# CORS Allowed Origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com
```

### Getting Credentials

**Supabase:**
1. Create project at https://app.supabase.com
2. Go to Settings → API Keys
3. Copy `Project URL` and `Service Role Key`

**Upstash Redis:**
1. Create database at https://console.upstash.com
2. Select "REST" protocol
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

## 🗄️ Database Schema

Create all tables in Supabase SQL Editor:

```sql
create extension if not exists "uuid-ossp";

create table departments (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  manager_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table roles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  department_id uuid references departments(id),
  min_salary numeric,
  max_salary numeric,
  level text check (level in ('Junior','Mid','Senior','Lead')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table employees (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  department_id uuid references departments(id),
  role_id uuid references roles(id),
  hire_date date not null,
  salary numeric not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table attendance (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id),
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  hours_worked numeric,
  status text check (status in ('present','absent','half-day','leave'))
);

create table leave_requests (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id),
  start_date date not null,
  end_date date not null,
  reason text,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Foreign key for department manager (after employees table exists)
alter table departments
  add constraint fk_manager foreign key (manager_id) references employees(id);
```

## 🔐 Authentication Flow

### Register → Login → Protected Routes → Logout

```
POST /api/auth/register
  ↓ (Create user with hashed password)
POST /api/auth/login
  ↓ (Returns JWT token)
Bearer {token} in Authorization header
  ↓ (auth.middleware validates & checks Redis blacklist)
GET /api/auth/me (Protected route)
  ↓ (User profile returned)
POST /api/auth/logout
  ↓ (Token added to Redis blacklist)
```

## 📊 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login & get JWT |
| GET | `/me` | Yes | Get user profile |
| POST | `/logout` | Yes | Logout (blacklist token) |
| PUT | `/change-password` | Yes | Change password |

### Employees (`/api/employees`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List employees (paginated, cached) |
| GET | `/:id` | Yes | Get single employee (cached) |
| GET | `/department/:deptId` | Yes | Filter by department |
| POST | `/` | Yes | Create employee |
| PUT | `/:id` | Yes | Update employee |
| DELETE | `/:id` | Yes | Soft delete employee |

### Departments (`/api/departments`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List departments (cached) |
| GET | `/:id` | Yes | Get department + employee count |
| POST | `/` | Yes | Create department |
| PUT | `/:id` | Yes | Update department |
| DELETE | `/:id` | Yes | Delete (if no employees) |

### Roles (`/api/roles`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List roles (cached) |
| GET | `/:id` | Yes | Get single role |
| POST | `/` | Yes | Create role |
| PUT | `/:id` | Yes | Update role |
| DELETE | `/:id` | Yes | Delete (if no employees) |

### Attendance & Leave (`/api/attendance`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List attendance (with date filter) |
| GET | `/employee/:id` | Yes | Get employee attendance |
| POST | `/check-in` | Yes | Mark check-in |
| POST | `/check-out` | Yes | Mark check-out |
| POST | `/leave` | Yes | Submit leave request |
| GET | `/leave/employee/:id` | Yes | Get leave history |
| PUT | `/leave/:id` | Yes | Approve/reject leave |

## 💾 Caching Strategy

The system uses **cache-aside pattern** with Upstash Redis:

### Cache Keys
- `employees:list:{page}:{limit}` - Paginated employee list
- `employees:single:{id}` - Individual employee
- `employees:dept:{deptId}` - Employees by department
- `departments:all` - All departments
- `departments:single:{id}` - Individual department
- `roles:all` - All roles
- `roles:single:{id}` - Individual role
- `attendance:list:{startDate}:{endDate}:{page}:{limit}` - Attendance records
- `attendance:emp:{employeeId}` - Employee attendance
- `leave:emp:{employeeId}` - Employee leave history
- `bl_{token}` - Blacklisted JWT tokens

### TTL (Time To Live)
- **5 minutes (300s)** for list and single record caches
- **Token TTL** for blacklist (matches JWT expiration)

### Invalidation
Caches are automatically cleared when data is modified:
- Creating/updating/deleting records invalidates related caches
- Write operations log `[CACHE INVALIDATED]` to console
- Read operations log `[CACHE HIT]` or `[DB QUERY]` to console

## 🧪 Testing with Postman

### Import Postman Collection

1. Create new collection "Employee Portal"
2. Set base URL: `{{base_url}}/api`
3. Create environment variable: `base_url=http://localhost:5000`

### Example Requests

**Register:**
```json
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Login:**
```json
POST /auth/login
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```
Response includes `token` - add to Authorization header as `Bearer {token}`

**Create Employee:**
```json
POST /employees
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "department_id": "uuid-here",
  "role_id": "uuid-here",
  "hire_date": "2024-01-15",
  "salary": 75000
}
```

## 🏗️ Clean Architecture Overview

### Layer Responsibilities

1. **Routes** - URL mapping only
2. **Controllers** - Parse request, call service, return response (thin)
3. **Services** - Business logic, caching, orchestration (no req/res)
4. **Repositories** - Database queries only (no business logic)
5. **Models** - Schema documentation & Joi validation schemas
6. **Middleware** - Authentication, CORS, sanitization, validation
7. **Utils** - Error handling, response formatting, async wrappers

### Data Flow
```
Request → Route → Middleware → Controller → Service → Repository → Database
Response ← Controller ← Service ← Repository
```

## 🔒 Security Features

- **JWT Authentication** with HS256
- **Token Blacklist** in Redis for logout
- **Password Hashing** with bcryptjs (12 rounds)
- **Input Sanitization** (NoSQL injection, XSS protection)
- **CORS Policy** with configurable origins
- **Authorization Middleware** for protected routes
- **Joi Validation** for request bodies
- **Error Handling** without exposing stack traces

## 📝 Error Handling

All endpoints return consistent JSON response:

**Success:**
```json
{
  "success": true,
  "message": "Employees retrieved",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Employee not found"
}
```

Error codes:
- `400` - Bad request (validation)
- `401` - Unauthorized (auth failed)
- `404` - Not found
- `409` - Conflict (duplicate)
- `500` - Server error

## 📦 npm Scripts

```bash
npm start          # Production: node server.js
npm run dev        # Development: nodemon server.js
```

## 🔍 Key Implementation Details

1. **ES6 Modules**: All code uses `import`/`export` (no CommonJS)
2. **Async Error Handling**: catchAsync wrapper prevents unhandled rejections
3. **Soft Delete**: Employees use `is_active` flag instead of hard delete
4. **Pagination**: Employees endpoint supports `?page=1&limit=10`
5. **Joins**: Queries include related data (e.g., department name in employee)
6. **Timestamps**: All records auto-track `created_at` and `updated_at`
7. **UUID Keys**: All IDs are UUIDs for better security

## 📚 Dependencies

```json
{
  "express": "REST API framework",
  "@supabase/supabase-js": "PostgreSQL ORM",
  "@upstash/redis": "Serverless Redis cache",
  "jsonwebtoken": "JWT signing/verification",
  "bcryptjs": "Password hashing",
  "cors": "Cross-origin resource sharing",
  "express-mongo-sanitize": "NoSQL injection prevention",
  "xss-clean": "XSS attack prevention",
  "joi": "Schema validation",
  "dotenv": "Environment variable loading",
  "nodemon": "Auto-reload on file changes"
}
```

## 🚨 Troubleshooting

**Cannot connect to Supabase:**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in .env
- Verify database tables are created
- Check Supabase project is active

**Redis connection error:**
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Check Redis database is active on Upstash console
- Ensure correct protocol (REST, not TCP)

**JWT errors:**
- Token may be expired - login again to get new token
- Token might be blacklisted - logout clears tokens
- Check `JWT_SECRET` matches between encode/decode

**CORS errors:**
- Add frontend URL to `ALLOWED_ORIGINS` in .env
- Restart server after .env changes

## 📄 License

ISC

---

**Built with ❤️ following clean architecture principles**
