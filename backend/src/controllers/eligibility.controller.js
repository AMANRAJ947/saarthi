import { Scheme } from '../models/Scheme.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applyLang } from '../utils/helpers.js';
import { recommend, evaluateScheme } from '../services/eligibility.js';
import { ApiError } from '../utils/ApiError.js';

async function run(profile, { sector, includeIneligible, lang }) {
  const filter = { isActive: true, ...(sector && { sector }) };
  const schemes = await Scheme.find(filter);
  const results = recommend(profile, schemes, { includeIneligible });
  return results.map((r) => ({ scheme: applyLang(r.scheme, lang), eligibility: r.eligibility }));
}

// Guests: send the answers from the questionnaire in the body.
export const checkEligibility = asyncHandler(async (req, res) => {
  const { profile, sector, includeIneligible } = req.body;
  const data = await run(profile, { sector, includeIneligible, lang: req.query.lang });
  res.json({ success: true, count: data.length, data });
});

// Logged-in users: uses saved profile.
export const myRecommendations = asyncHandler(async (req, res) => {
  const profile = req.user.profile.toObject();
  const data = await run(profile, {
    sector: req.query.sector,
    includeIneligible: req.query.includeIneligible === 'true',
    lang: req.query.lang || req.user.preferredLanguage,
  });
  res.json({ success: true, count: data.length, data });
});

export const explainForScheme = asyncHandler(async (req, res) => {
  const scheme = await Scheme.findById(req.params.id);
  if (!scheme) throw new ApiError(404, 'Scheme not found');
  res.json({ success: true, eligibility: evaluateScheme(req.user.profile.toObject(), scheme) });
});
