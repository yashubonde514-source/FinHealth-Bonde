/**
 * SaveIQ – AI Savings Goal Tracker
 * Phase 4: Groq AI Integration & Financial Advisory Engine (Scenario 2)
 * 
 * Orchestrates communication with Groq Cloud API (Llama 3.3), prompt formulation,
 * response parsing, heuristic fallback handling, and sheet persistence.
 */

const AIService = {
  /**
   * Retrieves the configured Groq API Key
   * Checks ScriptProperties first, then falls back to Config sheet.
   * @returns {string|null}
   */
  getApiKey: function() {
    try {
      const scriptProps = PropertiesService.getScriptProperties();
      const key = scriptProps.getProperty('GROQ_API_KEY');
      if (key && key.trim().length > 0) {
        return key.trim();
      }

      // Fallback: Check Config sheet for GROQ_API_KEY
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const configSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG);
      if (configSheet && configSheet.getLastRow() >= 2) {
        const data = configSheet.getRange(2, 1, configSheet.getLastRow() - 1, 2).getValues();
        for (let i = 0; i < data.length; i++) {
          if (data[i][0] === 'GROQ_API_KEY' && data[i][1]) {
            return String(data[i][1]).trim();
          }
        }
      }
    } catch (e) {
      Logger.log('Notice getting API key: ' + e.message);
    }
    return null;
  },

  /**
   * Stores the Groq API Key securely in ScriptProperties
   * @param {string} apiKey 
   * @returns {boolean}
   */
  setApiKey: function(apiKey) {
    if (!apiKey || apiKey.trim().length === 0) return false;
    PropertiesService.getScriptProperties().setProperty('GROQ_API_KEY', apiKey.trim());
    return true;
  },

  /**
   * Constructs the structured prompt payload for Groq LLM
   * @param {Object} goal
   * @returns {Array<Object>} messages array
   */
  buildPromptMessages: function(goal) {
    const systemPrompt = 
      "You are SaveIQ Financial Advisor, an empathetic yet strictly disciplined financial coach. " +
      "Given the user's savings goal, target amount, current savings, days remaining, and required daily savings rate, " +
      "provide concise, realistic, high-impact strategies to hit the target. Highlight practical budget tweaks. " +
      "Keep advice under 120 words with 3 bullet points.";

    const userPayload = {
      goalName: goal.goalName,
      category: goal.category,
      targetAmount: goal.targetAmount,
      currentSavings: goal.currentSavings,
      remainingDeficit: goal.remainingBalance,
      progressPct: (goal.progressPct * 100).toFixed(1) + "%",
      deadline: goal.deadline,
      daysRemaining: goal.daysRemaining,
      requiredDailyVelocity: "$" + Number(goal.requiredDailyRate || 0).toFixed(2) + " / day",
      status: goal.status
    };

    return [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Analyze my savings goal trajectory:\n" + JSON.stringify(userPayload, null, 2) }
    ];
  },

  /**
   * Generates AI financial advice for a specific goal
   * @param {string} goalId
   * @returns {Object} { success: boolean, advice: string, isAI: boolean, goal: Object }
   */
  generateAdviceForGoal: function(goalId) {
    const goal = GoalService.getGoalById(goalId);
    if (!goal) {
      return { success: false, message: "Goal not found: " + goalId };
    }

    const apiKey = this.getApiKey();
    let advice = "";
    let isAI = false;

    if (typeof SecurityService !== 'undefined' && !SecurityService.checkApiCooldown()) {
      Logger.log("API Cooldown active. Falling back to heuristic engine.");
      advice = this.generateHeuristicAdvice(goal);
    } else if (apiKey) {
      try {
        advice = this.callGroqApi(goal, apiKey);
        isAI = true;
      } catch (err) {
        Logger.log("Groq API Call Failed: " + err.toString() + ". Falling back to rule-based engine.");
        advice = this.generateHeuristicAdvice(goal);
      }
    } else {
      // Graceful fallback when API key is not yet set
      advice = this.generateHeuristicAdvice(goal);
    }

    // Persist advice back to Goals sheet (Column M) & update timestamp (Column N)
    this.persistAdviceToSheet(goalId, advice);

    return {
      success: true,
      goal: goal,
      advice: advice,
      isAI: isAI,
      message: isAI ? "AI Financial Advice generated via Groq LLM." : "Heuristic financial guidance generated (Set GROQ_API_KEY for deep AI insights)."
    };
  },

  /**
   * HTTP Client to invoke Groq Cloud API with retry logic
   * @param {Object} goal
   * @param {string} apiKey
   * @returns {string} Advice text
   */
  callGroqApi: function(goal, apiKey) {
    const messages = this.buildPromptMessages(goal);
    const payload = {
      model: CONFIG.AI.DEFAULT_MODEL,
      messages: messages,
      temperature: CONFIG.AI.TEMPERATURE,
      max_tokens: CONFIG.AI.MAX_TOKENS
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // Execute with 1 retry for transient network drops
    let response;
    try {
      response = UrlFetchApp.fetch(CONFIG.AI.ENDPOINT, options);
    } catch (e) {
      Utilities.sleep(1000);
      response = UrlFetchApp.fetch(CONFIG.AI.ENDPOINT, options);
    }

    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode !== 200) {
      throw new Error("Groq API Error [" + statusCode + "]: " + responseText);
    }

    const json = JSON.parse(responseText);
    if (json.choices && json.choices.length > 0 && json.choices[0].message) {
      return json.choices[0].message.content.trim();
    } else {
      throw new Error("Invalid response format from Groq API.");
    }
  },

  /**
   * Rule-based heuristic financial advisor used as fallback or offline mode
   * @param {Object} goal
   * @returns {string}
   */
  generateHeuristicAdvice: function(goal) {
    const remaining = Number(goal.remainingBalance || 0);
    const days = Number(goal.daysRemaining || 0);
    const dailyRate = Number(goal.requiredDailyRate || 0);
    const progress = Number(goal.progressPct || 0);

    if (progress >= 1.0) {
      return "🎉 Congratulations! You have achieved 100% of your savings goal. Consider allocating surplus funds toward your next priority objective or an emergency cushion.";
    }

    if (days < 0) {
      return "⚠️ This goal is past its target deadline with $" + remaining.toFixed(2) + " remaining. Recommend extending the target date by 30-60 days and setting up a dedicated auto-transfer.";
    }

    if (days <= 7) {
      return "⚡ Final stretch! With only " + days + " days remaining, an allocation of $" + dailyRate.toFixed(2) + "/day is required. Consider a temporary 7-day spending freeze on dining and entertainment to hit 100%.";
    }

    return (
      "💡 Strategy for " + goal.goalName + " (" + goal.category + "):\n" +
      "• Target Velocity: Save $" + dailyRate.toFixed(2) + "/day ($" + (dailyRate * 7).toFixed(2) + "/week) over the next " + days + " days.\n" +
      "• Budget Adjustment: Automate weekly transfers on payday to prevent discretionary spending leakage.\n" +
      "• Category Optimization: Audit non-essential expenses in the " + goal.category + " category to accelerate timeline."
    );
  },

  /**
   * Writes the generated advice into Column M of the corresponding goal row
   * @param {string} goalId 
   * @param {string} advice 
   */
  persistAdviceToSheet: function(goalId, advice) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.GOALS);
    if (!sheet || sheet.getLastRow() <= 1) return;

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === goalId) {
        const targetRow = i + 2;
        sheet.getRange(targetRow, CONFIG.GOALS_COLUMNS.AI_ADVICE_SUMMARY).setValue(advice);
        sheet.getRange(targetRow, CONFIG.GOALS_COLUMNS.LAST_AUDITED_AT).setValue(new Date());
        SpreadsheetApp.flush();
        break;
      }
    }
  }
};

/**
 * Global entry points callable from client modals or menus
 */
function getAIAdviceForGoal(goalId) {
  return AIService.generateAdviceForGoal(goalId);
}

function saveGroqApiKey(key) {
  return AIService.setApiKey(key);
}

function getStoredGroqApiKeyStatus() {
  const key = AIService.getApiKey();
  return { hasKey: !!key, preview: key ? (key.slice(0, 4) + '...' + key.slice(-4)) : null };
}
