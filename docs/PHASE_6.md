# Phase 6 — Reporting, Analytics & Production Readiness

## Overview

Phase 6 is the final phase of the ITIL-aligned MERN Stack Service Desk application. It focuses on management reporting, advanced analytics, system hardening, and full production readiness. Upon completion, the application will be deployable as a live banking-grade service desk.

---

## Objectives

- Build a reporting and analytics dashboard for managers and admins
- Implement SLA compliance reports and breach trend analysis
- Add audit log export functionality
- Harden the application for production (security, performance, monitoring)
- Write end-to-end tests for critical workflows
- Finalize deployment configuration (CI/CD, environment variables, HTTPS)

---

## Task Breakdown

### 6.1 — Reporting Dashboard (Backend)

**Endpoints to build:**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/reports/sla-compliance` | SLA breach rate by priority, agent, department |
| GET | `/api/reports/ticket-volume` | Ticket volume over time (daily/weekly/monthly) |
| GET | `/api/reports/agent-performance` | Avg. resolution time, closure rate per agent |
| GET | `/api/reports/category-breakdown` | Tickets grouped by category/type |
| GET | `/api/reports/audit-log/export` | Export audit log as CSV or JSON |

**Notes:**
- All report endpoints are restricted to `manager` and `admin` roles via existing RBAC middleware
- Use MongoDB aggregation pipelines for all report queries
- Add date range query params (`?from=&to=`) to all report endpoints
- Cache heavy aggregations with a short TTL (60s) to protect DB performance

---

### 6.2 — Reporting Dashboard (Frontend)

**Components to build:**

- `ReportsDashboard.jsx` — container page with tabbed navigation
- `SLAComplianceChart.jsx` — bar/line chart using Recharts
- `TicketVolumeChart.jsx` — time-series line chart
- `AgentPerformanceTable.jsx` — sortable table with avg. resolution time
- `CategoryBreakdownPieChart.jsx` — pie/donut chart
- `AuditLogExportButton.jsx` — triggers CSV/JSON download

**Notes:**
- Use Recharts for all chart components (already in the React ecosystem)
- Charts must be responsive (use `ResponsiveContainer` from Recharts)
- Date range picker component for filtering all reports
- Role-guard the entire `/reports` route to `manager` and `admin` only

---

### 6.3 — Audit Log Export

- Backend: Stream CSV export using `json2csv` or manual CSV construction
- Frontend: Download triggered via `<a>` tag with `blob:` URL
- Fields to export: `timestamp`, `actor`, `action`, `targetTicket`, `details`, `ipAddress`
- Support both CSV and JSON formats via `?format=csv` or `?format=json` query param

---

### 6.4 — Production Security Hardening

Address the known security gaps identified in Phase 5:

| Gap | Fix |
|-----|-----|
| No CSRF protection | Add `csurf` middleware or implement SameSite cookie policy |
| XSS vulnerabilities | Sanitize all user inputs with `xss` or `DOMPurify` on frontend |
| No HTTPS enforcement | Add `helmet` middleware; enforce HTTPS redirect in Express |
| Rate limiting gaps | Apply `express-rate-limit` to auth and ticket creation endpoints |
| JWT expiry strategy | Implement refresh token rotation with short-lived access tokens |

**Additional hardening:**
- Set all security headers via `helmet`
- Add `express-mongo-sanitize` to prevent NoSQL injection
- Review and tighten CORS config — whitelist only the production frontend origin
- Ensure `.env` is never committed; validate required env vars at startup

---

### 6.5 — Performance Optimisation

- Add MongoDB indexes on: `status`, `priority`, `assignedTo`, `createdAt`, `sla.breached`
- Implement pagination on the main ticket list (if not already done): `?page=&limit=`
- Add query result caching for dashboard stats (in-memory or Redis)
- Lazy-load heavy React components (`React.lazy` + `Suspense`)
- Code-split the Reports and Admin sections

---

### 6.6 — End-to-End Testing

**Test scenarios (using Playwright or Cypress):**

- Agent login → create ticket → resolve ticket → verify SLA timer stopped
- Manager login → view reports dashboard → export audit log
- Admin login → create user → assign role → verify access control
- SLA breach: create a ticket with a past deadline → verify breach flag and escalation email
- Unauthorized access: verify that non-manager roles cannot access `/reports`

---

### 6.7 — Deployment & CI/CD

**Environment:**
- Backend: Railway, Render, or AWS EC2
- Frontend: Vercel (consistent with existing projects)
- Database: MongoDB Atlas (production cluster)

**CI/CD Pipeline (GitHub Actions):**

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render/Railway
        run: # deployment command or webhook trigger

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Environment variables checklist:**

```
# Backend
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=

# Frontend
VITE_API_BASE_URL=https://your-backend.railway.app
```

---

### 6.8 — Final Documentation Updates

- Update `README.md` with full setup instructions
- Add API endpoint reference table to `README.md`
- Finalise `TECHNICAL_DOCS.md` (see separate file)
- Update `CLAUDE.md` agent instructions to reflect Phase 6 completion

---

## Acceptance Criteria

- [ ] All 5 report endpoints return correct aggregated data
- [ ] Dashboard renders charts correctly with live data
- [ ] Audit log export downloads a valid CSV/JSON file
- [ ] All 5 security gaps from Phase 5 audit are resolved
- [ ] MongoDB indexes verified via `explain()` queries
- [ ] E2E tests pass for all 5 critical scenarios
- [ ] Application deploys successfully to production environment
- [ ] No `.env` files or secrets in version control
- [ ] All routes are role-guarded correctly
- [ ] HTTPS enforced on production backend

---

## Estimated Effort

| Task | Estimated Hours |
|------|----------------|
| 6.1 Report endpoints (backend) | 4–5 hrs |
| 6.2 Report dashboard (frontend) | 5–6 hrs |
| 6.3 Audit log export | 1–2 hrs |
| 6.4 Security hardening | 3–4 hrs |
| 6.5 Performance optimisation | 2–3 hrs |
| 6.6 E2E testing | 4–5 hrs |
| 6.7 Deployment & CI/CD | 2–3 hrs |
| 6.8 Documentation | 1–2 hrs |
| **Total** | **22–30 hrs** |
