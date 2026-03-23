'use client'
import { useMemo } from 'react'
import { useBuilderStore } from '../store'
import type { QuestionNode, LogicRule } from '../types'

/**
 * 逻辑冲突检测核心逻辑
 * 规则：若某个必填题被配置了“隐藏”动作，则判定为冲突（用户无法完成提交）
 */
export function detectConflicts(
  nodes: QuestionNode[],
  logic: LogicRule[]
): Set<string> {
  const conflictIds = new Set<string>()
  logic.forEach((rule) => {
    if (!rule.enabled) return
    rule.actions.forEach((action) => {
      if (action.type === 'hide') {
        const target = nodes.find((n) => n.id === action.target)
        if (target?.required) conflictIds.add(target.id)
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
  const logic = useBuilderStore((s) => s.logic)

  // 计算所有冲突的目标
  const conflicts = useMemo(() => detectConflicts(nodes, logic), [nodes, logic])

  // 筛选出包含冲突的规则
  const conflictRules = useMemo(
    () =>
      logic.filter(
        (r) => r.enabled && r.actions.some((a) => conflicts.has(a.target))
      ),
    [logic, conflicts]
  )

  return {
    conflicts,
    conflictRules,
    hasConflicts: conflictRules.length > 0,
  }
}
