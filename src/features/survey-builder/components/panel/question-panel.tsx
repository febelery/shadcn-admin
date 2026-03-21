'use client'
import { useState, useRef } from 'react'
import {
  ChevronDown,
  Copy,
  Check,
  Trash2,
  Copy as CopyIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  QUESTION_TYPE_MAP,
  isLayoutNode,
} from '@/features/survey-builder/constants'
import {
  useBuilderStore,
  useSelectedNode,
} from '@/features/survey-builder/store'
import type { QuestionNode, LogicRule } from '@/features/survey-builder/types'
import { ChoiceConfig } from './configs/choice-config'
import { MatrixConfig } from './configs/matrix-config'
import { RatingConfig, NpsConfig } from './configs/rating-config'
import { TextConfig } from './configs/text-config'
import { ValidationConfig } from './configs/validation-config'

// 空状态展示
function EmptyPanel() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-4 px-6 text-center'>
      <div className='bg-muted/50 text-muted-foreground border-border/50 flex h-16 w-16 items-center justify-center rounded-2xl border text-2xl shadow-sm'>
        ✦
      </div>
      <p className='text-muted-foreground text-sm leading-relaxed font-medium tracking-wide'>
        在画布中选择一个题目
        <br />
        开始配置属性
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
        'group border-border/40 flex w-full items-center gap-2 border-t bg-transparent px-3 py-2.5 text-left transition-colors',
        'hover:bg-muted/30'
      )}
    >
      <div className='flex flex-1 items-center gap-2'>
        <span className='text-muted-foreground/80 group-hover:text-foreground text-xs font-semibold tracking-wider uppercase'>
          {title}
        </span>
        {badge !== undefined && badge > 0 && (
          <Badge
            variant='secondary'
            className='bg-primary/10 text-primary hover:bg-primary/20 h-4 px-1 text-[10px] leading-none'
          >
            {badge}
          </Badge>
        )}
      </div>
      <ChevronDown
        className={cn(
          'text-muted-foreground/60 group-hover:text-foreground h-4 w-4 shrink-0 transition-transform duration-200',
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
  const isLayout = isLayoutNode(node.type)

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Type strip — always visible, non-scrolling */}
      <TypeHeader node={node} />

      <ScrollArea className='min-h-0 flex-1'>
        <div className='pb-12'>
          {!isLayout && (
            <>
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
            </>
          )}

          {isLayout && node.type === 'divider' && (
            <div className='p-6 text-center'>
              <p className='text-muted-foreground text-xs'>分割线无额外配置</p>
            </div>
          )}

          {/* ⑤ 极低频：标识符（默认收起） */}
          <Section title='标识符' defaultOpen={false}>
            <UidRow node={node} />
          </Section>
        </div>
      </ScrollArea>
    </div>
  )
}

function TypeHeader({ node }: { node: QuestionNode }) {
  const { duplicateNode, removeNode } = useBuilderStore()
  const config = QUESTION_TYPE_MAP[node.type]
  const Icon = config?.icon
  return (
    <div className='border-border/40 bg-background flex shrink-0 items-center justify-between border-b px-3 py-2.5 shadow-none'>
      <div className='flex items-center gap-2.5'>
        {Icon && (
          <div className='bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded'>
            <Icon className='h-3.5 w-3.5' />
          </div>
        )}
        <div className='flex flex-col gap-0.5'>
          <span className='text-foreground text-[11px] font-bold tracking-wide'>
            {config?.label ?? node.type}
          </span>
          <code
            className='text-muted-foreground/50 font-mono text-[9px]'
            title={node.id}
          >
            {node.id.slice(0, 8)}
          </code>
        </div>
      </div>

      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:bg-muted hover:text-foreground h-7 w-7 transition-colors'
          onClick={() => duplicateNode(node.id)}
          title='复制题目'
        >
          <CopyIcon className='h-3.5 w-3.5' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 w-7 transition-colors'
          onClick={() => removeNode(node.id)}
          title='删除题目'
        >
          <Trash2 className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  )
}

// 标题配置区域（标题、必填、描述）
// 必填 toggle 和标题标签放同一行，用户改标题时顺手就能切必填
function TitleSection({ node }: { node: QuestionNode }) {
  const updateNode = useBuilderStore((s) => s.updateNode)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className='bg-background space-y-4 px-3 py-3'>
      {/* 题目标题 + 必填 toggle 同行 */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <label className='text-foreground text-xs font-semibold tracking-wide'>
            题目标题
          </label>
          <div className='flex items-center gap-2'>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                node.required ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              必填项
            </span>
            <Switch
              checked={!!node.required}
              onCheckedChange={(v) => updateNode(node.id, { required: v })}
              className='data-[state=checked]:bg-destructive scale-[0.8]'
            />
          </div>
        </div>
        <Textarea
          ref={titleRef}
          value={node.title}
          placeholder='请输入题目标题...'
          rows={2}
          className='bg-muted/30 focus-visible:bg-background focus-visible:border-border min-h-[60px] resize-none border-transparent px-2 py-1.5 text-xs shadow-none transition-colors'
          onChange={(e) => updateNode(node.id, { title: e.target.value })}
        />
      </div>

      {/* 描述说明 */}
      <div className='space-y-2'>
        <label className='text-foreground text-xs font-semibold tracking-wide'>
          描述说明{' '}
          <span className='text-muted-foreground/60 ml-1 text-[10px] font-normal'>
            （可选）
          </span>
        </label>
        <Textarea
          value={node.description ?? ''}
          placeholder='补充说明...'
          rows={2}
          className='bg-muted/30 focus-visible:bg-background focus-visible:border-border min-h-[50px] resize-none border-transparent px-2 py-1.5 text-xs shadow-none transition-colors'
          onChange={(e) => updateNode(node.id, { description: e.target.value })}
        />
      </div>
    </div>
  )
}

// 行为设置区域（显示隐藏、只读）
// 这两个相对低频，放在独立 section，不干扰高频操作
function BehaviorRows({ node }: { node: QuestionNode }) {
  const updateNode = useBuilderStore((s) => s.updateNode)
  const logic = useBuilderStore((s) => s.logic)
  const setBuilderMode = useBuilderStore((s) => s.setBuilderMode)

  const relatedRules = logic.filter(
    (r: LogicRule) =>
      r.condition.rules.some((rr: any) => rr.field === node.id) ||
      r.actions.some((a: any) => a.target === node.id)
  )

  return (
    <div className='px-3 pt-1 pb-2'>
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
          className='flex items-center justify-between gap-4 py-2.5 last:pb-1'
        >
          <div className='space-y-0.5'>
            <p className='text-foreground text-xs font-medium tracking-wide'>
              {label}
            </p>
            <p className='text-muted-foreground text-[10px]'>{desc}</p>
          </div>
          <Switch
            checked={!!node[key as keyof QuestionNode]}
            onCheckedChange={(v) => updateNode(node.id, { [key]: v })}
            className='scale-[0.8]'
          />
        </div>
      ))}

      {relatedRules.length > 0 && (
        <div className='border-border/40 mt-2 flex flex-wrap items-center gap-2 border-t pt-3 pb-1'>
          <span className='text-muted-foreground mr-1 text-[10px] font-semibold uppercase'>
            关联规则
          </span>
          {relatedRules.map((r: LogicRule) => (
            <button
              key={r.id}
              onClick={() => setBuilderMode('logic')}
              className='border-border bg-secondary text-foreground hover:border-primary/50 hover:text-primary rounded border px-2 py-0.5 text-[10px] font-medium shadow-sm transition-colors'
            >
              {r.name}
            </button>
          ))}
          <button
            onClick={() => setBuilderMode('logic')}
            className='text-muted-foreground hover:text-primary ml-auto text-[10px] font-medium transition-colors'
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
        className='border-border/50 bg-muted/30 hover:bg-muted flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left transition-colors'
      >
        <code className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-[10px]'>
          {node.id}
        </code>
        {copied ? (
          <Check className='h-3.5 w-3.5 shrink-0 text-emerald-500' />
        ) : (
          <Copy className='text-muted-foreground/60 h-3.5 w-3.5 shrink-0' />
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
    default:
      return null
  }
}
