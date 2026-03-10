"use client";

import { authenticateUser, createUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: number;
  email: string;
  name: string | null;
  region: string;
  currency: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name?: string,
    region?: string,
    currency?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "piggybank_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const authenticatedUser = await authenticateUser(email, password);
      if (authenticatedUser) {
        const userData = {
          id: authenticatedUser.id as number,
          email: authenticatedUser.email,
          name: authenticatedUser.name ?? null,
          region: authenticatedUser.region,
          currency: authenticatedUser.currency,
          createdAt: authenticatedUser.createdAt,
        };
        setUser(userData);
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: "Invalid credentials" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  };

  const register = async (
    email: string,
    password: string,
    name?: string,
    region?: string,
    currency?: string,
  ) => {
    try {
      const existing = await db.users.where("email").equals(email).first();
      if (existing) {
        return { success: false, error: "Email already registered" };
      }

      const newUser = await createUser(email, password, name, region, currency);
      if (newUser) {
        const userData = {
          id: newUser.id as number,
          email: newUser.email,
          name: newUser.name ?? null,
          region: newUser.region,
          currency: newUser.currency,
          createdAt: newUser.createdAt,
        };
        setUser(userData);
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: "Registration failed" };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: "Registration failed" };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
