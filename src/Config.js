/**
 * SaveIQ – AI Savings Goal Tracker
 * Global Configuration and Schema Definitions
 */

const CONFIG = {
  // Sheet Names
  SHEETS: {
    DASHBOARD: 'Dashboard',
    GOALS: 'Goals',
    AUDIT_LOGS: 'Audit_Logs',
    CONFIG: 'Config'
  },

  // Goals Table Column Mapping (1-indexed for SpreadsheetApp, A through O)
  GOALS_COLUMNS: {
    GOAL_ID: 1,           // Col A
    GOAL_NAME: 2,         // Col B
    PURPOSE_CATEGORY: 3,  // Col C
    TARGET_AMOUNT: 4,     // Col D
    CURRENT_SAVINGS: 5,   // Col E
    REMAINING_BALANCE: 6, // Col F
    PROGRESS_PCT: 7,      // Col G
    DEADLINE: 8,          // Col H
    DAYS_REMAINING: 9,    // Col I
    REQUIRED_DAILY_RATE: 10, // Col J
    STATUS: 11,           // Col K
    ALERT_EMAIL: 12,      // Col L
    AI_ADVICE_SUMMARY: 13,// Col M
    LAST_AUDITED_AT: 14,  // Col N
    CREATED_AT: 15        // Col O
  },

  // Audit Logs Column Mapping
  AUDIT_LOGS_COLUMNS: {
    LOG_ID: 1,            // Col A
    GOAL_ID: 2,           // Col B
    TIMESTAMP: 3,         // Col C
    TRIGGER_TYPE: 4,      // Col D
    NOTIFICATION_SENT: 5, // Col E
    MESSAGE_STATUS: 6,    // Col F
    DETAILS: 7            // Col G
  },

  // Purpose Categories
  CATEGORIES: [
    'Emergency',
    'Tech',
    'Travel',
    'Education',
    'Lifestyle'
  ],

  // Goal Lifecycle Statuses
  STATUSES: {
    ACTIVE: 'ACTIVE',
    NEARING_DEADLINE: 'NEARING_DEADLINE',
    COMPLETED: 'COMPLETED',
    OVERDUE: 'OVERDUE'
  },

  // Thresholds & Defaults
  THRESHOLDS: {
    DAYS_NEARING_DEADLINE: 7,
    DEFAULT_CURRENCY_FORMAT: '$#,##0.00',
    PERCENT_FORMAT: '0.0%',
    DATE_FORMAT: 'yyyy-MM-dd'
  },

  // Formula Templates (for row index r)
  FORMULAS: {
    REMAINING_BALANCE: function(r) {
      return `=IF(D${r}>0, MAX(0, D${r}-E${r}), 0)`;
    },
    PROGRESS_PERCENTAGE: function(r) {
      return `=IF(D${r}>0, MIN(1, E${r}/D${r}), 0)`;
    },
    DAYS_REMAINING: function(r) {
      return `=IF(ISBLANK(H${r}), "", DATEDIF(TODAY(), H${r}, "D"))`;
    },
    REQUIRED_DAILY_RATE: function(r) {
      return `=IF(AND(ISNUMBER(I${r}), I${r}>0, F${r}>0), F${r}/I${r}, 0)`;
    },
    STATUS: function(r) {
      return `=IF(G${r}>=1, "COMPLETED", IF(OR(I${r}<0, ISERROR(I${r})), "OVERDUE", IF(I${r}<=7, "NEARING_DEADLINE", "ACTIVE")))`;
    }
  },

    // Dashboard Formula Templates
    DASHBOARD_FORMULAS: {
      TOTAL_GOALS: '=IFERROR(COUNTA(Goals!A2:A), 0)',
      TOTAL_TARGET: '=IFERROR(SUM(Goals!D2:D), 0)',
      TOTAL_SAVED: '=IFERROR(SUM(Goals!E2:E), 0)',
      OVERALL_PROGRESS: '=IF(D5>0, F5/D5, 0)',
      ACTIVE_GOALS: '=COUNTIF(Goals!K2:K, "ACTIVE") + COUNTIF(Goals!K2:K, "NEARING_DEADLINE")',
      COMPLETED_GOALS: '=COUNTIF(Goals!K2:K, "COMPLETED")',
      OVERDUE_GOALS: '=COUNTIF(Goals!K2:K, "OVERDUE")',
      TOTAL_DAILY_RATE: '=IFERROR(SUM(Goals!J2:J), 0)',
      CATEGORY_TARGET: function(categoryCell) {
        return `=SUMIF(Goals!$C$2:$C, ${categoryCell}, Goals!$D$2:$D)`;
      },
      CATEGORY_SAVED: function(categoryCell) {
        return `=SUMIF(Goals!$C$2:$C, ${categoryCell}, Goals!$E$2:$E)`;
      },
      CATEGORY_DEFICIT: function(targetCell, savedCell) {
        return `=MAX(0, ${targetCell}-${savedCell})`;
      },
      CATEGORY_PROGRESS: function(targetCell, savedCell) {
        return `=IF(${targetCell}>0, MIN(1, ${savedCell}/${targetCell}), 0)`;
      },
      CATEGORY_SPARKLINE: function(targetCell, savedCell) {
        return `=IF(${targetCell}>0, SPARKLINE(${savedCell}, {"charttype","bar";"max",${targetCell};"color1","#4F46E5"}), "-")`;
      }
    },

    // Groq AI Integration Defaults
    AI: {
      ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
      DEFAULT_MODEL: 'llama-3.3-70b-versatile',
      FALLBACK_MODEL: 'mixtral-8x7b-32768',
      MAX_TOKENS: 350,
      TEMPERATURE: 0.5
    },

    // Security, Protection & Rate Limiting Settings
    SECURITY: {
      PROTECTED_COLUMN_INDICES: [6, 7, 9, 10, 11], // F (Remaining), G (Progress), I (Days), J (Daily Rate), K (Status)
      MIN_API_COOLDOWN_MS: 1000,
      MAX_BATCH_AUDIT_GOALS: 100,
      MIN_DAILY_EMAIL_QUOTA_BUFFER: 5
    }
  };

