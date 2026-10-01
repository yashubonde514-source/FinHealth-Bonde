/**
 * SaveIQ - Phase 3 Verification Test Suite
 * Validates Dashboard formulas, category allocation logic, sparklines, chart definitions, and conditional formatting.
 */

const fs = require('fs');
const path = require('path');

function runPhase3Tests() {
  console.log('🔍 Starting SaveIQ Phase 3 Verification Tests...\n');
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

  // 1. Check Config and Dashboard Formulas
  const configPath = path.join(__dirname, '..', 'src', 'Config.js');
  assert(fs.existsSync(configPath), 'Config.js exists');

  const configContent = fs.readFileSync(configPath, 'utf8');
  const sandbox = {};
  const fn = new Function('sandbox', `${configContent}; sandbox.CONFIG = CONFIG;`);
  fn(sandbox);
  const CONFIG = sandbox.CONFIG;

  assert(CONFIG.DASHBOARD_FORMULAS !== undefined, 'DASHBOARD_FORMULAS object exists in Config.js');
  assert(CONFIG.DASHBOARD_FORMULAS.TOTAL_GOALS.includes('COUNTA(Goals!A2:A)'), 'Total goals formula uses COUNTA on Goals');
  assert(CONFIG.DASHBOARD_FORMULAS.TOTAL_TARGET.includes('SUM(Goals!D2:D)'), 'Total target formula sums Column D');
  assert(CONFIG.DASHBOARD_FORMULAS.TOTAL_SAVED.includes('SUM(Goals!E2:E)'), 'Total saved formula sums Column E');
  assert(CONFIG.DASHBOARD_FORMULAS.ACTIVE_GOALS.includes('ACTIVE') && CONFIG.DASHBOARD_FORMULAS.ACTIVE_GOALS.includes('NEARING_DEADLINE'), 'Active goals formula counts ACTIVE and NEARING_DEADLINE');
  assert(CONFIG.DASHBOARD_FORMULAS.COMPLETED_GOALS.includes('COMPLETED'), 'Completed goals formula counts COMPLETED');
  assert(CONFIG.DASHBOARD_FORMULAS.OVERDUE_GOALS.includes('OVERDUE'), 'Overdue goals formula counts OVERDUE');

  // 2. Validate Category Breakdown Formula Generators
  const targetFn = CONFIG.DASHBOARD_FORMULAS.CATEGORY_TARGET('B12');
  assert(targetFn.includes('SUMIF(Goals!$C$2:$C, B12, Goals!$D$2:$D)'), `Category Target formula: ${targetFn}`);

  const savedFn = CONFIG.DASHBOARD_FORMULAS.CATEGORY_SAVED('B12');
  assert(savedFn.includes('SUMIF(Goals!$C$2:$C, B12, Goals!$E$2:$E)'), `Category Saved formula: ${savedFn}`);

  const deficitFn = CONFIG.DASHBOARD_FORMULAS.CATEGORY_DEFICIT('C12', 'D12');
  assert(deficitFn.includes('MAX(0, C12-D12)'), `Category Deficit formula: ${deficitFn}`);

  const sparklineFn = CONFIG.DASHBOARD_FORMULAS.CATEGORY_SPARKLINE('C12', 'D12');
  assert(sparklineFn.includes('SPARKLINE(D12') && sparklineFn.includes('"max",C12'), `Category Sparkline bar formula: ${sparklineFn}`);

  // 3. Check DashboardService.js
  const dashServicePath = path.join(__dirname, '..', 'src', 'DashboardService.js');
  assert(fs.existsSync(dashServicePath), 'DashboardService.js exists');

  const dashContent = fs.readFileSync(dashServicePath, 'utf8');
  assert(dashContent.includes('setupDashboard:'), 'DashboardService implements setupDashboard');
  assert(dashContent.includes('renderKpiCard:'), 'DashboardService implements renderKpiCard');
  assert(dashContent.includes('embedCharts:'), 'DashboardService implements embedCharts');
  assert(dashContent.includes('applyConditionalFormatting:'), 'DashboardService implements applyConditionalFormatting');
  assert(dashContent.includes('refreshDashboard:'), 'DashboardService implements refreshDashboard');

  // 4. Check Chart Specifications
  assert(dashContent.includes('asPieChart()') && dashContent.includes('pieHole'), 'Category Donut chart configured with pieHole');
  assert(dashContent.includes('asColumnChart()'), 'Target vs. Saved Column chart configured');

  // 5. Check Conditional Formatting Badges
  assert(dashContent.includes('#DCFCE7') && dashContent.includes('#166534'), 'Completed badge uses soft emerald theme');
  assert(dashContent.includes('#DBEAFE') && dashContent.includes('#1E40AF'), 'Active badge uses soft blue theme');
  assert(dashContent.includes('#FEF3C7') && dashContent.includes('#92400E'), 'Nearing deadline badge uses soft amber theme');
  assert(dashContent.includes('#FEE2E2') && dashContent.includes('#991B1B'), 'Overdue badge uses soft red theme');

  // 6. Check Main.js & Setup.js Integration
  const mainContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'Main.js'), 'utf8');
  assert(mainContent.includes('Refresh Dashboard'), 'Main.js menu includes Refresh Dashboard item');

  const setupContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'Setup.js'), 'utf8');
  assert(setupContent.includes('DashboardService.setupDashboard'), 'Setup.js invokes DashboardService.setupDashboard');
  assert(setupContent.includes('verifyPhase3Setup'), 'Setup.js contains verifyPhase3Setup function');

  console.log(`\n📊 Test Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 Phase 3 Implementation Verified Successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase3Tests();
