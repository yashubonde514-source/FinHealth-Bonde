/**
 * SaveIQ – AI Savings Goal Tracker
 * Phase 5: Notification Service (Scenario 3)
 * 
 * Generates responsive HTML transactional emails and dispatches automated alerts
 * for approaching deadlines, overdue milestones, and goal completions.
 */

const NotificationService = {
  /**
   * Dispatches an email notification safely with quota validation
   * @param {string} to 
   * @param {string} subject 
   * @param {string} htmlBody 
   * @returns {Object} { success: boolean, status: string, details: string }
   */
  dispatchEmail: function(to, subject, htmlBody) {
    try {
      if (!to || !to.includes('@')) {
        return { success: false, status: 'SKIPPED', details: 'Invalid recipient email: ' + to };
      }

      // Check daily email quota
      if (typeof SecurityService !== 'undefined') {
        const quotaCheck = SecurityService.checkEmailQuotaAvailability(1);
        if (!quotaCheck.allowed) {
          Logger.log('⚠️ MailApp quota buffer limit reached (' + quotaCheck.remaining + ' remaining). Skipping email to: ' + to);
          return { success: false, status: 'RATE_LIMITED', details: 'Daily email quota buffer reached' };
        }
      } else {
        const remainingQuota = MailApp.getRemainingDailyQuota();
        if (remainingQuota <= 0) {
          Logger.log('⚠️ MailApp daily quota exhausted. Skipping email to: ' + to);
          return { success: false, status: 'RATE_LIMITED', details: 'Daily email quota exhausted' };
        }
      }

      MailApp.sendEmail({
        to: to,
        subject: subject,
        htmlBody: htmlBody,
        name: 'SaveIQ Financial Tracker'
      });

      return { success: true, status: 'SUCCESS', details: 'Email sent successfully' };
    } catch (err) {
      Logger.log('Error dispatching email: ' + err.toString());
      return { success: false, status: 'FAILED', details: err.message };
    }
  },

  /**
   * Sends an approaching deadline reminder email
   * @param {Object} goal 
   * @param {string} sheetUrl 
   * @returns {Object} dispatch result
   */
  sendApproachingDeadlineAlert: function(goal, sheetUrl) {
    const subject = `⚡ [Action Required] SaveIQ: Only ${goal.daysRemaining} days left for "${goal.goalName}"`;
    const htmlBody = this.buildEmailTemplate({
      badgeText: 'DEADLINE APPROACHING',
      badgeColor: '#F59E0B',
      headline: `Only ${goal.daysRemaining} days remaining!`,
      subhead: `Keep your momentum going to complete your ${goal.category} goal on schedule.`,
      goal: goal,
      actionText: `To hit 100% on schedule, save $${Number(goal.requiredDailyRate || 0).toFixed(2)} / day.`,
      sheetUrl: sheetUrl
    });

    return this.dispatchEmail(goal.alertEmail, subject, htmlBody);
  },

  /**
   * Sends an overdue deadline warning email
   * @param {Object} goal 
   * @param {string} sheetUrl 
   * @returns {Object} dispatch result
   */
  sendOverdueAlert: function(goal, sheetUrl) {
    const subject = `⚠️ [Notice] SaveIQ: Goal "${goal.goalName}" has passed its target deadline`;
    const htmlBody = this.buildEmailTemplate({
      badgeText: 'GOAL OVERDUE',
      badgeColor: '#DC2626',
      headline: `Deadline Passed: Action Needed`,
      subhead: `You still have $${Number(goal.remainingBalance || 0).toFixed(2)} remaining to complete "${goal.goalName}".`,
      goal: goal,
      actionText: 'Recommend reviewing your budget or extending your target deadline by 30 days.',
      sheetUrl: sheetUrl
    });

    return this.dispatchEmail(goal.alertEmail, subject, htmlBody);
  },

  /**
   * Sends a congratulatory completion email
   * @param {Object} goal 
   * @param {string} sheetUrl 
   * @returns {Object} dispatch result
   */
  sendCompletionAlert: function(goal, sheetUrl) {
    const subject = `🎉 [Milestone Achieved] SaveIQ: Congratulations on completing "${goal.goalName}"!`;
    const htmlBody = this.buildEmailTemplate({
      badgeText: 'GOAL COMPLETED',
      badgeColor: '#16A34A',
      headline: `Milestone Achieved: 100% Saved!`,
      subhead: `You successfully saved $${Number(goal.targetAmount || 0).toLocaleString()} for "${goal.goalName}".`,
      goal: goal,
      actionText: 'Outstanding discipline! Consider allocating future savings toward an emergency fund or new target.',
      sheetUrl: sheetUrl
    });

    return this.dispatchEmail(goal.alertEmail, subject, htmlBody);
  },

  /**
   * Generates a modern, responsive HTML email template
   * @param {Object} data 
   * @returns {string} HTML string
   */
  buildEmailTemplate: function(data) {
    const goal = data.goal;
    const progressPct = Math.min(100, Math.max(0, Math.round((Number(goal.progressPct) || 0) * 100)));
    const targetFormatted = '$' + Number(goal.targetAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const savedFormatted = '$' + Number(goal.currentSavings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const remainingFormatted = '$' + Number(goal.remainingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const dailyRateFormatted = '$' + Number(goal.requiredDailyRate || 0).toFixed(2) + ' / day';
    const adviceText = goal.aiAdvice && !goal.aiAdvice.includes('Pending') ? goal.aiAdvice : 'Automate weekly deposits to accelerate your goal timeline.';
    const appUrl = data.sheetUrl || 'https://sheets.google.com';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaveIQ Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 24px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">⚡ SaveIQ</span>
                    <span style="font-size: 12px; color: #94A3B8; margin-left: 8px;">AI Savings Tracker</span>
                  </td>
                  <td align="right">
                    <span style="background-color: ${data.badgeColor}; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em;">${data.badgeText}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Headline Section -->
          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0F172A;">${data.headline}</h1>
              <p style="margin: 0; font-size: 14px; color: #64748B;">${data.subhead}</p>
            </td>
          </tr>

          <!-- Goal Metrics Summary Box -->
          <tr>
            <td style="padding: 12px 24px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; padding: 16px;">
                <tr>
                  <td colspan="2" style="padding-bottom: 12px;">
                    <span style="font-size: 16px; font-weight: 700; color: #1E293B;">${goal.goalName}</span>
                    <span style="font-size: 11px; background: #EEF2FF; color: #4F46E5; font-weight: 600; padding: 2px 8px; border-radius: 6px; margin-left: 6px;">${goal.category}</span>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 6px 0; font-size: 13px; color: #64748B;">Target Amount:</td>
                  <td width="50%" align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0F172A;">${targetFormatted}</td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 6px 0; font-size: 13px; color: #64748B;">Current Savings:</td>
                  <td width="50%" align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #16A34A;">${savedFormatted} (${progressPct}%)</td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 6px 0; font-size: 13px; color: #64748B;">Remaining Balance:</td>
                  <td width="50%" align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #DC2626;">${remainingFormatted}</td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 6px 0; font-size: 13px; color: #64748B;">Required Velocity:</td>
                  <td width="50%" align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #4F46E5;">${dailyRateFormatted}</td>
                </tr>
                <!-- Progress Bar -->
                <tr>
                  <td colspan="2" style="padding-top: 14px;">
                    <div style="background-color: #E2E8F0; border-radius: 6px; height: 8px; width: 100%; overflow: hidden;">
                      <div style="background-color: #4F46E5; height: 8px; width: ${progressPct}%; border-radius: 6px;"></div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action / Coaching Advice -->
          <tr>
            <td style="padding: 12px 24px;">
              <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%); border: 1px solid #FDE68A; border-radius: 8px; padding: 14px;">
                <div style="font-size: 11px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                  ⚡ Action Strategy:
                </div>
                <div style="font-size: 13px; color: #78350F; line-height: 1.5;">
                  ${data.actionText}
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #92400E; font-style: italic;">
                  "${adviceText}"
                </div>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 20px 24px 28px 24px;">
              <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79,70,229,0.2);">
                Open SaveIQ Spreadsheet →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F1F5F9; padding: 16px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                This automated financial audit was generated by SaveIQ AI Tracker.<br>
                To modify notification preferences, update your goal details in your Google Sheet.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
};
