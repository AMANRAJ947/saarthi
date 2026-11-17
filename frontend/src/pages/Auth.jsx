import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { ErrorBox } from '../components/ui';

export default function Auth({ mode }) {
  const { t, lang, loginWith } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', identifier: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isReg = mode === 'register';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const body = isReg
        ? { name: f.name, password: f.password, preferredLanguage: lang, ...(f.email && { email: f.email }), ...(f.phone && { phone: f.phone }) }
        : { identifier: f.identifier, password: f.password };
      loginWith(await api.post(isReg ? '/auth/register' : '/auth/login', body));
      nav('/find');
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card mx-auto mt-6 max-w-md space-y-4">
      <h1 className="text-xl font-bold">{isReg ? t('register') : t('login')}</h1>
      {isReg ? (
        <>
          <div><label className="label">{t('name')}</label><input className="input" required value={f.name} onChange={set('name')} /></div>
          <div><label className="label">{t('emailOpt')}</label><input type="email" className="input" value={f.email} onChange={set('email')} /></div>
          <div><label className="label">{t('mobile')}</label><input className="input" inputMode="numeric" maxLength={10} value={f.phone} onChange={set('phone')} /></div>
        </>
      ) : (
        <div><label className="label">{t('email')}</label><input className="input" required value={f.identifier} onChange={set('identifier')} /></div>
      )}
      <div><label className="label">{t('password')}</label><input type="password" minLength={isReg ? 8 : 1} className="input" required value={f.password} onChange={set('password')} /></div>
      <ErrorBox message={err} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? '...' : isReg ? t('register') : t('login')}</button>
      <p className="text-center text-sm text-slate-500">
        {isReg ? t('haveAccount') : t('noAccount')}{' '}
        <Link className="text-brand underline" to={isReg ? '/login' : '/register'}>{isReg ? t('login') : t('register')}</Link>
      </p>
    </form>
  );
}
