import { type SurveySchema, isQuestionNode } from '../types'
import { useDraftStore } from './draft'
import { useFlowStore } from './flow'
import { useSchemaStore } from './schema'
import { useUIStore } from './ui'

/**
 * 问卷构建器全局初始化函数
 * 负责协调整体数据流，按职责边界分发初始化指令到各个子 Store
 */
export const initializeSurveyBuilder = (data: SurveySchema) => {
  // 1. 初始化核心 Schema 状态
  useSchemaStore.getState().initSchema(data)

  // 2. 将 Schema 中的 AST 节点与 Flow 逻辑规则同步至连线系统
  useFlowStore.getState().syncElements(
    data.nodes.filter((n) => isQuestionNode(n.type)),
    data.flow || [],
    (data.extensions?.flowPositions as Record<string, { x: number; y: number }>) || {},
    data.nodes
  )

  // 3. 初始同步完成后，强制重置脏值标记（排查加载阶段的变更干扰）
  useDraftStore.getState().markSaved()
}

/**
 * 自动脏值检测订阅系统 (Reactive Dirty Monitoring)
 * 职责：监听 Schema 与 Flow 的状态演进，自动同步到草稿保存控制中心 (DraftStore)
 */

// 监听 SchemaStore：题目增删改、问卷元信息修改、扩展字段更新
useSchemaStore.subscribe((state, prevState) => {
  // 核心防御：仅在 SurveyId 稳定（非切换中）且发生实质性业务数据变更时标记为 Dirty
  if (state.surveyId !== null && prevState.surveyId === state.surveyId) {
    const isStructureChanged =
      state.nodes !== prevState.nodes ||
      state.meta !== prevState.meta ||
      state.extensions !== prevState.extensions

    if (isStructureChanged) {
      useDraftStore.getState().setDirty(true)
    }
  }
})

// 监听 FlowStore：逻辑跳转规则 (Flow Rules) 变更
useFlowStore.subscribe((state, prevState) => {
  // 仅关注逻辑规则链路的变动
  if (state.flow !== prevState.flow) {
    useDraftStore.getState().setDirty(true)
  }
})

export { useSchemaStore, useFlowStore, useUIStore, useDraftStore }
