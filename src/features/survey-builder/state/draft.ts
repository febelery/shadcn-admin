import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface DraftState {
  isDirty: boolean
  setDirty: (value: boolean) => void
  markSaved: () => void
}

export const useDraftStore = create<DraftState>()(
  immer((set) => ({
    isDirty: false,
    setDirty: (value) =>
      set((state) => {
        state.isDirty = value
      }),
    markSaved: () =>
      set((state) => {
        state.isDirty = false
      }),
  }))
)
