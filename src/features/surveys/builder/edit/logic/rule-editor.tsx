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
import { canUseQuestionAsRuleSource } from '../../../core/logic/rule-capabilities'
import type { RuleAction, RuleActionType } from '../../types'
import {
  useBuilderStatic,
  useBuilderStructure,
  useBuilderActiveState,
} from '../context'
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
const EDITABLE_RULE_TYPES = RULE_TYPE_OPTIONS.map((o) => o.value)

function isEditableRuleType(type: RuleActionType): boolean {
  return EDITABLE_RULE_TYPES.includes(type)
}

function autoRuleName(type: RuleActionType, targetLabel?: string) {
  switch (type) {
    case 'show':
      return `显示 ${targetLabel ?? '题目'}`
    case 'hide':
      return `隐藏 ${targetLabel ?? '题目'}`
    case 'jump_to_question':
      return `跳转到 ${targetLabel ?? '题目'}`
    case 'end':
      return '结束问卷'
    default:
      return '逻辑规则'
  }
}

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
                <pre className='bg-muted/30 text-muted-foreground border-border/60 max-w-full overflow-x-auto rounded-md border px-2.5 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all'>{expression || '未设置条件'}</pre>
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
  const { editingRuleId } = useBuilderActiveState()
  const { schema } = useBuilderStructure()
  const {
    setEditingRuleId,
    updateRule,
    extractQuestionRefsFromWhen,
    createRuleAction,
    getQuestionReferenceLabel,
  } = useBuilderStatic()

  const questions = useSurveyQuestions()

  const rule = schema?.rules.find((r) => r.id === editingRuleId)
  const action = rule?.actions[0] ?? createRuleAction('show')
  const allowedSourceIds = questions
    .filter(canUseQuestionAsRuleSource)
    .map((q) => q.id)
  const defaultSourceId = allowedSourceIds[0]

  const handleClose = () => {
    setEditingRuleId(null)
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

  const sourceFromWhen = extractQuestionRefsFromWhen(rule.when)[0]
  const sourceId =
    sourceFromWhen && allowedSourceIds.includes(sourceFromWhen)
      ? sourceFromWhen
      : defaultSourceId
  const editableActionTypes = (
    allowedActionTypes ?? EDITABLE_RULE_TYPES
  ).filter(isEditableRuleType)
  const sourceIndex = (id?: string) =>
    id ? questions.findIndex((q) => q.id === id) : -1
  const questionIdsAfter = (id?: string) => {
    const idx = sourceIndex(id)
    return idx >= 0 ? questions.slice(idx + 1).map((q) => q.id) : []
  }
  const navigationLockFor = (when: string) => {
    if (!schema) return null
    const source = extractQuestionRefsFromWhen(when)[0]
    if (!source) return null
    const targetKeys = new Set<string>()

    for (const item of schema.rules) {
      if (item.id === rule.id || !item.enabled) continue
      if (item.when.trim() !== when.trim()) continue
      if (extractQuestionRefsFromWhen(item.when)[0] !== source) continue
      const nav = item.actions.find(
        (a) => a.type === 'jump_to_question' || a.type === 'end'
      )
      if (!nav) continue
      targetKeys.add(nav.type === 'end' ? '__end__' : (nav.target ?? ''))
    }

    if (targetKeys.size !== 1) return null
    const [target] = [...targetKeys]
    return target === '__end__'
      ? { type: 'end' as const }
      : { type: 'question' as const, target }
  }
  const targetIdsFor = (
    type: RuleActionType,
    currentSourceId = sourceId,
    when = rule.when
  ) => {
    const laterIds = questionIdsAfter(currentSourceId)
    if (type === 'show') return laterIds
    if (type === 'hide') {
      return laterIds.filter((id) => {
        const q = questions.find((item) => item.id === id)
        return q && !q.required
      })
    }
    if (type === 'jump_to_question') {
      const lock = navigationLockFor(when)
      if (lock?.type === 'end') return []
      if (lock?.type === 'question') {
        return laterIds.includes(lock.target) ? [lock.target] : []
      }
      return laterIds
    }
    return []
  }
  const actionTypeAvailable = (
    type: RuleActionType,
    currentSourceId = sourceId,
    when = rule.when
  ) => {
    if (!currentSourceId) return false
    if (type === 'end') return navigationLockFor(when)?.type !== 'question'
    return targetIdsFor(type, currentSourceId, when).length > 0
  }
  const availableActionTypes = (
    editableActionTypes.length > 0 ? editableActionTypes : EDITABLE_RULE_TYPES
  ).filter((type) => actionTypeAvailable(type))
  const effectiveActionTypes: RuleActionType[] =
    availableActionTypes.length > 0 ? availableActionTypes : ['end']
  const getTargetLabel = (id?: string) => {
    const q = id ? questions.find((item) => item.id === id) : undefined
    return q && schema ? getQuestionReferenceLabel(q, schema) : undefined
  }
  const normalizeAction = (
    requestedType: RuleActionType,
    requestedTarget: string | undefined,
    currentSourceId: string | undefined,
    when: string,
    base: RuleAction = action
  ): RuleAction => {
    const available = (
      editableActionTypes.length > 0 ? editableActionTypes : EDITABLE_RULE_TYPES
    ).filter((type) => actionTypeAvailable(type, currentSourceId, when))
    const type = available.includes(requestedType)
      ? requestedType
      : (available[0] ?? 'end')
    const targetIds = targetIdsFor(type, currentSourceId, when)
    const target =
      type === 'end'
        ? undefined
        : requestedTarget && targetIds.includes(requestedTarget)
          ? requestedTarget
          : targetIds[0]

    return { ...base, type, target }
  }
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
  const normalizedAction = normalizeAction(
    selectedRuleType,
    actionTarget,
    sourceId,
    rule.when
  )
  const defaultTargetId = normalizedAction.target ?? targetQuestionIds[0]
  const generatedRuleName = autoRuleName(
    normalizedAction.type,
    getTargetLabel(normalizedAction.target)
  )
  const resolveRuleNameFor = (next: RuleAction) => {
    const currentName = rule.name.trim()
    if (!currentName || currentName === generatedRuleName) {
      return autoRuleName(next.type, getTargetLabel(next.target))
    }
    return rule.name
  }

  const handleTypeChange = (type: RuleActionType) => {
    const next = normalizeAction(type, action.target, sourceId, rule.when)
    updateRule(rule.id, {
      name: resolveRuleNameFor(next),
      actions: [next],
    })
  }

  const handleActionChange = (next: typeof action) => {
    const normalized = normalizeAction(
      next.type,
      next.target,
      sourceId,
      rule.when,
      next
    )
    updateRule(rule.id, {
      name: resolveRuleNameFor(normalized),
      actions: [normalized],
    })
  }

  const handleWhenChange = (when: string) => {
    const nextSourceFromWhen = extractQuestionRefsFromWhen(when)[0]
    const nextSourceId =
      nextSourceFromWhen && allowedSourceIds.includes(nextSourceFromWhen)
        ? nextSourceFromWhen
        : defaultSourceId
    const nextAction = normalizeAction(
      selectedRuleType,
      normalizedAction.target,
      nextSourceId,
      when,
      normalizedAction
    )
    updateRule(rule.id, {
      when,
      name: resolveRuleNameFor(nextAction),
      actions: [nextAction],
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
      <ScrollArea className='min-h-0 min-w-0 flex-1 overflow-x-hidden [&_[data-slot=scroll-area-viewport]]:overflow-x-hidden'>
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
                    <span className='block max-w-full truncate'>
                      {o.label}
                    </span>
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
