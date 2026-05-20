import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  DEFAULT_OTHER_LABEL,
  DEFAULT_OTHER_PLACEHOLDER,
  partitionChoiceOptions,
  syncOtherChoiceOption,
} from '../../core/choice-other-option'
import type {
  QuestionConfig,
  QuestionType,
} from '../../core/types'
import { CascaderTreeEditor } from './cascader-tree-editor'
import { InspectorFormField, InspectorFormGroup } from './inspector-primitives'
import { OptionEditor } from './option-editor'

type PatchConfig = (p: Partial<QuestionConfig>) => void

const CHOICE_WITH_OTHER = new Set<QuestionType>([
  'single_choice',
  'multiple_choice',
])

const CHOICE_WITH_LIMITS = new Set<QuestionType>(['multiple_choice'])

const CHOICE_WITH_LAYOUT = new Set<QuestionType>([
  'single_choice',
  'multiple_choice',
])

export function ChoiceInspectorFields({
  type,
  config,
  patchConfig,
}: {
  type: QuestionType
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  const allowOther = config.allowOther ?? false
  const otherLabel = config.otherLabel ?? DEFAULT_OTHER_LABEL
  const { regular } = partitionChoiceOptions(config.options ?? [])

  const setOptions = (nextRegular: typeof regular) => {
    patchConfig({
      options: syncOtherChoiceOption(nextRegular, allowOther, otherLabel),
    })
  }

  const setAllowOther = (on: boolean) => {
    patchConfig({
      allowOther: on,
      options: syncOtherChoiceOption(
        config.options ?? [],
        on,
        config.otherLabel ?? DEFAULT_OTHER_LABEL
      ),
    })
  }

  return (
    <>
      <OptionEditor options={regular} onChange={setOptions} />

      <InspectorFormGroup title='选项行为'>
        {CHOICE_WITH_OTHER.has(type) && (
          <>
            <div className='flex items-center justify-between gap-2'>
              <Label htmlFor='allow-other' className='text-xs font-normal'>
                允许「其他」自填
              </Label>
              <Switch
                id='allow-other'
                checked={allowOther}
                onCheckedChange={(c) => setAllowOther(!!c)}
              />
            </div>
            {allowOther && (
              <>
                <div className='space-y-1'>
                  <Label className='text-xs'>其他选项文案</Label>
                  <Input
                    value={otherLabel}
                    onChange={(e) => {
                      const label = e.target.value
                      patchConfig({
                        otherLabel: label,
                        options: syncOtherChoiceOption(
                          partitionChoiceOptions(config.options ?? []).regular,
                          true,
                          label
                        ),
                      })
                    }}
                  />
                </div>
                <div className='space-y-1'>
                  <Label className='text-xs'>自填占位提示</Label>
                  <Input
                    value={config.otherPlaceholder ?? DEFAULT_OTHER_PLACEHOLDER}
                    onChange={(e) =>
                      patchConfig({ otherPlaceholder: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </>
        )}

        {CHOICE_WITH_LIMITS.has(type) && (
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <Label className='text-xs'>最少选择</Label>
              <Input
                type='number'
                min={0}
                value={config.minSelect ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  patchConfig({
                    minSelect: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>最多选择</Label>
              <Input
                type='number'
                min={1}
                value={config.maxSelect ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  patchConfig({
                    maxSelect: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
        )}

        {CHOICE_WITH_LAYOUT.has(type) && (
          <div className='space-y-1'>
            <Label className='text-xs'>选项排列</Label>
            <Select
              value={config.optionLayout ?? 'vertical'}
              onValueChange={(v) =>
                patchConfig({
                  optionLayout: v as 'vertical' | 'horizontal',
                })
              }
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='vertical'>纵向</SelectItem>
                <SelectItem value='horizontal'>横向</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {['single_choice', 'multiple_choice', 'dropdown', 'ranking'].includes(
          type
        ) && (
          <div className='flex items-center gap-2'>
            <Checkbox
              id='randomize'
              checked={config.randomizeOptions ?? false}
              onCheckedChange={(c) => patchConfig({ randomizeOptions: !!c })}
            />
            <Label htmlFor='randomize' className='text-xs font-normal'>
              作答时随机打乱选项顺序
            </Label>
          </div>
        )}

        {type === 'dropdown' && (
          <div className='space-y-1'>
            <Label className='text-xs'>下拉占位文案</Label>
            <Input
              value={config.placeholder ?? '请选择'}
              onChange={(e) => patchConfig({ placeholder: e.target.value })}
            />
          </div>
        )}
      </InspectorFormGroup>
    </>
  )
}

export function TextInputInspectorFields({
  type,
  config,
  patchConfig,
}: {
  type: QuestionType
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  return (
    <InspectorFormGroup title='输入设置'>
      <div className='space-y-1'>
        <Label className='text-xs'>占位提示</Label>
        <Input
          value={config.placeholder ?? ''}
          onChange={(e) => patchConfig({ placeholder: e.target.value })}
        />
      </div>
      {type === 'textarea' && (
        <>
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <Label className='text-xs'>显示行数</Label>
              <Input
                type='number'
                min={2}
                max={20}
                value={config.textareaRows ?? 4}
                onChange={(e) =>
                  patchConfig({ textareaRows: Number(e.target.value) })
                }
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>最大字数</Label>
              <Input
                type='number'
                min={1}
                value={config.maxLength ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  patchConfig({
                    maxLength: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
        </>
      )}
      {type === 'text' && (
        <div className='space-y-1'>
          <Label className='text-xs'>最大字数</Label>
          <Input
            type='number'
            min={1}
            value={config.maxLength ?? ''}
            placeholder='不限'
            onChange={(e) =>
              patchConfig({
                maxLength: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      )}
    </InspectorFormGroup>
  )
}

export function NumberInspectorFields({
  config,
  patchConfig,
}: {
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  return (
    <InspectorFormGroup title='数字范围'>
      <div className='space-y-1'>
        <Label className='text-xs'>占位提示</Label>
        <Input
          value={config.placeholder ?? ''}
          onChange={(e) => patchConfig({ placeholder: e.target.value })}
        />
      </div>
      <div className='grid grid-cols-3 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs'>最小值</Label>
          <Input
            type='number'
            value={config.minValue ?? ''}
            placeholder='不限'
            onChange={(e) =>
              patchConfig({
                minValue: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>最大值</Label>
          <Input
            type='number'
            value={config.maxValue ?? ''}
            placeholder='不限'
            onChange={(e) =>
              patchConfig({
                maxValue: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>步长</Label>
          <Input
            type='number'
            min={0}
            value={config.step ?? ''}
            placeholder='1'
            onChange={(e) =>
              patchConfig({
                step: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
    </InspectorFormGroup>
  )
}

export function DateInspectorFields({
  config,
  patchConfig,
}: {
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  return (
    <InspectorFormGroup title='日期设置'>
      <div className='space-y-1'>
        <Label className='text-xs'>精度</Label>
        <Select
          value={config.dateMode ?? 'date'}
          onValueChange={(v) =>
            patchConfig({ dateMode: v as 'date' | 'datetime' })
          }
        >
          <SelectTrigger className='h-8 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='date'>仅日期</SelectItem>
            <SelectItem value='datetime'>日期 + 时间</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs'>最早日期</Label>
          <Input
            type='date'
            value={config.minDate?.slice(0, 10) ?? ''}
            onChange={(e) =>
              patchConfig({ minDate: e.target.value || undefined })
            }
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>最晚日期</Label>
          <Input
            type='date'
            value={config.maxDate?.slice(0, 10) ?? ''}
            onChange={(e) =>
              patchConfig({ maxDate: e.target.value || undefined })
            }
          />
        </div>
      </div>
      <div className='space-y-1'>
        <Label className='text-xs'>占位提示</Label>
        <Input
          value={config.placeholder ?? ''}
          onChange={(e) => patchConfig({ placeholder: e.target.value })}
        />
      </div>
    </InspectorFormGroup>
  )
}

export function SliderInspectorFields({
  config,
  patchConfig,
}: {
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  return (
    <InspectorFormGroup title='滑块范围'>
      <div className='grid grid-cols-3 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs'>最小值</Label>
          <Input
            type='number'
            value={config.minValue ?? 0}
            onChange={(e) => patchConfig({ minValue: Number(e.target.value) })}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>最大值</Label>
          <Input
            type='number'
            value={config.maxValue ?? 100}
            onChange={(e) => patchConfig({ maxValue: Number(e.target.value) })}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>步长</Label>
          <Input
            type='number'
            min={0}
            value={config.step ?? 1}
            onChange={(e) => patchConfig({ step: Number(e.target.value) })}
          />
        </div>
      </div>
    </InspectorFormGroup>
  )
}

export function NpsInspectorFields({
  config,
  patchConfig,
}: {
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  return (
    <InspectorFormGroup title='NPS 量表'>
      <p className='text-muted-foreground text-xs'>
        标准 NPS 为 0–10 分；可自定义两端说明文案。
      </p>
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs'>左侧说明（低分）</Label>
          <Input
            value={config.npsLeftLabel ?? '完全不可能'}
            onChange={(e) => patchConfig({ npsLeftLabel: e.target.value })}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>右侧说明（高分）</Label>
          <Input
            value={config.npsRightLabel ?? '非常可能'}
            onChange={(e) => patchConfig({ npsRightLabel: e.target.value })}
          />
        </div>
      </div>
    </InspectorFormGroup>
  )
}

export function FileUploadInspectorFields({
  config,
  patchConfig,
}: {
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  const acceptStr = (config.acceptTypes ?? []).join(', ')
  return (
    <InspectorFormGroup title='上传限制'>
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs'>最多文件数</Label>
          <Input
            type='number'
            min={1}
            value={config.maxCount ?? 3}
            onChange={(e) => patchConfig({ maxCount: Number(e.target.value) })}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>单文件 MB 上限</Label>
          <Input
            type='number'
            min={1}
            value={config.maxSize ?? 10}
            onChange={(e) => patchConfig({ maxSize: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className='space-y-1'>
        <Label className='text-xs'>允许类型</Label>
        <Input
          value={acceptStr}
          placeholder='image/*, .pdf, .docx'
          onChange={(e) => {
            const raw = e.target.value.trim()
            patchConfig({
              acceptTypes: raw
                ? raw
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : undefined,
            })
          }}
        />
        <p className='text-muted-foreground text-xs'>
          逗号分隔，如 image/* 或 .pdf
        </p>
      </div>
    </InspectorFormGroup>
  )
}

export function CascaderInspectorFields({
  config,
  patchConfig,
}: {
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  const roots = config.cascaderOptions ?? []

  return (
    <>
      <CascaderTreeEditor
        nodes={roots}
        onChange={(next) => patchConfig({ cascaderOptions: next })}
      />
      <InspectorFormGroup title='级联设置'>
        <InspectorFormField label='占位提示'>
          <Input
            value={config.placeholder ?? '请选择'}
            onChange={(e) => patchConfig({ placeholder: e.target.value })}
          />
        </InspectorFormField>
      </InspectorFormGroup>
    </>
  )
}
