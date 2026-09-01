import React from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Calendar, Activity } from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";

export function Navbar() {
  const { user, logout } = useAuth();

  const formattedDate = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Logo */}
        <a
          href={APP_CONFIG.COMPANY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group"
          title="Created by CodeThrive Infotech - Visit Website"
        >
          <img
            src={APP_CONFIG.LOGO_PATH}
            alt="CodeThrive Infotech Logo"
            className="h-16 w-auto rounded-xl object-contain bg-slate-900 border border-slate-700/60 p-1.5 shadow-md group-hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              {APP_CONFIG.APP_NAME}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide flex items-center gap-1">
              <span>{APP_CONFIG.COMPANY_NAME}</span>
              <span className="text-[9px] text-emerald-600 font-bold px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200">
                Official
              </span>
            </p>
          </div>
        </a>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Today Date Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Today: <strong className="text-slate-900 font-bold">{formattedDate}</strong></span>
          </div>

          {/* User Profile info */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                  {user.name}
                  {user.role === "ADMIN" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                      ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                      {user.department}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono font-medium">{user.id}</div>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
