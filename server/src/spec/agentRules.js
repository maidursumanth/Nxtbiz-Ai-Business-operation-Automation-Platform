export const taskPlannerRules = {
  schedule_meeting: ['meeting-agent'],
  invoice_request: ['invoice-agent'],
  support_request: ['customer-support-agent'],
  sales_opportunity: ['email-agent'],
  general_inquiry: ['email-agent']
};

export function planAgentsForIntent(intent) {
  return [
    'intent-agent',
    'task-planner-agent',
    ...(taskPlannerRules[intent] || taskPlannerRules.general_inquiry),
    'crm-agent',
    'chief-of-staff-agent'
  ];
}
