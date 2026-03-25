import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSchemaStore, useFlowStore } from '../state'
import { RuleService } from '../state/selectors'

/**
 * 逻辑冲突检测 Hook
 */
export function useConflictDetection() {
  // 订阅题目状态：仅关注题目 ID 与其 required 标记
  const requiredNodeMap = useSchemaStore(
    useShallow((s) => {
      const map: Record<string, boolean> = {}
      s.nodes.forEach((n) => {
        if (n.required) map[n.id] = true
      })
      return map
    })
  )

  const flow = useFlowStore(useShallow((s) => s.flow))

  const conflicts = useMemo(
    () => RuleService.calculateConflicts(requiredNodeMap, flow),
    [requiredNodeMap, flow]
  )

  // 筛选冲突规则集
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
