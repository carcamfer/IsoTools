// src/tools/manage_nonconformances.js
// Control de producto no conforme (ISO 8.7). isoEvent: "nonconformance_registered".
export const meta = {
  id: 'manage_nonconformances',
  name: 'Gestión de No Conformidades',
  version: '1.1.0',
  category: 'quality',
  consumes: ['OUT_OF_CONTROL_DETECTED', 'DEFECT_FOUND', 'FMEA_CRITICAL_FOUND'],
  produces: ['NC_CREATED', 'NC_REQUIRES_8D']
};

export function handler (event) {
  const input = event.data || {};
  const nc = {
    ncId: 'NC-2026-0007',
    status: 'open',
    assignedTo: 'calidad@planta',
    dueDate: '2026-06-20',
    estimatedCost: 1500,
    originEvent: input.chartId || input.defectType || 'fmea'
  };
  return [
    // NC_CREATED sale por CADA no conformidad, sea cual sea su severidad: es la
    // evidencia de 8.7 que lee el reporte de auditoria. Sin el, una NC menor no
    // dejaria rastro, porque solo las graves llegan a NC_REQUIRES_8D.
    {
      event: { type: 'NC_CREATED', category: 'quality', severity: 'critical' },
      asset: event.asset,
      data: nc
    },
    {
      // severity 'critical' dispara la regla 8D (severity IN ['major','critical'])
      event: { type: 'NC_REQUIRES_8D', category: 'quality', severity: 'critical' },
      asset: event.asset,
      data: nc
    }
  ];
}
