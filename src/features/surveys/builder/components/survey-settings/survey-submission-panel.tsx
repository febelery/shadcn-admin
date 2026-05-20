import { Input } from '@/components/ui/input'
import { DEFAULT_SUBMISSION } from '../../../core/schema-defaults'
import type {
  SubmissionConfig,
  SubmissionQuota,
  SubmissionRateLimit,
} from '../../../core/types'
import { useBuilderStore } from '../../store'
import {
  InspectorFormField,
  InspectorFormGroup,
  InspectorSection,
  InspectorSwitchField,
} from '../inspector-primitives'

export function SurveySubmissionPanel() {
  const submission = useBuilderStore((s) => s.schema!.submission)
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
      <InspectorFormGroup title='回收份数'>
        <InspectorSwitchField
          id='quota-enabled'
          label='启用总份数上限'
          checked={quota.enabled}
          onCheckedChange={(c) =>
            useBuilderStore.getState().updateSubmission({
              quota: { ...quota, enabled: !!c },
            })
          }
        />
        {quota.enabled ? (
          <InspectorFormField label='最多回收份数' htmlFor='quota-total'>
            <Input
              id='quota-total'
              type='number'
              min={1}
              className='h-9'
              value={quota.total ?? ''}
              onChange={(e) =>
                useBuilderStore.getState().updateSubmission({
                  quota: {
                    ...quota,
                    total: Number(e.target.value) || 1,
                  },
                })
              }
            />
          </InspectorFormField>
        ) : null}
      </InspectorFormGroup>

      <InspectorFormGroup title='提交频次'>
        <InspectorSwitchField
          id='rate-enabled'
          label='启用人次 / 日次限制'
          checked={rate.enabled}
          onCheckedChange={(c) =>
            useBuilderStore.getState().updateSubmission({
              rateLimit: { ...rate, enabled: !!c },
            })
          }
        />
        {rate.enabled ? (
          <>
            <InspectorFormField
              label='每人累计上限'
              htmlFor='rate-user'
              hint='留空表示不限制'
            >
              <Input
                id='rate-user'
                type='number'
                min={0}
                className='h-9'
                placeholder='不限制'
                value={rate.maxPerUser ?? ''}
                onChange={(e) =>
                  useBuilderStore.getState().updateSubmission({
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
            </InspectorFormField>
            <InspectorFormField label='每人每天上限' htmlFor='rate-user-day'>
              <Input
                id='rate-user-day'
                type='number'
                min={0}
                className='h-9'
                placeholder='不限制'
                value={rate.maxPerUserPerDay ?? ''}
                onChange={(e) =>
                  useBuilderStore.getState().updateSubmission({
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
            </InspectorFormField>
            <InspectorFormField label='问卷每天总上限' htmlFor='rate-day'>
              <Input
                id='rate-day'
                type='number'
                min={0}
                className='h-9'
                placeholder='不限制'
                value={rate.maxPerDay ?? ''}
                onChange={(e) =>
                  useBuilderStore.getState().updateSubmission({
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
            </InspectorFormField>
          </>
        ) : null}
      </InspectorFormGroup>

      <InspectorFormGroup title='防重复与密码'>
        <InspectorSwitchField
          id='once-user'
          label='每人仅可填写一次'
          checked={!!sub.oncePerUser}
          onCheckedChange={(c) =>
            useBuilderStore.getState().updateSubmission({ oncePerUser: !!c })
          }
        />
        <InspectorSwitchField
          id='once-device'
          label='每设备仅可填写一次'
          checked={!!sub.oncePerDevice}
          onCheckedChange={(c) =>
            useBuilderStore.getState().updateSubmission({ oncePerDevice: !!c })
          }
        />
        <InspectorFormField
          label='访问密码'
          htmlFor='survey-password'
          hint='留空则无需密码'
        >
          <Input
            id='survey-password'
            type='password'
            autoComplete='off'
            className='h-9'
            placeholder='设置后需输入才可填写'
            value={sub.password ?? ''}
            onChange={(e) =>
              useBuilderStore.getState().updateSubmission({
                password: e.target.value || undefined,
              })
            }
          />
        </InspectorFormField>
      </InspectorFormGroup>
    </InspectorSection>
  )
}
