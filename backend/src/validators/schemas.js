import { z } from 'zod';
import { OCCUPATIONS } from '../models/User.js';
import { SECTORS } from '../models/Scheme.js';
import { APP_STATUSES } from '../models/Application.js';

export const profileSchema = z.object({
  age: z.number().int().min(0).max(120),
  gender: z.enum(['male', 'female', 'other']),
  state: z.string().min(2),
  district: z.string(),
  residence: z.enum(['rural', 'urban']),
  occupations: z.array(z.enum(OCCUPATIONS)),
  category: z.enum(['General', 'OBC', 'SC', 'ST', 'EWS']),
  annualIncome: z.number().min(0),
  isBPL: z.boolean(),
  ownsLand: z.boolean(),
  landHectares: z.number().min(0),
  educationLevel: z.enum(['none', 'primary', 'secondary', 'higher_secondary', 'graduate', 'postgraduate', 'diploma_iti']),
  hasDisability: z.boolean(),
  hasPuccaHouse: z.boolean(),
  hasGirlChildUnder10: z.boolean(),
}).partial();

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number').optional(),
  password: z.string().min(8),
  preferredLanguage: z.string().default('en'),
}).refine((d) => d.email || d.phone, { message: 'Provide email or phone', path: ['email'] });

export const loginSchema = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(1),
});

export const eligibilityCheckSchema = z.object({
  profile: profileSchema,
  sector: z.enum(SECTORS).optional(),
  includeIneligible: z.boolean().optional(),
});

export const checklistSchema = z.object({ schemeIds: z.array(z.string()).min(1).max(20) });

export const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  language: z.string().default('en'),
  history: z.array(z.object({ role: z.enum(['user', 'model']), text: z.string() })).max(10).default([]),
  profile: profileSchema.optional(),
});

export const applicationCreateSchema = z.object({
  schemeId: z.string(),
  notes: z.string().max(500).optional(),
});

export const applicationUpdateSchema = z.object({
  status: z.enum(APP_STATUSES).optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  checkedDocuments: z.array(z.string()).optional(),
  note: z.string().max(300).optional(), // note attached to the status-history entry
});

export const schemeBodySchema = z.object({
  name: z.string().min(3),
  shortDescription: z.string().min(10),
  sector: z.enum(SECTORS),
}).passthrough();
