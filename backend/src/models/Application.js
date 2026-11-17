import mongoose from 'mongoose';

export const APP_STATUSES = ['interested', 'documents_ready', 'applied', 'under_review', 'approved', 'rejected', 'benefit_received'];

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scheme: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true },
  status: { type: String, enum: APP_STATUSES, default: 'interested' },
  referenceNumber: String, // ID issued by the government portal
  notes: String,
  checkedDocuments: [String],
  history: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
}, { timestamps: true });

applicationSchema.index({ user: 1, scheme: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
