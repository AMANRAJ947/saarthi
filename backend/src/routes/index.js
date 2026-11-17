import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { protect, optionalAuth, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as S from '../validators/schemas.js';
import * as auth from '../controllers/auth.controller.js';
import * as scheme from '../controllers/scheme.controller.js';
import * as elig from '../controllers/eligibility.controller.js';
import * as app from '../controllers/application.controller.js';
import * as chat from '../controllers/chat.controller.js';
import * as admin from '../controllers/admin.controller.js';

const r = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false });

r.get('/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date() }));

// Auth & profile
r.post('/auth/register', authLimiter, validate(S.registerSchema), auth.register);
r.post('/auth/login', authLimiter, validate(S.loginSchema), auth.login);
r.get('/auth/me', protect, auth.me);
r.put('/auth/me', protect, validate(z.object({ name: z.string().min(2).optional(), preferredLanguage: z.string().optional(), profile: S.profileSchema.optional() })), auth.updateProfile);
r.put('/auth/password', protect, validate(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) })), auth.changePassword);

// Schemes (public)
r.get('/schemes', scheme.listSchemes);
r.get('/schemes/sectors', scheme.sectorSummary);
r.get('/schemes/deadlines', scheme.upcomingDeadlines);
r.get('/schemes/:idOrSlug', scheme.getScheme);
r.post('/checklist', validate(S.checklistSchema), scheme.documentChecklist);

// Eligibility & recommendations
r.post('/eligibility/check', validate(S.eligibilityCheckSchema), elig.checkEligibility);
r.get('/recommendations', protect, elig.myRecommendations);
r.get('/eligibility/scheme/:id', protect, elig.explainForScheme);

// Application tracker
r.get('/applications/dashboard', protect, app.dashboard);
r.route('/applications').get(protect, app.myApplications).post(protect, validate(S.applicationCreateSchema), app.createApplication);
r.route('/applications/:id').patch(protect, validate(S.applicationUpdateSchema), app.updateApplication).delete(protect, app.deleteApplication);

// Bookmarks
r.get('/saved', protect, app.savedSchemes);
r.post('/saved/:schemeId', protect, app.saveScheme);
r.delete('/saved/:schemeId', protect, app.unsaveScheme);

// Chatbot (guests allowed)
r.post('/chat', chatLimiter, optionalAuth, validate(S.chatSchema), chat.sendMessage);

// Admin
r.use('/admin', protect, restrictTo('admin'));
r.get('/admin/stats', admin.stats);
r.get('/admin/users', admin.listUsers);
r.post('/admin/schemes', validate(S.schemeBodySchema), scheme.createScheme);
r.put('/admin/schemes/:idOrSlug', scheme.updateScheme);
r.delete('/admin/schemes/:idOrSlug', scheme.deleteScheme);

export default r;
