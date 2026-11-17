import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { SECTORS } from '../constants';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { t, lang } = useApp();
  const [counts, setCounts] = useState({});
  useEffect(() => {
    api.get('/schemes/sectors').then((r) => setCounts(Object.fromEntries(r.data.map((d) => [d.sector, d.count])))).catch(() => {});
  }, []);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-14 text-center text-white">
        <p className="mb-2 text-sm font-medium text-saffron-light">{t('tagline')}</p>
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">{t('heroTitle')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/80">{t('heroSub')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/find" className="btn-accent px-6 py-3 text-base">{t('startBtn')}</Link>
          <Link to="/schemes" className="btn bg-white/10 px-6 py-3 text-base text-white hover:bg-white/20">{t('browseBtn')}</Link>
        </div>
        {total > 0 && <p className="mt-6 text-sm text-white/70">{total} {t('schemesWord')}</p>}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t('sectors')}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(SECTORS).map(([key, s]) => (
            <Link key={key} to={`/schemes?sector=${key}`} className="card text-center transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-3xl">{s.icon}</div>
              <div className="mt-2 text-sm font-semibold">{s[lang]}</div>
              <div className="text-xs text-slate-500">{counts[key] ?? 0} {t('schemesWord')}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t('how')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[['1', 'how1', 'how1d'], ['2', 'how2', 'how2d'], ['3', 'how3', 'how3d']].map(([n, a, b]) => (
            <div key={n} className="card">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-saffron text-white font-bold">{n}</div>
              <h3 className="font-semibold">{t(a)}</h3>
              <p className="mt-1 text-sm text-slate-600">{t(b)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
