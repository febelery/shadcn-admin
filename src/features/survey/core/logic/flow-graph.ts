import { graphlib, layout as dagreLayout } from '@dagrejs/dagre'
import {
  buildQuestionDisplayOrdinalMap,
  buildQuestionOrdinalMap,
  getQuestionNumberLabel,
  getSurveyDefaultNumberingStyle,
  isQuestionNumberVisible,
} from '../../shared/question-numbering'
import { flattenQuestions } from '../schema-defaults'
import type {
  QuestionElement,
  Rule,
  RuleCondition,
  SurveySchema,
} from '../types'

export type FlowNodeKind = 'start' | 'end' | 'question'

export type FlowEdgeKind = 'default' | 'jump' | 'visibility' | 'end'

export interface FlowGraphNode {
  id: string
  kind: FlowNodeKind
  elementId?: string
  label: string
  /** 问卷题号文案，如 1. / 一、；未启用题号时为 null */
  numberLabel?: string | null
  questionType?: string
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

const START_ID = '__flow_start__'
const END_ID = '__flow_end__'

function nodeIdForElement(elementId: string) {
  return `el:${elementId}`
}

function truncateLabel(text: string, max = 14) {
  const cleaned = text.trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

function operatorText(op: string) {
  switch (op) {
    case 'eq':
      return '等于'
    case 'neq':
      return '不等于'
    case 'gt':
      return '大于'
    case 'gte':
      return '大于等于'
    case 'lt':
      return '小于'
    case 'lte':
      return '小于等于'
    case 'contains':
      return '包含'
    case 'not_contains':
      return '不包含'
    case 'empty':
      return '为空'
    case 'not_empty':
      return '不为空'
    default:
      return op
  }
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
  const operator = operatorText(condition.operator)
  if (!('value' in condition)) return operator
  const value = optionLabelForValue(sourceQuestion, condition.value)
  return `${operator} ${value}`.trim()
}

/** 从 schema 构建流程图节点与边（仅题目，不含说明块/分割线等布局元素） */
export function buildFlowGraph(schema: SurveySchema): FlowGraph {
  const nodes: FlowGraphNode[] = []
  const edges: FlowGraphEdge[] = []
  const section = schema.sections[0]

  const displayOrdinalMap = buildQuestionDisplayOrdinalMap(schema)
  const globalOrdinalMap = buildQuestionOrdinalMap(schema)
  const surveyStyle = getSurveyDefaultNumberingStyle(schema)

  nodes.push({ id: START_ID, kind: 'start', label: '开始' })
  nodes.push({
    id: END_ID,
    kind: 'end',
    label: schema.meta.endTitle || '结束',
  })

  const flowQuestions = section.elements.filter(
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
      hasVisibilityRules: schema.rules.some(
        (r) =>
          r.enabled &&
          (r.action.type === 'show' || r.action.type === 'hide') &&
          r.action.target === el.id
      ),
      hasBranchRules: schema.rules.some(
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
  for (const rule of schema.rules) {
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

export function layoutFlowGraphWithMeta(graph: FlowGraph) {
  const elementNodeIds = graph.nodes
    .filter((n) => n.kind === 'question')
    .map((n) => n.id)
  const ordered = getOrderedFlowNodeIds(graph, elementNodeIds)
  return layoutFlowGraphAdaptive(graph, ordered, { nodeCount: ordered.length })
}

export function getQuestionById(
  schema: SurveySchema,
  id: string
): QuestionElement | undefined {
  return flattenQuestions(schema).find((q) => q.id === id)
}

// ─── 流程图节点布局（画布坐标，与 builder/panel-layout 的 CSS shell 无关） ───

const FLOW_LAYOUT_PADDING = 48
const FLOW_LAYOUT_ROW_GAP = 34
const FLOW_LAYOUT_ROW_GAP_COMPACT = 24

/** 流程图节点统一栏宽 — 布局与渲染必须一致，保证连线竖直对齐 */
export const FLOW_CARD_WIDTH = {
  default: 236,
  compact: 196,
} as const

export interface FlowLayoutOptions {
  /** 节点总数，用于决定列数与紧凑模式 */
  nodeCount: number
}

export interface FlowLayoutResult {
  positions: Map<string, { x: number; y: number }>
  columns: number
  compact: boolean
}

function flowLaneWidth(compact: boolean) {
  return compact ? FLOW_CARD_WIDTH.compact : FLOW_CARD_WIDTH.default
}

/** 布局用节点尺寸（与 flow/nodes 渲染保持一致） */
export function flowNodeDimensions(
  node: FlowGraphNode,
  compact: boolean
): { w: number; h: number } {
  const w = flowLaneWidth(compact)
  switch (node.kind) {
    case 'start':
    case 'end':
      return { w, h: compact ? 56 : 62 }
    case 'question':
      return { w, h: compact ? 72 : 88 }
    default:
      return { w, h: compact ? 76 : 88 }
  }
}

function flowNodeSize(
  n: FlowGraphNode,
  compact: boolean
): { w: number; h: number } {
  return flowNodeDimensions(n, compact)
}

/**
 * 稳定中轴布局：主路径保持严格垂直，规则线走节点侧边轨道。
 * 重点是减少歪斜和折返，让用户先读顺序，再看条件分支。
 */
export function layoutFlowGraphAdaptive(
  graph: FlowGraph,
  orderedNodeIds: string[],
  options?: Partial<FlowLayoutOptions>
): FlowLayoutResult {
  const nodeCount = options?.nodeCount ?? orderedNodeIds.length
  const compact = nodeCount > 14

  if (graph.edges.some((e) => e.kind !== 'default')) {
    return layoutFlowGraphDagre(graph, orderedNodeIds, compact)
  }

  const columns = 1
  const gapY = compact ? FLOW_LAYOUT_ROW_GAP_COMPACT : FLOW_LAYOUT_ROW_GAP
  const laneWidth = flowLaneWidth(compact)

  const positions = new Map<string, { x: number; y: number }>()
  let y = FLOW_LAYOUT_PADDING

  for (let i = 0; i < orderedNodeIds.length; i++) {
    const id = orderedNodeIds[i]
    const node = graph.nodes.find((n) => n.id === id)
    if (!node) continue

    const { w, h } = flowNodeSize(node, compact)
    const x = FLOW_LAYOUT_PADDING + (laneWidth - w) / 2

    positions.set(id, { x, y })
    y += h + gapY
  }

  return { positions, columns, compact }
}

function layoutFlowGraphDagre(
  graph: FlowGraph,
  orderedNodeIds: string[],
  compact: boolean
): FlowLayoutResult {
  const g = new graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'TB',
    align: 'UL',
    ranksep: compact ? 30 : 44,
    nodesep: compact ? 42 : 68,
    edgesep: compact ? 14 : 20,
    marginx: FLOW_LAYOUT_PADDING,
    marginy: FLOW_LAYOUT_PADDING,
  })

  for (const id of orderedNodeIds) {
    const node = graph.nodes.find((n) => n.id === id)
    if (!node) continue
    const { w, h } = flowNodeSize(node, compact)
    g.setNode(id, { width: w, height: h })
  }

  for (const edge of graph.edges) {
    if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) continue
    const isDefault = edge.kind === 'default'
    g.setEdge(edge.source, edge.target, {
      weight: isDefault ? 10 : 1,
      minlen: isDefault ? 1 : 2,
    })
  }

  dagreLayout(g)

  const positions = new Map<string, { x: number; y: number }>()
  const lanes = new Set<number>()

  for (const id of orderedNodeIds) {
    const node = graph.nodes.find((n) => n.id === id)
    const positioned = g.node(id)
    if (!node || !positioned) continue
    const { w, h } = flowNodeSize(node, compact)
    const x = Math.max(FLOW_LAYOUT_PADDING, positioned.x - w / 2)
    const y = Math.max(FLOW_LAYOUT_PADDING, positioned.y - h / 2)
    lanes.add(Math.round(x / 24))
    positions.set(id, { x, y })
  }

  return {
    positions,
    columns: Math.max(1, lanes.size),
    compact,
  }
}

export function getOrderedFlowNodeIds(
  graph: FlowGraph,
  elementNodeIds: string[]
): string[] {
  const start = graph.nodes.find((n) => n.kind === 'start')?.id
  const end = graph.nodes.find((n) => n.kind === 'end')?.id
  const ids: string[] = []
  if (start) ids.push(start)
  ids.push(...elementNodeIds)
  if (end) ids.push(end)
  return ids
}

export { START_ID, END_ID, nodeIdForElement }
