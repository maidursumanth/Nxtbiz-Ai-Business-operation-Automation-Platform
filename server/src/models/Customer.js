import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    tags: [{ type: String }],
    notes: { type: String },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    healthScore: { type: Number, default: 75 }
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);
