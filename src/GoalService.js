/**
 * SaveIQ – AI Savings Goal Tracker
 * Phase 2: Goal Management Service (Scenario 1)
 * 
 * Handles CRUD operations, payload validation, atomic row appending,
 * and retrieval for savings goals.
 */

const GoalService = {
  /**
   * Validate and persist a new savings goal into the database
   * @param {Object} payload 
   * @returns {Object} { success: boolean, goalId?: string, message: string }
   */
  createGoal: function(payload) {
    try {
      // 1. Server-side validation
      const validation = this.validateGoalPayload(payload);
      if (!validation.isValid) {
        return { success: false, message: validation.error };
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(CONFIG.SHEETS.GOALS);
      
      // Auto-initialize if sheet does not exist
      if (!sheet) {
        initializeSaveIQDatabase();
        sheet = ss.getSheetByName(CONFIG.SHEETS.GOALS);
      }

      // 2. Generate unique Goal ID (e.g. GID-82914)
      const goalId = 'GID-' + Date.now().toString().slice(-5) + Math.floor(10 + Math.random() * 90);
      const nextRow = sheet.getLastRow() + 1;
      const cleanGoalName = (typeof SecurityService !== 'undefined') ? SecurityService.sanitizeInput(payload.goalName) : payload.goalName.trim();

      // 3. Construct 15-column structured row data matching schema (A to O)
      const now = new Date();
      const rowData = [
        goalId,                                    // Col A: Goal_ID
        cleanGoalName,                             // Col B: Goal_Name
        payload.category,                          // Col C: Purpose_Category
        Number(payload.targetAmount),              // Col D: Target_Amount
        Number(payload.initialSavings || 0),       // Col E: Current_Savings
        CONFIG.FORMULAS.REMAINING_BALANCE(nextRow),// Col F: Remaining_Balance
        CONFIG.FORMULAS.PROGRESS_PERCENTAGE(nextRow), // Col G: Progress_Percentage
        payload.deadline,                          // Col H: Deadline (YYYY-MM-DD)
        CONFIG.FORMULAS.DAYS_REMAINING(nextRow),   // Col I: Days_Remaining
        CONFIG.FORMULAS.REQUIRED_DAILY_RATE(nextRow), // Col J: Required_Daily_Rate
        CONFIG.FORMULAS.STATUS(nextRow),           // Col K: Status
        payload.alertEmail.trim(),                 // Col L: Alert_Email
        'AI Advice Pending. Click "Get AI Financial Advice" to analyze.', // Col M: AI_Advice_Summary
        now,                                       // Col N: Last_Audited_At
        now                                        // Col O: Created_At
      ];

      // 4. Atomic row insertion
      const targetRange = sheet.getRange(nextRow, 1, 1, rowData.length);
      targetRange.setValues([rowData]);

      // 5. Apply column cell formatting for the new row
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.TARGET_AMOUNT).setNumberFormat(CONFIG.THRESHOLDS.DEFAULT_CURRENCY_FORMAT);
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.CURRENT_SAVINGS).setNumberFormat(CONFIG.THRESHOLDS.DEFAULT_CURRENCY_FORMAT);
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.REMAINING_BALANCE).setNumberFormat(CONFIG.THRESHOLDS.DEFAULT_CURRENCY_FORMAT);
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.PROGRESS_PCT).setNumberFormat(CONFIG.THRESHOLDS.PERCENT_FORMAT);
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.DEADLINE).setNumberFormat(CONFIG.THRESHOLDS.DATE_FORMAT);
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.DAYS_REMAINING).setNumberFormat('#,##0');
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.REQUIRED_DAILY_RATE).setNumberFormat(CONFIG.THRESHOLDS.DEFAULT_CURRENCY_FORMAT);
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.LAST_AUDITED_AT).setNumberFormat('yyyy-MM-dd HH:mm');
      sheet.getRange(nextRow, CONFIG.GOALS_COLUMNS.CREATED_AT).setNumberFormat('yyyy-MM-dd HH:mm');

      SpreadsheetApp.flush();

      return {
        success: true,
        goalId: goalId,
        message: 'Goal "' + payload.goalName + '" created successfully (' + goalId + ')!'
      };
    } catch (error) {
      Logger.log('Error creating goal: ' + error.toString());
      return {
        success: false,
        message: 'Internal Error: ' + error.message
      };
    }
  },

  /**
   * Comprehensive validation rules for goal creation payload
   */
  validateGoalPayload: function(payload) {
    if (!payload) {
      return { isValid: false, error: 'No data payload received.' };
    }

    if (!payload.goalName || payload.goalName.trim().length === 0) {
      return { isValid: false, error: 'Goal Name is required.' };
    }

    if (!CONFIG.CATEGORIES.includes(payload.category)) {
      return { isValid: false, error: 'Invalid category. Choose from: ' + CONFIG.CATEGORIES.join(', ') };
    }

    const target = Number(payload.targetAmount);
    if (isNaN(target) || target <= 0) {
      return { isValid: false, error: 'Target amount must be a positive number greater than 0.' };
    }

    const initial = Number(payload.initialSavings || 0);
    if (isNaN(initial) || initial < 0) {
      return { isValid: false, error: 'Initial savings cannot be negative.' };
    }

    if (!payload.deadline) {
      return { isValid: false, error: 'Target deadline is required.' };
    }

    const deadlineDate = new Date(payload.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return { isValid: false, error: 'Invalid deadline date format.' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    if (deadlineDate <= today) {
      return { isValid: false, error: 'Deadline must be a future date.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!payload.alertEmail || !emailRegex.test(payload.alertEmail.trim())) {
      return { isValid: false, error: 'A valid email address is required for alerts.' };
    }

    return { isValid: true };
  },

  /**
   * Retrieve all goals as an array of objects
   * @returns {Array<Object>}
   */
  getAllGoals: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.GOALS);
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const lastRow = sheet.getLastRow();
    const data = sheet.getRange(2, 1, lastRow - 1, 15).getValues();

    return data.map(function(row) {
      return {
        goalId: row[0],
        goalName: row[1],
        category: row[2],
        targetAmount: row[3],
        currentSavings: row[4],
        remainingBalance: row[5],
        progressPct: row[6],
        deadline: row[7],
        daysRemaining: row[8],
        requiredDailyRate: row[9],
        status: row[10],
        alertEmail: row[11],
        aiAdvice: row[12],
        lastAudited: row[13],
        createdAt: row[14]
      };
    });
  },

  /**
   * Find a specific goal by Goal_ID
   * @param {string} goalId 
   * @returns {Object|null}
   */
  getGoalById: function(goalId) {
    const goals = this.getAllGoals();
    return goals.find(function(g) { return g.goalId === goalId; }) || null;
  }
};

/**
 * Global entry point for google.script.run from HTML modals
 */
function createGoal(payload) {
  return GoalService.createGoal(payload);
}

function GoalService_getAllGoals() {
  return GoalService.getAllGoals();
}

function GoalService_getGoalById(goalId) {
  return GoalService.getGoalById(goalId);
}

