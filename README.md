# ITIL-Aligned Service Desk

A production-grade MERN stack service desk for banking operations environments. Covers ITIL incident management, tiered escalation, SLA enforcement, knowledge base, audit logging, and a full analytics + reporting dashboard.

**Stack:** React 18 · Redux Toolkit · Express 4 · Mongoose 8 · MongoDB

---

## Quick Start (Local — 5 steps)

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node |
| MongoDB | 6+ | https://www.mongodb.com/try/download/community **or** MongoDB Atlas (cloud) |

---

### Step 1 — Clone or extract the project

```bash
# If using git:
git clone https://github.com/s-aduk/itil-servicedesk.git
cd itil-servicedesk

# If extracted from ZIP:
cd itil-servicedesk
```

---

### Step 2 — Install all dependencies

```bash
npm run install:all
```

This installs the root, backend, and frontend dependencies in one command.

---

### Step 3 — Set up the database

Choose **one** of the two options below:

#### Option A — Local MongoDB (recommended for development)

1. Download and install MongoDB Community Edition: https://www.mongodb.com/try/download/community
2. Start MongoDB:
   - **macOS/Linux:**
     ```bash
     mongod --dbpath /usr/local/var/mongodb
     # or if installed as a service:
     brew services start mongodb-community
     ```
   - **Windows:** Start the MongoDB service from Services, or run:
     ```bash
     "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath C:\data\db
     ```
3. Verify it's running:
   ```bash
   mongosh
   # should connect to mongodb://localhost:27017
   ```
4. No database creation needed — MongoDB creates `itil_servicedesk` automatically on first write.

#### Option B — MongoDB Atlas (free cloud database)

1. Go to https://cloud.mongodb.com and create a free account
2. Click **Build a Database** → choose **M0 Free Tier** → select your nearest region
3. Create a database user:
   - Go to **Security → Database Access** → **Add New Database User**
   - Username: `servicedesk_user` · Password: create a strong password
   - Role: **Atlas Admin** (or "Read and Write to any database")
   - Click **Add User**
4. Whitelist your IP:
   - Go to **Security → Network Access** → **Add IP Address**
   - For development: click **Allow Access from Anywhere** (`0.0.0.0/0`)
   - For production: add only your server IP
5. Get your connection string:
   - Go to **Deployment → Database** → click **Connect** on your cluster
   - Choose **Connect your application** → Driver: **Node.js** → Version: **5.5 or later**
   - Copy the connection string — it looks like:
     ```
     mongodb+srv://servicedesk_user:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
     ```

---

### Step 4 — Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` in your editor and fill in the values:

```env
NODE_ENV=development
PORT=5000

# Paste your MongoDB URI here (local or Atlas):
MONGODB_URI=mongodb://localhost:27017/itil_servicedesk

# Generate secure JWT secrets (run this command twice, use different outputs):
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=paste_your_64_char_random_string_here
JWT_REFRESH_SECRET=paste_a_different_64_char_random_string_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Leave as-is for local development:
CLIENT_URL=http://localhost:3000

# Optional — leave blank to skip email notifications:
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

### Step 5 — Run the project

```bash
# From the project root:
npm run dev
```

This starts both servers concurrently:
- **Backend API:** http://localhost:5000
- **Frontend app:** http://localhost:3000

Open http://localhost:3000 in your browser.

---

### Step 6 — Create your first admin user

Register a user via the app's register page, then promote them to admin in MongoDB.

**Using MongoDB Compass (GUI):**
1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect to `mongodb://localhost:27017` (local) or your Atlas URI
3. Open `itil_servicedesk` → `users`
4. Find your user → click **Edit** → change `role` from `end_user` to `admin` → **Update**

**Using mongosh (terminal):**
```bash
mongosh
use itil_servicedesk
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

**Available roles:**
| Role | Description |
|------|-------------|
| `end_user` | Creates and tracks own tickets |
| `tier1` | Front-line support — handles tickets, adds notes |
| `tier2` | Second-line support — handles escalated tickets |
| `tier3` | Specialist support — handles critical escalations |
| `admin` | Full access — user management, reports, audit |

---

## Production Deployment

### Architecture

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Free tier, auto-deploy from GitHub |
| Backend | Railway or Render | Free tier available |
| Database | MongoDB Atlas | M0 free tier for low traffic; M10+ for production SLA |

---

### Deploy to Production

#### 1. MongoDB Atlas (production)

Follow the same Atlas steps above, but:
- Use **M10 cluster** instead of M0 (M0 has no uptime SLA)
- Under Network Access, add only your Railway/Render server IP (not 0.0.0.0/0)
- Enable **Point-in-Time Recovery** under Backup

#### 2. Deploy Backend to Railway

1. Go to https://railway.app → sign in with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select your repo → set **Root Directory** to `backend`
4. Under **Variables**, add all values from your `backend/.env`:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = your secret
   - `JWT_REFRESH_SECRET` = your secret
   - `CLIENT_URL` = your Vercel frontend URL (fill in after Vercel deploy)
   - `PORT` = `5000`
5. Railway auto-runs `npm start` → `node index.js`
6. Note your Railway URL: `https://your-app.up.railway.app`

**Alternative: Render**
1. https://render.com → **New Web Service**
2. Connect repo, root directory = `backend`
3. Build command: `npm install` · Start command: `node index.js`
4. Add all env vars in the Render dashboard

#### 3. Deploy Frontend to Vercel

1. Go to https://vercel.com → sign in with GitHub
2. **Add New Project** → import your repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `REACT_APP_API_URL` = your Railway backend URL (if you switch from proxy to explicit URL)
   
   > **Note:** The frontend uses a proxy in development (`"proxy": "http://localhost:5000"` in `frontend/package.json`). For production, Vercel needs to be told where the backend is. Either:
   > - **Option A (easiest):** Use Vercel Rewrites — add `vercel.json` to the `frontend/` folder:
   >   ```json
   >   {
   >     "rewrites": [
   >       { "source": "/api/:path*", "destination": "https://your-backend.up.railway.app/api/:path*" }
   >     ]
   >   }
   >   ```
   > - **Option B:** Update `frontend/src/services/api.js` — change `baseURL: '/api'` to `baseURL: process.env.REACT_APP_API_URL || '/api'`

5. Click **Deploy**
6. Copy your Vercel URL → go back to Railway → update `CLIENT_URL` to this URL

#### 4. Update CORS

Once both are deployed, update `CLIENT_URL` in Railway to your Vercel frontend URL exactly (e.g. `https://your-app.vercel.app`). This ensures CORS only allows your frontend.

---

### Production Checklist

- [ ] `NODE_ENV=production` set on backend
- [ ] `MONGODB_URI` points to Atlas M10+ cluster
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are 64+ char random strings
- [ ] `CLIENT_URL` matches your Vercel URL exactly
- [ ] Network Access on Atlas is locked to server IP only
- [ ] Health check passes: `GET https://your-backend.railway.app/api/health`
- [ ] Login works end-to-end
- [ ] Create a test ticket and verify SLA deadline is set
- [ ] Promote first user to admin via Atlas
- [ ] Reports dashboard loads (admin/tier roles only)

---

## Project Structure

```
itil-servicedesk/
│
├── backend/                         ← Express API (port 5000)
│   ├── config/
│   │   ├── database.js              MongoDB connection
│   │   ├── sla.config.js            SLA targets & escalation thresholds
│   │   └── slaScheduler.js          60s interval SLA checker
│   ├── controllers/                 Request handlers
│   │   ├── auth.controller.js
│   │   ├── ticket.controller.js
│   │   ├── user.controller.js
│   │   ├── analytics.controller.js
│   │   ├── report.controller.js     ← Phase 6 (new)
│   │   ├── audit.controller.js
│   │   ├── knowledge.controller.js
│   │   ├── notification.controller.js
│   │   └── escalation.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js        JWT verify + RBAC
│   │   └── error.middleware.js       Global error handler
│   ├── models/
│   │   ├── user.model.js
│   │   ├── incident.model.js         Ticket model with SLA virtuals
│   │   ├── auditLog.model.js         Immutable + blockchain-style hash chain
│   │   ├── knowledgeArticle.model.js
│   │   └── notification.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── ticket.routes.js
│   │   ├── user.routes.js
│   │   ├── analytics.routes.js
│   │   ├── report.routes.js         ← Phase 6 (new)
│   │   ├── audit.routes.js
│   │   ├── knowledge.routes.js
│   │   └── notification.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── ticket.service.js
│   │   ├── sla.service.js           SLA checks + auto-escalation
│   │   ├── analytics.service.js     Aggregation pipelines
│   │   ├── ai.service.js            Anthropic Claude API integration
│   │   ├── knowledge.service.js
│   │   └── notification.service.js
│   ├── app.js                       Express app + middleware stack
│   ├── index.js                     Entry point + env validation
│   ├── package.json
│   └── .env.example                 ← Copy to .env and fill in
│
├── frontend/                        ← React app (port 3000)
│   ├── public/index.html
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   ├── DashboardPage.js
│       │   ├── TicketsPage.js
│       │   ├── TicketDetailPage.js
│       │   ├── NewTicketPage.js
│       │   ├── AnalyticsPage.js
│       │   ├── ReportsPage.js       ← Phase 6 (new)
│       │   ├── AuditPage.js
│       │   ├── KnowledgePage.js
│       │   ├── ArticlePage.js
│       │   └── NewArticlePage.js
│       ├── components/
│       │   ├── AppLayout.js         Navigation + sidebar
│       │   ├── NotificationBell.js
│       │   └── AiSuggestionPanel.js
│       ├── store/                   Redux Toolkit slices
│       ├── services/api.js          Axios + JWT interceptor
│       └── App.js                   Routes
│
├── docs/
│   ├── TECHNICAL_DOCS.md
│   ├── CLAUDE.md
│   └── PHASE_6.md
│
├── .github/workflows/deploy.yml    CI/CD pipeline
├── package.json                    Root scripts (dev, install:all)
├── .gitignore
└── README.md
```

---

## API Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{name, email, password, role?, department?}` | Register |
| POST | `/api/auth/login` | `{email, password}` | Login |
| POST | `/api/auth/refresh` | `{refreshToken}` | Refresh access token |
| GET | `/api/auth/me` | — | Get current user |

### Tickets
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/tickets` | all | List tickets (end_user sees own only) |
| GET | `/api/tickets/dashboard` | all | Dashboard stats |
| GET | `/api/tickets/:id` | all | Ticket detail |
| POST | `/api/tickets` | all | Create ticket |
| PATCH | `/api/tickets/:id` | tier1+ | Update ticket |
| POST | `/api/tickets/:id/notes` | all | Add note |
| POST | `/api/tickets/:id/escalate` | tier1+ | Escalate ticket |
| DELETE | `/api/tickets/:id` | admin | Delete ticket |

### Reports (Phase 6 — tier1+)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/summary` | Full analytics overview |
| GET | `/api/reports/sla-compliance` | SLA breach rate by priority |
| GET | `/api/reports/ticket-volume?granularity=daily\|weekly\|monthly` | Volume over time |
| GET | `/api/reports/agent-performance` | Per-agent KPIs |
| GET | `/api/reports/category-breakdown` | Tickets by category |
| GET | `/api/reports/audit-export?format=csv\|json` | Download audit log |

All report endpoints support `?from=ISO_DATE&to=ISO_DATE`.

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Analytics data |
| GET | `/api/audit` | Audit log |
| GET | `/api/audit/verify-chain` | Verify audit log integrity |
| GET | `/api/notifications` | User notifications |
| GET | `/api/knowledge` | Knowledge base articles |
| GET | `/api/health` | Health check |

---

## SLA Targets

| Priority | Response Time | Resolution Time |
|----------|--------------|-----------------|
| Critical | 15 minutes | 1 hour |
| High | 30 minutes | 4 hours |
| Medium | 2 hours | 24 hours |
| Low | 8 hours | 3 days |

SLA checks run every 60 seconds. At 75% elapsed → Tier 2 escalation. At 90% elapsed → Tier 3 escalation.

---

## Common Issues

**"Missing required environment variables"**
→ You haven't created `backend/.env`. Run `cp backend/.env.example backend/.env` then fill in `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

**"MongoDB connection error: ECONNREFUSED"**
→ MongoDB is not running locally. Start it with `brew services start mongodb-community` (macOS) or start the service on Windows.

**"MongoDB connection error: bad auth"**
→ Wrong username/password in your Atlas connection string. Check the `MONGODB_URI` in your `.env`.

**Frontend shows blank page / "Cannot GET /"**
→ Make sure you're running `npm run dev` from the project root, not from inside `backend/` or `frontend/`.

**"Network Error" on API calls**
→ Backend isn't running, or the proxy isn't set. Verify `backend/.env` exists and `npm run dev` started both servers.

**Port 5000 already in use**
→ Change `PORT=5001` in `backend/.env` and update the proxy in `frontend/package.json` to `"proxy": "http://localhost:5001"`.
