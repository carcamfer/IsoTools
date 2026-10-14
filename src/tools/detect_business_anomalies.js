// src/tools/detect_business_anomalies.js
// Procesos con variabilidad inexplicada (diagnóstico y mejora). isoEvent: "business_anomaly_detected".
export const meta = {
  id: 'detect_business_anomalies',
  name: 'Detección de Anomalías de Negocio',
  version: '1.0.0',
  category: 'productivity',
  consumes: ['FORECAST_READY', 'PRODUCTION_VARIANCE_DETECTED'],
  produces: ['BUSINESS_ANOMALY_DETECTED']
};

const BASELINES = {
  scrap_rate: [1.0, 1.2, 1.1, 1.3, 1.0, 1.2, 1.1, 1.15, 1.05, 1.25],
  production_efficiency: [88, 87, 89, 90, 86, 88, 87, 89, 88, 90],
  energy_consumption: [120, 118, 121, 119, 122, 117, 120, 118, 121, 119],
  downtime: [10, 12, 9, 11, 10, 13, 8, 9, 11, 10],
  sales_revenue: [95000, 98500, 101000, 99000, 103500, 100500, 104000, 102000, 106000, 105000],
  gross_margin: [34.2, 35.1, 34.8, 33.9, 35.4, 34.6, 35.0, 34.3, 35.6, 34.9],
  inventory_turnover: [5.8, 6.0, 5.7, 5.9, 6.1, 5.8, 6.2, 5.9, 6.0, 6.1],
  operating_cost: [64000, 65500, 64800, 66200, 65100, 67000, 65900, 67200, 66500, 68000]
};
const DEFAULT_METRICS = ['scrap_rate', 'production_efficiency', 'energy_consumption', 'downtime'];
const METRIC_UNITS = {
  scrap_rate: '%',
  production_efficiency: '%',
  gross_margin: '%',
  sales_revenue: 'USD',
  operating_cost: 'USD',
  energy_consumption: 'kWh',
  downtime: 'hours',
  inventory_turnover: 'turns'
};

function finiteSeries (value) {
  if (Array.isArray(value)) {
    const series = value.map(Number).filter(Number.isFinite);
    return series.length ? series : null;
  }
  return typeof value === 'number' && Number.isFinite(value) ? [value] : null;
}

function normalizePeriod (period) {
  return ['daily', 'weekly', 'monthly'].includes(period) ? period : 'monthly';
}

export function handler (event) {
  const input = event.data || {};
  const sensitivityLevel = (input.sensitivityLevel || 'medium').toLowerCase();
  const thresholds = { low: 3, medium: 2, high: 1.5 };
  const zThreshold = thresholds[sensitivityLevel] || 2;
  const requestedMetrics = Array.isArray(input.metrics)
    ? input.metrics.filter(metric => typeof metric === 'string')
    : Object.keys(input.metrics || {});
  const metricNames = requestedMetrics.length ? requestedMetrics : DEFAULT_METRICS;
  const customBaselines = !Array.isArray(input.metrics) && input.metrics && typeof input.metrics === 'object'
    ? input.metrics
    : {};

  const stats = (arr) => {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sd = Math.sqrt(arr.reduce((s, x) => s + Math.pow(x - m, 2), 0) / (arr.length - 1 || 1));
    return { mean: m, sd };
  };

  const anomalies = [];
  const nowPeriod = normalizePeriod(input.period);
  const plantId = input.plantId || event.asset?.plantId || event.asset?.plant_id || 'plant_01';

  const varianceMetric = input.metric || metricNames[0];
  if (event.event?.type === 'PRODUCTION_VARIANCE_DETECTED' && typeof input.deviationPercent === 'number') {
    const metric = varianceMetric;
    const series = finiteSeries(customBaselines[metric]) || BASELINES[metric] || BASELINES.scrap_rate;
    const s = stats(series);
    const expected = s.mean;
    const observed = expected * (1 + (input.deviationPercent / 100));
    const zScore = s.sd ? (observed - expected) / s.sd : 0;
    const severity = Math.abs(zScore) >= zThreshold ? 'critical' : 'informative';
    anomalies.push({ metric, expected, observed, unit: input.unit || METRIC_UNITS[metric] || 'units', zScore: Number(zScore.toFixed(3)), severity });
  } else {
    for (const metric of metricNames) {
      const series = finiteSeries(customBaselines[metric]) || BASELINES[metric] || BASELINES.scrap_rate;
      const s = stats(series);
      const last = series[series.length - 1];
      const observed = Number.isFinite(input[metric]) ? input[metric] : last;
      const z = s.sd ? (observed - s.mean) / s.sd : 0;
      const severity = Math.abs(z) >= zThreshold ? 'critical' : (Math.abs(z) >= (zThreshold / 1.5) ? 'informative' : 'none');
      if (severity !== 'none') {
        anomalies.push({ metric, expected: s.mean, observed, unit: METRIC_UNITS[metric] || 'units', zScore: Number(z.toFixed(3)), severity });
      }
    }
  }

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;

  return {
    event: { type: 'BUSINESS_ANOMALY_DETECTED', category: 'productivity', severity: criticalCount>0 ? 'high' : 'low' },
    asset: event.asset,
    data: {
      anomalies,
      criticalCount,
      plantId,
      period: nowPeriod
    }
  };
}
