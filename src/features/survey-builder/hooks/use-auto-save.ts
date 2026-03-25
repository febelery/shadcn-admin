import { useEffect, useRef } from 'react'
import {
  useSchemaStore,
  useFlowStore,
  useDraftStore,
} from '@/features/survey-builder/state'

/**
 * 自动保存草稿 Hook
 * 监听 Schema 与 Flow 的状态变更，执行防抖持久化 (SessionStorage)
 */
export function useAutoSave(surveyId: string) {
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const triggerSave = () => {
      if (!useDraftStore.getState().isDirty) return

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

      autoSaveTimerRef.current = setTimeout(() => {
        const schema = useSchemaStore.getState()
        const flow = useFlowStore.getState()

        const draftData = {
          id: surveyId,
          version: schema.version ?? '1',
          meta: schema.meta,
          nodes: schema.nodes,
          flow: flow.flow,
          validations: flow.validations,
          extensions: schema.extensions ?? {},
        }

        sessionStorage.setItem(
          `survey-draft-${surveyId}`,
          JSON.stringify(draftData)
        )
      }, 1000)
    }

    const unsubSchema = useSchemaStore.subscribe(triggerSave)
    const unsubFlow = useFlowStore.subscribe(triggerSave)

    return () => {
      unsubSchema()
      unsubFlow()
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [surveyId])
}
