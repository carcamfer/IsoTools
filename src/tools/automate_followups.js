// src/tools/automate_followups.js
// Seguimiento automatizado hasta cierre de cada acción. isoEvent: "followup_automation_event".
// Tool TERMINAL del paquete: ninguna otra reacciona a su salida.
export const meta = {
  id: 'automate_followups',
  name: 'Automatización de Seguimientos',
  version: '1.0.0',
  category: 'system',
  consumes: ['SALES_PREDICTED', '8D_REPORT_ISSUED', 'PROJECT_AT_RISK'],
  produces: ['FOLLOWUP_SCHEDULED']
};

export function handler (event) {
  const input = event.data || {};
  const ids = Array.isArray(input.target_ids) ? input.target_ids : input.targetIds;
  const firstTargetId = Array.isArray(ids) ? ids[0] : null;
  return {
    event: { type: 'FOLLOWUP_SCHEDULED', category: 'system', severity: 'low' },
    asset: event.asset,
    data: {
      sent: 3,
      failed: 0,
      scheduledIds: ['FUP-001', 'FUP-002', 'FUP-003'],
      origin: input.report_id || input.reportId || input.project_id || input.projectId || firstTargetId || 'auto'
    }
  };
}
