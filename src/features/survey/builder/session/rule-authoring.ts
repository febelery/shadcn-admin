import { createContext, useContext } from 'react'
import { useBuilderStore } from '../builder-session'
import { hasRuleDraftChanges, type RuleDraftRequest } from './rule-draft'

export type PendingRuleNavigation =
  | { type: 'begin'; request: RuleDraftRequest }
  | { type: 'leave-to-edit' }
  | { type: 'clear-focus' }

export type RuleAuthoringContextValue = {
  openNewRule: () => void
  openRule: (ruleId: string) => void
  clearRuleFocus: () => void
  leaveToEdit: () => void
}

export const RuleAuthoringContext =
  createContext<RuleAuthoringContextValue | null>(null)

/** 表单式编辑与未来可视化编辑共享的规则创作接口。 */
export function useRuleAuthoring() {
  const context = useContext(RuleAuthoringContext)
  if (!context) {
    throw new Error('useRuleAuthoring 必须在 RuleAuthoringProvider 内使用')
  }
  return context
}

export function useRuleDraftEditor() {
  const draft = useBuilderStore((state) => state.ruleDraft)
  const changeRuleDraft = useBuilderStore((state) => state.changeRuleDraft)
  const applyRuleDraft = useBuilderStore((state) => state.applyRuleDraft)
  const discardRuleDraft = useBuilderStore((state) => state.discardRuleDraft)

  return {
    draft,
    hasChanges: hasRuleDraftChanges(draft),
    changeDraft: changeRuleDraft,
    applyDraft: applyRuleDraft,
    cancelDraft: discardRuleDraft,
  }
}
