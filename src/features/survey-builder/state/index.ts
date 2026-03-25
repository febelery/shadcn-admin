import { type SurveySchema, isQuestionNode } from '../types'
import { useDraftStore } from './draft'
import { useFlowStore } from './flow'
import { useSchemaStore } from './schema'
import { useUIStore } from './ui'

/**
 * 根初始化函数：同步初始化所有职责 Store
 */
export const initBuilderStore = (data: SurveySchema) => {
  useSchemaStore.getState().initSchema(data)
  // 同步初始化 Flow 状态
  useFlowStore.getState().syncElements(
    data.nodes.filter((n) => isQuestionNode(n.type)),
    data.flow || [],
    (data.extensions?.flowPositions as any) || {},
    data.nodes
  )
  useDraftStore.getState().markSaved()
}

// 导出所有子 Store
export { useSchemaStore, useFlowStore, useUIStore, useDraftStore }
