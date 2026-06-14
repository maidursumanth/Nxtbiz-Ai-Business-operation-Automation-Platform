import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { Notification } from '../models/Notification.js';
import { Agent, AgentExecution, CRMActivity, Email, Invoice, Meeting, Memory, Report, Ticket, Workflow } from '../models/operations.js';
import { Customer } from '../models/Customer.js';
import { emitRealtime } from '../realtime.js';
import { agentDefinitions, rolePermissions } from '../spec/businessRules.js';
import { enqueueWorkflowExecution } from '../services/workflowQueue.js';
import { orchestrateEmailProcessing, orchestrateManualAgentRun } from '../services/agentOrchestration.js';
import { generateInvoicePdf, generateReportPdf, getPdfFileName, pdfExists } from '../services/pdfGenerator.js';
import { sendEmail } from '../services/emailSender.js';

function ensureAbsolutePdfUrl(url) {
  if (!url) return url;
  try {
    return new URL(url, env.PDF_BASE_URL).toString();
  } catch (error) {
    return url;
  }
}

function crudRouter(Model, listName, eventName) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const records = await Model.find().sort({ createdAt: -1 }).limit(100);
      const normalized = records.map((record) => {
        const data = record.toObject ? record.toObject() : record;
        if (data.pdfUrl) {
          data.pdfUrl = ensureAbsolutePdfUrl(data.pdfUrl);
        }
        return data;
      });
      res.json({ [listName]: normalized });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const record = await Model.create(req.body);
      emitRealtime(eventName, { id: record.id });
      res.status(201).json({ [listName.slice(0, -1)]: record });
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const record = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!record) {
        res.status(404);
        throw new Error('Record not found');
      }
      emitRealtime(eventName, { id: record.id });
      res.json({ [listName.slice(0, -1)]: record });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      emitRealtime(eventName, { id: req.params.id });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export const meetingsRouter = crudRouter(Meeting, 'meetings', 'meeting_created');
export const ticketsRouter = crudRouter(Ticket, 'tickets', 'new_ticket');

export const invoicesRouter = crudRouter(Invoice, 'invoices', 'invoice_created');
invoicesRouter.get('/:id/download', requireAuth, async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }
    const customer = invoice.customerId ? await Customer.findById(invoice.customerId) : null;
    const pdfFileName = invoice.pdfUrl ? getPdfFileName(invoice.pdfUrl) : `invoice-${invoice._id}.pdf`;
    const fileExists = await pdfExists(pdfFileName);
    let pdfUrl = invoice.pdfUrl ? ensureAbsolutePdfUrl(invoice.pdfUrl) : null;

    if (!fileExists) {
      pdfUrl = await generateInvoicePdf(invoice, customer);
      invoice.pdfUrl = pdfUrl;
      await invoice.save();
    } else if (!pdfUrl) {
      pdfUrl = ensureAbsolutePdfUrl(`/pdfs/${pdfFileName}`);
      invoice.pdfUrl = pdfUrl;
      await invoice.save();
    }
    res.json({ pdfUrl });
  } catch (error) {
    next(error);
  }
});

export const emailsRouter = Router();
emailsRouter.use(requireAuth);
emailsRouter.get('/', async (req, res, next) => {
  try {
    const emails = await Email.find().sort({ createdAt: -1 }).limit(100);
    res.json({ emails });
  } catch (error) {
    next(error);
  }
});

emailsRouter.get('/:id', async (req, res, next) => {
  try {
    const email = await Email.findById(req.params.id);
    res.json({ email });
  } catch (error) {
    next(error);
  }
});

emailsRouter.post('/process', async (req, res, next) => {
  try {
    const { email, executions, eventId } = await orchestrateEmailProcessing(req.user, req.body);
    await Notification.create({
      userId: req.user.id,
      type: 'email',
      title: 'Email processed by agent orchestration',
      message: `${email.intent} detected with ${email.urgency} urgency and processed by agents.`,
      metadata: { emailId: email.id, eventId }
    });
    emitRealtime('new_email', { emailId: email.id });
    emitRealtime('agent_completed', { eventId, emailId: email.id });
    res.status(201).json({ email, executions, eventId });
  } catch (error) {
    next(error);
  }
});

emailsRouter.post('/send', requireAuth, async (req, res, next) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || (!text && !html)) {
      res.status(400);
      throw new Error('Missing email fields: `to` and `text`/`html` required');
    }

    try {
      const info = await sendEmail({ to, subject: subject || 'Message from NxtBiz', text, html });
      res.status(201).json({ ok: true, info });
    } catch (sendError) {
      res.status(502);
      throw sendError;
    }
  } catch (error) {
    next(error);
  }
});

export const reportsRouter = Router();
reportsRouter.use(requireAuth);
reportsRouter.get('/', async (req, res, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    const normalized = reports.map((report) => {
      const data = report.toObject ? report.toObject() : report;
      if (data.pdfUrl) {
        data.pdfUrl = ensureAbsolutePdfUrl(data.pdfUrl);
      }
      return data;
    });
    res.json({ reports: normalized });
  } catch (error) {
    next(error);
  }
});
reportsRouter.get('/:id', async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    res.json({ report });
  } catch (error) {
    next(error);
  }
});
reportsRouter.post('/generate', async (req, res, next) => {
  try {
    const report = await Report.create({
      type: req.body.type || 'weekly',
      title: req.body.title || 'NxtBiz Operations Report',
      summary: req.body.summary || 'Operational snapshot generated from current workspace activity.',
      metrics: req.body.metrics || { revenue: 21300, healthScore: 81, openTickets: 0 },
      recommendations: req.body.recommendations || ['Review critical emails', 'Follow up on open invoices'],
      generatedBy: req.user.id
    });

    const pdfUrl = await generateReportPdf(report);
    report.pdfUrl = pdfUrl;
    await report.save();

    emitRealtime('workflow_executed', { reportId: report.id });
    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});

reportsRouter.get('/:id/download', requireAuth, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404);
      throw new Error('Report not found');
    }
    const pdfFileName = report.pdfUrl ? getPdfFileName(report.pdfUrl) : `report-${report._id}.pdf`;
    const fileExists = await pdfExists(pdfFileName);
    let pdfUrl = report.pdfUrl ? ensureAbsolutePdfUrl(report.pdfUrl) : null;

    if (!fileExists) {
      pdfUrl = await generateReportPdf(report);
      report.pdfUrl = pdfUrl;
      await report.save();
    } else if (!pdfUrl) {
      pdfUrl = ensureAbsolutePdfUrl(`/pdfs/${pdfFileName}`);
      report.pdfUrl = pdfUrl;
      await report.save();
    }
    res.json({ pdfUrl });
  } catch (error) {
    next(error);
  }
});

export const crmRouter = Router();
crmRouter.use(requireAuth);
crmRouter.get('/', async (req, res, next) => {
  try {
    const activities = await CRMActivity.find().sort({ createdAt: -1 }).limit(100);
    res.json({ activities });
  } catch (error) {
    next(error);
  }
});
crmRouter.post('/note', async (req, res, next) => {
  try {
    const activity = await CRMActivity.create({ ...req.body, type: 'note', createdBy: req.user.id });
    emitRealtime('crm_updated', { activityId: activity.id });
    res.status(201).json({ activity });
  } catch (error) {
    next(error);
  }
});
crmRouter.post('/activity', async (req, res, next) => {
  try {
    const activity = await CRMActivity.create({ ...req.body, createdBy: req.user.id });
    emitRealtime('crm_updated', { activityId: activity.id });
    res.status(201).json({ activity });
  } catch (error) {
    next(error);
  }
});

export const workflowsRouter = crudRouter(Workflow, 'workflows', 'workflow_executed');
workflowsRouter.post('/:id/execute', requireAuth, async (req, res, next) => {
  try {
    const result = await enqueueWorkflowExecution({ workflowId: req.params.id, payload: req.body, user: req.user });
    res.json({ result });
  } catch (error) {
    next(error);
  }
});

export const agentsRouter = Router();
agentsRouter.use(requireAuth);
agentsRouter.get('/', async (req, res, next) => {
  try {
    await Agent.bulkWrite(agentDefinitions.map((agentId) => ({
      updateOne: {
        filter: { agentId },
        update: { $setOnInsert: { agentId, name: agentId.replaceAll('-', ' '), capabilities: ['plan', 'execute', 'record'] } },
        upsert: true
      }
    })));
    const agents = await Agent.find().sort({ agentId: 1 });
    res.json({ agents });
  } catch (error) {
    next(error);
  }
});
agentsRouter.get('/executions', async (req, res, next) => {
  try {
    const executions = await AgentExecution.find().sort({ createdAt: -1 }).limit(100);
    res.json({ executions });
  } catch (error) {
    next(error);
  }
});
agentsRouter.post('/run', requireRoles(rolePermissions.agents.run), async (req, res, next) => {
  try {
    const agentId = req.body.agentId || 'chief-of-staff-agent';
    const { execution, eventId } = await orchestrateManualAgentRun({ user: req.user, agentId, payload: req.body });
    emitRealtime('agent_completed', { executionId: execution.id, agentId, eventId });
    res.status(201).json({ execution, eventId });
  } catch (error) {
    next(error);
  }
});

export const memoryRouter = Router();
memoryRouter.use(requireAuth);
memoryRouter.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const memories = await Memory.find(q ? { $or: [{ key: new RegExp(q, 'i') }, { value: new RegExp(q, 'i') }] } : {}).limit(50);
    res.json({ memories });
  } catch (error) {
    next(error);
  }
});

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);
notificationsRouter.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});
notificationsRouter.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    emitRealtime('notifications_updated', { userId: req.user.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
notificationsRouter.put('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    emitRealtime('notifications_updated', { notificationId: req.params.id });
    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

export const settingsRouter = Router();
settingsRouter.use(requireAuth);
settingsRouter.get('/', (req, res) => {
  res.json({
    settings: {
      brand: 'NxtBiz',
      realtime: true,
      redisMode: process.env.REDIS_URL ? 'queue' : 'synchronous fallback',
      pdfBaseUrl: process.env.PDF_BASE_URL || 'http://localhost:4000/pdfs'
    }
  });
});
