// src/tools/track_project_progress.js
// Plan de implementacion gestionado por hitos de clausula. isoEvent: "project_progress_update".

const CALCULATION_VERSION = '1.0.0'
const RULE_VERSION = '1.0.0'

const DEFAULT_THRESHOLDS = {
  atRiskDelayPercent: 5,
  delayedPercent: 15,
  budgetOverrunVsProgressPercent: 10
}

const STATUS_RANK = {
  on_track: 0,
  at_risk: 1,
  delayed: 2,
  not_calculable: 3
}

const SEVERITY_BY_STATUS = {
  on_track: 'low',
  at_risk: 'medium',
  delayed: 'high',
  not_calculable: 'medium'
}

const REQUIRED_INPUT_FIELDS = [
  'organization_id',
  'project_id',
  'project_name',
  'as_of_date',
  'planned_start_date',
  'planned_end_date',
  'planned_progress_percent',
  'actual_progress_percent'
]

const VALID_TARGET_TYPES = new Set(['lead', 'supplier', 'order'])

export const meta = {
  id: 'track_project_progress',
  name: 'Seguimiento de Avance de Proyecto',
  version: CALCULATION_VERSION,
  category: 'erp',
  consumes: ['KPI_REPORT_GENERATED'],
  produces: ['PROJECT_AT_RISK']
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

function mergeThresholds (inputThresholds = {}) {
  return {
    at_risk_delay_percent: numberOrDefault(inputThresholds.at_risk_delay_percent ?? inputThresholds.atRiskDelayPercent, DEFAULT_THRESHOLDS.atRiskDelayPercent),
    delayed_percent: numberOrDefault(inputThresholds.delayed_percent ?? inputThresholds.delayedPercent, DEFAULT_THRESHOLDS.delayedPercent),
    budget_overrun_vs_progress_percent: numberOrDefault(inputThresholds.budget_overrun_vs_progress_percent ?? inputThresholds.budgetOverrunVsProgressPercent, DEFAULT_THRESHOLDS.budgetOverrunVsProgressPercent)
  }
}

function normalizeSource (source = {}) {
  return {
    source_system: valueFor(source, 'source_system', 'sourceSystem') || null,
    source_record_ids: valueFor(source, 'source_record_ids', 'sourceRecordIds') || [],
    source_extracted_at: valueFor(source, 'source_extracted_at', 'sourceExtractedAt') || null
  }
}

function normalizeMilestone (milestone = {}) {
  return {
    milestone_id: valueFor(milestone, 'milestone_id', 'milestoneId'),
    name: milestone.name,
    due_date: valueFor(milestone, 'due_date', 'dueDate'),
    completed_at: valueFor(milestone, 'completed_at', 'completedAt'),
    status: milestone.status,
    critical: milestone.critical === true
  }
}

function normalizeBudget (budget) {
  if (!budget) return budget
  return {
    planned_amount: valueFor(budget, 'planned_amount', 'plannedAmount'),
    actual_amount: valueFor(budget, 'actual_amount', 'actualAmount'),
    currency: budget.currency
  }
}

function normalizeInput (input = {}, asset = {}) {
  return {
    organization_id: valueFor(input, 'organization_id', 'organizationId'),
    tenant_id: valueFor(input, 'tenant_id', 'tenantId'),
    plant_id: valueFor(input, 'plant_id', 'plantId') || asset.plant_id || null,
    project_id: valueFor(input, 'project_id', 'projectId'),
    project_name: valueFor(input, 'project_name', 'projectName'),
    as_of_date: valueFor(input, 'as_of_date', 'asOfDate'),
    planned_start_date: valueFor(input, 'planned_start_date', 'plannedStartDate'),
    planned_end_date: valueFor(input, 'planned_end_date', 'plannedEndDate'),
    planned_progress_percent: valueFor(input, 'planned_progress_percent', 'plannedProgressPercent'),
    actual_progress_percent: valueFor(input, 'actual_progress_percent', 'actualProgressPercent'),
    milestones: Array.isArray(input.milestones) ? input.milestones.map(normalizeMilestone) : input.milestones,
    budget: normalizeBudget(input.budget),
    target_type: valueFor(input, 'target_type', 'targetType'),
    target_ids: valueFor(input, 'target_ids', 'targetIds'),
    thresholds: input.thresholds || {},
    source: normalizeSource(input.source)
  }
}

function isValidDate (value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function getMissingFields (input) {
  return REQUIRED_INPUT_FIELDS.filter(field => input[field] === undefined || input[field] === null || input[field] === '')
}

function getValidationWarnings (input) {
  const warnings = []
  for (const field of ['as_of_date', 'planned_start_date', 'planned_end_date']) {
    if (input[field] !== undefined && !isValidDate(input[field])) warnings.push(`${field} must be ISO 8601`)
  }
  for (const field of ['planned_progress_percent', 'actual_progress_percent']) {
    const value = input[field]
    if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
      warnings.push(`${field} must be between 0 and 100`)
    }
  }
  if (isValidDate(input.planned_start_date) && isValidDate(input.planned_end_date) && Date.parse(input.planned_start_date) >= Date.parse(input.planned_end_date)) {
    warnings.push('planned_start_date must be before planned_end_date')
  }
  return warnings
}

function classifySchedule (scheduleVariancePercent, thresholds) {
  if (scheduleVariancePercent <= thresholds.at_risk_delay_percent) return 'on_track'
  if (scheduleVariancePercent <= thresholds.delayed_percent) return 'at_risk'
  return 'delayed'
}

function evaluateMilestones (milestones = [], asOfDate) {
  const asOf = Date.parse(asOfDate)
  const summary = {
    total: milestones.length,
    completed: 0,
    pending: 0,
    overdue: 0,
    critical_overdue: 0,
    blocked: 0
  }

  for (const milestone of milestones) {
    if (milestone.status === 'completed') summary.completed += 1
    if (milestone.status === 'pending' || milestone.status === 'blocked') summary.pending += 1
    if (milestone.status === 'blocked') summary.blocked += 1

    const dueDate = Date.parse(milestone.due_date)
    const isOpen = milestone.status !== 'completed' && milestone.status !== 'cancelled'
    if (isOpen && !Number.isNaN(dueDate) && dueDate < asOf) {
      summary.overdue += 1
      if (milestone.critical) summary.critical_overdue += 1
    }
  }

  return summary
}

function calculateBudgetUsedPercent (budget, warnings) {
  if (!budget) return null
  const plannedAmount = Number(budget.planned_amount)
  const actualAmount = Number(budget.actual_amount)
  if (!Number.isFinite(plannedAmount) || !Number.isFinite(actualAmount) || plannedAmount <= 0) {
    warnings.push('budget requires planned_amount > 0 and numeric actual_amount')
    return null
  }
  return round((actualAmount / plannedAmount) * 100)
}

function calculateTimelineElapsedPercent (input) {
  const start = Date.parse(input.planned_start_date)
  const end = Date.parse(input.planned_end_date)
  const asOf = Date.parse(input.as_of_date)
  const elapsed = ((asOf - start) / (end - start)) * 100
  return round(Math.min(100, Math.max(0, elapsed)))
}

function elevateStatus (current, candidate) {
  return STATUS_RANK[candidate] > STATUS_RANK[current] ? candidate : current
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

function recommendedActionsFor (status) {
  if (status === 'delayed') return ['escalate_project_review', 'open_recovery_plan', 'notify_project_owner']
  if (status === 'at_risk') return ['review_project_risk', 'confirm_milestone_plan']
  if (status === 'not_calculable') return ['complete_required_data', 'review_input_quality']
  return ['continue_monitoring']
}

function buildFollowupTarget (input) {
  const targetType = VALID_TARGET_TYPES.has(input.target_type) ? input.target_type : 'order'
  const targetIds = Array.isArray(input.target_ids) && input.target_ids.length > 0
    ? input.target_ids.filter(Boolean)
    : [input.project_id].filter(Boolean)

  return {
    targetType,
    targetIds,
    target_type: targetType,
    target_ids: targetIds
  }
}

function buildNotCalculableResult (input, thresholds, missingFields, warnings) {
  const status = 'not_calculable'
  return {
    project_id: input.project_id || null,
    projectId: input.project_id || null,
    organization_id: input.organization_id || null,
    status,
    severity: SEVERITY_BY_STATUS[status],
    summary: 'Project progress could not be calculated.',
    completionPercent: null,
    milestonesCompleted: 0,
    milestonesTotal: 0,
    budgetUsedPercent: null,
    schedule_variance_percent: null,
    timeline_elapsed_percent: null,
    budget_used_percent: null,
    risk_reasons: ['missing_evidence'],
    milestone_summary: { total: 0, completed: 0, pending: 0, overdue: 0, critical_overdue: 0, blocked: 0 },
    recommended_actions: recommendedActionsFor(status),
    audit: buildAudit(input, thresholds, ['missing or invalid required input fields']),
    data_quality: buildDataQuality(missingFields, warnings)
  }
}

function buildResult (input, thresholds) {
  const missingFields = getMissingFields(input)
  const warnings = getValidationWarnings(input)

  if (missingFields.length > 0 || warnings.some(warning => warning.includes('must be'))) {
    return buildNotCalculableResult(input, thresholds, missingFields, warnings)
  }

  const plannedProgressPercent = Number(input.planned_progress_percent)
  const actualProgressPercent = Number(input.actual_progress_percent)
  const scheduleVariancePercent = round(Math.max(0, plannedProgressPercent - actualProgressPercent))
  const timelineElapsedPercent = calculateTimelineElapsedPercent(input)
  const riskReasons = []
  const rationale = [
    `schedule variance is ${scheduleVariancePercent} percentage points`,
    `planned timeline elapsed is ${timelineElapsedPercent} percent`
  ]
  let status = classifySchedule(scheduleVariancePercent, thresholds)

  if (status !== 'on_track') riskReasons.push('schedule_variance')

  const milestones = Array.isArray(input.milestones) ? input.milestones : []
  const milestoneSummary = evaluateMilestones(milestones, input.as_of_date)

  if (milestoneSummary.critical_overdue > 0) {
    riskReasons.push('critical_milestone_overdue')
    status = elevateStatus(status, 'at_risk')
    rationale.push('critical milestone overdue')
  }

  if (milestoneSummary.blocked > 0) {
    riskReasons.push('blocked_milestone')
    status = elevateStatus(status, 'at_risk')
    rationale.push('blocked milestone present')
  }

  const budgetWarnings = []
  const budgetUsedPercent = calculateBudgetUsedPercent(input.budget, budgetWarnings)
  warnings.push(...budgetWarnings)

  if (budgetUsedPercent !== null && budgetUsedPercent > actualProgressPercent + thresholds.budget_overrun_vs_progress_percent) {
    riskReasons.push('budget_overrun')
    status = elevateStatus(status, 'at_risk')
    rationale.push('budget usage exceeds actual progress tolerance')
  }

  if (milestoneSummary.critical_overdue > 0 && scheduleVariancePercent > thresholds.at_risk_delay_percent) {
    status = elevateStatus(status, 'delayed')
    rationale.push('critical overdue milestone with schedule variance above at-risk threshold')
  }

  return {
    project_id: input.project_id,
    projectId: input.project_id,
    organization_id: input.organization_id,
    status,
    severity: SEVERITY_BY_STATUS[status],
    summary: `Project progress finished with status ${status}.`,
    completionPercent: actualProgressPercent,
    milestonesCompleted: milestoneSummary.completed,
    milestonesTotal: milestoneSummary.total,
    budgetUsedPercent,
    schedule_variance_percent: scheduleVariancePercent,
    timeline_elapsed_percent: timelineElapsedPercent,
    budget_used_percent: budgetUsedPercent,
    risk_reasons: [...new Set(riskReasons)],
    milestone_summary: milestoneSummary,
    recommended_actions: recommendedActionsFor(status),
    audit: buildAudit(input, thresholds, rationale),
    data_quality: buildDataQuality([], warnings),
    ...buildFollowupTarget(input)
  }
}

export function handler (event) {
  const input = normalizeInput(event.data || {}, event.asset || {})
  const thresholds = mergeThresholds(input.thresholds)
  const result = buildResult(input, thresholds)

  if (result.status === 'on_track' || result.status === 'not_calculable') return null

  return {
    event: {
      type: 'PROJECT_AT_RISK',
      category: meta.category,
      severity: result.severity
    },
    asset: event.asset,
    data: result
  }
}
