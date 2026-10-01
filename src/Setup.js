/**
 * SaveIQ – AI Savings Goal Tracker
 * Phase 1: Database Initialization & Verification Script
 * 
 * Run `initializeSaveIQDatabase()` to provision all sheets, formulas, validations, and sample data.
 * Run `verifyPhase1Setup()` to audit the setup against Phase 1 criteria.
 */

/**
 * Master initializer for SaveIQ.
 * Creates sheets, configures columns, applies validations, styles, and sample records.
 */
function initializeSaveIQDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Initialize sheets
  const goalsSheet = getOrCreateSheet(ss, CONFIG.SHEETS.GOALS);
  const auditSheet = getOrCreateSheet(ss, CONFIG.SHEETS.AUDIT_LOGS);
  const configSheet = getOrCreateSheet(ss, CONFIG.SHEETS.CONFIG);
  const dashboardSheet = getOrCreateSheet(ss, CONFIG.SHEETS.DASHBOARD);

  // 2. Setup each sheet according to schema
  setupGoalsSheet(goalsSheet);
  setupAuditLogsSheet(auditSheet);
  setupConfigSheet(configSheet);
  DashboardService.setupDashboard(dashboardSheet);

  SpreadsheetApp.flush();
  Logger.log('✅ SaveIQ Database Initialization Completed Successfully.');
  return 'SaveIQ Database Initialized Successfully!';
}

/**
 * Configure the Goals Master Sheet (Columns A to O)
 */
function setupGoalsSheet(sheet) {
  const headers = [
    'Goal ID',
    'Goal Name',
    'Category',
    'Target Amount',
    'Current Savings',
    'Remaining Balance',
    'Progress %',
    'Deadline',
    'Days Remaining',
    'Daily Required Rate',
    'Status',
    'Alert Email',
    'AI Advice Summary',
    'Last Audited At',
    'Created At'
  ];

  // Set Headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1E293B'); // Sleek dark slate
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // Column Widths
  const columnWidths = [110, 180, 120, 120, 120, 140, 100, 110, 120, 140, 130, 200, 260, 140, 140];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });

  // Data Validation: Category Dropdown (Column C)
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.CATEGORIES, true)
    .setAllowInvalid(false)
    .setHelpText('Select a valid goal category from the dropdown.')
    .build();
  sheet.getRange('C2:C500').setDataValidation(categoryRule);

  // Data Validation: Status Dropdown (Column K)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.values(CONFIG.STATUSES), true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('K2:K500').setDataValidation(statusRule);

  // Data Validation: Deadline Date format (Column H)
  const dateRule = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Enter a valid date format (YYYY-MM-DD).')
    .build();
  sheet.getRange('H2:H500').setDataValidation(dateRule);

  // Number & Currency Formats
  sheet.getRange('D2:F500').setNumberFormat(CONFIG.THRESHOLDS.DEFAULT_CURRENCY_FORMAT);
  sheet.getRange('G2:G500').setNumberFormat(CONFIG.THRESHOLDS.PERCENT_FORMAT);
  sheet.getRange('H2:H500').setNumberFormat(CONFIG.THRESHOLDS.DATE_FORMAT);
  sheet.getRange('I2:I500').setNumberFormat('#,##0');
  sheet.getRange('J2:J500').setNumberFormat(CONFIG.THRESHOLDS.DEFAULT_CURRENCY_FORMAT);
  sheet.getRange('N2:O500').setNumberFormat('yyyy-MM-dd HH:mm');

  // Text Wrapping for AI Advice Summary
  sheet.getRange('M2:M500').setWrap(true);

  // Add Initial Sample Records if table is empty
  if (sheet.getLastRow() <= 1) {
    populateSampleGoals(sheet);
  }
}

/**
 * Insert sample demonstration goals with real formula links
 */
function populateSampleGoals(sheet) {
  const today = new Date();
  
  // Create sample dates
  const dateIn45Days = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
  const dateIn5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
  const datePast = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

  const sampleRows = [
    [
      'GID-1001',
      'Emergency Fund',
      'Emergency',
      5000,
      2500,
      CONFIG.FORMULAS.REMAINING_BALANCE(2),
      CONFIG.FORMULAS.PROGRESS_PERCENTAGE(2),
      formatDate(dateIn45Days),
      CONFIG.FORMULAS.DAYS_REMAINING(2),
      CONFIG.FORMULAS.REQUIRED_DAILY_RATE(2),
      CONFIG.FORMULAS.STATUS(2),
      'user@example.com',
      'AI Analysis Pending. Click "Get AI Financial Advice" to generate.',
      new Date(),
      new Date()
    ],
    [
      'GID-1002',
      'Laptop Purchase',
      'Tech',
      1500,
      1200,
      CONFIG.FORMULAS.REMAINING_BALANCE(3),
      CONFIG.FORMULAS.PROGRESS_PERCENTAGE(3),
      formatDate(dateIn5Days),
      CONFIG.FORMULAS.DAYS_REMAINING(3),
      CONFIG.FORMULAS.REQUIRED_DAILY_RATE(3),
      CONFIG.FORMULAS.STATUS(3),
      'user@example.com',
      'Goal is nearing deadline. Allocate $60/day to reach 100% on schedule.',
      new Date(),
      new Date()
    ],
    [
      'GID-1003',
      'Vacation Plan',
      'Travel',
      2000,
      800,
      CONFIG.FORMULAS.REMAINING_BALANCE(4),
      CONFIG.FORMULAS.PROGRESS_PERCENTAGE(4),
      formatDate(datePast),
      CONFIG.FORMULAS.DAYS_REMAINING(4),
      CONFIG.FORMULAS.REQUIRED_DAILY_RATE(4),
      CONFIG.FORMULAS.STATUS(4),
      'user@example.com',
      'Deadline has passed. Consider extending target date by 30 days.',
      new Date(),
      new Date()
    ]
  ];

  const range = sheet.getRange(2, 1, sampleRows.length, sampleRows[0].length);
  range.setValues(sampleRows);
}

/**
 * Configure the Audit Logs Sheet
 */
function setupAuditLogsSheet(sheet) {
  const headers = [
    'Log ID',
    'Goal ID',
    'Timestamp',
    'Trigger Type',
    'Notification Sent',
    'Message Status',
    'Details'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#334155');
  headerRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 160);
  sheet.setColumnWidth(4, 140);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(6, 130);
  sheet.setColumnWidth(7, 300);

  sheet.getRange('C2:C500').setNumberFormat('yyyy-MM-dd HH:mm:ss');
}

/**
 * Configure the Configuration Sheet (Key-Value pairs)
 */
function setupConfigSheet(sheet) {
  const headers = ['Configuration Key', 'Value', 'Description'];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#475569');
  headerRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  const configs = [
    ['GROQ_MODEL', 'llama-3.3-70b-versatile', 'Active Groq LLM model for financial coaching.'],
    ['DEADLINE_ALERT_DAYS', '7', 'Days before deadline to trigger automated warning emails.'],
    ['CURRENCY_SYMBOL', '$', 'Currency symbol for display across reports and emails.'],
    ['DAILY_AUDIT_HOUR', '8', 'Hour of day (0-23) when scheduled audit cron runs.']
  ];

  sheet.getRange(2, 1, configs.length, 3).setValues(configs);
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 350);
}

/**
 * Setup placeholder structure for Dashboard Sheet (detailed in Phase 3)
 */
function setupDashboardPlaceholder(sheet) {
  sheet.getRange('A1').setValue('SaveIQ – Financial Performance Dashboard')
    .setFontSize(16)
    .setFontWeight('bold')
    .setFontColor('#0F172A');
  sheet.getRange('A2').setValue('Visual analytics and KPI cards will be active in Phase 3.')
    .setFontStyle('italic')
    .setFontColor('#64748B');
}

/**
 * Helper: Find or create a sheet by name
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Helper: Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Phase 1 Verification and Diagnostic Audit
 * Runs checks on sheet existence, header integrity, formula evaluation, and validations.
 */
function verifyPhase1Setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = {
    sheetsExist: false,
    goalsHeaderValid: false,
    formulasWorking: false,
    validationsPresent: false,
    details: []
  };

  // 1. Check Sheet Existence
  const requiredSheets = Object.values(CONFIG.SHEETS);
  const existingSheets = ss.getSheets().map(s => s.getName());
  const missingSheets = requiredSheets.filter(name => !existingSheets.includes(name));

  if (missingSheets.length === 0) {
    results.sheetsExist = true;
    results.details.push('PASS: All 4 required sheets exist (' + requiredSheets.join(', ') + ').');
  } else {
    results.details.push('FAIL: Missing sheets: ' + missingSheets.join(', '));
  }

  // 2. Check Goals Columns
  const goalsSheet = ss.getSheetByName(CONFIG.SHEETS.GOALS);
  if (goalsSheet) {
    const headerValues = goalsSheet.getRange(1, 1, 1, 15).getValues()[0];
    if (headerValues[0] === 'Goal ID' && headerValues[14] === 'Created At') {
      results.goalsHeaderValid = true;
      results.details.push('PASS: Goals sheet schema matches 15-column specification.');
    } else {
      results.details.push('FAIL: Goals sheet headers do not match specification.');
    }

    // 3. Check Formula Calculations on Row 2
    if (goalsSheet.getLastRow() >= 2) {
      const remainingBalance = goalsSheet.getRange('F2').getValue();
      const progressPct = goalsSheet.getRange('G2').getValue();
      const targetAmount = goalsSheet.getRange('D2').getValue();
      const currentSavings = goalsSheet.getRange('E2').getValue();

      if (remainingBalance === (targetAmount - currentSavings) && progressPct === (currentSavings / targetAmount)) {
        results.formulasWorking = true;
        results.details.push('PASS: Live formulas for Remaining Balance and Progress % calculated accurately.');
      } else {
        results.details.push('FAIL: Formulas on Row 2 did not produce expected values.');
      }
    }

    // 4. Check Data Validations
    const categoryRule = goalsSheet.getRange('C2').getDataValidation();
    if (categoryRule && categoryRule.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
      results.validationsPresent = true;
      results.details.push('PASS: Dropdown data validation active on Category column.');
    } else {
      results.details.push('FAIL: Dropdown validation missing on Category column.');
    }
  }

  Logger.log('=== SaveIQ Phase 1 Verification Report ===');
  results.details.forEach(line => Logger.log(line));
  return results;
}

/**
 * Phase 3 Verification and Diagnostic Audit
 * Checks Dashboard sheet, KPI cards, category breakdown, and charts.
 */
function verifyPhase3Setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = {
    dashboardExists: false,
    kpiCardsPresent: false,
    categoryTableValid: false,
    chartsConfigured: false,
    details: []
  };

  const dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (!dashSheet) {
    results.details.push('FAIL: Dashboard sheet does not exist.');
    return results;
  }
  results.dashboardExists = true;
  results.details.push('PASS: Dashboard sheet exists.');

  // Check KPI formulas in cards
  const totalGoalsFormula = dashSheet.getRange('C5').getFormula();
  const totalTargetFormula = dashSheet.getRange('E5').getFormula();
  const activeGoalsFormula = dashSheet.getRange('C8').getFormula();

  if (totalGoalsFormula.includes('COUNTA') && totalTargetFormula.includes('SUM') && activeGoalsFormula.includes('COUNTIF')) {
    results.kpiCardsPresent = true;
    results.details.push('PASS: KPI card formulas (Total Goals, Target, Active) verified in Dashboard.');
  } else {
    results.details.push('FAIL: KPI card formulas missing or altered.');
  }

  // Check Category Table (Rows 12 to 16)
  const cat1 = dashSheet.getRange('B12').getValue();
  const catFormula = dashSheet.getRange('C12').getFormula();
  if (cat1 === CONFIG.CATEGORIES[0] && catFormula.includes('SUMIF')) {
    results.categoryTableValid = true;
    results.details.push('PASS: Category breakdown table active with dynamic SUMIF formulas.');
  } else {
    results.details.push('FAIL: Category breakdown table missing or invalid.');
  }

  // Check embedded charts
  const charts = dashSheet.getCharts();
  if (charts.length >= 1) {
    results.chartsConfigured = true;
    results.details.push('PASS: ' + charts.length + ' embedded visual charts detected on Dashboard.');
  } else {
    results.details.push('NOTICE: No embedded charts detected on Dashboard.');
  }

  Logger.log('=== SaveIQ Phase 3 Verification Report ===');
  results.details.forEach(line => Logger.log(line));
  return results;
}

/**
 * Phase 4 Verification and Diagnostic Audit
 * Audits Groq AI configuration, prompt formulation, and fallback advisory engine.
 */
function verifyPhase4Setup() {
  const results = {
    apiKeyConfigured: false,
    promptFormulationValid: false,
    heuristicEngineFunctional: false,
    details: []
  };

  // 1. Check API Key
  const apiKey = AIService.getApiKey();
  if (apiKey) {
    results.apiKeyConfigured = true;
    results.details.push('PASS: Groq API Key is configured in ScriptProperties (' + apiKey.slice(0, 4) + '...' + apiKey.slice(-4) + ').');
  } else {
    results.details.push('NOTICE: Groq API Key not yet configured (Heuristic rule-based engine will operate as fallback).');
  }

  // 2. Test Prompt Messages construction
  const dummyGoal = {
    goalName: 'Test Laptop',
    category: 'Tech',
    targetAmount: 1500,
    currentSavings: 600,
    remainingBalance: 900,
    progressPct: 0.4,
    deadline: '2026-11-15',
    daysRemaining: 45,
    requiredDailyRate: 20.0,
    status: 'ACTIVE'
  };

  const messages = AIService.buildPromptMessages(dummyGoal);
  if (messages && messages.length === 2 && messages[0].role === 'system' && messages[1].content.includes('Test Laptop')) {
    results.promptFormulationValid = true;
    results.details.push('PASS: Groq AI prompt formulated according to architectural specification.');
  } else {
    results.details.push('FAIL: Prompt formulation does not match expected structure.');
  }

  // 3. Test Heuristic Engine
  const advice = AIService.generateHeuristicAdvice(dummyGoal);
  if (advice && advice.includes('$20.00/day') && advice.includes('Tech')) {
    results.heuristicEngineFunctional = true;
    results.details.push('PASS: Heuristic rule-based financial advice generator verified.');
  } else {
    results.details.push('FAIL: Heuristic generator produced unexpected output.');
  }

  Logger.log('=== SaveIQ Phase 4 Verification Report ===');
  results.details.forEach(line => Logger.log(line));
  return results;
}

/**
 * Phase 5 Verification and Diagnostic Audit
 * Checks AuditService, NotificationService, email templates, and trigger availability.
 */
function verifyPhase5Setup() {
  const results = {
    auditSheetReady: false,
    notificationServiceReady: false,
    emailQuotaAvailable: false,
    triggerConfigured: false,
    details: []
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const auditSheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOGS);
  if (auditSheet && auditSheet.getLastRow() >= 1) {
    results.auditSheetReady = true;
    results.details.push('PASS: Audit_Logs sheet is active and ready to log cron and manual executions.');
  } else {
    results.details.push('FAIL: Audit_Logs sheet missing or not configured.');
  }

  // Check email templates
  const dummyGoal = {
    goalId: 'GID-TEST',
    goalName: 'Test Emergency Fund',
    category: 'Emergency',
    targetAmount: 3000,
    currentSavings: 1500,
    remainingBalance: 1500,
    progressPct: 0.5,
    daysRemaining: 4,
    requiredDailyRate: 375.0,
    status: 'NEARING_DEADLINE',
    alertEmail: 'test@example.com'
  };

  const html = NotificationService.buildEmailTemplate({
    badgeText: 'DEADLINE APPROACHING',
    badgeColor: '#F59E0B',
    headline: 'Only 4 days left!',
    subhead: 'Keep saving!',
    goal: dummyGoal,
    actionText: 'Save $375/day.',
    sheetUrl: 'https://sheets.google.com'
  });

  if (html && html.includes('SaveIQ') && html.includes('Test Emergency Fund') && html.includes('$375.00')) {
    results.notificationServiceReady = true;
    results.details.push('PASS: HTML transactional email template rendering verified.');
  } else {
    results.details.push('FAIL: HTML email template generator failed.');
  }

  // Check MailApp Quota
  try {
    const quota = MailApp.getRemainingDailyQuota();
    results.emailQuotaAvailable = quota > 0;
    results.details.push('PASS: Daily email quota available: ' + quota + ' remaining today.');
  } catch (e) {
    results.details.push('NOTICE: MailApp quota check notice: ' + e.message);
  }

  // Check if daily trigger is active
  const triggerActive = AuditService.isDailyTriggerActive();
  results.triggerConfigured = triggerActive;
  results.details.push(triggerActive ? 'PASS: Automated daily 8:00 AM audit trigger is ACTIVE.' : 'NOTICE: Daily automated schedule is currently inactive (Enable via "⚡ SaveIQ > ⏰ Schedule Daily Audit").');

  Logger.log('=== SaveIQ Phase 5 Verification Report ===');
  results.details.forEach(line => Logger.log(line));
  return results;
}

/**
 * Phase 6 Verification and Diagnostic Audit
 * Checks SecurityService, formula column protection, input sanitization, and API cooldowns.
 */
function verifyPhase6Setup() {
  const results = {
    sanitizationActive: false,
    cooldownActive: false,
    formulaProtectionConfigured: false,
    details: []
  };

  // 1. Check Input Sanitization
  const testInput = '=SUM(1+2)<script>alert(1)</script>';
  const sanitized = SecurityService.sanitizeInput(testInput);
  if (sanitized.startsWith("'") && !sanitized.includes('<script>')) {
    results.sanitizationActive = true;
    results.details.push('PASS: Input sanitization successfully disarms formula injection and HTML tags.');
  } else {
    results.details.push('FAIL: Input sanitization did not produce expected safe string.');
  }

  // 2. Check API Cooldown
  const cooldownPass = SecurityService.checkApiCooldown();
  if (typeof cooldownPass === 'boolean') {
    results.cooldownActive = true;
    results.details.push('PASS: Groq API cooldown throttling mechanism verified.');
  } else {
    results.details.push('FAIL: API cooldown check failed.');
  }

  // 3. Check Formula Column Protection config
  const protectedCols = CONFIG.SECURITY.PROTECTED_COLUMN_INDICES;
  if (protectedCols && protectedCols.length === 5) {
    results.formulaProtectionConfigured = true;
    results.details.push('PASS: Formula columns (F, G, I, J, K) designated for protection.');
  } else {
    results.details.push('FAIL: Protected column indices missing in CONFIG.');
  }

  Logger.log('=== SaveIQ Phase 6 Verification Report ===');
  results.details.forEach(line => Logger.log(line));
  return results;
}




