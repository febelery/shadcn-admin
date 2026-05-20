import { CornerDownRight, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { LABEL_LIMITS } from '../../store'
import type {
  QuestionConfig,
  QuestionType,
  CascaderNode,
  QuestionElement,
} from '../../types'
import { useBuilderStatic } from '../../context'
import { OptionEditor } from './option-editor'
import { InspectorFormField, InspectorFormGroup } from './primitives'

type NodeRowProps = {
  node: CascaderNode
  depth: number
  rootCount: number
  onChange: (nodes: CascaderNode[]) => void
  allNodes: CascaderNode[]
}

function CascaderTreeNodeRow({
  node,
  depth,
  rootCount,
  onChange,
  allNodes,
}: NodeRowProps) {
  // 仅订阅静态 Context，避免因任意结构变化触发重渲染
  const {
    createCascaderNode,
    addCascaderChild,
    removeCascaderNode,
    updateCascaderNode,
  } = useBuilderStatic()

  const childCount = node.children?.length ?? 0
  const canDelete = depth > 0 || rootCount > 1

  const handleLabelChange = (label: string) => {
    onChange(updateCascaderNode(allNodes, node.id, { label }))
  }

  const handleAddChild = () => {
    const child = createCascaderNode(`子级 ${childCount + 1}`)
    onChange(addCascaderChild(allNodes, node.id, child))
  }

  const handleDelete = () => {
    onChange(removeCascaderNode(allNodes, node.id))
  }

  return (
    <>
      <div
        className='bg-muted/30 flex items-center gap-1 rounded-md border px-1 py-1'
        style={{ marginInlineStart: depth * 16 }}
      >
        {depth > 0 ? (
          <CornerDownRight className='text-muted-foreground size-3.5 shrink-0' />
        ) : (
          <span className='size-3.5 shrink-0' />
        )}
        <Input
          className={cn(
            'h-8 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0',
            'text-xs leading-none'
          )}
          value={node.label}
          placeholder={depth === 0 ? '一级选项' : '子级选项'}
          maxLength={LABEL_LIMITS.cascaderOption}
          onChange={(e) => handleLabelChange(e.target.value)}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 shrink-0'
          aria-label='添加子级'
          onClick={handleAddChild}
        >
          <Plus className='size-3.5' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 shrink-0'
          disabled={!canDelete}
          aria-label='删除选项'
          onClick={handleDelete}
        >
          <Trash2 className='size-3.5' />
        </Button>
      </div>
      {node.children?.map((child) => (
        <CascaderTreeNodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          rootCount={rootCount}
          onChange={onChange}
          allNodes={allNodes}
        />
      ))}
    </>
  )
}

function CascaderTreeEditor({
  nodes,
  onChange,
}: {
  nodes: CascaderNode[]
  onChange: (nodes: CascaderNode[]) => void
}) {
  const { createCascaderNode } = useBuilderStatic()

  const handleAddRoot = () => {
    onChange([...nodes, createCascaderNode(`一级 ${nodes.length + 1}`)])
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <Label className='text-muted-foreground text-xs font-medium'>
          级联选项
        </Label>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className={cn('h-7', 'text-xs leading-none')}
          onClick={handleAddRoot}
        >
          <Plus className='mr-1 size-3.5' />
          添加一级
        </Button>
      </div>

      <div className='flex flex-col gap-1.5'>
        {nodes.map((node) => (
          <CascaderTreeNodeRow
            key={node.id}
            node={node}
            depth={0}
            rootCount={nodes.length}
            onChange={onChange}
            allNodes={nodes}
          />
        ))}
      </div>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        点击 + 为当前项添加子级；末级节点即为可选项叶子。
      </p>
    </div>
  )
}

type PatchConfig = (p: Partial<QuestionConfig>) => void

export function ChoiceInspectorFields({
  type,
  config,
  patchConfig,
}: {
  type: QuestionType
  config: QuestionConfig
  patchConfig: PatchConfig
}) {
  const {
    DEFAULT_OTHER_LABEL,
    DEFAULT_OTHER_PLACEHOLDER,
    partitionChoiceOptions,
    syncOtherChoiceOption,
  } = useBuilderStatic()

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
        {(['single_choice', 'multiple_choice'] as QuestionType[]).includes(
          type
        ) && (
          <>
            <div className='flex items-center justify-between gap-2'>
              <Label
                htmlFor='allow-other'
                className='text-muted-foreground text-xs font-medium'
              >
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
                <div className='flex flex-col gap-1'>
                  <Label className='text-muted-foreground text-xs font-medium'>
                    其他选项文案
                  </Label>
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
                <div className='flex flex-col gap-1'>
                  <Label className='text-muted-foreground text-xs font-medium'>
                    自填占位提示
                  </Label>
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

        {type === 'multiple_choice' && (
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-1'>
              <Label className='text-muted-foreground text-xs font-medium'>
                最少选择
              </Label>
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
            <div className='flex flex-col gap-1'>
              <Label className='text-muted-foreground text-xs font-medium'>
                最多选择
              </Label>
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

        {(['single_choice', 'multiple_choice'] as QuestionType[]).includes(
          type
        ) && (
          <div className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs font-medium'>
              选项排列
            </Label>
            <Select
              value={config.optionLayout ?? 'vertical'}
              onValueChange={(v) =>
                patchConfig({
                  optionLayout: v as 'vertical' | 'horizontal',
                })
              }
            >
              <SelectTrigger className={cn('h-8', 'text-xs leading-none')}>
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
            <Label
              htmlFor='randomize'
              className='text-muted-foreground text-xs font-medium'
            >
              作答时随机打乱选项顺序
            </Label>
          </div>
        )}

        {type === 'dropdown' && (
          <div className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs font-medium'>
              下拉占位文案
            </Label>
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
      <div className='flex flex-col gap-1'>
        <Label className='text-muted-foreground text-xs font-medium'>
          占位提示
        </Label>
        <Input
          value={config.placeholder ?? ''}
          onChange={(e) => patchConfig({ placeholder: e.target.value })}
        />
      </div>
      {type === 'textarea' && (
        <>
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-1'>
              <Label className='text-muted-foreground text-xs font-medium'>
                显示行数
              </Label>
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
            <div className='flex flex-col gap-1'>
              <Label className='text-muted-foreground text-xs font-medium'>
                最大字数
              </Label>
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
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最大字数
          </Label>
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
      <div className='flex flex-col gap-1'>
        <Label className='text-muted-foreground text-xs font-medium'>
          占位提示
        </Label>
        <Input
          value={config.placeholder ?? ''}
          onChange={(e) => patchConfig({ placeholder: e.target.value })}
        />
      </div>
      <div className='grid grid-cols-3 gap-2'>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最小值
          </Label>
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
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最大值
          </Label>
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
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            步长
          </Label>
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
      <div className='flex flex-col gap-1'>
        <Label className='text-muted-foreground text-xs font-medium'>
          精度
        </Label>
        <Select
          value={config.dateMode ?? 'date'}
          onValueChange={(v) =>
            patchConfig({ dateMode: v as 'date' | 'datetime' })
          }
        >
          <SelectTrigger className={cn('h-8', 'text-xs leading-none')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='date'>仅日期</SelectItem>
            <SelectItem value='datetime'>日期 + 时间</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最早日期
          </Label>
          <Input
            type='date'
            value={config.minDate?.slice(0, 10) ?? ''}
            onChange={(e) =>
              patchConfig({ minDate: e.target.value || undefined })
            }
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最晚日期
          </Label>
          <Input
            type='date'
            value={config.maxDate?.slice(0, 10) ?? ''}
            onChange={(e) =>
              patchConfig({ maxDate: e.target.value || undefined })
            }
          />
        </div>
      </div>
      <div className='flex flex-col gap-1'>
        <Label className='text-muted-foreground text-xs font-medium'>
          占位提示
        </Label>
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
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最小值
          </Label>
          <Input
            type='number'
            value={config.minValue ?? 0}
            onChange={(e) => patchConfig({ minValue: Number(e.target.value) })}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最大值
          </Label>
          <Input
            type='number'
            value={config.maxValue ?? 100}
            onChange={(e) => patchConfig({ maxValue: Number(e.target.value) })}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            步长
          </Label>
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
      <p className='text-muted-foreground text-xs leading-relaxed'>
        标准 NPS 为 0–10 分；可自定义两端说明文案。
      </p>
      <div className='grid grid-cols-2 gap-2'>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            左侧说明（低分）
          </Label>
          <Input
            value={config.npsLeftLabel ?? '完全不可能'}
            onChange={(e) => patchConfig({ npsLeftLabel: e.target.value })}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            右侧说明（高分）
          </Label>
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
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最多文件数
          </Label>
          <Input
            type='number'
            min={1}
            value={config.maxCount ?? 3}
            onChange={(e) => patchConfig({ maxCount: Number(e.target.value) })}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            单文件 MB 上限
          </Label>
          <Input
            type='number'
            min={1}
            value={config.maxSize ?? 10}
            onChange={(e) => patchConfig({ maxSize: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className='flex flex-col gap-1'>
        <Label className='text-muted-foreground text-xs font-medium'>
          允许类型
        </Label>
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
        <p className='text-muted-foreground text-xs leading-relaxed'>
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

type QuestionInspectorConfigProps = {
  type: QuestionType
  el: QuestionElement
  patchConfig: (p: Partial<QuestionConfig>) => void
}

/** 题型 → 检查器配置区（唯一注册点） */
export function QuestionTypeInspectorFields({
  type,
  el,
  patchConfig,
}: QuestionInspectorConfigProps) {
  const {
    isChoiceQuestionType,
    isMatrixQuestionType,
    isTextInputQuestionType,
  } = useBuilderStatic()

  if (isChoiceQuestionType(type)) {
    return (
      <ChoiceInspectorFields
        type={type}
        config={el.config}
        patchConfig={patchConfig}
      />
    )
  }

  if (type === 'cascader') {
    return (
      <CascaderInspectorFields config={el.config} patchConfig={patchConfig} />
    )
  }

  if (isMatrixQuestionType(type)) {
    return (
      <>
        <OptionEditor
          label='矩阵行'
          labelMaxLength={LABEL_LIMITS.matrixRow}
          options={(el.config.rows ?? []).map((r) => ({
            id: r.id,
            label: r.label,
          }))}
          onChange={(rows) =>
            patchConfig({
              rows: rows.map((o) => ({ id: o.id, label: o.label })),
            })
          }
        />
        <OptionEditor
          label='矩阵列'
          labelMaxLength={LABEL_LIMITS.matrixCol}
          options={(el.config.columns ?? []).map((c) => ({
            id: c.id,
            label: c.label,
          }))}
          onChange={(columns) =>
            patchConfig({
              columns: columns.map((o) => ({ id: o.id, label: o.label })),
            })
          }
        />
      </>
    )
  }

  if (type === 'likert') {
    return (
      <>
        <OptionEditor
          label='陈述项'
          labelMaxLength={LABEL_LIMITS.likertStatement}
          options={(el.config.statements ?? []).map((s) => ({
            id: s.id,
            label: s.label,
          }))}
          onChange={(items) =>
            patchConfig({
              statements: items.map((o) => ({ id: o.id, label: o.label })),
            })
          }
        />
        <InspectorFormField label='最小分值'>
          <Input
            type='number'
            className='h-9'
            value={el.config.scaleMin ?? 1}
            onChange={(e) => patchConfig({ scaleMin: Number(e.target.value) })}
          />
        </InspectorFormField>
        <InspectorFormField label='最大分值'>
          <Input
            type='number'
            className='h-9'
            value={el.config.scaleMax ?? 5}
            onChange={(e) => patchConfig({ scaleMax: Number(e.target.value) })}
          />
        </InspectorFormField>
      </>
    )
  }

  if (type === 'rating') {
    return (
      <InspectorFormField label='星级数量'>
        <Input
          type='number'
          className='h-9'
          min={1}
          max={10}
          value={el.config.starCount ?? 5}
          onChange={(e) => patchConfig({ starCount: Number(e.target.value) })}
        />
      </InspectorFormField>
    )
  }

  if (type === 'slider') {
    return (
      <SliderInspectorFields config={el.config} patchConfig={patchConfig} />
    )
  }

  if (type === 'nps') {
    return <NpsInspectorFields config={el.config} patchConfig={patchConfig} />
  }

  if (type === 'dynamic_panel') {
    return (
      <>
        <InspectorFormField label='最少条数'>
          <Input
            type='number'
            className='h-9'
            value={el.config.minItems ?? 1}
            onChange={(e) => patchConfig({ minItems: Number(e.target.value) })}
          />
        </InspectorFormField>
        <InspectorFormField label='最多条数'>
          <Input
            type='number'
            className='h-9'
            value={el.config.maxItems ?? 5}
            onChange={(e) => patchConfig({ maxItems: Number(e.target.value) })}
          />
        </InspectorFormField>
        <InspectorFormField label='添加按钮文案'>
          <Input
            className='h-9'
            value={el.config.addLabel ?? '添加一项'}
            onChange={(e) => patchConfig({ addLabel: e.target.value })}
          />
        </InspectorFormField>
      </>
    )
  }

  if (isTextInputQuestionType(type)) {
    return (
      <TextInputInspectorFields
        type={type}
        config={el.config}
        patchConfig={patchConfig}
      />
    )
  }

  if (type === 'number') {
    return (
      <NumberInspectorFields config={el.config} patchConfig={patchConfig} />
    )
  }

  if (type === 'date' || type === 'date_range') {
    return <DateInspectorFields config={el.config} patchConfig={patchConfig} />
  }

  if (type === 'fill_in') {
    return (
      <InspectorFormGroup title='填空说明'>
        <p className='text-muted-foreground text-xs leading-relaxed'>
          在<strong>题目标题</strong>
          中用连续下划线表示填空位，例如：「我叫___，今年___岁」。作答端将按顺序展示输入框。
        </p>
      </InspectorFormGroup>
    )
  }

  if (type === 'signature') {
    return (
      <InspectorFormGroup title='签名说明'>
        <p className='text-muted-foreground text-xs leading-relaxed'>
          填写端提供手写签名区域；无需额外配置项。
        </p>
      </InspectorFormGroup>
    )
  }

  if (type === 'file_upload') {
    return (
      <FileUploadInspectorFields config={el.config} patchConfig={patchConfig} />
    )
  }

  return null
}
