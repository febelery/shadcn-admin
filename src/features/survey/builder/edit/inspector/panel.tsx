import { type ReactNode } from 'react'
import { Settings2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  getInspectorSectionTitle,
  inspectorSectionDefaultOpen,
} from '@/features/survey/core/question-capabilities'
import {
  isSurveyNumberingEnabled,
  isQuestionNumberVisible,
  SURVEY_NUMBERING_OPTIONS,
} from '@/features/survey/shared/question-numbering'
import { getSurveyDefaultNumberingStyle } from '@/features/survey/shared/question-numbering'
import { getQuestionTypeLabel } from '@/features/survey/shared/question-registry'
import {
  getQuestionTypeHint,
  hasQuestionTypePreview,
} from '@/features/survey/shared/question-type-hints'
import { QuestionTypePreview } from '@/features/survey/shared/question-type-preview'
import { getEditorSection } from '../../../core/editor-schema'
import { BuilderPanelHeader } from '../../shared/panel-header'
import { useBuilderStore } from '../../store'
import type { SurveyElement, QuestionElement } from '../../types'
import { BuilderGuidance } from '../guidance'
import { EndPagePanel } from '../setting/end-page-panel'
import { MetaCoverPanel } from '../setting/meta-cover-panel'
import { PublishInfoCard } from '../setting/publish-info-card'
import { SubmissionPanel } from '../setting/submission-panel'
import { ThemePanel } from '../setting/theme-panel'
import { TimeWindowPanel } from '../setting/time-window-panel'
import { QuestionTypeInspectorFields } from './question-inspector'

// 题目属性配置面板组件
function QuestionInspector({
  sectionId,
  el,
}: {
  sectionId: string
  el: QuestionElement
}) {
  const surveyStyle = useBuilderStore((s) =>
    s.schema ? getSurveyDefaultNumberingStyle(s.schema) : 'decimal'
  )
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const updateQuestionConfig = useBuilderStore((s) => s.updateQuestionConfig)
  const removeElement = useBuilderStore((s) => s.removeElement)

  const patch = (p: Partial<QuestionElement>) =>
    updateQuestion(sectionId, el.id, p)
  const patchConfig = (p: Partial<QuestionElement['config']>) =>
    updateQuestionConfig(sectionId, el.id, p)

  const typeLabel = getQuestionTypeLabel(el.type)
  const surveyEnabled = isSurveyNumberingEnabled(surveyStyle)
  const numberVisible = isQuestionNumberVisible(el, surveyStyle)
  const surveyStyleLabel =
    SURVEY_NUMBERING_OPTIONS.find((o) => o.value === surveyStyle)?.label ??
    surveyStyle

  return (
    <div className='flex flex-col gap-3'>
      <InspectorSection title='题型说明' description={typeLabel}>
        <p className='text-muted-foreground text-xs leading-relaxed'>
          {getQuestionTypeHint(el.type)}
        </p>
        {hasQuestionTypePreview(el.type) ? (
          <QuestionTypePreview type={el.type} />
        ) : null}
      </InspectorSection>

      <InspectorSection title='基础信息' description='与画布内联编辑同步'>
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
        <p className='text-muted-foreground text-xs leading-relaxed'>
          标题、选项、必/选与题号也可在画布上直接点击编辑。
        </p>
      </InspectorSection>

      <InspectorSection title='展示与逻辑'>
        {!surveyEnabled ? (
          <p className='text-muted-foreground text-xs leading-relaxed'>
            全卷已关闭题号（问卷设置 → {surveyStyleLabel}
            ）。可在画布点击题号区域切换单题显隐。
          </p>
        ) : (
          <Field
            orientation='horizontal'
            className='items-start justify-between gap-3'
          >
            <div className='flex min-w-0 flex-col gap-0.5'>
              <FieldLabel
                htmlFor={`show-number-${el.id}`}
                className='text-sm leading-relaxed font-normal'
              >
                显示本题题号
              </FieldLabel>
              <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
                {`全卷样式：${surveyStyleLabel}，在「问卷设置」中修改`}
              </FieldDescription>
            </div>
            <Switch
              id={`show-number-${el.id}`}
              checked={numberVisible}
              onCheckedChange={(c) => patch({ numbering: { show: !!c } })}
              className='mt-0.5 shrink-0'
            />
          </Field>
        )}
        <Field
          orientation='horizontal'
          className='items-start justify-between gap-3'
        >
          <div className='flex min-w-0 flex-col gap-0.5'>
            <FieldLabel
              htmlFor={`required-${el.id}`}
              className='text-sm leading-relaxed font-normal'
            >
              必填
            </FieldLabel>
            <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
              画布左侧「必/选」徽章可快速切换
            </FieldDescription>
          </div>
          <Switch
            id={`required-${el.id}`}
            checked={el.required}
            onCheckedChange={(c) => patch({ required: !!c })}
            className='mt-0.5 shrink-0'
          />
        </Field>
      </InspectorSection>

      <InspectorSection
        title={getInspectorSectionTitle(el.type)}
        description='本题专属配置'
        defaultOpen={inspectorSectionDefaultOpen(el.type)}
      >
        <QuestionTypeInspectorFields
          type={el.type}
          el={el}
          patchConfig={patchConfig}
        />
      </InspectorSection>

      <Separator />

      <Button
        variant='destructive'
        size='sm'
        className='w-full'
        onClick={() => removeElement(sectionId, el.id)}
      >
        删除此题
      </Button>
    </div>
  )
}

// 布局元素属性配置面板组件
function LayoutInspector({
  sectionId,
  el,
}: {
  sectionId: string
  el: SurveyElement
}) {
  const removeElement = useBuilderStore((s) => s.removeElement)
  const updateHtmlBlock = useBuilderStore((s) => s.updateHtmlBlock)

  if (el.kind === 'divider') {
    return (
      <div className='flex max-w-full min-w-0 flex-col gap-4 overflow-x-hidden'>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          分割线无额外配置
        </p>
        <Button
          variant='destructive'
          size='sm'
          className='w-full'
          onClick={() => removeElement(sectionId, el.id)}
        >
          删除分割线
        </Button>
      </div>
    )
  }

  if (el.kind === 'html_block') {
    return (
      <div className='flex max-w-full min-w-0 flex-col gap-4 overflow-x-hidden'>
        <div className='flex flex-col gap-1.5'>
          <Label className='text-muted-foreground text-xs font-medium'>
            说明内容
          </Label>
          {/* 将原本的 Editor 富文本编辑器改为普通的 Textarea 组件 */}
          <Textarea
            value={el.html}
            onChange={(e) =>
              updateHtmlBlock(sectionId, el.id, { html: e.target.value })
            }
            placeholder='输入说明内容…'
          />
        </div>
        <Button
          variant='destructive'
          size='sm'
          className='w-full'
          onClick={() => removeElement(sectionId, el.id)}
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

// 右侧属性面板，直接从 EditContext 中读取状态，不再直接依赖全局 Store
export function InspectorPanel({ className }: Props = {}) {
  const schema = useBuilderStore((s) => s.schema)
  const inspectorTab = useBuilderStore((s) => s.inspectorTab)
  const setInspectorTab = useBuilderStore((s) => s.setInspectorTab)

  const sectionId = useBuilderStore((s) =>
    s.schema
      ? (getEditorSection(s.schema)?.id ?? s.selectedSectionId)
      : s.selectedSectionId
  )

  const selectedEl = useBuilderStore((s) => {
    if (!s.schema || !s.selectedElementId) return undefined
    const section = getEditorSection(s.schema)
    return section?.elements.find((e) => e.id === s.selectedElementId)
  })
  const hasSchema = !!schema

  if (!hasSchema || !sectionId) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
          className
        )}
      >
        <BuilderPanelHeader icon={Settings2} title='属性' />
        <div className='bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col'>
          <p className='text-muted-foreground p-4 text-sm leading-relaxed'>
            加载中…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <Tabs
        value={inspectorTab}
        onValueChange={(v) => setInspectorTab(v as 'element' | 'settings')}
        className='flex min-h-0 flex-1 flex-col gap-0'
      >
        <BuilderPanelHeader
          icon={Settings2}
          title='属性'
          action={
            <TabsList className='grid h-8 shrink-0 grid-cols-2'>
              <TabsTrigger value='element' className='px-2 text-xs'>
                题目
              </TabsTrigger>
              <TabsTrigger value='settings' className='px-2 text-xs'>
                问卷设置
              </TabsTrigger>
            </TabsList>
          }
        />
        <div className='bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col'>
          <ScrollArea className='min-h-0 flex-1'>
            <div className='min-w-0 overflow-x-hidden p-4'>
              <TabsContent value='element' className='mt-0 outline-none'>
                {selectedEl?.kind === 'question' && (
                  <QuestionInspector sectionId={sectionId} el={selectedEl} />
                )}
                {(selectedEl?.kind === 'divider' ||
                  selectedEl?.kind === 'html_block') && (
                  <LayoutInspector sectionId={sectionId} el={selectedEl} />
                )}
                {!selectedEl && (
                  <BuilderGuidance
                    className='flex flex-col items-center justify-center gap-1.5 py-10 text-center'
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
              </TabsContent>
              <TabsContent value='settings' className='mt-0 outline-none'>
                <div className='flex flex-col gap-3'>
                  <TimeWindowPanel />
                  <MetaCoverPanel />
                  <EndPagePanel />
                  <SubmissionPanel />
                  <ThemePanel />
                  <PublishInfoCard />
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  )
}

export function InspectorSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className='group/panel'>
      <Card className='border-border/60 gap-0 overflow-hidden py-0 shadow-sm'>
        <CardHeader className='block p-0'>
          <CollapsibleTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              className='hover:bg-muted/50 h-auto min-h-12 w-full justify-between rounded-none px-4 py-3'
            >
              <div className='flex min-w-0 flex-col items-start gap-1 text-start'>
                <CardTitle className='text-sm leading-none font-semibold tracking-tight'>
                  {title}
                </CardTitle>
                {description ? (
                  <CardDescription className='text-muted-foreground text-xs leading-relaxed'>
                    {description}
                  </CardDescription>
                ) : null}
              </div>
              <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/panel:rotate-180' />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent className='overflow-hidden'>
          <CardContent
            className={cn(
              'flex min-w-0 flex-col overflow-x-hidden px-4 pt-0 pb-4',
              'gap-4'
            )}
          >
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
