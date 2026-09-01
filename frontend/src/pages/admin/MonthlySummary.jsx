import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService, getTodayDateStr } from "../../services/apiService";
import { APP_CONFIG } from "../../config/appConfig";
import * as XLSX from "xlsx";
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";

export function MonthlySummary({ onShowToast }) {
  const { token } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getTodayDateStr().substring(0, 7)); // YYYY-MM
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMonthlySummary(token, selectedMonth);
      if (res.success && res.summaries) {
        setSummaries(res.summaries);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthly();
  }, [token, selectedMonth]);

  // Handle Export to Excel maintaining Monthly Summary, Month Sheet (e.g. Sept 2026), & Employee sheets
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // Compute start and end date for the selected month accurately
      const [yearStr, monthStr] = selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const lastDay = new Date(year, month, 0).getDate();
      const lastDayStr = String(lastDay).padStart(2, '0');

      const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      const monthShort = monthNamesShort[month - 1] || "Month";
      const monthSheetName = `${monthShort} ${year}`; // e.g. "Sept 2026"

      // Fetch all reports for the selected month from API
      const res = await apiService.getAllReports(token, {
        fromDate: `${selectedMonth}-01`,
        toDate: `${selectedMonth}-${lastDayStr}`
      });

      const allMonthReports = res.reports || [];
      const wb = XLSX.utils.book_new();

      // Tab 1: Executive Monthly Summary Matrix
      const summaryRows = summaries.map((s) => ({
        "Employee ID": s.employeeId,
        "Employee Name": s.employeeName,
        "Department": s.department,
        "Reporting Days": s.metrics.reportingDays,
        "Completed": s.metrics.completed,
        "In Progress": s.metrics.inProgress,
        "Pending": s.metrics.pending,
        "Leave": s.metrics.leave,
        "Holiday": s.metrics.holiday
      }));
      const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Monthly Summary");

      // Tab 2: Dedicated Month Sheet (e.g., "Sept 2026") - All activities for the month
      const monthRows = allMonthReports.map((r) => ({
        "Employee ID": r.employeeId,
        "Employee Name": r.employeeName,
        "Department": r.department,
        "Date": r.date,
        "Day": r.day,
        "Work Done / Activities": r.workDone,
        "Status": r.status,
        "Issues / Remarks": r.remarks,
        "Timestamp": r.timestamp,
        "Audit Log": r.auditLog
      }));
      const monthWs = XLSX.utils.json_to_sheet(monthRows.length > 0 ? monthRows : [{
        "Employee ID": "—",
        "Employee Name": "—",
        "Department": "—",
        "Date": "—",
        "Day": "—",
        "Work Done / Activities": `No submissions recorded for ${monthSheetName}`,
        "Status": "—",
        "Issues / Remarks": "—",
        "Timestamp": "—",
        "Audit Log": "—"
      }]);
      XLSX.utils.book_append_sheet(wb, monthWs, monthSheetName);

      // Fetch employees list dynamically from database
      const empRes = await apiService.getEmployeesList(token);
      const employeesList = empRes.employees || [];

      // Separate Individual Employee Sheets
      employeesList.forEach((emp) => {
        const empReports = allMonthReports.filter((r) => r.employeeId === emp.id);
        const rows = empReports.map((r) => ({
          "Timestamp": r.timestamp,
          "Date": r.date,
          "Day": r.day,
          "Work Done / Activities": r.workDone,
          "Status": r.status,
          "Issues / Remarks": r.remarks,
          "Audit Log": r.auditLog
        }));
        const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{
          "Timestamp": "—",
          "Date": "—",
          "Day": "—",
          "Work Done / Activities": `No submissions for ${monthSheetName}`,
          "Status": "—",
          "Issues / Remarks": "—",
          "Audit Log": "—"
        }]);
        XLSX.utils.book_append_sheet(wb, ws, emp.name);
      });

      // Write workbook file download
      const fileName = `Employee_Monthly_Work_Report_${selectedMonth}.xlsx`;
      XLSX.writeFile(wb, fileName);

      if (onShowToast) {
        onShowToast(`Exported ${fileName} with '${monthSheetName}' month tab!`, "success");
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast("Failed to export Excel file.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            Monthly Work Report Summary
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Aggregated monthly metrics & multi-sheet Excel export.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="btn-primary text-xs font-bold shadow-md shadow-blue-500/20 px-5 py-2.5"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {exporting ? "Generating Excel..." : "Export to Excel (.xlsx)"}
        </button>
      </div>

      {/* Month Selector Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Select Month:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="glass-input text-xs font-bold text-slate-900 px-3 py-2 bg-white"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing summary metrics for <strong className="text-slate-900 font-bold">{selectedMonth}</strong>
        </span>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Calculating monthly rollups...
          </div>
        ) : (
          summaries.map((s) => (
            <div key={s.employeeId} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{s.employeeName}</h3>
                  <p className="text-xs text-blue-600 font-semibold">
                    {s.employeeId} &bull; {s.department}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
                  {s.metrics.reportingDays} Days
                </div>
              </div>

              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                  </span>
                  <strong className="text-emerald-700 text-sm font-bold">{s.metrics.completed}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> In Progress
                  </span>
                  <strong className="text-amber-700 text-sm font-bold">{s.metrics.inProgress}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Pending
                  </span>
                  <strong className="text-rose-700 text-sm font-bold">{s.metrics.pending}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Leave/Holiday
                  </span>
                  <strong className="text-indigo-700 text-sm font-bold">
                    {s.metrics.leave + s.metrics.holiday}
                  </strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
