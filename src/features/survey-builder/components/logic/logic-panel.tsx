'use client'
import { useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { LogicRule } from '@/features/survey-builder/types'
import { detectConflicts } from '@/features/survey-builder/utils'
import { LogicCanvas } from './logic-canvas'
import { RuleEditor } from './rule-editor'

const ACTION_COLORS: Record<string, string> = {
  jump_question:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  show: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  hide: 'bg-secondary text-muted-foreground',
  end: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  set_required:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const ACTION_LABELS: Record<string, string> = {
  jump_question: '跳转',
  show: '显示',
  hide: '隐藏',
  end: '结束',
  set_required: '必填',
  set_readonly: '只读',
  set_value: '赋值',
  clear_value: '清空',
  show_option: '显示选项',
  hide_option: '隐藏选项',
}

export function LogicPanel() {
  const { logic, schema, removeRule, updateRule, setActiveRule, activeRuleId } =
    useBuilderStore()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<LogicRule | null>(null)

  const conflicts = detectConflicts(schema, logic)
  const conflictRules = logic.filter(
    (r) => r.enabled && r.actions.some((a) => conflicts.has(a.target))
  )

  const openEditor = (rule?: LogicRule) => {
    setEditingRule(rule ?? null)
    setEditorOpen(true)
  }

  return (
    <div className='flex flex-1 overflow-hidden'>
      {/* ── Left: Rule list ────────────────────────── */}
      <aside className='border-border bg-background flex w-64 shrink-0 flex-col border-r'>
        {/* Header */}
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
            {/* Conflict warning */}
            {conflictRules.length > 0 && (
              <div className='border-destructive/20 bg-destructive/5 flex gap-2 rounded-md border p-2'>
                <AlertTriangle className='text-destructive mt-0.5 h-3.5 w-3.5 shrink-0' />
                <p className='text-destructive text-[11px] leading-relaxed'>
                  {conflictRules.length} 个规则存在冲突：必填题可能被永久隐藏
                </p>
              </div>
            )}

            {/* Rule items */}
            {logic.map((rule) => {
              const mainType = rule.actions[0]?.type ?? 'default'
              const tagClass = ACTION_COLORS[mainType] ?? ACTION_COLORS.hide
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
                        tagClass
                      )}
                    >
                      {ACTION_LABELS[mainType] ?? mainType}
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

                  {/* Conflict indicator */}
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

            {/* Empty + add */}
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

      {/* ── Right: Interactive canvas ──────────────── */}
      <LogicCanvas />

      {/* ── Rule editor drawer ─────────────────────── */}
      <RuleEditor
        rule={editingRule}
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) setEditingRule(null)
        }}
      />
    </div>
  )
}
