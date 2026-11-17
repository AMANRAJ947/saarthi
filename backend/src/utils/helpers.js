export const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function paginate(query) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 12, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

// Overlay translated text (scheme.translations[lang]) onto the English fields.
export function applyLang(scheme, lang) {
  if (!scheme) return scheme;
  const s = scheme.toObject ? scheme.toObject() : { ...scheme };
  const t = lang && lang !== 'en' ? s.translations?.[lang] : null;
  if (t) {
    for (const k of ['name', 'shortDescription', 'description', 'benefits', 'eligibilityText']) {
      if (t[k]) s[k] = t[k];
    }
    if (t.applicationSteps?.length) s.applicationSteps = t.applicationSteps;
  }
  delete s.translations;
  return s;
}
