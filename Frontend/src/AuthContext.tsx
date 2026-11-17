// src/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { User, AuthContextType } from "./types";

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "yoga_token";
const USER_KEY = "yoga_user";

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

  const login = useCallback((tokenStr: string, userData: User) => {
    localStorage.setItem(TOKEN_KEY, tokenStr);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    if (userData?.id) localStorage.setItem("userId", userData.id);
    if (userData?._id) localStorage.setItem("userId", userData._id);
    if (userData?.name) localStorage.setItem("uname", userData.name);
    setToken(tokenStr);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("userId");
    localStorage.removeItem("uname");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
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
