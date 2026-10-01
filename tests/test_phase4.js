/**
 * SaveIQ - Phase 4 Verification Test Suite
 * Validates AIService, Groq prompt construction, heuristic fallbacks, and AI Advice UI template.
 */

const fs = require('fs');
const path = require('path');

function runPhase4Tests() {
  console.log('🔍 Starting SaveIQ Phase 4 Verification Tests...\n');
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

  // 1. Load AIService in sandbox
  const configPath = path.join(__dirname, '..', 'src', 'Config.js');
  const aiServicePath = path.join(__dirname, '..', 'src', 'AIService.js');
  assert(fs.existsSync(configPath), 'Config.js exists');
  assert(fs.existsSync(aiServicePath), 'AIService.js exists');

  const configContent = fs.readFileSync(configPath, 'utf8');
  const aiContent = fs.readFileSync(aiServicePath, 'utf8');

  const sandbox = {};
  const initScript = `
    ${configContent}
    ${aiContent}
    sandbox.CONFIG = CONFIG;
    sandbox.AIService = AIService;
  `;
  const fn = new Function('sandbox', initScript);
  fn(sandbox);

  const AIService = sandbox.AIService;
  assert(AIService !== undefined, 'AIService initialized properly');

  // 2. Test Prompt Construction
  const testGoal = {
    goalId: 'GID-1002',
    goalName: 'MacBook Pro M3',
    category: 'Tech',
    targetAmount: 2000,
    currentSavings: 800,
    remainingBalance: 1200,
    progressPct: 0.4,
    deadline: '2026-12-01',
    daysRemaining: 60,
    requiredDailyRate: 20.00,
    status: 'ACTIVE'
  };

  const messages = AIService.buildPromptMessages(testGoal);
  assert(Array.isArray(messages) && messages.length === 2, 'Prompt messages array has 2 elements');
  assert(messages[0].role === 'system', 'First message is system prompt');
  assert(messages[0].content.includes('SaveIQ Financial Advisor'), 'System prompt assigns SaveIQ advisor persona');
  assert(messages[1].role === 'user', 'Second message is user prompt');
  assert(messages[1].content.includes('MacBook Pro M3'), 'User prompt contains goal name');
  assert(messages[1].content.includes('$20.00 / day'), 'User prompt contains calculated required velocity');

  // 3. Test Heuristic Advice Engine Across Lifecycle States
  // Case A: Active Goal
  const activeAdvice = AIService.generateHeuristicAdvice(testGoal);
  assert(activeAdvice.includes('$20.00/day'), 'Active goal advice recommends calculated daily rate');
  assert(activeAdvice.includes('Tech'), 'Active goal advice references category');

  // Case B: Nearing Deadline Goal (<= 7 days)
  const nearingGoal = { ...testGoal, daysRemaining: 5, requiredDailyRate: 240.00, status: 'NEARING_DEADLINE' };
  const nearingAdvice = AIService.generateHeuristicAdvice(nearingGoal);
  assert(nearingAdvice.includes('Final stretch') || nearingAdvice.includes('5 days'), 'Nearing deadline advice highlights urgency');

  // Case C: Overdue Goal (< 0 days)
  const overdueGoal = { ...testGoal, daysRemaining: -3, status: 'OVERDUE' };
  const overdueAdvice = AIService.generateHeuristicAdvice(overdueGoal);
  assert(overdueAdvice.includes('past its target deadline'), 'Overdue advice recommends deadline adjustment');

  // Case D: Completed Goal (100%)
  const completedGoal = { ...testGoal, currentSavings: 2000, remainingBalance: 0, progressPct: 1.0, status: 'COMPLETED' };
  const completedAdvice = AIService.generateHeuristicAdvice(completedGoal);
  assert(completedAdvice.includes('Congratulations') && completedAdvice.includes('100%'), 'Completed advice congratulates user');

  // 4. Validate UI Template (AIAdviceModal.html)
  const modalPath = path.join(__dirname, '..', 'src', 'UI', 'AIAdviceModal.html');
  assert(fs.existsSync(modalPath), 'AIAdviceModal.html exists');

  const modalHtml = fs.readFileSync(modalPath, 'utf8');
  assert(modalHtml.includes('id="goalSelector"'), 'Modal contains goal selector dropdown');
  assert(modalHtml.includes('id="cardTarget"'), 'Modal displays Target amount');
  assert(modalHtml.includes('id="cardSaved"'), 'Modal displays Saved amount');
  assert(modalHtml.includes('id="cardProgressFill"'), 'Modal contains dynamic progress bar');
  assert(modalHtml.includes('id="analyzeBtn"'), 'Modal contains action button for AI generation');
  assert(modalHtml.includes('id="adviceContainer"'), 'Modal contains advice display box');
  assert(modalHtml.includes('getAIAdviceForGoal'), 'Modal calls backend getAIAdviceForGoal');
  assert(modalHtml.includes('promptSetApiKey'), 'Modal allows configuring Groq API key');

  // 5. Validate Main.js and Setup.js Integration
  const mainContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'Main.js'), 'utf8');
  assert(mainContent.includes('showAIAdviceModal'), 'Main.js implements showAIAdviceModal');
  assert(mainContent.includes('Configure Groq API Key'), 'Main.js menu includes Groq API key configuration option');
  assert(mainContent.includes('promptConfigureGroqKey'), 'Main.js implements promptConfigureGroqKey');

  const setupContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'Setup.js'), 'utf8');
  assert(setupContent.includes('verifyPhase4Setup'), 'Setup.js contains verifyPhase4Setup diagnostic');

  console.log(`\n📊 Test Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 Phase 4 Implementation Verified Successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase4Tests();
