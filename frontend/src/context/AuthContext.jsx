import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../services/apiService";

const AuthContext = createContext(null);
const STORAGE_KEY = "WORKPULSE_AUTH_SESSION";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on boot
  useEffect(() => {
    async function restoreSession() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.token && parsed.user) {
            const res = await apiService.verifySession(parsed.token);
            if (res.success && res.user) {
              setUser(res.user);
              setToken(parsed.token);
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const login = async (username, password) => {
    const res = await apiService.login(username, password);
    if (res.success && res.user && res.token) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: res.token, user: res.user })
      );
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || "Login failed" };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isEmployee: user?.role === "EMPLOYEE",
        isAdmin: user?.role === "ADMIN",
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
