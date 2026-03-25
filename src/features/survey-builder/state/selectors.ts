import { useMemo } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { getQuestion } from '../questions'
import { useSchemaStore, useUIStore, useFlowStore } from '../state'
import {
  isQuestionNode,
  FLOW_ACTION_CONFIG,
  FALLBACK_ACTION_CONFIG,
  type QuestionNode,
  type LogicExpression,
  type ComparisonExpression,
} from '../types'

/**
 * 核心：基础节点库（唯一排序源）
 * 强制所有衍生计算基于此排序后的列表，避免多次 sort()
 */
const selectSortedNodes = (s: { nodes: QuestionNode[] }) =>
  [...(s.nodes ?? [])].sort((a, b) => a.order - b.order)

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
export const useRootNodes = () => useSchemaStore(useShallow(selectSortedNodes))

/**
 * 获取题目编号索引表 (One-time Correct Design)
 * 返回格式: { [nodeId]: number }
 * 解决了分散在各处的手动计数问题
 */
export const useQuestionIndexMap = () =>
  useSchemaStore(
    useShallow((s) => {
      const sorted = selectSortedNodes(s)
      const indexMap: Record<string, number> = {}
      let count = 0
      for (const node of sorted) {
        if (isQuestionNode(node.type)) {
          count++
          indexMap[node.id] = count
        }
      }
      return indexMap
    })
  )

/**
 * 获取纯问题节点列表 (排除布局节点)
 */
export const useQuestionNodes = () =>
  useSchemaStore(
    useShallow((s) =>
      selectSortedNodes(s).filter((n) => isQuestionNode(n.type))
    )
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
  // 核心：支持递归，仅拍平 AND 嵌套，保留 OR/NOT 等复杂结构为单体，防止静默损坏
  toFlatConditions: (expr: LogicExpression): ComparisonExpression[] => {
    if (!expr) return []

    // 1. 原子比较直接返回
    if (expr.type === 'comparison') return [expr]

    // 2. 逻辑组合
    if (expr.type === 'logical') {
      // 仅当是 AND 时才尝试递归拍平其子项
      if (expr.operator === 'AND') {
        return expr.expressions.flatMap((e) => RuleService.toFlatConditions(e))
      }
      // 对于 OR 或 NOT，UI 暂时无法展现其内部结构
      // 我们将其作为一个整体存入数组（虽然类型不完全匹配，但能保证数据不被丢弃）
      return [expr as any]
    }

    // 3. 其他：函数表达式等一律视为黑盒整体
    return [expr as any]
  },

  // 将扁平条件数组转化为 DSL 表达式
  fromFlatConditions: (conditions: ComparisonExpression[]): LogicExpression => {
    if (conditions.length === 0) {
      throw new Error('条件列表不能为空')
    }

    // 1. 结构保护：如果数组中包含之前塞进去的复杂 LogicExpression，且它是唯一的，直接原样返回
    if (
      conditions.length === 1 &&
      (conditions[0] as any).type !== 'comparison'
    ) {
      return conditions[0] as any
    }

    // 2. 正常还原：单条件忽略逻辑包装，多条件采用 AND
    if (conditions.length === 1) return conditions[0]

    return {
      id: crypto.randomUUID(),
      type: 'logical',
      operator: 'AND',
      expressions: conditions.map((cond) => {
        // 如果 cond 本身就是之前保留的逻辑对象，直接返回；否则就是标准 comparison
        return (cond as any).type === 'comparison' ? cond : (cond as any)
      }),
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
  hasConflict: (
    rule: { enabled: boolean; actions: any[] },
    conflicts: Set<string>
  ) => {
    return (
      rule.enabled &&
      rule.actions.some((a: any) => a.target && conflicts.has(a.target))
    )
  },

  // 计算所有逻辑冲突题目的 ID (规则：必填题被隐藏)
  calculateConflicts: (nodes: QuestionNode[], flow: any[]): Set<string> => {
    const conflictIds = new Set<string>()
    flow.forEach((rule) => {
      if (!rule.enabled) return
      rule.actions.forEach((action: any) => {
        if (action.type === 'hide' && action.target) {
          const target = nodes.find((n) => n.id === action.target)
          if (target?.required) conflictIds.add(action.target)
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

/**
 * 衍生状态 Hook：ReactFlow 所需电元素 (Nodes & Edges)
 */
export const useFlowElements = () => {
  // 1. 细粒度订阅并使用 useShallow 保证原子引用稳定
  const visibleNodes = useSchemaStore(
    useShallow((s) => s.nodes.filter((n) => isQuestionNode(n.type)))
  ) as QuestionNode[]
  const allNodes = useSchemaStore(useShallow((s) => s.nodes)) as QuestionNode[]
  const flow = useFlowStore(useShallow((s) => s.flow)) as any[]
  const flowPositions = useSchemaStore(
    useShallow(
      (s) =>
        (s.extensions.flowPositions || {}) as Record<
          string,
          { x: number; y: number }
        >
    )
  )

  // 2. 将复杂转换逻辑收拢至 useMemo，仅在核心数据变动时重算
  return useMemo(() => {
    // 预计算题号索引表 (基于全量节点的排序)
    const indexMap: Record<string, number> = {}
    let count = 0
    const sorted = [...allNodes].sort((a, b) => a.order - b.order)
    for (const node of sorted) {
      if (isQuestionNode(node.type)) {
        count++
        indexMap[node.id] = count
      }
    }

    // 构建 ReactFlow 节点
    const nodes: Node[] = visibleNodes.map((node: QuestionNode, i: number) => ({
      id: node.id,
      type: 'questionNode',
      position: flowPositions[node.id] ?? { x: 120, y: i * 140 },
      data: { node, num: indexMap[node.id] },
      width: 220,
      height: 84,
    }))

    // 构建 ReactFlow 连线
    const edges: Edge[] = []
    flow.forEach((rule: any) => {
      if (!rule.enabled) return
      const fromId = (rule.expression as any)?.field
      rule.actions.forEach((action: any) => {
        const toId = action.target
        if (!fromId || !toId || fromId === toId) return
        edges.push({
          id: `${rule.id}::${action.type}::${toId}`,
          source: fromId,
          target: toId,
          type: 'flowEdge',
          data: {
            ruleId: rule.id,
            actionType: action.type,
            ruleName: rule.name,
          },
          markerEnd: { type: 'arrowclosed' as any, width: 14, height: 14 },
        })
      })
    })

    return { nodes, edges }
  }, [visibleNodes, allNodes, flow, flowPositions])
}
