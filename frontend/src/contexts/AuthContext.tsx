import React, { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "@/services/auth";
export type User = authApi.Me;

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Recupera sesión al montar
  useEffect(() => {
    (async () => {
      try { setUser(await authApi.me()); }
      catch { setUser(null); }
      finally { setLoading(false); }
    })();
  }, []);

  async function signUp(email: string, password: string, username: string) {
    try {
      await authApi.signup({ email, password, username });
      // opcional: auto-login
      await authApi.login({ email, password });
      setUser(await authApi.me());
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      await authApi.login({ email, password });
      setUser(await authApi.me());
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async function signOut() {
    await authApi.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
