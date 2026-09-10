import type { ChatTransport as AiSdkChatTransport } from 'ai'
import type { ChatMessage } from './types'

/**
 * 标准 AI SDK ChatTransport 接缝（Seam）
 *
 * 任何满足 AI SDK sendMessages 契约的通信适配器（离线脚本、BFF 后端、OpenRouter 等）
 * 均可直接接入该接缝，实现完全可插拔与前后端解耦。
 */
export type ChatTransport = AiSdkChatTransport<ChatMessage>
export { createSmoothStream, createSmoothTransport } from './smooth-stream'
