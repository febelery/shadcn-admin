import { createContext, useContext, type ReactNode } from 'react'
import type { AIChatTransport } from './transport'

const AIChatTransportContext = createContext<AIChatTransport | null>(null)

export interface AIChatProviderProps {
  transport: AIChatTransport
  children: ReactNode
}

export type ChatProviderProps = AIChatProviderProps

export function AIChatProvider({ transport, children }: AIChatProviderProps) {
  return (
    <AIChatTransportContext.Provider value={transport}>
      {children}
    </AIChatTransportContext.Provider>
  )
}

export const ChatProvider = AIChatProvider

export function useAIChatTransport() {
  return useContext(AIChatTransportContext)
}

export const useChatTransport = useAIChatTransport
