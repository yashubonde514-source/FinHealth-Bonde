/**
 * SaveIQ - Phase 2 Verification Test Suite
 * Validates GoalService validations, payload construction, UI modal elements, and menu bindings.
 */

const fs = require('fs');
const path = require('path');

function runPhase2Tests() {
  console.log('🔍 Starting SaveIQ Phase 2 Verification Tests...\n');
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

  // 1. Load Config and GoalService in sandbox
  const configPath = path.join(__dirname, '..', 'src', 'Config.js');
  const goalServicePath = path.join(__dirname, '..', 'src', 'GoalService.js');
  assert(fs.existsSync(configPath), 'Config.js exists');
  assert(fs.existsSync(goalServicePath), 'GoalService.js exists');

  const configContent = fs.readFileSync(configPath, 'utf8');
  const goalServiceContent = fs.readFileSync(goalServicePath, 'utf8');

  const sandbox = {};
  const initScript = `
    ${configContent}
    ${goalServiceContent}
    sandbox.CONFIG = CONFIG;
    sandbox.GoalService = GoalService;
  `;
  const fn = new Function('sandbox', initScript);
  fn(sandbox);

  const GoalService = sandbox.GoalService;
  assert(GoalService !== undefined, 'GoalService initialized properly');

  // 2. Validate Valid Payload
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 30);
  const validDeadline = tomorrow.toISOString().split('T')[0];

  const validPayload = {
    goalName: 'New MacBook Pro',
    category: 'Tech',
    targetAmount: 2000,
    initialSavings: 500,
    deadline: validDeadline,
    alertEmail: 'user@example.com'
  };

  const validResult = GoalService.validateGoalPayload(validPayload);
  assert(validResult.isValid === true, 'Valid payload passes validation');

  // 3. Validate Failure Cases
  // Missing name
  const emptyNameResult = GoalService.validateGoalPayload({ ...validPayload, goalName: '   ' });
  assert(emptyNameResult.isValid === false && emptyNameResult.error.includes('Goal Name'), 'Empty goal name correctly rejected');

  // Invalid Category
  const badCategoryResult = GoalService.validateGoalPayload({ ...validPayload, category: 'Cryptocurrency' });
  assert(badCategoryResult.isValid === false && badCategoryResult.error.includes('category'), 'Unrecognized category correctly rejected');

  // Non-positive Target Amount
  const zeroTargetResult = GoalService.validateGoalPayload({ ...validPayload, targetAmount: 0 });
  assert(zeroTargetResult.isValid === false && zeroTargetResult.error.includes('positive'), 'Zero target amount correctly rejected');

  const negativeTargetResult = GoalService.validateGoalPayload({ ...validPayload, targetAmount: -100 });
  assert(negativeTargetResult.isValid === false && negativeTargetResult.error.includes('positive'), 'Negative target amount correctly rejected');

  // Negative Initial Savings
  const negativeInitialResult = GoalService.validateGoalPayload({ ...validPayload, initialSavings: -50 });
  assert(negativeInitialResult.isValid === false && negativeInitialResult.error.includes('negative'), 'Negative initial savings correctly rejected');

  // Past Deadline
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pastDeadline = yesterday.toISOString().split('T')[0];
  const pastDeadlineResult = GoalService.validateGoalPayload({ ...validPayload, deadline: pastDeadline });
  assert(pastDeadlineResult.isValid === false && pastDeadlineResult.error.includes('future'), 'Past deadline date correctly rejected');

  // Invalid Email
  const badEmailResult = GoalService.validateGoalPayload({ ...validPayload, alertEmail: 'invalid-email' });
  assert(badEmailResult.isValid === false && badEmailResult.error.includes('email'), 'Invalid email address correctly rejected');

  // 4. Validate UI Components
  const modalPath = path.join(__dirname, '..', 'src', 'UI', 'GoalModal.html');
  const stylesPath = path.join(__dirname, '..', 'src', 'UI', 'Styles.html');
  assert(fs.existsSync(modalPath), 'GoalModal.html exists');
  assert(fs.existsSync(stylesPath), 'Styles.html exists');

  const modalHtml = fs.readFileSync(modalPath, 'utf8');
  assert(modalHtml.includes('id="goalName"'), 'Modal contains goalName input');
  assert(modalHtml.includes('id="category"'), 'Modal contains category select dropdown');
  assert(modalHtml.includes('id="targetAmount"'), 'Modal contains targetAmount input');
  assert(modalHtml.includes('id="initialSavings"'), 'Modal contains initialSavings input');
  assert(modalHtml.includes('id="deadline"'), 'Modal contains deadline input');
  assert(modalHtml.includes('id="alertEmail"'), 'Modal contains alertEmail input');
  assert(modalHtml.includes('id="previewDeficit"') && modalHtml.includes('id="previewDays"') && modalHtml.includes('id="previewRate"'), 'Modal contains live calculation preview elements');
  assert(modalHtml.includes('createGoal(payload)'), 'Modal connects to backend createGoal API');

  // 5. Validate Main.js
  const mainPath = path.join(__dirname, '..', 'src', 'Main.js');
  assert(fs.existsSync(mainPath), 'Main.js exists');
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  assert(mainContent.includes('function onOpen()'), 'Main.js implements onOpen trigger');
  assert(mainContent.includes('showAddGoalModal'), 'Main.js binds showAddGoalModal');
  assert(mainContent.includes('function include('), 'Main.js implements include partial loader');

  console.log(`\n📊 Test Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 Phase 2 Implementation Verified Successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase2Tests();
