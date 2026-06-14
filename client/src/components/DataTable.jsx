function valueFor(record, column) {
  const raw = column.accessor ? column.accessor(record) : record[column.key];
  if (column.format) return column.format(raw, record);
  if (Array.isArray(raw)) return raw.join(', ');
  if (raw && typeof raw === 'object') return JSON.stringify(raw);
  return raw ?? '-';
}

export function DataTable({ columns, records, loading, error, emptyText = 'No records yet.', actions = [] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {loading ? <p className="p-4 text-sm text-slate-500">Loading...</p> : null}
      {error ? <p className="p-4 text-sm text-coral">Could not load records.</p> : null}
      {!loading && !error && records.length === 0 ? <p className="p-4 text-sm text-slate-500">{emptyText}</p> : null}
      {records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950">
              <tr>
                {columns.map((column) => <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>)}
                {actions.length > 0 ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {records.map((record) => (
                <tr key={record._id}>
                  {columns.map((column) => <td key={column.key} className="px-4 py-3 align-top">{valueFor(record, column)}</td>)}
                  {actions.length > 0 ? (
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action) => (
                          <button key={action.label} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => action.onClick(record)}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
