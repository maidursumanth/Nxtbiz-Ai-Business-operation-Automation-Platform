import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/operations.js';
import { Notification } from '../models/Notification.js';
import { Ticket } from '../models/operations.js';

export const dashboardRouter = Router();

const revenueTrend = [
  { label: 'Jan', revenue: 12000, health: 71 },
  { label: 'Feb', revenue: 14500, health: 73 },
  { label: 'Mar', revenue: 13200, health: 72 },
  { label: 'Apr', revenue: 16800, health: 76 },
  { label: 'May', revenue: 18400, health: 78 },
  { label: 'Jun', revenue: 21300, health: 81 }
];

function calculateHealthScore({ averageCustomerHealth, overdueInvoices, openTickets }) {
  const customerSatisfaction = averageCustomerHealth;
  const invoiceCollection = Math.max(0, 100 - overdueInvoices * 10);
  const ticketResolution = Math.max(0, 100 - openTickets * 8);
  const businessHealth = (
    customerSatisfaction * 0.4 +
    invoiceCollection * 0.3 +
    ticketResolution * 0.3
  );
  return Math.round(Math.min(100, Math.max(0, businessHealth)));
}

dashboardRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const [customerCount, unreadNotifications, invoiceOverview, ticketOverview, customers] = await Promise.all([
      Customer.countDocuments(),
      Notification.countDocuments({ userId: req.user.id, read: false }),
      Invoice.find().lean(),
      Ticket.find().lean(),
      Customer.find().lean()
    ]);

    const overdueInvoices = invoiceOverview.filter((invoice) => invoice.status === 'overdue').length;
    const openTickets = ticketOverview.filter((ticket) => ticket.status !== 'resolved').length;
    const averageCustomerHealth = customers.length ? Math.round(customers.reduce((sum, customer) => sum + (customer.healthScore || 75), 0) / customers.length) : 75;
    const healthScore = calculateHealthScore({ averageCustomerHealth, overdueInvoices, openTickets });

    res.json({
      revenue: { current: revenueTrend.at(-1).revenue, trend: revenueTrend },
      health: { score: healthScore },
      activity: { customers: customerCount, unreadNotifications },
      executionHistory: [
        { label: 'Email', count: 18 },
        { label: 'CRM', count: 24 },
        { label: 'Invoice', count: invoiceOverview.length },
        { label: 'Support', count: ticketOverview.length }
      ]
    });
  } catch (error) {
    next(error);
  }
});
