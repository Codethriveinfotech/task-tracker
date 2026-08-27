import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import { StatusBadge } from "../../components/StatusBadge";
import { Modal } from "../../components/Modal";
import { APP_CONFIG } from "../../config/appConfig";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Edit,
  User,
  ShieldAlert
} from "lucide-react";

export function AllReports({ onShowToast }) {
  const { user: adminUser, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  // Edit Modal State
  const [editItem, setEditItem] = useState(null);
  const [editWorkDone, setEditWorkDone] = useState("");
  const [editStatus, setEditStatus] = useState("Completed");
  const [editRemarks, setEditRemarks] = useState("");
  const [editReason, setEditReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllReports(token, {
        employeeId: selectedEmployee,
        status: selectedStatus,
        fromDate,
        toDate,
        search
      });
      if (res.success && res.reports) {
        setReports(res.reports);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token, selectedEmployee, selectedStatus, fromDate, toDate, search]);

  const handleOpenEdit = (report) => {
    setEditItem(report);
    setEditWorkDone(report.workDone || "");
    setEditStatus(report.status || "Completed");
    setEditRemarks(report.remarks || "");
    setEditReason("");
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editReason.trim()) {
      if (onShowToast) onShowToast("Please provide a reason for admin correction.", "error");
      return;
    }

    setUpdating(true);
    try {
      const res = await apiService.updateReport(
        token,
        {
          id: editItem.id,
          sheetName: editItem.sheetName,
          rowIndex: editItem.rowIndex,
          workDone: editWorkDone,
          status: editStatus,
          remarks: editRemarks,
          reason: editReason
        },
        adminUser
      );

      if (res.success) {
        if (onShowToast) onShowToast("Report updated successfully by Admin!", "success");
        setEditItem(null);
        fetchReports();
      } else {
        if (onShowToast) onShowToast(res.error || "Failed to update report.", "error");
      }
    } catch (err) {
      if (onShowToast) onShowToast("Error communicating with server.", "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Admin Work Reports Master
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Browse, search, filter, and modify submitted employee work reports.
          </p>
        </div>
      </div>

      {/* Comprehensive Filter Controls */}
      <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Employee Dropdown */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Employee Filter
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 pointer-events-none w-4 h-4 text-slate-400" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full glass-input pl-10 pr-3 py-2.5 text-xs bg-white text-slate-900 font-medium"
            >
              <option value="ALL">All Employees (6)</option>
              {APP_CONFIG.DEFAULT_EMPLOYEES.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Status Filter
          </label>
          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 pointer-events-none w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full glass-input pl-10 pr-3 py-2.5 text-xs bg-white text-slate-900 font-medium"
            >
              <option value="ALL">All Statuses</option>
              {APP_CONFIG.STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full glass-input px-3 py-2.5 text-xs text-slate-900 font-medium"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full glass-input px-3 py-2.5 text-xs text-slate-900 font-medium"
          />
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Keyword Search
          </label>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 pointer-events-none w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search text..."
              className="w-full glass-input pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Reports Data Grid */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-600">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Work Done / Activities</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching employee reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No employee reports match your current filter selection.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                      <div>{r.employeeName}</div>
                      <div className="text-[11px] text-blue-600 font-bold">
                        {r.employeeId} &bull; {r.department}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-medium">
                      <div className="font-bold text-slate-900">{r.date}</div>
                      <div className="text-[11px] text-slate-500">{r.day}</div>
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <p className="text-slate-800 leading-relaxed line-clamp-3 font-medium">
                        {r.workDone}
                      </p>
                      {r.auditLog && (
                        <span className="inline-block mt-1 text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-bold">
                          Modified by Admin
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-xs truncate font-medium">
                      {r.remarks || "—"}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit / Correct
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Edit Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Admin Correction: ${editItem?.employeeName} (${editItem?.date})`}
      >
        {editItem && (
          <form onSubmit={handleSaveCorrection} className="space-y-5">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Changes made here will overwrite the original report and will be recorded in the audit trail.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full glass-input px-3 py-2.5 text-xs bg-white text-slate-900 font-semibold"
              >
                {APP_CONFIG.STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Work Done / Activities
              </label>
              <textarea
                required
                rows={4}
                value={editWorkDone}
                onChange={(e) => setEditWorkDone(e.target.value)}
                className="w-full glass-input p-3 text-xs leading-relaxed text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Issues / Remarks
              </label>
              <textarea
                rows={2}
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                className="w-full glass-input p-3 text-xs leading-relaxed text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-600 mb-1.5">
                Correction Reason <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Corrected typo in status per employee request"
                className="w-full glass-input px-3 py-2.5 text-xs text-slate-900 font-medium"
              />
            </div>

            {editItem.auditLog && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Existing Audit Trail
                </label>
                <pre className="p-3 rounded-xl bg-slate-100 text-[11px] text-amber-900 font-mono whitespace-pre-wrap border border-slate-200">
                  {editItem.auditLog}
                </pre>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="btn-primary text-xs font-bold px-6 py-2"
              >
                {updating ? "Saving..." : "Save Correction"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
