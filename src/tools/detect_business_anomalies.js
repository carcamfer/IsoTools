// src/tools/detect_business_anomalies.js
// Procesos con variabilidad inexplicada (diagnostico y mejora). isoEvent: "business_anomaly_detected".

export const meta = {
  id: 'detect_business_anomalies',
  name: 'Deteccion de Anomalias de Negocio',
  version: '1.0.0',
  category: 'productivity',
  consumes: ['FORECAST_READY', 'PRODUCTION_VARIANCE_DETECTED'],
  produces: ['BUSINESS_ANOMALY_DETECTED']
}

function valueFor (input, snakeKey, camelKey) {
  if (!input) return undefined
  return input[snakeKey] !== undefined ? input[snakeKey] : input[camelKey]
}

function anomalyFromMetric (metric) {
  const observed = metric.actual ?? metric.adverse_percent ?? metric.variance_percent
  const expected = metric.planned ?? 0
  return {
    metric: metric.metric_id || metric.name || 'unknown_metric',
    expected,
    observed,
    unit: metric.unit || 'n/a',
    status: metric.status || 'unknown'
  }
}

export function handler (event) {
  const input = event.data || {}
  const detailMetrics = Array.isArray(input.details?.metrics) ? input.details.metrics : []
  const anomalies = detailMetrics
    .filter(metric => metric.status === 'deviation' || metric.status === 'critical')
    .map(anomalyFromMetric)

  return {
    event: { type: 'BUSINESS_ANOMALY_DETECTED', category: meta.category, severity: anomalies.length > 0 ? 'medium' : 'low' },
    asset: event.asset,
    data: {
      anomalies,
      criticalCount: anomalies.filter(anomaly => anomaly.status === 'critical').length,
      plantId: valueFor(input, 'plant_id', 'plantId') || event.asset?.plant_id || 'plant_01',
      period: input.period || 'monthly',
      source: input.domain || input.module || 'production'
    }
  }
}
