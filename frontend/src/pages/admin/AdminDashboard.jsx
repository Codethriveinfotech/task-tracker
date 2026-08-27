import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Shield,
  RefreshCw
} from "lucide-react";

export function AdminDashboard({ onNavigate }) {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const formattedToday = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllReports(token, {});
      if (res.success && res.summary) {
        setSummary(res.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            Executive Admin Control Center
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Company Overview Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Real-time daily work reporting analytics for all 6 employees.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate("admin-reports")}
            className="btn-primary text-xs font-bold shadow-md shadow-blue-500/20 px-5 py-2.5"
          >
            View All Reports
          </button>
        </div>
      </div>

      {/* Summary Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Employees */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Employees</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {summary ? summary.totalEmployees : 6}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">4 IT Employees &bull; 2 Non-IT Employees</div>
        </div>

        {/* Reports Submitted Today */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted Today</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {loading ? "..." : summary?.submittedToday ?? 0}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">
            {summary ? Math.round((summary.submittedToday / summary.totalEmployees) * 100) : 0}% Submission Rate
          </div>
        </div>

        {/* Pending Today */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Today</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">
            {loading ? "..." : summary?.pendingToday ?? 0}
          </div>
          <div className="text-[11px] text-rose-700 font-bold">Reports awaiting submission</div>
        </div>

        {/* Completed Work Count */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasks Completed</span>
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-600">
            {loading ? "..." : summary?.statusCountsToday["Completed"] ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Fully finished activities</div>
        </div>
      </div>

      {/* Employee Today Submission Matrix Table */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Today's Employee Submission Status</h3>
            <p className="text-xs text-slate-500 font-medium">{formattedToday}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-600">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Today's Report</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                    Loading today's status matrix...
                  </td>
                </tr>
              ) : (
                summary?.employeeTodayStatus.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {emp.employeeName} ({emp.employeeId})
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-semibold">{emp.department}</td>
                    <td className="py-4 px-4">
                      {emp.submitted ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold">
                          <AlertCircle className="w-4 h-4 text-rose-600" /> Not Submitted
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {emp.submitted ? (
                        <StatusBadge status={emp.todayStatus} />
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
