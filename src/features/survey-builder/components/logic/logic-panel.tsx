'use client'
import { useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useConflictDetection } from '@/features/survey-builder/hooks/use-conflict-detection'
import { useBuilderStore } from '@/features/survey-builder/store'
import {
  type LogicRule,
  LOGIC_ACTION_CONFIG,
  FALLBACK_ACTION_CONFIG,
} from '@/features/survey-builder/types'
import { LogicCanvas } from './logic-canvas'
import { RuleEditor } from './rule-editor'

export function LogicPanel() {
  const { logic, removeRule, updateRule, setActiveRule, activeRuleId } =
    useBuilderStore()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<LogicRule | null>(null)
  // 规则编辑器分发：通过 key 驱动组件重挂载，确保状态同步
  const [editCount, setEditCount] = useState(0)

  const { conflicts, conflictRules } = useConflictDetection()

  const openEditor = (rule?: LogicRule) => {
    if (!rule) setEditCount((c) => c + 1)
    setEditingRule(rule ?? null)
    setEditorOpen(true)
  }

  const handleClose = (open: boolean) => {
    setEditorOpen(open)
    if (!open) setEditingRule(null)
  }

  return (
    <div className='flex flex-1 overflow-hidden'>
      {/* 左侧：规则列表 */}
      <aside className='border-border bg-background flex w-64 shrink-0 flex-col border-r'>
        <div className='border-border flex h-10 shrink-0 items-center justify-between border-b px-3'>
          <span className='text-foreground flex items-center gap-1.5 text-xs font-semibold'>
            逻辑规则
            <Badge
              variant='secondary'
              className='text-muted-foreground bg-secondary h-4 rounded px-1.5 font-mono text-[10px]'
            >
              {logic.length}
            </Badge>
          </span>
          <Button
            size='sm'
            className='h-6 gap-1 px-2 text-[11px]'
            onClick={() => openEditor()}
          >
            <Plus className='h-3 w-3' />
            新建
          </Button>
        </div>

        <ScrollArea className='flex-1'>
          <div className='space-y-1.5 p-2'>
            {conflictRules.length > 0 && (
              <div className='border-destructive/20 bg-destructive/5 flex gap-2 rounded-md border p-2'>
                <AlertTriangle className='text-destructive mt-0.5 h-3.5 w-3.5 shrink-0' />
                <p className='text-destructive text-[11px] leading-relaxed'>
                  {conflictRules.length} 个规则存在冲突：必填题可能被永久隐藏
                </p>
              </div>
            )}

            {logic.map((rule) => {
              const mainType = rule.actions[0]?.type ?? 'default'
              const config =
                LOGIC_ACTION_CONFIG[mainType] ?? FALLBACK_ACTION_CONFIG
              const isActive = activeRuleId === rule.id
              const hasConflict =
                rule.enabled &&
                rule.actions.some((a) => conflicts.has(a.target))

              return (
                <div
                  key={rule.id}
                  className={cn(
                    'cursor-pointer overflow-hidden rounded-lg border transition-all',
                    isActive
                      ? 'border-foreground shadow-sm'
                      : 'border-border/60 hover:border-border',
                    !rule.enabled && 'opacity-50'
                  )}
                  onClick={() => {
                    setActiveRule(rule.id)
                    openEditor(rule)
                  }}
                >
                  <div className='flex items-center gap-2 px-2.5 py-2'>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(v) =>
                        updateRule(rule.id, { enabled: v })
                      }
                      className='shrink-0 scale-75'
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className='text-foreground flex-1 truncate text-xs font-medium'>
                      {rule.name}
                    </span>
                    <Badge
                      variant='secondary'
                      className={cn(
                        'h-4 shrink-0 rounded px-1.5 font-mono text-[9px] font-bold uppercase',
                        config.color
                      )}
                    >
                      {config.label}
                    </Badge>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-border/40 hover:text-destructive h-6 w-6 shrink-0 p-0.5 transition-colors'
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRule(rule.id)
                      }}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>

                  {hasConflict && (
                    <div className='border-destructive/20 bg-destructive/5 border-t px-2.5 py-1.5'>
                      <p className='text-destructive flex items-center gap-1 text-[10px]'>
                        <AlertTriangle className='h-3 w-3' />
                        目标为必填且可能被永久隐藏
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            {logic.length === 0 && (
              <div className='py-6 text-center'>
                <p className='text-muted-foreground/60 text-xs'>暂无逻辑规则</p>
                <p className='text-muted-foreground/40 mt-1 text-[11px]'>
                  在右侧画布连接题目，或点击「新建」
                </p>
              </div>
            )}

            <Button
              variant='outline'
              onClick={() => openEditor()}
              className='border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted/30 hover:text-foreground h-10 w-full justify-center gap-1.5 border-dashed py-2.5 text-xs font-medium transition-all'
            >
              <Plus className='h-3.5 w-3.5' />
              新增逻辑规则
            </Button>
          </div>
        </ScrollArea>
      </aside>

      {/* 右侧：可视化画布 */}
      <LogicCanvas />

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
