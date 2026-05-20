import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { QuestionNumberingMode } from '../../../core/types'
import {
  isSurveyNumberingEnabled,
  SURVEY_NUMBERING_MODE_OPTIONS,
} from '../../../shared/question-numbering'
import { useBuilderStore } from '../../store'
import {
  InspectorColorField,
  InspectorFormField,
  InspectorSection,
  NumberingStyleSelect,
} from '../inspector-primitives'

export function SurveyThemePanel() {
  const schema = useBuilderStore((s) => s.schema)!
  const updateMeta = useBuilderStore((s) => s.updateMeta)
  const updateTheme = useBuilderStore((s) => s.updateTheme)

  const numberingStyle = schema.meta.defaultQuestionNumbering ?? 'decimal'

  return (
    <InspectorSection title='主题' description='品牌色与题号样式' defaultOpen>
      <InspectorFormField
        label='题号样式（全卷）'
        hint='全卷统一题号格式；选「不显示」则关闭所有题号。各题可单独隐藏题号，编号方式见下方。'
      >
        <NumberingStyleSelect
          value={numberingStyle}
          onValueChange={(v) => updateMeta({ defaultQuestionNumbering: v })}
        />
      </InspectorFormField>
      {isSurveyNumberingEnabled(numberingStyle) ? (
        <InspectorFormField
          label='题号编号方式'
          hint={
            SURVEY_NUMBERING_MODE_OPTIONS.find(
              (o) =>
                o.value === (schema.meta.questionNumberingMode ?? 'global')
            )?.hint
          }
        >
          <Select
            value={schema.meta.questionNumberingMode ?? 'global'}
            onValueChange={(v) =>
              updateMeta({
                questionNumberingMode: v as QuestionNumberingMode,
              })
            }
          >
            <SelectTrigger className='h-9 w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SURVEY_NUMBERING_MODE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InspectorFormField>
      ) : null}
      <InspectorFormField label='主题色'>
        <InspectorColorField
          value={schema.theme.primaryColor}
          onValueChange={(primaryColor) => updateTheme({ primaryColor })}
        />
      </InspectorFormField>
    </InspectorSection>
  )
}
