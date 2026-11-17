import ExcelJS from 'exceljs';
import { slugify } from '../utils/helpers.js';
import { OCCUPATIONS } from '../models/User.js';

export const SECTOR_MAP = {
  'agriculture': 'agriculture',
  'education': 'education',
  'employment': 'employment',
  'finance & loans': 'finance',
  'women & child welfare': 'women_child',
  'pension & social security': 'pension',
  'land & property': 'land',
  'postal savings': 'postal',
};

const text = (v) => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((t) => t.text).join('').trim();
    if (v.text) return String(v.text).trim();
    if (v.result !== undefined) return String(v.result).trim();
  }
  return String(v).trim();
};
const lines = (v) => text(v).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const num = (v) => { const t = text(v).replace(/,/g, ''); return t === '' || isNaN(Number(t)) ? undefined : Number(t); };
const yes = (v) => /^(yes|y|true|1)$/i.test(text(v));

/**
 * Reads the "Schemes" sheet of the dataset workbook and returns
 * { schemes: [...mongoose-ready docs], errors: [...] }.
 */
export async function loadSchemesFromExcel(file) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet('Schemes');
  if (!ws) throw new Error('Sheet "Schemes" not found in workbook');

  const col = {};
  ws.getRow(1).eachCell((cell, i) => { col[text(cell.value)] = i; });
  const need = ['Scheme ID', 'Scheme Name', 'Sector', 'Level (Central/State)'];
  for (const h of need) if (!col[h]) throw new Error(`Missing column: ${h}`);
  const get = (row, h) => (col[h] ? row.getCell(col[h]).value : null);

  const schemes = [];
  const errors = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const code = text(get(row, 'Scheme ID'));
    const name = text(get(row, 'Scheme Name'));
    if (!code && !name) return;
    const err = (m) => errors.push(`Row ${rowNum} (${code || name}): ${m}`);

    const sector = SECTOR_MAP[text(get(row, 'Sector')).toLowerCase()];
    if (!sector) err(`Unknown sector "${text(get(row, 'Sector'))}"`);
    const levelRaw = text(get(row, 'Level (Central/State)')).toLowerCase();
    if (!['central', 'state'].includes(levelRaw)) err('Level must be Central or State');

    const occupations = text(get(row, 'Occupations')).split(',').map((s) => s.trim()).filter(Boolean);
    for (const o of occupations) if (!OCCUPATIONS.includes(o)) err(`Unknown occupation "${o}"`);

    const criteria = {};
    const set = (k, v) => { if (v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) criteria[k] = v; };
    set('minAge', num(get(row, 'Min Age')));
    set('maxAge', num(get(row, 'Max Age')));
    set('genders', text(get(row, 'Gender')) ? [text(get(row, 'Gender')).toLowerCase()] : undefined);
    set('occupations', occupations);
    set('categories', text(get(row, 'Category')) ? [text(get(row, 'Category'))] : undefined);
    set('maxAnnualIncome', num(get(row, 'Max Annual Income (Rs)')));
    if (yes(get(row, 'Requires BPL'))) criteria.requiresBPL = true;
    if (yes(get(row, 'Requires Land'))) criteria.requiresLand = true;
    if (yes(get(row, 'Requires Girl Child <10'))) criteria.requiresGirlChild = true;
    if (yes(get(row, 'Requires Disability'))) criteria.requiresDisability = true;
    set('residence', text(get(row, 'Residence')).toLowerCase() || undefined);
    const adv = text(get(row, 'Advanced Criteria (JSON)'));
    if (adv) {
      try { Object.assign(criteria, JSON.parse(adv)); } catch { err('Advanced Criteria is not valid JSON'); }
    }

    const docs = lines(get(row, 'Required Documents')).map((d) => {
      const optional = /\(optional\)\s*$/i.test(d);
      return { name: d.replace(/\s*\(optional\)\s*$/i, ''), required: !optional };
    });
    const statusRaw = text(get(row, 'Scheme Status')).toLowerCase();
    const status = statusRaw === 'active' ? 'active' : statusRaw === 'closed' ? 'closed' : 'not_verified';
    const lastVerifiedRaw = get(row, 'Last Verified');
    const lastVerifiedAt = lastVerifiedRaw instanceof Date ? lastVerifiedRaw : undefined;
    const vLevel = text(get(row, 'Verification Level'));

    schemes.push({
      schemeCode: code,
      slug: slugify(name),
      name,
      shortDescription: text(get(row, 'Short Description')),
      sector,
      level: levelRaw,
      states: levelRaw === 'state' ? [text(get(row, 'State')) || 'Madhya Pradesh'] : [],
      ministry: text(get(row, 'Launching Department')),
      department: text(get(row, 'Launching Department')),
      targetBeneficiary: text(get(row, 'Target Beneficiary')),
      eligibilityText: text(get(row, 'Eligibility')),
      benefits: text(get(row, 'Benefits')),
      incomeLimitText: text(get(row, 'Income Limit')),
      applicationMode: text(get(row, 'Application Mode')),
      applicationSteps: lines(get(row, 'Application Steps')),
      documents: docs,
      criteria,
      applyUrl: text(get(row, 'Application Link')),
      officialUrl: text(get(row, 'Source')),
      sourceUrl: text(get(row, 'Source')),
      status,
      isActive: status !== 'closed',
      verified: Boolean(lastVerifiedAt) && /^L2/i.test(vLevel),
      lastVerifiedAt,
      verificationLevel: vLevel,
      verificationNotes: text(get(row, 'Verification Notes')),
      tags: text(get(row, 'Tags')).split(',').map((s) => s.trim()).filter(Boolean),
    });
  });

  const seen = new Set();
  for (const s of schemes) {
    if (seen.has(s.schemeCode)) errors.push(`Duplicate Scheme ID ${s.schemeCode}`);
    seen.add(s.schemeCode);
    if (!s.shortDescription) errors.push(`${s.schemeCode}: Short Description is empty`);
  }
  return { schemes, errors };
}
