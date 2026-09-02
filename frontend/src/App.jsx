import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { Login } from "./pages/Login";

// Employee Pages
import { EmployeeDashboard } from "./pages/employee/EmployeeDashboard";
import { SubmitWork } from "./pages/employee/SubmitWork";
import { MyHistory } from "./pages/employee/MyHistory";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AllReports } from "./pages/admin/AllReports";
import { MonthlySummary } from "./pages/admin/MonthlySummary";
import { SystemSettings } from "./pages/admin/SystemSettings";

function MainContent() {
  const { isAuthenticated, isEmployee, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("");
  const [toast, setToast] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Set default active tab based on role once logged in
  React.useEffect(() => {
    if (isEmployee && (!activeTab || activeTab.startsWith("admin"))) {
      setActiveTab("dashboard");
    } else if (isAdmin && (!activeTab || !activeTab.startsWith("admin"))) {
      setActiveTab("admin-dashboard");
    }
  }, [isEmployee, isAdmin]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading WorkPulse System...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActiveView = () => {
    if (isEmployee) {
      switch (activeTab) {
        case "submit":
          return <SubmitWork onNavigate={setActiveTab} onShowToast={showToast} />;
        case "history":
          return <MyHistory />;
        case "dashboard":
        default:
          return <EmployeeDashboard onNavigate={setActiveTab} />;
      }
    } else if (isAdmin) {
      switch (activeTab) {
        case "admin-reports":
          return <AllReports onShowToast={showToast} />;
        case "admin-monthly":
          return <MonthlySummary onShowToast={showToast} />;
        case "admin-settings":
          return <SystemSettings />;
        case "admin-dashboard":
        default:
          return <AdminDashboard onNavigate={setActiveTab} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main className="flex-1 min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
