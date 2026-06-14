import { useQuery } from '@tanstack/react-query';
import { Activity, CircleDollarSign, HeartPulse, Workflow } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../api/http.js';

const cards = [
  { label: 'Revenue', valueKey: 'revenue', icon: CircleDollarSign },
  { label: 'Business Health', valueKey: 'health', icon: HeartPulse },
  { label: 'Active Customers', valueKey: 'customers', icon: Activity },
  { label: 'Agent Executions', valueKey: 'executions', icon: Workflow }
];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/api/dashboard')).data
  });

  if (isLoading) return <p>Loading dashboard...</p>;
  if (error) return <p className="text-coral">Dashboard could not load.</p>;

  const cardValues = {
    revenue: formatCurrency(data.revenue?.current),
    health: data.health?.score ?? 0,
    customers: data.activity?.customers ?? 0,
    executions: data.executionHistory?.reduce((total, item) => total + item.count, 0) ?? 0
  };

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
        <p className="text-sm text-slate-500">Revenue, health, activity, and execution history.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(({ label, value, valueKey, icon: Icon }) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon size={18} />
            </div>
            <p className="mt-3 text-2xl font-semibold">{valueKey ? cardValues[valueKey] : value}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Revenue Trend</h2>
              <p className="text-sm text-slate-500">Monthly revenue with business health overlay.</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue?.trend || []} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2fbf71" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="#2fbf71" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} width={48} />
                <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Revenue' : 'Health']} />
                <Area type="monotone" dataKey="revenue" stroke="#2fbf71" strokeWidth={3} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold">Agent Execution Mix</h2>
          <p className="text-sm text-slate-500">Activity by operational domain.</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.executionHistory || []} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f25f5c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}
