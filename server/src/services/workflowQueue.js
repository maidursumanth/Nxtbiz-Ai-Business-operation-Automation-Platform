import { Queue, Worker, QueueEvents, JobScheduler } from 'bullmq';
import { env } from '../config/env.js';
import { Workflow } from '../models/operations.js';
import { Notification } from '../models/Notification.js';
import { emitRealtime } from '../realtime.js';

const queueName = 'workflow-executions';
let workflowQueue = null;
let workflowWorker = null;
let workflowScheduler = null;
let workflowEvents = null;

function sendRealtimeExecutionEvent(payload) {
  emitRealtime('workflow_executed', payload);
}

async function persistWorkflowLog(workflow, status, message, payload) {
  workflow.logs.push({ status, message, payload, createdAt: new Date() });
  await workflow.save();
}

async function processWorkflowExecution({ workflowId, payload, user }) {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const serialized = JSON.stringify(payload || {});
  const matched = !workflow.condition || serialized.toLowerCase().includes(workflow.condition.toLowerCase());
  const status = matched ? 'completed' : 'skipped';
  const message = matched ? 'Workflow executed' : 'Condition did not match';

  await persistWorkflowLog(workflow, status, message, payload);

  if (workflow.action === 'notify') {
    await Notification.create({
      userId: user?.id,
      type: 'workflow',
      title: `Workflow ${workflow.name} ${status}`,
      message,
      metadata: { workflowId: workflow.id, payload }
    });
  }

  sendRealtimeExecutionEvent({ workflowId: workflow.id, status, action: workflow.action, payload });

  return { workflowId: workflow.id, status, action: workflow.action };
}

export async function initializeWorkflowQueue() {
  if (!env.REDIS_URL) {
    console.info('Redis not configured; workflow execution will run synchronously.');
    return null;
  }

  try {
    workflowQueue = new Queue(queueName, { connection: { url: env.REDIS_URL } });
    workflowScheduler = new JobScheduler(queueName, { connection: { url: env.REDIS_URL } });
    workflowEvents = new QueueEvents(queueName, { connection: { url: env.REDIS_URL } });

    workflowWorker = new Worker(
      queueName,
      async (job) => processWorkflowExecution(job.data),
      { connection: { url: env.REDIS_URL } }
    );

    workflowEvents.on('completed', ({ jobId, returnvalue }) => {
      sendRealtimeExecutionEvent({ jobId, status: 'completed', returnvalue });
    });

    workflowEvents.on('failed', ({ jobId, failedReason }) => {
      sendRealtimeExecutionEvent({ jobId, status: 'failed', failedReason });
    });

    workflowWorker.on('failed', (job, error) => {
      console.warn(`Workflow job ${job.id} failed: ${error.message}`);
    });

    console.info(`Workflow queue initialized with Redis at ${env.REDIS_URL}`);
    return workflowQueue;
  } catch (error) {
    console.warn(`Could not initialize Redis workflow queue: ${error.message}`);
    console.info('Falling back to synchronous workflow execution.');
    workflowQueue = null;
    workflowWorker = null;
    workflowScheduler = null;
    workflowEvents = null;
    return null;
  }
}

export async function enqueueWorkflowExecution({ workflowId, payload, user }) {
  if (!workflowQueue) {
    return processWorkflowExecution({ workflowId, payload, user });
  }

  return workflowQueue.add('execute-workflow', {
    workflowId,
    payload,
    user: user ? { id: user.id, email: user.email, name: user.name } : undefined
  }, {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3
  });
}
