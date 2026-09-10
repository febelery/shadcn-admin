/**
 * 对外公开的 Chat 模块接缝（Public Seam）
 *
 * 遵循深模块设计原则：提供极简顶层接口，复杂的状态管理、
 * 流式消费、审批流与工具交互全部内聚在模块内部。
 */
export {
  Chat,
  ChatLauncher,
  type ChatProps,
  type ChatLauncherProps,
} from './chat'

export { ChatProvider, useChatTransport } from './chat-provider'
export { type ChatTransport } from './transport'
export { createDemoChat, createDemoTransport } from './scripted-chat'
export {
  createOpenRouterTransport,
  isOpenRouterConfigured,
  openRouterTransport,
} from './openrouter'

export type {
  ChatMessage,
  MessageMetrics,
  Tools,
  DataParts,
  AttachmentItem,
  PromptCard,
} from './types'
