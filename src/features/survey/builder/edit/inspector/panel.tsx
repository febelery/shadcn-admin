import { type ReactNode } from 'react'
import { cn } from 'cn'
import { ChevronDown, Info, Settings2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  getSurveyDefaultNumberingStyle,
  isSurveyNumberingEnabled,
  isQuestionNumberVisible,
} from '@/features/survey/core/question-numbering'
import { SURVEY_NUMBERING_OPTIONS } from '@/features/survey/shared/numbering-options'
import {
  getQuestionTypeHint,
  hasQuestionTypePreview,
} from '@/features/survey/shared/question-type-hints'
import { getQuestionTypeLabel } from '@/features/survey/shared/question-type-labels'
import { QuestionTypePreview } from '@/features/survey/shared/question-type-preview'
import type {
  QuestionContentPatch,
  QuestionConfigPatch,
  QuestionElement,
  QuestionType,
  SurveyElement,
} from '../../../core/types'
import { useBuilderStore } from '../../builder-session'
import { BuilderPanelHeader } from '../../shared/panel-header'
import { BuilderGuidance } from '../guidance'
import { InfoHint } from './question-fields/layout'
import { QuestionTypeInspectorFields } from './question-inspector'
import { getQuestionInspectorSection } from './question-inspector-section'

/** 面板内的白卡片:区块之间靠 12px 间距分,不靠细线 */
function InspectorCard({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'border-border/70 bg-card text-card-foreground overflow-hidden rounded-xl border shadow-xs',
        className
      )}
    >
      {children}
    </div>
  )
}

/** 开关行:一行两端对齐,左侧文案 + info,右侧开关 */
function InspectorSwitchRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <div className='flex min-w-0 items-center gap-1.5'>
        <Label
          htmlFor={id}
          className='text-foreground/85 min-w-0 cursor-pointer truncate text-sm'
        >
          {label}
        </Label>
        {hint ? <InfoHint label={hint} /> : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(!!c)}
        className='shrink-0'
      />
    </div>
  )
}

/** 题型说明不再占一个区块:题型进 Badge,说明与图示进 info 浮层 */
function QuestionTypeIndicator({ type }: { type: QuestionType }) {
  const showPreview = hasQuestionTypePreview(type)

  const badge = (
    <Badge
      variant='secondary'
      className='h-5 rounded-md px-1.5 text-[11px] leading-none font-medium'
    >
      {getQuestionTypeLabel(type)}
    </Badge>
  )

  if (!showPreview) {
    return (
      <div className='flex shrink-0 items-center gap-1.5'>
        {badge}
        <InfoHint label={getQuestionTypeHint(type)} className='mr-0.5' />
      </div>
    )
  }

  return (
    <div className='flex shrink-0 items-center gap-1.5'>
      {badge}
      <HoverCard>
        <HoverCardTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              className='text-muted-foreground/60 hover:text-foreground size-5 rounded-full hover:bg-transparent'
              aria-label='题型说明'
            />
          }
        >
          <Info className='size-3.5' />
        </HoverCardTrigger>
        <HoverCardContent side='bottom' align='end' className='w-64'>
          <p className='text-muted-foreground/80 text-xs leading-relaxed'>
            {getQuestionTypeHint(type)}
          </p>
          <div className='mt-3'>
            <QuestionTypePreview type={type} />
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}

// 题目属性配置面板组件
function QuestionInspector({ el }: { el: QuestionElement }) {
  const inspectorSection = getQuestionInspectorSection(el.type)
  const surveyStyle = useBuilderStore((s) =>
    getSurveyDefaultNumberingStyle(s.document)
  )
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const updateQuestionConfig = useBuilderStore((s) => s.updateQuestionConfig)
  const removeElement = useBuilderStore((s) => s.removeElement)

  const patch = (p: QuestionContentPatch) => updateQuestion(el.id, p)
  const patchConfig = (p: QuestionConfigPatch) => updateQuestionConfig(el.id, p)

  const surveyEnabled = isSurveyNumberingEnabled(surveyStyle)
  const numberVisible = isQuestionNumberVisible(el, surveyStyle)
  const surveyStyleLabel =
    SURVEY_NUMBERING_OPTIONS.find((o) => o.value === surveyStyle)?.label ??
    surveyStyle

  return (
    <div className='flex flex-col gap-3'>
      <InspectorSection
        title='基础信息'
        hint='标题、选项、必/选与题号也可在画布上直接点击编辑'
      >
        <Field className='gap-1.5'>
          <FieldLabel
            htmlFor='q-title'
            className='text-muted-foreground text-xs font-medium'
          >
            题目标题
          </FieldLabel>
          <Input
            id='q-title'
            className='h-9'
            value={el.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </Field>
        <Field className='gap-1.5'>
          <FieldLabel
            htmlFor='q-desc'
            className='text-muted-foreground text-xs font-medium'
          >
            题目说明
          </FieldLabel>
          <Textarea
            id='q-desc'
            rows={2}
            className='min-h-0 resize-y'
            value={el.description ?? ''}
            placeholder='选填，显示在标题下方'
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Field>
      </InspectorSection>

      <InspectorSection title='展示与逻辑'>
        {surveyEnabled ? (
          <InspectorSwitchRow
            id={`show-number-${el.id}`}
            label='显示本题题号'
            hint={`全卷样式：${surveyStyleLabel}，在「问卷设置」中修改`}
            checked={numberVisible}
            onCheckedChange={(c) => patch({ numbering: { show: c } })}
          />
        ) : (
          <p className='text-muted-foreground/70 text-xs leading-relaxed'>
            全卷已关闭题号（问卷设置 → {surveyStyleLabel}
            ）。可在画布点击题号区域切换单题显隐。
          </p>
        )}
        <InspectorSwitchRow
          id={`required-${el.id}`}
          label='必填'
          hint='画布左侧「必/选」徽章可快速切换'
          checked={el.required}
          onCheckedChange={(c) => patch({ required: c })}
        />
      </InspectorSection>

      <InspectorSection
        title={inspectorSection.title}
        defaultOpen={inspectorSection.defaultOpen}
      >
        <QuestionTypeInspectorFields
          question={el}
          onConfigChange={patchConfig}
        />
      </InspectorSection>

      <Button
        variant='outline'
        size='sm'
        className='text-destructive hover:bg-destructive/10 hover:text-destructive w-full'
        onClick={() => removeElement(el.id)}
      >
        删除此题
      </Button>
    </div>
  )
}

// 布局元素属性配置面板组件
function LayoutInspector({ el }: { el: SurveyElement }) {
  const removeElement = useBuilderStore((s) => s.removeElement)

  if (el.kind === 'divider') {
    return (
      <div className='flex flex-col gap-3'>
        <InspectorCard className='px-4 py-3.5'>
          <p className='text-muted-foreground/70 text-xs leading-relaxed'>
            分割线无额外配置
          </p>
        </InspectorCard>
        <Button
          variant='destructive'
          size='sm'
          className='w-full'
          onClick={() => removeElement(el.id)}
        >
          删除分割线
        </Button>
      </div>
    )
  }

  if (el.kind === 'rich_text') {
    return (
      <div className='flex flex-col gap-3'>
        <Button
          variant='destructive'
          size='sm'
          className='w-full'
          onClick={() => removeElement(el.id)}
        >
          删除说明块
        </Button>
      </div>
    )
  }

  return null
}

type Props = {
  className?: string
}

export function InspectorPanel({ className }: Props = {}) {
  const selectedEl = useBuilderStore((s) => {
    if (!s.selectedElementId) return undefined
    return s.document.elements.find((e) => e.id === s.selectedElementId)
  })

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <BuilderPanelHeader
        icon={Settings2}
        title='属性'
        action={
          selectedEl?.kind === 'question' ? (
            <QuestionTypeIndicator type={selectedEl.type} />
          ) : undefined
        }
      />
      <div className='bg-muted/40 text-foreground flex min-h-0 min-w-0 flex-1 flex-col'>
        <ScrollArea key={selectedEl?.id ?? 'empty'} className='min-h-0 flex-1'>
          <div className='min-w-0 overflow-x-hidden p-3'>
            {selectedEl?.kind === 'question' && (
              <QuestionInspector el={selectedEl} />
            )}
            {(selectedEl?.kind === 'divider' ||
              selectedEl?.kind === 'rich_text') && (
              <LayoutInspector el={selectedEl} />
            )}
            {!selectedEl && (
              <BuilderGuidance
                className='flex flex-col items-center justify-center gap-2 px-6 py-14 text-center'
                density='compact'
                title='未选中元素'
                description={
                  <>
                    在编辑区点击题目或布局块以编辑属性。逻辑与跳题请切换到顶栏
                    <strong className='text-sm leading-none font-semibold tracking-tight'>
                      「流程」
                    </strong>
                    。
                  </>
                }
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export function InspectorSection({
  title,
  hint,
  defaultOpen = true,
  children,
}: {
  title: string
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className='group/panel'>
      <InspectorCard>
        <CollapsibleTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              className='hover:bg-muted/50 h-auto min-h-11 w-full justify-between rounded-none px-4 py-2.5'
            />
          }
        >
          <span className='flex min-w-0 items-center gap-1.5 text-start'>
            <span className='text-foreground truncate text-sm font-semibold'>
              {title}
            </span>
            {hint ? <InfoHint label={hint} /> : null}
          </span>
          <span className='bg-muted text-muted-foreground group-data-[state=open]/panel:bg-primary/12 group-data-[state=open]/panel:text-primary flex size-6 shrink-0 items-center justify-center rounded-md transition-[color,background-color]'>
            <ChevronDown className='size-3.5 transition-transform group-data-[state=open]/panel:rotate-180' />
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className='overflow-hidden'>
          <div className='border-border/60 bg-card flex min-w-0 flex-col gap-4 overflow-x-hidden border-t px-4 pt-4 pb-4'>
            {children}
          </div>
        </CollapsibleContent>
      </InspectorCard>
    </Collapsible>
  )
}
