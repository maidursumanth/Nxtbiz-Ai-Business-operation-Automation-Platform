import mongoose from 'mongoose';

const { Schema } = mongoose;

export const Email = mongoose.model('Email', new Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  sender: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  sentiment: { type: String, default: 'neutral' },
  sentimentScore: { type: Number, default: 0 },
  intent: { type: String, default: 'general_inquiry' },
  intentConfidence: { type: Number, default: 0 },
  urgency: { type: String, default: 'low' },
  urgencyScore: { type: Number, default: 0 },
  analysisVersion: { type: String, default: '1.0' },
  confidence: { type: Number, default: 0.65 },
  autoResponse: { type: String, default: '' },
  recommendations: [{ type: String }],
  processed: { type: Boolean, default: false }
}, { timestamps: true }));

export const Meeting = mongoose.model('Meeting', new Schema({
  title: { type: String, required: true },
  attendees: [{ type: String }],
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  notes: { type: String },
  status: { type: String, default: 'scheduled' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' }
}, { timestamps: true }));

export const Invoice = mongoose.model('Invoice', new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, default: 'draft' },
  pdfUrl: { type: String, default() { return `/pdfs/invoice-${this._id}.pdf`; } },
  lineItems: [{ description: String, amount: Number }]
}, { timestamps: true }));

export const Ticket = mongoose.model('Ticket', new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  priority: { type: String, default: 'medium' },
  issue: { type: String, required: true },
  status: { type: String, default: 'open' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolution: { type: String }
}, { timestamps: true }));

export const Report = mongoose.model('Report', new Schema({
  type: { type: String, default: 'weekly' },
  title: { type: String, required: true },
  metrics: { type: Schema.Types.Mixed, default: {} },
  recommendations: [{ type: String }],
  summary: { type: String, default: '' },
  pdfUrl: { type: String },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }));

export const Workflow = mongoose.model('Workflow', new Schema({
  name: { type: String, required: true },
  trigger: { type: String, default: 'manual' },
  condition: { type: String, default: '' },
  action: { type: String, default: 'notify' },
  steps: [{ type: { type: String }, label: String }],
  enabled: { type: Boolean, default: true },
  logs: [{ status: String, message: String, payload: Schema.Types.Mixed, createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true }));

export const CRMActivity = mongoose.model('CRMActivity', new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  type: { type: String, default: 'note' },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }));

export const Memory = mongoose.model('Memory', new Schema({
  scope: { type: String, default: 'global' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  agentId: { type: String },
  key: { type: String, required: true },
  value: { type: String, required: true },
  tags: [{ type: String }],
  source: { type: String, default: 'manual' }
}, { timestamps: true }));

export const Agent = mongoose.model('Agent', new Schema({
  agentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, default: 'idle' },
  lastExecution: { type: Date },
  logs: [{ message: String, createdAt: { type: Date, default: Date.now } }],
  capabilities: [{ type: String }]
}, { timestamps: true }));

export const AgentExecution = mongoose.model('AgentExecution', new Schema({
  agentId: { type: String, required: true },
  eventId: { type: String, required: true },
  status: { type: String, default: 'completed' },
  input: { type: Schema.Types.Mixed, default: {} },
  output: { type: Schema.Types.Mixed, default: {} },
  logs: [{ type: String }],
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  error: { type: String }
}, { timestamps: true }));
