import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useBuilderStore } from '../../store'
import { InspectorFormField, InspectorSection } from '../inspector-primitives'

export function SurveyEndPagePanel() {
  const schema = useBuilderStore((s) => s.schema)!
  const updateMeta = useBuilderStore((s) => s.updateMeta)

  return (
    <InspectorSection
      title='结束页'
      description='提交成功后的展示内容'
      defaultOpen
    >
      <InspectorFormField label='结束标题' htmlFor='end-title'>
        <Input
          id='end-title'
          className='h-9'
          value={schema.meta.endTitle}
          onChange={(e) => updateMeta({ endTitle: e.target.value })}
        />
      </InspectorFormField>
      <InspectorFormField label='结束说明' htmlFor='end-desc'>
        <Textarea
          id='end-desc'
          rows={3}
          value={schema.meta.endDescription}
          onChange={(e) => updateMeta({ endDescription: e.target.value })}
        />
      </InspectorFormField>
    </InspectorSection>
  )
}
