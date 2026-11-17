/**
 * Rule-based eligibility engine.
 * evaluateScheme(profile, scheme) -> { status, score, matched[], unmet[], missing[] }
 *   status: 'eligible'     all rules satisfied
 *           'likely'       nothing failed, but some profile fields are still unknown
 *           'not_eligible' at least one rule failed
 */
const has = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
const norm = (s) => String(s).trim().toLowerCase();

function checkGroup(profile, c = {}) {
  const r = { matched: [], unmet: [], missing: [] };
  const test = (field, cond, pass, fail) => {
    const v = profile[field];
    if (!has(v)) { r.missing.push(field); return; }
    if (cond(v)) r.matched.push(pass); else r.unmet.push(fail);
  };

  if (c.minAge != null) test('age', (v) => v >= c.minAge, `Age ${c.minAge} or above`, `Minimum age is ${c.minAge}`);
  if (c.maxAge != null) test('age', (v) => v <= c.maxAge, `Age ${c.maxAge} or below`, `Maximum age is ${c.maxAge}`);
  if (c.genders?.length) test('gender', (v) => c.genders.includes(v), `Open to ${c.genders.join('/')}`, `Only for ${c.genders.join('/')}`);
  if (c.occupations?.length) test('occupations', (v) => v.some((o) => c.occupations.includes(o)),
    `Occupation matches (${c.occupations.join('/')})`, `Meant for: ${c.occupations.join(', ')}`);
  if (c.categories?.length) test('category', (v) => c.categories.includes(v), `Category ${c.categories.join('/')} accepted`, `Only for category ${c.categories.join('/')}`);
  if (c.maxAnnualIncome != null) test('annualIncome', (v) => v <= c.maxAnnualIncome,
    `Income within limit (₹${c.maxAnnualIncome.toLocaleString('en-IN')})`, `Annual income must be at most ₹${c.maxAnnualIncome.toLocaleString('en-IN')}`);
  if (c.requiresBPL) test('isBPL', (v) => v === true, 'Belongs to BPL / priority household', 'Only for BPL / priority households');
  if (c.requiresLand) test('ownsLand', (v) => v === true, 'Owns agricultural land', 'Requires land ownership');
  if (c.requiresDisability) test('hasDisability', (v) => v === true, 'Person with disability', 'Only for persons with disability');
  if (c.requiresGirlChild) test('hasGirlChildUnder10', (v) => v === true, 'Has a girl child under 10', 'Requires a girl child under 10 years');
  if (c.requiresNoPuccaHouse) test('hasPuccaHouse', (v) => v === false, 'No pucca (permanent) house', 'Only for households without a pucca house');
  if (c.residence) test('residence', (v) => v === c.residence, `${c.residence} resident`, `Only for ${c.residence} residents`);
  if (c.educationLevels?.length) test('educationLevel', (v) => c.educationLevels.includes(v),
    'Education requirement met', `Requires education: ${c.educationLevels.join('/')}`);
  return r;
}

export function evaluateScheme(profile = {}, scheme) {
  const c = scheme.criteria || {};
  const { anyOf, anyOfLabel, ...base } = c;
  const { matched, unmet, missing } = checkGroup(profile, base);

  if (scheme.states?.length) {
    if (!has(profile.state)) missing.push('state');
    else if (scheme.states.map(norm).includes(norm(profile.state))) matched.push(`Available in ${profile.state}`);
    else unmet.push(`Only available in: ${scheme.states.join(', ')}`);
  }

  if (anyOf?.length) {
    const results = anyOf.map((g) => checkGroup(profile, g));
    const full = results.find((x) => !x.unmet.length && !x.missing.length);
    const maybe = results.find((x) => !x.unmet.length);
    if (full) matched.push(...full.matched);
    else if (maybe) missing.push(...maybe.missing);
    else unmet.push(`Must satisfy at least one: ${anyOfLabel || 'alternative conditions'}`);
  }

  const total = matched.length + unmet.length + missing.length;
  let status = 'eligible';
  if (unmet.length) status = 'not_eligible';
  else if (missing.length) status = 'likely';
  if (total === 0) matched.push('Open to all residents');

  const score = total === 0 ? 0.5 : matched.length / total;
  return { status, score: Number(score.toFixed(2)), matched, unmet, missing: [...new Set(missing)] };
}

const rank = { eligible: 0, likely: 1, not_eligible: 2 };

export function recommend(profile, schemes, { includeIneligible = false } = {}) {
  return schemes
    .map((scheme) => ({ scheme, eligibility: evaluateScheme(profile, scheme) }))
    .filter((r) => includeIneligible || r.eligibility.status !== 'not_eligible')
    .sort((a, b) => rank[a.eligibility.status] - rank[b.eligibility.status] || b.eligibility.score - a.eligibility.score);
}
