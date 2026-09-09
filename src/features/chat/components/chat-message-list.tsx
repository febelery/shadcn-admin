import { useState } from 'react'
import {
  ArrowUp,
  Brain,
  ChevronDown,
  Download,
  ExternalLink,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import { Button } from '@/components/ui/button'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire'
import { PROMPT_CARDS } from '../data/scripted-chat'
import type { ChatMessage } from '../data/types'

interface ChatMessageListProps {
  messages: ChatMessage[]
  error?: Error
  onSelectPrompt: (prompt: string) => void
  onApprove: (id: string, approved: boolean) => void
  onAnswer: (id: string, answers: Record<string, string>) => void
}

/**
 * 消息流主视图模块（Deep Module）
 *
 * 内部自聚合并封装：
 * 1. 初始空状态欢迎屏与探索四宫格（ChatWelcome）
 * 2. 多模态对话气泡流（用户气泡 vs AI 回复）
 * 3. 深度思考折叠块（ReasoningBlock）
 * 4. 原型需求交互问卷卡片（QuestionnaireCard）
 * 5. 敏感工具权限审批与执行状态卡片
 */
export function ChatMessageList({
  messages,
  error,
  onSelectPrompt,
  onApprove,
  onAnswer,
}: ChatMessageListProps) {
  if (messages.length === 0) {
    return <WelcomeHero onSelectPrompt={onSelectPrompt} />
  }

  return (
    <div className='flex flex-col gap-6 pt-8 pb-6 sm:pt-10'>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onApprove={onApprove}
          onAnswer={onAnswer}
        />
      ))}

      {error && (
        <div className='text-destructive border-destructive/20 bg-destructive/5 mx-auto my-2 w-full max-w-3xl rounded-xl border px-4 py-3 text-xs'>
          {error.message}
        </div>
      )}
    </div>
  )
}

/**
 * 空状态欢迎屏与四宫格卡片（内部私有组件）
 */
function WelcomeHero({
  onSelectPrompt,
}: {
  onSelectPrompt: (prompt: string) => void
}) {
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
        {PROMPT_CARDS.map((card, idx) => (
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

function isImageMediaType(mediaType = '', filename = ''): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return (
    mediaType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)
  )
}

function formatMediaType(mediaType = ''): string {
  if (mediaType.includes('pdf')) return 'PDF 文档'
  if (mediaType.includes('json')) return 'JSON 数据'
  if (mediaType.includes('text') || mediaType.includes('plain'))
    return '文本文档'
  if (mediaType.startsWith('image/')) return '图片文件'
  return mediaType || '文件附件'
}

function FileIconBadge({
  filename = '',
  type = '',
}: {
  filename?: string
  type?: string
}) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (
    type.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)
  ) {
    return <FileImage className='size-4 text-emerald-500' />
  }
  if (type.includes('pdf') || ext === 'pdf') {
    return <FileText className='size-4 text-red-500' />
  }
  if (
    [
      'ts',
      'tsx',
      'js',
      'jsx',
      'json',
      'py',
      'go',
      'rs',
      'html',
      'css',
      'sql',
    ].includes(ext)
  ) {
    return <FileCode className='size-4 text-blue-500' />
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <FileArchive className='size-4 text-amber-500' />
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className='size-4 text-emerald-600' />
  }
  return <FileText className='text-primary size-4' />
}

/**
 * 单条消息多态渲染（内部私有组件）
 */
function MessageItem({
  message,
  onApprove,
  onAnswer,
}: {
  message: ChatMessage
  onApprove: (id: string, approved: boolean) => void
  onAnswer: (id: string, answers: Record<string, string>) => void
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    const textParts = message.parts.filter((p) => p.type === 'text')
    const fileParts = message.parts.filter((p) => p.type === 'file')

    return (
      <div className='flex w-full flex-col items-end gap-2 py-1.5'>
        {/* 用户上传的附件卡片 */}
        {fileParts.length > 0 && (
          <div className='flex max-w-[85%] flex-wrap justify-end gap-2 sm:max-w-[75%]'>
            {fileParts.map((file, idx) => {
              const isImage = isImageMediaType(file.mediaType, file.filename)
              return (
                <Attachment
                  key={idx}
                  size='sm'
                  className='bg-background/90 shadow-2xs'
                >
                  <AttachmentMedia variant={isImage ? 'image' : 'icon'}>
                    {isImage && file.url ? (
                      <img
                        src={file.url}
                        alt={file.filename}
                        className='size-full rounded-xs object-cover'
                      />
                    ) : (
                      <FileIconBadge
                        filename={file.filename}
                        type={file.mediaType}
                      />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{file.filename}</AttachmentTitle>
                    <AttachmentDescription>
                      {formatMediaType(file.mediaType)}
                    </AttachmentDescription>
                  </AttachmentContent>
                  {file.url && (
                    <AttachmentTrigger
                      render={
                        <a
                          href={file.url}
                          download={file.filename}
                          target='_blank'
                          rel='noreferrer'
                          aria-label={`查看或下载 ${file.filename}`}
                        />
                      }
                    />
                  )}
                </Attachment>
              )
            })}
          </div>
        )}

        {/* 用户文本消息气泡 */}
        {textParts.length > 0 && (
          <div className='bg-muted/80 text-foreground dark:bg-muted/50 max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-2xs sm:max-w-[75%]'>
            {textParts.map((part, index) => (
              <span key={index}>{part.text}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col py-2.5'>
      <div className='text-foreground w-full min-w-0 space-y-3 text-sm leading-relaxed'>
        {message.parts.map((part, index) => {
          if (part.type === 'text')
            return (
              <p
                key={index}
                className='text-foreground leading-7 whitespace-pre-wrap'
              >
                {part.text}
              </p>
            )
          if (part.type === 'reasoning')
            return <ReasoningBlock key={index} text={part.text} />
          if (part.type === 'file') {
            const isImage = isImageMediaType(part.mediaType, part.filename)
            return (
              <Attachment key={index} className='my-1 max-w-sm' size='default'>
                <AttachmentMedia variant={isImage ? 'image' : 'icon'}>
                  {isImage && part.url ? (
                    <img
                      src={part.url}
                      alt={part.filename}
                      className='size-full rounded-md object-cover'
                    />
                  ) : (
                    <FileIconBadge
                      filename={part.filename}
                      type={part.mediaType}
                    />
                  )}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{part.filename}</AttachmentTitle>
                  <AttachmentDescription>
                    {formatMediaType(part.mediaType)}
                  </AttachmentDescription>
                </AttachmentContent>
                {part.url && (
                  <AttachmentTrigger
                    render={
                      <a
                        href={part.url}
                        download={part.filename}
                        target='_blank'
                        rel='noreferrer'
                        aria-label={`查看或下载 ${part.filename}`}
                      />
                    }
                  />
                )}
                <AttachmentActions>
                  <AttachmentAction
                    size='icon-xs'
                    aria-label={`下载 ${part.filename}`}
                    title='下载附件'
                    onClick={(e) => {
                      e.stopPropagation()
                      if (part.url) {
                        const link = document.createElement('a')
                        link.href = part.url
                        link.download = part.filename ?? 'download'
                        link.click()
                      }
                    }}
                  >
                    <Download className='size-3' />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            )
          }
          if (part.type === 'source-url')
            return (
              <div key={index} className='flex flex-wrap gap-2 pt-1'>
                <a
                  href={part.url}
                  target='_blank'
                  rel='noreferrer'
                  className='hover:border-primary/40 hover:bg-accent/60 bg-card text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs shadow-2xs transition-colors'
                >
                  <Globe className='text-primary/70 size-3.5 shrink-0' />
                  <span className='max-w-[240px] truncate font-medium'>
                    {part.title ?? part.url}
                  </span>
                  <ExternalLink className='size-3 shrink-0 opacity-50' />
                </a>
              </div>
            )
          if (part.type === 'tool-archiveDrafts') {
            if (part.state === 'approval-requested')
              return (
                <div
                  key={index}
                  className='bg-card my-2 max-w-md space-y-3 rounded-2xl border p-4 shadow-xs'
                >
                  <div className='text-foreground flex items-center gap-2 text-xs font-semibold'>
                    <ShieldAlert className='size-4 text-amber-500' />
                    <span>敏感操作权限审批</span>
                  </div>
                  <p className='text-muted-foreground text-xs leading-relaxed'>
                    助手请求归档{' '}
                    <strong className='text-foreground'>
                      {part.input.count}
                    </strong>{' '}
                    篇草稿。该操作将更新本地数据状态，请确认是否允许执行。
                  </p>
                  <div className='flex items-center gap-2 pt-1'>
                    <Button
                      size='sm'
                      className='h-8 text-xs font-medium'
                      onClick={() => onApprove(part.approval.id, true)}
                    >
                      批准
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-8 text-xs'
                      onClick={() => onApprove(part.approval.id, false)}
                    >
                      拒绝
                    </Button>
                  </div>
                </div>
              )
            return (
              <div
                key={index}
                className='text-muted-foreground/80 bg-muted/40 my-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px]'
              >
                <Wrench className='text-muted-foreground size-3' />
                <span>工具执行: archiveDrafts ({part.state})</span>
              </div>
            )
          }
          if (
            part.type === 'tool-askQuestions' &&
            part.state === 'input-available'
          )
            return (
              <QuestionnaireCard
                key={index}
                toolCallId={part.toolCallId}
                onSubmit={onAnswer}
              />
            )
          return null
        })}
      </div>
    </div>
  )
}

/**
 * 深度思考折叠块（内部私有组件）
 */
function ReasoningBlock({
  text,
  defaultOpen = true,
}: {
  text: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className='border-border/70 bg-muted/20 my-2 max-w-2xl overflow-hidden rounded-xl border text-xs'>
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className='text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-between px-3.5 py-2 transition-colors select-none'
      >
        <div className='flex items-center gap-2 font-medium'>
          <Brain className='text-primary/80 size-3.5 animate-pulse' />
          <span>深度思考过程</span>
        </div>
        <div className='text-muted-foreground/70 flex items-center gap-1.5 text-[11px]'>
          <span>{open ? '收起' : '展开'}</span>
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>
      </button>
      {open && (
        <div className='border-border/40 bg-background/50 text-muted-foreground border-s-primary/50 border-s-2 border-t px-3.5 py-2.5 font-sans text-xs leading-relaxed whitespace-pre-wrap'>
          {text}
        </div>
      )}
    </div>
  )
}

const QUESTIONNAIRE_ITEMS = [
  {
    name: 'direction',
    required: true,
    prompt: '接下来我们应该制作什么原型？',
    description: '选择一个方向或自行输入补充说明。',
    choices: [
      { value: 'delegation', label: '任务委派 (Delegation)' },
      { value: 'questions', label: '提问引导 (Question prompts)' },
      { value: 'both', label: '两者结合 (Both together)' },
    ],
  },
  {
    name: 'detail',
    required: false,
    prompt: '需要包含多少细节？',
    description: '如果尚未确定可以跳过此题。',
    choices: [
      { value: 'focused', label: '核心聚焦 (Focused)' },
      { value: 'complete', label: '完整流程 (Complete flow)' },
    ],
  },
] as const

/**
 * 原型需求问卷卡片（内部私有组件）
 */
function QuestionnaireCard({
  toolCallId,
  onSubmit,
}: {
  toolCallId: string
  onSubmit: (id: string, answers: Record<string, string>) => void
}) {
  return (
    <div className='bg-card my-2 w-full max-w-xl rounded-2xl border p-5 shadow-xs transition-all'>
      <Questionnaire
        items={QUESTIONNAIRE_ITEMS}
        shortcuts='letters'
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          onSubmit(toolCallId, {
            direction: String(
              data.get('direction') ?? data.get('direction-input') ?? ''
            ),
            detail: String(data.get('detail') ?? ''),
          })
        }}
      >
        <div className='mb-4 flex items-center justify-between border-b pb-3'>
          <div className='flex items-center gap-2'>
            <span className='bg-primary size-2 rounded-full' />
            <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              原型需求问卷
            </span>
          </div>
          <QuestionnaireProgress className='text-muted-foreground font-mono text-xs font-medium' />
        </div>

        <QuestionnaireItem name='direction' required className='space-y-3.5'>
          <div>
            <QuestionnaireTitle className='text-foreground text-base font-semibold tracking-tight'>
              接下来我们应该制作什么原型？
            </QuestionnaireTitle>
            <QuestionnaireDescription className='text-muted-foreground mt-1 text-xs'>
              选择一个最贴近您需求的方向，或在下方输入自定义内容。
            </QuestionnaireDescription>
          </div>
          <QuestionnaireChoices className='flex flex-col gap-2.5 pt-1'>
            {QUESTIONNAIRE_ITEMS[0].choices.map((choice) => (
              <QuestionnaireChoice key={choice.value} value={choice.value}>
                {choice.label}
              </QuestionnaireChoice>
            ))}
            <QuestionnaireInput
              aria-label='其他回答'
              placeholder='输入其他自定义方向…'
              className='mt-1'
            />
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem name='detail' className='space-y-3.5'>
          <div>
            <QuestionnaireTitle className='text-foreground text-base font-semibold tracking-tight'>
              需要包含多少细节？
            </QuestionnaireTitle>
            <QuestionnaireDescription className='text-muted-foreground mt-1 text-xs'>
              定义原型的颗粒度与流程覆盖面，非必填。
            </QuestionnaireDescription>
          </div>
          <QuestionnaireChoices className='flex flex-col gap-2.5 pt-1'>
            {QUESTIONNAIRE_ITEMS[1].choices.map((choice) => (
              <QuestionnaireChoice key={choice.value} value={choice.value}>
                {choice.label}
              </QuestionnaireChoice>
            ))}
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireActions className='mt-6 border-t pt-4'>
          <div className='flex items-center gap-2'>
            <QuestionnairePrevious>上一步</QuestionnairePrevious>
            <QuestionnaireSkip>跳过此题</QuestionnaireSkip>
          </div>
          <div className='flex items-center gap-2'>
            <QuestionnaireNext>下一步</QuestionnaireNext>
            <QuestionnaireSubmit>完成并提交</QuestionnaireSubmit>
          </div>
        </QuestionnaireActions>
      </Questionnaire>
    </div>
  )
}
