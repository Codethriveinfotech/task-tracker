import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export function Toast({ message, type = "success", onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const isError = type === "error";
  const isWarning = type === "warning";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-md animate-slide-up bg-white/95 border-slate-200 text-slate-900 max-w-md font-semibold text-xs">
      {isError ? (
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
      ) : isWarning ? (
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      )}

      <p className="text-xs font-semibold leading-snug">{message}</p>

      <button
        onClick={onClose}
        className="ml-auto p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
