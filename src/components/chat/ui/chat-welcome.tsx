import { ArrowUp, Brain, FileText, ShieldAlert, Sparkles } from 'lucide-react'

export interface PromptCardItem {
  icon: React.ReactNode
  title: string
  desc: string
  prompt: string
}

export const DEFAULT_PROMPT_CARDS: PromptCardItem[] = [
  {
    icon: <Sparkles className='size-4' />,
    title: '开始探索',
    desc: '向 AI 助手提出任何问题',
    prompt: '你好，请介绍一下你能做什么。',
  },
  {
    icon: <Brain className='size-4' />,
    title: '架构讨论',
    desc: '一起分析产品与技术方案',
    prompt: '帮我分析当前项目的架构。',
  },
  {
    icon: <FileText className='size-4' />,
    title: '内容总结',
    desc: '总结、改写或解释复杂内容',
    prompt: '请告诉我如何更高效地使用这个系统。',
  },
  {
    icon: <ShieldAlert className='size-4 text-amber-500' />,
    title: '获取帮助',
    desc: '解决你正在遇到的问题',
    prompt: '我需要一些帮助。',
  },
]

export interface ChatWelcomeProps {
  onSelectPrompt: (prompt: string) => void
  cards?: PromptCardItem[]
}

/**
 * 初始空状态欢迎屏与四宫格探索卡片
 */
export function ChatWelcome({
  onSelectPrompt,
  cards = DEFAULT_PROMPT_CARDS,
}: ChatWelcomeProps) {
  return (
    <div className='my-auto flex flex-1 flex-col items-center justify-center py-10 text-center'>
      {/* 欢迎主标与副标 */}
      <h2 className='text-foreground text-2xl font-semibold tracking-tight sm:text-3xl'>
        今天有什么我可以帮你的？
      </h2>
      <p className='text-muted-foreground mt-2 max-w-md text-xs leading-relaxed sm:text-sm'>
        支持深度思考推理、交互式问卷引导、来源引用与敏感操作人工审批。
      </p>

      {/* 四宫格探索卡片 */}
      <div className='mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-2'>
        {cards.map((card, idx) => (
          <button
            key={idx}
            type='button'
            onClick={() => onSelectPrompt(card.prompt)}
            className='hover:border-primary/40 hover:bg-accent/40 group bg-card/60 flex cursor-pointer flex-col justify-between gap-3 rounded-xl border p-4 text-left shadow-2xs transition-all hover:shadow-xs'
          >
            <div className='flex w-full items-start justify-between gap-2'>
              <div className='bg-primary/10 text-primary ring-primary/20 flex size-8 items-center justify-center rounded-lg ring-1'>
                {card.icon}
              </div>
              <ArrowUp className='text-muted-foreground/40 group-hover:text-primary size-3.5 -rotate-45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
            </div>
            <div>
              <div className='text-foreground text-xs font-medium sm:text-sm'>
                {card.title}
              </div>
              <p className='text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed'>
                {card.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
