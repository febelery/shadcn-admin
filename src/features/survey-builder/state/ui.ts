import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  type BuilderMode,
  type InspectorTarget,
  isQuestionNode,
} from '../types'
import { useFlowStore } from './flow'
import { useSchemaStore } from './schema'

interface UIState {
  builderMode: BuilderMode
  inspectorTarget: InspectorTarget
  selectedNodeId: string | null
  activeRuleId: string | null
  slashOpen: boolean
  slashAnchor: { x: number; y: number } | null

  setBuilderMode: (mode: BuilderMode) => void
  setInspectorTarget: (target: InspectorTarget) => void
  selectNode: (id: string | null) => void
  setActiveRule: (id: string | null) => void
  openSlash: (anchor: { x: number; y: number }) => void
  closeSlash: () => void
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    builderMode: 'build',
    inspectorTarget: 'survey',
    selectedNodeId: null,
    activeRuleId: null,
    slashOpen: false,
    slashAnchor: null,

    setBuilderMode: (mode) =>
      set((state) => {
        if (mode === 'flow') {
          const schema = useSchemaStore.getState()
          const flow = useFlowStore.getState()
          flow.syncElements(
            schema.nodes.filter((n) => isQuestionNode(n.type)),
            flow.flow,
            (schema.extensions.flowPositions as any) || {},
            schema.nodes
          )
        }
        state.builderMode = mode
      }),
    setInspectorTarget: (target) =>
      set((state) => {
        state.inspectorTarget = target
      }),
    selectNode: (id) =>
      set((state) => {
        state.selectedNodeId = id
        if (id) state.inspectorTarget = 'node'
      }),
    setActiveRule: (id) =>
      set((state) => {
        state.activeRuleId = id
      }),
    openSlash: (anchor) =>
      set((state) => {
        state.slashOpen = true
        state.slashAnchor = anchor
      }),
    closeSlash: () =>
      set((state) => {
        state.slashOpen = false
        state.slashAnchor = null
      }),
  }))
)
