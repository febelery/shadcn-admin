import { useShallow } from 'zustand/react/shallow'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useBuilderStore } from '../../builder-session'
import { InspectorSection } from '../inspector/panel'

function optionalPositiveInteger(value: string): number | undefined {
  if (value === '') return undefined
  return Math.max(1, Math.round(Number(value) || 1))
}

export function SubmissionPolicyPanel() {
  const {
    totalLimit,
    perUserLimit,
    dailyPerUserLimit,
    dailyLimit,
    perDeviceLimit,
    accessPassword,
    updatePolicy,
  } = useBuilderStore(
    useShallow((state) => ({
      totalLimit: state.document.submissionPolicy.totalLimit,
      perUserLimit: state.document.submissionPolicy.perUserLimit,
      dailyPerUserLimit: state.document.submissionPolicy.dailyPerUserLimit,
      dailyLimit: state.document.submissionPolicy.dailyLimit,
      perDeviceLimit: state.document.submissionPolicy.perDeviceLimit,
      accessPassword: state.document.submissionPolicy.accessPassword,
      updatePolicy: state.updateSubmissionPolicy,
    }))
  )

  return (
    <InspectorSection title='回收与限填' description='份数、频次与访问控制'>
      <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
        <p className='text-muted-foreground text-xs font-medium'>回收份数</p>
        <Field className='gap-1.5'>
          <FieldLabel
            htmlFor='total-submission-limit'
            className='text-muted-foreground text-xs font-medium'
          >
            最多回收份数
          </FieldLabel>
          <Input
            id='total-submission-limit'
            type='number'
            min={1}
            className='h-9'
            placeholder='不限制'
            value={totalLimit ?? ''}
            onChange={(event) =>
              updatePolicy({
                totalLimit: optionalPositiveInteger(event.target.value),
              })
            }
          />
          <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
            留空表示不限制总回收份数
          </FieldDescription>
        </Field>
      </div>

      <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
        <p className='text-muted-foreground text-xs font-medium'>提交频次</p>
        <Field className='gap-1.5'>
          <FieldLabel
            htmlFor='per-user-submission-limit'
            className='text-muted-foreground text-xs font-medium'
          >
            每人累计上限
          </FieldLabel>
          <Input
            id='per-user-submission-limit'
            type='number'
            min={1}
            className='h-9'
            placeholder='不限制'
            value={perUserLimit ?? ''}
            onChange={(event) =>
              updatePolicy({
                perUserLimit: optionalPositiveInteger(event.target.value),
              })
            }
          />
        </Field>
        <Field className='gap-1.5'>
          <FieldLabel
            htmlFor='daily-per-user-submission-limit'
            className='text-muted-foreground text-xs font-medium'
          >
            每人每天上限
          </FieldLabel>
          <Input
            id='daily-per-user-submission-limit'
            type='number'
            min={1}
            className='h-9'
            placeholder='不限制'
            value={dailyPerUserLimit ?? ''}
            onChange={(event) =>
              updatePolicy({
                dailyPerUserLimit: optionalPositiveInteger(event.target.value),
              })
            }
          />
        </Field>
        <Field className='gap-1.5'>
          <FieldLabel
            htmlFor='daily-submission-limit'
            className='text-muted-foreground text-xs font-medium'
          >
            问卷每天总上限
          </FieldLabel>
          <Input
            id='daily-submission-limit'
            type='number'
            min={1}
            className='h-9'
            placeholder='不限制'
            value={dailyLimit ?? ''}
            onChange={(event) =>
              updatePolicy({
                dailyLimit: optionalPositiveInteger(event.target.value),
              })
            }
          />
        </Field>
      </div>

      <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
        <p className='text-muted-foreground text-xs font-medium'>设备与访问</p>
        <Field className='gap-1.5'>
          <FieldLabel
            htmlFor='per-device-limit'
            className='text-muted-foreground text-xs font-medium'
          >
            每设备累计上限
          </FieldLabel>
          <Input
            id='per-device-limit'
            type='number'
            min={1}
            className='h-9'
            placeholder='不限制'
            value={perDeviceLimit ?? ''}
            onChange={(event) =>
              updatePolicy({
                perDeviceLimit: optionalPositiveInteger(event.target.value),
              })
            }
          />
        </Field>
        <Field className='gap-1.5'>
          <FieldLabel
            htmlFor='survey-password'
            className='text-muted-foreground text-xs font-medium'
          >
            访问密码
          </FieldLabel>
          <Input
            id='survey-password'
            type='password'
            autoComplete='new-password'
            className='h-9'
            placeholder='设置后需输入才可填写'
            value={accessPassword ?? ''}
            onChange={(event) =>
              updatePolicy({
                accessPassword: event.target.value || undefined,
              })
            }
          />
          <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
            留空则无需密码
          </FieldDescription>
        </Field>
      </div>
    </InspectorSection>
  )
}
