// Frontend/src/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, AuthContextType } from "./types";
import { API_BASE, TOKEN_KEY, USER_KEY } from "./utils/api";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const persistUserKeys = useCallback((tokenStr: string, userData: User) => {
    const resolvedId = userData?.id || userData?._id || "";
    const normalized: User = { ...userData, id: resolvedId, _id: resolvedId };
    localStorage.setItem(TOKEN_KEY, tokenStr);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    if (resolvedId) {
      localStorage.setItem("userId", resolvedId);
      localStorage.setItem("uid", resolvedId);
    }
    if (normalized.name) localStorage.setItem("uname", normalized.name);
    setToken(tokenStr);
    setUser(normalized);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("userId");
    localStorage.removeItem("uid");
    localStorage.removeItem("uname");
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    (tokenStr: string, userData: User) => {
      persistUserKeys(tokenStr, userData);
    },
    [persistUserKeys]
  );

  // Verify token validity against /user/me on mount
  useEffect(() => {
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/user/me`, {
      headers: { Authorization: `Bearer ${existingToken}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error("Session invalid");
        }
        return r.json();
      })
      .then((data) => {
        if (!cancelled && data.user) {
          persistUserKeys(existingToken, data.user);
        }
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [persistUserKeys, logout]);

  // Auto-clear expired session on 401 responses anywhere in the app
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("yoga:auth-expired", handler);
    return () => window.removeEventListener("yoga:auth-expired", handler);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
