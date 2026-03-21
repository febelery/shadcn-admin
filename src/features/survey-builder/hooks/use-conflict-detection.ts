'use client'
import { useMemo } from 'react'
import { useBuilderStore } from '../store'
import { detectConflicts } from '../utils'

/**
 * 逻辑冲突检测 Hook
 * 封装了冲突检测逻辑，避免在多个组件中重复计算
 */
export function useConflictDetection() {
  const { nodes, logic } = useBuilderStore()

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
