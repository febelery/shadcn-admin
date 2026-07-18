/* eslint-disable react-refresh/only-export-components -- Provider, hooks, and factory form one Builder session interface. */
import { createContext, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createBuilderStore, type BuilderStore } from './store/index'
import type { BuilderState } from './store/types'

const BuilderStoreContext = createContext<BuilderStore | null>(null)

export function BuilderStoreProvider({
  store,
  children,
}: {
  store: BuilderStore
  children: ReactNode
}) {
  return <BuilderStoreContext value={store}>{children}</BuilderStoreContext>
}

export function useBuilderStore<T>(selector: (state: BuilderState) => T): T {
  return useStore(useBuilderStoreApi(), selector)
}

export function useBuilderStoreApi(): BuilderStore {
  const store = useContext(BuilderStoreContext)
  if (!store) {
    throw new Error('useBuilderStore 必须在 BuilderStoreProvider 内使用')
  }
  return store
}

export { createBuilderStore }
export type { BuilderStore } from './store/index'
export type { BuilderState } from './store/types'
