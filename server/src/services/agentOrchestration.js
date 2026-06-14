import { randomUUID } from 'crypto';
import { Agent, AgentExecution, CRMActivity, Email, Invoice, Meeting, Ticket } from '../models/operations.js';
import { Notification } from '../models/Notification.js';
import { analyzeEmail } from './emailIntelligence.js';
import { planAgentsForIntent } from '../spec/agentRules.js';
import { agentDefinitions } from '../spec/businessRules.js';

function buildOrchestrationContext({ user, email, eventId, source = 'email' }) {
  return {
    eventId,
    source,
    userId: user?.id || user?._id,
    customerId: email.customerId,
    email,
    input: {
      emailId: email.id,
      subject: email.subject,
      body: email.body,
      sender: email.sender,
      intent: email.intent,
      urgency: email.urgency,
      sentiment: email.sentiment,
      confidence: email.confidence,
      autoResponse: email.autoResponse,
      recommendations: email.recommendations
    },
    summary: `Email received from ${email.sender} about ${email.subject}`,
    timestamp: new Date().toISOString()
  };
}

async function setAgentStatus(agentId, status) {
  await Agent.findOneAndUpdate(
    { agentId },
    { status, lastExecution: new Date() },
    { upsert: true }
  );
}

async function recordExecution({ agentId, eventId, status, input, output, logs, startedAt, finishedAt, error }) {
  return AgentExecution.create({
    agentId,
    eventId,
    status,
    input,
    output,
    logs,
    startedAt,
    finishedAt,
    error: error?.message || error?.toString() || undefined
  });
}

async function ensureAgents() {
  await Agent.bulkWrite(
    agentDefinitions.map((agentId) => ({
      updateOne: {
        filter: { agentId },
        update: {
          $setOnInsert: {
            agentId,
            name: agentId.replaceAll('-', ' '),
            description: `Domain agent for ${agentId.replaceAll('-', ' ')}`,
            capabilities: ['plan', 'execute', 'record'],
            status: 'idle'
          }
        },
        upsert: true
      }
    }))
  );
}

function buildTaskPlan(context) {
  const tasks = [];

  if (context.email.intent === 'schedule_meeting') {
    tasks.push('Schedule a follow-up meeting.');
  }
  if (context.email.intent === 'invoice_request') {
    tasks.push('Prepare an invoice draft.');
  }
  if (context.email.intent === 'support_request') {
    tasks.push('Open a support ticket and assign it.');
  }
  if (context.email.intent === 'sales_opportunity') {
    tasks.push('Qualify the opportunity and align sales resources.');
  }
  if (context.email.intent === 'general_inquiry') {
    tasks.push('Capture the inquiry in CRM and follow up as needed.');
  }

  if (context.email.urgency === 'critical') {
    tasks.unshift('Treat this email as critical and follow up immediately.');
  }

  return tasks;
}

async function handleIntentAgent(context) {
  return {
    status: 'completed',
    output: {
      detectedIntent: context.email.intent,
      intentConfidence: context.email.intentConfidence,
      sentiment: context.email.sentiment,
      urgency: context.email.urgency,
      summary: `Detected ${context.email.intent} with ${context.email.urgency} urgency.`
    },
    logs: ['Intent agent confirmed mail classification.']
  };
}

async function handleTaskPlannerAgent(context) {
  const tasks = buildTaskPlan(context);

  return {
    status: 'completed',
    output: { tasks },
    logs: ['Task planner agent produced task recommendations.']
  };
}

async function handleCRMAgent(context) {
  const activity = await CRMActivity.create({
    customerId: context.customerId,
    type: 'agent',
    title: `CRM task generated for ${context.email.intent}`,
    body: `Email from ${context.email.sender}: ${context.email.subject}\n\n${context.email.body}`,
    metadata: {
      intent: context.email.intent,
      urgency: context.email.urgency,
      recommendations: context.email.recommendations
    },
    createdBy: context.userId
  });

  return {
    status: 'completed',
    output: { activityId: activity.id },
    logs: ['CRM activity created for email context.']
  };
}

async function handleEmailAgent(context) {
  const activity = await CRMActivity.create({
    customerId: context.customerId,
    type: 'email-response',
    title: `Auto-response prepared for ${context.email.subject}`,
    body: context.email.autoResponse,
    metadata: {
      intent: context.email.intent,
      urgency: context.email.urgency,
      sentiment: context.email.sentiment
    },
    createdBy: context.userId
  });

  return {
    status: 'completed',
    output: {
      autoResponse: context.email.autoResponse,
      activityId: activity.id
    },
    logs: ['Email agent recorded the recommended auto-response.']
  };
}

async function handleMeetingAgent(context) {
  if (context.email.intent !== 'schedule_meeting') {
    return {
      status: 'skipped',
      output: { reason: 'Not a meeting request' },
      logs: ['Meeting agent skipped because email intent is not schedule_meeting.']
    };
  }

  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 2);
  startTime.setHours(10, 0, 0, 0);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1);

  const meeting = await Meeting.create({
    title: `Follow-up: ${context.email.subject}`,
    attendees: [context.email.sender],
    startTime,
    endTime,
    notes: context.email.body,
    status: 'scheduled',
    customerId: context.customerId
  });

  return {
    status: 'completed',
    output: { meetingId: meeting.id, scheduledFor: startTime.toISOString() },
    logs: ['Meeting agent created a follow-up meeting.']
  };
}

async function handleInvoiceAgent(context) {
  if (context.email.intent !== 'invoice_request') {
    return {
      status: 'skipped',
      output: { reason: 'Not an invoice request' },
      logs: ['Invoice agent skipped because email intent is not invoice_request.']
    };
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const invoice = await Invoice.create({
    customerId: context.customerId,
    amount: 0,
    dueDate,
    status: 'draft',
    lineItems: [{ description: `Request from ${context.email.sender}`, amount: 0 }]
  });

  return {
    status: 'completed',
    output: { invoiceId: invoice.id, dueDate: dueDate.toISOString() },
    logs: ['Invoice agent created a draft invoice.']
  };
}

async function handleCustomerSupportAgent(context) {
  if (context.email.intent !== 'support_request') {
    return {
      status: 'skipped',
      output: { reason: 'Not a support request' },
      logs: ['Customer support agent skipped because email intent is not support_request.']
    };
  }

  const ticket = await Ticket.create({
    customerId: context.customerId,
    priority: context.email.urgency === 'critical' ? 'high' : 'medium',
    issue: `${context.email.subject}: ${context.email.body}`,
    status: 'open',
    assignedTo: null,
    resolution: ''
  });

  return {
    status: 'completed',
    output: { ticketId: ticket.id, priority: ticket.priority },
    logs: ['Customer support agent opened a support ticket.']
  };
}

async function handleChiefOfStaffAgent(context) {
  const summary = [
    `Intent: ${context.email.intent}`,
    `Urgency: ${context.email.urgency}`,
    `Sentiment: ${context.email.sentiment}`,
    `Recommendations: ${context.email.recommendations.join('; ')}`
  ].join(' | ');

  await Notification.create({
    userId: context.userId,
    type: 'agent',
    title: 'Executive review requested',
    message: `Executive summary for incoming email: ${summary}`,
    metadata: {
      eventId: context.eventId,
      emailId: context.email.id,
      intent: context.email.intent,
      urgency: context.email.urgency
    }
  });

  return {
    status: 'completed',
    output: { executiveSummary: summary },
    logs: ['Chief of staff agent generated an executive review summary.']
  };
}

const agentHandlers = {
  'intent-agent': handleIntentAgent,
  'task-planner-agent': handleTaskPlannerAgent,
  'crm-agent': handleCRMAgent,
  'email-agent': handleEmailAgent,
  'meeting-agent': handleMeetingAgent,
  'invoice-agent': handleInvoiceAgent,
  'customer-support-agent': handleCustomerSupportAgent,
  'chief-of-staff-agent': handleChiefOfStaffAgent
};

async function executeAgent(agentId, context) {
  await setAgentStatus(agentId, 'busy');
  const startedAt = new Date();

  try {
    const handler = agentHandlers[agentId] || (async () => ({ status: 'skipped', output: { reason: 'No handler available' }, logs: ['No agent handler found.'] }));
    const result = await handler(context);
    const finishedAt = new Date();
    const execution = await recordExecution({
      agentId,
      eventId: context.eventId,
      status: result.status || 'completed',
      input: context.input,
      output: result.output || {},
      logs: result.logs || [],
      startedAt,
      finishedAt,
      error: result.error
    });
    await setAgentStatus(agentId, 'idle');
    return execution;
  } catch (error) {
    const finishedAt = new Date();
    const execution = await recordExecution({
      agentId,
      eventId: context.eventId,
      status: 'failed',
      input: context.input,
      output: {},
      logs: [error.message],
      startedAt,
      finishedAt,
      error
    });
    await setAgentStatus(agentId, 'idle');
    return execution;
  }
}

export async function orchestrateEmailProcessing(user, emailInput) {
  const analysis = analyzeEmail(emailInput);
  const email = await Email.create({ ...emailInput, ...analysis, processed: true });
  const eventId = randomUUID();
  const context = buildOrchestrationContext({ user, email, eventId, source: 'email' });

  const plannedAgents = planAgentsForIntent(email.intent);
  const executions = [];

  for (const agentId of plannedAgents) {
    const execution = await executeAgent(agentId, context);
    executions.push(execution);
  }

  await Notification.create({
    userId: user.id,
    type: 'email',
    title: 'Email processed by agents',
    message: `${email.intent} detected with ${email.urgency} urgency and passed through agent orchestration.`,
    metadata: { emailId: email.id, eventId }
  });

  return { email, executions, eventId };
}

export async function orchestrateManualAgentRun({ user, agentId, payload }) {
  const eventId = randomUUID();
  const context = {
    eventId,
    source: 'manual',
    userId: user?.id || user?._id,
    input: payload,
    summary: `Manual execution of ${agentId}`,
    timestamp: new Date().toISOString()
  };

  const execution = await executeAgent(agentId, context);
  return { execution, eventId };
}

export { ensureAgents };
