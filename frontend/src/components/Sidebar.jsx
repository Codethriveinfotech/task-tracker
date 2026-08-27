import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FilePlus,
  History,
  FileText,
  CalendarCheck,
  Settings,
  LogOut
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

      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-sm text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          Logout
        </button>
      </div>
    </aside>
  );
}
