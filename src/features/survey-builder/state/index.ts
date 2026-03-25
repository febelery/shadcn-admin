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
