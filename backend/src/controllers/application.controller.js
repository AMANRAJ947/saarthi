import { Application } from '../models/Application.js';
import { Scheme } from '../models/Scheme.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createApplication = asyncHandler(async (req, res) => {
  const scheme = await Scheme.findById(req.body.schemeId);
  if (!scheme) throw new ApiError(404, 'Scheme not found');
  const app = await Application.create({
    user: req.user._id, scheme: scheme._id, notes: req.body.notes,
    history: [{ status: 'interested', note: 'Added to tracker' }],
  });
  res.status(201).json({ success: true, data: app });
});

export const myApplications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id, ...(req.query.status && { status: req.query.status }) };
  const data = await Application.find(filter).sort({ updatedAt: -1 }).populate('scheme', 'name slug sector applyUrl documents deadline');
  res.json({ success: true, count: data.length, data });
});

export const updateApplication = asyncHandler(async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
  if (!app) throw new ApiError(404, 'Application not found');
  const { status, referenceNumber, notes, checkedDocuments, note } = req.body;
  if (referenceNumber !== undefined) app.referenceNumber = referenceNumber;
  if (notes !== undefined) app.notes = notes;
  if (checkedDocuments) app.checkedDocuments = checkedDocuments;
  if (status && status !== app.status) {
    app.status = status;
    app.history.push({ status, note });
  }
  await app.save();
  res.json({ success: true, data: app });
});

export const deleteApplication = asyncHandler(async (req, res) => {
  const r = await Application.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!r.deletedCount) throw new ApiError(404, 'Application not found');
  res.json({ success: true });
});

export const dashboard = asyncHandler(async (req, res) => {
  const apps = await Application.find({ user: req.user._id }).populate('scheme', 'name deadline');
  const byStatus = {};
  apps.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
  const soon = apps.filter((a) => a.scheme?.deadline && a.scheme.deadline > new Date() && !['approved', 'rejected', 'benefit_received'].includes(a.status))
    .map((a) => ({ scheme: a.scheme.name, deadline: a.scheme.deadline }));
  res.json({ success: true, total: apps.length, byStatus, upcomingDeadlines: soon });
});

// ----- bookmarks -----
export const saveScheme = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $addToSet: { savedSchemes: req.params.schemeId } });
  res.json({ success: true });
});
export const unsaveScheme = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { savedSchemes: req.params.schemeId } });
  res.json({ success: true });
});
export const savedSchemes = asyncHandler(async (req, res) => {
  const u = await User.findById(req.user._id).populate('savedSchemes', 'name slug sector shortDescription');
  res.json({ success: true, data: u.savedSchemes });
});
