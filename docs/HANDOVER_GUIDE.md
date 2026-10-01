# SaveIQ – AI Savings Goal Tracker
## Production Handover & Operations Guide (`HANDOVER_GUIDE.md`)

---

## 1. Executive Summary

**SaveIQ** is a fully functional, enterprise-grade personal finance management and savings tracking system built entirely on a serverless, zero-maintenance infrastructure utilizing **Google Sheets**, **Google Apps Script (GAS)**, and **Groq Cloud AI**.

All six phases outlined in [`docs/implementation_plan.md`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/docs/implementation_plan.md) have been implemented, tested, and validated against the scenarios in [`docs/problem_statement.md`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/docs/problem_statement.md) and technical architecture in [`docs/architecture.md`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/docs/architecture.md).

---

## 2. Verification Against Definition of Done (DoD)

| Requirement / Milestone | Status | Verification Evidence |
| :--- | :---: | :--- |
| **Scenario 1: Savings Goal Creation** | ✅ **COMPLETE** | Interactive modal form (`src/UI/GoalModal.html`), real-time projection engine, server-side validation, and atomic row insertion into `Goals`. |
| **Scenario 2: AI Financial Recommendations** | ✅ **COMPLETE** | Groq Cloud LLM client (`llama-3.3-70b-versatile`), prompt engineering, in-sheet advisory modal (`src/UI/AIAdviceModal.html`), and rule-based heuristic fallback. |
| **Scenario 3: Automated Deadline Alerts** | ✅ **COMPLETE** | State machine lifecycle engine (`src/AuditService.js`), responsive HTML transactional emails (`src/NotificationService.js`), and daily 08:00 AM time-driven cron trigger. |
| **Scenario 4: Financial Dashboard Monitoring** | ✅ **COMPLETE** | Executive KPI cards, Category Breakdown table, live `SPARKLINE` progress bars, Donut & Column embedded charts (`src/DashboardService.js`). |
| **Security & Hardening** | ✅ **COMPLETE** | Formula column edit protection warnings (F, G, I, J, K), CSV/formula injection sanitization, API cooldown throttling, and daily email quota buffer guards (`src/SecurityService.js`). |
| **Test Coverage** | ✅ **COMPLETE** | **179 / 179 Automated Unit & E2E Tests Passing (100%)** across 6 independent test suites. |

---

## 3. System Architecture & File Catalog

```
SaveIQ/
├── docs/
│   ├── problem_statement.md    # Problem Definition & Functional Requirements
│   ├── architecture.md         # Detailed System Architecture, Schemas & Flows
│   ├── implementation_plan.md  # 6-Phase Roadmap & Milestones
│   ├── README.md               # Quickstart & Repository Summary
│   └── HANDOVER_GUIDE.md       # Production Handover & Admin Guide (This file)
├── src/                        # Google Apps Script Source Files
│   ├── appsscript.json         # Manifest, Runtime Settings & OAuth Scopes
│   ├── Config.js               # Global Configuration, Column Indices, Formulas & Enums
│   ├── Setup.js                # One-Click Database Provisioning & Phase Diagnostics
│   ├── SecurityService.js      # Formula Column Protection, Sanitization & Throttling
│   ├── GoalService.js          # Core Goal Management Service (CRUD, Validation)
│   ├── DashboardService.js     # Executive Analytics Dashboard & Native Charts
│   ├── AIService.js            # Groq Cloud LLM Integration & Financial Coaching
│   ├── NotificationService.js  # Transactional HTML Email Alerts Engine
│   ├── AuditService.js         # Automated Daily Background Cron & Lifecycle Engine
│   ├── Main.js                 # Workspace Menu Controller & Modal Router
│   └── UI/
│       ├── GoalModal.html      # Responsive Goal Creation Modal
│       ├── AIAdviceModal.html  # Interactive AI Financial Advice Dialog
│       └── Styles.html         # Modern Glassmorphic CSS Styling
└── tests/                      # Local Verification Test Suites (Node.js)
    ├── test_phase1.js          # Phase 1: Foundation & Database (24 tests)
    ├── test_phase2.js          # Phase 2: Goal Creation & UI (25 tests)
    ├── test_phase3.js          # Phase 3: Dashboard & Analytics (27 tests)
    ├── test_phase4.js          # Phase 4: Groq AI Advisory (27 tests)
    ├── test_phase5.js          # Phase 5: Auditing & Notifications (29 tests)
    └── test_phase6_e2e.js      # Phase 6: E2E Integration & Security (47 tests)
```

---

## 4. Production Deployment Walkthrough

Deploying SaveIQ to Google Sheets requires **zero software installation** and takes less than 3 minutes:

### Step 1: Create Spreadsheet
1. Open [Google Sheets](https://sheets.new) in your browser.
2. Rename the sheet to **SaveIQ – AI Savings Goal Tracker**.

### Step 2: Open Apps Script Editor
1. In the top menu, navigate to **Extensions > Apps Script**.
2. Click the gear icon (**Project Settings** ⚙️) on the left sidebar.
3. Check the box: `Show "appsscript.json" manifest file in editor`.

### Step 3: Copy Source Code
Create the following files in the Apps Script editor and copy the corresponding code from the `src/` directory:

| Apps Script File | File Type | Source Path in Repo |
| :--- | :--- | :--- |
| `appsscript.json` | JSON | [`src/appsscript.json`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/appsscript.json) |
| `Config.gs` | Script | [`src/Config.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/Config.js) |
| `Setup.gs` | Script | [`src/Setup.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/Setup.js) |
| `SecurityService.gs` | Script | [`src/SecurityService.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/SecurityService.js) |
| `GoalService.gs` | Script | [`src/GoalService.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/GoalService.js) |
| `DashboardService.gs` | Script | [`src/DashboardService.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/DashboardService.js) |
| `AIService.gs` | Script | [`src/AIService.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/AIService.js) |
| `NotificationService.gs`| Script | [`src/NotificationService.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/NotificationService.js) |
| `AuditService.gs` | Script | [`src/AuditService.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/AuditService.js) |
| `Main.gs` | Script | [`src/Main.js`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/Main.js) |
| `UI/Styles.html` | HTML | [`src/UI/Styles.html`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/UI/Styles.html) |
| `UI/GoalModal.html` | HTML | [`src/UI/GoalModal.html`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/UI/GoalModal.html) |
| `UI/AIAdviceModal.html` | HTML | [`src/UI/AIAdviceModal.html`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/src/UI/AIAdviceModal.html) |

### Step 4: Run Database Initialization
1. In the function dropdown, select `initializeSaveIQDatabase` and click **Run**.
2. Click **Review Permissions** when prompted, select your Google account, and grant the necessary Workspace permissions.
3. Switch back to your Google Sheet — the **Dashboard**, **Goals**, **Audit_Logs**, and **Config** sheets will now be fully active with styled headers, sample data, and embedded charts.

---

## 5. Operations & Admin Quick Reference

Once deployed, all day-to-day operations are handled directly from the custom **`⚡ SaveIQ`** menu inside your Google Sheet toolbar:

```
⚡ SaveIQ
├── ➕ Add New Savings Goal        -> Opens interactive goal creation modal
├── 📊 Refresh Dashboard           -> Recalculates metrics and updates visual charts
├── 🤖 Get AI Financial Advice     -> Generates Groq LLM coaching for selected goal
├── 🔑 Configure Groq API Key       -> Dialog to set or rotate your Groq Cloud API key
├── --------------------------
├── ⏱️ Run Daily Audit Now         -> Executes on-demand deadline audit and dispatches emails
├── ⏰ Schedule Daily Audit (8 AM) -> Toggles automated background daily cron trigger
├── --------------------------
├── 🛡️ Protect Formula Columns     -> Locks formula columns with edit warnings
├── ⚙️ Initialize / Reset Database  -> Resets schemas and provisions tables
└── 🔍 Verify Phase Setup          -> Comprehensive diagnostic health audit across all 6 phases
```

---

## 6. Security, Rate Limits & Quotas Reference

- **Groq API Key:**
  - Obtain your free API key at [Groq Console](https://console.groq.com).
  - Stored securely in Google Apps Script `PropertiesService` (isolated from spreadsheet viewers and cell contents).
  - Includes automated 1000ms cooldown protection to prevent HTTP 429 rate limit exceptions.
- **Formula Column Protection:**
  - Running `⚡ SaveIQ > 🛡️ Protect Formula Columns` protects Columns F, G, I, J, and K with warning shields so users do not accidentally delete automated spreadsheet formulas.
- **Google Workspace Email Quotas:**
  - Free personal `@gmail.com` accounts: 100 emails/day.
  - Google Workspace business/education accounts: 1,500 emails/day.
  - Built-in quota protection checks `MailApp.getRemainingDailyQuota()` and skips non-critical alerts if the buffer threshold (< 5 remaining) is reached.

---

## 7. Local Test Suite Execution

All test suites can be executed locally in any terminal using Node.js:

```bash
# Execute all 6 test suites concurrently
node tests/test_phase1.js; node tests/test_phase2.js; node tests/test_phase3.js; node tests/test_phase4.js; node tests/test_phase5.js; node tests/test_phase6_e2e.js
```

### Complete Test Results Output
- **Phase 1 (Foundation & Schema):** 24 / 24 PASSED
- **Phase 2 (Goal CRUD & UI Modal):** 25 / 25 PASSED
- **Phase 3 (Dashboard & Native Charts):** 27 / 27 PASSED
- **Phase 4 (Groq AI Advisory Engine):** 27 / 27 PASSED
- **Phase 5 (Auditing & Notifications):** 29 / 29 PASSED
- **Phase 6 (E2E Integration & Security):** 47 / 47 PASSED
- **Total: 179 / 179 Tests Passing (100% Pass Rate)**
