import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import { StatusBadge } from "../../components/StatusBadge";
import { APP_CONFIG } from "../../config/appConfig";
import {
  History,
  Search,
  Filter,
  Calendar,
  Lock,
  RefreshCw
} from "lucide-react";

export function MyHistory() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMyReports(token, user);
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
    fetchHistory();
  }, [token, user]);

  // Client side filtering
  const filteredReports = reports.filter((r) => {
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchDate = !dateFilter || r.date === dateFilter;
    const matchSearch =
      !search ||
      r.workDone.toLowerCase().includes(search.toLowerCase()) ||
      r.remarks.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchDate && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-600" />
            My Work History
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Read-only archive of your submitted daily reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            Protected Read-Only View
          </span>
          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 pointer-events-none w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work done or remarks..."
            className="w-full glass-input pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Status Filter */}
        <div className="relative flex items-center">
          <Filter className="absolute left-3.5 pointer-events-none w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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

        {/* Date Filter */}
        <div className="relative flex items-center">
          <Calendar className="absolute left-3.5 pointer-events-none w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full glass-input pl-10 pr-3 py-2.5 text-xs text-slate-900"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-600">
                <th className="py-3.5 px-4">Date / Day</th>
                <th className="py-3.5 px-4">Work Done / Activities</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Issues / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading submission history...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                    No work reports found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r, idx) => (
                  <tr key={r.rowIndex || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                      <div>{r.date}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{r.day}</div>
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                        {r.workDone}
                      </p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {r.remarks || "—"}
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
