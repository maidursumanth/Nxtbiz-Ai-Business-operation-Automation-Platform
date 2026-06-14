import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { customersRouter } from './routes/customers.routes.js';
import {
  agentsRouter,
  crmRouter,
  emailsRouter,
  invoicesRouter,
  meetingsRouter,
  memoryRouter,
  notificationsRouter,
  reportsRouter,
  settingsRouter,
  ticketsRouter,
  workflowsRouter
} from './routes/operations.routes.js';
import { usersRouter } from './routes/users.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use('/pdfs', express.static(path.resolve(__dirname, '../storage/pdfs')));

  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/emails', emailsRouter);
  app.use('/api/meetings', meetingsRouter);
  app.use('/api/invoices', invoicesRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/crm', crmRouter);
  app.use('/api/workflows', workflowsRouter);
  app.use('/api/agents', agentsRouter);
  app.use('/api/memory', memoryRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/settings', settingsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
