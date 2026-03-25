import { useShallow } from 'zustand/react/shallow'
import { getQuestion } from '../questions'
import { useSchemaStore, useUIStore } from '../state'
import {
  isQuestionNode,
  FLOW_ACTION_CONFIG,
  FALLBACK_ACTION_CONFIG,
  type QuestionNode,
  type LogicExpression,
  type ComparisonExpression,
} from '../types'

/**
 * 获取当前选中的完整节点对象
 */
export const useSelectedNode = () => {
  const nodes = useSchemaStore((s) => s.nodes)
  const id = useUIStore((s) => s.selectedNodeId)
  return nodes.find((n) => n.id === id) ?? null
}

/**
 * 获取排序后的根节点列表 (用于画布主渲染)
 */
export const useRootNodes = () =>
  useSchemaStore(
    useShallow((s) => [...(s.nodes ?? [])].sort((a, b) => a.order - b.order))
  )

/**
 * 获取所有可见题目的编号映射
 * 用于 SurveyHeader 等地方展示 "共 X 题"
 */
export const useVisibleNodeNumber = () =>
  useSchemaStore(
    useShallow((s) => {
      const numMap: Record<string, number> = {}
      let i = 0
      ;[...(s.nodes ?? [])]
        .filter((n: QuestionNode) => isQuestionNode(n.type))
        .sort((a, b) => a.order - b.order)
        .forEach((n: QuestionNode) => {
          i++
          numMap[n.id] = i
        })
      return numMap
    })
  )

/**
 * 获取纯问题节点列表 (排除布局节点)
 */
export const useQuestionNodes = () =>
  useSchemaStore(
    useShallow((s) => s.nodes.filter((n) => isQuestionNode(n.type)))
  )

/**
 * 衍生状态：当前是否处于某种模式
 */
export const useIsBuilderMode = (mode: 'build' | 'flow') =>
  useUIStore((s) => s.builderMode === mode)

/**
 * 业务 Service: 规则表达式与扁平条件的相互转换
 */
export const RuleService = {
  // 将 DSL 表达式转化为 UI 用的扁平条件数组
  toFlatConditions: (expr: LogicExpression): ComparisonExpression[] => {
    if (expr.type === 'logical' && expr.operator === 'AND') {
      return expr.expressions.map((e) => e as ComparisonExpression)
    }
    if (expr.type === 'comparison') return [expr]
    return []
  },

  // 将扁平条件数组转化为 DSL 表达式
  fromFlatConditions: (conditions: ComparisonExpression[]): LogicExpression => {
    if (conditions.length === 1) return conditions[0]
    return {
      id: crypto.randomUUID(),
      type: 'logical',
      operator: 'AND',
      expressions: conditions,
    }
  },

  // 获取节点支持的操作符
  getAvailableOperators: (nodeType: string, allOperators: any[]) => {
    const caps = getQuestion(nodeType as any)?.capabilities
    if (!caps) return []
    return allOperators.filter((o: any) => caps.operators.includes(o.value))
  },

  // 获取规则动作的显示配置
  getActionConfig: (type?: string) => {
    if (!type) return FALLBACK_ACTION_CONFIG
    return FLOW_ACTION_CONFIG[type] ?? FALLBACK_ACTION_CONFIG
  },

  // 判断是否与冲突题集存在交集
  hasConflict: (rule: any, conflicts: Set<string>) => {
    return (
      rule.enabled &&
      rule.actions.some((a: any) => a.target && conflicts.has(a.target))
    )
  },
}
