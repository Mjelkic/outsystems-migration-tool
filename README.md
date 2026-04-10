# OutSystems Migration Tool

A full-stack web application that analyzes project documentation and generates a structured OutSystems migration plan using Claude AI.

---

## Prerequisites

Make sure the following are installed before proceeding:

- [Node.js](https://nodejs.org/) v18 or higher
- npm (bundled with Node.js)

---

## Project Structure

```
OS Migration/
├── backend/
│   ├── server.js
│   ├── .env                  ← API credentials (you must create this)
│   ├── .env.example          ← Template for .env
│   ├── routes/
│   │   ├── upload.js         ← File upload & text extraction
│   │   └── generate.js       ← Claude API call & plan generation
│   └── services/
│       └── claude.js         ← Axios-based Claude API client
└── frontend/
    ├── vite.config.js
    └── src/
        ├── App.jsx
        └── pages/
            ├── InputPage.jsx
            └── ResultsPage.jsx
```

---

## Setup

### 1. Configure the Backend Environment

The backend requires a `.env` file with your API credentials. A template is provided:

```bash
cd backend
copy .env.example .env
```

Then open `backend/.env` and fill in your values:

```
ANTHROPIC_API_KEY=cst-mjelkic-fe5be165
PORT=3001
```

> **Note:** This application uses the Deloitte corporate AI proxy (`cst-ai-proxy.azurewebsites.net`), not the standard Anthropic API. The API key format is `cst-...`, not `sk-ant-...`.

---

### 2. Install Dependencies

From the project root, install both backend and frontend dependencies in one command:

```bash
npm run install:all
```

Or install them separately:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Running the Application

The app requires two terminal windows running simultaneously.

### Terminal 1 — Start the Backend

```bash
cd backend
node server.js
```

You should see:
```
Server running on port 3001
```

### Terminal 2 — Start the Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
VITE ready in ...ms
Local: http://localhost:5173/
```

### Open in Browser

Navigate to: **http://localhost:5173**

---

## Using the Application

1. **Upload a document** — Drag and drop or select a file containing your project documentation.
   - Supported formats: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`
   - Max file size: 20 MB

2. **Generate the plan** — Click **Generate Migration Plan**. Processing takes approximately 40–80 seconds via the Deloitte AI proxy.

3. **Review the results** — The plan is broken into the following sections:
   - Project Summary
   - Data Model (entities, attributes, relationships)
   - Architecture (modules by layer)
   - Screens & UI Flows
   - Business Logic (Server Actions, Client Actions, Timers)
   - Integrations
   - Security (roles, auth, sensitive data)
   - Roadmap (phases, tasks, deliverables, risks)
   - Recommendations

4. **Export** — Download the plan as **JSON** or **TXT**.

---

## Test File

A working sample document is included for testing:

```
OS Migration/claims_management_detailed.txt
```

This is a Claims Management Application spec. It generates successfully in ~75 seconds and produces 6 entities, 4 modules, 7 screens, and 5 roadmap phases.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `ECONNREFUSED` on port 3001 | Backend is not running | Start the backend in Terminal 1 |
| Request times out after ~2 min | Long generation via proxy | Wait — timeout is set to 5 min |
| `400 Bad Request` from proxy | Invalid API key or model | Check `backend/.env` values |
| Blank or broken JSON output | Claude returned markdown fences | The parser handles this automatically — retry if it persists |
| TLS certificate error | Deloitte network TLS check | Already handled via `NODE_TLS_REJECT_UNAUTHORIZED=0` in `server.js` |

---

## Technical Notes

- The backend uses `axios` directly instead of the Anthropic SDK. The Deloitte corporate network blocks TLS certificate revocation checks, which the SDK cannot bypass. The `axios` client is configured with `rejectUnauthorized: false`.
- `max_tokens` is set to `8192`. Values below 4096 caused truncated, invalid JSON responses.
- The system prompt explicitly instructs Claude to return raw JSON only (no markdown fences), with a fallback parser that strips fences if they appear.
- The frontend proxies all `/api/*` requests to `localhost:3001` via `vite.config.js`.
