import {
  DatePicker,
  formatLocalDateTime,
  parseLocalDateTime,
} from '@/components/date-picker'
import { DEFAULT_SUBMISSION } from '../../../core/schema-defaults'
import type { SubmissionTimeWindow } from '../../../core/types'
import { useBuilderStore } from '../../store'
import { builderTypeCaption } from '../../ui'
import {
  InspectorFormField,
  InspectorSection,
  InspectorSwitchField,
} from '../inspector-primitives'

export function SurveyTimeWindowPanel() {
  const timeWindow = useBuilderStore((s) => s.schema!.submission.timeWindow)

  const tw: SubmissionTimeWindow = {
    ...DEFAULT_SUBMISSION.timeWindow!,
    ...timeWindow,
  }

  return (
    <InspectorSection title='投放时间' description='控制问卷可填写的时间窗口'>
      <InspectorSwitchField
        id='time-enabled'
        label='限制开放时间'
        checked={tw.enabled}
        onCheckedChange={(c) =>
          useBuilderStore.getState().updateSubmission({
            timeWindow: { ...tw, enabled: !!c },
          })
        }
      />
      {tw.enabled ? (
        <div className='flex flex-col gap-3'>
          <InspectorFormField label='开始时间'>
            <DatePicker
              includeTime
              value={parseLocalDateTime(tw.startAt)}
              placeholder='不限制开始'
              onChange={(date) =>
                useBuilderStore.getState().updateSubmission({
                  timeWindow: {
                    ...tw,
                    startAt: date ? formatLocalDateTime(date) : undefined,
                  },
                })
              }
            />
          </InspectorFormField>
          <InspectorFormField label='结束时间'>
            <DatePicker
              includeTime
              value={parseLocalDateTime(tw.endAt)}
              placeholder='不限制结束'
              onChange={(date) =>
                useBuilderStore.getState().updateSubmission({
                  timeWindow: {
                    ...tw,
                    endAt: date ? formatLocalDateTime(date) : undefined,
                  },
                })
              }
            />
          </InspectorFormField>
          <p className={builderTypeCaption}>未填开始或结束表示该端不限制</p>
        </div>
      ) : null}
    </InspectorSection>
  )
}
