# SaveIQ – AI Savings Goal Tracker

SaveIQ is an AI-powered personal finance management system developed using **Google Apps Script**, **Google Sheets**, and **Groq AI**.

---

## Project Structure

```
.
├── docs/
│   ├── problem_statement.md    # Core Problem Definition & 4 Scenarios
│   ├── architecture.md         # Detailed System Architecture & Schemas
│   ├── implementation_plan.md  # 6-Phase Roadmap & Milestones
│   ├── HANDOVER_GUIDE.md       # Production Handover & Admin Guide
│   └── README.md               # Quickstart & Repository Summary
├── src/                        # Google Apps Script Source Files
│   ├── appsscript.json         # Project Manifest & OAuth Permissions
│   ├── Config.js               # Global Configuration, Column Enums & Formulas
│   ├── Setup.js                # One-Click Database Provisioning & Audit
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
└── tests/                      # Local Verification Test Suite (179 Tests)
    ├── test_phase1.js          # Phase 1: Foundation & Database (24 tests)
    ├── test_phase2.js          # Phase 2: Goal Creation & UI (25 tests)
    ├── test_phase3.js          # Phase 3: Dashboard & Analytics (27 tests)
    ├── test_phase4.js          # Phase 4: Groq AI Advisory (27 tests)
    ├── test_phase5.js          # Phase 5: Auditing & Notifications (29 tests)
    └── test_phase6_e2e.js      # Phase 6: E2E Integration & Security (47 tests)
```

---

## Implementation Summary by Phase

- **Phase 1 (Foundation & Database):** Manifest with V8 runtime, OAuth scopes, 4 core sheets (`Dashboard`, `Goals`, `Audit_Logs`, `Config`), and dynamic formula templates.
- **Phase 2 (Goal CRUD & UI Modal - Scenario 1):** Responsive goal creation modal (`GoalModal.html`), real-time projection calculations, server-side validation, and atomic row insertion into `Goals`.
- **Phase 3 (Dashboard & Analytics - Scenario 4):** Real-time KPI cards, Category Breakdown table, in-cell sparklines, and embedded 3D Donut and Column charts.
- **Phase 4 (Groq AI Advisory - Scenario 2):** High-speed LLM financial reasoning using `llama-3.3-70b-versatile`, structured prompt payloads, in-sheet advisory dialog (`AIAdviceModal.html`), and rule-based heuristic fallbacks.
- **Phase 5 (Auditing & Notifications - Scenario 3):** Lifecycle state machine, transactional HTML email alerts (Approaching Deadline, Overdue, Completed), daily 08:00 AM time-driven cron trigger, and audit logging.
- **Phase 6 (Security Hardening & Handover):** Formula column protection warnings for Columns F, G, I, J, K (`SecurityService.js`), CSV/formula injection defense, Groq API cooldown throttling (1000ms), and production handover guide ([`docs/HANDOVER_GUIDE.md`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/docs/HANDOVER_GUIDE.md)).

---

## Deployment & Setup Guide

For full step-by-step production deployment and admin instructions, refer to [`docs/HANDOVER_GUIDE.md`](file:///c:/Users/HP/OneDrive/Desktop/New%20folder/docs/HANDOVER_GUIDE.md).

### Quick Deployment Steps:
1. Open [Google Sheets](https://sheets.new) and go to **Extensions > Apps Script**.
2. Copy files from `src/` to your Apps Script project.
3. Run `initializeSaveIQDatabase` in Apps Script and grant permissions.
4. In your spreadsheet, open **⚡ SaveIQ > 🔑 Configure Groq API Key** to enter your API key.
5. Click **⚡ SaveIQ > ⏰ Schedule Daily Audit (8 AM)** to activate automated morning reminders.
6. Click **⚡ SaveIQ > 🛡️ Protect Formula Columns** to shield automated formula columns from accidental edits.

---

## Automated Local Test Suites

Run all 6 test suites concurrently with Node.js:
```bash
node tests/test_phase1.js; node tests/test_phase2.js; node tests/test_phase3.js; node tests/test_phase4.js; node tests/test_phase5.js; node tests/test_phase6_e2e.js
```
**Test Results:** 179 / 179 Tests Passing (100% Pass Rate).
