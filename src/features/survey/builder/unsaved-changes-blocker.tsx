import { useBlocker } from '@tanstack/react-router'
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
import { useBuilderStore, useBuilderStoreApi } from './store'
import { hasRuleDraftChanges } from './store/rule-authoring'

export function UnsavedChangesBlocker() {
  const store = useBuilderStoreApi()
  const hasUnsavedChanges = useBuilderStore(
    (state) => state.isDirty || hasRuleDraftChanges(state.ruleDraft)
  )
  const shouldBlock = () => {
    const state = store.getState()
    return state.isDirty || hasRuleDraftChanges(state.ruleDraft)
  }
  const blocker = useBlocker({
    shouldBlockFn: shouldBlock,
    enableBeforeUnload: shouldBlock,
    disabled: !hasUnsavedChanges,
    withResolver: true,
  })

  return (
    <AlertDialog
      open={blocker.status === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.status === 'blocked') blocker.reset()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>有未保存的修改</AlertDialogTitle>
          <AlertDialogDescription>
            离开后，本次未保存的问卷内容和规则草稿将丢失。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              if (blocker.status === 'blocked') blocker.reset()
            }}
          >
            继续编辑
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (blocker.status === 'blocked') blocker.proceed()
            }}
          >
            放弃并离开
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
