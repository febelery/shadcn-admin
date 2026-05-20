import { flattenQuestions } from '../schema-defaults'
import {
  buildQuestionDisplayOrdinalMap,
  buildQuestionOrdinalMap,
  getQuestionNumberLabel,
  getSurveyDefaultNumberingStyle,
  isQuestionNumberVisible,
} from '../../shared/question-numbering'
import type { QuestionElement, Rule, SurveySchema } from '../types'
import { extractQuestionRefsFromWhen } from './condition-serializer'

export type FlowNodeKind = 'start' | 'end' | 'question'

export type FlowEdgeKind =
  | 'default'
  | 'jump'
  | 'branch'
  | 'visibility'
  | 'end'

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

/** 从 schema 构建流程图节点与边（仅题目，不含说明块/分割线等布局元素） */
export function buildFlowGraph(schema: SurveySchema): FlowGraph {
  const nodes: FlowGraphNode[] = []
  const edges: FlowGraphEdge[] = []
  const section = schema.sections[0]
  if (!section) {
    return { nodes, edges }
  }

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
          r.actions.some(
            (a) =>
              (a.type === 'show' || a.type === 'hide') && a.target === el.id
          )
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
    const sourceRefs = extractQuestionRefsFromWhen(rule.when)
    const sourceQId = sourceRefs[0]
    if (!sourceQId) continue
    const sourceNodeId = nodeIdForElement(sourceQId)
    if (!nodeIds.includes(sourceNodeId)) continue

    for (const action of rule.actions) {
      if (action.type === 'end') {
        edges.push({
          id: `rule:${rule.id}:${action.id}`,
          kind: 'end',
          source: sourceNodeId,
          target: END_ID,
          label: rule.name,
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
          label: rule.name,
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
          label: action.type === 'show' ? '显示' : '隐藏',
          ruleId: rule.id,
        })
      }
    }
  }

  return { nodes, edges }
}

function ruleReferencesQuestionAsSource(rule: Rule, questionId: string): boolean {
  return extractQuestionRefsFromWhen(rule.when).includes(questionId)
}

/** 从 start 出发 BFS，标记可达的题目 ID */
export function findReachableQuestionIds(schema: SurveySchema): Set<string> {
  const graph = buildFlowGraph(schema)
  const questions = flattenQuestions(schema)
  if (questions.length === 0) return new Set()

  const adj = new Map<string, string[]>()
  for (const e of graph.edges) {
    if (e.kind === 'visibility') continue
    const list = adj.get(e.source) ?? []
    list.push(e.target)
    adj.set(e.source, list)
  }

  const reachable = new Set<string>()
  const queue = [START_ID]
  const seen = new Set<string>([START_ID])

  while (queue.length) {
    const cur = queue.shift()!
    if (cur.startsWith('el:')) {
      const elId = cur.slice(3)
      const q = questions.find((x) => x.id === elId)
      if (q) reachable.add(elId)
    }
    for (const next of adj.get(cur) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push(next)
    }
  }

  return reachable
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

const FLOW_LAYOUT_PADDING = 40
const FLOW_LAYOUT_COL_GAP = 72
const FLOW_LAYOUT_ROW_GAP = 28
const FLOW_LAYOUT_ROW_GAP_COMPACT = 20

/** 流程图节点统一栏宽 — 布局与渲染必须一致，保证连线竖直对齐 */
export const FLOW_CARD_WIDTH = {
  default: 260,
  compact: 240,
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
      return { w, h: compact ? 72 : 80 }
    case 'question':
      return { w, h: compact ? 104 : 124 }
    default:
      return { w, h: compact ? 96 : 108 }
  }
}

function flowNodeSize(n: FlowGraphNode, compact: boolean): { w: number; h: number } {
  return flowNodeDimensions(n, compact)
}

function flowColumnCount(nodeCount: number): number {
  if (nodeCount <= 8) return 1
  if (nodeCount <= 16) return 2
  if (nodeCount <= 28) return 3
  return 4
}

const FLOW_LAYOUT_COL_WIDTH = FLOW_CARD_WIDTH.default + 20

/**
 * 自适应多列布局：主路径按问卷顺序「先下后右」排列。
 * 跳题 / 显隐边不参与布局，仅作为视觉 overlay。
 */
export function layoutFlowGraphAdaptive(
  graph: FlowGraph,
  orderedNodeIds: string[],
  options?: Partial<FlowLayoutOptions>
): FlowLayoutResult {
  const nodeCount = options?.nodeCount ?? orderedNodeIds.length
  const compact = nodeCount > 12
  const columns = flowColumnCount(nodeCount)
  const rowsPerCol = Math.ceil(orderedNodeIds.length / columns)
  const gapY = compact ? FLOW_LAYOUT_ROW_GAP_COMPACT : FLOW_LAYOUT_ROW_GAP

  const positions = new Map<string, { x: number; y: number }>()
  const colHeights = new Array(columns).fill(FLOW_LAYOUT_PADDING)

  for (let i = 0; i < orderedNodeIds.length; i++) {
    const id = orderedNodeIds[i]
    const node = graph.nodes.find((n) => n.id === id)
    if (!node) continue

    const col = Math.min(columns - 1, Math.floor(i / rowsPerCol))
    const { w, h } = flowNodeSize(node, compact)
    const x =
      FLOW_LAYOUT_PADDING +
      col * (FLOW_LAYOUT_COL_WIDTH + FLOW_LAYOUT_COL_GAP) +
      (FLOW_LAYOUT_COL_WIDTH - w) / 2
    const y = colHeights[col]

    positions.set(id, { x, y })
    colHeights[col] += h + gapY
  }

  return { positions, columns, compact }
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
