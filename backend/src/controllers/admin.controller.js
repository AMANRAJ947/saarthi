import { User } from '../models/User.js';
import { Scheme } from '../models/Scheme.js';
import { Application } from '../models/Application.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const stats = asyncHandler(async (_req, res) => {
  const [users, schemes, applications, bySector, byStatus, byState] = await Promise.all([
    User.countDocuments({ role: 'citizen' }),
    Scheme.countDocuments({ isActive: true }),
    Application.countDocuments(),
    Scheme.aggregate([{ $group: { _id: '$sector', count: { $sum: 1 } } }]),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.aggregate([{ $match: { 'profile.state': { $exists: true } } }, { $group: { _id: '$profile.state', users: { $sum: 1 } } }, { $sort: { users: -1 } }, { $limit: 10 }]),
  ]);
  res.json({ success: true, users, schemes, applications, bySector, byStatus, topStates: byState });
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const data = await User.find().sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20);
  res.json({ success: true, page, data });
});
