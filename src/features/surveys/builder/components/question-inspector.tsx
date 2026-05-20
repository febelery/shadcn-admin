import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type { QuestionElement } from '../../core/types'
import {
  getInspectorSectionTitle,
  hasInspectorConfigSection,
  inspectorSectionDefaultOpen,
} from '../../core/question-capabilities'
import { getQuestionTypeLabel } from '../../shared/question-registry'
import {
  isQuestionNumberVisible,
  isSurveyNumberingEnabled,
  SURVEY_NUMBERING_OPTIONS,
  type SurveyDefaultNumberingStyle,
} from '../../shared/question-numbering'
import {
  getQuestionTypeHint,
  hasQuestionTypePreview,
} from '../../shared/question-type-hints'
import { QuestionTypePreview } from '../../shared/question-type-preview'
import { QuestionTypeInspectorFields } from '../question-type-inspector'
import { useBuilderStore } from '../store'
import { builderSettingsRoot, builderTypeCaption } from '../ui'
import {
  InspectorFormField,
  InspectorSection,
  InspectorSwitchField,
} from './inspector-primitives'

type Props = {
  sectionId: string
  el: QuestionElement
}

export function QuestionInspector({ sectionId, el }: Props) {
  const surveyStyle = useBuilderStore(
    (s) =>
      (s.schema?.meta.defaultQuestionNumbering ?? 'decimal') as SurveyDefaultNumberingStyle
  )

  const patch = (p: Partial<QuestionElement>) =>
    useBuilderStore.getState().updateQuestion(sectionId, el.id, p)
  const patchConfig = (p: Partial<QuestionElement['config']>) =>
    useBuilderStore.getState().updateQuestionConfig(sectionId, el.id, p)

  const typeLabel = getQuestionTypeLabel(el.type)
  const surveyEnabled = isSurveyNumberingEnabled(surveyStyle)
  const numberVisible = isQuestionNumberVisible(el, surveyStyle)
  const surveyStyleLabel =
    SURVEY_NUMBERING_OPTIONS.find((o) => o.value === surveyStyle)?.label ??
    surveyStyle

  return (
    <div className={builderSettingsRoot}>
      <InspectorSection title='题型说明' description={typeLabel}>
        <p className={builderTypeCaption}>
          {getQuestionTypeHint(el.type)}
        </p>
        {hasQuestionTypePreview(el.type) ? (
          <QuestionTypePreview type={el.type} />
        ) : null}
      </InspectorSection>

      <InspectorSection
        title='基础信息'
        description='与画布内联编辑同步'
      >
        <InspectorFormField label='题目标题' htmlFor='q-title'>
          <Input
            id='q-title'
            className='h-9'
            value={el.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </InspectorFormField>
        <InspectorFormField label='题目说明' htmlFor='q-desc'>
          <Textarea
            id='q-desc'
            rows={2}
            className='min-h-0 resize-y'
            value={el.description ?? ''}
            placeholder='选填，显示在标题下方'
            onChange={(e) => patch({ description: e.target.value })}
          />
        </InspectorFormField>
        <p className={builderTypeCaption}>
          标题、选项、必/选与题号也可在画布上直接点击编辑。
        </p>
      </InspectorSection>

      <InspectorSection title='展示与逻辑'>
        {!surveyEnabled ? (
          <p className={builderTypeCaption}>
            全卷已关闭题号（问卷设置 → {surveyStyleLabel}）。可在画布点击题号区域切换单题显隐。
          </p>
        ) : (
          <InspectorSwitchField
            id={`show-number-${el.id}`}
            label='显示本题题号'
            description={`全卷样式：${surveyStyleLabel}，在「问卷设置」中修改`}
            checked={numberVisible}
            onCheckedChange={(c) => patch({ numbering: { show: !!c } })}
          />
        )}
        <InspectorSwitchField
          id={`required-${el.id}`}
          label='必填'
          description='画布左侧「必/选」徽章可快速切换'
          checked={el.required}
          onCheckedChange={(c) => patch({ required: !!c })}
        />
      </InspectorSection>

      {hasInspectorConfigSection(el.type) ? (
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
      ) : null}

      <Separator />

      <Button
        variant='destructive'
        size='sm'
        className='w-full'
        onClick={() =>
          useBuilderStore.getState().removeElement(sectionId, el.id)
        }
      >
        删除此题
      </Button>
    </div>
  )
}
