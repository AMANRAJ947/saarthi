import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { SECTORS } from '../constants';
import { useApp } from '../context/AppContext';
import { ErrorBox, LevelChip, Spinner, sectorName } from '../components/ui';

export default function Explore() {
  const { t, lang } = useApp();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, data: [], pages: 1, total: 0, error: '' });
  const sector = params.get('sector') || '';
  const level = params.get('level') || '';

  const setParam = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p); setPage(1); };

  useEffect(() => {
    const id = setTimeout(() => {
      const qs = new URLSearchParams({ page, limit: 12, lang });
      if (sector) qs.set('sector', sector);
      if (level) qs.set('level', level);
      if (q.trim()) qs.set('q', q.trim());
      setState((s) => ({ ...s, loading: true }));
      api.get(`/schemes?${qs}`)
        .then((r) => setState({ loading: false, data: r.data, pages: r.pages, total: r.total, error: '' }))
        .catch((e) => setState({ loading: false, data: [], pages: 1, total: 0, error: e.message }));
    }, 250);
    return () => clearTimeout(id);
  }, [q, sector, level, page, lang]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="input md:col-span-2" placeholder={t('search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className="input" value={sector} onChange={(e) => setParam('sector', e.target.value)}>
          <option value="">{t('allSectors')}</option>
          {Object.entries(SECTORS).map(([k, s]) => <option key={k} value={k}>{s.icon} {s[lang]}</option>)}
        </select>
        <select className="input" value={level} onChange={(e) => setParam('level', e.target.value)}>
          <option value="">{t('allLevels')}</option>
          <option value="central">{t('central')}</option>
          <option value="state">{t('stateScheme')}</option>
        </select>
      </div>
      <ErrorBox message={state.error} />
      {state.loading ? <Spinner /> : state.data.length === 0 ? <p className="py-12 text-center text-slate-500">{t('noResults')}</p> : (
        <>
          <p className="text-sm text-slate-500">{state.total} {t('schemesWord')}</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {state.data.map((s) => <SchemeCard key={s._id} s={s} lang={lang} t={t} />)}
          </div>
          {state.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
              <span className="text-sm">{page} / {state.pages}</span>
              <button className="btn-ghost" disabled={page >= state.pages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SchemeCard({ s, lang, t }) {
  return (
    <Link to={`/schemes/${s.slug}`} className="card flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="chip bg-slate-100 text-slate-700">{SECTORS[s.sector]?.icon} {sectorName(s.sector, lang)}</span>
        <LevelChip level={s.level} />
      </div>
      <h3 className="font-semibold leading-snug">{s.name}</h3>
      <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-600">{s.shortDescription}</p>
      <span className="mt-3 text-sm font-semibold text-brand">{t('details')} →</span>
    </Link>
  );
}
