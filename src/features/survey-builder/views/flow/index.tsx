'use client'
import { useState } from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useConflictDetection } from '@/features/survey-builder/hooks/use-conflict-detection'
import { useFlowStore, useUIStore } from '@/features/survey-builder/state'
import { RuleService } from '@/features/survey-builder/state/selectors'
import { type FlowRule } from '@/features/survey-builder/types'
import { RuleEditor } from '../../panels/rule-config'
import { FlowCanvas } from './flow-canvas'

export function FlowPanel() {
  const flow = useFlowStore(useShallow((s) => s.flow))
  const removeRule = useFlowStore((s) => s.removeRule)
  const updateRule = useFlowStore((s) => s.updateRule)

  const { setActiveRule, activeRuleId } = useUIStore()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<FlowRule | null>(null)
  const [editCount, setEditCount] = useState(0)

  const { conflicts, conflictRules } = useConflictDetection()

  const openEditor = (rule?: FlowRule) => {
    if (!rule) setEditCount((c) => c + 1)
    setEditingRule(rule ?? null)
    setEditorOpen(true)
  }

  const handleClose = (open: boolean) => {
    setEditorOpen(open)
    if (!open) setEditingRule(null)
  }

  return (
    <div className='flex h-full flex-1 overflow-hidden'>
      {/* 左侧：规则列表 */}
      <aside className='border-border bg-background z-10 flex w-64 min-w-0 shrink-0 flex-col border-r shadow-sm'>
        <div className='border-border flex h-12 shrink-0 items-center justify-between border-b px-4'>
          <span className='text-foreground flex items-center gap-2 text-xs font-bold tracking-tight'>
            流程规则
            <Badge
              variant='secondary'
              className='text-muted-foreground/50 bg-muted h-4 rounded-full border-none px-2 font-mono text-[9px]'
            >
              {flow.length}
            </Badge>
          </span>
          <Button
            size='sm'
            variant='secondary'
            className='h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold transition-all active:scale-95'
            onClick={() => openEditor()}
          >
            <Plus className='h-3 w-3' />
            新建
          </Button>
        </div>

        <div className='scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 flex-1 overflow-x-hidden overflow-y-auto'>
          <div className='w-full min-w-0 space-y-2 p-3 pb-20'>
            {conflictRules.length > 0 && (
              <div className='border-destructive/20 bg-destructive/5 flex gap-2.5 rounded-xl border p-3'>
                <AlertTriangle className='text-destructive mt-0.5 h-3.5 w-3.5 shrink-0' />
                <p className='text-destructive text-[11px] leading-relaxed font-medium'>
                  {conflictRules.length} 个规则冲突
                </p>
              </div>
            )}

            {flow.map((rule) => {
              const config = RuleService.getActionConfig(rule.actions[0]?.type)
              const isActive = activeRuleId === rule.id
              const hasConflict = RuleService.hasConflict(rule, conflicts)

              return (
                <div
                  key={rule.id}
                  className={cn(
                    'group bg-background relative flex w-full cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border p-3 transition-all',
                    isActive
                      ? 'border-primary/60 ring-primary/20 bg-primary/2 shadow-sm ring-1'
                      : 'border-border/60 hover:border-primary/40',
                    !rule.enabled && 'opacity-60 grayscale-[0.2]'
                  )}
                  onClick={() => {
                    setActiveRule(rule.id)
                    openEditor(rule)
                  }}
                >
                  {/* 顶部行：标题 + 删除按钮 */}
                  <div className='flex w-full min-w-0 items-start justify-between gap-2'>
                    <div className='flex min-w-0 flex-1 flex-col gap-1 overflow-hidden'>
                      <span
                        className={cn(
                          'block w-full truncate text-xs leading-snug font-semibold',
                          isActive ? 'text-primary' : 'text-foreground'
                        )}
                        title={rule.name}
                      >
                        {rule.name}
                      </span>
                      {/* 冲突提示紧跟标题下方 */}
                      {hasConflict && (
                        <span className='text-destructive flex shrink-0 items-center gap-1 text-[10px] font-medium'>
                          <AlertTriangle className='h-3 w-3 shrink-0' />
                          规则冲突
                        </span>
                      )}
                    </div>

                    {/* 删除按钮 */}
                    <Button
                      variant='ghost'
                      size='icon'
                      className='hover:bg-destructive/10 hover:text-destructive text-muted-foreground h-6 w-6 shrink-0 opacity-0 transition-all group-hover:opacity-100'
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRule(rule.id)
                      }}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>

                  {/* 底部行：动作标签 + 优先级 + 开关 */}
                  <div className='mt-auto flex w-full items-center justify-between pt-1'>
                    <Badge
                      variant='secondary'
                      className={cn(
                        'shrink-0 border-transparent px-1.5 font-mono text-[10px] font-bold tracking-wider',
                        config.color
                      )}
                    >
                      {config.label}
                    </Badge>

                    <div className='flex shrink-0 items-center gap-2.5'>
                      {rule.priority > 0 && (
                        <span className='text-muted-foreground/60 font-mono text-[10px] font-bold'>
                          P{rule.priority}
                        </span>
                      )}
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(v) =>
                          updateRule(rule.id, { enabled: v })
                        }
                        className='origin-right scale-75'
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            {flow.length === 0 && (
              <div className='py-8 text-center'>
                <p className='text-muted-foreground/60 text-xs font-medium'>
                  暂无流程规则
                </p>
                <p className='text-muted-foreground/40 mt-1.5 text-[10px]'>
                  在右侧画布连接题目，或点击「新建」
                </p>
              </div>
            )}

            <Button
              variant='outline'
              onClick={() => openEditor()}
              className='bg-muted/30 border-border group hover:border-primary/50 hover:bg-primary/2 h-14 w-full flex-col justify-center gap-0.5 rounded-xl border-dashed px-3 transition-all active:scale-[0.98]'
            >
              <div className='flex items-center gap-1.5'>
                <Plus className='text-muted-foreground group-hover:text-primary h-3 w-3 transition-colors' />
                <span className='text-muted-foreground group-hover:text-primary text-[10px] font-bold transition-colors'>
                  新增流程规则
                </span>
              </div>
              <span className='text-muted-foreground/40 text-[9px]'>
                点击定义业务逻辑
              </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* 右侧：可视化画布 */}
      <main className='relative h-full flex-1 overflow-hidden'>
        <FlowCanvas />
      </main>

      {/* 规则编辑器抽屉 */}
      <RuleEditor
        key={editingRule?.id ?? `new-${editCount}`}
        rule={editingRule}
        open={editorOpen}
        onOpenChange={handleClose}
      />
    </div>
  )
}
