// src/tools/generate_kpis.js
// Dashboard de indicadores para Revisión por Dirección (ISO 9.3). isoEvent: "kpi_report_generated".
export const meta = {
  id: 'generate_kpis',
  name: 'Generación de KPIs',
  version: '1.0.0',
  category: 'system',
  consumes: ['PRODUCTION_VARIANCE_DETECTED', 'BUSINESS_ANOMALY_DETECTED'],
  produces: ['KPI_REPORT_GENERATED']
};

function normalizePeriod (period) {
  return ['daily', 'weekly', 'monthly'].includes(period) ? period : 'monthly';
}

export function handler (event) {
  const input = event.data || {};
  const plantId = input.plantId || event.asset?.plantId || event.asset?.plant_id || 'plant_01';
  const period = normalizePeriod(input.period);

  // baseline KPIs
  let oee = 0.85;
  let scrapRate = 1.2; // %
  let onTimeDelivery = 0.95;
  let costPerUnit = 12.5;

  // react to PRODUCTION_VARIANCE_DETECTED
  if (event.event && event.event.type === 'PRODUCTION_VARIANCE_DETECTED' && typeof input.deviationPercent === 'number') {
    const dev = input.deviationPercent;
    // degrade OEE proportionally to deviation (simple linear heuristic)
    oee = Math.max(0, oee * (1 - Math.abs(dev) / 100 * 0.5));
    scrapRate = Math.min(100, scrapRate * (1 + Math.abs(dev) / 100 * 1.5));
  }

  // react to BUSINESS_ANOMALY_DETECTED
  if (event.event && event.event.type === 'BUSINESS_ANOMALY_DETECTED' && Array.isArray(input.anomalies)) {
    for (const a of input.anomalies) {
      if (a.metric === 'scrap_rate' && typeof a.observed === 'number') scrapRate = a.observed;
      if (a.metric === 'production_efficiency' && typeof a.observed === 'number') oee = Math.max(0, Math.min(1, a.observed/100));
      if (a.metric === 'downtime' && typeof a.observed === 'number') costPerUnit = costPerUnit * (1 + a.observed/1000);
    }
  }

  const kpis = [
    { name: 'OEE', value: Number((oee).toFixed(3)), unit: '', trend: oee >= 0.8 ? 'up' : (oee >= 0.6 ? 'stable' : 'down') },
    { name: 'Scrap Rate', value: Number((scrapRate).toFixed(2)), unit: '%', trend: scrapRate <= 2 ? 'down' : 'up' },
    { name: 'On Time Delivery', value: Number((onTimeDelivery).toFixed(3)), unit: '', trend: onTimeDelivery >= 0.95 ? 'up' : 'down' },
    { name: 'Cost Per Unit', value: Number((costPerUnit).toFixed(2)), unit: 'USD', trend: costPerUnit <= 15 ? 'stable' : 'up' }
  ];

  return {
    event: { type: 'KPI_REPORT_GENERATED', category: 'system', severity: 'low' },
    asset: event.asset,
    data: {
      projectId: 'PROJECT-ISO-9001',
      plantId,
      period,
      kpis
    }
  };
}
