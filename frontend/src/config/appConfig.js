/**
 * System Configuration & Definitions
 */

export const APP_CONFIG = {
  APP_NAME: "WorkPulse",
  COMPANY_NAME: "CodeThrive Infotech",

  // Google Apps Script API URL from environment variable or window config
  APPS_SCRIPT_URL: import.meta.env.VITE_APPS_SCRIPT_URL || "",

  // Default Employee Roster (4 IT, 2 Non-IT)
  DEFAULT_EMPLOYEES: [
    { id: "EMP001", name: "Employee 1", department: "IT", role: "EMPLOYEE" },
    { id: "EMP002", name: "Employee 2", department: "IT", role: "EMPLOYEE" },
    { id: "EMP003", name: "Employee 3", department: "IT", role: "EMPLOYEE" },
    { id: "EMP004", name: "Employee 4", department: "IT", role: "EMPLOYEE" },
    { id: "EMP005", name: "Employee 5", department: "Non-IT", role: "EMPLOYEE" },
    { id: "EMP006", name: "Employee 6", department: "Non-IT", role: "EMPLOYEE" }
  ],

  // Status Configurations & Badges
  STATUSES: [
    { label: "Completed", value: "Completed", color: "emerald", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
    { label: "In Progress", value: "In Progress", color: "amber", bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
    { label: "Pending", value: "Pending", color: "rose", bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
    { label: "Leave", value: "Leave", color: "indigo", bg: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30" },
    { label: "Holiday", value: "Holiday", color: "purple", bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" }
  ]
};
