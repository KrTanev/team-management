/* eslint-disable react-hooks/set-state-in-effect */
import { useState, createContext, useEffect } from "react";
import type { AuthContextValue, AuthProviderProps } from "../types/auth";
import type { User } from "../../api/types/userTypes";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (user: User) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  useEffect(() => {
    const userFromLocalStorage = localStorage.getItem("user")
      ? (JSON.parse(localStorage.getItem("user") || "") as User)
      : "";

    if (userFromLocalStorage) {
      setUser(userFromLocalStorage);
    }
  }, []);

  console.log(user);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
