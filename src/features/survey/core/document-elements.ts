import type { QuestionElement, SurveyDocument } from './types'

export function countQuestions(document: SurveyDocument): number {
  return flattenQuestions(document).length
}

export function flattenQuestions(document: SurveyDocument): QuestionElement[] {
  return document.elements.filter(
    (element): element is QuestionElement => element.kind === 'question'
  )
}
