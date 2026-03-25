import { useMemo } from 'react'
import { useSchemaStore, useFlowStore } from '../state'
import { RuleService } from '../state/selectors'

/**
 * 逻辑冲突检测 Hook
 * 封装了冲突检测逻辑，避免在多个组件中重复计算
 */
export function useConflictDetection() {
  const nodes = useSchemaStore((s) => s.nodes)
  const flow = useFlowStore((s) => s.flow)

  // 计算所有冲突的目标
  const conflicts = useMemo(
    () => RuleService.calculateConflicts(nodes, flow),
    [nodes, flow]
  )

  // 筛选出包含冲突的规则
  const conflictRules = useMemo(
    () => flow.filter((r) => RuleService.hasConflict(r, conflicts)),
    [flow, conflicts]
  )

  return {
    conflicts,
    conflictRules,
    hasConflicts: conflictRules.length > 0,
  }
}
