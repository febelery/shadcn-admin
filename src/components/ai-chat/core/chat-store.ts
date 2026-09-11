import { create } from 'zustand'
import type { ChatMessage, MessageMetrics } from './types'

export interface ChatSession {
  messages: ChatMessage[]
  input: string
  metrics: Record<string, MessageMetrics>
}

interface ChatState {
  sessions: Record<string, ChatSession>
  setMessages: (sessionId: string, messages: ChatMessage[]) => void
  setInput: (sessionId: string, input: string) => void
  setMetrics: (
    sessionId: string,
    metrics: Record<string, MessageMetrics>
  ) => void
  reset: (sessionId: string) => void
}

/** Application-level session state shared by page and launcher views. */
export const useChatStore = create<ChatState>((set) => ({
  sessions: {},
  setMessages: (sessionId, messages) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...(state.sessions[sessionId] ?? emptySession),
          messages,
        },
      },
    })),
  setInput: (sessionId, input) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...(state.sessions[sessionId] ?? emptySession), input },
      },
    })),
  setMetrics: (sessionId, metrics) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...(state.sessions[sessionId] ?? emptySession),
          metrics,
        },
      },
    })),
  reset: (sessionId) =>
    set((state) => ({
      sessions: { ...state.sessions, [sessionId]: emptySession },
    })),
}))

const emptySession: ChatSession = { messages: [], input: '', metrics: {} }
