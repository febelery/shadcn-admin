import { getQuestionDefinition } from './question-definitions'
import type { QuestionType } from './types'

export function isChoiceQuestionType(type: QuestionType): boolean {
  return getQuestionDefinition(type).family === 'choice'
}

export function isMatrixQuestionType(type: QuestionType): boolean {
  return getQuestionDefinition(type).family === 'matrix'
}

export function isTextInputQuestionType(type: QuestionType): boolean {
  return getQuestionDefinition(type).family === 'text'
}

export function getInspectorSectionTitle(type: QuestionType): string {
  return getQuestionDefinition(type).inspectorTitle
}

export function inspectorSectionDefaultOpen(type: QuestionType): boolean {
  return getQuestionDefinition(type).inspectorDefaultOpen
}
