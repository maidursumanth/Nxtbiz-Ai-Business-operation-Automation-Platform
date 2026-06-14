import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/http.js';
import { ModulePage } from './ModulePage.jsx';

const dateValue = (value) => value ? new Date(value).toLocaleString() : '-';
const money = (value) => value ? `$${Number(value).toLocaleString()}` : '$0';

export function MeetingsPage() {
  return (
    <ModulePage title="Meetings" description="Schedule and track customer meetings." endpoint="/api/meetings" listKey="meetings"
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'attendees', label: 'Attendees' },
        { name: 'startTime', label: 'Start Time', type: 'datetime-local', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'cancelled'], defaultValue: 'scheduled' },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]}
      transformSubmit={(input) => ({ ...input, attendees: input.attendees ? input.attendees.split(',').map((item) => item.trim()) : [] })}
      columns={[{ key: 'title', label: 'Title' }, { key: 'attendees', label: 'Attendees' }, { key: 'startTime', label: 'Start' , format: dateValue }, { key: 'status', label: 'Status' }]}
    />
  );
}

export function InvoicesPage() {
  return (
    <ModulePage title="Invoices" description="Create invoices and track collection status." endpoint="/api/invoices" listKey="invoices"
      fields={[
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'paid', 'overdue'], defaultValue: 'draft' }
      ]}
      columns={[
        { key: 'amount', label: 'Amount', format: money },
        { key: 'dueDate', label: 'Due', format: dateValue },
        { key: 'status', label: 'Status' },
        { key: 'pdfUrl', label: 'PDF', format: (value) => value ? <a href={value} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Download</a> : 'Not generated' }
      ]}
      rowActions={[
        {
          label: 'Generate PDF',
          onClick: async (record, queryClient) => {
            const response = await api.get(`/api/invoices/${record._id}/download`);
            toast.success('Invoice PDF generated');
            queryClient.invalidateQueries();
            return response.data;
          }
        }
      ]}
    />
  );
}

export function TicketsPage() {
  return (
    <ModulePage title="Tickets" description="Track support issues and resolution state." endpoint="/api/tickets" listKey="tickets"
      fields={[
        { name: 'issue', label: 'Issue', required: true },
        { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'], defaultValue: 'medium' },
        { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'resolved'], defaultValue: 'open' },
        { name: 'resolution', label: 'Resolution', type: 'textarea' }
      ]}
      columns={[{ key: 'issue', label: 'Issue' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'resolution', label: 'Resolution' }]}
    />
  );
}

export function ReportsPage() {
  return (
    <ModulePage title="Reports" description="Generate weekly and executive reports." endpoint="/api/reports" createPath="/api/reports/generate" createLabel="Generate Report" listKey="reports"
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'type', label: 'Type', type: 'select', options: ['weekly', 'executive'], defaultValue: 'weekly' },
        { name: 'summary', label: 'Summary', type: 'textarea' }
      ]}
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'summary', label: 'Summary' },
        { key: 'pdfUrl', label: 'PDF', format: (value) => value ? <a href={value} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Download</a> : 'Not generated' }
      ]}
      rowActions={[
        {
          label: 'Generate PDF',
          onClick: async (record, queryClient) => {
            const response = await api.get(`/api/reports/${record._id}/download`);
            toast.success('Report PDF generated');
            queryClient.invalidateQueries();
            return response.data;
          }
        }
      ]}
    />
  );
}

export function CrmPage() {
  return (
    <ModulePage title="CRM Timeline" description="Capture notes and operational activity." endpoint="/api/crm" createPath="/api/crm/note" createLabel="Add Note" listKey="activities"
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'body', label: 'Body', type: 'textarea' }
      ]}
      columns={[{ key: 'type', label: 'Type' }, { key: 'title', label: 'Title' }, { key: 'body', label: 'Body' }, { key: 'createdAt', label: 'Created', format: dateValue }]}
    />
  );
}

export function WorkflowsPage() {
  return (
    <ModulePage title="Workflows" description="Create automation workflows and inspect execution logs." endpoint="/api/workflows" listKey="workflows"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'trigger', label: 'Trigger', defaultValue: 'manual' },
        { name: 'condition', label: 'Condition' },
        { name: 'action', label: 'Action', defaultValue: 'notify' }
      ]}
      columns={[{ key: 'name', label: 'Name' }, { key: 'trigger', label: 'Trigger' }, { key: 'condition', label: 'Condition' }, { key: 'action', label: 'Action' }, { key: 'enabled', label: 'Enabled', format: (value) => value ? 'Yes' : 'No' }]}
      rowActions={[
        {
          label: 'Execute',
          onClick: async (record, queryClient) => {
            await api.post(`/api/workflows/${record._id}/execute`, { source: 'manual', name: record.name });
            toast.success('Workflow executed');
            queryClient.invalidateQueries();
          }
        }
      ]}
    />
  );
}

export function AiControlPage() {
  return (
    <ModulePage title="AI Control Center" description="Run agents manually and review agent definitions." endpoint="/api/agents" createPath="/api/agents/run" createLabel="Run Agent" listKey="agents"
      fields={[{ name: 'agentId', label: 'Agent', type: 'select', options: ['chief-of-staff-agent', 'email-agent', 'crm-agent', 'invoice-agent'], defaultValue: 'chief-of-staff-agent' }]}
      columns={[{ key: 'agentId', label: 'Agent ID' }, { key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'lastExecution', label: 'Last Run', format: dateValue }]}
    />
  );
}

export function MemoryPage() {
  const [query, setQuery] = useState('');
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/memory/search?q=${encodeURIComponent(query)}`);
      setMemories(response.data.memories || []);
    } catch (error) {
      toast.error('Memory search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Memory Search</h1>
          <p className="text-sm text-slate-500">Search business memory entries stored by agents and workflows.</p>
        </div>
        <div className="flex w-full max-w-md gap-2">
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-ink focus:outline-none dark:border-slate-700 dark:bg-slate-950"
            placeholder="Search memories..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="rounded-md bg-ink px-4 py-2 text-white dark:bg-mint dark:text-ink"
            onClick={fetchMemories}
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {loading ? <p className="text-sm text-slate-500">Searching memories...</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {memories.map((memory) => (
                <tr key={memory._id}>
                  <td className="px-4 py-3 align-top">{memory.key}</td>
                  <td className="px-4 py-3 align-top">{memory.value}</td>
                  <td className="px-4 py-3 align-top">{memory.source}</td>
                  <td className="px-4 py-3 align-top">{(memory.tags || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && memories.length === 0 ? <p className="p-4 text-sm text-slate-500">No memories found.</p> : null}
        </div>
      </div>
    </section>
  );
}
