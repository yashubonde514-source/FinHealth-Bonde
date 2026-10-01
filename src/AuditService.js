/**
 * SaveIQ – AI Savings Goal Tracker
 * Phase 5: Automated Background Auditing & Notification Engine (Scenario 3)
 * 
 * Conducts automated audits of all savings goals, manages state lifecycle transitions,
 * logs audit trails, and dispatches proactive email alerts via NotificationService.
 */

const AuditService = {
  /**
   * Main audit engine: Audits all goals, executes state transitions, and dispatches alerts
   * @param {string} [triggerType='MANUAL_AUDIT'] 'DAILY_CRON' or 'MANUAL_AUDIT'
   * @returns {Object} Audit summary statistics
   */
  executeAudit: function(triggerType) {
    triggerType = triggerType || 'MANUAL_AUDIT';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const goalsSheet = ss.getSheetByName(CONFIG.SHEETS.GOALS);
    const auditSheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOGS);

    if (!goalsSheet || goalsSheet.getLastRow() <= 1) {
      Logger.log('AuditService: No goals found to audit.');
      return { totalAudited: 0, notificationsSent: 0, message: 'No goals found to audit.' };
    }

    const sheetUrl = ss.getUrl();
    const goals = GoalService.getAllGoals();
    const now = new Date();

    const stats = {
      totalAudited: goals.length,
      notificationsSent: 0,
      activeCount: 0,
      nearingCount: 0,
      overdueCount: 0,
      completedCount: 0,
      details: []
    };

    const auditLogRows = [];

    // Loop through each goal and evaluate state machine
    goals.forEach((goal, index) => {
      const rowIdx = index + 2;
      const progress = Number(goal.progressPct) || 0;
      const days = (goal.daysRemaining !== '' && !isNaN(goal.daysRemaining)) ? Number(goal.daysRemaining) : null;
      let newStatus = goal.status;
      let dispatchResult = { success: false, status: 'SKIPPED', details: 'No notification required' };
      let notificationSent = false;

      // 1. Evaluate State Machine
      if (progress >= 1.0) {
        newStatus = CONFIG.STATUSES.COMPLETED;
        stats.completedCount++;
        // Notify if newly completed
        if (goal.status !== CONFIG.STATUSES.COMPLETED) {
          dispatchResult = NotificationService.sendCompletionAlert(goal, sheetUrl);
          notificationSent = dispatchResult.success;
        }
      } else if (days !== null && days < 0) {
        newStatus = CONFIG.STATUSES.OVERDUE;
        stats.overdueCount++;
        dispatchResult = NotificationService.sendOverdueAlert(goal, sheetUrl);
        notificationSent = dispatchResult.success;
      } else if (days !== null && days <= CONFIG.THRESHOLDS.DAYS_NEARING_DEADLINE) {
        newStatus = CONFIG.STATUSES.NEARING_DEADLINE;
        stats.nearingCount++;
        dispatchResult = NotificationService.sendApproachingDeadlineAlert(goal, sheetUrl);
        notificationSent = dispatchResult.success;
      } else {
        newStatus = CONFIG.STATUSES.ACTIVE;
        stats.activeCount++;
      }

      if (notificationSent) {
        stats.notificationsSent++;
      }

      // 2. Update Status and Last Audited in Goals Sheet
      goalsSheet.getRange(rowIdx, CONFIG.GOALS_COLUMNS.STATUS).setValue(newStatus);
      goalsSheet.getRange(rowIdx, CONFIG.GOALS_COLUMNS.LAST_AUDITED_AT).setValue(now);

      // 3. Prepare Audit Log Entry
      const logId = 'LOG-' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);
      auditLogRows.push([
        logId,                                     // Col A: Log_ID
        goal.goalId,                               // Col B: Goal_ID
        now,                                       // Col C: Timestamp
        triggerType,                               // Col D: Trigger_Type
        notificationSent,                          // Col E: Notification_Sent
        dispatchResult.status,                     // Col F: Message_Status
        `[${newStatus}] ${dispatchResult.details}` // Col G: Details
      ]);

      stats.details.push(`${goal.goalName} (${goal.goalId}): ${newStatus} - Email: ${dispatchResult.status}`);
    });

    // Append all audit records to Audit_Logs sheet
    if (auditSheet && auditLogRows.length > 0) {
      const nextLogRow = auditSheet.getLastRow() + 1;
      auditSheet.getRange(nextLogRow, 1, auditLogRows.length, auditLogRows[0].length).setValues(auditLogRows);
    }

    SpreadsheetApp.flush();

    // Refresh Dashboard to reflect audited statuses
    try {
      DashboardService.setupDashboard();
    } catch (e) {
      Logger.log('Dashboard refresh during audit notice: ' + e.message);
    }

    Logger.log('=== SaveIQ Audit Completed ===\n' + JSON.stringify(stats, null, 2));
    return stats;
  },

  /**
   * Sets up an automated daily time-driven trigger at 08:00 AM
   * @returns {Object} { success: boolean, message: string }
   */
  setupDailyTrigger: function() {
    this.removeDailyTrigger(); // Prevent duplicate triggers

    ScriptApp.newTrigger('executeDailyAudit')
      .timeBased()
      .everyDays(1)
      .atHour(8)
      .create();

    return {
      success: true,
      message: 'Automated daily audit trigger successfully configured to run daily at 08:00 AM!'
    };
  },

  /**
   * Removes existing SaveIQ time-driven audit triggers
   * @returns {boolean}
   */
  removeDailyTrigger: function() {
    const triggers = ScriptApp.getProjectTriggers();
    let removed = false;
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'executeDailyAudit') {
        ScriptApp.deleteTrigger(triggers[i]);
        removed = true;
      }
    }
    return removed;
  },

  /**
   * Checks whether the daily time-driven trigger is active
   * @returns {boolean}
   */
  isDailyTriggerActive: function() {
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'executeDailyAudit') {
        return true;
      }
    }
    return false;
  }
};

/**
 * Automated cron entry point for daily background triggers
 */
function executeDailyAudit() {
  return AuditService.executeAudit('DAILY_CRON');
}

/**
 * Interactive menu entry point for manual audits
 */
function runManualAudit() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('SaveIQ Audit', 'Running background audit across all savings goals. Please wait...', ui.ButtonSet.OK);
  
  const stats = AuditService.executeAudit('MANUAL_AUDIT');
  
  const summaryMsg = 
    'Audit Execution Complete!\n\n' +
    '• Total Goals Audited: ' + stats.totalAudited + '\n' +
    '• Active Goals: ' + stats.activeCount + '\n' +
    '• Nearing Deadline: ' + stats.nearingCount + '\n' +
    '• Overdue Goals: ' + stats.overdueCount + '\n' +
    '• Completed Goals: ' + stats.completedCount + '\n' +
    '• Email Alerts Sent: ' + stats.notificationsSent + '\n\n' +
    'Audit logs have been recorded in the "Audit_Logs" sheet.';

  ui.alert('SaveIQ Audit Summary', summaryMsg, ui.ButtonSet.OK);
}

/**
 * Menu entry point to manage daily trigger
 */
function manageDailyTrigger() {
  const ui = SpreadsheetApp.getUi();
  const isActive = AuditService.isDailyTriggerActive();

  const response = ui.alert(
    'Automated Daily Audit Schedule',
    'Current Status: ' + (isActive ? '🟢 ACTIVE (Runs daily at 8:00 AM)' : '⚪ INACTIVE') + '\n\n' +
    (isActive ? 'Do you want to DISABLE the daily automated schedule?' : 'Do you want to ENABLE the daily automated schedule (Runs daily at 8:00 AM)?'),
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    if (isActive) {
      AuditService.removeDailyTrigger();
      ui.alert('Disabled', 'Daily automated audit trigger has been removed.', ui.ButtonSet.OK);
    } else {
      AuditService.setupDailyTrigger();
      ui.alert('Enabled', 'Daily automated audit trigger is now active! It will audit deadlines and send email alerts every morning at 8:00 AM.', ui.ButtonSet.OK);
    }
  }
}
