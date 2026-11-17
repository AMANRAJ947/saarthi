import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateScheme, recommend } from '../src/services/eligibility.js';
import { loadSchemesFromExcel } from '../src/seed/excel.js';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/Saarthi_MP_Schemes_Dataset.xlsx');
const { schemes, errors } = await loadSchemesFromExcel(file);
const by = (code) => schemes.find((s) => s.schemeCode === code);

test('dataset: no parsing errors and exactly 45 schemes', () => {
  assert.deepEqual(errors, []);
  assert.equal(schemes.length, 45);
});

test('dataset: sector counts match the MVP targets', () => {
  const c = {}; schemes.forEach((s) => { c[s.sector] = (c[s.sector] || 0) + 1; });
  assert.deepEqual(c, { agriculture: 8, education: 6, employment: 5, finance: 6, women_child: 5, pension: 5, land: 5, postal: 5 });
});

test('dataset: central and MP state schemes are kept separate', () => {
  schemes.forEach((s) => {
    if (s.level === 'central') assert.deepEqual(s.states, [], s.schemeCode);
    else assert.deepEqual(s.states, ['Madhya Pradesh'], s.schemeCode);
  });
  assert.equal(by('MP002').level, 'state');
  assert.equal(by('MP001').level, 'central');
});

test('dataset: nothing is marked officially verified yet', () => {
  assert.ok(schemes.every((s) => s.verified === false));
});

test('example from brief: Sehore farmer (42, land, Rs 1.5 lakh) sees farm schemes', () => {
  const profile = { age: 42, gender: 'male', state: 'Madhya Pradesh', district: 'Sehore', residence: 'rural',
    occupations: ['farmer'], ownsLand: true, annualIncome: 150000 };
  const names = recommend(profile, schemes).filter((r) => r.eligibility.status === 'eligible').map((r) => r.scheme.schemeCode);
  for (const code of ['MP001', 'MP002', 'MP003', 'MP004', 'MP005']) assert.ok(names.includes(code), code);
  assert.ok(!names.includes('MP026'), 'male farmer must not get Ladli Behna');
});

test('MP state scheme is not offered to a farmer from another state', () => {
  const p = { occupations: ['farmer'], ownsLand: true, state: 'Rajasthan' };
  assert.equal(evaluateScheme(p, by('MP002')).status, 'not_eligible');
  assert.equal(evaluateScheme(p, by('MP001')).status, 'eligible');
});

test('Ladli Behna: age, gender and income rules', () => {
  const ok = { gender: 'female', age: 35, annualIncome: 200000, state: 'Madhya Pradesh' };
  assert.equal(evaluateScheme(ok, by('MP026')).status, 'eligible');
  assert.equal(evaluateScheme({ ...ok, annualIncome: 300000 }, by('MP026')).status, 'not_eligible');
  assert.equal(evaluateScheme({ ...ok, age: 65 }, by('MP026')).status, 'not_eligible');
  assert.equal(evaluateScheme({ gender: 'female', age: 35, state: 'Madhya Pradesh' }, by('MP026')).status, 'likely');
});

test('Seekho Kamao: age 18-29 job seeker in MP', () => {
  const p = { age: 24, occupations: ['job_seeker'], state: 'Madhya Pradesh' };
  assert.equal(evaluateScheme(p, by('MP015')).status, 'eligible');
  assert.equal(evaluateScheme({ ...p, age: 35 }, by('MP015')).status, 'not_eligible');
});

test('Stand-Up India: woman OR SC/ST (anyOf rule loaded from Excel)', () => {
  const base = { age: 30, occupations: ['entrepreneur'] };
  assert.equal(evaluateScheme({ ...base, gender: 'female', category: 'General' }, by('MP021')).status, 'eligible');
  assert.equal(evaluateScheme({ ...base, gender: 'male', category: 'SC' }, by('MP021')).status, 'eligible');
  assert.equal(evaluateScheme({ ...base, gender: 'male', category: 'General' }, by('MP021')).status, 'not_eligible');
});

test('senior citizen schemes: SCSS needs age 60+, old-age pension also needs BPL', () => {
  const p = { age: 66, isBPL: true, state: 'Madhya Pradesh' };
  assert.equal(evaluateScheme(p, by('MP043')).status, 'eligible');
  assert.equal(evaluateScheme(p, by('MP031')).status, 'eligible');
  assert.equal(evaluateScheme({ ...p, isBPL: false }, by('MP031')).status, 'not_eligible');
});

test('scholarship income cap respected (Post Matric SC)', () => {
  const p = { category: 'SC', occupations: ['student'], annualIncome: 400000 };
  assert.equal(evaluateScheme(p, by('MP009')).status, 'not_eligible');
});
