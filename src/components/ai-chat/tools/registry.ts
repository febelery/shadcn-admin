import { renderArchiveDraftsTool } from './archive-drafts-tool'
import { renderAskQuestionsTool } from './ask-questions-tool'
import type { ChatToolRenderer } from './types'

/**
 * 默认客户端工具卡片渲染器注册表
 *
 * 任何新的交互式工具只需要在此处映射一行，
 * 彻底消除业务特化的 Props 与条件分支。
 */
export const DEFAULT_TOOL_RENDERERS: Record<string, ChatToolRenderer> = {
  'tool-askQuestions': renderAskQuestionsTool,
  'tool-archiveDrafts': renderArchiveDraftsTool,
}
