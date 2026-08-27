/**
 * API Service for Employee Daily Work Reporting System
 * Supports dual mode: Direct Google Apps Script HTTP backend & LocalStorage Mock fallback.
 */
import { APP_CONFIG } from "../config/appConfig";

const MOCK_STORAGE_KEY = "WORKPULSE_MOCK_DATABASE_V1";

// Helper to get today's date in YYYY-MM-DD
export function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Seed initial mock database if empty
function initMockDatabase() {
  const existing = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!existing) {
    const today = getTodayDateStr();
    const mockReports = [
      {
        id: "EMP001_101",
        employeeId: "EMP001",
        employeeName: "Employee 1",
        department: "IT",
        sheetName: "Employee 1",
        rowIndex: 2,
        timestamp: `${today} 09:30:00`,
        date: today,
        day: "Thursday",
        workDone: "Completed frontend UI components & setup React router layout for the daily reporting portal.",
        status: "Completed",
        remarks: "All tasks completed ahead of time.",
        auditLog: ""
      },
      {
        id: "EMP002_102",
        employeeId: "EMP002",
        employeeName: "Employee 2",
        department: "IT",
        sheetName: "Employee 2",
        rowIndex: 2,
        timestamp: `${today} 10:15:00`,
        date: today,
        day: "Thursday",
        workDone: "API integration testing with Google Apps Script backend and error scenario handling.",
        status: "In Progress",
        remarks: "Testing pending CORS configuration.",
        auditLog: ""
      },
      {
        id: "EMP004_103",
        employeeId: "EMP004",
        employeeName: "Employee 4",
        department: "IT",
        sheetName: "Employee 4",
        rowIndex: 2,
        timestamp: `${today} 09:00:00`,
        date: today,
        day: "Thursday",
        workDone: "Database index optimization and spreadsheet row schema validation.",
        status: "Completed",
        remarks: "—",
        auditLog: ""
      },
      {
        id: "EMP006_104",
        employeeId: "EMP006",
        employeeName: "Employee 6",
        department: "Non-IT",
        sheetName: "Employee 6",
        rowIndex: 2,
        timestamp: `${today} 08:45:00`,
        date: today,
        day: "Thursday",
        workDone: "Monthly inventory count and documentation review for facility logistics.",
        status: "Completed",
        remarks: "—",
        auditLog: ""
      },
      // Historic record from yesterday
      {
        id: "EMP001_100",
        employeeId: "EMP001",
        employeeName: "Employee 1",
        department: "IT",
        sheetName: "Employee 1",
        rowIndex: 1,
        timestamp: "2026-08-26 17:30:00",
        date: "2026-08-26",
        day: "Wednesday",
        workDone: "Designed mock wireframes and responsive CSS color theme variables.",
        status: "Completed",
        remarks: "Initial approval received.",
        auditLog: ""
      }
    ];

    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockReports));
  }
}

initMockDatabase();

function getMockReports() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveMockReports(reports) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(reports));
}

const MOCK_ROSTER_KEY = "WORKPULSE_MOCK_ROSTER_V1";
function getMockEmployees() {
  const existing = localStorage.getItem(MOCK_ROSTER_KEY);
  if (!existing) {
    const list = APP_CONFIG.DEFAULT_EMPLOYEES.map(e => ({...e, password: 'emp123'}));
    localStorage.setItem(MOCK_ROSTER_KEY, JSON.stringify(list));
    return list;
  }
  try {
    return JSON.parse(existing) || [];
  } catch (e) {
    return [];
  }
}

function saveMockEmployees(employees) {
  localStorage.setItem(MOCK_ROSTER_KEY, JSON.stringify(employees));
}

/**
 * Generic API Call Dispatcher
 */
async function callApi(action, payload = {}, token = null) {
  const url = APP_CONFIG.APPS_SCRIPT_URL;

  // If live Apps Script URL is set, call backend
  if (url && url.trim() !== "") {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, token, ...payload })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn("Apps Script API fetch failed, falling back to mock mode:", err);
    }
  }

  // --- MOCK MODE FALLBACK ---
  await new Promise((r) => setTimeout(r, 400)); // Simulate slight network delay

  if (action === "login" || action === "adminLogin") {
    const { username, password } = payload;
    if (!username || !password) {
      return { success: false, error: "Username and password are required." };
    }

    const cleanUser = username.trim().toUpperCase();
    const cleanPass = password.trim();

    if (cleanUser === "ADMIN001") {
      if (cleanPass === "admin123") {
        const mockToken = `mock_token_ADMIN001_${Date.now()}`;
        return {
          success: true,
          token: mockToken,
          user: { id: "ADMIN001", name: "System Admin", role: "ADMIN", department: "Management" }
        };
      }
      return { success: false, error: "Invalid admin password." };
    }

    const employees = getMockEmployees();
    const emp = employees.find((e) => e.id.toUpperCase() === cleanUser);
    if (emp) {
      if (cleanPass === emp.password) {
        const mockToken = `mock_token_${emp.id}_${Date.now()}`;
        return {
          success: true,
          token: mockToken,
          user: { id: emp.id, name: emp.name, role: emp.role || "EMPLOYEE", department: emp.department }
        };
      }
      return { success: false, error: "Invalid employee password." };
    }

    return { success: false, error: "User account not found." };
  }

  if (action === "verifySession") {
    if (!token) return { success: false, error: "No token provided." };
    if (token.includes("ADMIN001")) {
      return {
        success: true,
        user: { id: "ADMIN001", name: "System Admin", role: "ADMIN", department: "Management" }
      };
    }
    const empId = token.split("_")[2];
    const employees = getMockEmployees();
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      return {
        success: true,
        user: { id: emp.id, name: emp.name, role: emp.role || "EMPLOYEE", department: emp.department }
      };
    }
    return { success: false, error: "Session expired." };
  }

  if (action === "getTodayReport") {
    const mockUser = payload.user;
    if (!mockUser) return { success: false, error: "Unauthorized." };
    const today = getTodayDateStr();
    const reports = getMockReports();
    const todayRecord = reports.find((r) => r.employeeId === mockUser.id && r.date === today);

    return {
      success: true,
      hasSubmitted: !!todayRecord,
      report: todayRecord || null
    };
  }

  if (action === "submitDailyReport") {
    const mockUser = payload.user;
    const { workDone, status, remarks } = payload;
    if (!mockUser || mockUser.role !== "EMPLOYEE") {
      return { success: false, error: "Unauthorized submission." };
    }

    const today = getTodayDateStr();
    const reports = getMockReports();

    // Check duplicate
    const existing = reports.find((r) => r.employeeId === mockUser.id && r.date === today);
    if (existing) {
      return {
        success: false,
        isDuplicate: true,
        error: "You have already submitted today's work report. Modifications are not allowed."
      };
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    const timeStr = `${today} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const newRecord = {
      id: `${mockUser.id}_${Date.now()}`,
      employeeId: mockUser.id,
      employeeName: mockUser.name,
      department: mockUser.department,
      sheetName: mockUser.name,
      rowIndex: reports.length + 2,
      timestamp: timeStr,
      date: today,
      day: days[now.getDay()],
      workDone: workDone.trim(),
      status: status,
      remarks: remarks ? remarks.trim() : "—",
      auditLog: ""
    };

    reports.unshift(newRecord);
    saveMockReports(reports);

    return {
      success: true,
      message: "Daily work report submitted successfully!",
      record: newRecord
    };
  }

  if (action === "getMyReports") {
    const mockUser = payload.user;
    if (!mockUser) return { success: false, error: "Unauthorized." };
    const reports = getMockReports().filter((r) => r.employeeId === mockUser.id);
    return {
      success: true,
      employee: mockUser,
      reports: reports.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  }

  if (action === "getAllReports") {
    const { filters } = payload;
    const reports = getMockReports();
    const today = getTodayDateStr();

    let filtered = reports;

    if (filters) {
      if (filters.employeeId && filters.employeeId !== "ALL") {
        filtered = filtered.filter((r) => r.employeeId === filters.employeeId);
      }
      if (filters.status && filters.status !== "ALL") {
        filtered = filtered.filter((r) => r.status === filters.status);
      }
      if (filters.fromDate) {
        filtered = filtered.filter((r) => r.date >= filters.fromDate);
      }
      if (filters.toDate) {
        filtered = filtered.filter((r) => r.date <= filters.toDate);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.workDone.toLowerCase().includes(q) ||
            r.remarks.toLowerCase().includes(q) ||
            r.employeeName.toLowerCase().includes(q)
        );
      }
    }

    // Generate today summary stats
    const todayReports = reports.filter((r) => r.date === today);
    const submittedEmpIds = new Set(todayReports.map((r) => r.employeeId));

    const statusCountsToday = { "Completed": 0, "In Progress": 0, "Pending": 0, "Leave": 0, "Holiday": 0 };
    todayReports.forEach((r) => {
      if (statusCountsToday[r.status] !== undefined) {
        statusCountsToday[r.status]++;
      }
    });

    const employeeTodayStatus = APP_CONFIG.DEFAULT_EMPLOYEES.map((emp) => {
      const rep = todayReports.find((r) => r.employeeId === emp.id);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        submitted: !!rep,
        todayStatus: rep ? rep.status : "Not Submitted"
      };
    });

    return {
      success: true,
      reports: filtered.sort((a, b) => new Date(b.date) - new Date(a.date)),
      summary: {
        totalEmployees: APP_CONFIG.DEFAULT_EMPLOYEES.length,
        submittedToday: submittedEmpIds.size,
        pendingToday: APP_CONFIG.DEFAULT_EMPLOYEES.length - submittedEmpIds.size,
        statusCountsToday,
        employeeTodayStatus
      }
    };
  }

  if (action === "updateReport") {
    const { id, workDone, status, remarks, reason, adminUser } = payload;
    const reports = getMockReports();
    const index = reports.findIndex((r) => r.id === id);

    if (index === -1) {
      return { success: false, error: "Report record not found." };
    }

    const orig = reports[index];
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    const auditEntry = `[${nowStr} by Admin (${adminUser?.id || "ADMIN001"})]: Status (${orig.status} -> ${status}) | Reason: ${reason || "Admin update"}`;

    const updated = {
      ...orig,
      workDone: workDone !== undefined ? workDone.trim() : orig.workDone,
      status: status !== undefined ? status : orig.status,
      remarks: remarks !== undefined ? remarks.trim() : orig.remarks,
      auditLog: orig.auditLog ? `${orig.auditLog}\n${auditEntry}` : auditEntry
    };

    reports[index] = updated;
    saveMockReports(reports);

    return {
      success: true,
      message: "Report updated successfully by Admin.",
      updatedRecord: updated
    };
  }

  if (action === "getMonthlySummary") {
    const yearMonth = payload.yearMonth || getTodayDateStr().substring(0, 7);
    const reports = getMockReports();

    const summaries = APP_CONFIG.DEFAULT_EMPLOYEES.map((emp) => {
      const empReports = reports.filter(
        (r) => r.employeeId === emp.id && r.date.substring(0, 7) === yearMonth
      );

      const metrics = {
        reportingDays: empReports.length,
        completed: empReports.filter((r) => r.status === "Completed").length,
        inProgress: empReports.filter((r) => r.status === "In Progress").length,
        pending: empReports.filter((r) => r.status === "Pending").length,
        leave: empReports.filter((r) => r.status === "Leave").length,
        holiday: empReports.filter((r) => r.status === "Holiday").length
      };

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        yearMonth,
        metrics
      };
    });

    return {
      success: true,
      yearMonth,
      summaries
    };
  }

  if (action === "getEmployeesList") {
    return { success: true, employees: getMockEmployees() };
  }

  if (action === "addEmployee") {
    const { id, name, department, password, role } = payload;
    const employees = getMockEmployees();
    if (employees.some(e => e.id.toUpperCase() === id.toUpperCase())) {
      return { success: false, error: `Employee ID ${id} already exists.` };
    }
    const newEmp = { id: id.trim().toUpperCase(), name: name.trim(), department: department.trim(), role: role || "EMPLOYEE", password: password.trim() };
    employees.push(newEmp);
    saveMockEmployees(employees);
    return { success: true, message: "Employee added successfully!" };
  }

  if (action === "updateEmployee") {
    const { id, name, department, password, role } = payload;
    const employees = getMockEmployees();
    const idx = employees.findIndex(e => e.id === id);
    if (idx === -1) {
      return { success: false, error: "Employee not found." };
    }
    employees[idx] = { id, name: name.trim(), department: department.trim(), role: role || "EMPLOYEE", password: password.trim() };
    saveMockEmployees(employees);
    return { success: true, message: "Employee updated successfully!" };
  }

  if (action === "deleteEmployee") {
    const { id } = payload;
    const employees = getMockEmployees();
    const filtered = employees.filter(e => e.id !== id);
    saveMockEmployees(filtered);
    return { success: true, message: "Employee deleted successfully!" };
  }

  if (action === "registerEmployee") {
    const { name, department, password } = payload;
    if (!name || !department || !password) {
      return { success: false, error: "Name, Department, and Password are required." };
    }
    const employees = getMockEmployees();
    const nums = employees
      .map(e => parseInt(e.id.replace(/^EMP0*/i, ""), 10))
      .filter(n => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const newId = `EMP${String(nextNum).padStart(3, "0")}`;
    employees.push({ id: newId, name: name.trim(), department: department.trim(), role: "EMPLOYEE", password: password.trim() });
    saveMockEmployees(employees);
    return { success: true, message: "Account created successfully! You can now sign in.", id: newId };
  }

  return { success: false, error: "Unsupported mock action." };
}

export const apiService = {
  login: (username, password) => callApi("login", { username, password }),
  adminLogin: (username, password) => callApi("adminLogin", { username, password }),
  verifySession: (token) => callApi("verifySession", {}, token),
  submitDailyReport: (token, payload, user) => callApi("submitDailyReport", { payload, user }, token),
  getMyReports: (token, user) => callApi("getMyReports", { user }, token),
  getTodayReport: (token, user) => callApi("getTodayReport", { user }, token),
  getAllReports: (token, filters) => callApi("getAllReports", { filters }, token),
  updateReport: (token, payload, adminUser) => callApi("updateReport", { payload, adminUser }, token),
  getMonthlySummary: (token, yearMonth) => callApi("getMonthlySummary", { yearMonth }, token),
  getEmployeesList: (token) => callApi("getEmployeesList", {}, token),
  addEmployee: (token, payload) => callApi("addEmployee", payload, token),
  updateEmployee: (token, payload) => callApi("updateEmployee", payload, token),
  deleteEmployee: (token, id) => callApi("deleteEmployee", { id }, token),
  registerEmployee: (payload) => callApi("registerEmployee", payload)
};
