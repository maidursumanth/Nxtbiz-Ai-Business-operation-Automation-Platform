import { connectDatabase } from './config/db.js';
import { User } from './models/User.js';
import { Customer } from './models/Customer.js';
import { Invoice, Memory, Report } from './models/operations.js';
import { agentDefinitions } from './spec/businessRules.js';
import { ensureAgents } from './services/agentOrchestration.js';

await connectDatabase();

const passwordHash = await User.hashPassword('Admin12345');
await User.findOneAndUpdate(
  { email: 'admin@nxtbiz.local' },
  {
    name: 'NxtBiz Admin',
    email: 'admin@nxtbiz.local',
    passwordHash,
    role: 'Admin',
    active: true
  },
  { upsert: true, new: true }
);

await ensureAgents();

await Customer.findOneAndUpdate(
  { email: 'acme@nxtbiz.local' },
  {
    name: 'ACME Operations',
    email: 'acme@nxtbiz.local',
    company: 'ACME Corp',
    phone: '555-0123',
    notes: 'Top customer for operations and invoicing.',
    healthScore: 86
  },
  { upsert: true, new: true }
);

await Customer.findOneAndUpdate(
  { email: 'enterprise@nxtbiz.local' },
  {
    name: 'Enterprise Solutions',
    email: 'enterprise@nxtbiz.local',
    company: 'Enterprise Solutions LLC',
    phone: '555-0456',
    notes: 'Large account with recurring workflows.',
    healthScore: 72
  },
  { upsert: true, new: true }
);

await Invoice.findOneAndUpdate(
  { amount: 4200, status: 'sent' },
  {
    customerId: (await Customer.findOne({ email: 'acme@nxtbiz.local' }))._id,
    amount: 4200,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'sent',
    lineItems: [{ description: 'Strategy and execution services', amount: 4200 }],
    pdfUrl: '/pdfs/invoice-demo.pdf'
  },
  { upsert: true, new: true }
);

await Report.findOneAndUpdate(
  { title: 'Executive Operations Summary' },
  {
    type: 'executive',
    title: 'Executive Operations Summary',
    summary: 'A snapshot of revenue, efficiency, and customer health for the week.',
    metrics: { revenue: 21300, healthScore: 84, openTickets: 4 },
    recommendations: ['Review overdue invoices', 'Follow up on critical customer requests'],
    generatedBy: (await User.findOne({ email: 'admin@nxtbiz.local' }))._id,
    pdfUrl: '/pdfs/report-demo.pdf'
  },
  { upsert: true, new: true }
);

await Memory.findOneAndUpdate(
  { key: 'key-customer-priority' },
  {
    scope: 'global',
    customerId: (await Customer.findOne({ email: 'acme@nxtbiz.local' }))._id,
    agentId: 'chief-of-staff-agent',
    key: 'Customer Priority',
    value: 'ACME account should be prioritized for next quarter upgrades.',
    tags: ['customer', 'priority'],
    source: 'manual'
  },
  { upsert: true, new: true }
);

console.log('Seeded NxtBiz admin user: admin@nxtbiz.local / Admin12345');
console.log(`Seeded agent definitions: ${agentDefinitions.join(', ')}`);
console.log('Seeded demo customers, invoices, reports, and memory search seed data.');
process.exit(0);
