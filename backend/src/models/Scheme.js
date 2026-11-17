import mongoose from 'mongoose';
import { OCCUPATIONS } from './User.js';

export const SECTORS = ['agriculture', 'land', 'finance', 'postal', 'employment', 'education', 'health',
  'msme', 'pension', 'housing', 'women_child', 'social_welfare'];

// Machine-readable eligibility rules. Every field is optional; missing = no restriction.
const criteriaSchema = new mongoose.Schema({
  minAge: Number,
  maxAge: Number,
  genders: [String],
  occupations: [{ type: String, enum: OCCUPATIONS }],
  categories: [String],
  maxAnnualIncome: Number,
  requiresBPL: Boolean,
  requiresLand: Boolean,
  requiresDisability: Boolean,
  requiresGirlChild: Boolean,
  requiresNoPuccaHouse: Boolean,
  residence: { type: String, enum: ['rural', 'urban'] },
  educationLevels: [String],
  // "At least one of these groups must match" (e.g. woman OR SC/ST)
  anyOf: [mongoose.Schema.Types.Mixed],
  anyOfLabel: String,
}, { _id: false });

const schemeSchema = new mongoose.Schema({
  schemeCode: { type: String, unique: true, sparse: true }, // e.g. MP001 (from the Excel sheet)
  slug: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  shortDescription: { type: String, required: true },
  description: String,
  sector: { type: String, enum: SECTORS, required: true, index: true },
  level: { type: String, enum: ['central', 'state'], default: 'central' },
  states: [String], // empty = applicable across India
  ministry: String,
  benefits: String,
  eligibilityText: String,
  targetBeneficiary: String,
  incomeLimitText: String,
  applicationMode: String,
  department: String,
  status: { type: String, enum: ['active', 'closed', 'not_verified'], default: 'not_verified', index: true },
  sourceUrl: String,
  verificationLevel: String, // L0 draft / L1 secondary sources / L2 official source
  verificationNotes: String,
  criteria: { type: criteriaSchema, default: () => ({}) },
  documents: [{ name: String, required: { type: Boolean, default: true }, note: String, _id: false }],
  applicationSteps: [String],
  applyUrl: String,
  officialUrl: String,
  helpline: String,
  deadline: Date,
  tags: [String],
  translations: mongoose.Schema.Types.Mixed, // { hi: { name, shortDescription, ... }, ta: {...} }
  isActive: { type: Boolean, default: true },
  verified: { type: Boolean, default: false }, // reviewed against official source
  lastVerifiedAt: Date,
}, { timestamps: true });

schemeSchema.index({ name: 'text', shortDescription: 'text', description: 'text', tags: 'text' },
  { default_language: 'none' });

export const Scheme = mongoose.model('Scheme', schemeSchema);
