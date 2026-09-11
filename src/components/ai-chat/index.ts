/**
 * 对外公开的 Chat 模块接缝（Public Seam）
 *
 * 遵循深模块设计原则：提供极简顶层接口，复杂的状态管理、
 * 流式消费、审批流与工具交互全部内聚在模块内部。
 */
export {
  AIChat,
  AIChatLauncher,
  Chat,
  ChatLauncher,
  type AIChatProps,
  type AIChatLauncherProps,
  type ChatProps,
  type ChatLauncherProps,
} from './ai-chat'

export {
  AIChatProvider,
  ChatProvider,
  useAIChatTransport,
  useChatTransport,
  type AIChatProviderProps,
  type ChatProviderProps,
} from './core/chat-provider'
export { useChatStore } from './core/chat-store'
export { type AIChatTransport, type ChatTransport } from './core/transport'
export {
  type ToolPartContext,
  type ChatToolRenderer,
  DEFAULT_TOOL_RENDERERS,
  renderAskQuestionsTool,
  renderArchiveDraftsTool,
} from './tools'
export { createDemoChat, createDemoTransport } from './adapters/scripted-chat'
export {
  createOpenRouterTransport,
  isOpenRouterConfigured,
  openRouterTransport,
} from './adapters/openrouter'

export type {
  ChatMessage,
  MessageMetrics,
  Tools,
  DataParts,
  AttachmentItem,
  PromptCard,
} from './core/types'
