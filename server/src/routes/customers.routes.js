import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Customer } from '../models/Customer.js';
import { CRMActivity, Email, Invoice, Meeting, Ticket } from '../models/operations.js';
import { emitRealtime } from '../realtime.js';
import { rolePermissions } from '../spec/businessRules.js';

export const customersRouter = Router();
customersRouter.use(requireAuth);

const customerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  healthScore: z.coerce.number().min(0).max(100).optional()
});

customersRouter.get('/', async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

customersRouter.get('/:id', async (req, res, next) => {
  try {
    const [customer, activities, emails, meetings, invoices, tickets] = await Promise.all([
      Customer.findById(req.params.id),
      CRMActivity.find({ customerId: req.params.id }).sort({ createdAt: -1 }).limit(25),
      Email.find({ customerId: req.params.id }).sort({ createdAt: -1 }).limit(25),
      Meeting.find({ customerId: req.params.id }).sort({ startTime: -1 }).limit(25),
      Invoice.find({ customerId: req.params.id }).sort({ dueDate: -1 }).limit(25),
      Ticket.find({ customerId: req.params.id }).sort({ createdAt: -1 }).limit(25)
    ]);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    res.json({ customer, related: { activities, emails, meetings, invoices, tickets } });
  } catch (error) {
    next(error);
  }
});

customersRouter.post('/', async (req, res, next) => {
  try {
    const input = customerSchema.parse(req.body);
    const customer = await Customer.create(input);
    emitRealtime('customer_updated', { customerId: customer.id });
    res.status(201).json({ customer });
  } catch (error) {
    next(error);
  }
});

customersRouter.put('/:id', async (req, res, next) => {
  try {
    const input = customerSchema.partial().parse(req.body);
    const customer = await Customer.findByIdAndUpdate(req.params.id, input, { new: true });
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    emitRealtime('customer_updated', { customerId: customer.id });
    res.json({ customer });
  } catch (error) {
    next(error);
  }
});

customersRouter.delete('/:id', requireRoles(rolePermissions.customers.delete), async (req, res, next) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    emitRealtime('customer_updated', { customerId: req.params.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
