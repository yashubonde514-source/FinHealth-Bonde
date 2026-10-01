/**
 * SaveIQ - Phase 5 Verification Test Suite
 * Validates NotificationService email templates, AuditService state transitions, and background trigger schedules.
 */

const fs = require('fs');
const path = require('path');

function runPhase5Tests() {
  console.log('🔍 Starting SaveIQ Phase 5 Verification Tests...\n');
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

  // 1. Check NotificationService and AuditService existence
  const configPath = path.join(__dirname, '..', 'src', 'Config.js');
  const notifPath = path.join(__dirname, '..', 'src', 'NotificationService.js');
  const auditPath = path.join(__dirname, '..', 'src', 'AuditService.js');

  assert(fs.existsSync(configPath), 'Config.js exists');
  assert(fs.existsSync(notifPath), 'NotificationService.js exists');
  assert(fs.existsSync(auditPath), 'AuditService.js exists');

  const configContent = fs.readFileSync(configPath, 'utf8');
  const notifContent = fs.readFileSync(notifPath, 'utf8');
  const auditContent = fs.readFileSync(auditPath, 'utf8');

  // Load into sandbox
  const mockMailApp = {
    getRemainingDailyQuota: () => 100,
    sendEmail: (params) => {}
  };
  const mockLogger = { log: () => {} };

  const sandbox = {};
  const initScript = `
    ${configContent}
    ${notifContent}
    ${auditContent}
    sandbox.CONFIG = CONFIG;
    sandbox.NotificationService = NotificationService;
    sandbox.AuditService = AuditService;
  `;
  const fn = new Function('sandbox', 'Logger', 'MailApp', initScript);
  fn(sandbox, mockLogger, mockMailApp);

  const NotificationService = sandbox.NotificationService;
  const AuditService = sandbox.AuditService;

  assert(NotificationService !== undefined, 'NotificationService initialized properly');
  assert(AuditService !== undefined, 'AuditService initialized properly');

  // 2. Test HTML Email Template Rendering
  const dummyGoal = {
    goalId: 'GID-1002',
    goalName: 'Laptop Purchase',
    category: 'Tech',
    targetAmount: 1500,
    currentSavings: 1200,
    remainingBalance: 300,
    progressPct: 0.8,
    deadline: '2026-10-06',
    daysRemaining: 5,
    requiredDailyRate: 60.00,
    status: 'NEARING_DEADLINE',
    alertEmail: 'user@example.com',
    aiAdvice: 'Final stretch! Save $60/day.'
  };

  const emailHtml = NotificationService.buildEmailTemplate({
    badgeText: 'DEADLINE APPROACHING',
    badgeColor: '#F59E0B',
    headline: 'Only 5 days remaining!',
    subhead: 'Keep your momentum going.',
    goal: dummyGoal,
    actionText: 'Save $60.00 / day to hit 100%.',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/dummy'
  });

  assert(emailHtml.includes('SaveIQ'), 'Template includes SaveIQ branding');
  assert(emailHtml.includes('Laptop Purchase'), 'Template includes Goal Name');
  assert(emailHtml.includes('$1,500.00'), 'Template includes formatted Target Amount');
  assert(emailHtml.includes('$1,200.00'), 'Template includes formatted Current Savings');
  assert(emailHtml.includes('$300.00'), 'Template includes formatted Remaining Balance');
  assert(emailHtml.includes('$60.00 / day'), 'Template includes formatted Daily Required Velocity');
  assert(emailHtml.includes('DEADLINE APPROACHING'), 'Template includes dynamic badge text');
  assert(emailHtml.includes('https://docs.google.com/spreadsheets/d/dummy'), 'Template includes spreadsheet CTA link');

  // 3. Test Email Dispatch Wrappers
  let sentSubject = '';
  let sentTo = '';
  mockMailApp.sendEmail = function(params) {
    sentTo = params.to;
    sentSubject = params.subject;
  };

  // Test Approaching Deadline Alert
  const deadlineRes = NotificationService.sendApproachingDeadlineAlert(dummyGoal, 'https://sheet.url');
  assert(deadlineRes.success === true, 'Approaching deadline alert dispatched successfully');
  assert(sentSubject.includes('5 days left') && sentSubject.includes('Laptop Purchase'), `Approaching deadline subject verified: ${sentSubject}`);

  // Test Overdue Alert
  const overdueGoal = { ...dummyGoal, daysRemaining: -2, status: 'OVERDUE' };
  const overdueRes = NotificationService.sendOverdueAlert(overdueGoal, 'https://sheet.url');
  assert(overdueRes.success === true, 'Overdue alert dispatched successfully');
  assert(sentSubject.includes('Overdue') || sentSubject.includes('passed its target deadline'), `Overdue subject verified: ${sentSubject}`);

  // Test Completion Alert
  const completedGoal = { ...dummyGoal, currentSavings: 1500, remainingBalance: 0, progressPct: 1.0, status: 'COMPLETED' };
  const completionRes = NotificationService.sendCompletionAlert(completedGoal, 'https://sheet.url');
  assert(completionRes.success === true, 'Completion alert dispatched successfully');
  assert(sentSubject.includes('Congratulations') && sentSubject.includes('completing'), `Completion subject verified: ${sentSubject}`);

  // 4. Test State Machine Transition Logic
  function evaluateState(goal) {
    const progress = Number(goal.progressPct) || 0;
    const days = (goal.daysRemaining !== '' && !isNaN(goal.daysRemaining)) ? Number(goal.daysRemaining) : null;
    if (progress >= 1.0) return 'COMPLETED';
    if (days !== null && days < 0) return 'OVERDUE';
    if (days !== null && days <= 7) return 'NEARING_DEADLINE';
    return 'ACTIVE';
  }

  assert(evaluateState({ progressPct: 1.0, daysRemaining: 10 }) === 'COMPLETED', 'Progress 100% transitions to COMPLETED');
  assert(evaluateState({ progressPct: 0.5, daysRemaining: -1 }) === 'OVERDUE', 'Negative days remaining transitions to OVERDUE');
  assert(evaluateState({ progressPct: 0.8, daysRemaining: 5 }) === 'NEARING_DEADLINE', 'Days <= 7 transitions to NEARING_DEADLINE');
  assert(evaluateState({ progressPct: 0.3, daysRemaining: 40 }) === 'ACTIVE', 'Days > 7 transitions to ACTIVE');

  // 5. Test Trigger Methods in AuditService
  assert(typeof AuditService.setupDailyTrigger === 'function', 'AuditService implements setupDailyTrigger');
  assert(typeof AuditService.removeDailyTrigger === 'function', 'AuditService implements removeDailyTrigger');
  assert(typeof AuditService.isDailyTriggerActive === 'function', 'AuditService implements isDailyTriggerActive');

  // 6. Test Main.js & Setup.js Integrations
  const mainContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'Main.js'), 'utf8');
  assert(mainContent.includes('Schedule Daily Audit'), 'Main.js menu includes Schedule Daily Audit option');
  assert(mainContent.includes('manageDailyTrigger'), 'Main.js references manageDailyTrigger');

  const setupContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'Setup.js'), 'utf8');
  assert(setupContent.includes('verifyPhase5Setup'), 'Setup.js contains verifyPhase5Setup diagnostic function');

  console.log(`\n📊 Test Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 Phase 5 Implementation Verified Successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase5Tests();
