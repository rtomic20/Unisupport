import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";

interface JwtPayload {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  exp: number;
}

interface AuthUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseToken(token: string): AuthUser | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.exp * 1000 < Date.now()) return null;
    return {
      user_id: decoded.user_id,
      email: decoded.email,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const parsed = parseToken(token);
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/token/", { email, password });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    const parsed = parseToken(data.access);
    setUser(parsed);
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
