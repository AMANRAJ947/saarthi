import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { EDUCATION, FIELD_LABELS, OCCUPATIONS, SECTORS, STATES } from '../constants';
import { useApp } from '../context/AppContext';
import { ErrorBox, LevelChip, Spinner, VerifyChip, sectorName } from '../components/ui';

const EMPTY = { state: 'Madhya Pradesh', occupations: [] };

// Remove empty answers so "not sure" questions are simply not sent.
const clean = (p) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v !== undefined && v !== null && !(Array.isArray(v) && !v.length)));

function YesNo({ label, value, onChange }) {
  const { t } = useApp();
  const opts = [[true, t('yes')], [false, t('no')], [undefined, t('skip')]];
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex gap-2">
        {opts.map(([v, text]) => (
          <button type="button" key={text} onClick={() => onChange(v)}
            className={`rounded-lg border px-4 py-2 text-sm ${value === v ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white hover:bg-slate-100'}`}>{text}</button>
        ))}
      </div>
    </div>
  );
}

export default function FindSchemes() {
  const { t, lang, user, setUser } = useApp();
  const [step, setStep] = useState(0);
  const [p, setP] = useState(EMPTY);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNot, setShowNot] = useState(false);
  const [picked, setPicked] = useState([]);
  const [saved, setSaved] = useState(false);
  const [checklist, setChecklist] = useState(null);

  useEffect(() => { if (user?.profile && Object.keys(user.profile).length) setP({ ...EMPTY, ...user.profile }); }, [user]);

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const toggleOcc = (o) => set('occupations', p.occupations?.includes(o) ? p.occupations.filter((x) => x !== o) : [...(p.occupations || []), o]);
  const valid0 = p.age !== undefined && p.age !== '' && p.gender && p.residence;

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const profile = clean({ ...p, age: p.age === '' ? undefined : Number(p.age), annualIncome: p.annualIncome === '' || p.annualIncome === undefined ? undefined : Number(p.annualIncome) });
      const r = await api.post(`/eligibility/check?lang=${lang}`, { profile, includeIneligible: true });
      setResults(r.data); setStep(3);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const saveProfile = async () => {
    try {
      const profile = clean({ ...p, age: Number(p.age), annualIncome: p.annualIncome === undefined || p.annualIncome === '' ? undefined : Number(p.annualIncome) });
      const r = await api.put('/auth/me', { profile }); setUser(r.user); setSaved(true);
    } catch (e) { setError(e.message); }
  };

  const openChecklist = async () => {
    try { setChecklist(await api.post('/checklist', { schemeIds: picked })); } catch (e) { setError(e.message); }
  };

  if (step === 3) {
    const eligible = results.filter((r) => r.eligibility.status === 'eligible');
    const likely = results.filter((r) => r.eligibility.status === 'likely');
    const not = results.filter((r) => r.eligibility.status === 'not_eligible');
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{eligible.length + likely.length} {t('schemesWord')} 🎯</h1>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setStep(0)}>{t('editAnswers')}</button>
            {user && <button className="btn-primary" onClick={saveProfile} disabled={saved}>{saved ? '✔ ' + t('saved') : t('saveProfile')}</button>}
          </div>
        </div>
        <ErrorBox message={error} />
        <Group title={`✅ ${t('eligible')}`} items={eligible} picked={picked} setPicked={setPicked} lang={lang} t={t} />
        <Group title={`🤔 ${t('likely')}`} items={likely} picked={picked} setPicked={setPicked} lang={lang} t={t} showMissing />
        {not.length > 0 && (
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showNot} onChange={(e) => setShowNot(e.target.checked)} /> {t('showNot')} ({not.length})</label>
            {showNot && <div className="mt-3"><Group title={`❌ ${t('notEligible')}`} items={not} picked={picked} setPicked={setPicked} lang={lang} t={t} dim /></div>}
          </div>
        )}
        {picked.length > 0 && (
          <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-xl bg-brand px-5 py-3 text-white shadow-lg">
            <span className="text-sm">{picked.length} {t('selected')}</span>
            <button className="btn-accent" onClick={openChecklist}>📋 {t('makeChecklist')}</button>
          </div>
        )}
        {checklist && <ChecklistModal data={checklist} onClose={() => setChecklist(null)} t={t} />}
      </div>
    );
  }

  const titles = [t('s1'), t('s2'), t('s3')];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="mb-2 text-sm text-slate-500">{t('step')} {step + 1} / 3 - {titles[step]}</p>
        <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-saffron transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      </div>
      <div className="card space-y-5">
        {step === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">{t('age')}</label><input type="number" min="0" max="120" className="input" value={p.age ?? ''} onChange={(e) => set('age', e.target.value)} /></div>
              <div>
                <label className="label">{t('gender')}</label>
                <select className="input" value={p.gender || ''} onChange={(e) => set('gender', e.target.value)}>
                  <option value="">-</option><option value="male">{t('male')}</option><option value="female">{t('female')}</option><option value="other">{t('other')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('state')}</label>
                <select className="input" value={p.state || ''} onChange={(e) => set('state', e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
              <div><label className="label">{t('district')}</label><input className="input" value={p.district || ''} onChange={(e) => set('district', e.target.value)} /></div>
            </div>
            <div>
              <p className="label">{t('area')}</p>
              <div className="flex gap-2">{['rural', 'urban'].map((r) => (
                <button key={r} type="button" onClick={() => set('residence', r)} className={`flex-1 rounded-lg border px-4 py-3 text-sm ${p.residence === r ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white hover:bg-slate-100'}`}>{t(r)}</button>
              ))}</div>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div>
              <p className="label">{t('occupation')}</p>
              <div className="flex flex-wrap gap-2">{Object.entries(OCCUPATIONS).map(([k, o]) => (
                <button key={k} type="button" onClick={() => toggleOcc(k)} className={`rounded-full border px-3 py-1.5 text-sm ${p.occupations?.includes(k) ? 'border-saffron bg-saffron text-white' : 'border-slate-300 bg-white hover:bg-slate-100'}`}>{o[lang]}</button>
              ))}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">{t('income')}</label><input type="number" min="0" className="input" value={p.annualIncome ?? ''} onChange={(e) => set('annualIncome', e.target.value)} /></div>
              <div>
                <label className="label">{t('category')}</label>
                <select className="input" value={p.category || ''} onChange={(e) => set('category', e.target.value)}>
                  <option value="">-</option>{['General', 'OBC', 'SC', 'ST', 'EWS'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('education')}</label>
                <select className="input" value={p.educationLevel || ''} onChange={(e) => set('educationLevel', e.target.value)}>
                  <option value="">-</option>{Object.entries(EDUCATION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <YesNo label={t('ownsLand')} value={p.ownsLand} onChange={(v) => set('ownsLand', v)} />
            <YesNo label={t('isBPL')} value={p.isBPL} onChange={(v) => set('isBPL', v)} />
            <YesNo label={t('hasPuccaHouse')} value={p.hasPuccaHouse} onChange={(v) => set('hasPuccaHouse', v)} />
            <YesNo label={t('hasGirl')} value={p.hasGirlChildUnder10} onChange={(v) => set('hasGirlChildUnder10', v)} />
            <YesNo label={t('hasDisability')} value={p.hasDisability} onChange={(v) => set('hasDisability', v)} />
          </div>
        )}
        <ErrorBox message={error} />
        <div className="flex justify-between pt-2">
          <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>{t('back')}</button>
          {step < 2
            ? <button className="btn-primary" disabled={step === 0 && !valid0} onClick={() => setStep(step + 1)}>{t('next')}</button>
            : <button className="btn-accent" disabled={loading} onClick={submit}>{loading ? '...' : t('seeResults')}</button>}
        </div>
      </div>
      {loading && <Spinner />}
    </div>
  );
}

function Group({ title, items, picked, setPicked, lang, t, showMissing, dim }) {
  if (!items.length) return null;
  const toggle = (id) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title} ({items.length})</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ scheme: s, eligibility: e }) => (
          <div key={s._id} className={`card ${dim ? 'opacity-70' : ''}`}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <span className="chip bg-slate-100 text-slate-700">{SECTORS[s.sector]?.icon} {sectorName(s.sector, lang)}</span>
                <LevelChip level={s.level} />
              </div>
              <input type="checkbox" className="mt-1 h-4 w-4" checked={picked.includes(s._id)} onChange={() => toggle(s._id)} aria-label="Add to checklist" />
            </div>
            <Link to={`/schemes/${s.slug}`} className="font-semibold text-brand hover:underline">{s.name}</Link>
            <p className="mt-1 text-sm text-slate-600">{s.shortDescription}</p>
            <ul className="mt-2 space-y-0.5 text-xs">
              {e.matched.slice(0, 4).map((m) => <li key={m} className="text-green-700">✔ {m}</li>)}
              {dim && e.unmet.map((m) => <li key={m} className="text-red-700">✖ {m}</li>)}
            </ul>
            {showMissing && e.missing.length > 0 && (
              <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">{t('moreInfo')}: {e.missing.map((f) => FIELD_LABELS[f] || f).join(', ')}</p>
            )}
            <div className="mt-3"><VerifyChip scheme={s} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChecklistModal({ data, onClose, t }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">📋 {t('checklist')}</h2>
        <p className="mt-1 text-xs text-slate-500">{data.schemes.join(' • ')}</p>
        <ul className="mt-4 divide-y">
          {data.documents.map((d) => (
            <li key={d.name} className="py-2">
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" />
                <span><b>{d.name}</b>{!d.required && <i className="text-slate-500"> ({t('optional')})</i>}
                  <span className="block text-xs text-slate-500">{d.neededFor.length > 1 ? `${d.neededFor.length}× ` : ''}{d.neededFor.join(', ')}</span></span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => window.print()}>🖨 {t('print')}</button>
          <button className="btn-primary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  );
}
