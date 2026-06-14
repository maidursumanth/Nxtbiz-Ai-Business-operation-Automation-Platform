import { useState } from 'react';

export function RecordForm({ fields, onSubmit, submitLabel = 'Create', loading }) {
  const initialForm = Object.fromEntries(fields.map((field) => [field.name, field.defaultValue || '']));
  const [form, setForm] = useState(initialForm);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
    setForm(initialForm);
  }

  return (
    <form className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label key={field.name} className={field.type === 'textarea' ? 'text-sm font-medium md:col-span-2' : 'text-sm font-medium'}>
          {field.label}
          {field.type === 'textarea' ? (
            <textarea className="mt-1 min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)} required={field.required} />
          ) : field.type === 'select' ? (
            <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)} required={field.required}>
              {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type={field.type || 'text'} value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)} required={field.required} />
          )}
        </label>
      ))}
      <div className="flex items-end">
        <button className="w-full rounded-md bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60 dark:bg-mint dark:text-ink" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
