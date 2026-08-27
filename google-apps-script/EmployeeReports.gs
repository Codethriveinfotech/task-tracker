/**
 * Employee Reports Handler for Google Apps Script
 */

/**
 * Format Date object to YYYY-MM-DD
 */
function formatDateISO(date) {
  var d = new Date(date);
  var month = '' + (d.getMonth() + 1);
  var day = '' + d.getDate();
  var year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

/**
 * Get Day Name
 */
function getDayName(date) {
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
}

/**
 * Submit daily report for authenticated employee
 */
function submitDailyReport(token, payload) {
  var user = validateSession(token);
  if (!user || user.role !== "EMPLOYEE") {
    return { success: false, error: "Unauthorized access. Invalid employee session." };
  }

  if (!payload || !payload.workDone || !payload.status) {
    return { success: false, error: "Work Done and Status are required fields." };
  }

  // Validate status
  if (CONFIG.STATUS_OPTIONS.indexOf(payload.status) === -1) {
    return { success: false, error: "Invalid status value provided." };
  }

  var now = new Date();
  var todayDateStr = formatDateISO(now);
  var dayName = getDayName(now);
  var timestampStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  // Destination sheet is employee's name (e.g., "Employee 1")
  var sheet = getOrCreateSheet(user.name);
  var data = sheet.getDataRange().getValues();

  // Check for duplicate submission (Row index starts at 1, header is index 0)
  for (var i = 1; i < data.length; i++) {
    var existingDate = data[i][1]; // Column 2 is Date
    if (existingDate) {
      var formattedExisting = formatDateISO(new Date(existingDate));
      if (formattedExisting === todayDateStr) {
        return { 
          success: false, 
          isDuplicate: true,
          error: "You have already submitted today's work report. Modifications are not allowed." 
        };
      }
    }
  }

  // Row columns: Timestamp | Date | Day | Work Done / Activities | Status | Issues / Remarks | Audit Log
  var newRow = [
    timestampStr,
    todayDateStr,
    dayName,
    payload.workDone.trim(),
    payload.status,
    payload.remarks ? payload.remarks.trim() : "—",
    "" // Initial Audit Log empty
  ];

  sheet.appendRow(newRow);

  return {
    success: true,
    message: "Daily work report submitted successfully!",
    record: {
      timestamp: timestampStr,
      date: todayDateStr,
      day: dayName,
      workDone: payload.workDone.trim(),
      status: payload.status,
      remarks: payload.remarks ? payload.remarks.trim() : "—",
      employeeName: user.name,
      employeeId: user.id
    }
  };
}

/**
 * Get all historical reports for authenticated employee
 */
function getMyReports(token) {
  var user = validateSession(token);
  if (!user || user.role !== "EMPLOYEE") {
    return { success: false, error: "Unauthorized access." };
  }

  var sheet = getOrCreateSheet(user.name);
  var data = sheet.getDataRange().getValues();
  var reports = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] || row[1]) {
      reports.push({
        rowIndex: i + 1,
        timestamp: row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") : "",
        date: row[1] ? formatDateISO(new Date(row[1])) : "",
        day: row[2] || "",
        workDone: row[3] || "",
        status: row[4] || "",
        remarks: row[5] || "",
        auditLog: row[6] || ""
      });
    }
  }

  // Sort descending by date
  reports.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  return {
    success: true,
    employee: user,
    reports: reports
  };
}

/**
 * Check if employee submitted today
 */
function getTodayReport(token) {
  var user = validateSession(token);
  if (!user || user.role !== "EMPLOYEE") {
    return { success: false, error: "Unauthorized access." };
  }

  var todayDateStr = formatDateISO(new Date());
  var sheet = getOrCreateSheet(user.name);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[1]) {
      var formatted = formatDateISO(new Date(row[1]));
      if (formatted === todayDateStr) {
        return {
          success: true,
          hasSubmitted: true,
          report: {
            rowIndex: i + 1,
            timestamp: row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") : "",
            date: formatted,
            day: row[2] || "",
            workDone: row[3] || "",
            status: row[4] || "",
            remarks: row[5] || ""
          }
        };
      }
    }
  }

  return {
    success: true,
    hasSubmitted: false,
    report: null
  };
}
