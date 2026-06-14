import { useQuery } from '@tanstack/react-query';
import { api } from '../api/http.js';

export function SettingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => (await api.get('/api/settings')).data
  });

  const settings = data?.settings || {};

  return (
    <section>
      <h1 className="text-2xl font-semibold">Runtime Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Current NxtBiz runtime configuration.</p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? <p>Loading settings...</p> : null}
        {error ? <p className="text-coral">Settings could not load.</p> : null}
        {!isLoading && !error ? (
          <dl className="grid gap-4 md:grid-cols-2">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                <dt className="text-xs uppercase text-slate-500">{key}</dt>
                <dd className="mt-1 font-medium">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
