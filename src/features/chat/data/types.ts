import type { ReactNode } from 'react'
import type { UIMessage } from 'ai'

export type Tools = {
  archiveDrafts: { input: { count: number }; output: { archived: number } }
  askQuestions: {
    input: { questions: string[] }
    output: { answers: Record<string, string> }
  }
}

export type DataParts = Record<string, never>

export type ChatMessage = UIMessage<unknown, DataParts, Tools>

export interface PromptCard {
  icon: ReactNode
  title: string
  desc: string
  prompt: string
}

export interface AttachmentItem {
  id: string
  name: string
  size?: string
  mediaType: string
  url?: string
  isImage?: boolean
}

