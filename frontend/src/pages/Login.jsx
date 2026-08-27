import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/apiService";
import {
  Lock, User, Shield, Activity, ArrowRight,
  UserPlus, ChevronLeft, CheckCircle2
} from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";

export function Login() {
  const { login } = useAuth();

  // Login state
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [role, setRole] = useState("EMPLOYEE");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regDept, setRegDept] = useState("IT");
  const [regPass, setRegPass] = useState("");
  const [regPassConfirm, setRegPassConfirm] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [generatedId, setGeneratedId] = useState("");

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
    if (newRole === "ADMIN") {
      setUsername("CodeThrive Admin");
      setPassword("");
    } else {
      setUsername("");
      setPassword("");
    }
  };

  const switchToRegister = () => {
    setMode("register");
    setError("");
    setRegName(""); setRegPass(""); setRegPassConfirm(""); setRegSuccess(""); setGeneratedId("");
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(username, password);
      if (!res.success) setError(res.error || "Invalid username or password.");
    } catch {
      setError("Network or authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setRegSuccess("");

    if (!regName.trim() || !regPass.trim()) {
      setError("Name and password are required.");
      return;
    }
    if (regPass !== regPassConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (regPass.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.registerEmployee({
        name: regName.trim(),
        department: regDept,
        password: regPass.trim()
      });
      if (res.success) {
        setRegSuccess(res.message || "Account created!");
        setGeneratedId(res.id || "");
        setRegName(""); setRegPass(""); setRegPassConfirm("");
      } else {
        setError(res.error || "Registration failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const accentGradient = role === "ADMIN"
    ? "from-amber-500 via-orange-500 to-rose-500"
    : "from-blue-600 via-indigo-600 to-cyan-500";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-xl shadow-blue-500/20 mb-4 border border-white ring-4 ring-blue-500/10">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{APP_CONFIG.APP_NAME}</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1.5 tracking-wide">
            Employee Daily Work Reporting System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 md:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">

          {/* Top accent line */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mode === "register" ? "from-emerald-500 via-teal-500 to-cyan-500" : accentGradient}`} />

          {/* ── SIGN IN MODE ── */}
          {mode === "login" && (
            <>
              {/* Role tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mb-6">
                <button type="button" onClick={() => handleRoleChange("EMPLOYEE")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                    role === "EMPLOYEE" ? "bg-white text-blue-700 shadow-md border border-slate-200/60" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}>
                  <User className="w-3.5 h-3.5" /> Employee Login
                </button>
                <button type="button" onClick={() => handleRoleChange("ADMIN")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                    role === "ADMIN" ? "bg-white text-amber-700 shadow-md border border-slate-200/60" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}>
                  <Shield className="w-3.5 h-3.5" /> Admin Portal
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" /> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Username — Employee only */}
                {role === "EMPLOYEE" && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Employee ID or Name
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                      <input type="text" required value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. EMP001 or your name"
                        className="w-full glass-input pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400" />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
                    <input type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full glass-input pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400" />
                  </div>
                </div>

                {/* Sign In button */}
                <button type="submit" disabled={loading}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                    role === "ADMIN"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-105"
                      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:brightness-105"
                  }`}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <> Sign In to Dashboard <ArrowRight className="w-4 h-4 ml-1" /> </>
                  )}
                </button>
              </form>

              {/* Create account link — employees only */}
              {role === "EMPLOYEE" && (
                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-2">New employee? Don't have an account?</p>
                  <button onClick={switchToRegister}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    <UserPlus className="w-3.5 h-3.5" /> Create New Account
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── REGISTER MODE ── */}
          {mode === "register" && (
            <>
              {/* Back link */}
              <button onClick={switchToLogin}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-5">
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>

              <div className="mb-5">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" /> Create New Account
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Register as a new employee. Your account will be active immediately.
                </p>
              </div>

              {/* Success */}
              {regSuccess && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold space-y-2">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {regSuccess}
                  </div>
                  {generatedId && (
                    <div className="flex items-center gap-2 mt-1 p-2.5 bg-emerald-100 rounded-lg border border-emerald-200">
                      <span className="text-emerald-700 font-medium">Your Employee ID:</span>
                      <span className="font-black text-emerald-900 font-mono text-sm tracking-widest">{generatedId}</span>
                      <span className="text-emerald-600 font-medium text-[10px]">(use this to sign in)</span>
                    </div>
                  )}
                  <button onClick={switchToLogin}
                    className="block text-right w-full underline font-bold text-emerald-700 hover:text-emerald-900">
                    Sign In Now →
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" /> {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" required value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full glass-input px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400" />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Department</label>
                  <select value={regDept} onChange={(e) => setRegDept(e.target.value)}
                    className="w-full glass-input px-4 py-3 text-sm text-slate-800 font-semibold bg-white">
                    <option value="IT">IT</option>
                    <option value="Non-IT">Non-IT</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
                    <input type="password" required value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="Min. 4 characters"
                      className="w-full glass-input pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400" />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
                    <input type="password" required value={regPassConfirm}
                      onChange={(e) => setRegPassConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full glass-input pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 ${
                        regPassConfirm && regPass !== regPassConfirm ? "border-rose-400" : ""
                      }`} />
                  </div>
                  {regPassConfirm && regPass !== regPassConfirm && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Register button */}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-105">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <> <UserPlus className="w-4 h-4" /> Create My Account </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          Secured Cloud Storage &bull; {APP_CONFIG.COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}
