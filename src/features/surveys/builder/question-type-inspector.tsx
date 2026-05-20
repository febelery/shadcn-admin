import { Input } from '@/components/ui/input'
import {
  isChoiceQuestionType,
  isMatrixQuestionType,
  isTextInputQuestionType,
} from '../core/question-capabilities'
import type {
  QuestionElement,
  QuestionConfig,
  QuestionType,
} from '../core/types'
import {
  InspectorFormField,
  InspectorFormGroup,
} from './components/inspector-primitives'
import { OptionEditor } from './components/option-editor'
import {
  CascaderInspectorFields,
  ChoiceInspectorFields,
  DateInspectorFields,
  FileUploadInspectorFields,
  NpsInspectorFields,
  NumberInspectorFields,
  SliderInspectorFields,
  TextInputInspectorFields,
} from './components/question-inspector-fields'
import { LABEL_LIMITS } from './label-limits'
import { builderTypeCaption } from './ui'

export type QuestionInspectorConfigProps = {
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
        <p className={builderTypeCaption}>
          在<strong>题目标题</strong>
          中用连续下划线表示填空位，例如：「我叫___，今年___岁」。作答端将按顺序展示输入框。
        </p>
      </InspectorFormGroup>
    )
  }

  if (type === 'signature') {
    return (
      <InspectorFormGroup title='签名说明'>
        <p className={builderTypeCaption}>
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
