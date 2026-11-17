import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { t, lang, setLang, user, logout } = useApp();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const link = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white'}`;
  const go = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 bg-brand shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white" onClick={go}>🧭 Saarthi</Link>
        <button className="text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
        <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 top-full w-full flex-col gap-1 bg-brand px-4 pb-4 md:static md:flex md:w-auto md:flex-row md:items-center md:bg-transparent md:p-0`}>
          <NavLink to="/find" className={link} onClick={go}>{t('find')}</NavLink>
          <NavLink to="/schemes" className={link} onClick={go}>{t('explore')}</NavLink>
          {user && <NavLink to="/tracker" className={link} onClick={go}>{t('tracker')}</NavLink>}
          <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="rounded-md border border-white/40 px-3 py-1 text-sm text-white hover:bg-white/10">
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
          {user ? (
            <button onClick={() => { logout(); go(); nav('/'); }} className="rounded-md px-3 py-2 text-sm text-white/80 hover:text-white">{t('logout')} ({user.name.split(' ')[0]})</button>
          ) : (
            <>
              <NavLink to="/login" className={link} onClick={go}>{t('login')}</NavLink>
              <Link to="/register" onClick={go} className="btn-accent">{t('register')}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
