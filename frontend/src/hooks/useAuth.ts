import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "@/types/matatu";

export interface AuthUser {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: UserRole;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user and token from localStorage on mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (authToken: string, authUser: AuthUser) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginAttempts");
    localStorage.removeItem("loginLockout");
    setToken(null);
    setUser(null);
    navigate("/");
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  const getToken = () => {
    return token;
  };

  return {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    getToken,
  };
}

