import { ModulePage } from './ModulePage.jsx';

export function EmailsPage() {
  return (
    <ModulePage
      title="Email Dashboard"
      description="Process incoming email into sentiment, intent, urgency, recommendations, and agent executions."
      endpoint="/api/emails"
      createPath="/api/emails/process"
      createLabel="Process Email"
      listKey="emails"
      fields={[
        { name: 'sender', label: 'Sender', type: 'email', required: true },
        { name: 'subject', label: 'Subject', required: true },
        { name: 'body', label: 'Body', type: 'textarea', required: true }
      ]}
      columns={[
        { key: 'sender', label: 'Sender' },
        { key: 'subject', label: 'Subject' },
        { key: 'sentiment', label: 'Sentiment' },
        { key: 'intent', label: 'Intent' },
        { key: 'urgency', label: 'Urgency' },
        { key: 'confidence', label: 'Confidence', format: (value) => (value ? `${Math.round(value * 100)}%` : '-') },
        { key: 'autoResponse', label: 'Auto Response', format: (value) => value || '-' },
        { key: 'recommendations', label: 'Recommendations', format: (value) => Array.isArray(value) ? value.join(' • ') : value || '-' },
        { key: 'processed', label: 'Processed', format: (value) => value ? 'Yes' : 'No' }
      ]}
    />
  );
}
