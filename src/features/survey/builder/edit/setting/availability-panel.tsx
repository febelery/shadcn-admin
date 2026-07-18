import { useShallow } from 'zustand/react/shallow'
import { Field, FieldLabel } from '@/components/ui/field'
import { DatePicker } from '@/components/date-picker'
import { useBuilderStore } from '../../builder-session'
import { InspectorSection } from '../inspector/panel'

function parseInstant(value?: string): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function AvailabilityPanel() {
  const { opensAt, closesAt, updatePolicy } = useBuilderStore(
    useShallow((state) => ({
      opensAt: state.document.submissionPolicy.opensAt,
      closesAt: state.document.submissionPolicy.closesAt,
      updatePolicy: state.updateSubmissionPolicy,
    }))
  )

  return (
    <InspectorSection title='投放时间' description='控制问卷可填写的时间窗口'>
      <Field className='gap-1.5'>
        <FieldLabel className='text-muted-foreground text-xs font-medium'>
          开始时间
        </FieldLabel>
        <DatePicker
          includeTime
          value={parseInstant(opensAt)}
          max={parseInstant(closesAt)}
          placeholder='不限制开始'
          onChange={(date) =>
            updatePolicy({
              opensAt: date?.toISOString(),
            })
          }
        />
      </Field>
      <Field className='gap-1.5'>
        <FieldLabel className='text-muted-foreground text-xs font-medium'>
          结束时间
        </FieldLabel>
        <DatePicker
          includeTime
          value={parseInstant(closesAt)}
          min={parseInstant(opensAt)}
          placeholder='不限制结束'
          onChange={(date) =>
            updatePolicy({
              closesAt: date?.toISOString(),
            })
          }
        />
      </Field>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        留空的一端不限制；结束时间不得早于开始时间。
      </p>
    </InspectorSection>
  )
}
