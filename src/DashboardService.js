/**
 * SaveIQ – AI Savings Goal Tracker
 * Phase 3: Financial Dashboard & Metrics Engine (Scenario 4)
 * 
 * Generates an executive visual analytics dashboard with real-time KPI cards,
 * category allocation breakdown, sparklines, embedded charts, and conditional formatting.
 */

const DashboardService = {
  /**
   * Main builder: Sets up the entire Dashboard sheet
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   */
  setupDashboard: function(sheet) {
    if (!sheet) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      sheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
      if (!sheet) return;
    }

    // 1. Clear previous content, formatting, and charts
    sheet.clear();
    const existingCharts = sheet.getCharts();
    existingCharts.forEach(function(c) { sheet.removeChart(c); });

    // 2. Set grid properties & column widths
    sheet.setColumnWidth(1, 24);   // Col A (Margin spacer)
    sheet.setColumnWidth(2, 130);  // Col B
    sheet.setColumnWidth(3, 130);  // Col C
    sheet.setColumnWidth(4, 130);  // Col D
    sheet.setColumnWidth(5, 130);  // Col E
    sheet.setColumnWidth(6, 130);  // Col F
    sheet.setColumnWidth(7, 130);  // Col G
    sheet.setColumnWidth(8, 140);  // Col H
    sheet.setColumnWidth(9, 140);  // Col I

    // 3. Render Dashboard Header Banner
    sheet.getRange('B1:I1').merge()
      .setValue('⚡ SaveIQ – Executive Financial Performance Dashboard')
      .setFontSize(16)
      .setFontWeight('bold')
      .setFontColor('#0F172A')
      .setVerticalAlignment('middle');

    sheet.getRange('B2:I2').merge()
      .setValue('Real-time savings velocity, portfolio completion rate, and category distribution.')
      .setFontSize(10)
      .setFontColor('#64748B')
      .setVerticalAlignment('top');

    // 4. Render KPI Cards Grid (Row 4 & Row 7)
    // Row 4: Primary Totals
    this.renderKpiCard(sheet, 'B4', 'C5', 'TOTAL GOALS', CONFIG.DASHBOARD_FORMULAS.TOTAL_GOALS, '#EEF2FF', '#4F46E5', '#,##0');
    this.renderKpiCard(sheet, 'D4', 'E5', 'TOTAL TARGET CAPITAL', CONFIG.DASHBOARD_FORMULAS.TOTAL_TARGET, '#F0FDF4', '#16A34A', '$#,##0.00');
    this.renderKpiCard(sheet, 'F4', 'G5', 'TOTAL SAVED TO DATE', CONFIG.DASHBOARD_FORMULAS.TOTAL_SAVED, '#ECFEFF', '#0891B2', '$#,##0.00');
    this.renderKpiCard(sheet, 'H4', 'I5', 'OVERALL PROGRESS', CONFIG.DASHBOARD_FORMULAS.OVERALL_PROGRESS, '#FAF5FF', '#9333EA', '0.0%');

    // Row 7: Lifecycle Breakdown & Velocity
    this.renderKpiCard(sheet, 'B7', 'C8', 'ACTIVE GOALS', CONFIG.DASHBOARD_FORMULAS.ACTIVE_GOALS, '#F8FAFC', '#2563EB', '#,##0');
    this.renderKpiCard(sheet, 'D7', 'E8', 'COMPLETED GOALS', CONFIG.DASHBOARD_FORMULAS.COMPLETED_GOALS, '#F0FDF4', '#15803D', '#,##0');
    this.renderKpiCard(sheet, 'F7', 'G8', 'OVERDUE GOALS', CONFIG.DASHBOARD_FORMULAS.OVERDUE_GOALS, '#FEF2F2', '#DC2626', '#,##0');
    this.renderKpiCard(sheet, 'H7', 'I8', 'REQUIRED DAILY VELOCITY', CONFIG.DASHBOARD_FORMULAS.TOTAL_DAILY_RATE, '#FFFBEB', '#D97706', '$#,##0.00');

    // 5. Category Allocation Breakdown Table (Rows 10 - 16)
    sheet.getRange('B10:G10').merge()
      .setValue('📂 Category Allocation & Progress')
      .setFontSize(12)
      .setFontWeight('bold')
      .setFontColor('#1E293B');

    const catHeaders = ['Category', 'Target Amount', 'Current Saved', 'Remaining Deficit', 'Progress %', 'Allocation Bar'];
    const catHeaderRange = sheet.getRange(11, 2, 1, catHeaders.length);
    catHeaderRange.setValues([catHeaders])
      .setBackground('#1E293B')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(10)
      .setHorizontalAlignment('center');

    // Populate rows for each category
    const startRow = 12;
    CONFIG.CATEGORIES.forEach((cat, idx) => {
      const r = startRow + idx;
      sheet.getRange(r, 2).setValue(cat).setFontWeight('bold');
      sheet.getRange(r, 3).setFormula(CONFIG.DASHBOARD_FORMULAS.CATEGORY_TARGET(`B${r}`));
      sheet.getRange(r, 4).setFormula(CONFIG.DASHBOARD_FORMULAS.CATEGORY_SAVED(`B${r}`));
      sheet.getRange(r, 5).setFormula(CONFIG.DASHBOARD_FORMULAS.CATEGORY_DEFICIT(`C${r}`, `D${r}`));
      sheet.getRange(r, 6).setFormula(CONFIG.DASHBOARD_FORMULAS.CATEGORY_PROGRESS(`C${r}`, `D${r}`));
      sheet.getRange(r, 7).setFormula(CONFIG.DASHBOARD_FORMULAS.CATEGORY_SPARKLINE(`C${r}`, `D${r}`));
    });

    // Formatting Category Table
    sheet.getRange('C12:E16').setNumberFormat(CONFIG.THRESHOLDS.DEFAULT_CURRENCY_FORMAT);
    sheet.getRange('F12:F16').setNumberFormat(CONFIG.THRESHOLDS.PERCENT_FORMAT);
    sheet.getRange('B12:G16').setBorder(true, true, true, true, true, true, '#E2E8F0', SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange('B12:G16').setBackground('#FFFFFF');

    // 6. Embed Native Charts
    this.embedCharts(sheet);

    // 7. Apply Conditional Formatting
    this.applyConditionalFormatting();

    SpreadsheetApp.flush();
    Logger.log('✅ SaveIQ Dashboard successfully rendered.');
  },

  /**
   * Helper to render a styled KPI card block
   */
  renderKpiCard: function(sheet, topLeftCell, bottomRightCell, label, formulaOrValue, bgColor, textColor, numberFormat) {
    const range = sheet.getRange(`${topLeftCell}:${bottomRightCell}`);
    range.setBackground(bgColor);
    range.setBorder(true, true, true, true, false, false, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);

    // Label cell
    sheet.getRange(topLeftCell)
      .setValue(label)
      .setFontSize(9)
      .setFontWeight('bold')
      .setFontColor('#64748B')
      .setHorizontalAlignment('center');

    // Value cell
    sheet.getRange(bottomRightCell)
      .setFormula(formulaOrValue)
      .setFontSize(16)
      .setFontWeight('bold')
      .setFontColor(textColor)
      .setHorizontalAlignment('center')
      .setNumberFormat(numberFormat);
  },

  /**
   * Embed Category Donut Chart & Target vs. Actual Column Chart
   */
  embedCharts: function(sheet) {
    try {
      // 1. Donut Chart: Target Allocation by Category
      const donutRange = sheet.getRange('B11:C16');
      const donutChart = sheet.newChart()
        .asPieChart()
        .addRange(donutRange)
        .setTitle('Target Allocation by Category')
        .set3D()
        .setPosition(10, 9, 0, 0) // Row 10, Col I
        .setOption('pieHole', 0.45)
        .setOption('width', 460)
        .setOption('height', 240)
        .setOption('colors', ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'])
        .build();

      sheet.insertChart(donutChart);

      // 2. Column Chart: Target vs. Current Saved by Category
      const barRange = sheet.getRange('B11:D16');
      const columnChart = sheet.newChart()
        .asColumnChart()
        .addRange(barRange)
        .setTitle('Category Target vs. Current Saved')
        .setPosition(18, 2, 0, 0) // Row 18, Col B
        .setOption('width', 940)
        .setOption('height', 280)
        .setOption('colors', ['#4F46E5', '#10B981'])
        .setOption('legend', { position: 'top' })
        .build();

      sheet.insertChart(columnChart);
    } catch (err) {
      Logger.log('Chart embedding notice: ' + err.message);
    }
  },

  /**
   * Apply status chip conditional formatting to Goals and Dashboard sheets
   */
  applyConditionalFormatting: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const goalsSheet = ss.getSheetByName(CONFIG.SHEETS.GOALS);
    if (!goalsSheet) return;

    // Rules for Column K in Goals sheet
    const statusRange = goalsSheet.getRange('K2:K500');

    // Rule 1: COMPLETED -> Soft Emerald Green
    const ruleCompleted = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(CONFIG.STATUSES.COMPLETED)
      .setBackground('#DCFCE7')
      .setFontColor('#166534')
      .setBold(true)
      .setRanges([statusRange])
      .build();

    // Rule 2: ACTIVE -> Soft Blue
    const ruleActive = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(CONFIG.STATUSES.ACTIVE)
      .setBackground('#DBEAFE')
      .setFontColor('#1E40AF')
      .setBold(true)
      .setRanges([statusRange])
      .build();

    // Rule 3: NEARING_DEADLINE -> Soft Amber
    const ruleNearing = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(CONFIG.STATUSES.NEARING_DEADLINE)
      .setBackground('#FEF3C7')
      .setFontColor('#92400E')
      .setBold(true)
      .setRanges([statusRange])
      .build();

    // Rule 4: OVERDUE -> Soft Red
    const ruleOverdue = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(CONFIG.STATUSES.OVERDUE)
      .setBackground('#FEE2E2')
      .setFontColor('#991B1B')
      .setBold(true)
      .setRanges([statusRange])
      .build();

    // Rule 5: Progress Percentage Gradient (Column G)
    const progressRange = goalsSheet.getRange('G2:G500');
    const ruleProgress100 = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(1.0)
      .setBackground('#DCFCE7')
      .setFontColor('#166534')
      .setBold(true)
      .setRanges([progressRange])
      .build();

    goalsSheet.setConditionalFormatRules([
      ruleCompleted,
      ruleActive,
      ruleNearing,
      ruleOverdue,
      ruleProgress100
    ]);
  },

  /**
   * Refreshes the dashboard and displays user toast notification
   */
  refreshDashboard: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
    if (!sheet) {
      initializeSaveIQDatabase();
    } else {
      this.setupDashboard(sheet);
    }
    SpreadsheetApp.getActiveSpreadsheet().toast('Dashboard KPIs and visual charts updated!', 'SaveIQ Dashboard', 3);
  }
};

/**
 * Global function callable from menus or buttons
 */
function refreshDashboard() {
  DashboardService.refreshDashboard();
}
