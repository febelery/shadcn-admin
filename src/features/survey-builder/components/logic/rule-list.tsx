import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { LogicRule } from '@/features/survey-builder/types'
import { cn } from '@/lib/utils'
import { RuleEditor } from './rule-editor'
import { detectConflicts } from '@/features/survey-builder/utils'

const TAG_COLORS: Record<string, string> = {
  jump_question: 'bg-blue-50 text-blue-600',
  show: 'bg-green-50 text-green-700',
  hide: 'bg-muted text-muted-foreground',
  end: 'bg-red-50 text-red-600',
  set_required: 'bg-amber-50 text-amber-600',
  default: 'bg-muted text-muted-foreground',
}

function getMainActionType(rule: LogicRule) {
  return rule.actions[0]?.type ?? 'default'
}

export function RuleList() {
  const {
    logic,
    schema,
    removeRule,
    updateRule,
    setActiveRule,
    activeRuleId,
  } = useBuilderStore()
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
    <aside className="flex w-72 shrink-0 flex-col border-r border-border/50 bg-background">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/50 px-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          逻辑规则
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {logic.length}
          </span>
        </span>
        <Button
          size="sm"
          className="h-6 text-[11px]"
          onClick={() => openEditor()}
        >
          + 新逻辑规则
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1.5 p-2">
          {/* Conflict alert */}
          {conflictRules.length > 0 && (
            <div className="flex animate-in fade-in gap-2 rounded-md border border-red-200 bg-red-50 p-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <div className="text-[11px] leading-relaxed text-red-700">
                <strong>{conflictRules.length} 个冲突</strong>
                <br />
                存在必填问题可能被永久隐藏的逻辑。
              </div>
            </div>
          )}

          {logic.map((rule) => {
            const mainType = getMainActionType(rule)
            const tagClass = TAG_COLORS[mainType] ?? TAG_COLORS.default
            const isActive = activeRuleId === rule.id
            const hasConflict =
              rule.enabled && rule.actions.some((a) => conflicts.has(a.target))

            return (
              <div
                key={rule.id}
                className={cn(
                  'cursor-pointer overflow-hidden rounded-lg border transition-all',
                  isActive
                    ? 'border-foreground shadow-[0_0_0_2px_rgba(9,9,11,.05)]'
                    : 'border-border/50 hover:border-border',
                  !rule.enabled && 'opacity-50'
                )}
                onClick={() => {
                  setActiveRule(rule.id)
                  openEditor(rule)
                }}
              >
                <div className="flex items-center gap-1.5 px-2.5 py-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => {
                      updateRule(rule.id, { enabled: v })
                    }}
                    className="shrink-0 scale-[0.75]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="flex-1 truncate text-xs font-medium">
                    {rule.name}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide',
                      tagClass
                    )}
                  >
                    {mainType.replace('_', ' ').slice(0, 8)}
                  </span>
                  <button
                    className="shrink-0 p-0.5 text-border transition-colors hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeRule(rule.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {isActive && (
                  <div className="border-t border-border/50 px-2.5 pb-2.5">
                    {hasConflict && (
                      <div className="mt-2 flex gap-1.5 rounded bg-red-50 px-2 py-1.5">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                        <p className="text-[10px] leading-tight text-red-600">
                          目标问题为必填且可能被永久隐藏
                        </p>
                      </div>
                    )}
                    <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {rule.condition.rules.map((r: any, i) => (
                        <span key={i}>
                          当{' '}
                          <strong className="text-foreground">
                            {r.field.slice(0, 6)}
                          </strong>{' '}
                          {r.operator}{' '}
                          <strong className="text-foreground">
                            {String(r.value)}
                          </strong>
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="text-border">→</span>
                      {rule.actions.map((a, i) => (
                        <span key={i}>
                          {a.type}{' '}
                          <span className="rounded bg-muted px-1 font-mono text-[10px] text-foreground">
                            {a.target.slice(0, 6)}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={() => openEditor()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-all hover:border-foreground hover:bg-muted hover:text-foreground"
          >
            <span>+</span> 新增逻辑规则
          </button>
        </div>
      </ScrollArea>

      <RuleEditor
        rule={editingRule}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </aside>
  )
}
