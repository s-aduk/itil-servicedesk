# ITIL-Aligned Service Desk — Technical Documentation

**Version:** 1.0 (Phase 6)
**Stack:** MERN (MongoDB, Express, React, Node.js)
**Author:** Stephen Adu Kwarteng
**Context:** Banking operations service desk with ITIL process alignment

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Reference](#7-api-reference)
8. [SLA Engine](#8-sla-engine)
9. [Escalation & Notification System](#9-escalation--notification-system)
10. [Audit Log](#10-audit-log)
11. [Reporting & Analytics](#11-reporting--analytics)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Security Model](#13-security-model)
14. [Deployment](#14-deployment)
15. [Environment Variables](#15-environment-variables)
16. [Testing](#16-testing)
17. [ITIL Process Alignment](#17-itil-process-alignment)
18. [Known Limitations & Future Work](#18-known-limitations--future-work)

---

## 1. Project Overview

A full-stack, production-grade service desk application modelled after enterprise ITSM tools (ServiceNow, Jira Service Management). Built specifically for banking operations environments where ticket traceability, SLA compliance, and role-based access are regulatory requirements.

**Core capabilities:**
- Incident and service request ticketing with priority-based SLA enforcement
- Role-based access control (RBAC) with four distinct roles
- Immutable audit logging for every state change
- Automated SLA breach detection and escalation via email
- Management reporting and analytics dashboard
- Audit log export (CSV/JSON)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (React)                       │
│   Vite + React 18 + React Router v6 + Axios + Recharts  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST
┌──────────────────────▼──────────────────────────────────┐
│                  EXPRESS API SERVER                       │
│   Node.js + Express 4 + Mongoose + JWT Auth              │
│                                                          │
│   Middleware stack:                                      │
│   helmet → cors → express-rate-limit →                   │
│   express-mongo-sanitize → json parser →                 │
│   JWT verify → RBAC → route handlers                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  MONGODB ATLAS                            │
│   Collections: users, tickets, auditlogs, notifications  │
└─────────────────────────────────────────────────────────┘

Background Jobs (Node.js setInterval / node-cron):
  - SLA breach checker (runs every 5 minutes)
  - Escalation email dispatcher
```

---

## 3. Technology Stack

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.x | HTTP framework |
| Mongoose | 7.x | MongoDB ODM |
| jsonwebtoken | 9.x | JWT auth |
| bcryptjs | 2.x | Password hashing |
| nodemailer | 6.x | Email notifications |
| helmet | 7.x | Security headers |
| express-rate-limit | 7.x | Rate limiting |
| express-mongo-sanitize | 2.x | NoSQL injection prevention |
| node-cron | 3.x | Scheduled SLA checks |
| json2csv | 6.x | Audit log CSV export |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.x | UI library |
| Vite | 5.x | Build tool |
| React Router | 6.x | Client-side routing |
| Axios | 1.x | HTTP client |
| Recharts | 2.x | Charts and data viz |
| React Query | 5.x | Server state management |
| date-fns | 3.x | Date formatting |
| Tailwind CSS | 3.x | Utility-first styling |

### Infrastructure

| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Managed database |
| Vercel | Frontend hosting |
| Railway / Render | Backend hosting |
| GitHub Actions | CI/CD pipeline |

---

## 4. Project Structure

```
service-desk/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── ticketController.js
│   │   ├── userController.js
│   │   ├── reportController.js
│   │   └── auditController.js
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification
│   │   ├── rbacMiddleware.js       # Role-based access control
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Ticket.js
│   │   ├── AuditLog.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── ticketRoutes.js
│   │   ├── userRoutes.js
│   │   ├── reportRoutes.js
│   │   └── auditRoutes.js
│   ├── services/
│   │   ├── slaService.js           # SLA calculation and breach detection
│   │   ├── emailService.js         # Nodemailer email dispatch
│   │   └── escalationService.js    # Auto-escalation logic
│   ├── jobs/
│   │   └── slaChecker.js           # Cron job for SLA monitoring
│   ├── utils/
│   │   ├── auditLogger.js          # Audit log helper
│   │   └── responseHelper.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axiosInstance.js    # Axios with interceptors
    │   │   ├── ticketApi.js
    │   │   ├── authApi.js
    │   │   └── reportApi.js
    │   ├── components/
    │   │   ├── tickets/
    │   │   ├── dashboard/
    │   │   ├── reports/
    │   │   └── shared/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   ├── useTickets.js
    │   │   └── useSLA.js
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Tickets.jsx
    │   │   ├── TicketDetail.jsx
    │   │   ├── Reports.jsx
    │   │   ├── Users.jsx
    │   │   └── AuditLog.jsx
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    └── package.json
```

---

## 5. Database Schema

### User

```javascript
{
  _id: ObjectId,
  name: String,                         // required
  email: String,                        // required, unique
  password: String,                     // bcrypt hashed, minLength: 8
  role: {
    type: String,
    enum: ['end_user', 'agent', 'manager', 'admin'],
    default: 'end_user'
  },
  department: String,
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

### Ticket

```javascript
{
  _id: ObjectId,
  ticketNumber: String,                 // auto-generated: TKT-YYYYMMDD-XXXX
  title: String,                        // required, maxLength: 120
  description: String,                  // required
  category: {
    type: String,
    enum: ['hardware', 'software', 'network', 'access', 'other']
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'on_hold', 'resolved', 'closed'],
    default: 'open'
  },
  createdBy: { type: ObjectId, ref: 'User' },      // required
  assignedTo: { type: ObjectId, ref: 'User' },     // agent
  department: String,
  sla: {
    targetResolutionTime: Date,           // calculated from priority at creation
    breached: { type: Boolean, default: false },
    breachedAt: Date,
    resolvedAt: Date,
    resolutionTimeMinutes: Number         // calculated on resolution
  },
  escalation: {
    escalated: { type: Boolean, default: false },
    escalatedAt: Date,
    escalatedTo: { type: ObjectId, ref: 'User' }
  },
  comments: [{
    author: { type: ObjectId, ref: 'User' },
    body: String,
    isInternal: { type: Boolean, default: false },  // internal notes vs customer-visible
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{ filename: String, url: String, uploadedAt: Date }],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLog

```javascript
{
  _id: ObjectId,
  actor: { type: ObjectId, ref: 'User' },     // who performed the action
  action: {
    type: String,
    enum: [
      'ticket.created', 'ticket.updated', 'ticket.assigned',
      'ticket.status_changed', 'ticket.commented', 'ticket.resolved',
      'ticket.closed', 'ticket.escalated', 'sla.breached',
      'user.created', 'user.role_changed', 'user.deactivated',
      'auth.login', 'auth.logout', 'auth.failed_login'
    ]
  },
  targetTicket: { type: ObjectId, ref: 'Ticket' },
  targetUser: { type: ObjectId, ref: 'User' },
  before: Object,                              // state snapshot before change
  after: Object,                               // state snapshot after change
  details: String,                             // human-readable description
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now, immutable: true }
}
```

> **Note:** `immutable: true` on `createdAt` prevents any modification. Audit logs are write-once — no update or delete operations are permitted via the API.

### Notification

```javascript
{
  _id: ObjectId,
  recipient: { type: ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['ticket_assigned', 'sla_warning', 'sla_breach', 'escalation', 'comment_added']
  },
  ticket: { type: ObjectId, ref: 'Ticket' },
  message: String,
  read: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  createdAt: Date
}
```

---

## 6. Authentication & Authorization

### JWT Strategy

- **Access token:** 15-minute expiry, stored in memory (React state / React Query cache)
- **Refresh token:** 7-day expiry, stored in `httpOnly` cookie
- Refresh token rotation on every use — old token is invalidated
- Failed login attempts are logged to the AuditLog

### Token Flow

```
1. POST /api/auth/login
   → Returns: { accessToken, user }
   → Sets: httpOnly cookie with refreshToken

2. Axios interceptor on 401:
   → POST /api/auth/refresh
   → Returns: new accessToken
   → Retries original request

3. POST /api/auth/logout
   → Clears httpOnly cookie
   → Invalidates refresh token server-side
```

### RBAC Matrix

| Action | end_user | agent | manager | admin |
|--------|----------|-------|---------|-------|
| Create ticket | ✅ | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ | ✅ |
| View all tickets | ❌ | ✅ | ✅ | ✅ |
| Update ticket status | ❌ | ✅ | ✅ | ✅ |
| Assign ticket | ❌ | ❌ | ✅ | ✅ |
| View reports dashboard | ❌ | ❌ | ✅ | ✅ |
| Export audit log | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ❌ | ✅ |

---

## 7. API Reference

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | None | Create user account |
| POST | `/api/auth/login` | None | Login, returns JWT |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | JWT | Logout, clear cookie |

### Tickets

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/api/tickets` | JWT | agent+ | List all tickets (paginated) |
| GET | `/api/tickets/my` | JWT | all | List own tickets |
| GET | `/api/tickets/:id` | JWT | all | Get ticket detail |
| POST | `/api/tickets` | JWT | all | Create ticket |
| PATCH | `/api/tickets/:id` | JWT | agent+ | Update ticket |
| PATCH | `/api/tickets/:id/assign` | JWT | manager+ | Assign ticket to agent |
| PATCH | `/api/tickets/:id/status` | JWT | agent+ | Change status |
| POST | `/api/tickets/:id/comments` | JWT | all | Add comment |

### Users

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/api/users` | JWT | admin | List all users |
| GET | `/api/users/:id` | JWT | admin | Get user |
| PATCH | `/api/users/:id/role` | JWT | admin | Change user role |
| PATCH | `/api/users/:id/deactivate` | JWT | admin | Deactivate user |

### Reports

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/api/reports/sla-compliance` | JWT | manager+ | SLA breach rate |
| GET | `/api/reports/ticket-volume` | JWT | manager+ | Volume over time |
| GET | `/api/reports/agent-performance` | JWT | manager+ | Per-agent stats |
| GET | `/api/reports/category-breakdown` | JWT | manager+ | By category |
| GET | `/api/reports/audit-log/export` | JWT | manager+ | Export audit log |

**Common query params:** `?from=ISO_DATE&to=ISO_DATE`

### Audit

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/api/audit` | JWT | manager+ | Paginated audit log |
| GET | `/api/audit/:ticketId` | JWT | agent+ | Audit trail for ticket |

---

## 8. SLA Engine

### SLA Targets (Banking Standard)

| Priority | Response Time | Resolution Time |
|----------|--------------|-----------------|
| Critical | 15 minutes | 1 hour |
| High | 1 hour | 4 hours |
| Medium | 4 hours | 8 hours |
| Low | 8 hours | 24 hours |

### Calculation Logic (`slaService.js`)

```javascript
// On ticket creation:
const SLA_RESOLUTION = {
  critical: 60,    // minutes
  high: 240,
  medium: 480,
  low: 1440
};

ticket.sla.targetResolutionTime = new Date(
  Date.now() + SLA_RESOLUTION[ticket.priority] * 60 * 1000
);
```

### SLA Checker Cron Job

Runs every 5 minutes via `node-cron`:

```javascript
// jobs/slaChecker.js
cron.schedule('*/5 * * * *', async () => {
  const breachedTickets = await Ticket.find({
    status: { $in: ['open', 'in_progress'] },
    'sla.breached': false,
    'sla.targetResolutionTime': { $lt: new Date() }
  });

  for (const ticket of breachedTickets) {
    ticket.sla.breached = true;
    ticket.sla.breachedAt = new Date();
    await ticket.save();
    await auditLogger.log({ action: 'sla.breached', targetTicket: ticket._id, ... });
    await emailService.sendBreachAlert(ticket);
  }
});
```

---

## 9. Escalation & Notification System

### Auto-Escalation Rules

- Tickets breached for **>30 minutes** are escalated to the assigned agent's manager
- Unassigned critical/high tickets open for **>15 minutes** auto-escalate to all managers
- Escalation state is stored on `ticket.escalation` and logged in AuditLog

### Email Notifications Triggered By

| Event | Recipients |
|-------|-----------|
| Ticket created | Ticket creator (confirmation) |
| Ticket assigned | Assigned agent |
| SLA warning (80% of time elapsed) | Assigned agent |
| SLA breach | Assigned agent + managers |
| Escalation | Manager(s) |
| Comment added | Ticket creator + assigned agent |
| Status changed to Resolved | Ticket creator |

### Email Template Strategy

- Plain HTML templates stored in `backend/templates/email/`
- Injected with ticket data at send time via string interpolation
- Nodemailer configured with environment-based SMTP credentials

---

## 10. Audit Log

### Design Principles

- **Immutable:** No UPDATE or DELETE operations allowed on `AuditLog` collection
- **Comprehensive:** Every state change to tickets and users is logged
- **Actor-tracked:** Every log entry captures the authenticated user (`actor`)
- **Before/after snapshots:** `before` and `after` fields store relevant document state

### Helper (`utils/auditLogger.js`)

```javascript
const auditLogger = {
  log: async ({ actor, action, targetTicket, targetUser, before, after, details, req }) => {
    await AuditLog.create({
      actor,
      action,
      targetTicket,
      targetUser,
      before,
      after,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent']
    });
  }
};
```

### Export Format (CSV)

```
timestamp, actor_name, actor_email, action, ticket_number, details, ip_address
2024-11-01T08:23:11Z, Kwame Asante, kwame@bank.gh, ticket.status_changed, TKT-20241101-0023, Status changed from open to in_progress, 10.0.0.45
```

---

## 11. Reporting & Analytics

### Report: SLA Compliance

MongoDB aggregation pipeline:
```javascript
[
  { $match: { createdAt: { $gte: from, $lte: to } } },
  { $group: {
    _id: '$priority',
    total: { $sum: 1 },
    breached: { $sum: { $cond: ['$sla.breached', 1, 0] } }
  }},
  { $project: {
    priority: '$_id',
    total: 1,
    breached: 1,
    complianceRate: {
      $multiply: [
        { $divide: [{ $subtract: ['$total', '$breached'] }, '$total'] },
        100
      ]
    }
  }}
]
```

### Report: Agent Performance

Metrics per agent:
- Total tickets resolved
- Average resolution time (minutes)
- SLA breach rate
- Tickets by priority handled

### Report: Ticket Volume

Groups tickets by day/week/month using `$dateToString` aggregation operator. Supports `?granularity=daily|weekly|monthly`.

---

## 12. Frontend Architecture

### State Management

- **Server state:** React Query (useQuery, useMutation) — all API calls
- **Auth state:** React Context + localStorage for user info only (no tokens)
- **UI state:** useState / useReducer per component

### Routing Structure

```
/                     → redirect to /dashboard
/login                → Login page (public)
/dashboard            → Overview (all roles)
/tickets              → Ticket list (agent+)
/tickets/new          → Create ticket (all)
/tickets/:id          → Ticket detail (all)
/reports              → Reports dashboard (manager+)
/users                → User management (admin)
/audit                → Audit log viewer (manager+)
```

### Protected Routes

```jsx
// routes/ProtectedRoute.jsx
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/dashboard" />;
  return children;
};
```

### Axios Interceptors

```javascript
// Attach access token to every request
axiosInstance.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getAccessToken()}`;
  return config;
});

// Auto-refresh on 401
axiosInstance.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const newToken = await refreshAccessToken();
      setAccessToken(newToken);
      err.config.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(err.config);
    }
    return Promise.reject(err);
  }
);
```

---

## 13. Security Model

### Measures Implemented

| Layer | Measure |
|-------|---------|
| Transport | HTTPS enforced via `helmet` HSTS header |
| Auth | Short-lived JWTs + rotating refresh tokens in httpOnly cookies |
| Input | `express-mongo-sanitize` prevents NoSQL injection |
| Input | Frontend sanitization with `DOMPurify` before render |
| Headers | `helmet` sets CSP, X-Frame-Options, X-Content-Type-Options |
| Rate limiting | `express-rate-limit`: 100 req/15min on auth endpoints |
| CORS | Whitelist-only — production frontend origin only |
| Passwords | bcrypt with cost factor 12 |
| Secrets | All secrets in `.env`, validated at startup, never committed |

### Remaining Considerations

- CSRF: Mitigated via SameSite=Strict cookie policy on refresh token cookie
- File uploads: Restrict to known MIME types; scan with `file-type` package
- Dependency audit: Run `npm audit` before each production deploy

---

## 14. Deployment

### Backend (Railway / Render)

```bash
# Build command
npm install

# Start command
node server.js

# Health check endpoint
GET /api/health → { status: "ok", timestamp: ISO }
```

### Frontend (Vercel)

```bash
# Build command
npm run build

# Output directory
dist/

# Environment variable
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

### MongoDB Atlas

- Use M10+ cluster for production (not M0 free tier — no SLA)
- Enable IP whitelist for backend server IP
- Create a dedicated database user with least-privilege access
- Enable Point-in-Time Recovery

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Test and Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci && npm test
      - run: cd frontend && npm ci && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy frontend to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 15. Environment Variables

### Backend (`.env`)

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/servicedesk
JWT_SECRET=<min 64 char random string>
JWT_REFRESH_SECRET=<different min 64 char random string>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=https://your-frontend.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=<app password>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend (`.env`)

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

### Startup Validation

```javascript
// server.js
const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
});
```

---

## 16. Testing

### Backend (Jest + Supertest)

Test categories:
- **Unit tests:** SLA calculation logic, audit logger, email templates
- **Integration tests:** All API endpoints with test MongoDB instance
- **Auth tests:** JWT generation, expiry, refresh flow, invalid tokens

Run:
```bash
cd backend && npm test
```

### Frontend (Vitest + React Testing Library)

Test categories:
- Component rendering tests
- Protected route redirect logic
- Form validation
- API error state handling

Run:
```bash
cd frontend && npm test
```

### E2E (Playwright)

Key scenarios:
1. Full ticket lifecycle: create → assign → progress → resolve
2. SLA breach detection and email dispatch
3. Role access control enforcement
4. Report generation and CSV export
5. Admin user management

Run:
```bash
npx playwright test
```

---

## 17. ITIL Process Alignment

| ITIL Practice | Implementation |
|--------------|----------------|
| Incident Management | Priority-based ticketing, SLA tracking, escalation |
| Service Request Management | Separate ticket category for service requests |
| Change Management | (Future) Change request ticket type with approval workflow |
| Knowledge Management | (Future) Knowledge base article linking on tickets |
| Service Level Management | Configurable SLA targets per priority, breach reporting |
| Continual Improvement | Reports dashboard for trend analysis and agent KPIs |
| Audit & Compliance | Immutable audit log with full actor/action/before/after trail |

---

## 18. Known Limitations & Future Work

| Item | Status | Notes |
|------|--------|-------|
| File attachments on tickets | Not implemented | S3 integration required |
| Real-time notifications (WebSocket) | Not implemented | Socket.io planned |
| Change Management workflow | Not implemented | Phase 7 candidate |
| Knowledge base | Not implemented | Phase 7 candidate |
| Multi-language support | Not implemented | i18n with react-i18next |
| Mobile app | Not implemented | React Native wrapper possible |
| Redis caching | Not implemented | In-memory cache used as interim |
| SAML/SSO integration | Not implemented | Required for enterprise banking clients |
| Dark mode | Partial | Tailwind dark class added, not wired |
