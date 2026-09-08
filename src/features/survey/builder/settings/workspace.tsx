import { useEffect, useRef, type ReactNode } from 'react'
import { useForm, useStore } from '@tanstack/react-form'
import { checkImageAccessible, mbToBytes } from '@/lib/files'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from '@/components/ui/color-picker'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'
import { Editor } from '@/components/editor'
import { FileUpload } from '@/components/file-upload'
import { isSurveyNumberingEnabled } from '../../core/question-numbering'
import type {
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
  SurveyDocument,
} from '../../core/types'
import {
  documentToSurveySettingsValues,
  surveySettingsFormSchema,
} from '../../settings/form-schema'
import {
  SURVEY_NUMBERING_MODE_OPTIONS,
  SURVEY_NUMBERING_OPTIONS,
} from '../../shared/numbering-options'
import { useBuilderStore } from '../builder-session'

const COVER_UPLOAD_VALIDATION = {
  accept: 'image/*',
  maxFiles: 1,
  maxSize: mbToBytes(5),
} as const

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className='px-5 py-6 sm:px-6'>
      <div className='mb-5 space-y-1'>
        <h2 className='text-base leading-none font-semibold'>{title}</h2>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          {description}
        </p>
      </div>
      {children}
    </section>
  )
}

function ColorControl({
  value,
  onChange,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  return (
    <ColorPicker
      value={value}
      onValueChange={onChange}
      defaultFormat='hex'
      className='w-full'
    >
      <ColorPickerTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='w-full justify-start gap-2 font-normal'
          aria-invalid={invalid}
        >
          <ColorPickerSwatch className='size-4' />
          <span className='font-mono text-xs uppercase tabular-nums'>
            {value}
          </span>
        </Button>
      </ColorPickerTrigger>
      <ColorPickerContent align='start' className='w-auto'>
        <ColorPickerArea />
        <ColorPickerHueSlider />
        <div className='flex items-center gap-2'>
          <ColorPickerEyeDropper />
          <ColorPickerInput withoutAlpha className='min-w-0 flex-1' />
        </div>
      </ColorPickerContent>
    </ColorPicker>
  )
}

function NumberingStyleSelect({
  value,
  onValueChange,
  invalid,
}: {
  value: SurveyDefaultNumberingStyle
  onValueChange: (value: SurveyDefaultNumberingStyle) => void
  invalid?: boolean
}) {
  const selected = SURVEY_NUMBERING_OPTIONS.find(
    (option) => option.value === value
  )

  return (
    <Select
      value={value}
      onValueChange={(next) =>
        onValueChange(next as SurveyDefaultNumberingStyle)
      }
    >
      <SelectTrigger
        className='h-auto min-h-9 w-full py-1.5'
        aria-invalid={invalid}
      >
        <SelectValue placeholder='选择题号样式'>
          {selected ? (
            <span className='flex flex-col items-start gap-0.5 text-left'>
              <span className='text-sm leading-none'>{selected.label}</span>
              <span className='text-muted-foreground font-mono text-xs leading-none tabular-nums'>
                {selected.sample}
              </span>
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SURVEY_NUMBERING_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className='py-2'>
            <span className='flex flex-col gap-0.5'>
              <span>{option.label}</span>
              <span className='text-muted-foreground font-mono text-xs leading-none tabular-nums'>
                {option.sample}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PublishInfo({ document }: { document: SurveyDocument }) {
  return (
    <CardFooter className='bg-muted/25 grid gap-3 border-t px-5 py-4 sm:grid-cols-[1fr_auto] sm:px-6'>
      <div className='space-y-0.5'>
        <p className='text-sm font-medium'>发布信息</p>
        <p className='text-muted-foreground text-xs leading-relaxed'>
          {document.slug
            ? '访问标识和当前修订。'
            : '发布后生成访问标识和修订号。'}
        </p>
      </div>
      {document.slug ? (
        <dl className='flex items-center gap-5 text-xs'>
          <div className='flex items-center gap-2'>
            <dt className='text-muted-foreground'>标识</dt>
            <dd>
              <code className='bg-muted rounded px-1.5 py-0.5 font-mono'>
                {document.slug}
              </code>
            </dd>
          </div>
          <div className='flex items-center gap-2'>
            <dt className='text-muted-foreground'>修订</dt>
            <dd className='font-mono tabular-nums'>r{document.revision}</dd>
          </div>
        </dl>
      ) : null}
    </CardFooter>
  )
}

/**
 * 问卷设计器 · 配置工作区
 * 与 Builder Store 双向响应：修改即同步至 Store，保持脏标记与顶栏标题统一。
 */
export function SettingsWorkspace() {
  const document = useBuilderStore((s) => s.document)
  const updateSettings = useBuilderStore((s) => s.updateSettings)
  const isFirstRender = useRef(true)

  const form = useForm({
    defaultValues: documentToSurveySettingsValues(document),
    validators: {
      onChange: surveySettingsFormSchema,
    },
  })

  // 当表单字段修改时同步更新全局 Builder 状态
  const formValues = useStore(form.store, (state) => state.values)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    updateSettings(formValues)
  }, [formValues, updateSettings])

  // 顶栏修改标题时同步回表单
  const storeTitle = document.meta.title
  useEffect(() => {
    if (form.getFieldValue('title') !== storeTitle) {
      form.setFieldValue('title', storeTitle)
    }
  }, [storeTitle, form])

  return (
    <div className='bg-muted/25 flex min-h-0 flex-1 flex-col overflow-y-auto'>
      <div className='mx-auto flex w-full max-w-5xl flex-col px-5 py-6 sm:py-8'>
        <Card className='border-border bg-card text-card-foreground w-full gap-0 overflow-hidden rounded-lg border py-0 shadow-sm'>
          <CardContent className='p-0'>
            <SettingsSection
              title='基础信息'
              description='标题、描述和提交按钮文案。'
            >
              <FieldGroup className='gap-5'>
                <div className='grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]'>
                  <form.Field
                    name='title'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor={field.name}>问卷标题</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            placeholder='请输入问卷标题'
                            aria-invalid={invalid}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />
                  <form.Field
                    name='submitLabel'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor={field.name}>
                            提交按钮文案
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            placeholder='提交'
                            aria-invalid={invalid}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />
                </div>
                <form.Field
                  name='description'
                  children={(field) => {
                    const invalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={invalid} className='gap-2'>
                        <FieldLabel htmlFor={field.name}>描述</FieldLabel>
                        <Editor
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          placeholder='用途和填写要求（选填）'
                          invalid={invalid}
                          toolbar='compact'
                          minHeight='140px'
                          onBlur={field.handleBlur}
                          onChange={(val) => field.handleChange(val)}
                        />
                        {invalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                />
              </FieldGroup>
            </SettingsSection>

            <Separator />

            <SettingsSection title='头图' description='选择无、纯色或图片。'>
              <FieldGroup className='gap-5'>
                <form.Field
                  name='coverType'
                  children={(field) => {
                    const invalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={invalid} className='gap-2'>
                        <FieldLabel>样式</FieldLabel>
                        <RadioGroup
                          name={field.name}
                          value={field.state.value}
                          onValueChange={(value) =>
                            field.handleChange(
                              value as typeof field.state.value
                            )
                          }
                          className='grid grid-cols-1 gap-2 sm:grid-cols-3'
                          aria-invalid={invalid}
                        >
                          {[
                            ['none', '无'],
                            ['color', '纯色'],
                            ['image', '图片'],
                          ].map(([value, label]) => (
                            <FieldLabel
                              key={value}
                              className='has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 flex w-full cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 font-normal'
                            >
                              <RadioGroupItem value={value} />
                              <span>{label}</span>
                            </FieldLabel>
                          ))}
                        </RadioGroup>
                        {invalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                />

                <form.Subscribe
                  selector={(state) => state.values.coverType}
                  children={(coverType) => {
                    if (coverType === 'color') {
                      return (
                        <form.Field
                          name='coverColor'
                          children={(field) => {
                            const invalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid
                            return (
                              <Field
                                data-invalid={invalid}
                                className='max-w-sm gap-2'
                              >
                                <FieldLabel>背景色</FieldLabel>
                                <ColorControl
                                  value={field.state.value}
                                  invalid={invalid}
                                  onChange={field.handleChange}
                                />
                                {invalid ? (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                ) : null}
                              </Field>
                            )
                          }}
                        />
                      )
                    }

                    if (coverType !== 'image') return null
                    return (
                      <form.Field
                        name='cover'
                        asyncDebounceMs={350}
                        validators={{
                          onChangeAsyncDebounceMs: 350,
                          onChangeAsync: async ({ value }) => {
                            if (!value) return undefined
                            const isAccessible =
                              await checkImageAccessible(value)
                            if (!isAccessible) {
                              return '图片无法访问（404 或链接失效）'
                            }
                            return undefined
                          },
                          onBlurAsync: async ({ value }) => {
                            if (!value) return undefined
                            const isAccessible =
                              await checkImageAccessible(value)
                            if (!isAccessible) {
                              return '图片无法访问（404 或链接失效）'
                            }
                            return undefined
                          },
                        }}
                        children={(field) => {
                          const invalid =
                            (field.state.meta.isTouched ||
                              field.state.meta.isDirty) &&
                            !field.state.meta.isValid
                          return (
                            <Field data-invalid={invalid} className='gap-3'>
                              <FieldLabel>图片</FieldLabel>
                              <div className='bg-muted/15 grid gap-4 rounded-lg border p-4 sm:grid-cols-[18rem_minmax(0,1fr)]'>
                                <div className='min-w-0'>
                                  <FileUpload
                                    value={field.state.value || undefined}
                                    validation={COVER_UPLOAD_VALIDATION}
                                    view='card'
                                    cardSize='full'
                                    variant='minimal'
                                    crop
                                    aspect={2}
                                    onChange={(next) => {
                                      const url = Array.isArray(next)
                                        ? (next[0] ?? '')
                                        : next
                                      if (url !== field.state.value) {
                                        field.handleChange(url)
                                      }
                                    }}
                                  />
                                </div>
                                <div className='min-w-0 sm:py-1'>
                                  <div className='mb-3 space-y-1'>
                                    <p className='text-sm font-medium'>
                                      图片来源
                                    </p>
                                    <p className='text-muted-foreground text-xs leading-relaxed'>
                                      上传或粘贴图片链接。
                                    </p>
                                  </div>
                                  <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    placeholder='https://example.com/banner.png'
                                    aria-invalid={invalid}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                      field.handleChange(event.target.value)
                                    }
                                  />
                                </div>
                              </div>
                              {invalid ? (
                                <FieldError errors={field.state.meta.errors} />
                              ) : null}
                            </Field>
                          )
                        }}
                      />
                    )
                  }}
                />
              </FieldGroup>
            </SettingsSection>

            <Separator />

            <SettingsSection
              title='投放与访问'
              description='时间、回收上限和访问限制。'
            >
              <FieldGroup className='gap-5'>
                <div className='grid gap-5 md:grid-cols-2'>
                  <form.Field
                    name='opensAt'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor='opens-at-picker'>
                            开始时间
                          </FieldLabel>
                          <DatePicker
                            value={field.state.value}
                            placeholder='不限'
                            aria-invalid={invalid}
                            onChange={(date) => field.handleChange(date)}
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name='closesAt'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor='closes-at-picker'>
                            结束时间
                          </FieldLabel>
                          <DatePicker
                            value={field.state.value}
                            placeholder='不限'
                            aria-invalid={invalid}
                            onChange={(date) => field.handleChange(date)}
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />
                </div>

                <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                  <form.Field
                    name='totalLimit'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor={field.name}>回收上限</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type='number'
                            min={1}
                            placeholder='不限制'
                            value={field.state.value}
                            aria-invalid={invalid}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name='perDeviceLimit'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor={field.name}>
                            每台设备上限
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type='number'
                            min={1}
                            placeholder='不限制'
                            value={field.state.value}
                            aria-invalid={invalid}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name='accessPassword'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor={field.name}>访问密码</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type='password'
                            placeholder='留空则无需密码'
                            value={field.state.value}
                            aria-invalid={invalid}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />
                </div>

                <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                  <form.Field
                    name='perUserLimit'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor={field.name}>每人上限</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type='number'
                            min={1}
                            placeholder='不限制'
                            value={field.state.value}
                            aria-invalid={invalid}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name='dailyPerUserLimit'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor={field.name}>
                            每人每日上限
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type='number'
                            min={1}
                            placeholder='不限制'
                            value={field.state.value}
                            aria-invalid={invalid}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name='dailyLimit'
                    children={(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={invalid} className='gap-2'>
                          <FieldLabel htmlFor={field.name}>
                            每日总上限
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type='number'
                            min={1}
                            placeholder='不限制'
                            value={field.state.value}
                            aria-invalid={invalid}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                          {invalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  />
                </div>
              </FieldGroup>
            </SettingsSection>

            <Separator />

            <SettingsSection
              title='完成页'
              description='提交后显示的标题和说明。'
            >
              <div className='grid gap-5 md:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)]'>
                <form.Field
                  name='endTitle'
                  children={(field) => {
                    const invalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={invalid} className='gap-2'>
                        <FieldLabel htmlFor={field.name}>标题</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          aria-invalid={invalid}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                        {invalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name='endDescription'
                  children={(field) => {
                    const invalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={invalid} className='gap-2'>
                        <FieldLabel htmlFor={field.name}>说明</FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          rows={3}
                          value={field.state.value}
                          aria-invalid={invalid}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                        {invalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                />
              </div>
            </SettingsSection>

            <Separator />

            <SettingsSection
              title='题号与主题'
              description='题号规则和主题色。'
            >
              <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
                <form.Field
                  name='numberingStyle'
                  children={(field) => {
                    const invalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={invalid} className='gap-2'>
                        <FieldLabel>题号样式</FieldLabel>
                        <NumberingStyleSelect
                          value={field.state.value}
                          invalid={invalid}
                          onValueChange={field.handleChange}
                        />
                        {invalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                />

                <form.Subscribe
                  selector={(state) => state.values.numberingStyle}
                  children={(numberingStyle) => (
                    <form.Field
                      name='numberingMode'
                      children={(field) => {
                        const invalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        const disabled =
                          !isSurveyNumberingEnabled(numberingStyle)
                        return (
                          <Field
                            data-invalid={invalid}
                            data-disabled={disabled}
                            className='gap-2'
                          >
                            <FieldLabel>编号方式</FieldLabel>
                            <Select
                              name={field.name}
                              value={field.state.value}
                              disabled={disabled}
                              onValueChange={(value) =>
                                field.handleChange(
                                  value as QuestionNumberingMode
                                )
                              }
                            >
                              <SelectTrigger
                                className='w-full'
                                aria-invalid={invalid}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SURVEY_NUMBERING_MODE_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FieldDescription>
                              {disabled
                                ? '显示题号后可设置编号方式'
                                : SURVEY_NUMBERING_MODE_OPTIONS.find(
                                    (option) =>
                                      option.value === field.state.value
                                  )?.hint}
                            </FieldDescription>
                            {invalid ? (
                              <FieldError errors={field.state.meta.errors} />
                            ) : null}
                          </Field>
                        )
                      }}
                    />
                  )}
                />

                <form.Field
                  name='primaryColor'
                  children={(field) => {
                    const invalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={invalid} className='gap-2'>
                        <FieldLabel>主题色</FieldLabel>
                        <ColorControl
                          value={field.state.value}
                          invalid={invalid}
                          onChange={field.handleChange}
                        />
                        {invalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                />
              </div>
            </SettingsSection>
          </CardContent>

          {document.slug ? <PublishInfo document={document} /> : null}
        </Card>
      </div>
    </div>
  )
}
