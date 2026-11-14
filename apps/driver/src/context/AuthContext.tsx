import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Language } from '@delivery/shared';
import { api, loadToken, setToken } from '../lib/api';

type AuthState = {
  user: User | null;
  lang: Language;
  ready: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setLang: (l: Language) => void;
};
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ar');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await loadToken();
        if (t) {
          const { user } = await api.me();
          if (user.role !== 'DRIVER') { await setToken(null); }
          else { setUser(user); if (user.language === 'en' || user.language === 'ar') setLang(user.language); }
        }
      } catch { await setToken(null); }
      finally { setReady(true); }
    })();
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await api.login({ phone, password });
    if (res.user.role !== 'DRIVER') throw new Error('Not a driver account');
    await setToken(res.token);
    setUser(res.user);
  };
  const logout = async () => { await setToken(null); setUser(null); };

  return <AuthContext.Provider value={{ user, lang, ready, login, logout, setLang }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
