import { SECTORS } from '../constants';
import { useApp } from '../context/AppContext';

export const Spinner = () => (
  <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand" /></div>
);

export const ErrorBox = ({ message }) => message ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div> : null;

export const sectorName = (key, lang) => SECTORS[key]?.[lang] || SECTORS[key]?.en || key;

export function LevelChip({ level }) {
  const { t } = useApp();
  return level === 'state'
    ? <span className="chip bg-saffron-light text-saffron">{t('stateScheme')}</span>
    : <span className="chip bg-brand-light text-brand">{t('central')}</span>;
}

export function VerifyChip({ scheme }) {
  const { t } = useApp();
  const ok = scheme.verified || /^L2/i.test(scheme.verificationLevel || '');
  return <span className={`chip ${ok ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`} title={ok ? t('verified') : t('unverified')}>{ok ? '✔ ' + t('verified') : '⚠ ' + t('unverified')}</span>;
}

export function Disclaimer() {
  const { t } = useApp();
  return <p className="rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-900">⚠ {t('disclaimer')}</p>;
}
