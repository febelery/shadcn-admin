import type { QuestionConfigPatch, QuestionElement } from '../../../core/types'
import { CascaderInspectorFields } from './question-fields/cascader-fields'
import { ChoiceInspectorFields } from './question-fields/choice-fields'
import {
  DateInspectorFields,
  NumberInspectorFields,
  TextInputInspectorFields,
} from './question-fields/input-fields'
import { MatrixInspectorFields } from './question-fields/matrix-fields'
import {
  LikertInspectorFields,
  NpsInspectorFields,
  RatingInspectorFields,
  SliderInspectorFields,
} from './question-fields/scale-fields'

type Props = {
  question: QuestionElement
  onConfigChange: (patch: QuestionConfigPatch) => void
}

/** 题型专属 Inspector 的唯一分派入口。 */
export function QuestionTypeInspectorFields({
  question,
  onConfigChange,
}: Props) {
  switch (question.type) {
    case 'single_choice':
    case 'multiple_choice':
    case 'dropdown':
    case 'ranking':
      return (
        <ChoiceInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'matrix_single':
    case 'matrix_multiple':
      return (
        <MatrixInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'cascader':
      return (
        <CascaderInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <TextInputInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'number':
      return (
        <NumberInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'date':
    case 'date_range':
      return (
        <DateInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'rating':
      return (
        <RatingInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'slider':
      return (
        <SliderInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'nps':
      return (
        <NpsInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
    case 'likert':
      return (
        <LikertInspectorFields
          question={question}
          onConfigChange={onConfigChange}
        />
      )
  }
}
