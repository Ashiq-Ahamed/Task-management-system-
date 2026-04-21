import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

const normalizeToken = (value) => {
  if (typeof value !== "string") return null;

  let token = value.trim();
  if (!token) return null;

  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }

  if (token.startsWith('"')) {
    try {
      const parsed = JSON.parse(token);
      if (typeof parsed === "string") token = parsed.trim();
    } catch (_err) {
      // Ignore invalid JSON wrapper.
    }
  }

  return token || null;
};

const parseStoredAuth = (stored) => {
  if (!stored || typeof stored !== "string") return null;

  const raw = stored.trim();
  if (!raw) return null;

  if (raw.startsWith("{")) {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const token = normalizeToken(parsed.token);
    if (!token || !parsed.user) return null;

    return {
      user: parsed.user,
      token,
    };
  }

  // Legacy storage where only token was saved.
  const token = normalizeToken(raw);
  if (!token) return null;

  return {
    user: null,
    token,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================================
     RESTORE AUTH ON REFRESH
  ========================================= */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");
      const parsed = parseStoredAuth(stored);

      if (parsed?.token && parsed?.user) {
        setUser(parsed.user);
        setToken(parsed.token);
      } else {
        localStorage.removeItem("auth");
      }
    } catch (error) {
      console.error("Invalid auth data:", error);
      localStorage.removeItem("auth");
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================
     SAVE AUTH DATA
  ========================================= */
  const saveAuth = (data) => {
    const safeToken = normalizeToken(data?.token);
    const authData = {
      user: data.user,
      token: safeToken,
    };

    localStorage.setItem("auth", JSON.stringify(authData));

    setUser(data.user);
    setToken(safeToken);
  };

  /* =========================================
     LOGIN
  ========================================= */
  const login = useCallback(async (formData) => {
    try {
      const data = await authApi.login(formData);

      if (!data?.user || !data?.token) {
        throw new Error("Invalid response from server");
      }

      saveAuth(data);
      return { success: true };
    } catch (error) {
      const rawMessage = error?.message || "Login failed";
      const status = error?.status;
      const normalizedMessage = rawMessage.toLowerCase();

      const isCredentialError =
        status === 401 ||
        normalizedMessage.includes("invalid email or password");

      const message = isCredentialError
        ? "Invalid email or password"
        : rawMessage;
      return { success: false, message };
    }
  }, []);

  /* =========================================
     REGISTER
  ========================================= */
  const register = useCallback(async (formData) => {
    try {
      const data = await authApi.register(formData);

      if (!data?.user || !data?.token) {
        throw new Error("Invalid response from server");
      }

      saveAuth(data);
      return { success: true };
    } catch (error) {
      const rawMessage = error?.message || "Registration failed";
      return { success: false, message: rawMessage };
    }
  }, []);

  /* =========================================
     LOGOUT
  ========================================= */
  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem("auth");
    setUser(null);
    setToken(null);
  }, []);

  /* =========================================
     AUTO LOGOUT ON TOKEN EXPIRE
  ========================================= */
  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      const expiry = payload.exp * 1000;

      if (Date.now() >= expiry) logout();
    } catch {
      logout();
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =========================================
   CUSTOM HOOK
========================================= */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
