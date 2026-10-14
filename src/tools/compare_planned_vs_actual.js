// src/tools/compare_planned_vs_actual.js
// Objetivos vs ejecución (gap analysis y Revisión por Dirección). isoEvent: "production_variance_report".
export const meta = {
  id: 'compare_planned_vs_actual',
  name: 'Comparación Plan vs Real',
  version: '1.1.0',
  category: 'productivity',
  consumes: ['ERP_SALES_PERIOD_CLOSED'],
  produces: ['PRODUCTION_VARIANCE_DETECTED']
};

// LA META NO VIENE DEL ERP. Microsip no lleva presupuesto de ventas, y aunque lo
// llevara, una meta es gobernanza —importa quién la fijó y cuándo—, no un dato de
// operación. Vive aquí, versionada en git: el historial es la bitácora que pide la
// auditoría. El ERP aporta el REAL; el plan lo aporta Dirección.
//   sales: MXN facturados por periodo · production: piezas por periodo
const METAS = {
  // sales: 150000,
  // production: 1000,
};

const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

export function handler (event) {
  const input = event.data || {};
  const module = input.module || 'production';
  const actual = num(input.actual);

  // Sin `actual` el evento no trae un hecho medible (simulación local o evento
  // de otra fuente): se conserva el comportamiento demostrativo de siempre para
  // no romper la cadena ISO que se corre sin ERP.
  if (actual === null) {
    return {
      event: { type: 'PRODUCTION_VARIANCE_DETECTED', category: 'productivity', severity: 'medium' },
      asset: event.asset,
      data: {
        module,
        deviationPercent: 12.5,
        status: 'over_budget',
        details: { planned: 1000, actual: 875, unit: 'piezas' }
      }
    };
  }

  const planned = num(input.planned) ?? num(METAS[module]);
  const deviationPercent = planned
    ? Math.round(((actual - planned) / planned) * 1000) / 10
    : null;

  // Sin meta no se inventa una desviación: se publica el real y se deja la
  // ausencia visible en la evidencia. Un 0 % sería una afirmación falsa.
  const status = planned === null
    ? 'sin_meta'
    : (deviationPercent < 0 ? 'under_plan' : 'on_or_over_plan');

  return {
    event: {
      type: 'PRODUCTION_VARIANCE_DETECTED',
      category: 'productivity',
      severity: deviationPercent !== null && Math.abs(deviationPercent) >= 10 ? 'high' : 'medium'
    },
    asset: event.asset,
    data: {
      module,
      deviationPercent,
      status,
      plantId: input.plantId || null,
      period: input.period || null,
      periodStart: input.periodStart || null,
      periodEnd: input.periodEnd || null,
      details: { planned, actual, unit: input.unit || null }
    }
  };
}
