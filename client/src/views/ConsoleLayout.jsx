import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Bot, Building2, FileText, Home, LogOut, Moon, Settings, Ticket, Users } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { api } from '../api/http.js';
import { useAuthStore } from '../store/authStore.js';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/customers', label: 'Customers', icon: Building2 },
  { to: '/emails', label: 'Emails', icon: Bell },
  { to: '/meetings', label: 'Meetings', icon: FileText },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/crm', label: 'CRM', icon: Building2 },
  { to: '/workflows', label: 'Workflows', icon: Bot },
  { to: '/ai-control', label: 'AI Control', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export function ConsoleLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading, loadSession, logout } = useAuthStore();
  const [dark, setDark] = useState(false);
  const { data: notificationsData } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => (await api.get('/api/notifications')).data,
    enabled: Boolean(user)
  });

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', { withCredentials: true });
    ['new_email', 'new_ticket', 'invoice_created', 'meeting_created', 'agent_completed', 'workflow_executed', 'customer_updated', 'crm_updated', 'notifications_updated'].forEach((eventName) => {
      socket.on(eventName, () => {
        toast.success(eventName.replaceAll('_', ' '));
        queryClient.invalidateQueries();
      });
    });
    return () => socket.disconnect();
  }, [queryClient]);

  const initials = useMemo(() => user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'NB', [user]);
  const unreadCount = notificationsData?.notifications?.filter((notification) => !notification.read).length || 0;

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-ink">Loading NxtBiz...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-ink dark:bg-slate-950 dark:text-slate-100">
      <aside className="w-64 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6">
          <p className="text-xl font-bold">NxtBiz</p>
          <p className="text-xs text-slate-500">Operations Console</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-ink text-white dark:bg-mint dark:text-ink' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-coral px-2 py-1 text-xs font-semibold text-white">{unreadCount} unread</span>
            <button className="rounded-md border border-slate-300 p-2 dark:border-slate-700" onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode">
              <Moon size={17} />
            </button>
            <button className="rounded-md border border-slate-300 p-2 dark:border-slate-700" onClick={logout} aria-label="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
