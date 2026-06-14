import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthPage } from './views/AuthPage.jsx';
import { ConsoleLayout } from './views/ConsoleLayout.jsx';
import { DashboardPage } from './views/DashboardPage.jsx';
import { UsersPage } from './views/UsersPage.jsx';
import { CustomersPage } from './views/CustomersPage.jsx';
import { EmailsPage } from './views/EmailsPage.jsx';
import { AiControlPage, CrmPage, InvoicesPage, MeetingsPage, ReportsPage, TicketsPage, WorkflowsPage } from './views/SimpleModulePages.jsx';
import { SettingsPage } from './views/SettingsPage.jsx';

const protectedChildren = [
  { index: true, element: <DashboardPage /> },
  { path: 'users', element: <UsersPage /> },
  { path: 'customers', element: <CustomersPage /> },
  { path: 'customers/:id', element: <CustomersPage /> },
  { path: 'emails', element: <EmailsPage /> },
  { path: 'meetings', element: <MeetingsPage /> },
  { path: 'invoices', element: <InvoicesPage /> },
  { path: 'tickets', element: <TicketsPage /> },
  { path: 'reports', element: <ReportsPage /> },
  { path: 'crm', element: <CrmPage /> },
  { path: 'workflows', element: <WorkflowsPage /> },
  { path: 'ai-control', element: <AiControlPage /> },
  { path: 'settings', element: <SettingsPage /> }
];

export const router = createBrowserRouter([
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/register', element: <AuthPage mode="register" /> },
  { path: '/', element: <ConsoleLayout />, children: protectedChildren },
  { path: '*', element: <Navigate to="/" replace /> }
]);
