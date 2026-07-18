import { flattenQuestions } from '../../core/document-elements'
import { analyseSurvey, type StaticIssue } from '../../core/logic/analyzer'
import { canUseQuestionAsRuleSource } from '../../core/logic/rule-capabilities'
import {
  EDITABLE_RULE_ACTION_TYPES,
  getAutoRuleName,
  getAvailableRuleActionTypes,
  getRuleSourceQuestionIds,
  getRuleTargetQuestionIds,
  normalizeRuleAction,
  resolveRuleSourceId,
} from '../../core/logic/rule-constraints'
import {
  createEmptyRule,
  createRuleAction,
  normalizeRulePriorities,
} from '../../core/logic/rule-utils'
import type {
  QuestionElement,
  Rule,
  RuleAction,
  RuleActionType,
  RuleCondition,
  SurveyDocument,
} from '../../core/types'
import { getQuestionReferenceLabel } from '../../core/question-numbering'

export interface RuleDraft {
  kind: 'create' | 'edit'
  original: Rule | null
  value: Rule
}

export type RuleDraftRequest =
  | { type: 'new' }
  | { type: 'existing'; ruleId: string }

export type BeginRuleDraftResult =
  | 'started'
  | 'confirmation-required'
  | 'not-found'

export type RuleDraftChange =
  | { type: 'condition'; condition: RuleCondition }
  | { type: 'action-type'; actionType: RuleActionType }
  | { type: 'action'; action: RuleAction }
  | { type: 'name'; name: string }
  | { type: 'enabled'; enabled: boolean }

export interface RuleDraftModel {
  rule: Rule
  action: RuleAction
  sourceId?: string
  allowedSourceIds: string[]
  availableActionTypes: RuleActionType[]
  targetQuestionIds: string[]
  defaultTargetId?: string
  generatedName: string
}

function cloneRule(rule: Rule): Rule {
  return {
    ...rule,
    condition: { ...rule.condition },
    action: { ...rule.action },
  }
}

function getTargetLabel(
  document: SurveyDocument,
  questions: QuestionElement[],
  target?: string
) {
  const question = target
    ? questions.find((item) => item.id === target)
    : undefined
  return question ? getQuestionReferenceLabel(question, document) : undefined
}

function createDefaultRule(document: SurveyDocument): Rule {
  const questions = flattenQuestions(document)
  const rule = createEmptyRule(document.rules.length)
  const source = questions.find((question, index) => {
    return (
      canUseQuestionAsRuleSource(question) &&
      questions.some((_, targetIndex) => targetIndex > index)
    )
  })

  if (!source) return rule

  const sourceIndex = questions.findIndex(
    (question) => question.id === source.id
  )
  const target = questions[sourceIndex + 1]
  rule.condition = { questionId: source.id, operator: 'not_empty' }
  rule.action = target
    ? createRuleAction('show', target.id)
    : createRuleAction('end')
  rule.name = getAutoRuleName(
    rule.action.type,
    getTargetLabel(document, questions, rule.action.target)
  )
  return rule
}

export function beginRuleDraft(
  document: SurveyDocument,
  request: RuleDraftRequest
): RuleDraft | null {
  if (request.type === 'new') {
    return {
      kind: 'create',
      original: null,
      value: createDefaultRule(document),
    }
  }

  const rule = document.rules.find((item) => item.id === request.ruleId)
  if (!rule) return null
  return {
    kind: 'edit',
    original: cloneRule(rule),
    value: cloneRule(rule),
  }
}

export function deriveRuleDraftModel(
  document: SurveyDocument,
  draft: RuleDraft,
  requestedActionTypes: readonly RuleActionType[] = EDITABLE_RULE_ACTION_TYPES
): RuleDraftModel {
  const questions = flattenQuestions(document)
  const rule = draft.value
  const allowedSourceIds = getRuleSourceQuestionIds(questions)
  const sourceId = resolveRuleSourceId(
    rule.condition,
    allowedSourceIds,
    allowedSourceIds[0]
  )
  const available = getAvailableRuleActionTypes({
    requestedTypes: requestedActionTypes,
    sourceId,
    questions,
    rules: document.rules,
    currentRuleId: rule.id,
    condition: rule.condition,
  })
  const availableActionTypes: RuleActionType[] =
    available.length > 0 ? available : ['end']
  const selectedType = availableActionTypes.includes(rule.action.type)
    ? rule.action.type
    : availableActionTypes[0]
  const targetQuestionIds = getRuleTargetQuestionIds({
    type: selectedType,
    sourceId,
    questions,
    rules: document.rules,
    currentRuleId: rule.id,
    condition: rule.condition,
  })
  const action = normalizeRuleAction({
    action: rule.action,
    requestedType: selectedType,
    requestedTarget: rule.action.target,
    fallbackTypes: requestedActionTypes,
    sourceId,
    questions,
    rules: document.rules,
    currentRuleId: rule.id,
    condition: rule.condition,
  })
  const generatedName = getAutoRuleName(
    action.type,
    getTargetLabel(document, questions, action.target)
  )

  return {
    rule,
    action,
    sourceId,
    allowedSourceIds,
    availableActionTypes,
    targetQuestionIds,
    defaultTargetId: action.target ?? targetQuestionIds[0],
    generatedName,
  }
}

function resolveRuleName(
  document: SurveyDocument,
  draft: RuleDraft,
  currentModel: RuleDraftModel,
  nextAction: RuleAction
) {
  const currentName = draft.value.name.trim()
  if (
    currentName &&
    currentName !== '新规则' &&
    currentName !== currentModel.generatedName
  ) {
    return draft.value.name
  }

  return getAutoRuleName(
    nextAction.type,
    getTargetLabel(document, flattenQuestions(document), nextAction.target)
  )
}

export function changeRuleDraft(
  document: SurveyDocument,
  draft: RuleDraft,
  change: RuleDraftChange,
  requestedActionTypes: readonly RuleActionType[] = EDITABLE_RULE_ACTION_TYPES
): RuleDraft {
  const currentModel = deriveRuleDraftModel(
    document,
    draft,
    requestedActionTypes
  )

  if (change.type === 'name') {
    return { ...draft, value: { ...draft.value, name: change.name } }
  }
  if (change.type === 'enabled') {
    return { ...draft, value: { ...draft.value, enabled: change.enabled } }
  }

  const questions = flattenQuestions(document)
  let condition = draft.value.condition
  let requestedType = currentModel.action.type
  let requestedTarget = currentModel.action.target
  let baseAction = currentModel.action

  if (change.type === 'condition') {
    condition = change.condition
  } else if (change.type === 'action-type') {
    requestedType = change.actionType
  } else {
    requestedType = change.action.type
    requestedTarget = change.action.target
    baseAction = change.action
  }

  const requestedSourceId = condition.questionId
  const sourceId =
    requestedSourceId &&
    currentModel.allowedSourceIds.includes(requestedSourceId)
      ? requestedSourceId
      : currentModel.allowedSourceIds[0]
  const nextAction = normalizeRuleAction({
    action: baseAction,
    requestedType,
    requestedTarget,
    fallbackTypes: requestedActionTypes,
    sourceId,
    questions,
    rules: document.rules,
    currentRuleId: draft.value.id,
    condition,
  })

  return {
    ...draft,
    value: {
      ...draft.value,
      condition,
      action: nextAction,
      name: resolveRuleName(document, draft, currentModel, nextAction),
    },
  }
}

export function hasRuleDraftChanges(draft: RuleDraft | null): boolean {
  if (!draft) return false
  if (!draft.original) return true
  return JSON.stringify(draft.original) !== JSON.stringify(draft.value)
}

export function buildRuleDraftPreviewDocument(
  document: SurveyDocument,
  draft: RuleDraft
): SurveyDocument {
  const existingIndex = document.rules.findIndex(
    (rule) => rule.id === draft.value.id
  )
  const rules = [...document.rules]
  if (existingIndex === -1) rules.push(cloneRule(draft.value))
  else rules[existingIndex] = cloneRule(draft.value)
  return { ...document, rules }
}

export function getRuleDraftIssues(
  document: SurveyDocument,
  draft: RuleDraft
): StaticIssue[] {
  const preview = buildRuleDraftPreviewDocument(document, draft)
  return analyseSurvey(preview).filter((issue) => {
    if (issue.ruleId === draft.value.id) return true
    return (
      issue.code === 'visibility_conflict' &&
      issue.targetId === draft.value.action.target
    )
  })
}

export function applyRuleDraft(rules: Rule[], draft: RuleDraft): Rule[] {
  const next = [...rules]
  const existingIndex = next.findIndex((rule) => rule.id === draft.value.id)
  if (existingIndex === -1) next.push(cloneRule(draft.value))
  else next[existingIndex] = cloneRule(draft.value)
  return normalizeRulePriorities(next)
}
