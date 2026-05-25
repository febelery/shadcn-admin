import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { useBuilderStore } from '../../store'
import { InspectorSection } from '../inspector/panel'

export function EndPagePanel() {
  const schema = useBuilderStore((s) => s.schema)
  const updateMeta = useBuilderStore((s) => s.updateMeta)

  const endTitle = schema?.meta.endTitle ?? ''
  const endDescription = schema?.meta.endDescription ?? ''

  return (
    <InspectorSection
      title='结束页'
      description='提交成功后的展示内容'
      defaultOpen
    >
      <Field className='gap-1.5'>
        <FieldLabel htmlFor='end-title' className='text-muted-foreground text-xs font-medium'>
          结束标题
        </FieldLabel>
        <Input
          id='end-title'
          className='h-9'
          value={endTitle}
          onChange={(e) => updateMeta({ endTitle: e.target.value })}
        />
      </Field>
      <Field className='gap-1.5'>
        <FieldLabel htmlFor='end-desc' className='text-muted-foreground text-xs font-medium'>
          结束说明
        </FieldLabel>
        <Textarea
          id='end-desc'
          rows={3}
          value={endDescription}
          onChange={(e) => updateMeta({ endDescription: e.target.value })}
        />
      </Field>
    </InspectorSection>
  )
}
