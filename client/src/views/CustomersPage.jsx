import { ModulePage } from './ModulePage.jsx';

export function CustomersPage() {
  return (
    <ModulePage
      title="Customer Management"
      description="Create and monitor customer 360 records."
      endpoint="/api/customers"
      listKey="customers"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone' },
        { name: 'company', label: 'Company' },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'company', label: 'Company' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'healthScore', label: 'Health' }
      ]}
    />
  );
}
