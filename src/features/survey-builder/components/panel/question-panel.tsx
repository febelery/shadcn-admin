'use client'
import { useState, useRef } from 'react'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { QUESTION_TYPE_MAP } from '@/features/survey-builder/constants'
import {
  useBuilderStore,
  useSelectedNode,
} from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'
import { ChoiceConfig } from './configs/choice-config'
import { MatrixConfig } from './configs/matrix-config'
import { RatingConfig, NpsConfig } from './configs/rating-config'
import { TextConfig } from './configs/text-config'
import { ValidationConfig } from './configs/validation-config'

// 空状态展示
function EmptyPanel() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 px-6 text-center'>
      <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-xl text-lg'>
        ✦
      </div>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        点击画布中的题目
        <br />
        在这里编辑属性
      </p>
    </div>
  )
}

// 分组标题栏组件
// bg-muted 实色条，左侧 2px primary 线作为视觉锚点
function SectionHeader({
  title,
  badge,
  onToggle,
  open,
}: {
  title: string
  defaultOpen?: boolean
  badge?: number
  onToggle?: () => void
  open?: boolean
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'bg-muted border-border flex w-full items-center gap-2 border-y px-3 py-2 text-left',
        'hover:bg-accent/60 transition-colors',
        // 左侧竖线锚点
        'border-l-primary/60 border-l-2'
      )}
    >
      <span className='text-foreground flex-1 text-[11px] font-semibold'>
        {title}
      </span>
      {badge !== undefined && badge > 0 && (
        <Badge variant='secondary' className='h-4 px-1.5 font-mono text-[10px]'>
          {badge}
        </Badge>
      )}
      <ChevronDown
        className={cn(
          'text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform duration-200',
          !open && '-rotate-90'
        )}
      />
    </button>
  )
}

// 可折叠分组容器
function Section({
  title,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <SectionHeader
        title={title}
        badge={badge}
        open={open}
        onToggle={() => setOpen((v) => !v)}
      />
      {open && <div className='bg-background'>{children}</div>}
    </div>
  )
}

// 问题属性编辑面板主组件
export function QuestionPanel() {
  const node = useSelectedNode()
  if (!node) return <EmptyPanel />

  const hasTypeConfig = getConfigComponent(node) !== null
  const validationCount = node.validations?.length ?? 0

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Type strip — always visible, non-scrolling */}
      <TypeHeader node={node} />

      <ScrollArea className='min-h-0 flex-1'>
        <div className='pb-12'>
          {/* ① 最高频：标题 + 必填（合并，因为每题必改） */}
          <TitleSection node={node} />

          {/* ② 高频（有选项类型时）：选项配置 */}
          {hasTypeConfig && (
            <Section title='选项配置'>
              <div className='py-1'>{getConfigComponent(node)}</div>
            </Section>
          )}

          {/* ③ 中频：行为控制（逻辑隐藏 + 只读） */}
          <Section title='行为设置' defaultOpen>
            <BehaviorRows node={node} />
          </Section>

          {/* ④ 低频：校验规则（有规则时默认展开） */}
          <Section
            title='校验规则'
            defaultOpen={validationCount > 0}
            badge={validationCount}
          >
            <div className='py-1'>
              <ValidationConfig node={node} />
            </div>
          </Section>

          {/* ⑤ 极低频：标识符（默认收起） */}
          <Section title='标识符' defaultOpen={false}>
            <UidRow node={node} />
          </Section>
        </div>
      </ScrollArea>
    </div>
  )
}

// 题型页眉展示
function TypeHeader({ node }: { node: QuestionNode }) {
  const config = QUESTION_TYPE_MAP[node.type]
  const Icon = config?.icon
  return (
    <div className='bg-muted border-border flex shrink-0 items-center gap-2.5 border-b px-3 py-2'>
      {Icon && (
        <div className='bg-background border-border flex h-6 w-6 items-center justify-center rounded-md border'>
          <Icon className='text-muted-foreground h-3.5 w-3.5' />
        </div>
      )}
      <span className='text-foreground flex-1 text-xs font-bold'>
        {config?.label ?? node.type}
      </span>
      <code
        className='text-muted-foreground font-mono text-[10px]'
        title={node.id}
      >
        {node.id.slice(0, 8)}
      </code>
    </div>
  )
}

// 标题配置区域（标题、必填、描述）
// 必填 toggle 和标题标签放同一行，用户改标题时顺手就能切必填
function TitleSection({ node }: { node: QuestionNode }) {
  const { updateNode } = useBuilderStore()
  const titleRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className='bg-background space-y-3 px-3 py-3'>
      {/* 题目标题 + 必填 toggle 同行 */}
      <div className='space-y-1.5'>
        <div className='flex items-center justify-between'>
          <label className='text-foreground/70 text-[11px] font-semibold'>
            题目标题
          </label>
          {/* 必填：最高频 toggle，提到最显眼位置 */}
          <div className='flex items-center gap-1.5'>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                node.required ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              必填
            </span>
            <Switch
              checked={!!node.required}
              onCheckedChange={(v) => updateNode(node.id, { required: v })}
              className='origin-right scale-[0.8]'
            />
          </div>
        </div>
        <Textarea
          ref={titleRef}
          value={node.title}
          placeholder='请输入题目标题...'
          rows={2}
          onChange={(e) => updateNode(node.id, { title: e.target.value })}
        />
      </div>

      {/* 描述说明 */}
      <div className='space-y-1.5'>
        <label className='text-foreground/70 text-[11px] font-semibold'>
          描述说明{' '}
          <span className='text-muted-foreground font-normal'>（可选）</span>
        </label>
        <Input
          value={node.description ?? ''}
          placeholder='补充说明...'
          className='bg-muted/40 focus-visible:bg-background h-8 text-xs transition-colors focus-visible:ring-1'
          onChange={(e) => updateNode(node.id, { description: e.target.value })}
        />
      </div>
    </div>
  )
}

// 行为设置区域（显示隐藏、只读）
// 这两个相对低频，放在独立 section，不干扰高频操作
function BehaviorRows({ node }: { node: QuestionNode }) {
  const { updateNode, logic, setBuilderMode } = useBuilderStore()

  const relatedRules = logic.filter(
    (r) =>
      r.condition.rules.some((rr: any) => rr.field === node.id) ||
      r.actions.some((a: any) => a.target === node.id)
  )

  return (
    <div className='px-3 pb-1'>
      {(
        [
          {
            key: 'hidden',
            label: '逻辑隐藏',
            desc: '由跳题逻辑控制可见性',
          },
          {
            key: 'readonly',
            label: '只读模式',
            desc: '展示但不可编辑',
          },
        ] as const
      ).map(({ key, label, desc }) => (
        <div
          key={key}
          className='border-border/40 flex items-center justify-between gap-3 border-b py-2.5 last:border-0'
        >
          <div>
            <p className='text-foreground text-xs font-medium'>{label}</p>
            <p className='text-muted-foreground text-[11px]'>{desc}</p>
          </div>
          <Switch
            checked={!!node[key as keyof QuestionNode]}
            onCheckedChange={(v) => updateNode(node.id, { [key]: v })}
            className='shrink-0 scale-[0.9]'
          />
        </div>
      ))}

      {relatedRules.length > 0 && (
        <div className='border-border/40 flex flex-wrap items-center gap-1.5 border-t pt-2.5 pb-1'>
          <span className='text-muted-foreground mr-1 text-[10px]'>
            关联规则
          </span>
          {relatedRules.map((r) => (
            <button
              key={r.id}
              onClick={() => setBuilderMode('logic')}
              className='border-border bg-secondary text-foreground/70 hover:border-primary/50 hover:text-primary rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors'
            >
              {r.name}
            </button>
          ))}
          <button
            onClick={() => setBuilderMode('logic')}
            className='text-muted-foreground hover:text-primary ml-auto text-[10px] transition-colors'
          >
            去配置 →
          </button>
        </div>
      )}
    </div>
  )
}

// 唯一标识符展示与复制
function UidRow({ node }: { node: QuestionNode }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(node.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className='px-3 py-3'>
      <button
        onClick={copy}
        title='点击复制完整 ID'
        className='border-border bg-muted/50 hover:bg-muted flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors'
      >
        <code className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-[10px]'>
          {node.id}
        </code>
        {copied ? (
          <Check className='h-3 w-3 shrink-0 text-green-500' />
        ) : (
          <Copy className='text-muted-foreground h-3 w-3 shrink-0' />
        )}
      </button>
    </div>
  )
}

// 根据题型获取对应的配置子组件
function getConfigComponent(node: QuestionNode): React.ReactNode {
  switch (node.type) {
    case 'single_choice':
    case 'multiple_choice':
    case 'dropdown':
    case 'ranking':
    case 'image_choice':
      return <ChoiceConfig node={node} />
    case 'matrix_single':
    case 'matrix_multiple':
      return <MatrixConfig node={node} />
    case 'rating':
      return <RatingConfig node={node} />
    case 'nps':
      return <NpsConfig node={node} />
    case 'text':
    case 'textarea':
    case 'number':
    case 'fill_in':
      return <TextConfig node={node} />
    case 'repeater':
      return <RepeaterConfig node={node} />
    default:
      return null
  }
}

// ── Repeater config ───────────────────────────────────────
function RepeaterConfig({ node }: { node: QuestionNode }) {
  const { updateNodeConfig } = useBuilderStore()
  const { minRows = 1, maxRows = 5, addLabel = '添加一条' } = node.config
  return (
    <div className='space-y-3 px-3 py-2'>
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <label className='text-foreground/70 text-[11px] font-medium'>
            最少行数
          </label>
          <Input
            type='number'
            min={1}
            className='h-7 text-xs'
            value={minRows}
            onChange={(e) =>
              updateNodeConfig(node.id, { minRows: +e.target.value })
            }
          />
        </div>
        <div className='space-y-1'>
          <label className='text-foreground/70 text-[11px] font-medium'>
            最多行数
          </label>
          <Input
            type='number'
            min={1}
            className='h-7 text-xs'
            value={maxRows}
            onChange={(e) =>
              updateNodeConfig(node.id, { maxRows: +e.target.value })
            }
          />
        </div>
      </div>
      <div className='space-y-1'>
        <label className='text-foreground/70 text-[11px] font-medium'>
          添加按钮文字
        </label>
        <Input
          className='h-7 text-xs'
          value={addLabel}
          onChange={(e) =>
            updateNodeConfig(node.id, { addLabel: e.target.value })
          }
        />
      </div>
    </div>
  )
}
