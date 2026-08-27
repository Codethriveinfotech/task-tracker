/**
 * Admin Reports & Management Module for Google Apps Script
 */

/**
 * Fetch reports for all employees with filtering options
 */
function getAllReports(token, filters) {
  var admin = validateSession(token);
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized access. Admin privilege required." };
  }

  filters = filters || {};
  var allReports = [];
  var todayStr = formatDateISO(new Date());

  var todaySummary = {
    totalEmployees: CONFIG.EMPLOYEES.length,
    submittedToday: 0,
    pendingToday: 0,
    statusCountsToday: {
      "Completed": 0,
      "In Progress": 0,
      "Pending": 0,
      "Leave": 0,
      "Holiday": 0
    },
    employeeTodayStatus: []
  };

  for (var i = 0; i < CONFIG.EMPLOYEES.length; i++) {
    var emp = CONFIG.EMPLOYEES[i];
    var sheet = getOrCreateSheet(emp.name);
    var data = sheet.getDataRange().getValues();
    var hasSubmittedToday = false;
    var todayStatus = "Not Submitted";

    for (var j = 1; j < data.length; j++) {
      var row = data[j];
      if (!row[0] && !row[1]) continue;

      var rowDateStr = row[1] ? formatDateISO(new Date(row[1])) : "";

      if (rowDateStr === todayStr) {
        hasSubmittedToday = true;
        todayStatus = row[4] || "Submitted";
        if (todaySummary.statusCountsToday[todayStatus] !== undefined) {
          todaySummary.statusCountsToday[todayStatus]++;
        }
      }

      // Filter matching
      var matchEmployee = !filters.employeeId || filters.employeeId === "ALL" || filters.employeeId === emp.id;
      var matchStatus = !filters.status || filters.status === "ALL" || filters.status === row[4];
      var matchFromDate = !filters.fromDate || rowDateStr >= filters.fromDate;
      var matchToDate = !filters.toDate || rowDateStr <= filters.toDate;
      var matchSearch = !filters.search || 
        (row[3] && row[3].toString().toLowerCase().indexOf(filters.search.toLowerCase()) !== -1) ||
        (row[5] && row[5].toString().toLowerCase().indexOf(filters.search.toLowerCase()) !== -1);

      if (matchEmployee && matchStatus && matchFromDate && matchToDate && matchSearch) {
        allReports.push({
          id: emp.id + "_" + (j + 1),
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          sheetName: emp.name,
          rowIndex: j + 1,
          timestamp: row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") : "",
          date: rowDateStr,
          day: row[2] || "",
          workDone: row[3] || "",
          status: row[4] || "",
          remarks: row[5] || "",
          auditLog: row[6] || ""
        });
      }
    }

    if (hasSubmittedToday) {
      todaySummary.submittedToday++;
    } else {
      todaySummary.pendingToday++;
    }

    todaySummary.employeeTodayStatus.push({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      submitted: hasSubmittedToday,
      todayStatus: todayStatus
    });
  }

  // Sort descending by date
  allReports.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  return {
    success: true,
    reports: allReports,
    summary: todaySummary
  };
}

/**
 * Update an existing report entry with audit logging
 */
function updateReport(token, payload) {
  var admin = validateSession(token);
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Only admins can update reports." };
  }

  if (!payload || !payload.sheetName || !payload.rowIndex) {
    return { success: false, error: "Missing sheet name or row index for update." };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(payload.sheetName);
  if (!sheet) {
    return { success: false, error: "Target sheet tab not found." };
  }

  var rowIndex = parseInt(payload.rowIndex, 10);
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    return { success: false, error: "Invalid row index." };
  }

  var currentRow = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
  var origWorkDone = currentRow[3];
  var origStatus = currentRow[4];
  var origRemarks = currentRow[5];
  var origAudit = currentRow[6] || "";

  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  var newWorkDone = payload.workDone !== undefined ? payload.workDone.trim() : origWorkDone;
  var newStatus = payload.status !== undefined ? payload.status : origStatus;
  var newRemarks = payload.remarks !== undefined ? payload.remarks.trim() : origRemarks;
  var reason = payload.reason ? payload.reason.trim() : "Admin correction";

  var auditEntry = "[" + nowStr + " by Admin (" + admin.id + ")]: Status (" + origStatus + " -> " + newStatus + ") | Reason: " + reason;
  var updatedAuditLog = origAudit ? origAudit + "\n" + auditEntry : auditEntry;

  sheet.getRange(rowIndex, 4).setValue(newWorkDone);
  sheet.getRange(rowIndex, 5).setValue(newStatus);
  sheet.getRange(rowIndex, 6).setValue(newRemarks);
  sheet.getRange(rowIndex, 7).setValue(updatedAuditLog);

  return {
    success: true,
    message: "Report updated successfully by Admin.",
    updatedRecord: {
      sheetName: payload.sheetName,
      rowIndex: rowIndex,
      workDone: newWorkDone,
      status: newStatus,
      remarks: newRemarks,
      auditLog: updatedAuditLog
    }
  };
}

/**
 * Generate monthly summary per employee for selected Year-Month (YYYY-MM)
 */
function getMonthlySummary(token, yearMonth) {
  var admin = validateSession(token);
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized access." };
  }

  if (!yearMonth) {
    var now = new Date();
    yearMonth = formatDateISO(now).substring(0, 7); // e.g. "2026-08"
  }

  var employeeSummaries = [];

  for (var i = 0; i < CONFIG.EMPLOYEES.length; i++) {
    var emp = CONFIG.EMPLOYEES[i];
    var sheet = getOrCreateSheet(emp.name);
    var data = sheet.getDataRange().getValues();

    var counts = {
      reportingDays: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      leave: 0,
      holiday: 0
    };

    for (var j = 1; j < data.length; j++) {
      var row = data[j];
      if (!row[1]) continue;

      var rowDateStr = formatDateISO(new Date(row[1]));
      if (rowDateStr.substring(0, 7) === yearMonth) {
        counts.reportingDays++;
        var status = row[4];
        if (status === "Completed") counts.completed++;
        else if (status === "In Progress") counts.inProgress++;
        else if (status === "Pending") counts.pending++;
        else if (status === "Leave") counts.leave++;
        else if (status === "Holiday") counts.holiday++;
      }
    }

    employeeSummaries.push({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      yearMonth: yearMonth,
      metrics: counts
    });
  }

  return {
    success: true,
    yearMonth: yearMonth,
    summaries: employeeSummaries
  };
}
