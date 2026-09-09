import { createChat } from '@shadcn/helpers/ai-sdk'
import { Bot, FileText, ShieldAlert, Sparkles } from 'lucide-react'
import type { ChatMessage, PromptCard } from './types'

export const scriptedChat = createChat<ChatMessage>()
  .assistant(({ writer }) => {
    writer.reasoning(
      '初始化离线交互沙箱。预载入多模态解析器、工具审批流与快捷键知识库...'
    )
    writer.text(
      '👋 你好！我是内置的智能助手。当前运行在纯前端离线交互演示环境中。\n\n你可以向我提问技术架构、上传附件（图片/代码/文档）体验多模态渲染，或是点击下方的快捷卡片探索富交互能力。'
    )
  })
  .user('帮我选择一个方向。')
  .assistant(({ writer }) => {
    writer.reasoning(
      '检测到需求决策意图。启动交互式问卷引导组件，帮助用户收敛开发方向与需求边界。'
    )
    writer.text('请回答这份简短的问卷，我将为你量身定制原型路线：')
    writer.tool('askQuestions', {
      input: { questions: ['direction', 'detail'] },
    })
  })
  .assistant(({ writer, toolCall }) => {
    const output = toolCall?.output as
      | { answers?: Record<string, string> }
      | undefined
    writer.reasoning('已获取问卷填写结果，正在生成专属建议报告...')
    writer.text(
      output?.answers?.direction
        ? `🎯 太棒了！已根据你的偏好锁定「**${output.answers.direction}**」方向。\n\n接下来建议优先拆解核心流程并建立设计规范，有任何细节随时告诉我。`
        : '问卷已提交，准备好后随时开启具体方向的探讨。'
    )
  })
  .user('这个版本更新了什么？')
  .assistant(({ writer }) => {
    writer.reasoning(
      '检索版本变更日志：梳理键盘无障碍支持、富文本流式渲染器、附件预览与安全审批模块。'
    )
    writer.text(
      `### 🚀 平台新特性速览\n\n- **沉浸式对话流**：全面升级流式消息渲染，支持思考过程（Reasoning）、代码高亮与动态工具交互。\n- **多模态附件组件**：无缝支持拖拽/点击上传图片缩略图、PDF、代码及压缩包，与输入框联动。\n- **键盘操作优化**：支持 \`⌘K\` 全局唤起、\`Enter\` 发送、\`Shift + Enter\` 换行与 \`Esc\` 快速中断。\n- **安全敏感审批**：涉及删除、批量归档等高危操作时，强制触发人工确认。`
    )
    writer.sourceUrl({
      title: 'AI SDK 辅助文档与设计规范 (shadcn)',
      url: 'https://ui.shadcn.com/docs',
    })
  })
  .user('查看快捷键列表。')
  .assistant(({ writer }) => {
    writer.reasoning('正在组织常用快捷键对照表与操作提示...')
    writer.text(
      `为你整理了日常开发最常用的快捷键：\n\n| 快捷键 | 功能描述 |\n| :--- | :--- |\n| \`⌘ + K\` / \`Ctrl + K\` | 打开全局搜索 / 命令面板 |\n| \`Enter\` | 发送当前输入内容 |\n| \`Shift + Enter\` | 文本框换行输入 |\n| \`Escape\` | 停止当前流式生成 |\n\n已将完整的对照说明打包为附件，你可以直接点击下方卡片下载保存。`
    )
    writer.file({
      filename: '快捷键完整操作指南.txt',
      mediaType: 'text/plain',
      url: 'data:text/plain;charset=utf-8,⌘K: 打开全局搜索\nEnter: 发送消息\nShift+Enter: 换行\nEscape: 终止流式响应\n',
    })
  })
  .user('归档我的 3 篇草稿。')
  .assistant(({ writer }) => {
    writer.reasoning('安全策略守卫拦截：归档操作具备不可逆倾向，启动敏感操作审批链条。')
    writer.text('⚠️ 检测到敏感操作：即将归档 3 篇草稿，执行前需要你的确认。')
    writer.tool('archiveDrafts', {
      input: { count: 3 },
      needsApproval: true,
      output: { archived: 3 },
    })
  })
  .assistant(({ writer, toolCall }) => {
    const output = toolCall?.output as { archived?: number } | undefined
    if (toolCall?.approved) {
      writer.reasoning('用户已通过审批，执行归档任务并刷新状态。')
      writer.text(`✅ **操作已完成** — 成功归档 ${output?.archived ?? 3} 篇草稿文件。`)
    } else if (toolCall?.denied) {
      writer.reasoning('用户拒绝授权操作，已安全撤销并恢复前序上下文。')
      writer.text('🚫 **操作已取消** — 已拒绝此次敏感审批，未归档任何草稿。')
    } else {
      writer.text('随时告诉我你希望执行的操作。')
    }
  })

export const PROMPT_CARDS: PromptCard[] = [
  {
    icon: <Sparkles className='size-4' />,
    title: '版本新特性速览',
    desc: '了解富文本消息、思考过程与快捷键支持',
    prompt: '这个版本更新了什么？',
  },
  {
    icon: <Bot className='size-4' />,
    title: '交互式问卷引导',
    desc: '通过结构化问卷定制专属原型开发方向',
    prompt: '帮我选择一个方向。',
  },
  {
    icon: <FileText className='size-4' />,
    title: '键盘快捷键指南',
    desc: '查看常用键盘快捷键与高效操作技巧',
    prompt: '查看快捷键列表。',
  },
  {
    icon: <ShieldAlert className='size-4 text-amber-500' />,
    title: '敏感操作审批流',
    desc: '体验敏感工具调用的人工介入确认与审批',
    prompt: '归档我的 3 篇草稿。',
  },
]

// ============================================================================
// 丰富多样的离线智能回复与随机应答引擎 (Offline Dynamic Simulation Engine)
// ============================================================================

type ChatFallbackFn = Extract<
  NonNullable<
    NonNullable<Parameters<typeof scriptedChat.transport>[0]>['fallback']
  >,
  (...args: any[]) => unknown
>
type FallbackContext = Parameters<ChatFallbackFn>[0]
type ScriptedWriter = FallbackContext['writer']

/**
 * 从数组中随机选取一项
 */
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * 针对附件的分析与回复策略
 */
function handleAttachmentResponses(
  writer: ScriptedWriter,
  files: Array<{ filename?: string; mediaType: string }>
) {
  const fileNames = files.map((f) => f.filename || '未命名附件').join('、')
  const hasImage = files.some(
    (f) =>
      f.mediaType.startsWith('image/') ||
      /\.(png|jpe?g|webp|svg|gif)$/i.test(f.filename || '')
  )
  const hasCode = files.some(
    (f) =>
      f.mediaType.includes('code') ||
      /\.(ts|tsx|js|jsx|json|py|go|rs|sql|html|css)$/i.test(f.filename || '')
  )

  if (hasImage) {
    writer.reasoning(
      `正在对用户上传的图像文件 [${fileNames}] 执行多模态解析。分析画面色彩对比度、排版网格、无障碍可读性以及视觉平衡...`
    )
    const replies = [
      `🖼️ **已接收并解析图片附件**：\`${fileNames}\`\n\n从视觉分析来看：\n1. **构图与间距**：视觉层级清晰，主体元素居中度良好；\n2. **色彩搭配**：明度与饱和度处于舒适区间，建议在关键交互区域增加 4.5:1 以上的对比度保证可访问性；\n3. **响应式建议**：若在小屏幕（Mobile）中展示，可考虑将宽画幅布局转为上下单列堆叠。`,
      `✨ **图像分析完成**：\`${fileNames}\`\n\n- **色彩与层级**：主次关系分明，视觉焦点集中。\n- **设计建议**：如果是 UI 页面，建议遵循 8px 网格基线进行统一规范，并对关键点击区域预留至少 44×44px 的触摸热区。`,
    ]
    writer.text(pickRandom(replies))
    return
  }

  if (hasCode) {
    writer.reasoning(
      `正在对代码文件 [${fileNames}] 进行静态语义与架构分析。评估模块解耦、类型健壮性与边界分支覆盖...`
    )
    writer.text(
      `💻 **已解析代码文件**：\`${fileNames}\`\n\n审查意见摘要：\n- **类型安全**：建议开启 \`strict\` 模式，尽量避免隐式 \`any\`；\n- **关注点分离**：可将业务状态处理与视图渲染进一步解耦为自定义 Hook；\n- **错误边界**：针对异步调用或外部输入补充防御性验证（如 Zod 或校验守卫）。`
    )
    return
  }

  writer.reasoning(
    `正在解析文档类附件 [${fileNames}]。提取文档关键段落、元数据结构与条目清单...`
  )
  writer.text(
    `📄 **已成功加载文档**：\`${fileNames}\`\n\n文档解析正常，已提取关键结构。你可以继续输入针对该文件的具体处理指令（如：总结要点、提取表格、翻译或格式转换）。`
  )
}

/**
 * 丰富的通用语义与随机应答库
 */
export function scriptedChatFallback({
  writer,
  messages,
}: FallbackContext) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  const userText =
    lastUserMsg?.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('\n')
      .trim() ?? ''

  const userFiles =
    (lastUserMsg?.parts.filter(
      (p) => p.type === 'file'
    ) as Array<{ filename?: string; mediaType: string }> | undefined) ?? []

  // 1. 若用户上传了附件，优先提供附件多模态响应
  if (userFiles.length > 0) {
    handleAttachmentResponses(writer, userFiles)
    return
  }

  // 2. 问候与身份意图
  if (/^(你好|您好|hi|hello|在吗|是谁|介绍|help|帮助)/i.test(userText)) {
    const greetings = [
      {
        reason: '识别为问候与初次破冰意图。生成亲切专业且兼具探索引导的助手回复。',
        content:
          '👋 **你好！很高兴与你交流。**\n\n我是你的智能研发与设计助手。在这个离线交互沙箱中，我能够为你演示：\n\n- 🧩 **组件与代码编写**：React 状态管理、Tailwind 布局与最佳实践；\n- 📎 **多模态附件体验**：支持拖拽或点击上传图片、代码文件及文档；\n- 🛡️ **交互式审批流**：体验敏感权限拦截与人工审批协同；\n- ⚡ **深度思考推理**：展示完整透明的思维链与方案权衡过程。\n\n有什么我可以协助你的？你可以随意输入任何问题，也可以点击下方的探索卡片。',
      },
      {
        reason: '用户打招呼。展示多能力矩阵并保持响应的精炼活泼。',
        content:
          '嗨！今天想做点什么？\n\n无论是讨论前端架构、重构代码组件、分析设计稿，还是体验问卷引导，我都在这里随时配合你。输入你的想法，或者丢一个文件给我试试看吧！',
      },
    ]
    const chosen = pickRandom(greetings)
    writer.reasoning(chosen.reason)
    writer.text(chosen.content)
    return
  }

  // 3. 前端与代码相关
  if (
    /(react|vue|component|hook|ts|typescript|tailwind|css|代码|重构|架构|性能)/i.test(
      userText
    )
  ) {
    const codeReplies = [
      {
        reason:
          '检测到前端架构与代码实现相关探讨。从关注点分离、高内聚低耦合以及组件可组合性（Composition）展开推导...',
        content: `针对前端架构与组件化设计，现代工程通常遵循以下几条核心演进原则：\n\n### 1. 组合优于继承 (Composition over Inheritance)\n将大型组件按职责切分为受控呈现层（Presentational）与无状态逻辑层，充分运用 Compound Components 或 Slot 插槽模式：\n\n\`\`\`tsx\n// 采用 Compound 模式提供灵活的声明式 API\n<Card>\n  <Card.Header title="项目概览" />\n  <Card.Body>{children}</Card.Body>\n  <Card.Footer actions={<Button>确认</Button>} />\n</Card>\n\`\`\`\n\n### 2. 状态下沉与局部作用域\n尽量避免将瞬态局部状态（如输入防抖、下拉浮层开关）提升到全局 Store，借助 Context 或微状态库保持组件自洽。\n\n### 3. 类型契约先行\n优先通过 TypeScript 定义不可变数据结构，配合 Discriminated Unions 消除非法状态组合。`,
      },
      {
        reason:
          '分析前端性能优化与渲染瓶颈。从 DOM 虚拟化、资源加载与重绘开销三维度制定策略...',
        content: `⚡ **前端性能与渲染优化指南**\n\n1. **虚拟化长列表**：针对超过 50 项的复杂列表，采用 \`@tanstack/react-virtual\` 仅渲染视口范围内的 DOM 节点；\n2. **稳定引用与防范无效重渲染**：精确规划依赖数组，对复杂计算采用 \`useMemo\`，对深层回调传递保持 \`useCallback\` 引用稳定；\n3. **按需分割 (Code Splitting)**：页面路由层与大型第三方依赖（如富文本编辑器、图表库）采用动态 \`lazy()\` 延迟载入。`,
      },
    ]
    const chosen = pickRandom(codeReplies)
    writer.reasoning(chosen.reason)
    writer.text(chosen.content)
    return
  }

  // 4. 设计与 UI/UX 相关
  if (/(ui|ux|设计|样式|配色|布局|间距|字体)/i.test(userText)) {
    const designReplies = [
      {
        reason:
          '剖析现代 Design System 的 Token 规范，推导高灵活性与统一视觉规范的平衡点...',
        content: `🎨 **现代 Design System 核心实践**\n\n- **语义化 Design Tokens**：避免直接使用具体色值（如 \`#3b82f6\`），统一映射为语义层 \`var(--primary)\`、\`var(--muted)\` 与 \`var(--destructive)\`，实现一键无缝适配深色/浅色模式。\n- **8pt 间距韵律**：所有 padding、margin 及圆角均基于 4px / 8px 梯级递进，构建自然的视线流动。\n- **微交互与无障碍（a11y）**：为所有可交互控件提供明确的 \`:focus-visible\` 焦点环，保障键盘导航顺畅。`,
      },
      {
        reason:
          '探讨界面排版层次与视觉降噪。如何通过字阶和灰阶建立清晰的阅读重心...',
        content: `📐 **界面视觉层次与降噪建议**\n\n1. **少即是多**：通过留白（Whitespace）而不是过度的边框线条进行模块划分；\n2. **字阶层次（Typography）**：严格控制页面中的字号层级在 3~4 种以内（如 24px 标题 / 14px 正文 / 12px 辅助注记）；\n3. **次级信息弱化**：将非关键说明文本赋予 \`text-muted-foreground\`，让用户的首要视线停留在主操作流程上。`,
      },
    ]
    const chosen = pickRandom(designReplies)
    writer.reasoning(chosen.reason)
    writer.text(chosen.content)
    return
  }

  // 5. 通用兜底随机应答池（提供富有启发性、深度思考与结构化的回答）
  const generalReplies = [
    {
      reason: `深度拆解用户提问：「${userText.slice(0, 30)}${userText.length > 30 ? '...' : ''}」。从核心痛点诊断、分阶段行动路径与潜在边界风险三个维度构建系统性解答...`,
      content: `对于你提出的这个问题，我们可以从系统化工程的角度进行分解与探讨：\n\n### 💡 核心要点剖析\n在复杂的业务场景中，关键往往在于**明确边界、拆解瓶颈、以最小可行性方案（MVP）快速闭环**。\n\n### 🛠️ 推荐实施路径\n1. **第一阶段：需求收敛与现状摸底** — 明确关键评估指标与成功度量标准；\n2. **第二阶段：模块解耦与方案验证** — 优先验证风险最高的不确定性环节；\n3. **第三阶段：规范固化与持续度量** — 建立自动化回归与监控指标。\n\n> 💬 如果你有更具体的代码片段或场景细节，可以继续发给我，我们进一步展开推演！`,
    },
    {
      reason: `从技术决策与权衡矩阵出发。评估实现成本、扩展弹性以及团队心智负担的帕累托最优解...`,
      content: `这是一个非常值得探讨的话题。任何优秀的技术或产品方案，本质上都是在**工程复杂度**与**开发体验**之间寻找平衡点：\n\n- **方案收益**：结构更清晰、协作摩擦更低、长期维护边际成本下降；\n- **潜在代价**：前期需要投入设计规范制定与抽象封装成本；\n- **建议原则**：遵循 **KISS（保持简洁）** 与 **YAGNI（不要过早过度设计）**，随业务复杂度自然演进而非预设冗余。\n\n你也可以尝试上传相关代码或截图，我来为你提供针对性的重构或优化建议。`,
    },
    {
      reason:
        '建立多角度对比分析视角。从短期收益与长期架构稳健性推导出具体行动项...',
      content: `针对你的探讨，建议重点关注以下几个落地点：\n\n1. **用户体验视角**：确保交互反馈即时、直观，异常分支具备优雅降级策略；\n2. **代码质量视角**：保持函数单一职责，减少隐式全局副作用；\n3. **演进可测性**：核心纯逻辑提取为独立模块，方便单元测试覆盖。\n\n你可以点击下方卡片体验问卷引导、快捷键或审批流，或者随时提出下一个话题！`,
    },
  ]

  const chosen = pickRandom(generalReplies)
  writer.reasoning(chosen.reason)
  writer.text(chosen.content)
}

