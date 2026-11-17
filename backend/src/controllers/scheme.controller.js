import mongoose from 'mongoose';
import { Scheme } from '../models/Scheme.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applyLang, escapeRegex, paginate, slugify } from '../utils/helpers.js';

const findOne = (idOrSlug) => (mongoose.isValidObjectId(idOrSlug) ? Scheme.findById(idOrSlug) : Scheme.findOne({ slug: idOrSlug }));

export const listSchemes = asyncHandler(async (req, res) => {
  const { sector, state, level, q, lang = 'en' } = req.query;
  const filter = { isActive: true };
  if (sector) filter.sector = sector;
  if (level) filter.level = level;
  // state filter: nationwide schemes + schemes of that state
  if (state) filter.$or = [{ states: { $size: 0 } }, { states: new RegExp(`^${escapeRegex(state)}$`, 'i') }];
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$and = [{ $or: [{ name: re }, { shortDescription: re }, { tags: re }, { ministry: re }] }];
  }
  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    Scheme.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Scheme.countDocuments(filter),
  ]);
  res.json({ success: true, page, limit, total, pages: Math.ceil(total / limit), data: items.map((s) => applyLang(s, lang)) });
});

export const getScheme = asyncHandler(async (req, res) => {
  const scheme = await findOne(req.params.idOrSlug);
  if (!scheme || !scheme.isActive) throw new ApiError(404, 'Scheme not found');
  res.json({ success: true, data: applyLang(scheme, req.query.lang) });
});

export const sectorSummary = asyncHandler(async (_req, res) => {
  const data = await Scheme.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$sector', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  res.json({ success: true, data: data.map((d) => ({ sector: d._id, count: d.count })) });
});

export const upcomingDeadlines = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  const now = new Date();
  const data = await Scheme.find({ isActive: true, deadline: { $gte: now, $lte: new Date(now.getTime() + days * 864e5) } })
    .sort({ deadline: 1 }).select('name slug sector deadline applyUrl');
  res.json({ success: true, data });
});

export const createScheme = asyncHandler(async (req, res) => {
  const scheme = await Scheme.create({ ...req.body, slug: req.body.slug || slugify(req.body.name) });
  res.status(201).json({ success: true, data: scheme });
});

export const updateScheme = asyncHandler(async (req, res) => {
  const scheme = await findOne(req.params.idOrSlug);
  if (!scheme) throw new ApiError(404, 'Scheme not found');
  Object.assign(scheme, req.body);
  await scheme.save();
  res.json({ success: true, data: scheme });
});

export const deleteScheme = asyncHandler(async (req, res) => {
  const scheme = await findOne(req.params.idOrSlug);
  if (!scheme) throw new ApiError(404, 'Scheme not found');
  scheme.isActive = false; // soft delete keeps users' application history intact
  await scheme.save();
  res.json({ success: true, message: 'Scheme deactivated' });
});

// Merge the documents of several schemes into one deduplicated checklist.
export const documentChecklist = asyncHandler(async (req, res) => {
  const schemes = await Scheme.find({ _id: { $in: req.body.schemeIds.filter(mongoose.isValidObjectId) } }).select('name documents');
  const map = new Map();
  for (const s of schemes) {
    for (const d of s.documents) {
      const key = d.name.trim().toLowerCase();
      const entry = map.get(key) || { name: d.name, required: false, neededFor: [] };
      entry.required = entry.required || d.required;
      entry.neededFor.push(s.name);
      map.set(key, entry);
    }
  }
  const documents = [...map.values()].sort((a, b) => b.neededFor.length - a.neededFor.length);
  res.json({ success: true, schemes: schemes.map((s) => s.name), documents });
});
