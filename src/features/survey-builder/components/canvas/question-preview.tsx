'use client'
import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionNode, NodeType } from '@/features/survey-builder/types'

type PreviewProps = { node: QuestionNode }

// ─── 1. 基础题型预览组件 ────────────────────────────────────

const ChoicePreview: React.FC<PreviewProps> = ({ node }) => {
  const opts = node.config.options ?? []
  const isMulti = node.type === 'multiple_choice'
  return (
    <div className='flex flex-col gap-1'>
      {opts.slice(0, 5).map((opt) => (
        <div
          key={opt.id}
          className='text-muted-foreground/70 flex items-center gap-2 text-xs'
        >
          <span
            className={cn(
              'border-border/50 h-3.5 w-3.5 shrink-0 border',
              isMulti ? 'rounded-[3px]' : 'rounded-full'
            )}
          />
          <span className='truncate'>{opt.label}</span>
        </div>
      ))}
      {opts.length > 5 && (
        <span className='text-muted-foreground/40 pl-5 text-[10px]'>
          +{opts.length - 5} 个选项
        </span>
      )}
      {opts.length === 0 && (
        <span className='text-muted-foreground/30 text-[11px] italic'>
          暂无选项，点击卡片添加...
        </span>
      )}
    </div>
  )
}

const DropdownPreview: React.FC<PreviewProps> = () => (
  <div className='border-border/35 bg-muted/30 text-muted-foreground/40 flex h-7 items-center justify-between rounded-md border px-2.5 text-xs'>
    <span>请选择...</span>
    <span className='text-[10px]'>▾</span>
  </div>
)

const RankingPreview: React.FC<PreviewProps> = ({ node }) => {
  const opts = node.config.options ?? []
  const displayOpts =
    opts.length > 0
      ? opts
      : [
          { id: '1', label: '选项 A' },
          { id: '2', label: '选项 B' },
        ]
  return (
    <div className='flex flex-col gap-1'>
      {displayOpts.slice(0, 3).map((opt: any, i: number) => (
        <div
          key={opt.id}
          className='border-border/30 bg-muted/20 flex items-center gap-2 rounded border px-2 py-1 text-xs'
        >
          <span className='text-muted-foreground/40 font-mono text-[10px] font-bold'>
            {i + 1}
          </span>
          <span className='text-muted-foreground/70 flex-1'>{opt.label}</span>
          <span className='text-muted-foreground/25'>⋮⋮</span>
        </div>
      ))}
    </div>
  )
}

const ImageChoicePreview: React.FC<PreviewProps> = ({ node }) => {
  const opts = node.config.options ?? []
  const displayOpts =
    opts.length > 0
      ? opts
      : [
          { id: '1', label: '选项A' },
          { id: '2', label: '选项B' },
          { id: '3', label: '选项C' },
        ]
  return (
    <div className='grid grid-cols-3 gap-1.5'>
      {displayOpts.slice(0, 3).map((opt: any) => (
        <div
          key={opt.id}
          className='border-border/30 bg-muted/20 flex flex-col items-center gap-1 rounded-md border p-1.5'
        >
          <div className='bg-muted/60 h-10 w-full rounded' />
          <span className='text-muted-foreground/60 text-[10px]'>
            {opt.label}
          </span>
        </div>
      ))}
    </div>
  )
}

const InputPreview: React.FC<PreviewProps> = ({ node }) => (
  <div
    className={cn(
      'border-border/35 bg-muted/25 text-muted-foreground/35 flex items-center rounded-md border px-2.5 text-xs',
      node.type === 'textarea' ? 'h-14 items-start p-2.5' : 'h-7'
    )}
  >
    {node.type === 'number' ? '0' : '请输入...'}
  </div>
)

const FillInPreview: React.FC<PreviewProps> = () => (
  <p className='text-muted-foreground/60 text-xs leading-relaxed'>
    请在以下括号内填写答案：（
    <span className='border-muted-foreground/30 inline-block min-w-20 border-b align-bottom' />
    ）
  </p>
)

const DateTimePreview: React.FC<PreviewProps> = ({ node }) => {
  const isDate = node.type.startsWith('date')
  const isRange = node.type.endsWith('range')
  return (
    <div className='border-border/35 bg-muted/25 text-muted-foreground/40 flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs'>
      <span>{isDate ? '📅' : '🕐'}</span>
      {isDate
        ? isRange
          ? '开始日期 — 结束日期'
          : 'YYYY / MM / DD'
        : isRange
          ? 'HH:MM — HH:MM'
          : 'HH : MM'}
    </div>
  )
}

const RatingPreview: React.FC<PreviewProps> = ({ node }) => {
  const count = node.config.starCount ?? 5
  const shape = (node.config as any).starShape ?? 'star'
  const filled = Math.ceil(count / 2)
  const icons: Record<string, string> = {
    star: '★',
    heart: '♥',
    thumb: '👍',
    circle: '●',
  }
  return (
    <div className='flex items-center gap-1'>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            'text-lg leading-none transition-colors',
            i < filled ? 'text-amber-400/70' : 'text-muted-foreground/15'
          )}
        >
          {icons[shape] || '★'}
        </span>
      ))}
    </div>
  )
}

const NpsPreview: React.FC<PreviewProps> = () => (
  <div>
    <div className='flex gap-0.5'>
      {Array.from({ length: 11 }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex flex-1 items-center justify-center rounded py-1 font-mono text-[10px] font-semibold',
            i <= 6
              ? 'bg-red-50 text-red-400/80 dark:bg-red-950/30'
              : i <= 8
                ? 'bg-amber-50 text-amber-500/80 dark:bg-amber-950/30'
                : 'bg-green-50 text-green-500/80 dark:bg-green-950/30'
          )}
        >
          {i}
        </div>
      ))}
    </div>
    <div className='text-muted-foreground/40 mt-1 flex justify-between text-[9px]'>
      <span>极不推荐</span>
      <span>极力推荐</span>
    </div>
  </div>
)

const MatrixPreview: React.FC<PreviewProps> = ({ node }) => {
  const rows = node.config.rows ?? []
  const cols = node.config.columns ?? []
  const showRows = rows.slice(0, 3)
  const showCols = cols.slice(0, 4)
  const isMulti = node.type === 'matrix_multiple'

  if (!showRows.length || !showCols.length) {
    return (
      <div className='border-border/30 text-muted-foreground/40 rounded-md border p-3 text-center text-xs'>
        {rows.length} 行 × {cols.length} 列（点击卡片编辑）
      </div>
    )
  }

  return (
    <div className='border-border/30 overflow-hidden rounded-md border text-[10px]'>
      <div className='bg-muted/50 flex'>
        <div className='border-border/25 w-20 shrink-0 border-r p-1.5' />
        {showCols.map((c) => (
          <div
            key={c.id}
            className='border-border/25 text-muted-foreground/60 flex-1 truncate border-r p-1.5 text-center'
          >
            {c.label}
          </div>
        ))}
      </div>
      {showRows.map((r) => (
        <div key={r.id} className='border-border/25 flex border-t'>
          <div className='border-border/25 text-muted-foreground/60 w-20 shrink-0 truncate border-r p-1.5'>
            {r.label}
          </div>
          {showCols.map((c) => (
            <div
              key={c.id}
              className='border-border/25 flex flex-1 items-center justify-center border-r py-1.5'
            >
              <span
                className={cn(
                  'border-border/40 h-3 w-3 border',
                  isMulti ? 'rounded-sm' : 'rounded-full'
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const FileUploadPreview: React.FC<PreviewProps> = () => (
  <div className='border-border/35 text-muted-foreground/40 flex h-14 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed text-xs'>
    <span className='text-base'>📎</span>
    <span>点击或拖拽文件至此</span>
  </div>
)

const SignaturePreview: React.FC<PreviewProps> = () => (
  <div className='border-border/35 bg-muted/15 flex h-16 items-center justify-center rounded-md border'>
    <span className='text-muted-foreground/30 text-sm'>✍️ 电子签名区域</span>
  </div>
)

const GeoPreview: React.FC<PreviewProps> = () => (
  <div className='bg-muted/25 text-muted-foreground/40 flex h-14 items-center justify-center gap-2 rounded-md text-xs'>
    <span>📍</span>
    <span>点击获取当前位置</span>
  </div>
)

const RepeaterPreview: React.FC<PreviewProps> = ({ node }) => (
  <div className='space-y-1.5'>
    <div className='border-border/30 bg-muted/20 text-muted-foreground/60 rounded border p-2 text-xs'>
      第 1 条记录（示例行）
    </div>
    <div className='text-primary/70 flex items-center gap-1 text-[11px] font-medium'>
      <Plus className='h-3 w-3' />
      {node.config.addLabel ?? '添加一条'}
    </div>
  </div>
)

const ContainerPreview: React.FC<PreviewProps> = ({ node }) => (
  <div className='border-border/30 bg-muted/20 text-muted-foreground/50 rounded-md border p-2 text-xs'>
    {node.type === 'group' && '题组容器 — 可包含多道子题'}
    {node.type === 'sub_question' && '父题答案触发现开'}
    {node.type === 'linked_choice' && '选项来源于另一道题的答案'}
  </div>
)

const RichTextPreview: React.FC<PreviewProps> = () => (
  <div className='border-border/25 bg-muted/15 text-muted-foreground/50 rounded-md border px-3 py-2 text-xs leading-relaxed'>
    富文本说明区域 — 支持加粗、链接等格式
  </div>
)

// ─── 2. 注册表 ───────────────────────────────────────────────

const PREVIEW_REGISTRY: Partial<
  Record<NodeType, React.FC<{ node: QuestionNode }>>
> = {
  single_choice: ChoicePreview,
  multiple_choice: ChoicePreview,
  dropdown: DropdownPreview,
  ranking: RankingPreview,
  image_choice: ImageChoicePreview,
  text: InputPreview,
  textarea: InputPreview,
  number: InputPreview,
  fill_in: FillInPreview,
  date: DateTimePreview,
  date_range: DateTimePreview,
  time: DateTimePreview,
  time_range: DateTimePreview,
  rating: RatingPreview,
  nps: NpsPreview,
  matrix_single: MatrixPreview,
  matrix_multiple: MatrixPreview,
  file_upload: FileUploadPreview,
  signature: SignaturePreview,
  geo_location: GeoPreview,
  repeater: RepeaterPreview,
  group: ContainerPreview,
  sub_question: ContainerPreview,
  linked_choice: ContainerPreview,
  rich_text: RichTextPreview,
}

// ─── 3. 主组件 ───────────────────────────────────────────────

export function QuestionPreview({ node }: { node: QuestionNode }) {
  const PreviewComp = PREVIEW_REGISTRY[node.type]
  if (!PreviewComp) return null
  return <PreviewComp node={node} />
}
