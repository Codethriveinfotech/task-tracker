import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import { StatusBadge } from "../../components/StatusBadge";
import {
  FilePlus,
  History,
  CheckCircle,
  AlertCircle,
  Calendar,
  UserCheck,
  ChevronRight
} from "lucide-react";

export function EmployeeDashboard({ onNavigate }) {
  const { user, token } = useAuth();
  const [todayReport, setTodayReport] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentCount, setRecentCount] = useState(0);

  const formattedToday = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const res = await apiService.getTodayReport(token, user);
        if (res.success) {
          setHasSubmitted(res.hasSubmitted);
          setTodayReport(res.report);
        }

        const hist = await apiService.getMyReports(token, user);
        if (hist.success && hist.reports) {
          setRecentCount(hist.reports.length);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [token, user]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 md:p-8 text-white shadow-xl shadow-blue-500/10 border border-blue-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              {user.department} Department
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome, {user.name}
            </h2>
            <p className="text-sm text-blue-100 font-medium">
              Employee ID: <strong className="text-white font-bold">{user.id}</strong> &bull; Ready for today's report?
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
            <Calendar className="w-8 h-8 text-white" />
            <div>
              <div className="text-[11px] text-blue-100 uppercase font-bold tracking-wider">Today's Date</div>
              <div className="text-lg font-black text-white">{formattedToday}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Submission Status Card */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today's Work Report Status
              </h3>
              {loading ? (
                <span className="text-xs text-slate-400 font-medium">Checking...</span>
              ) : hasSubmitted ? (
                <StatusBadge status={todayReport?.status || "Completed"} />
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Not Submitted
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : hasSubmitted ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Submitted at {todayReport?.timestamp || "Today"}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic line-clamp-3">
                  "{todayReport?.workDone}"
                </p>
                {todayReport?.remarks && todayReport?.remarks !== "—" && (
                  <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 font-medium">
                    Remarks: {todayReport.remarks}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-1">Action Required</strong>
                  You haven't submitted your daily work report for {formattedToday} yet. Please submit it before EOD.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate("submit")}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              hasSubmitted
                ? "btn-secondary text-blue-700 hover:text-blue-900"
                : "btn-primary shadow-lg shadow-blue-500/20"
            }`}
          >
            <FilePlus className="w-4 h-4" />
            {hasSubmitted ? "View Today's Report" : "Submit Today's Work"}
          </button>
        </div>

        {/* Work History Summary Card */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Previous Work Reports
              </h3>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {recentCount} Saved Records
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Review all your historical submissions, search previous activities, and verify past daily reports.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Total Submissions:</span>
                <strong className="text-slate-900 font-bold">{recentCount}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Data Security:</span>
                <span className="text-emerald-700 font-bold">Read-Only Protected</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("history")}
            className="w-full btn-secondary text-xs font-bold py-3.5 flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" />
            View My Work History
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
