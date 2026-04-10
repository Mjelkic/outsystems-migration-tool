---
name: OS Migration Tool - Project Context
description: Full context of the OutSystems Migration Tool project built for mjelkic at Deloitte
type: project
---

## What Was Built

A full-stack web application that takes project documentation as input, sends it to Claude AI, and generates a complete OutSystems migration plan. Supports plan refinement, history persistence, and PowerPoint export.

**Live app:** https://outsystems-migration-tool.vercel.app  
**GitHub:** https://github.com/Mjelkic/outsystems-migration-tool  
**Local path:** `C:\Users\mjelkic\OneDrive - Deloitte (O365D)\Desktop\Claude\OS Migration\`

**Stack:**
- Backend: Node.js + Express (port 3001 locally, Render in production)
- Frontend: React + Vite (port 5173 locally, Vercel in production)

---

## Deployment Architecture

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://outsystems-migration-tool.vercel.app |
| Backend | Render (free tier) | https://outsystems-migration-backend.onrender.com |

- `vercel.json` rewrites `/api/:path*` → Render backend — no frontend code changes between dev and prod
- `render.yaml` configures the Render service (Node, `backend/` root dir, env vars)
- Render auto-deploys on push to `master`; Vercel auto-deploys on push to `master`
- Render free tier cold-starts after 15 min idle (~30s wake-up delay on first request)
- Vercel serverless timeout (10s) ruled out running the backend on Vercel — Claude calls take 40–80s

---

## How to Run Locally

**Terminal 1 — Backend:**
```bash
cd "C:\Users\mjelkic\OneDrive - Deloitte (O365D)\Desktop\Claude\OS Migration\backend"
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd "C:\Users\mjelkic\OneDrive - Deloitte (O365D)\Desktop\Claude\OS Migration\frontend"
npm run dev
```

Open: **http://osmigration.local:5173**

> Requires `127.0.0.1 osmigration.local` in `C:\Windows\System32\drivers\etc\hosts`. Add via elevated PowerShell:
> ```powershell
> Add-Content -Path 'C:\Windows\System32\drivers\etc\hosts' -Value '127.0.0.1 osmigration.local'
> ```

---

## API Configuration

- **Provider:** Deloitte corporate Azure AI proxy (in front of Anthropic)
- **Endpoint:** `https://cst-ai-proxy.azurewebsites.net/api/anthropic`
- **API Key:** stored in `backend/.env` (locally) and as a Render environment variable (production) — never committed
- **Model:** `claude-opus-4-6`
- **Key format:** `cst-...` (not a standard Anthropic `sk-ant-...` key)

**Why not Anthropic SDK:** The Deloitte corporate network blocks TLS certificate revocation checks. The Anthropic SDK cannot bypass this, so the backend uses `axios` with `httpsAgent: new https.Agent({ rejectUnauthorized: false })` instead.

**Assistant prefill not supported:** The proxy returns a 400 error if the messages array ends with an assistant message.

---

## Key Technical Decisions

### Local dev hostname (`frontend/vite.config.js`)
- `host: 'osmigration.local'` — Vite binds to this hostname instead of `localhost`
- Requires a hosts file entry: `127.0.0.1 osmigration.local`
- Local dev URL: **http://osmigration.local:5173**

### TLS fix (`backend/server.js`)
```js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

### Claude call (`backend/services/claude.js`)
- Singleton axios client — created once at module load, reused across all requests
- Uses `axios` directly (not `@anthropic-ai/sdk`)
- `max_tokens: 8192` — 4096 caused truncation and invalid JSON
- `model: claude-opus-4-6`
- System prompt explicitly warns Claude that any character outside `{ }` will throw a SyntaxError — stops markdown fences reliably
- Shared `parseResponse()` helper strips fences and extracts outermost `{ ... }` — used by both generate and refine
- Error status uses `err.response?.status` (axios wraps errors — `err.status` is always undefined)

### Performance
- Generation takes **~40–80 seconds** for typical documents via the proxy
- Socket timeout set to 300 seconds in `backend/server.js`
- Frontend axios timeout set to 210 seconds

### Plan Refinement (`backend/routes/refine.js`)
- `POST /api/refine` accepts `content`, `projectName`, `currentPlan`, `additionalNotes`
- Sends original document (sliced to 6000 chars) + current plan JSON (sliced to 6000 chars) + user notes to Claude
- Returns a full updated plan JSON — same structure as `/api/generate`

### Plan History (`frontend/src/utils/storage.js`)
- Saved to `localStorage` under key `os-migration-plans`
- Max 20 entries; matched by `projectName` so re-running the same project overwrites
- Each entry stores `{ id, projectName, plan, originalContent, savedAt }`

### PowerPoint Export (`frontend/src/utils/exportPptx.js`)
- Runs entirely in the browser using `pptxgenjs` v4.0.1
- Layout: LAYOUT_WIDE (13.33 × 7.5 in)
- Two density modes: **Compact** (summary tables per section) and **Detailed** (one slide per item)
- Each content slide has a subtitle line (grey, 9pt) summarising slide content
- Deloitte logo embedded as base64 SVG via Vite `?raw` import
- Colors: pptxgenjs requires hex WITHOUT `#` prefix (e.g. `'86BC24'`)
- White rectangle placed behind logo on dark-background slides (title, section dividers)

---

## Project File Structure

```
OS Migration/
├── backend/
│   ├── server.js             # Express server, 5-min socket timeout, CORS for *.vercel.app
│   ├── .env                  # API key + base URL (not committed)
│   ├── .env.example          # Template
│   ├── routes/
│   │   ├── upload.js         # File upload + text extraction (PDF, DOCX, TXT, MD)
│   │   ├── generate.js       # Calls Claude, returns plan JSON
│   │   └── refine.js         # Refines existing plan with additional notes
│   └── services/
│       └── claude.js         # Singleton axios client, shared parseResponse helper
├── frontend/
│   ├── vite.config.js        # Proxies /api/* to localhost:3001 in dev
│   └── src/
│       ├── App.jsx / App.css # Navigation (Input / Results / History views)
│       ├── index.css         # CSS variables (Deloitte theme)
│       ├── assets/
│       │   └── deloitte-logo.svg
│       ├── pages/
│       │   ├── InputPage.jsx / InputPage.css
│       │   ├── ResultsPage.jsx / ResultsPage.css
│       │   └── HistoryPage.jsx / HistoryPage.css
│       └── utils/
│           ├── exportPptx.js # PowerPoint generation
│           └── storage.js    # localStorage history management
├── render.yaml               # Render backend deployment config
├── vercel.json               # Vercel frontend config + /api/* → Render rewrite
└── claims_management_detailed.txt  # Sample test document
```

---

## Deloitte Brand Theme

**Official Deloitte palette — green + black only (no navy, no blue).**

| Variable | Hex | Usage |
|---|---|---|
| `--d-green` | `#86BC24` | Buttons, CTAs, active states, section borders, roadmap markers |
| `--d-green-dark` | `#6a9a1c` | Hover state for green elements |
| `--d-green-lt` | `#f0f7e0` | Subtle green tint for highlighted rows |
| `--d-black` | `#000000` | Header background, text, table headers |
| `--d-white` | `#ffffff` | Card surfaces, text on dark backgrounds |

**Theme:** Light (page background `#f2f2f2`, card surfaces `#ffffff`)

---

## Features

| Feature | Description |
|---|---|
| Plan generation | Upload doc or paste text → Claude returns structured JSON plan |
| Refine Plan | Submit additional notes → Claude updates plan in-place |
| Plan History | Auto-saved to localStorage, reloadable, deletable |
| Export JSON | Full plan as `.json` |
| Export TXT | Human-readable summary as `.txt` |
| Export PPT | Branded PowerPoint (Compact or Detailed density, dropdown button) |

---

## Test File

```
claims_management_detailed.txt
```
Claims Management Application spec — generates in ~75 seconds, produces 6 entities, 4 modules, 7 screens, and 5 roadmap phases.

---

## Known Issues & Fixes Applied

| Issue | Fix |
|---|---|
| TLS cert error on Deloitte network | `NODE_TLS_REJECT_UNAUTHORIZED=0` + custom `https.Agent` |
| Anthropic SDK ignores TLS flag | Replaced SDK with `axios` |
| Response timeout | Reduced `max_tokens` 16000→8192, socket timeout 300s |
| Claude wraps JSON in markdown fences | System prompt warns of SyntaxError; parser strips fences as fallback |
| JSON truncated mid-response | Increased `max_tokens` from 4096 to 8192 |
| Proxy rejects assistant prefill | Removed prefill, stronger system prompt instead |
| Model `claude-haiku-4-5-20251001` returns 404 | Only `claude-opus-4-6` available on this proxy |
| Backend not restarting on file changes | Use `npm run dev` (nodemon) instead of `node server.js` |
| `err.status` always undefined on axios errors | Fixed to `err.response?.status` — 401/429 handlers now fire |
| Vercel serverless timeout too short for Claude | Backend deployed on Render; Vercel proxies `/api/*` to it |
| Render cold-start delay | Free tier only — first request after 15 min idle takes ~30s |
