import React from "react";
import { CheckCircle2, Clock, AlertCircle, Calendar, Sparkles } from "lucide-react";

export function StatusBadge({ status }) {
  const getBadgeStyle = () => {
    switch (status) {
      case "Completed":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        };
      case "In Progress":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        };
      case "Pending":
        return {
          bg: "bg-rose-50",
          text: "text-rose-700",
          border: "border-rose-200",
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        };
      case "Leave":
        return {
          bg: "bg-indigo-50",
          text: "text-indigo-700",
          border: "border-indigo-200",
          icon: <Calendar className="w-3.5 h-3.5 text-indigo-600" />
        };
      case "Holiday":
        return {
          bg: "bg-purple-50",
          text: "text-purple-700",
          border: "border-purple-200",
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />
        };
      default:
        return {
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: null
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs ${style.bg} ${style.text} ${style.border}`}
    >
      {style.icon}
      {status || "Unknown"}
    </span>
  );
}
