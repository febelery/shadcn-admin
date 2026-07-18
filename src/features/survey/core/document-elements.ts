import type { QuestionElement, SurveyDocument, SurveyElement } from './types'

function visitQuestions(
  elements: SurveyElement[],
  visit: (question: QuestionElement) => void
): void {
  for (const element of elements) {
    if (element.kind === 'question') {
      visit(element)
      if (element.type === 'dynamic_panel') {
        visitQuestions(element.config.templateElements, visit)
      }
    } else if (element.kind === 'panel') {
      visitQuestions(element.elements, visit)
    }
  }
}

export function countQuestions(document: SurveyDocument): number {
  let count = 0
  for (const section of document.sections) {
    visitQuestions(section.elements, () => {
      count++
    })
  }
  return count
}

export function flattenQuestions(document: SurveyDocument): QuestionElement[] {
  const questions: QuestionElement[] = []
  for (const section of document.sections) {
    visitQuestions(section.elements, (question) => questions.push(question))
  }
  return questions
}
