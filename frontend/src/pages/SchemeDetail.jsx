import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { SECTORS } from '../constants';
import { useApp } from '../context/AppContext';
import { ErrorBox, LevelChip, Spinner, VerifyChip, sectorName } from '../components/ui';

export default function SchemeDetail() {
  const { slug } = useParams();
  const { t, lang, user } = useApp();
  const nav = useNavigate();
  const [s, setS] = useState(null);
  const [elig, setElig] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setS(null);
    api.get(`/schemes/${slug}?lang=${lang}`).then((r) => setS(r.data)).catch((e) => setErr(e.message));
  }, [slug, lang]);

  useEffect(() => {
    if (!user || !s) return;
    api.get(`/eligibility/scheme/${s._id}`).then((r) => setElig(r.eligibility)).catch(() => {});
    api.get('/saved').then((r) => setIsSaved(r.data.some((x) => x._id === s._id))).catch(() => {});
  }, [user, s]);

  const needLogin = () => { setMsg(t('loginNeeded')); setTimeout(() => nav('/login'), 800); };
  const toggleSave = async () => {
    if (!user) return needLogin();
    try { isSaved ? await api.del(`/saved/${s._id}`) : await api.post(`/saved/${s._id}`); setIsSaved(!isSaved); } catch (e) { setErr(e.message); }
  };
  const track = async () => {
    if (!user) return needLogin();
    try { await api.post('/applications', { schemeId: s._id }); setMsg('✔ ' + t('tracker')); } catch (e) { setMsg(e.message.includes('Duplicate') ? '✔ ' + t('tracker') : e.message); }
  };

  if (err && !s) return <ErrorBox message={err} />;
  if (!s) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/schemes" className="text-sm text-brand hover:underline">← {t('explore')}</Link>
      <div className="card space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="chip bg-slate-100 text-slate-700">{SECTORS[s.sector]?.icon} {sectorName(s.sector, lang)}</span>
          <LevelChip level={s.level} /><VerifyChip scheme={s} />
        </div>
        <h1 className="text-2xl font-bold">{s.name}</h1>
        <p className="text-slate-600">{s.shortDescription}</p>
        {s.department && <p className="text-sm text-slate-500">🏛 {s.department}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {s.applyUrl && <a href={s.applyUrl} target="_blank" rel="noreferrer" className="btn-accent">{t('apply')} ↗</a>}
          <button className="btn-ghost" onClick={toggleSave}>{isSaved ? '★ ' + t('unsave') : '☆ ' + t('save')}</button>
          <button className="btn-primary" onClick={track}>{t('track')}</button>
        </div>
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <ErrorBox message={err} />
      </div>

      {elig && (
        <div className={`rounded-xl border p-4 text-sm ${elig.status === 'eligible' ? 'border-green-300 bg-green-50' : elig.status === 'likely' ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
          <b>{elig.status === 'eligible' ? '✅ ' + t('eligible') : elig.status === 'likely' ? '🤔 ' + t('likely') : '❌ ' + t('notEligible')}</b>
          <ul className="mt-1 list-inside list-disc">{[...elig.matched, ...elig.unmet].map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      <Section title={t('eligibility')}>
        {s.targetBeneficiary && <p className="font-medium">{s.targetBeneficiary}</p>}
        <p>{s.eligibilityText}</p>
        {s.incomeLimitText && <p className="text-sm text-slate-500">₹ {s.incomeLimitText}</p>}
      </Section>
      <Section title={t('benefits')}><p>{s.benefits}</p></Section>
      {s.documents?.length > 0 && (
        <Section title={t('docs')}>
          <ul className="list-inside list-disc space-y-1">{s.documents.map((d) => <li key={d.name}>{d.name}{!d.required && <i className="text-slate-500"> ({t('optional')})</i>}</li>)}</ul>
        </Section>
      )}
      {s.applicationSteps?.length > 0 && (
        <Section title={`${t('steps')}${s.applicationMode ? ` - ${s.applicationMode}` : ''}`}>
          <ol className="list-inside list-decimal space-y-1">{s.applicationSteps.map((x) => <li key={x}>{x}</li>)}</ol>
        </Section>
      )}
      {s.verificationNotes && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">ℹ {s.verificationNotes}</p>}
      {s.officialUrl && <p className="text-sm text-slate-500">Source: <a className="text-brand underline" href={s.officialUrl} target="_blank" rel="noreferrer">{s.officialUrl}</a></p>}
    </div>
  );
}

const Section = ({ title, children }) => (
  <section className="card"><h2 className="mb-2 text-lg font-semibold">{title}</h2><div className="space-y-1 text-slate-700">{children}</div></section>
);
