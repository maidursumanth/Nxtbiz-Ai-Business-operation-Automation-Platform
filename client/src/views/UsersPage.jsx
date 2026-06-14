import { ModulePage } from './ModulePage.jsx';

export function UsersPage() {
  return (
    <ModulePage
      title="User Management"
      description="Create operators and review role-aware access."
      endpoint="/api/users"
      listKey="users"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'role', label: 'Role', type: 'select', options: ['Admin', 'Manager', 'Employee', 'Viewer'], defaultValue: 'Employee' }
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'active', label: 'Active', format: (value) => value ? 'Yes' : 'No' }
      ]}
    />
  );
}
