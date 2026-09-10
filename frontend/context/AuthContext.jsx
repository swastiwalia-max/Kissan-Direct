import { createContext, useContext, useEffect, useState } from "react";

// ----------------------------------------------------------------------------
// Mock auth only. There is no backend — this just remembers which role the
// person "logged in" as for this browser session so the routed pages and
// navbar can react to it. Nothing here should be mistaken for real auth.
// ----------------------------------------------------------------------------

const STORAGE_KEY = "kissan-direct.session";
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  function login(mockUser) {
    setUser(mockUser);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
