# ⚡ FinHealth – SaveIQ: AI Savings Goal Tracker & Analytics Dashboard

[![Tests](https://img.shields.io/badge/tests-179%20passed%20(100%25)-success)](file:///tests)
[![AI Engine](https://img.shields.io/badge/Groq%20AI-llama--3.3--70b--versatile-orange)](https://console.groq.com)
[![Platform](https://img.shields.io/badge/Platform-Google%20Sheets%20%7C%20Apps%20Script%20%7C%20Web-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SaveIQ** is an enterprise-grade personal finance and automated savings management platform. It bridges cloud-based spreadsheet persistence with real-time generative AI intelligence powered by **Groq Cloud (Llama 3.3 70B)** and a standalone modern web dashboard preview.

---

## 🌟 Key Highlights & Capabilities

### 1. 🎯 Dynamic Savings Goal Engine (Scenario 1)
- **Atomic Goal Ingestion**: Auto-generates unique IDs (`GID-XXXX`), validates target amounts, and prevents deadline discrepancies.
- **Dynamic Formula Injection**: Automates live calculations for **Remaining Balance**, **Progress %**, **Days Remaining**, **Required Daily Savings Rate**, and **Status**.
- **Interactive Modals**: Sleek, glassmorphic UI with real-time projection previews before saving.

### 2. 🧠 Groq AI Intelligent Financial Advisory (Scenario 2)
- **High-Speed Inference**: Connects to Groq Cloud's LPU architecture using `llama-3.3-70b-versatile` (or `llama-3.1-8b-instant`).
- **Contextual Coaching**: Ingests goal metadata, category nuances (e.g. *Emergency*, *Tech*, *Travel*, *Education*, *Lifestyle*), and deadline pressure to deliver high-impact, realistic budgeting tweaks.
- **Resilient Fallback**: Built-in deterministic rule-based heuristic engine when offline or if no API key is configured.

### 3. ⏱️ Automated Daily Audit & Transactional Alerts (Scenario 3)
- **State Machine Transitions**: Transitions goal lifecycle across `ACTIVE`, `NEARING_DEADLINE` (<= 7 days), `COMPLETED` (100%), and `OVERDUE`.
- **Responsive HTML Emails**: Automatically dispatches styled transactional alerts highlighting deadlines, daily targets, and AI coaching.
- **Quota Buffer Defense**: Monitors daily email quotas to preserve transactional delivery.
- **Audit Trails**: Appends chronological execution logs to `Audit_Logs` sheet.

### 4. 📊 Executive Analytics & KPI Dashboard (Scenario 4)
- **KPI Summary Grid**: Total Goals, Target Capital, Total Saved, Portfolio Velocity, Active/Completed/Overdue counters.
- **Visual Analytics**: Interactive doughnut and category distribution charts (Chart.js / Native Google Sheets 3D charts).
- **In-Cell Sparklines**: Visual progress bars embedded directly into spreadsheet cells.

### 5. 🛡️ Security Hardening & Formula Protection
- **Formula Column Locking**: Protects calculated columns (**Columns F, G, I, J, K**) from accidental user edits.
- **CSV / Formula Injection Shield**: Disarms malicious formula prefixes (`=`, `+`, `-`, `@`) upon user input.
- **API Cooldown Throttling**: 1,000ms debounce protection against runaway API execution.

---

## 📂 Repository Architecture

```
.
├── index.html                  # Standalone interactive web dashboard preview
├── server.js                   # Node.js web server with live Groq AI proxy
├── package.json                # Project configuration and test scripts
├── .gitignore                  # Production Git ignore filter
├── docs/                       # Technical Specifications & Documentation
│   ├── problem_statement.md    # Problem statement & scenario requirements
│   ├── architecture.md         # Full system architecture, schemas & formulas
│   ├── implementation_plan.md  # 6-phase engineering roadmap
│   ├── HANDOVER_GUIDE.md       # Step-by-step production deployment & admin guide
│   └── README.md               # Architecture documentation summary
├── src/                        # Google Apps Script Production Source Code
│   ├── appsscript.json         # Apps Script Manifest & OAuth permission scopes
│   ├── Config.js               # Global schema definitions, column enums & formulas
│   ├── Setup.js                # One-click automated database initialization
│   ├── SecurityService.js      # Formula column protection & input sanitization
│   ├── GoalService.js          # Core CRUD operations & atomic row insertion
│   ├── DashboardService.js     # Executive KPI cards & native spreadsheet charts
│   ├── AIService.js            # Groq Cloud API client & prompt engineering
│   ├── NotificationService.js  # Transactional HTML email alert generator
│   ├── AuditService.js         # Daily cron trigger & state machine auditor
│   ├── Main.js                 # Workspace custom menu (⚡ SaveIQ) & modal router
│   └── UI/
│       ├── GoalModal.html      # Create Goal dialog modal
│       ├── AIAdviceModal.html  # Groq AI advice dialog modal
│       └── Styles.html         # Modern design system & glassmorphic styling
└── tests/                      # Local Verification Test Suites (179 Tests)
    ├── test_phase1.js          # Database schemas & formula templates (24 tests)
    ├── test_phase2.js          # Goal CRUD & validation (25 tests)
    ├── test_phase3.js          # KPI math & category aggregation (27 tests)
    ├── test_phase4.js          # Groq prompt formatting & heuristics (27 tests)
    ├── test_phase5.js          # Cron auditing, email alerts & quotas (29 tests)
    └── test_phase6_e2e.js      # End-to-end integration & security hardening (47 tests)
```

---

## 🚀 Quick Start (Local Web Dashboard)

Experience the live SaveIQ application locally with zero setup:

```bash
# 1. Start the native web application server
node server.js
```

Open your browser to:
👉 **`http://localhost:3000`**

### Live Features Available in the Web App:
- **Interactive KPI Cards & Charts**: Real-time savings portfolio metrics.
- **➕ Add New Goal**: Instant calculation of required daily savings velocity.
- **🔑 API Key Configuration**: Test and save your Groq API key with 1 click.
- **🤖 AI Financial Advisor**: Generate live financial advice powered by `llama-3.3-70b-versatile`.
- **⏱️ Daily Audit Simulator**: Run simulated 8:00 AM cron audits and preview transactional HTML email notifications.

---

## 🔑 Groq Cloud API Key Setup

Groq API keys are **100% free** and take under 30 seconds to generate:
1. Visit [console.groq.com/keys](https://console.groq.com/keys) and sign up / log in.
2. Click **Create API Key** and copy your `gsk_...` key.

### To use in the Web App:
- Click the **`🔑 API Key`** button in the top navigation bar at `http://localhost:3000`.
- Paste your key and click **🧪 Test Connection** > **💾 Save API Key**.
- *(Optional)* Set in `.env`: `GROQ_API_KEY=gsk_your_key_here`.

### To use in Google Sheets:
- In your Google Spreadsheet menu, click **`⚡ SaveIQ` > `🔑 Configure Groq API Key`**.
- Paste your key and click **OK** (safely encrypted in `PropertiesService`).

---

## 📑 Google Sheets Production Deployment

For complete instructions with screenshots and administrative configuration, see [docs/HANDOVER_GUIDE.md](docs/HANDOVER_GUIDE.md).

1. Create a new Google Spreadsheet at [sheets.new](https://sheets.new).
2. Go to **Extensions > Apps Script**.
3. Copy all files from [`src/`](src/) into the Apps Script editor.
4. Select `initializeSaveIQDatabase` in the function dropdown and click **Run**.
5. Grant the necessary Google Workspace authorization scopes.
6. Return to your spreadsheet — the custom **`⚡ SaveIQ`** menu will appear:
   - Click **`⚡ SaveIQ > 🔑 Configure Groq API Key`** to link your AI key.
   - Click **`⚡ SaveIQ > ⏰ Schedule Daily Audit (8 AM)`** to set up morning notifications.
   - Click **`⚡ SaveIQ > 🛡️ Protect Formula Columns`** to lock automated calculations.

---

## 🧪 Automated Test Suite

All 6 phases are backed by comprehensive automated test suites:

```bash
# Run End-to-End integration test
node tests/test_phase6_e2e.js

# Run all test suites
npm run test:all
```

**Results:** `179 / 179 tests passing (100% pass rate)`.

---

## 📄 License

This project is licensed under the MIT License.
