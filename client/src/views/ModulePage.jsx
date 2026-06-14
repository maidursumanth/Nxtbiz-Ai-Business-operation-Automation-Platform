import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../api/http.js';
import { DataTable } from '../components/DataTable.jsx';
import { RecordForm } from '../components/RecordForm.jsx';

export function ModulePage({ title, description, endpoint, listKey, createPath, createLabel = 'Create', fields, columns, transformSubmit, emptyText, rowActions = [] }) {
  const queryClient = useQueryClient();
  const path = createPath || endpoint;

  const { data, isLoading, error } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => (await api.get(endpoint)).data
  });

  const createMutation = useMutation({
    mutationFn: async (input) => (await api.post(path, transformSubmit ? transformSubmit(input) : input)).data,
    onSuccess: () => {
      toast.success(`${title} updated`);
      queryClient.invalidateQueries();
    },
    onError: (mutationError) => toast.error(mutationError.response?.data?.message || 'Save failed')
  });

  const records = useMemo(() => data?.[listKey] || [], [data, listKey]);

  const actions = rowActions.map((action) => ({ ...action, onClick: (record) => action.onClick(record, queryClient) }));

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <RecordForm fields={fields} onSubmit={(input) => createMutation.mutateAsync(input)} submitLabel={createLabel} loading={createMutation.isPending} />
      <DataTable columns={columns} records={records} loading={isLoading} error={error} emptyText={emptyText} actions={actions} />
    </section>
  );
}
