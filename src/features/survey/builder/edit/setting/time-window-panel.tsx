import { Field, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import {
  DatePicker,
  formatLocalDateTime,
  parseLocalDateTime,
} from '@/components/date-picker'
import { DEFAULT_SUBMISSION } from '@/features/survey/core/document-factory'
import { useBuilderStore } from '../../store'
import type { SubmissionTimeWindow } from '../../types'
import { InspectorSection } from '../inspector/panel'

export function TimeWindowPanel() {
  const document = useBuilderStore((s) => s.document)
  const updateSubmission = useBuilderStore((s) => s.updateSubmission)
  const timeWindow = document.submission.timeWindow

  const tw: SubmissionTimeWindow = {
    ...DEFAULT_SUBMISSION.timeWindow!,
    ...timeWindow,
  }

  return (
    <InspectorSection title='投放时间' description='控制问卷可填写的时间窗口'>
      <Field
        orientation='horizontal'
        className='items-center justify-between gap-3'
      >
        <FieldLabel
          htmlFor='time-enabled'
          className='cursor-pointer text-sm leading-relaxed font-normal'
        >
          限制开放时间
        </FieldLabel>
        <Switch
          id='time-enabled'
          checked={tw.enabled}
          onCheckedChange={(c) =>
            updateSubmission({
              timeWindow: { ...tw, enabled: !!c },
            })
          }
        />
      </Field>
      {tw.enabled ? (
        <div className='flex flex-col gap-3'>
          <Field className='gap-1.5'>
            <FieldLabel className='text-muted-foreground text-xs font-medium'>
              开始时间
            </FieldLabel>
            <DatePicker
              includeTime
              value={parseLocalDateTime(tw.startAt)}
              placeholder='不限制开始'
              onChange={(date) =>
                updateSubmission({
                  timeWindow: {
                    ...tw,
                    startAt: date ? formatLocalDateTime(date) : undefined,
                  },
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
              value={parseLocalDateTime(tw.endAt)}
              placeholder='不限制结束'
              onChange={(date) =>
                updateSubmission({
                  timeWindow: {
                    ...tw,
                    endAt: date ? formatLocalDateTime(date) : undefined,
                  },
                })
              }
            />
          </Field>
          <p className='text-muted-foreground text-xs leading-relaxed'>
            未填开始或结束表示该端不限制
          </p>
        </div>
      ) : null}
    </InspectorSection>
  )
}
