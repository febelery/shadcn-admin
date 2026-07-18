import { useShallow } from 'zustand/react/shallow'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useBuilderStore } from '../../builder-session'
import { InspectorSection } from '../inspector/panel'

export function EndPagePanel() {
  const { endTitle, endDescription, updateMeta } = useBuilderStore(
    useShallow((state) => ({
      endTitle: state.document.meta.endTitle,
      endDescription: state.document.meta.endDescription,
      updateMeta: state.updateMeta,
    }))
  )

  return (
    <InspectorSection
      title='结束页'
      description='提交成功后的展示内容'
      defaultOpen
    >
      <Field className='gap-1.5'>
        <FieldLabel
          htmlFor='end-title'
          className='text-muted-foreground text-xs font-medium'
        >
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
        <FieldLabel
          htmlFor='end-desc'
          className='text-muted-foreground text-xs font-medium'
        >
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
