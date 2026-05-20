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
  getQuestionTypeHint,
  hasQuestionTypePreview,
} from '../../shared/question-type-hints'
import { QuestionTypePreview } from '../../shared/question-type-preview'
import { QuestionTypeInspectorFields } from '../question-type-inspector'
import { useBuilderStore } from '../store'
import { builderSettingsRoot } from '../ui'
import {
  InspectorFormField,
  InspectorSection,
  InspectorSwitchField,
} from './inspector-primitives'
import { QuestionNumberingInspector } from './question-numbering-inspector'

type Props = {
  sectionId: string
  el: QuestionElement
}

export function QuestionInspector({ sectionId, el }: Props) {
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const updateQuestionConfig = useBuilderStore((s) => s.updateQuestionConfig)
  const removeElement = useBuilderStore((s) => s.removeElement)

  const patch = (p: Partial<QuestionElement>) =>
    updateQuestion(sectionId, el.id, p)
  const patchConfig = (p: Partial<QuestionElement['config']>) =>
    updateQuestionConfig(sectionId, el.id, p)

  const typeLabel = getQuestionTypeLabel(el.type)

  return (
    <div className={builderSettingsRoot}>
      <InspectorSection title='题型说明' description={typeLabel}>
        <p className='text-muted-foreground text-xs leading-relaxed'>
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
        <p className='text-muted-foreground text-[11px] leading-relaxed'>
          标题、选项、必/选与题号也可在画布上直接点击编辑。
        </p>
      </InspectorSection>

      <InspectorSection title='展示与逻辑'>
        <QuestionNumberingInspector question={el} patch={patch} />
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
        onClick={() => removeElement(sectionId, el.id)}
      >
        删除此题
      </Button>
    </div>
  )
}
