# OutSystems Migration Tool

A full-stack web application that analyses project documentation and generates a structured OutSystems migration plan using Claude AI.

**Live app:** https://outsystems-migration-tool.vercel.app  
**GitHub:** https://github.com/Mjelkic/outsystems-migration-tool

---

## Deployment

The app is split across two services:

| Service | Platform | URL |
|---|---|---|
| Frontend (React/Vite) | Vercel | https://outsystems-migration-tool.vercel.app |
| Backend (Node/Express) | Render | https://outsystems-migration-backend.onrender.com |

Vercel proxies all `/api/*` requests to the Render backend — no frontend code changes needed between local and production.

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after idle takes ~30 seconds to wake up. You can pre-warm it by visiting the [health endpoint](https://outsystems-migration-backend.onrender.com/api/health).

Any push to the `master` branch on GitHub automatically redeploys both services.

---

## Prerequisites (local development)

- [Node.js](https://nodejs.org/) v18 or higher
- npm (bundled with Node.js)

---

## Project Structure

```
OS Migration/
├── backend/
│   ├── server.js             ← Express server (port 3001, 5-min socket timeout)
│   ├── .env                  ← API credentials (you must create this)
│   ├── .env.example          ← Template for .env
│   ├── routes/
│   │   ├── upload.js         ← File upload & text extraction
│   │   ├── generate.js       ← Plan generation via Claude
│   │   └── refine.js         ← Plan refinement via Claude
│   └── services/
│       └── claude.js         ← Axios-based Claude API client (singleton)
├── frontend/
│   ├── vite.config.js        ← Proxies /api/* to localhost:3001 in dev
│   └── src/
│       ├── App.jsx / App.css
│       ├── index.css         ← CSS variables (Deloitte theme)
│       ├── assets/
│       │   └── deloitte-logo.svg
│       ├── pages/
│       │   ├── InputPage.jsx / InputPage.css
│       │   ├── ResultsPage.jsx / ResultsPage.css
│       │   └── HistoryPage.jsx / HistoryPage.css
│       └── utils/
│           ├── exportPptx.js ← PowerPoint generation (pptxgenjs)
│           └── storage.js    ← localStorage plan history (max 20 entries)
├── render.yaml               ← Render backend deployment config
├── vercel.json               ← Vercel frontend deployment config + API proxy
└── claims_management_detailed.txt  ← Sample document for testing
```

---

## Local Setup

### 1. Configure the Backend Environment

```bash
cd backend
copy .env.example .env
```

Open `backend/.env` and fill in your values:

```
ANTHROPIC_API_KEY=your-api-key-here
PORT=3001
```

> **Note:** This app uses the Deloitte corporate AI proxy (`cst-ai-proxy.azurewebsites.net`), not the standard Anthropic API. The key format is `cst-...`, not `sk-ant-...`.

---

### 2. Install Dependencies

From the project root:

```bash
npm run install:all
```

Or separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Running Locally

Two terminal windows are required simultaneously.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

> Uses `nodemon` for auto-restart on file changes. For a plain start: `node server.js`

Expected output:
```
Server running on port 3001
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE ready in ...ms
Local: http://localhost:5173/
```

Navigate to: **http://localhost:5173**

---

## Using the Application

### 1. Generate a Plan

- Upload a document (`.pdf`, `.docx`, `.doc`, `.txt`, `.md` — max 20 MB) or paste text directly
- Enter a project name
- Click **Generate Migration Plan** — takes ~40–80 seconds

The plan is organised into sections:
- Project Summary
- Data Model (entities, attributes, relationships)
- Architecture (modules by layer)
- Screens & UI Flows
- Business Logic (Server Actions, Client Actions, Timers)
- Integrations
- Security (roles, auth method, sensitive data)
- Roadmap (phases, tasks, deliverables, risks)

### 2. Refine the Plan

Click **Refine Plan** to open the refinement panel. Type any corrections or missing details (e.g. additional entities, role changes, new integrations) and click **Apply Refinements**. Claude updates the plan while preserving existing content.

### 3. Export

| Format | Description |
|---|---|
| **JSON** | Full structured plan as raw JSON |
| **TXT** | Human-readable summary |
| **PPT** | PowerPoint presentation with Deloitte branding — click **↓ PPT ▾** and choose **Compact** (summary tables) or **Detailed** (one slide per item) |

### 4. Plan History

Previously generated plans are saved automatically in the browser (localStorage, max 20 entries, matched by project name). Access them via the **History** button in the navigation bar. Plans can be reloaded or deleted.

---

## Test File

A working sample document is included:

```
claims_management_detailed.txt
```

This is a Claims Management Application spec. It generates in ~75 seconds and produces 6 entities, 4 modules, 7 screens, and 5 roadmap phases.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `ECONNREFUSED` on port 3001 | Backend not running | Start the backend in Terminal 1 |
| Request times out after ~2 min | Long generation via proxy | Wait — timeout is 5 min |
| `400 Bad Request` from proxy | Invalid API key or model | Check `backend/.env` values |
| Blank or broken JSON output | Claude returned markdown fences | The parser handles this automatically — retry if it persists |
| TLS certificate error | Deloitte network TLS inspection | Already handled via `NODE_TLS_REJECT_UNAUTHORIZED=0` |
| First production request is very slow | Render free tier cold start | Wait ~30s — subsequent requests are normal speed |
| Production API calls failing | Render service is down | Check https://outsystems-migration-backend.onrender.com/api/health |

---

## Technical Notes

- **Axios over SDK:** The Deloitte corporate network blocks TLS certificate revocation checks. The Anthropic SDK cannot bypass this; the backend uses `axios` with `rejectUnauthorized: false` instead.
- **`max_tokens: 8192`:** Values below 4096 caused truncated, invalid JSON responses.
- **No assistant prefill:** The proxy returns a 400 error for requests where the messages array ends with an assistant turn.
- **PPT generation:** Done entirely in the browser using `pptxgenjs`. No server involvement.
- **History:** Stored in `localStorage` under the key `os-migration-plans`. Plans are matched by project name so re-running the same project overwrites the previous entry.
- **Split deployment:** Vercel serverless functions have a 10-second timeout — too short for 40–80 second Claude calls. The backend runs on Render (real Node.js process, no timeout limit) and Vercel proxies `/api/*` to it via `vercel.json` rewrites.
