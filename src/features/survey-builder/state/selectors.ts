import { useShallow } from 'zustand/react/shallow'
import { getQuestion } from '../questions'
import { useSchemaStore, useUIStore } from '../state'
import {
  isQuestionNode,
  FLOW_ACTION_CONFIG,
  FALLBACK_ACTION_CONFIG,
  type QuestionNode,
  type FlowRule,
} from '../types'

/**
 * 核心：基础节点库（唯一排序源）
 * 强制所有衍生计算基于此排序后的列表，避免多次 sort()
 */
export const selectSortedNodes = (nodes: QuestionNode[]) =>
  [...(nodes ?? [])].sort((a, b) => a.order - b.order)

/**
 * 核心：计算题号索引表 (One-time Correct Design)
 * 返回格式: { [nodeId]: number }
 * 解决了分散在各处的手动计数问题
 */
export const selectQuestionIndexMap = (sortedNodes: QuestionNode[]) => {
  const indexMap: Record<string, number> = {}
  let count = 0
  for (const node of sortedNodes) {
    if (isQuestionNode(node.type)) {
      count++
      indexMap[node.id] = count
    }
  }
  return indexMap
}

/**
 * 获取当前选中的完整节点对象
 */
export const useSelectedNode = () => {
  const nodes = useSchemaStore((s) => s.nodes)
  const id = useUIStore((s) => s.selectedNodeId)
  return nodes.find((n) => n.id === id) ?? null
}

/**
 * 获取排序后的根节点列表 (高性能版本)
 * 使用 useShallow 确保只有在节点顺序或内容变化时才触发重渲染
 */
export const useRootNodes = () =>
  useSchemaStore(useShallow((s) => selectSortedNodes(s.nodes)))

/**
 * 获取题目编号索引表 (One-time Correct Design)
 * 返回格式: { [nodeId]: number }
 * 解决了分散在各处的手动计数问题
 */
export const useQuestionIndexMap = () =>
  useSchemaStore(
    useShallow((s) => {
      const sorted = selectSortedNodes(s.nodes)
      return selectQuestionIndexMap(sorted)
    })
  )

/**
 * 获取纯问题节点列表 (排除布局节点)
 */
export const useQuestionNodes = () =>
  useSchemaStore(
    useShallow((s) =>
      selectSortedNodes(s.nodes).filter((n) => isQuestionNode(n.type))
    )
  )


/**
 * 业务 Service: 规则表达式与扁平条件的相互转换
 */
export const RuleService = {
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
  hasConflict: (
    rule: { enabled: boolean; actions: any[] },
    conflicts: Set<string>
  ) => {
    return (
      rule.enabled &&
      rule.actions.some((a: any) => a.target && conflicts.has(a.target))
    )
  },

  // 计算所有逻辑冲突题目的 ID
  calculateConflicts: (
    requiredNodeMap: Record<string, boolean>,
    flow: FlowRule[]
  ): Set<string> => {
    const conflictIds = new Set<string>()
    flow.forEach((rule) => {
      if (!rule.enabled) return
      rule.actions.forEach((action: FlowRule['actions'][0]) => {
        if (action.type === 'hide' && action.target) {
          if (requiredNodeMap[action.target]) conflictIds.add(action.target)
        }
      })
    })
    return conflictIds
  },

  // 当题目类型变化时，计算下一个合法的操作符
  getNextOperator: (
    nodeType: string,
    currentOp: string,
    allOperators: any[]
  ): string => {
    const availableOps = RuleService.getAvailableOperators(
      nodeType,
      allOperators
    )
    if (availableOps.length === 0) return currentOp
    const isSupported = availableOps.some((o) => o.value === currentOp)
    return isSupported ? currentOp : (availableOps[0].value as string)
  },
}
