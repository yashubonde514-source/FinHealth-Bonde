/**
 * SaveIQ – AI Savings Goal Tracker
 * Main Controller, Menu System & Event Handlers
 */

/**
 * Standard trigger executed whenever the spreadsheet is opened.
 * Binds the custom SaveIQ navigation menu.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ SaveIQ')
    .addItem('➕ Add New Savings Goal', 'showAddGoalModal')
    .addItem('📊 Refresh Dashboard', 'refreshDashboard')
    .addItem('🤖 Get AI Financial Advice', 'promptAIAdvice')
    .addItem('🔑 Configure Groq API Key', 'promptConfigureGroqKey')
    .addSeparator()
    .addItem('⏱️ Run Daily Audit Now', 'runManualAudit')
    .addItem('⏰ Schedule Daily Audit (8 AM)', 'manageDailyTrigger')
    .addSeparator()
    .addItem('🛡️ Protect Formula Columns', 'protectSaveIQFormulas')
    .addItem('⚙️ Initialize / Reset Database', 'initializeSaveIQDatabase')
    .addItem('🔍 Verify Phase Setup', 'runVerificationDiagnostic')
    .addToUi();
}

/**
 * Opens the modern interactive modal dialog for goal creation
 */
function showAddGoalModal() {
  try {
    const template = HtmlService.createTemplateFromFile('UI/GoalModal');
    const htmlOutput = template.evaluate()
      .setWidth(540)
      .setHeight(640)
      .setTitle('SaveIQ – Create Savings Goal');

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'SaveIQ – Create Savings Goal');
  } catch (err) {
    Logger.log('Error opening modal: ' + err.toString());
    SpreadsheetApp.getUi().alert('Error opening Goal Creation modal: ' + err.message);
  }
}

/**
 * Opens the AI Financial Advice modal dialog
 * @param {string} [selectedGoalId] Optional goalId to preselect
 */
function showAIAdviceModal(selectedGoalId) {
  try {
    const template = HtmlService.createTemplateFromFile('UI/AIAdviceModal');
    template.preselectedGoalId = selectedGoalId || '';
    const htmlOutput = template.evaluate()
      .setWidth(560)
      .setHeight(680)
      .setTitle('SaveIQ – AI Financial Advice');

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'SaveIQ – AI Financial Advice');
  } catch (err) {
    Logger.log('Error opening AI Advice modal: ' + err.toString());
    SpreadsheetApp.getUi().alert('Error opening AI Advice modal: ' + err.message);
  }
}

/**
 * Menu action to launch AI Advice, automatically picking current row goal if selected
 */
function promptAIAdvice() {
  let goalId = '';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet && sheet.getName() === CONFIG.SHEETS.GOALS) {
    const activeRow = sheet.getActiveCell().getRow();
    if (activeRow >= 2) {
      goalId = sheet.getRange(activeRow, CONFIG.GOALS_COLUMNS.GOAL_ID).getValue();
    }
  }
  showAIAdviceModal(goalId);
}

/**
 * Interactive prompt to set or update the Groq API key securely
 */
function promptConfigureGroqKey() {
  const ui = SpreadsheetApp.getUi();
  const status = getStoredGroqApiKeyStatus();
  
  let promptText = 'Enter your Groq API Key (starts with gsk_...):\n\n';
  if (status.hasKey) {
    promptText += 'Current Key: ' + status.preview + '\n(Leave blank to keep existing key)';
  } else {
    promptText += 'No API key currently set. Get your key free at https://console.groq.com';
  }

  const response = ui.prompt('Configure Groq AI Key', promptText, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() === ui.Button.OK) {
    const inputKey = response.getResponseText().trim();
    if (inputKey.length > 0) {
      AIService.setApiKey(inputKey);
      ui.alert('Success', 'Groq API Key has been securely stored in ScriptProperties!', ui.ButtonSet.OK);
    }
  }
}

/**
 * Helper to include partial HTML files (e.g. Styles, scripts)
 * Used inside HTML templates as: <?!= include('UI/Styles'); ?>
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (err) {
    Logger.log('Warning: Could not include partial ' + filename + ': ' + err.message);
    return '<!-- include failed: ' + filename + ' -->';
  }
}

/**
 * User-facing diagnostic runner that executes verification and pops up an alert
 */
function runVerificationDiagnostic() {
  const ui = SpreadsheetApp.getUi();
  const p1 = verifyPhase1Setup();
  const p3 = typeof verifyPhase3Setup === 'function' ? verifyPhase3Setup() : { details: [] };
  const p4 = typeof verifyPhase4Setup === 'function' ? verifyPhase4Setup() : { details: [] };
  const p5 = typeof verifyPhase5Setup === 'function' ? verifyPhase5Setup() : { details: [] };
  const p6 = typeof verifyPhase6Setup === 'function' ? verifyPhase6Setup() : { details: [] };
  
  let msg = '=== SaveIQ Diagnostic Report ===\n\n[Phase 1: Foundation]\n';
  p1.details.forEach(function(d) { msg += '• ' + d + '\n'; });

  if (p3.details && p3.details.length > 0) {
    msg += '\n[Phase 3: Dashboard & Analytics]\n';
    p3.details.forEach(function(d) { msg += '• ' + d + '\n'; });
  }

  if (p4.details && p4.details.length > 0) {
    msg += '\n[Phase 4: Groq AI Advisory]\n';
    p4.details.forEach(function(d) { msg += '• ' + d + '\n'; });
  }

  if (p5.details && p5.details.length > 0) {
    msg += '\n[Phase 5: Automated Auditing & Alerts]\n';
    p5.details.forEach(function(d) { msg += '• ' + d + '\n'; });
  }

  if (p6.details && p6.details.length > 0) {
    msg += '\n[Phase 6: Security & Formula Protection]\n';
    p6.details.forEach(function(d) { msg += '• ' + d + '\n'; });
  }

  ui.alert('SaveIQ Health & Verification Audit', msg, ui.ButtonSet.OK);
}

