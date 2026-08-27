/**
 * WorkPulse Google Apps Script — Google Sheets as Primary Database
 *
 * ONE WORKBOOK — ONE TAB PER MONTH
 * All report CRUD operations happen here. Users/Auth stay in SQLite.
 *
 * ─── SETUP ──────────────────────────────────────────────────────────────────
 * 1. Open your "WorkPulse Reports" Google Sheet
 * 2. Extensions → Apps Script → paste this file → Save
 * 3. Deploy → New Deployment → Web App (Execute as: Me, Access: Anyone)
 * 4. Copy URL → paste in backend/.env as GOOGLE_SHEET_URL=<url>
 * 5. Restart backend (npm start)
 * ────────────────────────────────────────────────────────────────────────────
 */

// Column order in the sheet (1-based index for getRange)
const COLS = {
  TIMESTAMP : 1,
  DATE      : 2,
  DAY       : 3,
  EMP_ID    : 4,
  EMP_NAME  : 5,
  DEPT      : 6,
  WORK_DONE : 7,
  STATUS    : 8,
  REMARKS   : 9,
  REPORT_ID : 10,
  AUDIT_LOG : 11
};
const NUM_COLS = 11;

const HEADERS = [
  "Timestamp","Date","Day",
  "Employee ID","Employee Name","Department",
  "Work Done","Status","Remarks",
  "Report ID","Audit Log"
];

// ─── ROUTER ────────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;
    switch (data.action) {
      case "submitReport":      result = submitReport(data);      break;
      case "getTodayReport":    result = getTodayReport(data);    break;
      case "getMyReports":      result = getMyReports(data);      break;
      case "getAllReports":     result = getAllReports(data);     break;
      case "updateReport":      result = updateReport(data);      break;
      case "getMonthlySummary": result = getMonthlySummary(data); break;
      default: result = { success: false, error: "Unknown action: " + data.action };
    }
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
function getOrCreateMonthTab(dateStr) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const d    = new Date(dateStr);
  const name = d.toLocaleString("en-US", { month: "short", year: "numeric" });

  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const hdr = sheet.getRange(1, 1, 1, NUM_COLS);
    hdr.setValues([HEADERS]);
    hdr.setFontWeight("bold");
    hdr.setBackground("#1e40af");
    hdr.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(COLS.WORK_DONE, 320);
    sheet.setColumnWidth(COLS.REMARKS,   180);
    sheet.setColumnWidth(COLS.AUDIT_LOG, 240);
  }
  return sheet;
}

function rowToObj(row) {
  return {
    timestamp:    row[0] || "",
    date:         row[1] || "",
    day:          row[2] || "",
    employeeId:   row[3] || "",
    employeeName: row[4] || "",
    department:   row[5] || "",
    workDone:     row[6] || "",
    status:       row[7] || "",
    remarks:      row[8] || "",
    id:           row[9] || "",
    auditLog:     row[10] || ""
  };
}

function getAllRows() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const all    = [];
  sheets.forEach(sh => {
    const last = sh.getLastRow();
    if (last < 2) return;
    const data = sh.getRange(2, 1, last - 1, NUM_COLS).getValues();
    data.forEach(row => { if (row[9]) all.push(rowToObj(row)); }); // must have Report ID
  });
  return all;
}

// ─── ACTIONS ───────────────────────────────────────────────────────────────

function submitReport(data) {
  const today = new Date().toISOString().substring(0, 10);
  const sheet = getOrCreateMonthTab(today);
  const last  = sheet.getLastRow();

  // Duplicate check
  if (last >= 2) {
    const rows = sheet.getRange(2, COLS.EMP_ID, last - 1, 2).getValues(); // [empId, date] — wait, wrong
    const dateCol = sheet.getRange(2, COLS.DATE,   last - 1, 1).getValues();
    const empCol  = sheet.getRange(2, COLS.EMP_ID, last - 1, 1).getValues();
    for (let i = 0; i < dateCol.length; i++) {
      if (dateCol[i][0] === today && empCol[i][0] === data.employeeId) {
        return { success: false, isDuplicate: true, error: "You have already submitted today's work report. Modifications are not allowed." };
      }
    }
  }

  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const now  = new Date();
  const ts   = now.toISOString().replace("T", " ").substring(0, 19);
  const id   = data.employeeId + "_" + now.getTime();

  const row = [
    ts, today, DAYS[now.getDay()],
    data.employeeId, data.employeeName, data.department,
    data.workDone, data.status || "Completed", data.remarks || "—",
    id, ""
  ];
  sheet.appendRow(row);
  return { success: true, message: "Daily work report submitted successfully!", record: rowToObj(row) };
}

function getTodayReport(data) {
  const today = new Date().toISOString().substring(0, 10);
  const sheet = getOrCreateMonthTab(today);
  const last  = sheet.getLastRow();
  if (last < 2) return { success: true, hasSubmitted: false, report: null };

  const rows = sheet.getRange(2, 1, last - 1, NUM_COLS).getValues();
  for (const row of rows) {
    if (row[1] === today && row[3] === data.employeeId) {
      return { success: true, hasSubmitted: true, report: rowToObj(row) };
    }
  }
  return { success: true, hasSubmitted: false, report: null };
}

function getMyReports(data) {
  const all = getAllRows().filter(r => r.employeeId === data.employeeId);
  all.sort((a, b) => b.date.localeCompare(a.date));
  return { success: true, reports: all };
}

function getAllReports(data) {
  let all = getAllRows();
  const f = data.filters || {};

  if (f.employeeId && f.employeeId !== "ALL") all = all.filter(r => r.employeeId === f.employeeId);
  if (f.status     && f.status     !== "ALL") all = all.filter(r => r.status     === f.status);
  if (f.fromDate)  all = all.filter(r => r.date >= f.fromDate);
  if (f.toDate)    all = all.filter(r => r.date <= f.toDate);
  if (f.search) {
    const s = f.search.toLowerCase();
    all = all.filter(r =>
      r.workDone.toLowerCase().includes(s) ||
      r.remarks.toLowerCase().includes(s)  ||
      r.employeeName.toLowerCase().includes(s)
    );
  }
  all.sort((a, b) => b.date.localeCompare(a.date));

  // Today summary
  const today      = new Date().toISOString().substring(0, 10);
  const todayRows  = getAllRows().filter(r => r.date === today);
  const submittedIds = new Set(todayRows.map(r => r.employeeId));
  const counts = { Completed: 0, "In Progress": 0, Pending: 0, Leave: 0, Holiday: 0 };
  todayRows.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return {
    success: true,
    reports: all,
    todayRows: todayRows,
    sheetSummary: { submittedToday: submittedIds.size, statusCountsToday: counts, submittedIds: [...submittedIds] }
  };
}

function updateReport(data) {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  for (const sheet of sheets) {
    const last = sheet.getLastRow();
    if (last < 2) continue;

    const idCol = sheet.getRange(2, COLS.REPORT_ID, last - 1, 1).getValues();
    for (let i = 0; i < idCol.length; i++) {
      if (idCol[i][0] !== data.id) continue;

      const row    = i + 2;
      const orig   = rowToObj(sheet.getRange(row, 1, 1, NUM_COLS).getValues()[0]);
      const now    = new Date().toISOString().replace("T"," ").substring(0,19);
      const entry  = `[${now} by Admin]: Status (${orig.status} → ${data.status}) | Reason: ${data.reason || "Admin update"}`;
      const newLog = orig.auditLog ? orig.auditLog + "\n" + entry : entry;

      sheet.getRange(row, COLS.WORK_DONE).setValue(data.workDone  ?? orig.workDone);
      sheet.getRange(row, COLS.STATUS)   .setValue(data.status    ?? orig.status);
      sheet.getRange(row, COLS.REMARKS)  .setValue(data.remarks   ?? orig.remarks);
      sheet.getRange(row, COLS.AUDIT_LOG).setValue(newLog);

      const updated = rowToObj(sheet.getRange(row, 1, 1, NUM_COLS).getValues()[0]);
      return { success: true, message: "Report updated successfully by Admin.", updatedRecord: updated };
    }
  }
  return { success: false, error: "Report not found in Google Sheet." };
}

function getMonthlySummary(data) {
  const ym   = data.yearMonth || new Date().toISOString().substring(0, 7);
  const rows = getAllRows().filter(r => r.date && r.date.startsWith(ym));
  return { success: true, yearMonth: ym, reports: rows };
}

// ─── TEST ──────────────────────────────────────────────────────────────────
function testSubmit() {
  const result = submitReport({
    employeeId   : "EMP001",
    employeeName : "jiju",
    department   : "IT",
    workDone     : "Testing Google Sheet as primary database from Apps Script.",
    status       : "Completed",
    remarks      : "Setup verification"
  });
  Logger.log(JSON.stringify(result));
}
