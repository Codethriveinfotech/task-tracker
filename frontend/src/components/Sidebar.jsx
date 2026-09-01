import React from "react";
import { useAuth } from "../context/AuthContext";
import { APP_CONFIG } from "../config/appConfig";
import {
  LayoutDashboard,
  FilePlus,
  History,
  FileText,
  CalendarCheck,
  Settings,
  LogOut,
  ExternalLink
} from "lucide-react";

export function Sidebar({ activeTab, setActiveTab }) {
  const { isEmployee, isAdmin, logout } = useAuth();

  const employeeNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "submit", label: "Submit Daily Work", icon: FilePlus },
    { id: "history", label: "My Work History", icon: History }
  ];

  const adminNav = [
    { id: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "admin-reports", label: "Daily Reports", icon: FileText },
    { id: "admin-monthly", label: "Monthly Reports", icon: CalendarCheck },
    { id: "admin-settings", label: "System Settings", icon: Settings }
  ];

  const navItems = isEmployee ? employeeNav : isAdmin ? adminNav : [];

  return (
    <aside className="w-full md:w-64 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 flex flex-col justify-between shrink-0 shadow-xs">
      <div className="space-y-6">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Navigation Menu
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/80 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 space-y-3 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-sm text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          Logout
        </button>

        {/* CodeThrive Company Credit Card */}
        <a
          href={APP_CONFIG.COMPANY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-950 transition-colors border border-slate-800 shadow-sm group"
        >
          <div className="flex items-center gap-2.5">
            <img
              src={APP_CONFIG.LOGO_PATH}
              alt="CodeThrive Logo"
              className="w-11 h-11 rounded-xl object-contain bg-slate-950 p-1 border border-slate-700 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold text-slate-200 group-hover:text-cyan-300 truncate flex items-center gap-1">
                <span>{APP_CONFIG.COMPANY_NAME}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
              </div>
              <div className="text-[9px] text-emerald-400 font-semibold truncate">
                {APP_CONFIG.TAGLINE}
              </div>
            </div>
          </div>
        </a>
      </div>
    </aside>
  );
}
