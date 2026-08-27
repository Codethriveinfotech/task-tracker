import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService, getTodayDateStr } from "../../services/apiService";
import { StatusBadge } from "../../components/StatusBadge";
import { APP_CONFIG } from "../../config/appConfig";
import {
  FileText,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  Send,
  Lock,
  MessageSquare
} from "lucide-react";

export function SubmitWork({ onNavigate, onShowToast }) {
  const { user, token } = useAuth();
  const [workDone, setWorkDone] = useState("");
  const [status, setStatus] = useState("Completed");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = getTodayDateStr();
  const formattedTodayDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // Check if today report already exists
  useEffect(() => {
    async function checkToday() {
      setLoading(true);
      try {
        const res = await apiService.getTodayReport(token, user);
        if (res.success && res.hasSubmitted) {
          setHasSubmitted(true);
          setExistingReport(res.report);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkToday();
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasSubmitted) return;

    if (!workDone.trim()) {
      setErrorMsg("Please fill in the Work Done / Activities field.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await apiService.submitDailyReport(
        token,
        { workDone, status, remarks },
        user
      );

      if (res.success) {
        setHasSubmitted(true);
        setExistingReport(res.record);
        if (onShowToast) {
          onShowToast("Daily work report submitted successfully!", "success");
        }
      } else {
        if (res.isDuplicate) {
          setHasSubmitted(true);
        }
        setErrorMsg(res.error || "Failed to submit daily report.");
        if (onShowToast) {
          onShowToast(res.error || "Failed to submit report.", "error");
        }
      }
    } catch (err) {
      setErrorMsg("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center flex-col gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-semibold">Loading report status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-250">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Submit Daily Work Report
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Log your daily accomplishments, status, and remarks for management review.
          </p>
        </div>
      </div>

      {/* Duplicate Submission Warning Banner */}
      {hasSubmitted && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-250 text-amber-900 space-y-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                You have already submitted today's work report.
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Per company security policy, employees are permitted 1 report submission per date. Historical entries are read-only and locked against modifications.
              </p>
            </div>
          </div>

          {/* Read-Only Record Card */}
          {existingReport && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Read-Only Submission ({existingReport.date})
                </span>
                <StatusBadge status={existingReport.status} />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Work Done / Activities
                </label>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm whitespace-pre-wrap text-slate-900 leading-relaxed">
                  {existingReport.workDone}
                </div>
              </div>

              {existingReport.remarks && existingReport.remarks !== "—" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Issues / Remarks
                  </label>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                    {existingReport.remarks}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 font-mono">
                Timestamp: {existingReport.timestamp}
              </div>
            </div>
          )}

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate("history")}
              className="btn-secondary text-xs font-semibold px-5 py-2.5"
            >
              View My Work History
            </button>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      {!hasSubmitted && (
        <form onSubmit={handleSubmit} className="glass-panel border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Name (Locked) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Employee Name
                </span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </span>
              </label>
              <input
                type="text"
                readOnly
                value={`${user.name} (${user.id})`}
                className="w-full glass-input px-4 py-3 font-semibold text-slate-800 bg-slate-50 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                Auto-populated from logged-in account
              </span>
            </div>

            {/* Date (Locked) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Report Date
                </span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </span>
              </label>
              <input
                type="text"
                readOnly
                value={`${todayStr} (${formattedTodayDate.split(",")[0]})`}
                className="w-full glass-input px-4 py-3 font-semibold text-slate-800 bg-slate-50 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                Auto-generated server date
              </span>
            </div>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Status <span className="text-rose-600">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full glass-input px-4 py-3 text-sm text-slate-800 font-semibold bg-white border border-slate-200"
            >
              {APP_CONFIG.STATUSES.map((st) => (
                <option key={st.value} value={st.value} className="bg-white text-slate-800 font-medium">
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Work Done / Activities Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Work Done / Activities <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              placeholder="Describe the work you completed or worked on today..."
              className="w-full glass-input p-4 text-sm leading-relaxed text-slate-800 placeholder-slate-400 border border-slate-200"
            />
          </div>

          {/* Issues / Remarks Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              Issues / Remarks <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Mention any issue, blocker, delay, or additional information..."
              className="w-full glass-input p-4 text-sm leading-relaxed text-slate-800 placeholder-slate-400 border border-slate-200"
            />
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="btn-secondary text-xs px-5 py-3"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm shadow-xl px-8 py-3"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Daily Work
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
