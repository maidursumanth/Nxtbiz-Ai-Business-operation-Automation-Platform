export const sentiments = ['positive', 'neutral', 'negative'];

export const urgencies = ['low', 'medium', 'high', 'critical'];

export const intents = [
  'general_inquiry',
  'schedule_meeting',
  'invoice_request',
  'support_request',
  'sales_opportunity'
];

export const intentKeywords = {
  general_inquiry: ['question', 'ask', 'info', 'information', 'details', 'follow up', 'follow-up', 'inquiry', 'clarify'],
  schedule_meeting: ['meeting', 'schedule', 'call', 'zoom', 'demo', 'connect', 'availability', 'book', 'appointment', 'time'],
  invoice_request: ['invoice', 'bill', 'payment', 'due', 'charge', 'statement', 'receipt', 'billing', 'overdue', 'refund'],
  support_request: ['support', 'issue', 'problem', 'broken', 'error', 'failed', 'help', 'bug', 'crash', 'complaint', 'not working', 'unable', 'blocked'],
  sales_opportunity: ['pricing', 'demo', 'renew', 'trial', 'purchase', 'quote', 'proposal', 'upgrade', 'sales', 'interest', 'opportunity']
};

export const negativeSignalWords = [
  'angry',
  'cancel',
  'broken',
  'refund',
  'late',
  'complaint',
  'bad',
  'issue',
  'failed',
  'problem',
  'error',
  'blocked',
  'unable',
  'not working'
];

export const positiveSignalWords = [
  'thanks',
  'thank you',
  'great',
  'love',
  'happy',
  'excellent',
  'appreciate',
  'renew',
  'pleased',
  'good'
];

export const criticalUrgencyWords = ['urgent', 'asap', 'immediately', 'as soon as possible', 'critical', 'priority'];

export const highUrgencyWords = ['today', 'soon', 'deadline', 'due', 'important', 'asap', 'urgent', 'blocked', 'unable', 'not working'];

export const mediumUrgencyWords = ['when you can', 'next week', 'later', 'sometime', 'schedule', 'follow up', 'follow-up', 'available'];

export const responseTemplates = {
  general_inquiry: 'Thanks for reaching out. I have reviewed your message and will follow up shortly with the next steps.',
  schedule_meeting: 'Thanks for reaching out. I will coordinate the meeting details and share a calendar invitation shortly.',
  invoice_request: 'Thanks for reaching out. I am confirming the billing details and will follow up with payment information shortly.',
  support_request: 'Thanks for reaching out. I have logged your request with our support team and will follow up with a resolution as soon as possible.',
  sales_opportunity: 'Thanks for reaching out. I am reviewing your request and will connect with you with a tailored recommendation shortly.'
};

export const recommendationTemplates = {
  general_inquiry: ['Capture the inquiry in CRM and follow up with the customer.', 'Monitor the request for future coordination.'],
  schedule_meeting: ['Schedule a meeting and add a calendar event.', 'Log meeting details in CRM and prepare an agenda.'],
  invoice_request: ['Verify billing details and send an invoice update.', 'Route to finance for follow up.'],
  support_request: ['Open a support ticket and assign an owner.', 'Document the issue in the CRM activity log.'],
  sales_opportunity: ['Qualify the opportunity and schedule a discovery meeting.', 'Prepare a tailored proposal for the customer.']
};
