export function PlaceholderPage({ title }) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        This NxtBiz module is reserved for the next implementation phase.
      </div>
    </section>
  );
}
