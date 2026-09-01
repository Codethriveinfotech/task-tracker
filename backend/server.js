const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL || "";

app.use(cors());
app.use(express.json({ type: ['application/json', 'text/plain'] }));

// Serve built frontend assets
app.use(express.static(path.join(__dirname, '../frontend/dist')));

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
async function verifyToken(token) {
  if (!token) return null;

  if (token.startsWith('mock_token_')) {
    const withoutPrefix = token.slice('mock_token_'.length);
    const lastUnder = withoutPrefix.lastIndexOf('_');
    const empId = lastUnder !== -1 ? withoutPrefix.slice(0, lastUnder) : withoutPrefix;
    try {
      const res = await db.query("SELECT * FROM users WHERE id = $1", [empId]);
      return res.rows[0] || null;
    } catch (err) {
      return null;
    }
  } else {
    return null;
  }
}

// Single Unified API Endpoint mapping to Apps Script Actions
app.post('/api', async (appReq, appRes) => {
  const { action, token, ...payload } = appReq.body;

  if (!action) {
    return appRes.status(400).json({ success: false, error: "Action is required." });
  }

  try {
    // Action: login / adminLogin
    if (action === "login" || action === "adminLogin") {
      const { username, password } = payload;
      if (!username || !password) {
        return appRes.json({ success: false, error: "Username and password are required." });
      }

      const cleanUser = username.trim().toUpperCase();
      const cleanPass = password.trim();

      // Match by Employee ID OR by name (case-insensitive)
      const res = await db.query(
        "SELECT * FROM users WHERE UPPER(id) = $1 OR UPPER(name) = $2",
        [cleanUser, cleanUser]
      );
      
      const user = res.rows[0];
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

    // Action: registerEmployee (public, no auth required)
    if (action === "registerEmployee") {
      const { id, name, department, password } = payload;
      if (!id || !name || !department || !password) {
        return appRes.json({ success: false, error: "Employee ID, Name, Department, and Password are required." });
      }

      const cleanId = id.trim().toUpperCase();

      try {
        await db.query(
          "INSERT INTO users (id, name, department, role, password) VALUES ($1, $2, $3, $4, $5)",
          [cleanId, name.trim(), department.trim(), "EMPLOYEE", password.trim()]
        );
        return appRes.json({ success: true, message: "Account created successfully! You can now sign in.", id: cleanId });
      } catch (err) {
        if (err.code === '23505') { // Postgres unique violation
          return appRes.json({ success: false, error: `Employee ID '${cleanId}' already exists. Please choose a different ID.` });
        }
        return appRes.json({ success: false, error: "Database error while creating account." });
      }
    }

    // Verify other actions require authentication session validation
    const currentUser = await verifyToken(token);
    if (!currentUser) {
      return appRes.json({ success: false, error: "Unauthorized session or token expired." });
    }

    // Action: verifySession
    if (action === "verifySession") {
      return appRes.json({
        success: true,
        user: { id: currentUser.id, name: currentUser.name, role: currentUser.role, department: currentUser.department }
      });
    }

    // Action: getTodayReport
    if (action === "getTodayReport") {
      const today = new Date().toISOString().substring(0, 10);
      const res = await db.query("SELECT * FROM reports WHERE employeeId = $1 AND date = $2", [currentUser.id, today]);
      const row = res.rows[0];
      return appRes.json({ success: true, hasSubmitted: !!row, report: row || null });
    }

    // Action: submitDailyReport (+ background sync to Google Sheet)
    if (action === "submitDailyReport") {
      const { payload: innerPayload } = payload;
      const { workDone, status, remarks } = innerPayload || {};
      if (!workDone) return appRes.json({ success: false, error: "Work Done activities field is required." });

      const today = new Date().toISOString().substring(0, 10);
      const existingRes = await db.query("SELECT * FROM reports WHERE employeeId = $1 AND date = $2", [currentUser.id, today]);
      if (existingRes.rows.length > 0) return appRes.json({ success: false, isDuplicate: true, error: "You have already submitted today's work report. Modifications are not allowed." });

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

      await db.query(
        `INSERT INTO reports (id, employeeId, employeeName, department, timestamp, date, day, workDone, status, remarks, auditLog)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [newRecord.id, newRecord.employeeId, newRecord.employeeName, newRecord.department,
         newRecord.timestamp, newRecord.date, newRecord.day, newRecord.workDone,
         newRecord.status, newRecord.remarks, newRecord.auditLog]
      );
      syncToSheet("appendRow", newRecord); // background sync
      return appRes.json({ success: true, message: "Daily work report submitted successfully!", record: newRecord });
    }

    // Action: getMyReports
    if (action === "getMyReports") {
      const res = await db.query("SELECT * FROM reports WHERE employeeId = $1 ORDER BY date DESC", [currentUser.id]);
      return appRes.json({
        success: true,
        employee: { id: currentUser.id, name: currentUser.name, role: currentUser.role, department: currentUser.department },
        reports: res.rows
      });
    }

    // Admin authorization guard
    if (currentUser.role !== "ADMIN") {
      return appRes.json({ success: false, error: "Access denied. Admin role required." });
    }

    // Action: getAllReports
    if (action === "getAllReports") {
      const { filters } = payload;
      let query = "SELECT * FROM reports WHERE 1=1";
      const params = [];
      let paramCount = 1;

      if (filters) {
        if (filters.employeeId && filters.employeeId !== "ALL") { query += ` AND employeeId = $${paramCount++}`; params.push(filters.employeeId); }
        if (filters.status     && filters.status     !== "ALL") { query += ` AND status = $${paramCount++}`;     params.push(filters.status); }
        if (filters.fromDate) { query += ` AND date >= $${paramCount++}`; params.push(filters.fromDate); }
        if (filters.toDate)   { query += ` AND date <= $${paramCount++}`; params.push(filters.toDate); }
        if (filters.search) {
          query += ` AND (LOWER(workDone) LIKE $${paramCount} OR LOWER(remarks) LIKE $${paramCount} OR LOWER(employeeName) LIKE $${paramCount})`;
          const s = `%${filters.search.toLowerCase()}%`;
          params.push(s);
          paramCount++;
        }
      }
      query += " ORDER BY date DESC";

      const reportsRes = await db.query(query, params);
      const reports = reportsRes.rows;

      const today = new Date().toISOString().substring(0, 10);
      const todayReportsRes = await db.query("SELECT * FROM reports WHERE date = $1", [today]);
      const todayReports = todayReportsRes.rows;

      const submittedIds = new Set(todayReports.map(r => r.employeeId));
      const counts = { "Completed": 0, "In Progress": 0, "Pending": 0, "Leave": 0, "Holiday": 0 };
      todayReports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
      
      const allEmployeesRes = await db.query("SELECT id, name, department FROM users WHERE role = 'EMPLOYEE'");
      const allEmployees = allEmployeesRes.rows;

      const employeeTodayStatus = allEmployees.map(emp => {
        const rep = todayReports.find(r => r.employeeId === emp.id);
        return { employeeId: emp.id, employeeName: emp.name, department: emp.department, submitted: !!rep, todayStatus: rep ? rep.status : "Not Submitted" };
      });

      return appRes.json({
        success: true, reports,
        summary: { totalEmployees: allEmployees.length, submittedToday: submittedIds.size, pendingToday: allEmployees.length - submittedIds.size, statusCountsToday: counts, employeeTodayStatus }
      });
    }

    // Action: updateReport (+ background sync to Google Sheet)
    if (action === "updateReport") {
      const { payload: innerPayload } = payload;
      const { id, workDone, status, remarks, reason } = innerPayload || {};
      
      const origRes = await db.query("SELECT * FROM reports WHERE id = $1", [id]);
      const orig = origRes.rows[0];
      if (!orig) return appRes.json({ success: false, error: "Report record not found." });
      
      const nowStr = new Date().toISOString().replace('T',' ').substring(0,19);
      const auditEntry = `[${nowStr} by Admin (${currentUser.id})]: Status (${orig.status} -> ${status}) | Reason: ${reason || "Admin update"}`;
      const newAuditLog = orig.auditLog ? `${orig.auditLog}\n${auditEntry}` : auditEntry;
      
      await db.query(
        `UPDATE reports SET workDone = $1, status = $2, remarks = $3, auditLog = $4 WHERE id = $5`,
        [workDone !== undefined ? workDone.trim() : orig.workDone, status ?? orig.status, remarks !== undefined ? remarks.trim() : orig.remarks, newAuditLog, id]
      );

      const updatedRecordRes = await db.query("SELECT * FROM reports WHERE id = $1", [id]);
      const updatedRecord = updatedRecordRes.rows[0];
      syncToSheet("updateRow", updatedRecord); // background sync
      return appRes.json({ success: true, message: "Report updated successfully by Admin.", updatedRecord });
    }

    // Action: getMonthlySummary
    if (action === "getMonthlySummary") {
      const yearMonth = payload.yearMonth || new Date().toISOString().substring(0, 7);
      const allEmployeesRes = await db.query("SELECT id, name, department FROM users WHERE role = 'EMPLOYEE'");
      const allEmployees = allEmployeesRes.rows;
      
      const monthlyReportsRes = await db.query("SELECT employeeId, status FROM reports WHERE date LIKE $1", [`${yearMonth}%`]);
      const monthlyReports = monthlyReportsRes.rows;
      
      const summaries = allEmployees.map(emp => {
        const r = monthlyReports.filter(r => r.employeeId === emp.id);
        return {
          employeeId: emp.id, employeeName: emp.name, department: emp.department, yearMonth,
          metrics: { reportingDays: r.length, completed: r.filter(x => x.status==="Completed").length, inProgress: r.filter(x => x.status==="In Progress").length, pending: r.filter(x => x.status==="Pending").length, leave: r.filter(x => x.status==="Leave").length, holiday: r.filter(x => x.status==="Holiday").length }
        };
      });
      return appRes.json({ success: true, yearMonth, summaries });
    }

    // Action: getEmployeesList
    if (action === "getEmployeesList") {
      const res = await db.query("SELECT id, name, department, role, password FROM users ORDER BY id ASC");
      return appRes.json({ success: true, employees: res.rows });
    }

    // Action: addEmployee
    if (action === "addEmployee") {
      const { id, name, department, password, role } = payload;
      if (!id || !name || !department || !password) {
        return appRes.json({ success: false, error: "All employee fields (ID, Name, Department, Password) are required." });
      }

      try {
        await db.query(
          "INSERT INTO users (id, name, department, role, password) VALUES ($1, $2, $3, $4, $5)",
          [id.trim().toUpperCase(), name.trim(), department.trim(), role || "EMPLOYEE", password.trim()]
        );
        return appRes.json({ success: true, message: "Employee added successfully!" });
      } catch (err) {
        if (err.code === '23505') {
          return appRes.json({ success: false, error: `Employee ID ${id} already exists.` });
        }
        return appRes.json({ success: false, error: "Database error adding employee." });
      }
    }

    // Action: updateEmployee
    if (action === "updateEmployee") {
      const { id, name, department, password, role } = payload;
      if (!id || !name || !department || !password) {
        return appRes.json({ success: false, error: "All employee fields (ID, Name, Department, Password) are required." });
      }

      await db.query(
        "UPDATE users SET name = $1, department = $2, role = $3, password = $4 WHERE id = $5",
        [name.trim(), department.trim(), role || "EMPLOYEE", password.trim(), id]
      );
      return appRes.json({ success: true, message: "Employee updated successfully!" });
    }

    // Action: deleteEmployee
    if (action === "deleteEmployee") {
      const { id } = payload;
      if (!id) return appRes.json({ success: false, error: "Employee ID is required." });

      if (id === currentUser.id) {
        return appRes.json({ success: false, error: "You cannot delete your own admin account." });
      }

      await db.query("DELETE FROM users WHERE id = $1", [id]);
      return appRes.json({ success: true, message: "Employee deleted successfully!" });
    }

    return appRes.json({ success: false, error: "Unsupported operation action." });

  } catch (err) {
    console.error("API Error:", err);
    return appRes.status(500).json({ success: false, error: "Internal server error." });
  }
});

// Fallback for React SPA Routing - serve index.html for all non-API paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
