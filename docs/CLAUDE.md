# CLAUDE.md — ITIL Service Desk Agent Instructions

## Project Identity

This is an **ITIL-aligned MERN Stack Service Desk application** built for banking operations environments. It is a production-grade full-stack project with JWT authentication, RBAC, SLA enforcement, immutable audit logging, and a management reporting dashboard.

**Current status:** Phase 6 (final phase) — Reporting, Analytics & Production Readiness.
**Phases 1–5 are complete.**

---

## Stack at a Glance

```
Backend:   Node.js 18 + Express 4 + Mongoose 7 + MongoDB Atlas
Frontend:  React 18 + Vite 5 + React Router v6 + Tailwind CSS 3
Auth:      JWT (15min access token) + Refresh token (httpOnly cookie, 7d)
Testing:   Jest + Supertest (backend) | Vitest + RTL (frontend) | Playwright (E2E)
Deploy:    Vercel (frontend) + Railway/Render (backend) + MongoDB Atlas
```

---

## Project Structure

```
service-desk/
├── backend/
│   ├── config/db.js
│   ├── controllers/        # authController, ticketController, userController, reportController, auditController
│   ├── middleware/         # authMiddleware (JWT), rbacMiddleware, rateLimiter, errorHandler
│   ├── models/             # User, Ticket, AuditLog, Notification
│   ├── routes/             # authRoutes, ticketRoutes, userRoutes, reportRoutes, auditRoutes
│   ├── services/           # slaService, emailService, escalationService
│   ├── jobs/slaChecker.js  # node-cron SLA breach checker (every 5 min)
│   ├── utils/              # auditLogger, responseHelper
│   └── server.js
└── frontend/
    └── src/
        ├── api/            # axiosInstance (with interceptors), ticketApi, authApi, reportApi
        ├── components/     # tickets/, dashboard/, reports/, shared/
        ├── context/AuthContext.jsx
        ├── hooks/          # useTickets, useSLA
        ├── pages/          # Login, Dashboard, Tickets, TicketDetail, Reports, Users, AuditLog
        └── routes/ProtectedRoute.jsx
```

---

## Coding Conventions

### General
- Use `async/await` everywhere — no `.then()/.catch()` chains
- All errors bubble up through the centralized `errorHandler` middleware
- Every API response follows this shape:
  ```json
  { "success": true, "data": {}, "message": "..." }
  { "success": false, "error": "...", "message": "..." }
  ```
- Use named exports for all utilities and helpers
- Use default exports for React components

### Backend
- Controllers handle only request/response logic — business logic lives in services
- All DB writes to `AuditLog` go through `utils/auditLogger.js` — never write directly
- Never allow UPDATE or DELETE on the `AuditLog` collection — it is write-once
- Validate all request bodies with `express-validator` before hitting the controller
- Use `mongoose` lean queries (`.lean()`) on read-only aggregations for performance
- Indexes must be defined on the Mongoose schema, not added manually

### Frontend
- All API calls via React Query (`useQuery`, `useMutation`) — no raw `useEffect` for data fetching
- Access tokens stored in memory only — never in `localStorage` or `sessionStorage`
- All protected routes use `ProtectedRoute.jsx` with `allowedRoles` prop
- Tailwind only — no inline styles, no CSS modules
- Component files: PascalCase (`TicketDetail.jsx`)
- Utility/hook files: camelCase (`useTickets.js`)

---

## Role System

Four roles with strict hierarchy:

| Role | Key Permissions |
|------|----------------|
| `end_user` | Create tickets, view own tickets, add comments |
| `agent` | All above + view all tickets, update status, add internal notes |
| `manager` | All above + assign tickets, view reports, export audit log |
| `admin` | All above + manage users, change roles, deactivate accounts |

RBAC is enforced server-side via `rbacMiddleware.js`. Frontend role guards are UI-only — never rely on them for security.

---

## SLA Rules

| Priority | Resolution Target |
|----------|------------------|
| `critical` | 1 hour |
| `high` | 4 hours |
| `medium` | 8 hours |
| `low` | 24 hours |

- SLA target is calculated and stored on `ticket.sla.targetResolutionTime` at creation
- The cron job in `jobs/slaChecker.js` runs every 5 minutes and marks breached tickets
- SLA breaches are logged to AuditLog with action `sla.breached`
- Escalation fires automatically after 30 minutes of breach — logic lives in `services/escalationService.js`

---

## Audit Log Rules

- **Every** ticket state change, user management action, and auth event must be logged
- Use `auditLogger.log({ actor, action, targetTicket, targetUser, before, after, details, req })`
- Valid `action` values:
  ```
  ticket.created | ticket.updated | ticket.assigned | ticket.status_changed
  ticket.commented | ticket.resolved | ticket.closed | ticket.escalated
  sla.breached | user.created | user.role_changed | user.deactivated
  auth.login | auth.logout | auth.failed_login
  ```
- `before` and `after` should contain only the relevant changed fields — not the full document
- AuditLog has no API endpoint for deletion — do not create one

---

## Security Rules

Always apply all of the following. Never skip any for development convenience:

1. `helmet` middleware on all Express routes
2. `express-mongo-sanitize` on all request bodies
3. `express-rate-limit` on `/api/auth/*` endpoints (100 req / 15 min)
4. CORS restricted to `process.env.FRONTEND_URL` only
5. Refresh token cookie must have: `httpOnly: true`, `secure: true`, `sameSite: 'Strict'`
6. All user input rendered in React must pass through `DOMPurify.sanitize()` before display
7. JWT secrets must be at least 64 characters — validate at server startup
8. Never log JWT tokens, passwords, or refresh tokens — not even in development

---

## What Is Left to Build (Phase 6)

The following have NOT been built yet. Build them in this order:

1. **Report endpoints** (`/api/reports/*`) — 5 endpoints using MongoDB aggregation pipelines
2. **Reports dashboard** (`/reports` page) — Recharts charts, date range filter, role-guarded
3. **Audit log export** — CSV/JSON download via `?format=csv` or `?format=json`
4. **Security hardening** — resolve all 5 gaps: CSRF, XSS, HTTPS, rate limiting, JWT refresh rotation
5. **MongoDB indexes** — add on `status`, `priority`, `assignedTo`, `createdAt`, `sla.breached`
6. **E2E tests** — 5 Playwright scenarios covering the full ticket lifecycle and reports
7. **CI/CD** — GitHub Actions pipeline for test → deploy (Vercel frontend, Railway backend)
8. **Environment validation** — startup check for all required env vars

---

## Phases Already Completed

| Phase | Summary |
|-------|---------|
| Phase 1 | Project setup, Express server, MongoDB connection, User model |
| Phase 2 | JWT auth (register/login/refresh/logout), bcrypt password hashing |
| Phase 3 | Ticket CRUD, RBAC middleware, SLA calculation at creation |
| Phase 4 | SLA cron job, breach detection, escalation service, email notifications, AuditLog |
| Phase 5 | Frontend (React + Vite + Tailwind), all pages, Axios interceptors, protected routes, security audit |
| Phase 6 | 🔄 In progress — see above |

---

## Report Endpoints Specification

Build all 5 endpoints in `controllers/reportController.js`, mounted at `/api/reports`:

```
GET /sla-compliance       → breach rate grouped by priority (supports ?from & ?to)
GET /ticket-volume        → ticket count over time (supports ?granularity=daily|weekly|monthly)
GET /agent-performance    → avg resolution time + breach rate per agent
GET /category-breakdown   → ticket count by category
GET /audit-log/export     → stream CSV or JSON (supports ?format=csv|json, ?from, ?to)
```

All endpoints:
- Require JWT + `manager` or `admin` role
- Support `?from=ISO_DATE&to=ISO_DATE` date range filtering
- Use MongoDB aggregation pipelines (not in-app filtering)
- Return data in the standard `{ success, data }` response shape

---

## Report Dashboard Components

Build inside `src/components/reports/`:

```
ReportsDashboard.jsx          → container, tabbed navigation, date range picker
SLAComplianceChart.jsx        → BarChart from Recharts, breach % by priority
TicketVolumeChart.jsx         → LineChart from Recharts, tickets over time
AgentPerformanceTable.jsx     → sortable HTML table, avg resolution time per agent
CategoryBreakdownPieChart.jsx → PieChart from Recharts
AuditLogExportButton.jsx      → triggers blob download, supports CSV/JSON toggle
```

All charts must use `<ResponsiveContainer width="100%" height={300}>` from Recharts.

---

## Environment Variables Reference

```env
# Backend
NODE_ENV=production
PORT=5000
MONGO_URI=
JWT_SECRET=                    # min 64 chars
JWT_REFRESH_SECRET=            # min 64 chars, different from JWT_SECRET
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Frontend
VITE_API_BASE_URL=
```

---

## Do Not Do

- Do not add DELETE or UPDATE routes for AuditLog
- Do not store access tokens in localStorage or sessionStorage
- Do not skip RBAC middleware on any route — even GET routes
- Do not use `WidthType.PERCENTAGE` in any table if generating documents
- Do not use `.then()/.catch()` — use `async/await` with try/catch
- Do not write business logic in route files — it belongs in controllers/services
- Do not query MongoDB without indexes on high-traffic fields (status, priority, createdAt)
- Do not deploy without validating all required environment variables at startup
- Do not commit `.env` files — use `.env.example` with placeholder values only

---

## Quick Reference Commands

```bash
# Backend dev
cd backend && npm run dev

# Frontend dev
cd frontend && npm run dev

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run E2E tests
npx playwright test

# Check for security vulnerabilities
npm audit --audit-level=moderate

# Verify MongoDB indexes
# In mongosh:
db.tickets.getIndexes()
db.auditlogs.getIndexes()
```
