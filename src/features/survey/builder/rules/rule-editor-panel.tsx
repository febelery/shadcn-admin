import { useState } from 'react'
import { ChevronDown, MousePointerClick } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { StaticIssue } from '../../core/logic/analyzer'
import { actionTypeLabel } from '../../core/logic/rule-meta'
import { isRuleActionType, RULE_ACTION_TYPES } from '../../core/types'
import { useBuilderStore } from '../builder-session'
import { BuilderGuidance } from '../edit/guidance'
import { useRuleDraftEditor } from '../session/rule-authoring'
import {
  createRuleDraftModelProjector,
  type RuleDraftChange,
} from '../session/rule-draft'
import { ActionBuilder } from './action-builder'
import { ConditionBuilder } from './condition-builder'

function RuleSettings({
  ruleId,
  ruleName,
  generatedName,
  enabled,
  onRuleNameChange,
  onEnabledChange,
}: {
  ruleId: string
  ruleName: string
  generatedName: string
  enabled: boolean
  onRuleNameChange: (name: string) => void
  onEnabledChange: (enabled: boolean) => void
}) {
  return (
    <Collapsible className='group/rule-advanced'>
      <section className='border-border/70 bg-background flex min-w-0 flex-col overflow-hidden rounded-md border'>
        <CollapsibleTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            className='hover:bg-muted/50 flex h-10 w-full items-center justify-between rounded-none px-2.5'
          >
            <div className='flex min-w-0 items-center gap-2'>
              <span className='bg-muted text-muted-foreground flex h-5 min-w-7 items-center justify-center rounded px-1.5 text-[10px] leading-none font-semibold tracking-wide'>
                SET
              </span>
              <p className='text-xs leading-none font-medium'>设置</p>
            </div>
            <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/rule-advanced:rotate-180' />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='overflow-hidden'>
          <div className='flex min-w-0 flex-col gap-3 border-t px-2.5 py-2.5'>
            <div className='grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2'>
              <Label
                htmlFor={`rule-enabled-${ruleId}`}
                className='text-muted-foreground text-[11px] leading-none'
              >
                状态
              </Label>
              <div className='flex min-w-0 items-center justify-between gap-3 rounded-md border px-2.5 py-2'>
                <span className='text-xs leading-none'>
                  {enabled ? '已启用' : '已停用'}
                </span>
                <Switch
                  id={`rule-enabled-${ruleId}`}
                  checked={enabled}
                  onCheckedChange={onEnabledChange}
                  aria-label='启用规则'
                  className='shrink-0'
                />
              </div>
            </div>

            <div className='grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2'>
              <Label
                htmlFor={`rule-name-${ruleId}`}
                className='text-muted-foreground text-[11px] leading-none'
              >
                规则名
              </Label>
              <Input
                id={`rule-name-${ruleId}`}
                className='h-9 min-w-0'
                value={ruleName}
                placeholder={generatedName}
                onChange={(e) => onRuleNameChange(e.target.value)}
                onBlur={(e) => {
                  const next = e.currentTarget.value.trim()
                  onRuleNameChange(next || generatedName)
                }}
              />
            </div>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

type RuleEditorPanelProps = {
  className?: string
  ruleIssues: StaticIssue[]
}

export function RuleEditorPanel({
  className,
  ruleIssues,
}: RuleEditorPanelProps) {
  const { draft, hasChanges, changeDraft, applyDraft, cancelDraft } =
    useRuleDraftEditor()
  const [projectModel] = useState(createRuleDraftModelProjector)
  const model = useBuilderStore((s) =>
    draft ? projectModel(s.document, draft) : null
  )

  if (!draft || !model) {
    return (
      <div
        className={cn(
          'bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col',
          className
        )}
      >
        <BuilderGuidance
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 py-10 text-center',
            'px-6 py-12'
          )}
          icon={MousePointerClick}
          density='compact'
          title='未选中规则'
          description='从左侧列表选择规则，或点击流程图中的彩色连线进行编辑。'
        />
      </div>
    )
  }

  const rule = draft.value
  const hasBlockingIssues = ruleIssues.some(
    (issue) => issue.severity === 'error'
  )
  const change = (next: RuleDraftChange) => changeDraft(next)

  return (
    <div
      className={cn(
        'bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col',
        'min-h-0',
        className
      )}
    >
      <ScrollArea className='min-h-0 min-w-0 flex-1 overflow-x-hidden **:data-[slot=scroll-area-viewport]:overflow-x-hidden'>
        <div
          className={cn(
            'flex max-w-full min-w-0 flex-col gap-2.5 overflow-x-hidden',
            'p-2.5'
          )}
        >
          <div className='grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2 rounded-md px-0.5'>
            <Label className='text-muted-foreground text-[11px] leading-none'>
              类型
            </Label>
            <Select
              value={model.action.type}
              onValueChange={(value) => {
                if (!isRuleActionType(value)) return
                change({
                  type: 'action-type',
                  actionType: value,
                })
              }}
            >
              <SelectTrigger className='h-9'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                {RULE_ACTION_TYPES.filter((type) =>
                  model.availableActionTypes.includes(type)
                ).map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className='block max-w-full truncate'>
                      {actionTypeLabel(type)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ConditionBuilder
            key={rule.id}
            condition={rule.condition}
            onConditionChange={(condition) =>
              change({ type: 'condition', condition })
            }
            allowedSourceIds={model.allowedSourceIds}
            defaultSourceId={model.sourceId ?? model.allowedSourceIds[0]}
          />

          <ActionBuilder
            action={model.action}
            onChange={(action) => change({ type: 'action', action })}
            targetQuestionIds={model.targetQuestionIds}
            defaultTargetId={model.defaultTargetId}
            allowedTypes={[model.action.type]}
          />

          <RuleSettings
            ruleId={rule.id}
            ruleName={rule.name}
            generatedName={model.generatedName}
            enabled={rule.enabled}
            onRuleNameChange={(name) => change({ type: 'name', name })}
            onEnabledChange={(enabled) => change({ type: 'enabled', enabled })}
          />
        </div>
      </ScrollArea>
      <div className='border-border bg-background flex shrink-0 items-center justify-end gap-2 border-t p-3'>
        <Button type='button' variant='outline' onClick={cancelDraft}>
          取消
        </Button>
        <Button
          type='button'
          disabled={!hasChanges || hasBlockingIssues}
          onClick={applyDraft}
        >
          {draft.kind === 'create' ? '添加规则' : '应用修改'}
        </Button>
      </div>
    </div>
  )
}
