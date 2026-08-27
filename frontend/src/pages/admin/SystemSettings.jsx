import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import { Modal } from "../../components/Modal";
import {
  Settings,
  Users,
  Database,
  Globe,
  Plus,
  Edit2,
  Trash2,
  Lock,
  UserPlus,
  Shield,
  RefreshCw
} from "lucide-react";

export function SystemSettings() {
  const { token, user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ADD"); // "ADD" or "EDIT"
  
  // Form State
  const [empId, setEmpId] = useState("");
  const [empName, setEmpName] = useState("");
  const [empDept, setEmpDept] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [empRole, setEmpRole] = useState("EMPLOYEE");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isBackendConnected = !!import.meta.env.VITE_APPS_SCRIPT_URL;

  const fetchEmployees = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiService.getEmployeesList(token);
      if (res.success && res.employees) {
        setEmployees(res.employees);
      } else {
        setErrorMsg(res.error || "Failed to load employee list.");
      }
    } catch (e) {
      setErrorMsg("Error connecting to server to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  const openAddModal = () => {
    setModalMode("ADD");
    setEmpId("");
    setEmpName("");
    setEmpDept("IT");
    setEmpPassword("emp123");
    setEmpRole("EMPLOYEE");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setModalMode("EDIT");
    setEmpId(emp.id);
    setEmpName(emp.name);
    setEmpDept(emp.department);
    setEmpPassword(emp.password || "emp123");
    setEmpRole(emp.role || "EMPLOYEE");
    setFormError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    if (!empId.trim() || !empName.trim() || !empDept.trim() || !empPassword.trim()) {
      setFormError("All fields are required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      id: empId.trim(),
      name: empName.trim(),
      department: empDept.trim(),
      password: empPassword.trim(),
      role: empRole
    };

    try {
      let res;
      if (modalMode === "ADD") {
        res = await apiService.addEmployee(token, payload);
      } else {
        res = await apiService.updateEmployee(token, payload);
      }

      if (res.success) {
        setSuccessMsg(res.message || "Operation successful!");
        setModalOpen(false);
        fetchEmployees();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setFormError(res.error || "Operation failed.");
      }
    } catch (err) {
      setFormError("Network communication error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (id === currentUser.id) {
      alert("You cannot delete your own admin account.");
      return;
    }

    if (confirm(`Are you sure you want to delete employee ${id}? This action cannot be undone.`)) {
      try {
        const res = await apiService.deleteEmployee(token, id);
        if (res.success) {
          setSuccessMsg(res.message || "Employee deleted successfully.");
          fetchEmployees();
          setTimeout(() => setSuccessMsg(""), 3000);
        } else {
          alert(res.error || "Failed to delete employee.");
        }
      } catch (err) {
        alert("Network communication error.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-slate-700" />
            System Settings & Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage your employee roster, roles, credentials, and track database connection endpoints.
          </p>
        </div>
        <button
          onClick={fetchEmployees}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs self-start"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-pulse">
          {successMsg}
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* Connection State Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Endpoint URL */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" />
              API Server Endpoint
            </span>
            {isBackendConnected ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Local SQLite Backend
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Mock Mode (LocalStorage)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 font-mono bg-slate-100 p-3 rounded-xl border border-slate-200 truncate font-semibold">
            {import.meta.env.VITE_APPS_SCRIPT_URL || "Mock Roster Active"}
          </p>
        </div>

        {/* Primary Storage */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              Database Engine
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {isBackendConnected ? "SQLite Database" : "Web LocalStorage"}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {isBackendConnected ? "workpulse.db" : "WORKPULSE_MOCK_ROSTER_V1"}
          </div>
        </div>
      </div>

      {/* Roster Management Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Employee Account Directory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Add, modify names, change passwords, and delete accounts.</p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary text-xs font-bold px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add New Employee
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-600">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Loading accounts directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No employees found. Create a new account.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{emp.id}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{emp.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{emp.department}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.role === "ADMIN" 
                          ? "bg-amber-55 text-amber-700 border border-amber-200" 
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}>
                        {emp.role || "EMPLOYEE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{emp.password}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "ADD" ? "Create Employee Account" : `Edit Details: ${empId}`}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {formError}
            </div>
          )}

          {/* Employee ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Employee ID / Username</span>
              {modalMode === "EDIT" && (
                <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </span>
              )}
            </label>
            <input
              type="text"
              required
              disabled={modalMode === "EDIT"}
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              placeholder="e.g. EMP007"
              className={`w-full glass-input px-3.5 py-2.5 text-sm font-semibold uppercase ${
                modalMode === "EDIT" ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : "text-slate-800"
              }`}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              placeholder="e.g. Samuel Jackson"
              className="w-full glass-input px-3.5 py-2.5 text-sm text-slate-800 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Department
              </label>
              <select
                value={empDept}
                onChange={(e) => setEmpDept(e.target.value)}
                className="w-full glass-input px-3 py-2.5 text-sm text-slate-800 font-semibold bg-white"
              >
                <option value="IT">IT</option>
                <option value="Non-IT">Non-IT</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Management">Management</option>
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Security Role
              </label>
              <select
                value={empRole}
                onChange={(e) => setEmpRole(e.target.value)}
                className="w-full glass-input px-3 py-2.5 text-sm text-slate-800 font-semibold bg-white"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Login Password
            </label>
            <input
              type="text"
              required
              value={empPassword}
              onChange={(e) => setEmpPassword(e.target.value)}
              placeholder="e.g. securePass123"
              className="w-full glass-input px-3.5 py-2.5 text-sm text-slate-800 font-semibold"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs px-4 py-2.5 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs px-6 py-2.5 font-bold shadow-sm"
            >
              {submitting ? "Saving..." : modalMode === "ADD" ? "Create Account" : "Update Details"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
