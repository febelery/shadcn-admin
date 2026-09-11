import { createContext, useContext, type ReactNode } from 'react'
import type { AIChatTransport } from './transport'

const AIChatTransportContext = createContext<AIChatTransport | null>(null)

export interface AIChatProviderProps {
  transport: AIChatTransport
  children: ReactNode
}

export function AIChatProvider({ transport, children }: AIChatProviderProps) {
  return (
    <AIChatTransportContext.Provider value={transport}>
      {children}
    </AIChatTransportContext.Provider>
  )
}

export function useAIChatTransport() {
  return useContext(AIChatTransportContext)
}
