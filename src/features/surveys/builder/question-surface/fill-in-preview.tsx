import { cn } from '@/lib/utils'
import { builderTypeAnswer, builderTypeBody } from '../ui'
/** 将题目标题中的连续下划线渲染为填空位预览 */
const BLANK_RE = /_{2,}/g

type Segment = { kind: 'text'; value: string } | { kind: 'blank'; width: number }

function parseFillInSegments(title: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = new RegExp(BLANK_RE.source, 'g')
  while ((match = re.exec(title)) !== null) {
    if (match.index > last) {
      segments.push({ kind: 'text', value: title.slice(last, match.index) })
    }
    segments.push({ kind: 'blank', width: Math.min(match[0].length * 0.35, 6) })
    last = match.index + match[0].length
  }
  if (last < title.length) {
    segments.push({ kind: 'text', value: title.slice(last) })
  }
  return segments
}

type Props = { title: string }

/** 填空题作答区预览（编辑标题中的 ___ 即可调整填空位） */
export function SurfaceFillInPreview({ title }: Props) {
  const segments = parseFillInSegments(title)
  const hasBlank = segments.some((s) => s.kind === 'blank')

  if (!hasBlank) {
    return (
      <p className={cn(builderTypeBody, 'text-muted-foreground/70 border-border/60 rounded-md border border-dashed px-3 py-2.5')}>
        在题目标题中用连续下划线表示填空，例如：「我叫___，今年___岁」
      </p>
    )
  }

  return (
    <p className={cn('text-foreground flex flex-wrap items-baseline gap-x-0.5', builderTypeAnswer)}>
      {segments.map((seg, i) =>
        seg.kind === 'text' ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <span
            key={i}
            className='border-border/80 bg-muted/20 inline-block min-h-[1.35em] shrink-0 border-b align-baseline'
            style={{ minWidth: `${seg.width}rem` }}
            aria-hidden
          />
        )
      )}
    </p>
  )
}