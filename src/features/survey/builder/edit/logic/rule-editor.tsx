import { ChevronDown, MousePointerClick, X } from 'lucide-react'
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
import { extractQuestionRefsFromWhen } from '@/features/survey/core/logic/condition-serializer'
import {
  EDITABLE_RULE_ACTION_TYPES,
  getAutoRuleName,
  getAvailableRuleActionTypes,
  getRuleSourceQuestionIds,
  getRuleTargetQuestionIds,
  normalizeRuleAction,
  resolveRuleSourceId,
} from '@/features/survey/core/logic/rule-constraints'
import { createRuleAction } from '@/features/survey/core/logic/rule-utils'
import { getQuestionReferenceLabel } from '@/features/survey/shared/question-numbering'
import { useBuilderStore } from '../../store'
import type { RuleAction, RuleActionType } from '../../types'
import { BuilderGuidance } from '../guidance'
import { ActionBuilder } from './action-builder'
import { ConditionBuilder } from './condition-builder'
import { useSurveyQuestions } from './use-survey-questions'

const RULE_TYPE_OPTIONS: { value: RuleActionType; label: string }[] = [
  { value: 'show', label: '显示题目' },
  { value: 'hide', label: '隐藏题目' },
  { value: 'jump_to_question', label: '跳转到题目' },
  { value: 'end', label: '结束问卷' },
]

function AdvancedRuleSettings({
  ruleId,
  ruleName,
  generatedName,
  enabled,
  expression,
  onRuleNameChange,
  onEnabledChange,
}: {
  ruleId: string
  ruleName: string
  generatedName: string
  enabled: boolean
  expression: string
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
                ADV
              </span>
              <p className='text-xs leading-none font-medium'>高级</p>
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

            <div className='grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] items-start gap-2'>
              <Label className='text-muted-foreground pt-2 text-[11px] leading-none'>
                表达式
              </Label>
              <div className='min-w-0'>
                <div className='mb-1.5 flex min-w-0 items-center justify-end'>
                  <span className='border-border/70 text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] leading-none'>
                    只读
                  </span>
                </div>
                <pre className='bg-muted/30 text-muted-foreground border-border/60 max-w-full overflow-x-auto rounded-md border px-2.5 py-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap'>
                  {expression || '未设置条件'}
                </pre>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

type Props = {
  className?: string
  /** 内嵌在流程右栏时由外层提供标题栏 */
  hideHeader?: boolean
  onClose?: () => void
  /** 限制动作类型（流程右栏类型 Tab） */
  allowedActionTypes?: RuleActionType[]
  /** 流程右栏内嵌时隐藏底部说明 */
  hideFooterNote?: boolean
}

export function RuleEditorPanel({
  className,
  hideHeader,
  onClose,
  allowedActionTypes,
  hideFooterNote,
}: Props) {
  const editingRuleId = useBuilderStore((s) => s.editingRuleId)
  const schema = useBuilderStore((s) => s.schema)
  const navigate = useBuilderStore((s) => s.navigate)
  const updateRule = useBuilderStore((s) => s.updateRule)

  const questions = useSurveyQuestions()

  const rule = schema?.rules.find((r) => r.id === editingRuleId)
  const action = rule?.action ?? createRuleAction('show')
  const allowedSourceIds = getRuleSourceQuestionIds(questions)
  const defaultSourceId = allowedSourceIds[0]

  const handleClose = () => {
    navigate({ type: 'clear-rule-focus' })
    onClose?.()
  }

  if (!rule) {
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

  const sourceId = resolveRuleSourceId(
    rule.when,
    allowedSourceIds,
    defaultSourceId
  )
  const editableActionTypes = allowedActionTypes ?? EDITABLE_RULE_ACTION_TYPES
  const targetIdsFor = (
    type: RuleActionType,
    currentSourceId = sourceId,
    when = rule.when
  ) =>
    getRuleTargetQuestionIds({
      type,
      sourceId: currentSourceId,
      questions,
      rules: schema?.rules ?? [],
      currentRuleId: rule.id,
      when,
    })
  const availableActionTypes = getAvailableRuleActionTypes({
    requestedTypes: editableActionTypes,
    sourceId,
    questions,
    rules: schema?.rules ?? [],
    currentRuleId: rule.id,
    when: rule.when,
  })
  const effectiveActionTypes: RuleActionType[] =
    availableActionTypes.length > 0 ? availableActionTypes : ['end']
  const getTargetLabel = (id?: string) => {
    const q = id ? questions.find((item) => item.id === id) : undefined
    return q && schema ? getQuestionReferenceLabel(q, schema) : undefined
  }
  const normalizeActionForRule = (
    requestedType: RuleActionType,
    requestedTarget: string | undefined,
    currentSourceId: string | undefined,
    when: string,
    base: RuleAction = action
  ): RuleAction =>
    normalizeRuleAction({
      action: base,
      requestedType,
      requestedTarget,
      fallbackTypes: editableActionTypes,
      sourceId: currentSourceId,
      questions,
      rules: schema?.rules ?? [],
      currentRuleId: rule.id,
      when,
    })
  const selectedRuleType = effectiveActionTypes.includes(action.type)
    ? action.type
    : effectiveActionTypes[0]
  const targetQuestionIds = targetIdsFor(selectedRuleType)
  const actionTarget =
    selectedRuleType === 'end'
      ? undefined
      : action.target && targetQuestionIds.includes(action.target)
        ? action.target
        : targetQuestionIds[0]
  const normalizedAction = normalizeActionForRule(
    selectedRuleType,
    actionTarget,
    sourceId,
    rule.when
  )
  const defaultTargetId = normalizedAction.target ?? targetQuestionIds[0]
  const generatedRuleName = getAutoRuleName(
    normalizedAction.type,
    getTargetLabel(normalizedAction.target)
  )
  const resolveRuleNameFor = (next: RuleAction) => {
    const currentName = rule.name.trim()
    if (!currentName || currentName === generatedRuleName) {
      return getAutoRuleName(next.type, getTargetLabel(next.target))
    }
    return rule.name
  }

  const handleTypeChange = (type: RuleActionType) => {
    const next = normalizeActionForRule(
      type,
      action.target,
      sourceId,
      rule.when
    )
    updateRule(rule.id, {
      name: resolveRuleNameFor(next),
      action: next,
    })
  }

  const handleActionChange = (next: typeof action) => {
    const normalized = normalizeActionForRule(
      next.type,
      next.target,
      sourceId,
      rule.when,
      next
    )
    updateRule(rule.id, {
      name: resolveRuleNameFor(normalized),
      action: normalized,
    })
  }

  const handleWhenChange = (when: string) => {
    const nextSourceFromWhen = extractQuestionRefsFromWhen(when)[0]
    const nextSourceId =
      nextSourceFromWhen && allowedSourceIds.includes(nextSourceFromWhen)
        ? nextSourceFromWhen
        : defaultSourceId
    const nextAction = normalizeActionForRule(
      selectedRuleType,
      normalizedAction.target,
      nextSourceId,
      when,
      normalizedAction
    )
    updateRule(rule.id, {
      when,
      name: resolveRuleNameFor(nextAction),
      action: nextAction,
    })
  }

  return (
    <div
      className={cn(
        'bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col',
        'min-h-0',
        className
      )}
    >
      {!hideHeader ? (
        <div className='border-border flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3'>
          <p className='text-sm leading-none font-semibold tracking-tight'>
            规则
          </p>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-8 shrink-0'
            onClick={handleClose}
            aria-label='关闭规则编辑'
          >
            <X className='size-4' />
          </Button>
        </div>
      ) : null}
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
              value={selectedRuleType}
              onValueChange={(v) => handleTypeChange(v as RuleActionType)}
            >
              <SelectTrigger className='h-9'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                {RULE_TYPE_OPTIONS.filter((o) =>
                  effectiveActionTypes.includes(o.value)
                ).map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className='block max-w-full truncate'>{o.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ConditionBuilder
            when={rule.when}
            onWhenChange={handleWhenChange}
            allowedSourceIds={allowedSourceIds}
            defaultSourceId={sourceId ?? defaultSourceId}
          />

          <ActionBuilder
            action={normalizedAction}
            onChange={handleActionChange}
            targetQuestionIds={targetQuestionIds}
            defaultTargetId={defaultTargetId}
            allowedTypes={[normalizedAction.type]}
          />

          <AdvancedRuleSettings
            ruleId={rule.id}
            ruleName={rule.name}
            generatedName={generatedRuleName}
            enabled={rule.enabled}
            expression={rule.when}
            onRuleNameChange={(name) => updateRule(rule.id, { name })}
            onEnabledChange={(enabled) => updateRule(rule.id, { enabled })}
          />

          {!hideFooterNote ? (
            <p className='text-muted-foreground text-xs leading-relaxed'>
              修改会即时写入问卷 schema，保存问卷后持久化。
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
