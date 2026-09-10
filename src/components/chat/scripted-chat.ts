import { createChat } from '@shadcn/helpers/ai-sdk'
import type { ChatTransport } from './transport'
import type { ChatMessage } from './types'

/**
 * 构建预置可交互会话（包含推理、工具审批、问卷及来源引用）
 *
 * 通过 @shadcn/helpers/ai-sdk 纯前端在内存中编排会话，
 * 完全脱离模型、后端 API 路由与网络请求，无缝驱动 useChat 的完整生命周期。
 */
export function createDemoChat() {
  return (
    createChat<ChatMessage>()
      // 场景 1：能力介绍（包含深度思考推理与结构化文本）
      .user('你好，请介绍一下你能做什么。')
      .sleep(500)
      .assistant(({ writer }) => {
        writer.reasoning(
          '分析用户意图：请求系统能力全景介绍。\n梳理核心模块：多模态交互、深度思考、工具调用与权限审批、动态问卷。\n构建层次清晰的回答。'
        )
        writer.text(
          `您好！我是 **Shadcn Admin 智能助手**，基于 Vercel AI SDK 构建。

我具备以下核心交互能力：
- 🧠 **深度思考推理**：展示 Chain-of-Thought 思维链与推理步骤折叠卡片；
- 🛡️ **敏感操作人工审批**：Human-in-the-Loop 机制，关键操作需管理员授权后执行；
- 📋 **交互式需求问卷**：在对话流中嵌入交互表单，结构化收集用户选项；
- 📎 **多模态附件与来源引用**：支持图片预览、代码文件识别与外链引用跳转。

您可以点击下方的探索卡片或直接在输入框中向我提问！`
        )
      })

      // 场景 2：架构分析（包含引用来源、代码附件与详细解答）
      .user('帮我分析当前项目的架构。')
      .sleep(500)
      .assistant(({ writer }) => {
        writer.reasoning(
          '检索工程结构：React 19 + TypeScript + Vite + Tailwind CSS v4。\n识别状态与路由：TanStack Router / Query / Form。\n识别 UI 层：shadcn/ui 与 Base UI 原语。\n提取架构亮点与依赖规范。'
        )
        writer.sourceUrl({
          title: 'Shadcn UI 设计系统规范',
          url: 'https://ui.shadcn.com',
        })
        writer.file({
          filename: 'architecture-design.md',
          mediaType: 'text/markdown',
          url: 'https://ui.shadcn.com/docs',
        })
        writer.text(
          `当前项目的架构设计遵循**高内聚、深模块（Deep Module）**原则，关键分层如下：

1. **基础底座**：
   - **运行时**：React 19 + Vite + TypeScript 强类型约束；
   - **样式系统**：Tailwind CSS v4 + 语义化 CSS 变量主题；
   - **UI 原语**：深度集成 \`@base-ui/react\` 与 shadcn/ui 组件库。

2. **数据流与路由**：
   - **TanStack Router**：全链路类型安全的文件系统路由；
   - **TanStack Query**：优雅的服务端缓存与失效更新机制；
   - **TanStack Form**：动态校验策略（首次提交后响应式触发校验）。

3. **AI 架构整合**：
   - 视图层彻底收拢于 \`useChat\` 统一状态机；
   - 通信层抽象为标准 \`ChatTransport\` 接缝，支持无缝切换离线模拟流与生产后端。`
        )
      })

      // 场景 3：系统提效与敏感操作审批（Human-in-the-loop: archiveDrafts）
      .user('请告诉我如何更高效地使用这个系统。')
      .sleep(500)
      .assistant(({ writer }) => {
        writer.reasoning(
          '分析用户提效需求，扫描本地工作区状态。\n检测到 3 篇未提交的过期历史草稿，准备发起归档工具调用。\n标记该操作为敏感操作，配置 needsApproval: true 等待用户审批。'
        )
        writer.text(
          `这里有几条系统提效建议：
1. **全局快捷键**：善用 \`⌘K\` / \`Ctrl+K\` 随时调出全局命令面板；
2. **抽屉常驻**：可点击右下角悬浮入口随时展开 AI 助手协同操作；
3. **保持工作区整洁**：及时整理未发布的草稿内容。

系统检测到您有 **3** 篇长期未编辑的本地草稿，是否需要我立即为您归档？`
        )
        writer.tool('archiveDrafts', {
          input: { count: 3 },
          needsApproval: true,
          output: { archived: 3 },
        })
      })
      // 审批 Continuation：审批动作完成后触发分支流式输出
      .assistant(({ writer, toolCall }) => {
        if (toolCall?.approved) {
          writer.reasoning(
            '接收到人工授权批准，执行归档草稿事务，更新数据索引...'
          )
          writer.text(
            '✅ **操作成功**：已为您安全归档 3 篇草稿。本地工作区已恢复清爽！'
          )
        } else {
          writer.reasoning('用户拒绝了归档授权，终止操作，保留现状。')
          writer.text('已取消草稿归档操作。草稿依然完好保留在您的草稿箱中。')
        }
      })

      // 场景 4：需求问卷引导（Client-executed Tool: askQuestions）
      .user('我需要一些帮助。')
      .sleep(500)
      .assistant(({ writer }) => {
        writer.reasoning(
          '用户请求协助，但需求细节尚不明确。\n决定下发结构化问卷卡片收集原型设计方向与细节颗粒度。'
        )
        writer.text(
          '没问题！为了更精准地给您提供原型与技术方案支持，请填写下方简短的需求问卷：'
        )
        writer.tool('askQuestions', {
          input: {
            questions: ['接下来我们应该制作什么原型？', '需要包含多少细节？'],
          },
        })
      })
      // 问卷 Continuation：用户提交答案后触发
      .assistant(({ writer, toolCall }) => {
        const output = toolCall?.output as
          { answers?: Record<string, string> } | undefined
        const answers = output?.answers
        const directionMap: Record<string, string> = {
          delegation: '任务委派 (Delegation)',
          questions: '提问引导 (Question prompts)',
          both: '两者结合 (Both together)',
        }
        const direction =
          (answers?.direction && directionMap[answers.direction]) ||
          answers?.direction ||
          '自定义方向'
        const detail =
          answers?.detail === 'complete'
            ? '完整流程 (Complete flow)'
            : '核心聚焦 (Focused)'

        writer.reasoning(
          `解析用户问卷结果：方向=${direction}，细节=${detail}。\n准备制定落地计划。`
        )
        writer.text(
          `已收到您的问卷反馈！我们将以 **${direction}** 为核心方向，按照 **${detailLabel(detail)}** 颗粒度为您规划原型与流程实现方案。`
        )
      })
  )
}

function detailLabel(detail: string) {
  return detail.includes('完整') ? '全流程全要素' : '精简核心聚焦'
}

/**
 * 创建离线预置会话 Transport
 *
 * 当用户输入非预设问题时，自动通过 fallback 给出动态思考与回答，确保交互不断流。
 */
export function createDemoTransport(options?: {
  delayMs?: number
}): ChatTransport {
  const chat = createDemoChat()

  return chat.transport({
    delayMs: options?.delayMs ?? 30,
    fallback: ({ writer, messages }) => {
      const lastUserMessage = messages[messages.length - 1]
      const userText =
        lastUserMessage?.parts
          ?.filter((part) => part.type === 'text')
          ?.map((part) => (part as { text: string }).text)
          ?.join(' ')
          .trim() || ''

      writer.sleep(400)
      writer.reasoning(
        `用户输入了非预置提问：“${userText.slice(0, 50)}”。\n检索知识库并使用智能兜底模板生成连贯回答。`
      )
      writer.text(
        `收到您的问题：“**${userText || '未命名提问'}**”。\n\n当前 AI 模块正运行在 **@shadcn/helpers/ai-sdk** 本地预置会话模式中。该模式无需 API Key 或网络连通，完整遵循 Vercel AI SDK 的 \`useChat\` 协议驱动。\n\n建议体验预设的四项交互能力：\n1. 点击“开始探索”查看能力介绍；\n2. 点击“架构讨论”查看 Markdown、来源与附件展示；\n3. 点击“获取帮助”体验交互式问卷（askQuestions）；\n4. 发送“请告诉我如何更高效地使用这个系统”体验权限审批（archiveDrafts）。`
      )
    },
  })
}
