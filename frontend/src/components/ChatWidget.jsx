import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';

export default function ChatWidget() {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  const send = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    const history = msgs.slice(-8).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { role: 'user', text: message }]); setText(''); setBusy(true);
    try {
      const r = await api.post('/chat', { message, language: lang, history });
      setMsgs((m) => [...m, { role: 'model', text: r.reply, schemes: r.schemes }]);
    } catch (err) {
      setMsgs((m) => [...m, { role: 'model', text: err.message }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-saffron text-2xl text-white shadow-lg hover:opacity-90" aria-label={t('chatTitle')}>
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[28rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-xl border bg-white shadow-2xl">
          <div className="bg-brand px-4 py-3 font-semibold text-white">🧭 {t('chatTitle')}</div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {msgs.length === 0 && <p className="text-slate-500">{t('chatHint')}</p>}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                <div className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-left ${m.role === 'user' ? 'bg-brand text-white' : 'bg-slate-100'}`}>{m.text}</div>
                {m.schemes?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">{m.schemes.map((s) => <Link key={s._id} to={`/schemes/${s.slug}`} onClick={() => setOpen(false)} className="chip bg-saffron-light text-saffron hover:underline">{s.name}</Link>)}</div>
                )}
              </div>
            ))}
            {busy && <p className="text-slate-400">...</p>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-2">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chatHint')} maxLength={1000} />
            <button className="btn-primary" disabled={busy}>{t('send')}</button>
          </form>
        </div>
      )}
    </>
  );
}
