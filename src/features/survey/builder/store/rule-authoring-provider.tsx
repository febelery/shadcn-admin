import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useBuilderStoreApi } from '../store'
import { hasRuleDraftChanges } from './rule-authoring'
import {
  RuleAuthoringContext,
  type PendingRuleNavigation,
  type RuleAuthoringContextValue,
} from './use-rule-authoring'

export function RuleAuthoringProvider({ children }: { children: ReactNode }) {
  const store = useBuilderStoreApi()
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingRuleNavigation | null>(null)

  const execute = useCallback(
    (navigation: PendingRuleNavigation) => {
      const state = store.getState()
      if (navigation.type === 'begin') {
        state.beginRuleDraft(navigation.request, { discardChanges: true })
        return
      }
      state.discardRuleDraft()
      state.navigate({
        type:
          navigation.type === 'leave-to-edit'
            ? 'show-edit'
            : 'close-mobile-panel',
      })
    },
    [store]
  )

  const request = useCallback(
    (navigation: PendingRuleNavigation) => {
      const state = store.getState()
      if (navigation.type === 'begin') {
        const result = state.beginRuleDraft(navigation.request)
        if (result === 'confirmation-required') {
          setPendingNavigation(navigation)
        }
        return
      }
      if (hasRuleDraftChanges(state.ruleDraft)) {
        setPendingNavigation(navigation)
        return
      }
      execute(navigation)
    },
    [execute, store]
  )

  const value = useMemo<RuleAuthoringContextValue>(() => {
    return {
      openNewRule: () => request({ type: 'begin', request: { type: 'new' } }),
      openRule: (ruleId) =>
        request({ type: 'begin', request: { type: 'existing', ruleId } }),
      clearRuleFocus: () => request({ type: 'clear-focus' }),
      leaveToEdit: () => request({ type: 'leave-to-edit' }),
    }
  }, [request])

  return (
    <RuleAuthoringContext.Provider value={value}>
      {children}
      <AlertDialog
        open={pendingNavigation !== null}
        onOpenChange={(open) => {
          if (!open) setPendingNavigation(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>有未应用的规则修改</AlertDialogTitle>
            <AlertDialogDescription>
              当前规则草稿尚未应用，继续操作会放弃这些修改。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续编辑</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingNavigation) return
                execute(pendingNavigation)
                setPendingNavigation(null)
              }}
            >
              放弃修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RuleAuthoringContext.Provider>
  )
}
