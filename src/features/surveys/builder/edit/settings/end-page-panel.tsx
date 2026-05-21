import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useBuilderStatic, useBuilderStructure } from '../../context'
import { InspectorFormField, InspectorSection } from '../inspector/primitives'

export function EndPagePanel() {
  const { schema } = useBuilderStructure()
  const { updateMeta } = useBuilderStatic()

  const endTitle = schema?.meta.endTitle ?? ''
  const endDescription = schema?.meta.endDescription ?? ''

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
          value={endTitle}
          onChange={(e) => updateMeta({ endTitle: e.target.value })}
        />
      </InspectorFormField>
      <InspectorFormField label='结束说明' htmlFor='end-desc'>
        <Textarea
          id='end-desc'
          rows={3}
          value={endDescription}
          onChange={(e) => updateMeta({ endDescription: e.target.value })}
        />
      </InspectorFormField>
    </InspectorSection>
  )
}
