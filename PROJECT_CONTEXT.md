---
name: OS Migration Tool - Project Context
description: Full context of the OutSystems Migration Tool project built for mjelkic at Deloitte
type: project
---

## What Was Built

A full-stack web application that takes project documentation as input, sends it to Claude AI, and generates a complete OutSystems migration plan.

**Location:** `C:\Users\mjelkic\OneDrive - Deloitte (O365D)\Desktop\Claude\OS Migration\`

**Stack:**
- Backend: Node.js + Express (port 3001)
- Frontend: React + Vite (port 5173)

---

## How to Run

**Terminal 1 — Backend:**
```bash
cd "C:\Users\mjelkic\OneDrive - Deloitte (O365D)\Desktop\Claude\OS Migration\backend"
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd "C:\Users\mjelkic\OneDrive - Deloitte (O365D)\Desktop\Claude\OS Migration\frontend"
npm run dev
```

Open: **http://localhost:5173**

---

## API Configuration

- **Provider:** Playlistt AI (corporate Azure proxy in front of Anthropic)
- **Endpoint:** `https://cst-ai-proxy.azurewebsites.net/api/anthropic`
- **API Key:** `cst-mjelkic-fe5be165` (stored in `backend/.env`)
- **Model:** `claude-opus-4-6`
- **Key format:** `cst-...` (not a standard Anthropic `sk-ant-...` key)

**Why not Anthropic SDK:** The Deloitte corporate network blocks TLS certificate revocation checks. The Anthropic SDK cannot bypass this, so the backend uses `axios` with `httpsAgent: new https.Agent({ rejectUnauthorized: false })` instead.

**Assistant prefill not supported:** The proxy returns a 400 error if the messages array ends with an assistant message. Do not use prefill.

---

## Key Technical Decisions

### TLS fix (`backend/server.js`)
```js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

### Claude call (`backend/services/claude.js`)
- Uses `axios` directly (not `@anthropic-ai/sdk`)
- `max_tokens: 8192` — 4096 caused truncation and invalid JSON
- `model: claude-opus-4-6`
- System prompt explicitly warns Claude that any character outside `{ }` will throw a SyntaxError — this stops markdown fences reliably
- JSON parser strips fences and extracts outermost `{ ... }` as fallback

### Performance
- Generation takes **~40–80 seconds** for typical documents via the proxy
- Socket timeout set to 300 seconds in `backend/server.js`
- Frontend axios timeout set to 210 seconds

---

## Project File Structure

```
OS Migration/
├── backend/
│   ├── server.js           # Express server, 5-min socket timeout
│   ├── .env                # API key + base URL
│   ├── routes/
│   │   ├── upload.js       # File upload + text extraction (PDF, DOCX, TXT, MD)
│   │   └── generate.js     # Calls Claude, returns plan JSON
│   └── services/
│       └── claude.js       # axios-based Claude API client
└── frontend/
    ├── vite.config.js      # Proxies /api/* to localhost:3001
    └── src/
        ├── App.jsx / App.css
        ├── index.css       # CSS variables (Deloitte theme)
        └── pages/
            ├── InputPage.jsx / InputPage.css
            └── ResultsPage.jsx / ResultsPage.css
```

---

## Deloitte Brand Theme

**Official Deloitte palette — green + black only (no navy, no blue).**

| Variable | Hex | Usage |
|---|---|---|
| `--d-green` | `#86BC24` | Buttons, CTAs, active states, section borders, roadmap markers |
| `--d-green-dark` | `#6a9a1c` | Hover state for green elements |
| `--d-green-lt` | `#f0f7e0` | Subtle green tint for highlighted rows/drop zones |
| `--d-black` | `#000000` | Header background, text, table headers |
| `--d-white` | `#ffffff` | Card surfaces, text on dark backgrounds |

**Theme:** Light (page background `#f2f2f2`, card surfaces `#ffffff`)

**Header:** Black background, Deloitte green `#86BC24` bottom border, white text, green active nav button with black text.

---

## Output Sections Generated

The AI generates a structured JSON plan with:
1. Project Summary (name, complexity, source tech)
2. Data Model (entities, attributes, relationships)
3. Architecture (modules by layer: End-User, Core, Foundation, Integration)
4. Screens & UI flows
5. Business Logic (Server Actions, Client Actions, Timers)
6. Integrations
7. Security (roles, auth method, sensitive data)
8. Roadmap (phases, tasks, deliverables, risks)
9. Recommendations

Export options: JSON download, TXT download.

---

## Test File

A working test file exists at:
```
C:\Users\mjelkic\OneDrive - Deloitte (O365D)\Desktop\Claude\OS Migration\claims_management_detailed.txt
```
This is a Claims Management Application spec. It generates successfully in ~75 seconds and produces 6 entities, 4 modules, 7 screens, and 5 roadmap phases.

---

## Known Issues & Fixes Applied

| Issue | Fix |
|---|---|
| TLS cert error on Deloitte network | `NODE_TLS_REJECT_UNAUTHORIZED=0` + custom `https.Agent` |
| Anthropic SDK ignores TLS flag | Replaced SDK with `axios` |
| Response timeout (~111s originally) | Reduced `max_tokens` 16000→8192, socket timeout 300s |
| Claude wraps JSON in markdown fences | System prompt warns of SyntaxError; parser strips fences as fallback |
| JSON truncated mid-response | Increased `max_tokens` from 4096 to 8192 |
| Proxy rejects assistant prefill | Removed prefill, stronger system prompt instead |
| Model `claude-haiku-4-5-20251001` returns 404 | Only `claude-opus-4-6` available on this proxy |
