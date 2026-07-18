import { useBuilderStore, useBuilderStoreApi } from '../store'
import { hasRuleDraftChanges, type RuleDraftRequest } from './rule-authoring'

const DISCARD_MESSAGE = '当前规则有未应用的修改，确定放弃吗？'

/** 表单式编辑与未来可视化编辑共享的规则创作接口。 */
export function useRuleAuthoring() {
  const store = useBuilderStoreApi()
  const beginRuleDraft = useBuilderStore((state) => state.beginRuleDraft)
  const discardRuleDraft = useBuilderStore((state) => state.discardRuleDraft)
  const navigate = useBuilderStore((state) => state.navigate)

  const begin = (request: RuleDraftRequest) => {
    const result = beginRuleDraft(request)
    if (result !== 'confirmation-required') return result === 'started'
    if (!window.confirm(DISCARD_MESSAGE)) return false
    return beginRuleDraft(request, { discardChanges: true }) === 'started'
  }

  const leaveToEdit = () => {
    const draft = store.getState().ruleDraft
    if (hasRuleDraftChanges(draft) && !window.confirm(DISCARD_MESSAGE)) {
      return false
    }
    discardRuleDraft()
    navigate({ type: 'show-edit' })
    return true
  }

  const clearRuleFocus = () => {
    const draft = store.getState().ruleDraft
    if (hasRuleDraftChanges(draft) && !window.confirm(DISCARD_MESSAGE)) {
      return false
    }
    discardRuleDraft()
    navigate({ type: 'close-mobile-panel' })
    return true
  }

  return {
    openNewRule: () => begin({ type: 'new' }),
    openRule: (ruleId: string) => begin({ type: 'existing', ruleId }),
    clearRuleFocus,
    leaveToEdit,
  }
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
