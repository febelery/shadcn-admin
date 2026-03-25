'use client'
import { useMemo } from 'react'
import { useBuilderStore } from '../state'
import type { QuestionNode, FlowRule } from '../types'

/**
 * 流程冲突检测核心逻辑
 * 规则：若某个必填题被配置了“隐藏”动作，则判定为冲突（用户无法完成提交）
 */
export function detectConflicts(
  nodes: QuestionNode[],
  flow: FlowRule[]
): Set<string> {
  const conflictIds = new Set<string>()
  flow.forEach((rule) => {
    if (!rule.enabled) return
    rule.actions.forEach((action) => {
      if (action.type === 'hide') {
        const target = nodes.find((n) => n.id === action.target)
        if (target?.required && action.target) conflictIds.add(action.target)
      }
    })
  })
  return conflictIds
}

/**
 * 逻辑冲突检测 Hook
 * 封装了冲突检测逻辑，避免在多个组件中重复计算
 */
export function useConflictDetection() {
  const nodes = useBuilderStore((s) => s.nodes)
  const flow = useBuilderStore((s) => s.flow)

  // 计算所有冲突的目标
  const conflicts = useMemo(() => detectConflicts(nodes, flow), [nodes, flow])

  // 筛选出包含冲突的规则
  const conflictRules = useMemo(
    () =>
      flow.filter(
        (r) =>
          r.enabled &&
          r.actions.some((a) => a.target && conflicts.has(a.target))
      ),
    [flow, conflicts]
  )

  return {
    conflicts,
    conflictRules,
    hasConflicts: conflictRules.length > 0,
  }
}
