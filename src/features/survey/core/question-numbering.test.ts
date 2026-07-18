import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from './document-factory'
import { createQuestion } from './question-factory'
import {
  buildQuestionDisplayOrdinalMap,
  getQuestionReferenceLabel,
} from './question-numbering'

describe('question numbering projection', () => {
  it('reuses numbering results when unrelated document fields change', () => {
    const document = createEmptySurvey()
    document.elements = [createQuestion('text'), createQuestion('textarea')]

    const before = buildQuestionDisplayOrdinalMap(document)
    const after = buildQuestionDisplayOrdinalMap({
      ...document,
      theme: { ...document.theme, primaryColor: '#2563eb' },
      submissionPolicy: { perUserLimit: 1 },
    })

    expect(after).toBe(before)
  })

  it('rebuilds labels when the question sequence changes', () => {
    const document = createEmptySurvey()
    const question = createQuestion('text')
    question.title = '原始标题'
    document.elements = [question]
    expect(getQuestionReferenceLabel(question, document)).toBe('1. 原始标题')

    const changedQuestion = { ...question, title: '新标题' }
    const changedDocument = { ...document, elements: [changedQuestion] }

    expect(getQuestionReferenceLabel(changedQuestion, changedDocument)).toBe(
      '1. 新标题'
    )
  })
})
