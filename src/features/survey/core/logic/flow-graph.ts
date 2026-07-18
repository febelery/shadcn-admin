import {
  buildQuestionDisplayOrdinalMap,
  buildQuestionOrdinalMap,
  getQuestionNumberLabel,
  getSurveyDefaultNumberingStyle,
  isQuestionNumberVisible,
} from '../question-numbering'
import type {
  QuestionElement,
  QuestionType,
  Rule,
  RuleCondition,
  SurveyDocument,
} from '../types'
import { getConditionOperatorDefinition } from './operators'

export type FlowNodeKind = 'start' | 'end' | 'question'

export type FlowEdgeKind = 'default' | 'jump' | 'visibility' | 'end'

export interface FlowGraphNode {
  id: string
  kind: FlowNodeKind
  elementId?: string
  label: string
  /** 问卷题号文案，如 1. / 一、；未启用题号时为 null */
  numberLabel?: string | null
  questionType?: QuestionType
  hasVisibilityRules?: boolean
  hasBranchRules?: boolean
  issueCodes?: string[]
}

export interface FlowGraphEdge {
  id: string
  kind: FlowEdgeKind
  source: string
  target: string
  label?: string
  ruleId?: string
}

export interface FlowGraph {
  nodes: FlowGraphNode[]
  edges: FlowGraphEdge[]
}

export const START_ID = '__flow_start__'
const END_ID = '__flow_end__'

function nodeIdForElement(elementId: string) {
  return `el:${elementId}`
}

function truncateLabel(text: string, max = 14) {
  const cleaned = text.trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

function optionLabelForValue(
  question: QuestionElement | undefined,
  value?: string | number
) {
  const text = String(value ?? '')
  if (!question || !text) return truncateLabel(text)
  const option = question.config.options?.find((opt) => opt.id === text)
  return truncateLabel(option?.label ?? text)
}

function summarizeCondition(
  condition: RuleCondition,
  sourceQuestion?: QuestionElement
): string {
  const operator = getConditionOperatorDefinition(condition.operator).label
  if (!('value' in condition)) return operator
  const value = optionLabelForValue(sourceQuestion, condition.value)
  return `${operator} ${value}`.trim()
}

/** 从 document 构建流程图节点与边（仅题目，不含说明块/分割线等布局元素） */
export function buildFlowGraph(document: SurveyDocument): FlowGraph {
  const nodes: FlowGraphNode[] = []
  const edges: FlowGraphEdge[] = []
  const displayOrdinalMap = buildQuestionDisplayOrdinalMap(document)
  const globalOrdinalMap = buildQuestionOrdinalMap(document)
  const surveyStyle = getSurveyDefaultNumberingStyle(document)

  nodes.push({ id: START_ID, kind: 'start', label: '开始' })
  nodes.push({
    id: END_ID,
    kind: 'end',
    label: document.meta.endTitle || '结束',
  })

  const flowQuestions = document.elements.filter(
    (el): el is QuestionElement => el.kind === 'question'
  )
  const questionById = new Map(flowQuestions.map((q) => [q.id, q]))

  for (const el of flowQuestions) {
    const globalOrdinal = globalOrdinalMap.get(el.id) ?? 0
    const displayOrdinal = displayOrdinalMap.get(el.id) ?? null
    const visible = isQuestionNumberVisible(el, surveyStyle)
    const numberLabel =
      visible && displayOrdinal != null
        ? getQuestionNumberLabel(displayOrdinal, surveyStyle)
        : null

    nodes.push({
      id: nodeIdForElement(el.id),
      kind: 'question',
      elementId: el.id,
      label: el.title || `题目 ${globalOrdinal}`,
      numberLabel,
      questionType: el.type,
      hasVisibilityRules: document.rules.some(
        (r) =>
          r.enabled &&
          (r.action.type === 'show' || r.action.type === 'hide') &&
          r.action.target === el.id
      ),
      hasBranchRules: document.rules.some(
        (r) => r.enabled && ruleReferencesQuestionAsSource(r, el.id)
      ),
    })
  }

  const nodeIds = flowQuestions.map((el) => nodeIdForElement(el.id))

  // 默认顺序边：题目之间直连，跳过布局块
  if (nodeIds.length === 0) {
    edges.push({
      id: 'default:start-end',
      kind: 'default',
      source: START_ID,
      target: END_ID,
    })
  } else {
    edges.push({
      id: 'default:start-first',
      kind: 'default',
      source: START_ID,
      target: nodeIds[0],
    })
    for (let i = 0; i < nodeIds.length - 1; i++) {
      edges.push({
        id: `default:${flowQuestions[i].id}-${flowQuestions[i + 1].id}`,
        kind: 'default',
        source: nodeIds[i],
        target: nodeIds[i + 1],
      })
    }
    edges.push({
      id: 'default:last-end',
      kind: 'default',
      source: nodeIds[nodeIds.length - 1],
      target: END_ID,
    })
  }

  // 规则边
  for (const rule of document.rules) {
    if (!rule.enabled) continue
    const sourceQId = rule.condition.questionId
    if (!sourceQId) continue
    const sourceNodeId = nodeIdForElement(sourceQId)
    if (!nodeIds.includes(sourceNodeId)) continue
    const sourceQuestion = questionById.get(sourceQId)
    const conditionLabel = summarizeCondition(rule.condition, sourceQuestion)

    const action = rule.action
    if (action.type === 'end') {
      edges.push({
        id: `rule:${rule.id}:${action.id}`,
        kind: 'end',
        source: sourceNodeId,
        target: END_ID,
        label: conditionLabel,
        ruleId: rule.id,
      })
    } else if (action.type === 'jump_to_question' && action.target) {
      const targetNodeId = nodeIdForElement(action.target)
      if (!nodeIds.includes(targetNodeId)) continue
      edges.push({
        id: `rule:${rule.id}:${action.id}`,
        kind: 'jump',
        source: sourceNodeId,
        target: targetNodeId,
        label: conditionLabel,
        ruleId: rule.id,
      })
    } else if (
      (action.type === 'show' || action.type === 'hide') &&
      action.target
    ) {
      const targetNodeId = nodeIdForElement(action.target)
      if (!nodeIds.includes(targetNodeId)) continue
      edges.push({
        id: `rule:${rule.id}:${action.id}`,
        kind: 'visibility',
        source: sourceNodeId,
        target: targetNodeId,
        label: conditionLabel,
        ruleId: rule.id,
      })
    }
  }

  return { nodes, edges }
}

function ruleReferencesQuestionAsSource(
  rule: Rule,
  questionId: string
): boolean {
  return rule.condition.questionId === questionId
}
