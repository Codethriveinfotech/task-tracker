/**
 * Configuration & Constant Definitions for Employee Work Reporting System
 */

// Paste your Google Spreadsheet ID here (leave empty to use SpreadsheetApp.getActiveSpreadsheet())
var CONFIG = {
  SPREADSHEET_ID: "", // e.g. "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  
  ADMIN_CREDENTIALS: {
    username: "ADMIN001",
    password: "admin123",
    name: "System Admin",
    role: "ADMIN"
  },
  
  // Roster of Employees (4 IT, 2 Non-IT)
  EMPLOYEES: [
    { id: "EMP001", name: "Employee 1", department: "IT", password: "emp123" },
    { id: "EMP002", name: "Employee 2", department: "IT", password: "emp123" },
    { id: "EMP003", name: "Employee 3", department: "IT", password: "emp123" },
    { id: "EMP004", name: "Employee 4", department: "IT", password: "emp123" },
    { id: "EMP005", name: "Employee 5", department: "Non-IT", password: "emp123" },
    { id: "EMP006", name: "Employee 6", department: "Non-IT", password: "emp123" }
  ],

  // Valid Status Options
  STATUS_OPTIONS: [
    "Completed",
    "In Progress",
    "Pending",
    "Leave",
    "Holiday"
  ],

  // Required headers in every employee sheet
  HEADERS: [
    "Timestamp",
    "Date",
    "Day",
    "Work Done / Activities",
    "Status",
    "Issues / Remarks",
    "Audit Log"
  ]
};

/**
 * Helper to retrieve the active Spreadsheet object
 */
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Ensures employee tab exists with proper headers
 */
function getOrCreateSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(CONFIG.HEADERS);
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}
