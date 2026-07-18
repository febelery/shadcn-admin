import { flattenQuestions } from '../../core/document-elements'
import { analyseSurvey, type StaticIssue } from '../../core/logic/analyzer'
import { buildFlowGraph, type FlowGraph } from '../../core/logic/flow-graph'
import { getRuleCategory } from '../../core/logic/rule-meta'
import { getQuestionReferenceLabel } from '../../core/question-numbering'
import type { QuestionElement, Rule, SurveyDocument } from '../../core/types'
import { layoutFlowGraph, type FlowLayoutResult } from './layout'

export interface FlowProjectionStats {
  questionCount: number
  enabledRuleCount: number
  visibilityRuleCount: number
  jumpRuleCount: number
  endRuleCount: number
  text: string
}

export interface FlowProjectionIssueStats {
  errors: number
  warnings: number
  first?: StaticIssue
}

/**
 * 流程模式的共享读模型。
 *
 * 问卷结构和已确认规则仍是事实来源；此投影只集中派生数据，调用者不得修改它。
 */
export interface FlowProjection {
  questions: QuestionElement[]
  rules: Rule[]
  questionTitles: Map<string, string>
  issues: StaticIssue[]
  issuesByRule: Map<string, StaticIssue[]>
  issueSeverityByTarget: Map<string, 'error' | 'warn'>
  issueStats: FlowProjectionIssueStats
  graph: FlowGraph
  layout: FlowLayoutResult
  /** 仅拓扑改变时变化，用于保持画布视口稳定。 */
  topologyKey: string
  stats: FlowProjectionStats
}

function buildTopologyKey(graph: FlowGraph): string {
  return JSON.stringify({
    nodes: graph.nodes.map((node) => [node.id, node.kind]),
    edges: graph.edges.map((edge) => [edge.kind, edge.source, edge.target]),
  })
}

function groupIssuesByRule(issues: StaticIssue[]) {
  const grouped = new Map<string, StaticIssue[]>()
  for (const issue of issues) {
    if (!issue.ruleId) continue
    const list = grouped.get(issue.ruleId) ?? []
    list.push(issue)
    grouped.set(issue.ruleId, list)
  }
  return grouped
}

function indexIssueSeverityByTarget(issues: StaticIssue[]) {
  const indexed = new Map<string, 'error' | 'warn'>()
  for (const issue of issues) {
    if (!issue.targetId) continue
    if (issue.severity === 'error') indexed.set(issue.targetId, 'error')
    else if (!indexed.has(issue.targetId)) indexed.set(issue.targetId, 'warn')
  }
  return indexed
}

function buildStats(questions: QuestionElement[], rules: Rule[]) {
  const enabledRuleCount = rules.filter((rule) => rule.enabled).length
  const visibilityRuleCount = rules.filter(
    (rule) => getRuleCategory(rule) === 'visibility'
  ).length
  const jumpRuleCount = rules.filter(
    (rule) => getRuleCategory(rule) === 'jump'
  ).length
  const endRuleCount = rules.filter(
    (rule) => getRuleCategory(rule) === 'end'
  ).length

  return {
    questionCount: questions.length,
    enabledRuleCount,
    visibilityRuleCount,
    jumpRuleCount,
    endRuleCount,
    text: `共 ${questions.length} 题 · ${enabledRuleCount} 条启用规则（显隐 ${visibilityRuleCount} · 跳题 ${jumpRuleCount} · 结束 ${endRuleCount}）`,
  }
}

/**
 * 创建一个会话级投影器。相同 document 引用只计算一次；展示信息变化会刷新投影，
 * 但只要图拓扑不变，就复用上一次 Dagre 布局。
 */
export function createFlowProjector() {
  let previousDocument: SurveyDocument | null = null
  let previousProjection: FlowProjection | null = null
  let previousElements: SurveyDocument['elements'] | null = null
  let previousRules: SurveyDocument['rules'] | null = null
  let previousEndTitle: string | undefined
  let previousNumberingStyle: SurveyDocument['meta']['defaultQuestionNumbering']
  let previousNumberingMode: SurveyDocument['meta']['questionNumberingMode']
  let previousTopologyKey = ''
  let previousLayout: FlowLayoutResult | null = null

  return (document: SurveyDocument): FlowProjection => {
    if (document === previousDocument && previousProjection) {
      return previousProjection
    }

    const hasSameProjectionInputs =
      document.elements === previousElements &&
      document.rules === previousRules &&
      document.meta.endTitle === previousEndTitle &&
      document.meta.defaultQuestionNumbering === previousNumberingStyle &&
      document.meta.questionNumberingMode === previousNumberingMode
    if (hasSameProjectionInputs && previousProjection) {
      previousDocument = document
      return previousProjection
    }

    const questions = flattenQuestions(document)
    const rules = document.rules
    const questionTitles = new Map<string, string>()
    for (const question of questions) {
      questionTitles.set(
        question.id,
        getQuestionReferenceLabel(question, document)
      )
    }

    const issues = analyseSurvey(document)
    const graph = buildFlowGraph(document)
    const topologyKey = buildTopologyKey(graph)
    const layout =
      topologyKey === previousTopologyKey && previousLayout
        ? previousLayout
        : layoutFlowGraph(graph)

    const errors = issues.filter((issue) => issue.severity === 'error').length
    const warnings = issues.filter((issue) => issue.severity === 'warn').length
    const projection: FlowProjection = {
      questions,
      rules,
      questionTitles,
      issues,
      issuesByRule: groupIssuesByRule(issues),
      issueSeverityByTarget: indexIssueSeverityByTarget(issues),
      issueStats: { errors, warnings, first: issues[0] },
      graph,
      layout,
      topologyKey,
      stats: buildStats(questions, rules),
    }

    previousDocument = document
    previousProjection = projection
    previousElements = document.elements
    previousRules = document.rules
    previousEndTitle = document.meta.endTitle
    previousNumberingStyle = document.meta.defaultQuestionNumbering
    previousNumberingMode = document.meta.questionNumberingMode
    previousTopologyKey = topologyKey
    previousLayout = layout
    return projection
  }
}
