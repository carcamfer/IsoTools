import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { handler } from '../src/tools/track_project_progress.js'

const tools = JSON.parse(readFileSync('src/data/agents/tools.json', 'utf8'))
const rules = JSON.parse(readFileSync('src/data/agents/communication-rules.json', 'utf8'))
const toolEntry = tools.find(tool => tool.id === 'track_project_progress')

assert.ok(toolEntry, 'track_project_progress must be registered in tools.json')
assert.deepEqual(toolEntry.produces, ['PROJECT_AT_RISK'])
assert.deepEqual(toolEntry.consumes, ['KPI_REPORT_GENERATED'])
assert.deepEqual(toolEntry.outputSchema.properties.status.enum, ['at_risk', 'delayed'])
assert.ok(toolEntry.outputSchema.required.includes('targetType'))
assert.ok(toolEntry.outputSchema.required.includes('targetIds'))

const followupRule = rules.rules.find(rule => rule.id === 'rule-pkg-012')
assert.equal(followupRule.triggerCondition, "status == 'at_risk'")

const baseEvent = {
  asset: {
    asset_id: 'plant_01-management-line_1-project_01',
    asset_type: 'project',
    plant_id: 'plant_01'
  }
}

function run (data) {
  return handler({ ...baseEvent, data })
}

function baseInput (overrides = {}) {
  return {
    organization_id: 'ORG-001',
    project_id: 'PRJ-001',
    project_name: 'ISO 9001 rollout',
    as_of_date: '2026-07-23T12:00:00Z',
    planned_start_date: '2026-07-01T00:00:00Z',
    planned_end_date: '2026-09-30T00:00:00Z',
    planned_progress_percent: 30,
    actual_progress_percent: 28,
    ...overrides
  }
}

const onTrack = run(baseInput({
  milestones: [
    {
      milestone_id: 'MS-001',
      name: 'Initial diagnosis',
      due_date: '2026-07-15T00:00:00Z',
      completed_at: '2026-07-14T00:00:00Z',
      status: 'completed',
      critical: true
    }
  ],
  budget: {
    planned_amount: 100000,
    actual_amount: 28000,
    currency: 'MXN'
  }
}))

assert.equal(onTrack, null)

const atRisk = run(baseInput({
  project_id: 'PRJ-002',
  project_name: 'Corrective action rollout',
  planned_progress_percent: 40,
  actual_progress_percent: 36,
  milestones: [
    {
      milestone_id: 'MS-010',
      name: 'Critical workshop',
      due_date: '2026-07-15T00:00:00Z',
      status: 'pending',
      critical: true
    }
  ],
  budget: {
    planned_amount: 100000,
    actual_amount: 50000,
    currency: 'MXN'
  },
  target_type: 'order',
  target_ids: ['PRJ-002']
}))

assert.equal(atRisk.event.type, 'PROJECT_AT_RISK')
assert.equal(atRisk.event.category, 'erp')
assert.equal(atRisk.data.status, 'at_risk')
assert.equal(atRisk.data.completionPercent, 36)
assert.equal(atRisk.data.milestonesCompleted, 0)
assert.equal(atRisk.data.milestonesTotal, 1)
assert.equal(atRisk.data.budgetUsedPercent, 50)
assert.equal(atRisk.data.targetType, 'order')
assert.deepEqual(atRisk.data.targetIds, ['PRJ-002'])
assert.ok(atRisk.data.risk_reasons.includes('critical_milestone_overdue'))
assert.ok(atRisk.data.risk_reasons.includes('budget_overrun'))

const delayed = run(baseInput({
  project_id: 'PRJ-003',
  project_name: 'Delayed rollout',
  planned_progress_percent: 60,
  actual_progress_percent: 35
}))

assert.equal(delayed.event.type, 'PROJECT_AT_RISK')
assert.equal(delayed.data.status, 'delayed')
assert.equal(delayed.data.severity, 'high')
assert.deepEqual(delayed.data.targetIds, ['PRJ-003'])

const missingRequired = run({
  organization_id: 'ORG-001',
  project_id: 'PRJ-004'
})

assert.equal(missingRequired, null)

const invalidDate = run(baseInput({
  project_id: 'PRJ-005',
  as_of_date: 'invalid-date'
}))

assert.equal(invalidDate, null)

const legacyCamelInput = run({
  organizationId: 'ORG-LEGACY',
  projectId: 'PRJ-LEGACY',
  projectName: 'Legacy project payload',
  asOfDate: '2026-07-23T12:00:00Z',
  plannedStartDate: '2026-07-01T00:00:00Z',
  plannedEndDate: '2026-09-30T00:00:00Z',
  plannedProgressPercent: 40,
  actualProgressPercent: 34,
  targetType: 'supplier',
  targetIds: ['SUP-001']
})

assert.equal(legacyCamelInput.event.type, 'PROJECT_AT_RISK')
assert.equal(legacyCamelInput.data.project_id, 'PRJ-LEGACY')
assert.equal(legacyCamelInput.data.projectId, 'PRJ-LEGACY')
assert.equal(legacyCamelInput.data.status, 'at_risk')
assert.equal(legacyCamelInput.data.targetType, 'supplier')
assert.deepEqual(legacyCamelInput.data.targetIds, ['SUP-001'])

console.log('track_project_progress smoke OK')
