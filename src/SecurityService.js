/**
 * SaveIQ – AI Savings Goal Tracker
 * Phase 6: Security, Range Protection & Rate Limiting Service
 * 
 * Provides formula column protection, CSV/Formula injection defense,
 * Groq API cooldown throttling, and quota monitoring.
 */

const SecurityService = {
  /**
   * Protects critical formula columns in the Goals sheet (Columns F, G, I, J, K)
   * Prevents users from inadvertently overwriting automated calculation formulas.
   * @returns {Object} { success: boolean, protectedColumns: Array<number>, message: string }
   */
  protectFormulaColumns: function() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.GOALS);
      if (!sheet) {
        return { success: false, message: 'Goals sheet not found.' };
      }

      // Remove previous protections created by SaveIQ
      const existingProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
      existingProtections.forEach(function(p) {
        if (p.getDescription() && p.getDescription().includes('SaveIQ Formula Protection')) {
          p.remove();
        }
      });

      const protectedCols = CONFIG.SECURITY.PROTECTED_COLUMN_INDICES;
      protectedCols.forEach(function(colIdx) {
        const range = sheet.getRange(2, colIdx, sheet.getMaxRows() - 1, 1);
        const protection = range.protect().setDescription('SaveIQ Formula Protection (Col ' + colIdx + ')');
        
        // Allow the owner/current user to edit if necessary, but display a warning
        protection.setWarningOnly(true);
      });

      Logger.log('✅ SaveIQ formula columns protected successfully: ' + protectedCols.join(', '));
      return {
        success: true,
        protectedColumns: protectedCols,
        message: 'Protected ' + protectedCols.length + ' formula columns (F, G, I, J, K) with edit warnings.'
      };
    } catch (err) {
      Logger.log('Notice protecting columns: ' + err.message);
      return { success: false, message: err.message };
    }
  },

  /**
   * Sanitizes text inputs against CSV/Formula injection and HTML scripting
   * @param {string} input 
   * @returns {string} Sanitized string
   */
  sanitizeInput: function(input) {
    if (typeof input !== 'string') return input;
    let sanitized = input.trim();

    // Prevent Spreadsheet formula injection (starting with =, +, -, @, \t, \r)
    if (/^[=+\-@\t\r]/.test(sanitized)) {
      sanitized = "'" + sanitized;
    }

    // Strip out basic HTML/script tags
    sanitized = sanitized.replace(/<[^>]*>?/gm, '');

    return sanitized;
  },

  /**
   * Enforces a cooldown between external API requests to prevent Groq rate limits (HTTP 429)
   * @returns {boolean} true if request allowed, false if cooling down
   */
  checkApiCooldown: function() {
    try {
      const cache = CacheService.getScriptCache();
      const lastRequest = cache.get('SAVEIQ_LAST_AI_CALL');
      const now = Date.now();

      if (lastRequest) {
        const elapsed = now - Number(lastRequest);
        if (elapsed < CONFIG.SECURITY.MIN_API_COOLDOWN_MS) {
          return false; // Still within cooldown window
        }
      }

      cache.put('SAVEIQ_LAST_AI_CALL', String(now), 30); // 30-sec TTL
      return true;
    } catch (e) {
      return true; // Fallback to allowing request if cache is unavailable
    }
  },

  /**
   * Validates if system has sufficient email quota before attempting batch notifications
   * @param {number} [requiredQuota=1]
   * @returns {Object} { allowed: boolean, remaining: number, buffer: number }
   */
  checkEmailQuotaAvailability: function(requiredQuota) {
    requiredQuota = requiredQuota || 1;
    let remaining = 100;
    try {
      remaining = MailApp.getRemainingDailyQuota();
    } catch (e) {
      remaining = 100;
    }

    const buffer = CONFIG.SECURITY.MIN_DAILY_EMAIL_QUOTA_BUFFER;
    const allowed = (remaining - buffer) >= requiredQuota;

    return {
      allowed: allowed,
      remaining: remaining,
      buffer: buffer
    };
  }
};

/**
 * Menu entry point to protect formula columns
 */
function protectSaveIQFormulas() {
  const result = SecurityService.protectFormulaColumns();
  const ui = SpreadsheetApp.getUi();
  if (result.success) {
    ui.alert('Formula Protection Active', result.message, ui.ButtonSet.OK);
  } else {
    ui.alert('Protection Notice', result.message, ui.ButtonSet.OK);
  }
}
