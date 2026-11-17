import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const OCCUPATIONS = ['farmer', 'student', 'job_seeker', 'entrepreneur', 'salaried', 'self_employed',
  'laborer', 'homemaker', 'retired', 'street_vendor', 'artisan'];

const profileSchema = new mongoose.Schema({
  age: { type: Number, min: 0, max: 120 },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  state: String,
  district: String,
  residence: { type: String, enum: ['rural', 'urban'] },
  occupations: [{ type: String, enum: OCCUPATIONS }],
  category: { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
  annualIncome: { type: Number, min: 0 },
  isBPL: Boolean,
  ownsLand: Boolean,
  landHectares: { type: Number, min: 0 },
  educationLevel: { type: String, enum: ['none', 'primary', 'secondary', 'higher_secondary', 'graduate', 'postgraduate', 'diploma_iti'] },
  hasDisability: Boolean,
  hasPuccaHouse: Boolean,
  hasGirlChildUnder10: Boolean,
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  phone: { type: String, trim: true, unique: true, sparse: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  preferredLanguage: { type: String, default: 'en' },
  profile: { type: profileSchema, default: () => ({}) },
  savedSchemes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' }],
}, { timestamps: true });

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.statics.hash = (plain) => bcrypt.hash(plain, 12);
userSchema.set('toJSON', { transform: (_d, r) => { delete r.passwordHash; delete r.__v; return r; } });

export const User = mongoose.model('User', userSchema);
