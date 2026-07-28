import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { handler } from '../src/tools/compare_planned_vs_actual.js'

const tools = JSON.parse(readFileSync('src/data/agents/tools.json', 'utf8'))
const rules = JSON.parse(readFileSync('src/data/agents/communication-rules.json', 'utf8'))
const toolEntry = tools.find(tool => tool.id === 'compare_planned_vs_actual')

assert.ok(toolEntry, 'compare_planned_vs_actual must be registered in tools.json')
assert.deepEqual(toolEntry.produces, ['PRODUCTION_VARIANCE_DETECTED'])
assert.deepEqual(toolEntry.consumes, [])
assert.ok(toolEntry.outputSchema.properties.status.enum.includes('not_calculable'))
assert.equal(toolEntry.outputSchema.properties.details.type, 'object')

const kpiRule = rules.rules.find(rule => rule.id === 'rule-pkg-008')
const anomalyRule = rules.rules.find(rule => rule.id === 'rule-pkg-009')
assert.equal(kpiRule.triggerCondition, "status != 'not_calculable'")
assert.equal(anomalyRule.triggerCondition, "status IN ['deviation','critical']")

const baseEvent = {
  asset: {
    asset_id: 'plant_01-assembly-line_1-production_line_01',
    asset_type: 'production_line',
    plant_id: 'plant_01'
  }
}

function run (data) {
  return handler({ ...baseEvent, data })
}

function runWithoutAsset (data) {
  return handler({ data })
}

function baseInput (overrides = {}) {
  return {
    organization_id: 'ORG-001',
    analysis_id: 'AN-001',
    as_of_date: '2026-07-23T12:00:00Z',
    domain: 'production',
    period: 'monthly',
    ...overrides
  }
}

const onTrack = run(baseInput({
  metrics: [
    {
      metric_id: 'OEE',
      name: 'Overall Equipment Effectiveness',
      planned: 85,
      actual: 84,
      unit: 'percent',
      direction: 'higher_is_better'
    }
  ]
}))

assert.equal(onTrack.event.type, 'PRODUCTION_VARIANCE_DETECTED')
assert.equal(onTrack.event.category, 'erp')
assert.equal(onTrack.data.status, 'on_track')
assert.equal(onTrack.data.severity, 'low')
assert.equal(onTrack.data.plant_id, 'plant_01')
assert.equal(onTrack.data.deviation_percent, 0)
assert.equal(onTrack.data.details.metrics[0].adverse_percent, 1.18)
assert.deepEqual(onTrack.data.metrics, ['OEE'])

const deviation = run(baseInput({
  analysis_id: 'AN-002',
  metrics: [
    {
      metric_id: 'TEMP',
      name: 'Process temperature',
      planned: 100,
      actual: 110,
      unit: 'celsius',
      direction: 'target'
    }
  ]
}))

assert.equal(deviation.data.status, 'deviation')
assert.equal(deviation.data.details.metrics[0].variance_percent, 10)

const critical = run(baseInput({
  analysis_id: 'AN-003',
  metrics: [
    {
      metric_id: 'SCRAP',
      name: 'Scrap rate',
      planned: 2,
      actual: 3,
      unit: 'percent',
      direction: 'lower_is_better'
    }
  ]
}))

assert.equal(critical.data.status, 'critical')
assert.equal(critical.event.severity, 'high')
assert.equal(critical.data.details.metrics[0].adverse_percent, 50)

const plannedZero = run(baseInput({
  analysis_id: 'AN-004',
  metrics: [
    {
      metric_id: 'REWORK',
      name: 'Rework',
      planned: 0,
      actual: 5,
      unit: 'items',
      direction: 'lower_is_better'
    }
  ]
}))

assert.equal(plannedZero.data.status, 'not_calculable')
assert.equal(plannedZero.data.details.metrics[0].reason, 'planned_zero_actual_nonzero')
assert.equal(plannedZero.data.deviation_percent, 0)

const absoluteTolerance = run(baseInput({
  analysis_id: 'AN-005',
  metrics: [
    {
      metric_id: 'COUNT',
      name: 'Production count',
      planned: 100,
      actual: 106,
      unit: 'items',
      direction: 'target',
      absolute_tolerance: 10
    }
  ]
}))

assert.equal(absoluteTolerance.data.status, 'on_track')

const relativeTolerance = run(baseInput({
  analysis_id: 'AN-006',
  metrics: [
    {
      metric_id: 'CYCLE',
      name: 'Cycle time',
      planned: 100,
      actual: 108,
      unit: 'seconds',
      direction: 'lower_is_better',
      relative_tolerance_percent: 10
    }
  ]
}))

assert.equal(relativeTolerance.data.status, 'on_track')

const missingMetrics = run({
  module: 'production',
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  plantId: 'plant_legacy'
})

assert.equal(missingMetrics.data.status, 'not_calculable')
assert.equal(missingMetrics.data.plant_id, 'plant_legacy')
assert.ok(missingMetrics.data.data_quality.missing_fields.includes('metrics'))
assert.equal(missingMetrics.data.period, 'monthly')

const legacyCamelInput = run({
  organizationId: 'ORG-LEGACY',
  analysisId: 'AN-LEGACY',
  asOfDate: '2026-07-23T12:00:00Z',
  plantId: 'plant_legacy',
  metrics: [
    {
      metricId: 'OEE',
      name: 'Overall Equipment Effectiveness',
      planned: 85,
      actual: 84,
      unit: 'percent',
      direction: 'higher_is_better'
    }
  ]
})

assert.equal(legacyCamelInput.data.organization_id, 'ORG-LEGACY')
assert.equal(legacyCamelInput.data.analysis_id, 'AN-LEGACY')
assert.equal(legacyCamelInput.data.plant_id, 'plant_legacy')
assert.equal(legacyCamelInput.data.period, 'daily')
assert.deepEqual(legacyCamelInput.data.metrics, ['OEE'])

const missingPlant = runWithoutAsset(baseInput({
  analysis_id: 'AN-007',
  metrics: [
    {
      metric_id: 'OEE',
      name: 'Overall Equipment Effectiveness',
      planned: 85,
      actual: 84,
      unit: 'percent',
      direction: 'higher_is_better'
    }
  ]
}))

assert.equal(missingPlant.data.status, 'not_calculable')
assert.ok(missingPlant.data.data_quality.missing_fields.includes('plant_id'))

console.log('compare_planned_vs_actual smoke OK')
