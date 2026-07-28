// src/tools/generate_kpis.js
// Dashboard de indicadores para Revision por Direccion (ISO 9.3). isoEvent: "kpi_report_generated".

export const meta = {
  id: 'generate_kpis',
  name: 'Generacion de KPIs',
  version: '1.0.0',
  category: 'system',
  consumes: ['PRODUCTION_VARIANCE_DETECTED', 'BUSINESS_ANOMALY_DETECTED'],
  produces: ['KPI_REPORT_GENERATED']
}

function valueFor (input, snakeKey, camelKey) {
  if (!input) return undefined
  return input[snakeKey] !== undefined ? input[snakeKey] : input[camelKey]
}

function normalizeKpis (input) {
  if (Array.isArray(input.kpis)) return input.kpis

  if (input.kpis && typeof input.kpis === 'object') {
    return Object.entries(input.kpis).map(([name, value]) => ({
      name,
      value,
      unit: 'ratio',
      trend: 'stable'
    }))
  }

  const detailsMetrics = Array.isArray(input.details?.metrics) ? input.details.metrics : []
  if (detailsMetrics.length > 0) {
    return detailsMetrics.map(metric => ({
      name: metric.metric_id || metric.name,
      value: typeof metric.adverse_percent === 'number' ? metric.adverse_percent : metric.variance_percent,
      unit: metric.unit || 'percent',
      trend: metric.status === 'on_track' ? 'stable' : 'worsening'
    }))
  }

  return [
    { name: 'oee', value: 0.78, unit: 'ratio', trend: 'stable' },
    { name: 'fpy', value: 0.94, unit: 'ratio', trend: 'stable' },
    { name: 'scrapRate', value: 4.8, unit: 'percent', trend: 'worsening' },
    { name: 'onTimeDelivery', value: 0.91, unit: 'ratio', trend: 'stable' }
  ]
}

function projectFields (input) {
  const fields = {}
  const keys = [
    ['organization_id', 'organizationId'],
    ['project_id', 'projectId'],
    ['project_name', 'projectName'],
    ['as_of_date', 'asOfDate'],
    ['planned_start_date', 'plannedStartDate'],
    ['planned_end_date', 'plannedEndDate'],
    ['planned_progress_percent', 'plannedProgressPercent'],
    ['actual_progress_percent', 'actualProgressPercent'],
    ['target_type', 'targetType'],
    ['target_ids', 'targetIds']
  ]

  for (const [snakeKey, camelKey] of keys) {
    const value = valueFor(input, snakeKey, camelKey)
    if (value !== undefined) {
      fields[snakeKey] = value
      fields[camelKey] = value
    }
  }

  if (input.milestones !== undefined) fields.milestones = input.milestones
  if (input.budget !== undefined) fields.budget = input.budget
  if (input.thresholds !== undefined) fields.thresholds = input.thresholds
  if (input.source !== undefined) fields.source = input.source
  return fields
}

export function handler (event) {
  const input = event.data || {}
  const plantId = valueFor(input, 'plant_id', 'plantId') || event.asset?.plant_id || 'plant_01'
  const period = input.period || 'monthly'

  return {
    event: { type: 'KPI_REPORT_GENERATED', category: meta.category, severity: 'low' },
    asset: event.asset,
    data: {
      plant_id: plantId,
      plantId,
      period,
      kpis: normalizeKpis(input),
      ...projectFields(input)
    }
  }
}
