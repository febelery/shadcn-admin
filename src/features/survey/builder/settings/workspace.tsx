import { useEffect, useRef, useState, type ReactNode } from 'react'
import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form'
import { ChevronDown, Link2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/date-picker'
import { Editor } from '@/components/editor'
import { FileUpload } from '@/components/file-upload'
import { checkImageAccessible, mbToBytes } from '@/lib/files'
import {
  CONSENT_CLAUSE_LIMIT,
  CONSENT_DEFAULT_CHECKBOX_LABEL,
  CONSENT_READ_SECONDS_LIMIT,
  CONSENT_TOKEN_READ_SECONDS,
  createConsentClause,
  estimateConsentReadSeconds,
  isScrollGateVacuous,
} from '../../core/consent'
import { isSurveyNumberingEnabled } from '../../core/question-numbering'
import type {
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
  SurveyDocument,
} from '../../core/types'
import {
  documentToSurveySettingsValues,
  surveySettingsFormSchema,
  type SurveySettingsFormValues,
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

const RECYCLE_LIMIT_FIELDS: Array<{
  name: 'perUserLimit' | 'dailyPerUserLimit' | 'totalLimit' | 'dailyLimit'
  label: string
  hint: string
}> = [
  { name: 'perUserLimit', label: '每人累计上限', hint: '新建问卷默认 1 份' },
  { name: 'dailyPerUserLimit', label: '每人每日上限', hint: '单用户每天' },
  { name: 'totalLimit', label: '问卷总上限', hint: '整份问卷累计' },
  { name: 'dailyLimit', label: '每日总上限', hint: '全问卷每天' },
]

/** 可折叠卡片式区块容器 */
function SettingsSection({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string
  description: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className='group/section border-border/70 bg-card text-card-foreground overflow-hidden rounded-xl border shadow-xs'
    >
      <CollapsibleTrigger
        render={
          <button
            type='button'
            className='hover:bg-muted/40 bg-muted/30 flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors sm:px-6'
          />
        }
      >
        <div className='flex flex-col gap-1'>
          <h2 className='text-foreground text-sm font-semibold'>{title}</h2>
          <p className='text-muted-foreground/70 text-xs leading-relaxed'>
            {description}
          </p>
        </div>
        <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[open]/section:rotate-180 group-data-[state=open]/section:rotate-180' />
      </CollapsibleTrigger>
      <CollapsibleContent
        keepMounted
        className='CollapsibleContent border-border/60 border-t'
      >
        <div className='px-5 py-5 sm:px-6'>{children}</div>
      </CollapsibleContent>
    </Collapsible>
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
      <ColorPickerTrigger
        type='button'
        variant='outline'
        className='h-9 w-full justify-start gap-2 font-normal'
        aria-invalid={invalid}
      >
        <ColorPickerSwatch className='size-4' />
        <span className='font-mono text-xs uppercase tabular-nums'>
          {value || '选择颜色'}
        </span>
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

function NumberingModeSelect({
  value,
  onValueChange,
  invalid,
  disabled,
}: {
  value: QuestionNumberingMode
  onValueChange: (value: QuestionNumberingMode) => void
  invalid?: boolean
  disabled?: boolean
}) {
  const selected = SURVEY_NUMBERING_MODE_OPTIONS.find(
    (option) => option.value === value
  )

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) =>
        onValueChange(next as QuestionNumberingMode)
      }
    >
      <SelectTrigger aria-invalid={invalid}>
        <SelectValue placeholder='选择编号方式'>
          {selected?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SURVEY_NUMBERING_MODE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className='flex flex-col gap-0.5'>
              <span>{opt.label}</span>
              <span className='text-muted-foreground text-xs leading-none'>
                {opt.hint}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function CoverUploadField({
  value,
  onChange,
  onBlur,
  invalid,
  name,
}: {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  invalid?: boolean
  name: string
}) {
  const [showUrlInput, setShowUrlInput] = useState(false)

  return (
    <div className='flex flex-col gap-3'>
      <div className='w-full sm:w-64'>
        <FileUpload
          value={value || undefined}
          validation={COVER_UPLOAD_VALIDATION}
          view='card'
          cardSize='full'
          variant='minimal'
          crop
          aspect={2}
          onChange={(next) => {
            const url = Array.isArray(next) ? (next[0] ?? '') : next
            if (url !== value) {
              onChange(url)
            }
          }}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        {showUrlInput ? (
          <div className='flex max-w-md flex-col gap-1.5'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-xs font-medium'>
                图片网络链接
              </span>
              <Button
                type='button'
                variant='ghost'
                size='xs'
                className='text-muted-foreground hover:text-foreground h-auto p-0 text-xs'
                onClick={() => setShowUrlInput(false)}
              >
                收起链接
              </Button>
            </div>
            <Input
              id={name}
              name={name}
              value={value}
              placeholder='https://example.com/banner.png'
              aria-invalid={invalid}
              onBlur={onBlur}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <Button
              type='button'
              variant='link'
              size='xs'
              className='text-muted-foreground hover:text-foreground h-auto p-0 text-xs'
              onClick={() => setShowUrlInput(true)}
            >
              <Link2 className='mr-1 size-3.5' />
              使用图片链接
            </Button>
          </div>
        )}
        <FieldDescription>
          上传图片或使用公开图片链接，推荐比例 2:1。
        </FieldDescription>
      </div>
    </div>
  )
}

function PublishInfo({ document }: { document: SurveyDocument }) {
  return (
    <section className='border-border/70 bg-card text-card-foreground flex flex-col gap-3 rounded-xl border px-5 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-6'>
      <div className='flex flex-col gap-1'>
        <p className='text-foreground text-sm font-semibold'>发布信息</p>
        <p className='text-muted-foreground/70 text-xs leading-relaxed'>
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
    </section>
  )
}

function consentSummaryText(values: SurveySettingsFormValues): string {
  if (!values.consentEnabled) {
    return '当前关闭，填写端不做任何拦截。'
  }

  const parts = [`${values.consentClauses.length} 条`]
  parts.push(
    values.consentReadSeconds ? `≥${values.consentReadSeconds} 秒` : '不计时'
  )
  if (values.consentRequireScroll) parts.push('需滑到底')

  const optionalCount = values.consentClauses.filter(
    (clause) => clause.optional
  ).length
  if (optionalCount > 0) parts.push(`${optionalCount} 条可跳过`)

  return `仅拦截提交 · ${parts.join(' · ')}`
}

/**
 * 问卷设计器 · 配置工作区
 * 按照 shadcn/ui TanStack Form 规范彻底重构：
 * 1. 原生 form 表单提交体系，支持 header 按钮跨节点通过 form="survey-settings-form" 提交。
 * 2. 字段直接消费 Field / FieldLabel / Input / FieldDescription / FieldError 组合。
 * 3. 错误高亮遵循 data-invalid 与 aria-invalid 约定。
 */
export function SettingsWorkspace({
  onSave,
}: {
  onSave?: (values: SurveySettingsFormValues) => Promise<void>
} = {}) {
  const document = useBuilderStore((s) => s.document)
  const updateSettings = useBuilderStore((s) => s.updateSettings)

  const form = useForm({
    defaultValues: documentToSurveySettingsValues(document),
    validationLogic: revalidateLogic({
      mode: 'submit',
      modeAfterSubmission: 'change',
    }),
    validators: {
      onDynamic: surveySettingsFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (onSave) {
        await onSave(value)
      }
    },
  })

  // 当表单字段修改时同步更新全局 Builder 状态
  const formValues = useSelector(form.store, (state) => state.values)
  const isFirstRender = useRef(true)
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

  const submissionAttempts = form.state.submissionAttempts

  const consentSummary = useSelector(form.store, (state) =>
    consentSummaryText(state.values)
  )
  const consentEnabled = useSelector(
    form.store,
    (state) => state.values.consentEnabled
  )
  const consentReadSeconds = useSelector(
    form.store,
    (state) => state.values.consentReadSeconds
  )
  const consentRequireScroll = useSelector(
    form.store,
    (state) => state.values.consentRequireScroll
  )
  const numberingStyle = useSelector(
    form.store,
    (state) => state.values.numberingStyle
  )

  const consentReadSecondsValue = Number(consentReadSeconds) || 0

  return (
    <form
      id='survey-settings-form'
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className='bg-muted/25 relative flex min-h-0 flex-1 flex-col overflow-y-auto'
    >
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 py-6 sm:py-8'>
        {/* 基础信息 */}
        <SettingsSection
          title='基础信息'
          description='受访者打开问卷时看到的内容。'
        >
          <FieldGroup className='flex flex-col gap-5'>
            {/* 标题与提交按钮文案：3:1 同行布局 */}
            <div className='grid gap-4 sm:grid-cols-4'>
              <form.Field
                name='title'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.errors.length > 0 &&
                    (field.state.meta.isTouched || submissionAttempts > 0)
                  return (
                    <Field data-invalid={isInvalid} className='sm:col-span-3'>
                      <FieldLabel htmlFor={field.name}>问卷标题</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder='请输入问卷标题'
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name='submitLabel'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.errors.length > 0 &&
                    (field.state.meta.isTouched || submissionAttempts > 0)
                  return (
                    <Field data-invalid={isInvalid} className='sm:col-span-1'>
                      <FieldLabel htmlFor={field.name}>提交按钮文案</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder='提交反馈'
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </div>

            <form.Field
              name='description'
              children={(field) => {
                const isInvalid =
                  field.state.meta.errors.length > 0 &&
                  (field.state.meta.isTouched || submissionAttempts > 0)
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>描述</FieldLabel>
                    <Editor
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      placeholder='用途和填写要求（选填）'
                      invalid={isInvalid}
                      toolbar='compact'
                      minHeight='140px'
                      onBlur={field.handleBlur}
                      onChange={(val) => field.handleChange(val)}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </SettingsSection>

        {/* 外观 */}
        <SettingsSection title='外观' description='封面、主题色与题号样式。'>
          <FieldGroup className='flex flex-col gap-5'>
            {/* 头图 */}
            <form.Field
              name='cover'
              asyncDebounceMs={350}
              validators={{
                onDynamicAsyncDebounceMs: 350,
                onDynamicAsync: async ({ value }) => {
                  if (!value) return undefined
                  const isAccessible = await checkImageAccessible(value)
                  if (!isAccessible) {
                    return '图片无法访问（404 或链接失效）'
                  }
                  return undefined
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.errors.length > 0 &&
                  (field.state.meta.isTouched || submissionAttempts > 0)
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>头图封面</FieldLabel>
                    <CoverUploadField
                      name={field.name}
                      value={field.state.value}
                      invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            {/* 题号样式、编号方式与主题色：单行 3 列布局 */}
            <div className='grid gap-4 sm:grid-cols-3'>
              <form.Field
                name='numberingStyle'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.errors.length > 0 &&
                    (field.state.meta.isTouched || submissionAttempts > 0)
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>题号样式</FieldLabel>
                      <NumberingStyleSelect
                        value={field.state.value}
                        invalid={isInvalid}
                        onValueChange={field.handleChange}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name='numberingMode'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.errors.length > 0 &&
                    (field.state.meta.isTouched || submissionAttempts > 0)
                  const disabled = !isSurveyNumberingEnabled(numberingStyle)
                  const selectedMode = SURVEY_NUMBERING_MODE_OPTIONS.find(
                    (opt) => opt.value === field.state.value
                  )
                  return (
                    <Field data-invalid={isInvalid} data-disabled={disabled}>
                      <FieldLabel>编号方式</FieldLabel>
                      <NumberingModeSelect
                        value={field.state.value}
                        invalid={isInvalid}
                        disabled={disabled}
                        onValueChange={field.handleChange}
                      />
                      <FieldDescription>
                        {disabled ? '选择显示题号后生效' : selectedMode?.hint}
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name='primaryColor'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.errors.length > 0 &&
                    (field.state.meta.isTouched || submissionAttempts > 0)
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>主题色</FieldLabel>
                      <ColorControl
                        value={field.state.value}
                        invalid={isInvalid}
                        onChange={field.handleChange}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </div>
          </FieldGroup>
        </SettingsSection>

        {/* 完成页 */}
        <SettingsSection
          title='完成页'
          description='受访者提交后看到的结束页面内容。'
        >
          <FieldGroup className='flex flex-col gap-5'>
            <form.Field
              name='endTitle'
              children={(field) => {
                const isInvalid =
                  field.state.meta.errors.length > 0 &&
                  (field.state.meta.isTouched || submissionAttempts > 0)
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>完成页标题</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder='感谢您的参与！'
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <form.Field
              name='endDescription'
              children={(field) => {
                const isInvalid =
                  field.state.meta.errors.length > 0 &&
                  (field.state.meta.isTouched || submissionAttempts > 0)
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>完成页说明</FieldLabel>
                    <Editor
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      placeholder='提交后展示给受访者的说明（选填）'
                      invalid={isInvalid}
                      toolbar='compact'
                      minHeight='140px'
                      onBlur={field.handleBlur}
                      onChange={(val) => field.handleChange(val)}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </SettingsSection>

        {/* 发布与访问 */}
        <SettingsSection
          title='发布与访问'
          description='什么时候能填、谁能填、能填几次。'
        >
          <FieldGroup className='flex flex-col gap-5'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <form.Field
                name='opensAt'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.errors.length > 0 &&
                    (field.state.meta.isTouched || submissionAttempts > 0)
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>开始时间</FieldLabel>
                      <DatePicker
                        value={field.state.value}
                        placeholder='不限'
                        aria-invalid={isInvalid}
                        onChange={field.handleChange}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name='closesAt'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.errors.length > 0 &&
                    (field.state.meta.isTouched || submissionAttempts > 0)
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>结束时间</FieldLabel>
                      <DatePicker
                        value={field.state.value}
                        placeholder='不限'
                        aria-invalid={isInvalid}
                        onChange={field.handleChange}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </div>

            {/* 回收上限 */}
            <div>
              <p className='text-foreground/85 mb-2.5 text-xs font-semibold'>
                回收上限
              </p>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {RECYCLE_LIMIT_FIELDS.map(({ name, label, hint }) => (
                  <form.Field
                    key={name}
                    name={name}
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.errors.length > 0 &&
                        (field.state.meta.isTouched || submissionAttempts > 0)
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type='number'
                            min={1}
                            value={field.state.value}
                            placeholder='不限制'
                            aria-invalid={isInvalid}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <FieldDescription>{hint}</FieldDescription>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 访问密码 */}
            <form.Field
              name='accessPassword'
              children={(field) => {
                const isInvalid =
                  field.state.meta.errors.length > 0 &&
                  (field.state.meta.isTouched || submissionAttempts > 0)
                return (
                  <Field data-invalid={isInvalid} className='max-w-sm'>
                    <FieldLabel htmlFor={field.name}>访问密码</FieldLabel>
                    <PasswordInput
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      placeholder='留空则无需密码'
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldDescription>
                      填写端进入问卷前校验；留空表示不需要密码。
                    </FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </SettingsSection>

        {/* 协议与授权 */}
        <SettingsSection
          title='协议与授权'
          description='作答前向用户出示知情同意、隐私协议等条款。'
        >
          <FieldGroup className='flex flex-col gap-5'>
            <form.Field
              name='consentEnabled'
              children={(field) => {
                const isInvalid =
                  field.state.meta.errors.length > 0 &&
                  (field.state.meta.isTouched || submissionAttempts > 0)
                return (
                  <Field orientation='horizontal' data-invalid={isInvalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        提交前需要同意协议
                      </FieldLabel>
                      <FieldDescription>
                        {consentSummary} 不写入答卷，也不参与逻辑规则。
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id={field.name}
                      name={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        field.handleChange(checked)
                        if (
                          checked &&
                          form.getFieldValue('consentClauses').length === 0
                        ) {
                          form.pushFieldValue('consentClauses', {
                            ...createConsentClause(0),
                            optional: false,
                          })
                        }
                        if (!form.getFieldValue('consentReadSeconds')) {
                          form.setFieldValue('consentReadSeconds', '3')
                        }
                      }}
                      aria-invalid={isInvalid}
                    />
                  </Field>
                )
              }}
            />

            {consentEnabled ? (
              <>
                {/* 条款列表 - 采用官方推荐 mode='array' */}
                <form.Field
                  name='consentClauses'
                  mode='array'
                  children={(field) => {
                    const clauses = field.state.value
                    const timingHint = `最长条款慢读约 ${estimateConsentReadSeconds(
                      {
                        clauses,
                      }
                    )} 秒${
                      consentReadSecondsValue > 0 &&
                      consentReadSecondsValue <= CONSENT_TOKEN_READ_SECONDS
                        ? '；当前秒数偏短'
                        : ''
                    }`
                    const scrollIsVacuous = isScrollGateVacuous({
                      requireScrollToEnd: consentRequireScroll
                        ? true
                        : undefined,
                      clauses,
                    })

                    return (
                      <div className='flex flex-col gap-3'>
                        {clauses.map((clause, index) => (
                          <div
                            key={clause.id}
                            className='border-border/60 bg-muted/30 flex flex-col gap-3 rounded-lg border p-3.5'
                          >
                            <div className='flex items-center justify-between gap-2'>
                              <p className='text-foreground/85 text-xs font-semibold'>
                                条款 {index + 1}
                              </p>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon-xs'
                                className='text-muted-foreground hover:text-destructive'
                                aria-label='删除条款'
                                disabled={clauses.length <= 1}
                                onClick={() => field.removeValue(index)}
                              >
                                <Trash2 className='size-3.5' />
                              </Button>
                            </div>

                            <div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
                              <form.Field
                                name={`consentClauses[${index}].title`}
                                children={(subField) => {
                                  const isSubInvalid =
                                    subField.state.meta.errors.length > 0 &&
                                    (subField.state.meta.isTouched ||
                                      submissionAttempts > 0)
                                  return (
                                    <Field data-invalid={isSubInvalid}>
                                      <FieldLabel htmlFor={subField.name}>
                                        条款名称
                                      </FieldLabel>
                                      <Input
                                        id={subField.name}
                                        name={subField.name}
                                        value={subField.state.value}
                                        onBlur={subField.handleBlur}
                                        onChange={(e) =>
                                          subField.handleChange(e.target.value)
                                        }
                                        aria-invalid={isSubInvalid}
                                        placeholder='隐私政策'
                                      />
                                      {isSubInvalid && (
                                        <FieldError
                                          errors={subField.state.meta.errors}
                                        />
                                      )}
                                    </Field>
                                  )
                                }}
                              />

                              <form.Field
                                name={`consentClauses[${index}].optional`}
                                children={(subField) => (
                                  <Field
                                    orientation='horizontal'
                                    className='pb-2'
                                  >
                                    <Switch
                                      id={`consent-optional-${subField.name}`}
                                      checked={subField.state.value}
                                      onCheckedChange={(val) =>
                                        subField.handleChange(!!val)
                                      }
                                    />
                                    <FieldLabel
                                      htmlFor={`consent-optional-${subField.name}`}
                                      className='cursor-pointer text-xs font-normal'
                                    >
                                      允许跳过勾选
                                    </FieldLabel>
                                  </Field>
                                )}
                              />
                            </div>

                            <form.Field
                              name={`consentClauses[${index}].content`}
                              children={(subField) => {
                                const isSubInvalid =
                                  subField.state.meta.errors.length > 0 &&
                                  (subField.state.meta.isTouched ||
                                    submissionAttempts > 0)
                                return (
                                  <Field data-invalid={isSubInvalid}>
                                    <FieldLabel htmlFor={subField.name}>
                                      条款正文
                                    </FieldLabel>
                                    <Editor
                                      id={subField.name}
                                      name={subField.name}
                                      value={subField.state.value || ''}
                                      placeholder='粘贴或输入条款内容…'
                                      invalid={isSubInvalid}
                                      toolbar='compact'
                                      minHeight='140px'
                                      onBlur={subField.handleBlur}
                                      onChange={(val) =>
                                        subField.handleChange(val)
                                      }
                                    />
                                    {isSubInvalid && (
                                      <FieldError
                                        errors={subField.state.meta.errors}
                                      />
                                    )}
                                  </Field>
                                )
                              }}
                            />
                          </div>
                        ))}

                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='w-full'
                          disabled={clauses.length >= CONSENT_CLAUSE_LIMIT}
                          onClick={() =>
                            field.pushValue({
                              ...createConsentClause(clauses.length),
                              optional: false,
                            })
                          }
                        >
                          <Plus className='size-3.5' />
                          添加条款
                          <span className='text-muted-foreground/70 text-xs'>
                            {clauses.length}/{CONSENT_CLAUSE_LIMIT}
                          </span>
                        </Button>

                        {/* 阅读限制 */}
                        <div className='grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]'>
                          <form.Field
                            name='consentReadSeconds'
                            children={(subField) => {
                              const isSubInvalid =
                                subField.state.meta.errors.length > 0 &&
                                (subField.state.meta.isTouched ||
                                  submissionAttempts > 0)
                              return (
                                <Field data-invalid={isSubInvalid}>
                                  <FieldLabel htmlFor={subField.name}>
                                    最少阅读秒数
                                  </FieldLabel>
                                  <Input
                                    id={subField.name}
                                    name={subField.name}
                                    type='number'
                                    min={1}
                                    max={CONSENT_READ_SECONDS_LIMIT}
                                    value={subField.state.value}
                                    placeholder='留空即不计时'
                                    aria-invalid={isSubInvalid}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                  />
                                  <FieldDescription>
                                    {timingHint}
                                  </FieldDescription>
                                  {isSubInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              )
                            }}
                          />

                          <form.Field
                            name='consentRequireScroll'
                            children={(subField) => {
                              const isSubInvalid =
                                subField.state.meta.errors.length > 0 &&
                                (subField.state.meta.isTouched ||
                                  submissionAttempts > 0)
                              return (
                                <Field
                                  orientation='horizontal'
                                  data-invalid={isSubInvalid}
                                  className='sm:pt-6'
                                >
                                  <FieldContent>
                                    <FieldLabel htmlFor={subField.name}>
                                      必须滚动到正文底部
                                    </FieldLabel>
                                    <FieldDescription>
                                      {scrollIsVacuous
                                        ? '当前条款都很短，可能不需要滚动。'
                                        : '正文短于容器时自动满足，不会卡住提交。'}
                                    </FieldDescription>
                                  </FieldContent>
                                  <Switch
                                    id={subField.name}
                                    name={subField.name}
                                    checked={subField.state.value}
                                    onCheckedChange={subField.handleChange}
                                    aria-invalid={isSubInvalid}
                                  />
                                </Field>
                              )
                            }}
                          />
                        </div>

                        {/* 提示文案 */}
                        <div className='grid gap-4 sm:grid-cols-2'>
                          <form.Field
                            name='consentCheckboxLabel'
                            children={(subField) => {
                              const isSubInvalid =
                                subField.state.meta.errors.length > 0 &&
                                (subField.state.meta.isTouched ||
                                  submissionAttempts > 0)
                              return (
                                <Field data-invalid={isSubInvalid}>
                                  <FieldLabel htmlFor={subField.name}>
                                    勾选框文案
                                  </FieldLabel>
                                  <Input
                                    id={subField.name}
                                    name={subField.name}
                                    value={subField.state.value}
                                    placeholder={CONSENT_DEFAULT_CHECKBOX_LABEL}
                                    aria-invalid={isSubInvalid}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                  />
                                  {isSubInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              )
                            }}
                          />

                          <form.Field
                            name='consentDenyMessage'
                            children={(subField) => {
                              const isSubInvalid =
                                subField.state.meta.errors.length > 0 &&
                                (subField.state.meta.isTouched ||
                                  submissionAttempts > 0)
                              return (
                                <Field data-invalid={isSubInvalid}>
                                  <FieldLabel htmlFor={subField.name}>
                                    未同意时的提示
                                  </FieldLabel>
                                  <Input
                                    id={subField.name}
                                    name={subField.name}
                                    value={subField.state.value}
                                    placeholder='留空则按缺项自动生成'
                                    aria-invalid={isSubInvalid}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                  />
                                  {isSubInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              )
                            }}
                          />
                        </div>
                      </div>
                    )
                  }}
                />
              </>
            ) : null}
          </FieldGroup>
        </SettingsSection>

        {document.slug ? <PublishInfo document={document} /> : null}
      </div>
    </form>
  )
}
