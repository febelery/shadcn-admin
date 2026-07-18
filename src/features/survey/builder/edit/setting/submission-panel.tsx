import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_SUBMISSION } from '@/features/survey/core/document-factory'
import type {
  SubmissionConfig,
  SubmissionQuota,
  SubmissionRateLimit,
} from '../../../core/types'
import { useBuilderStore } from '../../builder-session'
import { InspectorSection } from '../inspector/panel'

export function SubmissionPanel() {
  const document = useBuilderStore((s) => s.document)
  const updateSubmission = useBuilderStore((s) => s.updateSubmission)
  const submission = document.submission

  const sub: SubmissionConfig = {
    ...DEFAULT_SUBMISSION,
    ...submission,
    timeWindow: {
      enabled: false,
      ...DEFAULT_SUBMISSION.timeWindow,
      ...submission.timeWindow,
    },
    quota: {
      enabled: false,
      total: 1000,
      ...DEFAULT_SUBMISSION.quota,
      ...submission.quota,
    },
    rateLimit: {
      enabled: false,
      ...DEFAULT_SUBMISSION.rateLimit,
      ...submission.rateLimit,
    },
  }
  const quota = sub.quota as SubmissionQuota
  const rate = sub.rateLimit as SubmissionRateLimit

  return (
    <InspectorSection title='回收与限填' description='份数、频次与访问控制'>
      {/* 回收份数 */}
      <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-muted-foreground text-xs font-medium'>回收份数</p>
        </div>
        <div className='flex flex-col gap-3'>
          <Field
            orientation='horizontal'
            className='items-center justify-between gap-3'
          >
            <FieldLabel
              htmlFor='quota-enabled'
              className='cursor-pointer text-sm leading-relaxed font-normal'
            >
              启用总份数上限
            </FieldLabel>
            <Switch
              id='quota-enabled'
              checked={quota.enabled}
              onCheckedChange={(c) =>
                updateSubmission({
                  quota: { ...quota, enabled: !!c },
                })
              }
            />
          </Field>
          {quota.enabled ? (
            <Field className='gap-1.5'>
              <FieldLabel
                htmlFor='quota-total'
                className='text-muted-foreground text-xs font-medium'
              >
                最多回收份数
              </FieldLabel>
              <Input
                id='quota-total'
                type='number'
                min={1}
                className='h-9'
                value={quota.total ?? ''}
                onChange={(e) =>
                  updateSubmission({
                    quota: {
                      ...quota,
                      total: Number(e.target.value) || 1,
                    },
                  })
                }
              />
            </Field>
          ) : null}
        </div>
      </div>

      {/* 提交频次 */}
      <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-muted-foreground text-xs font-medium'>提交频次</p>
        </div>
        <div className='flex flex-col gap-3'>
          <Field
            orientation='horizontal'
            className='items-center justify-between gap-3'
          >
            <FieldLabel
              htmlFor='rate-enabled'
              className='cursor-pointer text-sm leading-relaxed font-normal'
            >
              启用人次 / 日次限制
            </FieldLabel>
            <Switch
              id='rate-enabled'
              checked={rate.enabled}
              onCheckedChange={(c) =>
                updateSubmission({
                  rateLimit: { ...rate, enabled: !!c },
                })
              }
            />
          </Field>
          {rate.enabled ? (
            <>
              <Field className='gap-1.5'>
                <FieldLabel
                  htmlFor='rate-user'
                  className='text-muted-foreground text-xs font-medium'
                >
                  每人累计上限
                </FieldLabel>
                <Input
                  id='rate-user'
                  type='number'
                  min={0}
                  className='h-9'
                  placeholder='不限制'
                  value={rate.maxPerUser ?? ''}
                  onChange={(e) =>
                    updateSubmission({
                      rateLimit: {
                        ...rate,
                        maxPerUser:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      },
                    })
                  }
                />
                <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
                  留空表示不限制
                </FieldDescription>
              </Field>
              <Field className='gap-1.5'>
                <FieldLabel
                  htmlFor='rate-user-day'
                  className='text-muted-foreground text-xs font-medium'
                >
                  每人每天上限
                </FieldLabel>
                <Input
                  id='rate-user-day'
                  type='number'
                  min={0}
                  className='h-9'
                  placeholder='不限制'
                  value={rate.maxPerUserPerDay ?? ''}
                  onChange={(e) =>
                    updateSubmission({
                      rateLimit: {
                        ...rate,
                        maxPerUserPerDay:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      },
                    })
                  }
                />
              </Field>
              <Field className='gap-1.5'>
                <FieldLabel
                  htmlFor='rate-day'
                  className='text-muted-foreground text-xs font-medium'
                >
                  问卷每天总上限
                </FieldLabel>
                <Input
                  id='rate-day'
                  type='number'
                  min={0}
                  className='h-9'
                  placeholder='不限制'
                  value={rate.maxPerDay ?? ''}
                  onChange={(e) =>
                    updateSubmission({
                      rateLimit: {
                        ...rate,
                        maxPerDay:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            </>
          ) : null}
        </div>
      </div>

      {/* 防重复与密码 */}
      <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-muted-foreground text-xs font-medium'>
            防重复与密码
          </p>
        </div>
        <div className='flex flex-col gap-3'>
          <Field
            orientation='horizontal'
            className='items-center justify-between gap-3'
          >
            <FieldLabel
              htmlFor='once-user'
              className='cursor-pointer text-sm leading-relaxed font-normal'
            >
              每人仅可填写一次
            </FieldLabel>
            <Switch
              id='once-user'
              checked={!!sub.oncePerUser}
              onCheckedChange={(c) => updateSubmission({ oncePerUser: !!c })}
            />
          </Field>
          <Field
            orientation='horizontal'
            className='items-center justify-between gap-3'
          >
            <FieldLabel
              htmlFor='once-device'
              className='cursor-pointer text-sm leading-relaxed font-normal'
            >
              每设备仅可填写一次
            </FieldLabel>
            <Switch
              id='once-device'
              checked={!!sub.oncePerDevice}
              onCheckedChange={(c) => updateSubmission({ oncePerDevice: !!c })}
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
              value={sub.password ?? ''}
              onChange={(e) =>
                updateSubmission({
                  password: e.target.value || undefined,
                })
              }
            />
            <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
              留空则无需密码
            </FieldDescription>
          </Field>
        </div>
      </div>
    </InspectorSection>
  )
}
