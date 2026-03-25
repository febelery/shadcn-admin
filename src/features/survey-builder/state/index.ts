import { type SurveySchema } from '../types'
import { useDraftStore } from './draft'
import { useFlowStore } from './flow'
import { useSchemaStore } from './schema'
import { useUIStore } from './ui'

/**
 * 根初始化函数：同步初始化所有职责 Store
 */
export const initBuilderStore = (data: SurveySchema) => {
  useSchemaStore.getState().initSchema(data)
  useFlowStore.getState().initFlow({
    flow: data.flow,
    validations: data.validations,
  })
  useDraftStore.getState().markSaved()
}

// 导出所有子 Store
export { useSchemaStore, useFlowStore, useUIStore, useDraftStore }

/**
 * @deprecated 建议直接使用具体的 useSchemaStore / useUIStore 等。
 * 为了兼容存量代码，通过聚合提供统一入口。
 */
export const useBuilderStore = (selector?: (state: any) => any) => {
  const schema = useSchemaStore()
  const flow = useFlowStore()
  const ui = useUIStore()
  const draft = useDraftStore()

  const combined = {
    ...schema,
    ...flow,
    ...ui,
    ...draft,
    // 兼容字段名
    initSurvey: initBuilderStore,
  }

  return selector ? selector(combined) : combined
}
