'use client'
import React from 'react'
import {
  Calendar,
  Clock,
  Paperclip,
  MapPin,
  Star,
  Heart,
  ThumbsUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionNode, NodeType } from '@/features/survey-builder/types'

type PreviewProps = { node: QuestionNode }

// ─── 1. 基础题型预览组件 ────────────────────────────────────

const ChoicePreview: React.FC<PreviewProps> = ({ node }) => {
  const opts = node.config.options ?? []
  const isMulti = node.type === 'multiple_choice'
  return (
    <div className='flex flex-col gap-1'>
      {opts.slice(0, 5).map((opt: any) => (
        <div
          key={opt.id}
          className='text-muted-foreground/70 flex h-7 items-center gap-2 text-xs'
        >
          <span
            className={cn(
              'border-muted-foreground/25 bg-background h-3.5 w-3.5 shrink-0 border-2',
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

const FillInPreview: React.FC<PreviewProps> = ({ node }) => {
  const content = node.title || ''
  const parts = content.split(/(\(\))/)

  if (!content.includes('()')) {
    return (
      <p className='text-muted-foreground/40 text-[11px] leading-relaxed italic'>
        在题目标题中输入 () 即可创建填空位...
      </p>
    )
  }

  return (
    <div className='flex flex-wrap items-center gap-x-1.5 gap-y-2.5 leading-relaxed'>
      {parts.map((part, i) =>
        part === '()' ? (
          <div
            key={i}
            className='border-primary/20 bg-primary/5 h-6 min-w-[60px] rounded border-b-2 transition-all'
          >
            <div className='invisible h-full px-2 text-xs'>placeholder</div>
          </div>
        ) : (
          <span key={i} className='text-foreground/70 text-sm'>
            {part}
          </span>
        )
      )}
    </div>
  )
}

const DateTimePreview: React.FC<PreviewProps> = ({ node }) => {
  const isDate = node.type.startsWith('date')
  const isRange = node.type.endsWith('range')
  return (
    <div className='border-border/35 bg-muted/25 text-muted-foreground/40 flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs'>
      {isDate ? (
        <Calendar className='h-3.5 w-3.5' />
      ) : (
        <Clock className='h-3.5 w-3.5' />
      )}
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
  const shape = node.config.starShape ?? 'star'
  const IconProps = { className: 'h-4 w-4' }

  const renderIcon = (shape: string) => {
    switch (shape) {
      case 'heart':
        return <Heart {...IconProps} />
      case 'thumb':
        return <ThumbsUp {...IconProps} />
      case 'circle':
        return (
          <div className='h-3.5 w-3.5 rounded-full border-2 border-current' />
        )
      case 'star':
      default:
        return <Star {...IconProps} />
    }
  }

  return (
    <div className='flex items-center gap-1.5'>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className='text-muted-foreground/20 transition-colors'>
          {renderIcon(shape)}
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
  const showRows = rows.slice(0, 5) // Show up to 5 rows in preview
  const showCols = cols.slice(0, 6) // Show up to 6 columns in preview
  const isMulti = node.type === 'matrix_multiple'

  if (!rows.length || !cols.length) {
    return (
      <div className='border-border/60 text-muted-foreground/60 bg-muted/20 rounded-xl border p-6 text-center text-sm font-medium'>
        矩阵题（点击卡片配置行与列）
      </div>
    )
  }

  return (
    <div className='border-border/80 bg-background overflow-hidden rounded-xl border text-[11px] shadow-sm'>
      <table className='w-full border-collapse table-fixed'>
        <colgroup>
          <col className='w-[100px]' />
          {showCols.map((c: any) => (
            <col key={c.id} className='min-w-[80px]' />
          ))}
        </colgroup>
        <thead>
          <tr className='bg-muted/30 border-b border-border/40'>
            <th className='border-r border-border/40 h-10' />
            {showCols.map((c: any) => (
              <th
                key={c.id}
                className='border-r border-border/40 last:border-r-0 px-2 py-2 text-center font-semibold text-muted-foreground truncate'
              >
                {c.label || '...'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {showRows.map((r: any) => (
            <tr key={r.id} className='border-b border-border/40 last:border-b-0'>
              <td className='bg-muted/5 border-r border-border/40 px-3 py-2.5 font-medium text-foreground truncate'>
                {r.label || '...'}
              </td>
              {showCols.map((c: any) => (
                <td
                  key={c.id}
                  className='border-r border-border/40 last:border-r-0 p-0'
                >
                  <div className='flex items-center justify-center py-2.5 opacity-20'>
                    <span
                      className={cn(
                        'size-3.5 border-2 transition-all',
                        isMulti
                          ? 'rounded-[3px] border-border/60 shadow-sm'
                          : 'rounded-full border-border/60'
                      )}
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
          {/* If there are more items, show a subtle indicator */}
          {(rows.length > 5 || cols.length > 6) && (
            <tr className='bg-muted/5'>
              <td
                colSpan={showCols.length + 1}
                className='py-1.5 text-center text-[10px] text-muted-foreground/40 italic'
              >
                ... 更多行列已省略 ...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const FileUploadPreview: React.FC<PreviewProps> = () => (
  <div className='border-border/35 text-muted-foreground/40 flex h-14 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed text-xs'>
    <Paperclip className='h-4 w-4' />
    <span>点击或拖拽文件至此</span>
  </div>
)

const SignaturePreview: React.FC<PreviewProps> = () => (
  <div className='border-border/35 bg-muted/15 flex h-16 items-center justify-center rounded-md border'>
    <div className='text-muted-foreground/30 flex items-center gap-1.5 text-sm'>
      电子签名区域
    </div>
  </div>
)

const GeoPreview: React.FC<PreviewProps> = () => (
  <div className='bg-muted/25 text-muted-foreground/40 flex h-14 items-center justify-center gap-2 rounded-md text-xs'>
    <MapPin className='h-4 w-4' />
    <span>点击获取当前位置</span>
  </div>
)

const DividerPreview: React.FC<PreviewProps> = () => (
  <div className='py-6' aria-hidden>
    <div className='flex items-center gap-6'>
      <div className='bg-border h-px flex-1' />
      <div className='bg-border/60 size-1 rounded-full' />
      <div className='bg-border h-px flex-1' />
    </div>
  </div>
)

const RichTextPreview: React.FC<PreviewProps> = ({ node }) => (
  <div className='bg-secondary/30 relative overflow-hidden rounded-md px-4 py-3 text-sm transition-colors min-h-[4em]'>
    <div className='flex items-start gap-3'>
      <div className='flex-1 space-y-1.5'>
        <p className='leading-relaxed whitespace-pre-wrap text-foreground'>
          {node.title || <span className="text-muted-foreground/40 italic">点此在此处添加文字说明...</span>}
        </p>
      </div>
    </div>
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
  divider: DividerPreview,
  rich_text: RichTextPreview,
}

// ─── 3. 主组件 ───────────────────────────────────────────────

export function QuestionPreview({ node }: { node: QuestionNode }) {
  const PreviewComp = PREVIEW_REGISTRY[node.type]
  if (!PreviewComp) return null
  return <PreviewComp node={node} />
}
