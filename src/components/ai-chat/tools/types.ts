import type { ReactNode } from 'react'
import type { ChatMessage, Tools } from '../core/types'

export type ChatPart = ChatMessage['parts'][number]

/**
 * 聊天运行时提供给工具卡片的统一上下文
 * 基于 Vercel AI SDK 的标准工具生命周期设计
 */
export interface ToolPartContext {
  /** 提交客户端工具输出（例如问卷表单、数据筛选、确认结果） */
  addToolOutput: (args: {
    tool: keyof Tools | (string & {})
    toolCallId: string
    output: unknown
  }) => void
  /** 提交敏感操作的人工审批响应 */
  addToolApprovalResponse: (args: { id: string; approved: boolean }) => void
  /** 是否处于生成流中 */
  isGenerating: boolean
  /** 重新生成等辅助操作 */
  onRetry?: () => void
}

/**
 * 单个工具卡片的渲染器函数签名
 */
export type ChatToolRenderer<TPart = ChatPart> = (
  part: TPart,
  context: ToolPartContext
) => ReactNode
