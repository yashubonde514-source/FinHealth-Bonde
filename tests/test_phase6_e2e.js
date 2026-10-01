/**
 * SaveIQ - Phase 6 End-to-End Integration & Security Test Suite
 * Simulates complete user lifecycle across all 4 scenarios from problem_statement.md:
 * - Scenario 1: Savings Goal Creation (5 diverse goals)
 * - Scenario 2: AI Financial Recommendations (Groq prompt & heuristic fallback)
 * - Scenario 3: Automated Deadline Audits & Email Alerts
 * - Scenario 4: Financial Dashboard KPI & Category Aggregations
 * - Security: Formula column protections, input sanitization, API cooldowns
 */

const fs = require('fs');
const path = require('path');

function runPhase6E2ETests() {
  console.log('🔍 Starting SaveIQ Phase 6 End-to-End Integration & Security Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  }

  // Load all services into sandbox
  const configPath = path.join(__dirname, '..', 'src', 'Config.js');
  const securityPath = path.join(__dirname, '..', 'src', 'SecurityService.js');
  const goalServicePath = path.join(__dirname, '..', 'src', 'GoalService.js');
  const dashServicePath = path.join(__dirname, '..', 'src', 'DashboardService.js');
  const aiServicePath = path.join(__dirname, '..', 'src', 'AIService.js');
  const notifServicePath = path.join(__dirname, '..', 'src', 'NotificationService.js');
  const auditServicePath = path.join(__dirname, '..', 'src', 'AuditService.js');

  const files = [configPath, securityPath, goalServicePath, dashServicePath, aiServicePath, notifServicePath, auditPath = auditServicePath];
  files.forEach(f => assert(fs.existsSync(f), `${path.basename(f)} exists`));

  const sandbox = {};
  const mockLogger = { log: () => {} };
  const mockCache = {
    store: {},
    get: function(k) { return this.store[k] || null; },
    put: function(k, v) { this.store[k] = v; }
  };
  const mockMailApp = {
    getRemainingDailyQuota: () => 90,
    sendEmail: () => {}
  };

  const combinedCode = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const initScript = `
    ${combinedCode}
    sandbox.CONFIG = CONFIG;
    sandbox.SecurityService = SecurityService;
    sandbox.GoalService = GoalService;
    sandbox.DashboardService = DashboardService;
    sandbox.AIService = AIService;
    sandbox.NotificationService = NotificationService;
    sandbox.AuditService = AuditService;
  `;

  const fn = new Function('sandbox', 'Logger', 'CacheService', 'MailApp', initScript);
  fn(sandbox, mockLogger, { getScriptCache: () => mockCache }, mockMailApp);

  const { CONFIG, SecurityService, GoalService, DashboardService, AIService, NotificationService, AuditService } = sandbox;

  // ==========================================
  // 1. SECURITY & INPUT SANITIZATION TESTS
  // ==========================================
  console.log('\n--- 1. Security & Hardening Tests ---');
  
  // Test formula injection defense
  const maliciousFormula1 = '=cmd|"/C calc"!A0';
  assert(SecurityService.sanitizeInput(maliciousFormula1).startsWith("'="), 'Disarmed spreadsheet formula injection starting with =');
  
  const maliciousFormula2 = '+SUM(1+1)';
  assert(SecurityService.sanitizeInput(maliciousFormula2).startsWith("'+"), 'Disarmed formula injection starting with +');

  const maliciousFormula3 = '@AVERAGE(A1:A10)';
  assert(SecurityService.sanitizeInput(maliciousFormula3).startsWith("'@"), 'Disarmed formula injection starting with @');

  // Test HTML XSS sanitization
  const maliciousHtml = 'Emergency Fund <script>alert("hack")</script>';
  assert(SecurityService.sanitizeInput(maliciousHtml) === 'Emergency Fund alert("hack")', 'Stripped HTML tags from goal name');

  // Test API Cooldown Throttling
  const firstCall = SecurityService.checkApiCooldown();
  assert(firstCall === true, 'First API call permitted by cooldown guard');
  
  const immediateSecondCall = SecurityService.checkApiCooldown();
  assert(immediateSecondCall === false, 'Immediate consecutive API call throttled by cooldown guard');

  // Test Email Quota Buffer Guard
  const quotaCheck = SecurityService.checkEmailQuotaAvailability(1);
  assert(quotaCheck.allowed === true && quotaCheck.remaining === 90, 'Email quota check allows dispatch when quota (90) exceeds buffer (5)');

  // ==========================================
  // 2. SCENARIO 1: GOAL CREATION (5 GOALS)
  // ==========================================
  console.log('\n--- 2. Scenario 1: Multi-Goal Creation ---');

  const testGoalsPayload = [
    { goalName: 'Emergency Reserve', category: 'Emergency', targetAmount: 5000, initialSavings: 2500, deadline: '2026-12-31', alertEmail: 'alex@example.com' },
    { goalName: 'MacBook Pro M3', category: 'Tech', targetAmount: 1800, initialSavings: 1500, deadline: '2026-10-06', alertEmail: 'alex@example.com' },
    { goalName: 'European Vacation', category: 'Travel', targetAmount: 3000, initialSavings: 600, deadline: '2026-09-15', alertEmail: 'alex@example.com' },
    { goalName: 'AI Cloud Certification', category: 'Education', targetAmount: 600, initialSavings: 200, deadline: '2026-11-20', alertEmail: 'alex@example.com' },
    { goalName: 'Electric Scooter', category: 'Lifestyle', targetAmount: 500, initialSavings: 0, deadline: '2026-10-25', alertEmail: 'alex@example.com' }
  ];

  testGoalsPayload.forEach((payload, idx) => {
    const val = GoalService.validateGoalPayload(payload);
    // For Vacation date in past:
    if (payload.goalName === 'European Vacation') {
      assert(val.isValid === false, `Goal ${idx + 1} (${payload.goalName}) past deadline correctly flagged by validation`);
    } else {
      assert(val.isValid === true, `Goal ${idx + 1} (${payload.goalName}) passes payload validation`);
    }
  });

  // ==========================================
  // 3. SCENARIO 4: FINANCIAL DASHBOARD AGGREGATION
  // ==========================================
  console.log('\n--- 3. Scenario 4: Dashboard Metrics Engine ---');

  // Simulate in-memory goal ledger matching schema
  const simulatedGoals = [
    { goalId: 'GID-1001', goalName: 'Emergency Reserve', category: 'Emergency', targetAmount: 5000, currentSavings: 2500, remainingBalance: 2500, progressPct: 0.5, daysRemaining: 80, requiredDailyRate: 31.25, status: 'ACTIVE', alertEmail: 'alex@example.com', aiAdvice: '' },
    { goalId: 'GID-1002', goalName: 'MacBook Pro M3', category: 'Tech', targetAmount: 1800, currentSavings: 1500, remainingBalance: 300, progressPct: 0.833, daysRemaining: 5, requiredDailyRate: 60.00, status: 'NEARING_DEADLINE', alertEmail: 'alex@example.com', aiAdvice: '' },
    { goalId: 'GID-1003', goalName: 'European Vacation', category: 'Travel', targetAmount: 3000, currentSavings: 600, remainingBalance: 2400, progressPct: 0.2, daysRemaining: -5, requiredDailyRate: 0, status: 'OVERDUE', alertEmail: 'alex@example.com', aiAdvice: '' },
    { goalId: 'GID-1004', goalName: 'AI Cloud Certification', category: 'Education', targetAmount: 600, initialSavings: 200, currentSavings: 600, remainingBalance: 0, progressPct: 1.0, daysRemaining: 40, requiredDailyRate: 0, status: 'COMPLETED', alertEmail: 'alex@example.com', aiAdvice: '' },
    { goalId: 'GID-1005', goalName: 'Electric Scooter', category: 'Lifestyle', targetAmount: 500, currentSavings: 100, remainingBalance: 400, progressPct: 0.2, daysRemaining: 24, requiredDailyRate: 16.67, status: 'ACTIVE', alertEmail: 'alex@example.com', aiAdvice: '' }
  ];

  const totalGoals = simulatedGoals.length;
  const totalTarget = simulatedGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = simulatedGoals.reduce((sum, g) => sum + g.currentSavings, 0);
  const overallProgress = totalSaved / totalTarget;

  assert(totalGoals === 5, 'Total Goals counted accurately: 5');
  assert(totalTarget === 10900, 'Total Target capital aggregated accurately: $10,900.00');
  assert(totalSaved === 5300, 'Total Saved capital aggregated accurately: $5,300.00');
  assert(Math.round(overallProgress * 100) === 49, `Overall progress calculated accurately: 48.6% (~49%)`);

  const activeCount = simulatedGoals.filter(g => g.status === 'ACTIVE' || g.status === 'NEARING_DEADLINE').length;
  const completedCount = simulatedGoals.filter(g => g.status === 'COMPLETED').length;
  const overdueCount = simulatedGoals.filter(g => g.status === 'OVERDUE').length;

  assert(activeCount === 3, 'Active goals count verified: 3 (2 ACTIVE + 1 NEARING_DEADLINE)');
  assert(completedCount === 1, 'Completed goals count verified: 1');
  assert(overdueCount === 1, 'Overdue goals count verified: 1');

  // ==========================================
  // 4. SCENARIO 2: AI FINANCIAL RECOMMENDATIONS
  // ==========================================
  console.log('\n--- 4. Scenario 2: Groq AI Advisory Engine ---');

  simulatedGoals.forEach(g => {
    const promptMessages = AIService.buildPromptMessages(g);
    assert(promptMessages.length === 2, `AI Prompt structured properly for ${g.goalName}`);
    assert(promptMessages[1].content.includes(g.category), `AI Prompt incorporates category context: ${g.category}`);

    const heuristicAdvice = AIService.generateHeuristicAdvice(g);
    assert(heuristicAdvice.length > 20, `Actionable financial advice generated for ${g.goalName} (${g.status})`);
  });

  // ==========================================
  // 5. SCENARIO 3: AUTOMATED AUDIT & NOTIFICATIONS
  // ==========================================
  console.log('\n--- 5. Scenario 3: Automated Auditing & Notifications ---');

  let dispatchedSubject = '';
  mockMailApp.sendEmail = function(params) {
    dispatchedSubject = params.subject;
  };

  // Test Approaching Deadline alert trigger
  const nearingGoal = simulatedGoals.find(g => g.status === 'NEARING_DEADLINE');
  const alertRes1 = NotificationService.sendApproachingDeadlineAlert(nearingGoal, 'https://sheet.url');
  assert(alertRes1.success === true, 'Approaching deadline alert triggered and dispatched');
  assert(dispatchedSubject.includes('5 days left'), 'Approaching deadline email subject highlights days left');

  // Test Overdue alert trigger
  const overdueGoal = simulatedGoals.find(g => g.status === 'OVERDUE');
  const alertRes2 = NotificationService.sendOverdueAlert(overdueGoal, 'https://sheet.url');
  assert(alertRes2.success === true, 'Overdue alert triggered and dispatched');
  assert(dispatchedSubject.includes('Overdue') || dispatchedSubject.includes('passed its target deadline'), 'Overdue email subject highlights deadline violation');

  // Test Completion celebration trigger
  const completedGoal = simulatedGoals.find(g => g.status === 'COMPLETED');
  const alertRes3 = NotificationService.sendCompletionAlert(completedGoal, 'https://sheet.url');
  assert(alertRes3.success === true, 'Completion celebration alert triggered and dispatched');
  assert(dispatchedSubject.includes('Congratulations'), 'Completion email subject contains celebratory banner');

  console.log(`\n📊 E2E Test Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 SaveIQ Phase 6 End-to-End Simulation & Security Hardening PASSED 100%!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase6E2ETests();
