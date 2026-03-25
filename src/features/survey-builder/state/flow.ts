import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { type FlowRule, type CrossValidation } from '../types'
import { useDraftStore } from './draft'
import { useUIStore } from './ui'

interface FlowState {
  flow: FlowRule[]
  validations: CrossValidation[]

  initFlow: (data: {
    flow?: FlowRule[]
    validations?: CrossValidation[]
  }) => void
  addRule: (rule: Omit<FlowRule, 'id'>) => void
  updateRule: (id: string, patch: Partial<FlowRule>) => void
  removeRule: (id: string) => void
}

export const useFlowStore = create<FlowState>()(
  immer((set) => ({
    flow: [],
    validations: [],

    initFlow: (data) =>
      set((state) => {
        state.flow = data.flow ?? []
        state.validations = data.validations ?? []
      }),

    addRule: (rule) =>
      set((state) => {
        state.flow.push({ ...rule, id: crypto.randomUUID() })
        useDraftStore.getState().setDirty(true)
      }),

    updateRule: (id, patch) =>
      set((state) => {
        const rule = state.flow.find((r) => r.id === id)
        if (rule) {
          Object.assign(rule, patch)
          useDraftStore.getState().setDirty(true)
        }
      }),

    removeRule: (id) =>
      set((state) => {
        state.flow = state.flow.filter((r) => r.id !== id)
        if (useUIStore.getState().activeRuleId === id) {
          useUIStore.getState().setActiveRule(null)
        }
        useDraftStore.getState().setDirty(true)
      }),
  }))
)
