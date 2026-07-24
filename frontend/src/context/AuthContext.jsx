import { createContext, useContext, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setIsAuthLoading(false);
      return;
    }

    axiosClient
      .get("/auth/me")
      .then((response) => {
        setCurrentUser(response.data.data);
        localStorage.setItem("authUser", JSON.stringify(response.data.data));
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setCurrentUser(null);
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  function loginWithCredentials(authToken, userData) {
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("authUser", JSON.stringify(userData));
    setCurrentUser(userData);
  }

  function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthLoading, loginWithCredentials, logout }}>
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
