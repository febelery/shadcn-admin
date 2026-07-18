import { BUILDER_TEXT_LIMITS } from '../../../shared/text-limits'
import { OptionEditor } from '../option-editor'
import type { QuestionInspectorProps } from './types'

export function MatrixInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<'matrix_single' | 'matrix_multiple'>) {
  const { config } = question

  return (
    <>
      <OptionEditor
        label='矩阵行'
        labelMaxLength={BUILDER_TEXT_LIMITS.matrixRow}
        options={config.rows}
        onChange={(rows) => onConfigChange({ rows })}
      />
      <OptionEditor
        label='矩阵列'
        labelMaxLength={BUILDER_TEXT_LIMITS.matrixColumn}
        options={config.columns}
        onChange={(columns) => onConfigChange({ columns })}
      />
    </>
  )
}
