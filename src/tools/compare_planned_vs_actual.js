// src/tools/compare_planned_vs_actual.js
// Objetivos vs ejecucion (gap analysis y Revision por Direccion). isoEvent: "production_variance_report".

const CALCULATION_VERSION = '1.0.0'
const RULE_VERSION = '1.0.0'

const DEFAULT_THRESHOLDS = {
  deviationPercent: 5,
  criticalPercent: 15,
  plannedZeroPolicy: 'not_calculable'
}

const STATUS_RANK = {
  on_track: 0,
  deviation: 1,
  critical: 2,
  not_calculable: 3
}

const SEVERITY_BY_STATUS = {
  on_track: 'low',
  deviation: 'medium',
  critical: 'high',
  not_calculable: 'medium'
}

const REQUIRED_INPUT_FIELDS = ['organization_id', 'analysis_id', 'as_of_date', 'plant_id', 'period', 'metrics']
const REQUIRED_METRIC_FIELDS = ['metric_id', 'name', 'planned', 'actual', 'unit', 'direction']
const VALID_DIRECTIONS = new Set(['higher_is_better', 'lower_is_better', 'target'])
const VALID_PERIODS = new Set(['daily', 'weekly', 'monthly'])

export const meta = {
  id: 'compare_planned_vs_actual',
  name: 'Comparacion Plan vs Real',
  version: CALCULATION_VERSION,
  category: 'erp',
  consumes: [],
  produces: ['PRODUCTION_VARIANCE_DETECTED']
}

function valueFor (input, snakeKey, camelKey) {
  if (!input) return undefined
  return input[snakeKey] !== undefined ? input[snakeKey] : input[camelKey]
}

function numberOrDefault (value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function round (value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) / 100 : value
}

function inferPeriod (input) {
  const explicit = input.period
  if (VALID_PERIODS.has(explicit)) return explicit

  const start = valueFor(input, 'period_start', 'periodStart')
  const end = valueFor(input, 'period_end', 'periodEnd')
  const startTime = Date.parse(start)
  const endTime = Date.parse(end)
  if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && endTime >= startTime) {
    const days = Math.ceil((endTime - startTime) / 86400000) || 1
    if (days <= 1) return 'daily'
    if (days <= 7) return 'weekly'
    return 'monthly'
  }

  const asOfDate = valueFor(input, 'as_of_date', 'asOfDate')
  return Number.isNaN(Date.parse(asOfDate)) ? null : 'daily'
}

function mergeThresholds (inputThresholds = {}) {
  return {
    deviation_percent: numberOrDefault(inputThresholds.deviation_percent ?? inputThresholds.deviationPercent, DEFAULT_THRESHOLDS.deviationPercent),
    critical_percent: numberOrDefault(inputThresholds.critical_percent ?? inputThresholds.criticalPercent, DEFAULT_THRESHOLDS.criticalPercent),
    planned_zero_policy: DEFAULT_THRESHOLDS.plannedZeroPolicy
  }
}

function normalizeSource (source = {}) {
  return {
    source_system: valueFor(source, 'source_system', 'sourceSystem') || null,
    source_record_ids: valueFor(source, 'source_record_ids', 'sourceRecordIds') || [],
    source_extracted_at: valueFor(source, 'source_extracted_at', 'sourceExtractedAt') || null
  }
}

function normalizeMetric (metric = {}) {
  return {
    metric_id: valueFor(metric, 'metric_id', 'metricId'),
    name: metric.name,
    planned: metric.planned,
    actual: metric.actual,
    unit: metric.unit,
    direction: metric.direction,
    absolute_tolerance: valueFor(metric, 'absolute_tolerance', 'absoluteTolerance'),
    relative_tolerance_percent: valueFor(metric, 'relative_tolerance_percent', 'relativeTolerancePercent'),
    weight: metric.weight
  }
}

function normalizeInput (input = {}, asset = {}) {
  return {
    organization_id: valueFor(input, 'organization_id', 'organizationId'),
    tenant_id: valueFor(input, 'tenant_id', 'tenantId'),
    plant_id: valueFor(input, 'plant_id', 'plantId') || asset.plant_id || null,
    process_id: valueFor(input, 'process_id', 'processId'),
    analysis_id: valueFor(input, 'analysis_id', 'analysisId'),
    as_of_date: valueFor(input, 'as_of_date', 'asOfDate'),
    domain: input.domain || input.module || 'production',
    period: inferPeriod(input),
    period_start: valueFor(input, 'period_start', 'periodStart') || null,
    period_end: valueFor(input, 'period_end', 'periodEnd') || null,
    metrics: Array.isArray(input.metrics) ? input.metrics.map(normalizeMetric) : input.metrics,
    thresholds: input.thresholds || {},
    source: normalizeSource(input.source)
  }
}

function getMissingFields (input) {
  const missing = REQUIRED_INPUT_FIELDS.filter(field => input[field] === undefined || input[field] === null || input[field] === '')
  if (!Array.isArray(input.metrics) || input.metrics.length === 0) {
    return missing.includes('metrics') ? missing : [...missing, 'metrics']
  }
  return missing
}

function getMetricMissingFields (metric, index) {
  return REQUIRED_METRIC_FIELDS
    .filter(field => metric[field] === undefined || metric[field] === null || metric[field] === '')
    .map(field => `metrics[${index}].${field}`)
}

function classifyAdversePercent (adversePercent, thresholds) {
  if (adversePercent === null) return 'not_calculable'
  if (adversePercent <= thresholds.deviation_percent) return 'on_track'
  if (adversePercent <= thresholds.critical_percent) return 'deviation'
  return 'critical'
}

function adversePercentForDirection (planned, actual, direction) {
  const signedPercent = ((actual - planned) / Math.abs(planned)) * 100
  if (direction === 'higher_is_better') return Math.max(0, -signedPercent)
  if (direction === 'lower_is_better') return Math.max(0, signedPercent)
  return Math.abs(signedPercent)
}

function metricWeight (metric, warnings) {
  if (metric.weight === undefined) return 1
  const weight = Number(metric.weight)
  if (!Number.isFinite(weight) || weight < 0) {
    warnings.push('weight must be a non-negative finite number; defaulted to 1')
    return 1
  }
  return weight
}

function calculateMetric (metric, index, thresholds) {
  const missingFields = getMetricMissingFields(metric, index)
  const warnings = []
  const weight = metricWeight(metric, warnings)

  if (missingFields.length > 0) {
    return {
      metric_id: metric.metric_id || `metric_${index + 1}`,
      name: metric.name || `Metric ${index + 1}`,
      planned: metric.planned ?? null,
      actual: metric.actual ?? null,
      unit: metric.unit || null,
      direction: metric.direction || null,
      weight,
      variance: null,
      variance_percent: null,
      adverse_percent: null,
      status: 'not_calculable',
      reason: 'missing_required_fields',
      missing_fields: missingFields,
      warnings
    }
  }

  const planned = Number(metric.planned)
  const actual = Number(metric.actual)

  if (!Number.isFinite(planned) || !Number.isFinite(actual)) {
    return {
      metric_id: metric.metric_id,
      name: metric.name,
      planned: metric.planned,
      actual: metric.actual,
      unit: metric.unit,
      direction: metric.direction,
      weight,
      variance: null,
      variance_percent: null,
      adverse_percent: null,
      status: 'not_calculable',
      reason: 'invalid_numeric_value',
      missing_fields: [],
      warnings: [...warnings, 'planned and actual must be finite numbers']
    }
  }

  if (!VALID_DIRECTIONS.has(metric.direction)) {
    return {
      metric_id: metric.metric_id,
      name: metric.name,
      planned,
      actual,
      unit: metric.unit,
      direction: metric.direction,
      weight,
      variance: actual - planned,
      variance_percent: null,
      adverse_percent: null,
      status: 'not_calculable',
      reason: 'invalid_direction',
      missing_fields: [],
      warnings: [`invalid direction: ${metric.direction}`]
    }
  }

  if (planned === 0) {
    if (actual === 0) {
      return {
        metric_id: metric.metric_id,
        name: metric.name,
        planned,
        actual,
        unit: metric.unit,
        direction: metric.direction,
        weight,
        variance: 0,
        variance_percent: 0,
        adverse_percent: 0,
        status: 'on_track',
        reason: 'planned_and_actual_zero',
        missing_fields: [],
        warnings: ['planned is zero; treated as on_track because actual is also zero']
      }
    }

    return {
      metric_id: metric.metric_id,
      name: metric.name,
      planned,
      actual,
      unit: metric.unit,
      direction: metric.direction,
      weight,
      variance: actual - planned,
      variance_percent: null,
      adverse_percent: null,
      status: 'not_calculable',
      reason: 'planned_zero_actual_nonzero',
      missing_fields: [],
      warnings: ['planned is zero and actual is non-zero; relative variance is not calculable in v1']
    }
  }

  const variance = actual - planned
  const variancePercent = (variance / Math.abs(planned)) * 100
  const adversePercent = adversePercentForDirection(planned, actual, metric.direction)
  let status = classifyAdversePercent(adversePercent, thresholds)

  if (typeof metric.absolute_tolerance === 'number' && Math.abs(variance) <= metric.absolute_tolerance) {
    status = 'on_track'
  }

  if (typeof metric.relative_tolerance_percent === 'number' && adversePercent <= metric.relative_tolerance_percent) {
    status = 'on_track'
  }

  return {
    metric_id: metric.metric_id,
    name: metric.name,
    planned,
    actual,
    unit: metric.unit,
    direction: metric.direction,
    weight,
    variance,
    variance_percent: round(variancePercent),
    adverse_percent: round(adversePercent),
    status,
    reason: status === 'on_track' ? 'within_threshold' : 'threshold_exceeded',
    missing_fields: [],
    warnings
  }
}

function worstStatus (statuses) {
  return statuses.reduce((worst, status) => STATUS_RANK[status] > STATUS_RANK[worst] ? status : worst, 'on_track')
}

function weightedDeviationPercent (metrics, warnings) {
  const calculableMetrics = metrics.filter(metric => typeof metric.adverse_percent === 'number')
  const weightedMetrics = calculableMetrics.filter(metric => metric.weight > 0)
  if (calculableMetrics.length === 0) return 0
  if (weightedMetrics.length === 0) {
    warnings.push('weighted deviation could not be calculated because total weight is zero')
    return null
  }
  const totalWeight = weightedMetrics.reduce((total, metric) => total + metric.weight, 0)
  const weightedTotal = weightedMetrics.reduce((total, metric) => total + (metric.adverse_percent * metric.weight), 0)
  return round(weightedTotal / totalWeight)
}

function recommendedActionsFor (status) {
  if (status === 'critical') return ['open_corrective_action', 'review_root_cause', 'notify_process_owner']
  if (status === 'deviation') return ['review_variance', 'confirm_data_source']
  if (status === 'not_calculable') return ['complete_required_data', 'review_input_quality']
  return ['continue_monitoring']
}

function buildAudit (input, thresholds, rationale) {
  return {
    calculation_version: CALCULATION_VERSION,
    rule_version: RULE_VERSION,
    thresholds_applied: thresholds,
    decision_rationale: rationale,
    source_system: input.source?.source_system || null,
    source_record_ids: input.source?.source_record_ids || [],
    source_extracted_at: input.source?.source_extracted_at || null,
    input_hash: null
  }
}

function buildDataQuality (missingFields, warnings) {
  return {
    confidence: missingFields.length > 0 ? 'low' : warnings.length > 0 ? 'medium' : 'high',
    missing_fields: missingFields,
    warnings
  }
}

function metricOutput (metric) {
  const output = { ...metric }
  delete output.missing_fields
  delete output.warnings
  return output
}

function metricNames (metrics) {
  return metrics.map(metric => metric.metric_id || metric.name).filter(Boolean)
}

function buildNotCalculableResult (input, thresholds, missingFields) {
  const status = 'not_calculable'
  const metrics = Array.isArray(input.metrics) ? input.metrics.map(metricOutput) : []
  return {
    analysis_type: 'planned_vs_actual',
    domain: input.domain,
    analysis_id: input.analysis_id || null,
    organization_id: input.organization_id || null,
    plant_id: input.plant_id || null,
    plantId: input.plant_id || null,
    period: input.period || null,
    period_start: input.period_start,
    period_end: input.period_end,
    metrics: metricNames(metrics),
    status,
    severity: SEVERITY_BY_STATUS[status],
    summary: 'Planned vs actual comparison could not be calculated.',
    details: { metrics },
    deviation_percent: null,
    deviationPercent: null,
    weighted_deviation_percent: null,
    recommended_actions: recommendedActionsFor(status),
    audit: buildAudit(input, thresholds, ['missing required input fields']),
    data_quality: buildDataQuality(missingFields, [])
  }
}

function buildResult (input, thresholds) {
  const missingFields = getMissingFields(input)
  if (missingFields.length > 0) return buildNotCalculableResult(input, thresholds, missingFields)

  const metrics = input.metrics.map((metric, index) => calculateMetric(metric, index, thresholds))
  const allMissingFields = metrics.flatMap(metric => metric.missing_fields)
  const allWarnings = metrics.flatMap(metric => metric.warnings)
  const status = worstStatus(metrics.map(metric => metric.status))
  const adversePercents = metrics
    .filter(metric => typeof metric.adverse_percent === 'number' && metric.status !== 'on_track')
    .map(metric => metric.adverse_percent)
  const deviationPercent = adversePercents.length > 0 ? round(Math.max(...adversePercents)) : 0
  const weightedPercent = weightedDeviationPercent(metrics, allWarnings)
  const detailedMetrics = metrics.map(metricOutput)

  return {
    analysis_type: 'planned_vs_actual',
    domain: input.domain,
    analysis_id: input.analysis_id,
    organization_id: input.organization_id,
    plant_id: input.plant_id,
    plantId: input.plant_id,
    period: input.period,
    period_start: input.period_start,
    period_end: input.period_end,
    metrics: metricNames(detailedMetrics),
    status,
    severity: SEVERITY_BY_STATUS[status],
    summary: `Planned vs actual comparison finished with status ${status}.`,
    details: { metrics: detailedMetrics },
    deviation_percent: deviationPercent,
    deviationPercent,
    weighted_deviation_percent: weightedPercent,
    recommended_actions: recommendedActionsFor(status),
    audit: buildAudit(input, thresholds, [
      `global status selected as ${status}`,
      weightedPercent === null ? 'weighted deviation could not be calculated because total weight is zero' : `weighted deviation is ${weightedPercent}`
    ]),
    data_quality: buildDataQuality(allMissingFields, allWarnings)
  }
}

export function handler (event) {
  const input = normalizeInput(event.data || {}, event.asset || {})
  const thresholds = mergeThresholds(input.thresholds)
  const result = buildResult(input, thresholds)

  return {
    event: {
      type: 'PRODUCTION_VARIANCE_DETECTED',
      category: meta.category,
      severity: result.severity
    },
    asset: event.asset,
    data: result
  }
}
