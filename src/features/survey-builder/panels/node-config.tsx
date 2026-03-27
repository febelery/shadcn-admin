'use client'
import { useState, useRef, useCallback } from 'react'
import { ChevronDown, Trash2, Copy as CopyIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { getQuestion } from '@/features/survey-builder/questions/index'
import { useSchemaStore } from '@/features/survey-builder/state'
import { useSelectedNode } from '@/features/survey-builder/state/selectors'
import type { QuestionNode } from '@/features/survey-builder/types'
import { ValidationConfig } from '../components/validation-list'

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
  const updateNodeConfig = useSchemaStore((s) => s.updateNodeConfig)
  const updateNode = useSchemaStore((s) => s.updateNode)

  const handleConfigChange = useCallback(
    (patch: Partial<QuestionNode['config']>) => {
      if (node) updateNodeConfig(node.id, patch)
    },
    [node, updateNodeConfig]
  )

  const handleNodeChange = useCallback(
    (patch: Partial<QuestionNode>) => {
      if (node) updateNode(node.id, patch)
    },
    [node, updateNode]
  )

  if (!node) return <EmptyPanel />

  const q = getQuestion(node.type)
  const features = q?.features ?? {
    hasTitle: true,
    hasRequired: true,
    hasValidation: true,
  }
  const ConfigPanel = q?.configPanel

  const validationCount = node.validations?.length ?? 0

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Type strip — always visible, non-scrolling */}
      <TypeHeader node={node} />

      <ScrollArea className='min-h-0 flex-1'>
        <div className='pb-12'>
          {/* ① 语义展示区域：由题型元数据控制是否拥有标题/描述 */}
          {features.hasTitle && (
            <TitleSection node={node} showRequired={features.hasRequired} />
          )}

          {/* ② 题型专属配置：全量基于配置面板注册 */}
          {ConfigPanel && (
            <Section title='题型配置'>
              <div className='py-1'>
                <ConfigPanel
                  node={node}
                  onConfigChange={handleConfigChange}
                  onNodeChange={handleNodeChange}
                />
              </div>
            </Section>
          )}

          {/* ③ 校验规则：由题型元数据控制是否开放独立校验项 */}
          {features.hasValidation && (
            <Section
              title='校验规则'
              defaultOpen={validationCount > 0}
              badge={validationCount}
            >
              <div className='py-1'>
                <ValidationConfig node={node} />
              </div>
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function TypeHeader({ node }: { node: QuestionNode }) {
  const duplicateNode = useSchemaStore((s) => s.duplicateNode)
  const removeNode = useSchemaStore((s) => s.removeNode)
  const q = getQuestion(node.type)
  const Icon = q?.meta.icon

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
            {q?.meta.label ?? node.type}
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
function TitleSection({
  node,
  showRequired = true,
}: {
  node: QuestionNode
  showRequired?: boolean
}) {
  const updateNode = useSchemaStore((s) => s.updateNode)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className='bg-background flex flex-col gap-4 px-3 py-3'>
      {/* 题目标题 + 必填 toggle 同行 */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <label className='text-foreground text-xs font-semibold tracking-wide'>
            题目标题
          </label>
          {showRequired && (
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
          )}
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
      <div className='flex flex-col gap-2'>
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
