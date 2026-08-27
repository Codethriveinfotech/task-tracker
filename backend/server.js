const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL || "";

app.use(cors());
app.use(express.json({ type: ['application/json', 'text/plain'] }));

/**
 * Silently sync a report to Google Sheets in the background (non-blocking).
 * action = "appendRow" | "updateRow"
 */
function syncToSheet(action, record) {
  if (!GOOGLE_SHEET_URL) return;
  fetch(GOOGLE_SHEET_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action, ...record })
  }).catch(err => console.warn("[Sheet Sync] Failed:", err.message));
}

// Token utility helpers
function verifyToken(token, callback) {
  if (!token) return callback(null, null);

  if (token.startsWith('mock_token_')) {
    const withoutPrefix = token.slice('mock_token_'.length);
    const lastUnder = withoutPrefix.lastIndexOf('_');
    const empId = lastUnder !== -1 ? withoutPrefix.slice(0, lastUnder) : withoutPrefix;
    db.get("SELECT * FROM users WHERE id = ?", [empId], (err, user) => {
      if (err || !user) return callback(err, null);
      callback(null, user);
    });
  } else {
    callback(null, null);
  }
}

// Single Unified API Endpoint mapping to Apps Script Actions
app.post('/api', (appReq, appRes) => {
  const { action, token, ...payload } = appReq.body;

  if (!action) {
    return appRes.status(400).json({ success: false, error: "Action is required." });
  }

  // Action: login / adminLogin
  if (action === "login" || action === "adminLogin") {
    const { username, password } = payload;
    if (!username || !password) {
      return appRes.json({ success: false, error: "Username and password are required." });
    }

    const cleanUser = username.trim().toUpperCase();
    const cleanPass = password.trim();

    // Match by Employee ID OR by name (case-insensitive)
    db.get(
      "SELECT * FROM users WHERE UPPER(id) = ? OR UPPER(name) = ?",
      [cleanUser, cleanUser],
      (err, user) => {
        if (err) return appRes.json({ success: false, error: "Database error." });
        if (!user) return appRes.json({ success: false, error: "User account not found." });
        if (user.password !== cleanPass) {
          return appRes.json({ success: false, error: "Incorrect password." });
        }

        const mockToken = `mock_token_${user.id}_${Date.now()}`;
        return appRes.json({
          success: true,
          token: mockToken,
          user: { id: user.id, name: user.name, role: user.role, department: user.department }
        });
      }
    );
    return;
  }

  // Action: registerEmployee (public, no auth required)
  if (action === "registerEmployee") {
    const { name, department, password } = payload;
    if (!name || !department || !password) {
      return appRes.json({ success: false, error: "Name, Department, and Password are required." });
    }

    // Auto-generate next sequential EMP ID
    db.all("SELECT id FROM users WHERE id LIKE 'EMP%' ORDER BY id ASC", [], (err, rows) => {
      if (err) return appRes.json({ success: false, error: "Database error generating employee ID." });

      let nextNum = 1;
      if (rows.length > 0) {
        const nums = rows
          .map(r => parseInt(r.id.replace(/^EMP0*/i, ""), 10))
          .filter(n => !isNaN(n));
        if (nums.length > 0) nextNum = Math.max(...nums) + 1;
      }
      const newId = `EMP${String(nextNum).padStart(3, "0")}`;

      db.run(
        "INSERT INTO users (id, name, department, role, password) VALUES (?, ?, ?, ?, ?)",
        [newId, name.trim(), department.trim(), "EMPLOYEE", password.trim()],
        (err) => {
          if (err) return appRes.json({ success: false, error: "Database error while creating account." });
          return appRes.json({ success: true, message: "Account created successfully! You can now sign in.", id: newId });
        }
      );
    });
    return;
  }

  // Verify other actions require authentication session validation
  verifyToken(token, (err, currentUser) => {
    if (err || !currentUser) {
      return appRes.json({ success: false, error: "Unauthorized session or token expired." });
    }

    // Action: verifySession
    if (action === "verifySession") {
      return appRes.json({
        success: true,
        user: { id: currentUser.id, name: currentUser.name, role: currentUser.role, department: currentUser.department }
      });
    }

    // Action: getTodayReport → SQLite
    if (action === "getTodayReport") {
      const today = new Date().toISOString().substring(0, 10);
      db.get("SELECT * FROM reports WHERE employeeId = ? AND date = ?", [currentUser.id, today], (err, row) => {
        if (err) return appRes.json({ success: false, error: "Database error." });
        return appRes.json({ success: true, hasSubmitted: !!row, report: row || null });
      });
      return;
    }

    // Action: submitDailyReport → SQLite (+ background sync to Google Sheet)
    if (action === "submitDailyReport") {
      const { payload: innerPayload } = payload;
      const { workDone, status, remarks } = innerPayload || {};
      if (!workDone) return appRes.json({ success: false, error: "Work Done activities field is required." });

      const today = new Date().toISOString().substring(0, 10);
      db.get("SELECT * FROM reports WHERE employeeId = ? AND date = ?", [currentUser.id, today], (err, existing) => {
        if (err) return appRes.json({ success: false, error: "Database error during duplicate check." });
        if (existing) return appRes.json({ success: false, isDuplicate: true, error: "You have already submitted today's work report. Modifications are not allowed." });

        const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const now = new Date();
        const newRecord = {
          id:           `${currentUser.id}_${now.getTime()}`,
          employeeId:   currentUser.id,
          employeeName: currentUser.name,
          department:   currentUser.department,
          timestamp:    now.toISOString().replace('T',' ').substring(0,19),
          date:         today,
          day:          DAYS[now.getDay()],
          workDone:     workDone.trim(),
          status:       status || "Completed",
          remarks:      remarks ? remarks.trim() : "—",
          auditLog:     ""
        };

        db.run(
          `INSERT INTO reports (id, employeeId, employeeName, department, timestamp, date, day, workDone, status, remarks, auditLog)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newRecord.id, newRecord.employeeId, newRecord.employeeName, newRecord.department,
           newRecord.timestamp, newRecord.date, newRecord.day, newRecord.workDone,
           newRecord.status, newRecord.remarks, newRecord.auditLog],
          (err) => {
            if (err) return appRes.json({ success: false, error: "Failed to save report." });
            syncToSheet("appendRow", newRecord); // background sync
            return appRes.json({ success: true, message: "Daily work report submitted successfully!", record: newRecord });
          }
        );
      });
      return;
    }

    // Action: getMyReports → SQLite
    if (action === "getMyReports") {
      db.all("SELECT * FROM reports WHERE employeeId = ? ORDER BY date DESC", [currentUser.id], (err, rows) => {
        if (err) return appRes.json({ success: false, error: "Database query error." });
        return appRes.json({
          success: true,
          employee: { id: currentUser.id, name: currentUser.name, role: currentUser.role, department: currentUser.department },
          reports: rows
        });
      });
      return;
    }

    // Admin authorization guard
    if (currentUser.role !== "ADMIN") {
      return appRes.json({ success: false, error: "Access denied. Admin role required." });
    }

    // Action: getAllReports → SQLite
    if (action === "getAllReports") {
      const { filters } = payload;
      let query = "SELECT * FROM reports WHERE 1=1";
      const params = [];
      if (filters) {
        if (filters.employeeId && filters.employeeId !== "ALL") { query += " AND employeeId = ?"; params.push(filters.employeeId); }
        if (filters.status     && filters.status     !== "ALL") { query += " AND status = ?";     params.push(filters.status); }
        if (filters.fromDate) { query += " AND date >= ?"; params.push(filters.fromDate); }
        if (filters.toDate)   { query += " AND date <= ?"; params.push(filters.toDate); }
        if (filters.search) {
          query += " AND (LOWER(workDone) LIKE ? OR LOWER(remarks) LIKE ? OR LOWER(employeeName) LIKE ?)";
          const s = `%${filters.search.toLowerCase()}%`;
          params.push(s, s, s);
        }
      }
      query += " ORDER BY date DESC";

      db.all(query, params, (err, reports) => {
        if (err) return appRes.json({ success: false, error: "Database query error." });
        const today = new Date().toISOString().substring(0, 10);
        db.all("SELECT * FROM reports WHERE date = ?", [today], (err, todayReports) => {
          if (err) return appRes.json({ success: false, error: "Database error during summary." });
          const submittedIds = new Set(todayReports.map(r => r.employeeId));
          const counts = { "Completed": 0, "In Progress": 0, "Pending": 0, "Leave": 0, "Holiday": 0 };
          todayReports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
          db.all("SELECT id, name, department FROM users WHERE role = 'EMPLOYEE'", (err, allEmployees) => {
            if (err) return appRes.json({ success: false, error: "Database error fetching employees." });
            const employeeTodayStatus = allEmployees.map(emp => {
              const rep = todayReports.find(r => r.employeeId === emp.id);
              return { employeeId: emp.id, employeeName: emp.name, department: emp.department, submitted: !!rep, todayStatus: rep ? rep.status : "Not Submitted" };
            });
            return appRes.json({
              success: true, reports,
              summary: { totalEmployees: allEmployees.length, submittedToday: submittedIds.size, pendingToday: allEmployees.length - submittedIds.size, statusCountsToday: counts, employeeTodayStatus }
            });
          });
        });
      });
      return;
    }

    // Action: updateReport → SQLite (+ background sync to Google Sheet)
    if (action === "updateReport") {
      const { payload: innerPayload } = payload;
      const { id, workDone, status, remarks, reason } = innerPayload || {};
      db.get("SELECT * FROM reports WHERE id = ?", [id], (err, orig) => {
        if (err || !orig) return appRes.json({ success: false, error: "Report record not found." });
        const nowStr = new Date().toISOString().replace('T',' ').substring(0,19);
        const auditEntry = `[${nowStr} by Admin (${currentUser.id})]: Status (${orig.status} -> ${status}) | Reason: ${reason || "Admin update"}`;
        const newAuditLog = orig.auditLog ? `${orig.auditLog}\n${auditEntry}` : auditEntry;
        db.run(
          `UPDATE reports SET workDone = ?, status = ?, remarks = ?, auditLog = ? WHERE id = ?`,
          [workDone !== undefined ? workDone.trim() : orig.workDone, status ?? orig.status, remarks !== undefined ? remarks.trim() : orig.remarks, newAuditLog, id],
          (err) => {
            if (err) return appRes.json({ success: false, error: "Failed to update record." });
            db.get("SELECT * FROM reports WHERE id = ?", [id], (err, updatedRecord) => {
              if (updatedRecord) syncToSheet("updateRow", updatedRecord); // background sync
              return appRes.json({ success: true, message: "Report updated successfully by Admin.", updatedRecord });
            });
          }
        );
      });
      return;
    }

    // Action: getMonthlySummary → SQLite
    if (action === "getMonthlySummary") {
      const yearMonth = payload.yearMonth || new Date().toISOString().substring(0, 7);
      db.all("SELECT id, name, department FROM users WHERE role = 'EMPLOYEE'", (err, allEmployees) => {
        if (err) return appRes.json({ success: false, error: "Database error." });
        db.all("SELECT employeeId, status FROM reports WHERE date LIKE ?", [`${yearMonth}%`], (err, monthlyReports) => {
          if (err) return appRes.json({ success: false, error: "Database error." });
          const summaries = allEmployees.map(emp => {
            const r = monthlyReports.filter(r => r.employeeId === emp.id);
            return {
              employeeId: emp.id, employeeName: emp.name, department: emp.department, yearMonth,
              metrics: { reportingDays: r.length, completed: r.filter(x => x.status==="Completed").length, inProgress: r.filter(x => x.status==="In Progress").length, pending: r.filter(x => x.status==="Pending").length, leave: r.filter(x => x.status==="Leave").length, holiday: r.filter(x => x.status==="Holiday").length }
            };
          });
          return appRes.json({ success: true, yearMonth, summaries });
        });
      });
      return;
    }

    // Action: getEmployeesList
    if (action === "getEmployeesList") {
      db.all("SELECT id, name, department, role, password FROM users ORDER BY id ASC", [], (err, rows) => {
        if (err) return appRes.json({ success: false, error: "Database error fetching employee list." });
        return appRes.json({ success: true, employees: rows });
      });
      return;
    }

    // Action: addEmployee
    if (action === "addEmployee") {
      const { id, name, department, password, role } = payload;
      if (!id || !name || !department || !password) {
        return appRes.json({ success: false, error: "All employee fields (ID, Name, Department, Password) are required." });
      }

      db.run(
        "INSERT INTO users (id, name, department, role, password) VALUES (?, ?, ?, ?, ?)",
        [id.trim().toUpperCase(), name.trim(), department.trim(), role || "EMPLOYEE", password.trim()],
        (err) => {
          if (err) {
            if (err.message.includes("UNIQUE")) {
              return appRes.json({ success: false, error: `Employee ID ${id} already exists.` });
            }
            return appRes.json({ success: false, error: "Database error adding employee." });
          }
          return appRes.json({ success: true, message: "Employee added successfully!" });
        }
      );
      return;
    }

    // Action: updateEmployee
    if (action === "updateEmployee") {
      const { id, name, department, password, role } = payload;
      if (!id || !name || !department || !password) {
        return appRes.json({ success: false, error: "All employee fields (ID, Name, Department, Password) are required." });
      }

      db.run(
        "UPDATE users SET name = ?, department = ?, role = ?, password = ? WHERE id = ?",
        [name.trim(), department.trim(), role || "EMPLOYEE", password.trim(), id],
        (err) => {
          if (err) return appRes.json({ success: false, error: "Database error updating employee details." });
          return appRes.json({ success: true, message: "Employee updated successfully!" });
        }
      );
      return;
    }

    // Action: deleteEmployee
    if (action === "deleteEmployee") {
      const { id } = payload;
      if (!id) return appRes.json({ success: false, error: "Employee ID is required." });

      if (id === currentUser.id) {
        return appRes.json({ success: false, error: "You cannot delete your own admin account." });
      }

      db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
        if (err) return appRes.json({ success: false, error: "Database error deleting employee record." });
        return appRes.json({ success: true, message: "Employee deleted successfully!" });
      });
      return;
    }

    return appRes.json({ success: false, error: "Unsupported operation action." });
  });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
