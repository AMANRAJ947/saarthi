import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { APP_STATUSES } from '../constants';
import { useApp } from '../context/AppContext';
import { ErrorBox, Spinner } from '../components/ui';

export default function Tracker() {
  const { t, lang } = useApp();
  const [apps, setApps] = useState(null);
  const [saved, setSaved] = useState([]);
  const [dash, setDash] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    Promise.all([api.get('/applications'), api.get('/saved'), api.get('/applications/dashboard')])
      .then(([a, s, d]) => { setApps(a.data); setSaved(s.data); setDash(d); })
      .catch((e) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  const patch = async (id, body) => { try { await api.patch(`/applications/${id}`, body); load(); } catch (e) { setErr(e.message); } };
  const remove = async (id) => { try { await api.del(`/applications/${id}`); load(); } catch (e) { setErr(e.message); } };

  if (!apps) return err ? <ErrorBox message={err} /> : <Spinner />;
  return (
    <div className="space-y-8">
      <ErrorBox message={err} />
      <section>
        <h1 className="mb-4 text-2xl font-bold">{t('trackerTitle')}</h1>
        {dash && dash.total > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(dash.byStatus).map(([k, v]) => <span key={k} className="chip bg-brand-light text-brand">{APP_STATUSES[k]?.[lang] || k}: {v}</span>)}
          </div>
        )}
        {apps.length === 0 ? <p className="text-slate-500">{t('empty')}</p> : (
          <div className="space-y-3">
            {apps.map((a) => (
              <div key={a._id} className="card flex flex-wrap items-center gap-3">
                <div className="min-w-[200px] flex-1">
                  <Link to={`/schemes/${a.scheme?.slug}`} className="font-semibold text-brand hover:underline">{a.scheme?.name}</Link>
                  {a.history?.length > 0 && <p className="text-xs text-slate-500">{new Date(a.updatedAt).toLocaleDateString()}</p>}
                </div>
                <select className="input w-auto" value={a.status} onChange={(e) => patch(a._id, { status: e.target.value })}>
                  {Object.entries(APP_STATUSES).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
                </select>
                <input className="input w-40" placeholder={t('refNo')} defaultValue={a.referenceNumber || ''} onBlur={(e) => e.target.value !== (a.referenceNumber || '') && patch(a._id, { referenceNumber: e.target.value })} />
                <button className="btn-ghost" onClick={() => remove(a._id)}>{t('remove')}</button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">{t('savedTitle')}</h2>
        {saved.length === 0 ? <p className="text-slate-500">{t('empty')}</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            {saved.map((s) => <Link key={s._id} to={`/schemes/${s.slug}`} className="card hover:shadow-md"><b>{s.name}</b><p className="text-sm text-slate-600">{s.shortDescription}</p></Link>)}
          </div>
        )}
      </section>
    </div>
  );
}
