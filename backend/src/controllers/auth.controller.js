import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const sign = (user) => jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, preferredLanguage } = req.body;
  const user = await User.create({ name, email, phone, preferredLanguage, passwordHash: await User.hash(password) });
  res.status(201).json({ success: true, token: sign(user), user });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  }).select('+passwordHash');
  if (!user || !(await user.verifyPassword(password))) throw new ApiError(401, 'Invalid credentials');
  res.json({ success: true, token: sign(user), user });
});

export const me = asyncHandler(async (req, res) => res.json({ success: true, user: req.user }));

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, preferredLanguage, profile } = req.body;
  if (name) req.user.name = name;
  if (preferredLanguage) req.user.preferredLanguage = preferredLanguage;
  if (profile) req.user.profile = { ...req.user.profile.toObject(), ...profile };
  await req.user.save();
  res.json({ success: true, user: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.verifyPassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.passwordHash = await User.hash(newPassword);
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});
