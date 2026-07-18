import type {
  QuestionConfigPatch,
  QuestionElement,
  QuestionType,
} from '../../../../core/types'

export type QuestionInspectorProps<Type extends QuestionType> = {
  question: QuestionElement<Type>
  onConfigChange: (patch: QuestionConfigPatch) => void
}
