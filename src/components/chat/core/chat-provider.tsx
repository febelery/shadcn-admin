import { createContext, useContext, type ReactNode } from 'react'
import type { ChatTransport } from './transport'

const ChatTransportContext = createContext<ChatTransport | null>(null)

export function ChatProvider({
  transport,
  children,
}: {
  transport: ChatTransport
  children: ReactNode
}) {
  return (
    <ChatTransportContext.Provider value={transport}>
      {children}
    </ChatTransportContext.Provider>
  )
}

export function useChatTransport() {
  return useContext(ChatTransportContext)
}
