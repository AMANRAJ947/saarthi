import { env } from '../config/env.js';
import { Scheme } from '../models/Scheme.js';
import { escapeRegex, applyLang } from '../utils/helpers.js';
import { evaluateScheme } from './eligibility.js';

const LANGS = { en: 'English', hi: 'Hindi', mr: 'Marathi', gu: 'Gujarati', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', or: 'Odia' };

async function retrieve(message) {
  let found = await Scheme.find(
    { isActive: true, $text: { $search: message } },
    { score: { $meta: 'textScore' } },
  ).sort({ score: { $meta: 'textScore' } }).limit(4).lean();

  if (!found.length) {
    const words = message.split(/\s+/).filter((w) => w.length > 2).slice(0, 6).map(escapeRegex);
    if (words.length) {
      const re = new RegExp(words.join('|'), 'i');
      found = await Scheme.find({ isActive: true, $or: [{ name: re }, { tags: re }, { shortDescription: re }] }).limit(4).lean();
    }
  }
  return found;
}

function schemeContext(schemes, profile, lang) {
  return schemes.map((s, i) => {
    const t = applyLang(s, lang);
    const e = profile && Object.keys(profile).length ? evaluateScheme(profile, s) : null;
    return `[${i + 1}] ${t.name} (sector: ${s.sector})
Summary: ${t.shortDescription}
Benefits: ${t.benefits || 'n/a'}
Eligibility: ${t.eligibilityText || 'n/a'}
Documents: ${(s.documents || []).map((d) => d.name).join(', ') || 'n/a'}
Apply: ${s.applyUrl || s.officialUrl || 'n/a'}${e ? `\nUser's eligibility status: ${e.status}` : ''}`;
  }).join('\n\n');
}

async function askGemini({ message, history, context, language }) {
  const system = `You are Saarthi, a friendly assistant that helps Indian citizens discover government schemes.
Rules: answer ONLY from the scheme data provided; if it is not covered, say you are not sure and suggest checking the official website or helpline. Never invent amounts, dates or URLs. Never ask for Aadhaar numbers, OTPs or passwords. Keep answers short, in simple ${LANGS[language] || 'English'}. Use short bullet points for documents/steps.

SCHEME DATA:
${context || '(no matching schemes found)'}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || null;
}

export async function chat({ message, history = [], language = 'en', profile }) {
  const schemes = await retrieve(message);
  const context = schemeContext(schemes, profile, language);

  let reply = null;
  let source = 'search';
  if (env.geminiKey) {
    try { reply = await askGemini({ message, history, context, language }); source = 'ai'; }
    catch (e) { console.error('Chatbot LLM failed, using fallback:', e.message); }
  }
  if (!reply) {
    reply = schemes.length
      ? `Here are schemes that match your question:\n${schemes.map((s) => `• ${applyLang(s, language).name} – ${applyLang(s, language).shortDescription}`).join('\n')}`
      : "I couldn't find a matching scheme. Try keywords like 'farmer loan', 'scholarship' or 'pension'.";
  }
  return {
    reply, source,
    schemes: schemes.map((s) => ({ _id: s._id, slug: s.slug, name: applyLang(s, language).name, sector: s.sector })),
  };
}
