/**
 * SaveIQ - Phase 1 Verification Test Suite
 * Validates manifest configuration, schema constants, and formula syntax.
 */

const fs = require('fs');
const path = require('path');

function runPhase1Tests() {
  console.log('🔍 Starting SaveIQ Phase 1 Verification Tests...\n');
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

  // 1. Check appsscript.json
  const manifestPath = path.join(__dirname, '..', 'src', 'appsscript.json');
  assert(fs.existsSync(manifestPath), 'appsscript.json exists');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.runtimeVersion === 'V8', 'Manifest specifies V8 runtime');
  assert(manifest.oauthScopes && manifest.oauthScopes.includes('https://www.googleapis.com/auth/spreadsheets'), 'Manifest includes spreadsheets OAuth scope');
  assert(manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request'), 'Manifest includes external_request OAuth scope');
  assert(manifest.oauthScopes.includes('https://www.googleapis.com/auth/gmail.send') || manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.send_mail'), 'Manifest includes email dispatch OAuth scope');

  // 2. Load Config.js
  const configPath = path.join(__dirname, '..', 'src', 'Config.js');
  assert(fs.existsSync(configPath), 'Config.js exists');

  const configContent = fs.readFileSync(configPath, 'utf8');
  // Evaluate Config in isolated context
  const sandbox = {};
  const fn = new Function('sandbox', `${configContent}; sandbox.CONFIG = CONFIG;`);
  fn(sandbox);
  const CONFIG = sandbox.CONFIG;

  assert(CONFIG !== undefined, 'CONFIG object loaded successfully');
  assert(Object.keys(CONFIG.SHEETS).length === 4, 'CONFIG contains 4 sheets (Dashboard, Goals, Audit_Logs, Config)');
  assert(CONFIG.SHEETS.GOALS === 'Goals', 'Goals sheet name configured');
  assert(CONFIG.SHEETS.DASHBOARD === 'Dashboard', 'Dashboard sheet name configured');
  assert(CONFIG.SHEETS.AUDIT_LOGS === 'Audit_Logs', 'Audit_Logs sheet name configured');
  assert(CONFIG.SHEETS.CONFIG === 'Config', 'Config sheet name configured');

  // 3. Check Goals Column count
  const columnCount = Object.keys(CONFIG.GOALS_COLUMNS).length;
  assert(columnCount === 15, `Goals schema has 15 columns (Found: ${columnCount})`);
  assert(CONFIG.GOALS_COLUMNS.GOAL_ID === 1, 'Column A is Goal_ID');
  assert(CONFIG.GOALS_COLUMNS.CREATED_AT === 15, 'Column O is Created_At');

  // 4. Validate Formula Generators
  const r = 2;
  const remBalFormula = CONFIG.FORMULAS.REMAINING_BALANCE(r);
  assert(remBalFormula.includes(`D${r}-E${r}`), `Remaining balance formula for row ${r}: ${remBalFormula}`);

  const progFormula = CONFIG.FORMULAS.PROGRESS_PERCENTAGE(r);
  assert(progFormula.includes(`E${r}/D${r}`), `Progress % formula for row ${r}: ${progFormula}`);

  const daysFormula = CONFIG.FORMULAS.DAYS_REMAINING(r);
  assert(daysFormula.includes(`DATEDIF(TODAY(), H${r}`), `Days remaining formula for row ${r}: ${daysFormula}`);

  const dailyRateFormula = CONFIG.FORMULAS.REQUIRED_DAILY_RATE(r);
  assert(dailyRateFormula.includes(`F${r}/I${r}`), `Daily required rate formula for row ${r}: ${dailyRateFormula}`);

  const statusFormula = CONFIG.FORMULAS.STATUS(r);
  assert(statusFormula.includes('NEARING_DEADLINE') && statusFormula.includes('COMPLETED') && statusFormula.includes('OVERDUE'), 'Status lifecycle formula covers all states');

  // 5. Check Setup.js file
  const setupPath = path.join(__dirname, '..', 'src', 'Setup.js');
  assert(fs.existsSync(setupPath), 'Setup.js exists');
  const setupContent = fs.readFileSync(setupPath, 'utf8');
  assert(setupContent.includes('initializeSaveIQDatabase'), 'Setup.js contains initializeSaveIQDatabase function');
  assert(setupContent.includes('verifyPhase1Setup'), 'Setup.js contains verifyPhase1Setup function');
  assert(setupContent.includes('populateSampleGoals'), 'Setup.js includes sample data generator');

  console.log(`\n📊 Test Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 Phase 1 Implementation Verified Successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase1Tests();
