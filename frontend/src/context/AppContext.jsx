import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../api';
import { translate } from '../i18n';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem('saarthi_lang') || 'en');
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api.get('/auth/me').then((r) => setUser(r.user)).catch(() => clearToken()).finally(() => setReady(true));
  }, []);

  const setLang = (l) => { localStorage.setItem('saarthi_lang', l); setLangState(l); };
  const t = useCallback((k) => translate(lang, k), [lang]);
  const loginWith = (res) => { setToken(res.token); setUser(res.user); };
  const logout = () => { clearToken(); setUser(null); };

  const value = useMemo(() => ({ lang, setLang, t, user, setUser, ready, loginWith, logout }), [lang, user, ready, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
