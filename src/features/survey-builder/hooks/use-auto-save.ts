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
  const isDirtyRef = useRef(false)

  // 镜像引用：保存 Store 的最新状态，避免在异步回调中使用 .getState()
  const schemaRef = useRef(useSchemaStore.getState())
  const flowRef = useRef(useFlowStore.getState())

  // 1. 同步订阅 Dirty 状态
  useEffect(() => {
    return useDraftStore.subscribe((s) => {
      isDirtyRef.current = s.isDirty
    })
  }, [])

  // 2. 同步镜像 Schema 状态
  useEffect(() => {
    return useSchemaStore.subscribe((s) => {
      schemaRef.current = s
    })
  }, [])

  // 3. 同步镜像 Flow 状态
  useEffect(() => {
    return useFlowStore.subscribe((s) => {
      flowRef.current = s
    })
  }, [])

  useEffect(() => {
    const triggerSave = () => {
      if (!isDirtyRef.current) return

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

      autoSaveTimerRef.current = setTimeout(() => {
        // 直接从 Refs 获取最新镜像，无需调用 getState()
        const schema = schemaRef.current
        const flow = flowRef.current

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

    // 监听任意核心 Store 变更来触发保存动作
    const unsubSchema = useSchemaStore.subscribe(triggerSave)
    const unsubFlow = useFlowStore.subscribe(triggerSave)

    return () => {
      unsubSchema()
      unsubFlow()
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [surveyId])
}
