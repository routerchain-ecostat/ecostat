import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { lsGet, lsSet, lsDel } from "../utils/storage";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null); // { provider: 'google'|'apple'|'guest', id, name, email, photo }

  useEffect(() => {
    (async () => {
      const saved = await lsGet("auth_user", null);
      setUser(saved);
      setReady(true);
    })();
  }, []);

  // provider 로그인 성공 시 공통으로 호출 — 세션을 기기에 저장한다.
  const login = useCallback(async (profile) => {
    setUser(profile);
    await lsSet("auth_user", profile);
  }, []);

  const loginGuest = useCallback(async () => {
    await login({ provider: "guest", id: "guest", name: "게스트", email: null, photo: null });
  }, [login]);

  const logout = useCallback(async () => {
    setUser(null);
    await lsDel("auth_user");
  }, []);

  return (
    <AuthContext.Provider value={{ ready, user, login, loginGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
