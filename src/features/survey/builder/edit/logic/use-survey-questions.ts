import { useMemo } from 'react'
import { flattenQuestions } from '@/features/survey/core/schema-defaults'
import { getQuestionReferenceLabel } from '@/features/survey/shared/question-numbering'
import { useBuilderStructure } from '../../context'
import type { QuestionElement } from '../../types'

export function useSurveyQuestions(): QuestionElement[] {
  const { schema } = useBuilderStructure()
  return useMemo(() => (schema ? flattenQuestions(schema) : []), [schema])
}

/** 下拉/摘要用题目标签 — 与画布题号一致 */
export function useQuestionLabel(id: string): string {
  const { schema } = useBuilderStructure()
  const questions = useSurveyQuestions()
  const q = questions.find((x) => x.id === id)
  if (!q || !schema) return id.slice(0, 8)
  return getQuestionReferenceLabel(q, schema)
}

/** 题目选择器选项 */
export function useQuestionSelectOptions(filterIds?: string[]) {
  const { schema } = useBuilderStructure()
  const questions = useSurveyQuestions()

  return useMemo(() => {
    if (!schema) return []
    const list = filterIds?.length
      ? questions.filter((q) => filterIds.includes(q.id))
      : questions
    return list.map((q) => ({
      id: q.id,
      label: getQuestionReferenceLabel(q, schema),
    }))
  }, [schema, questions, filterIds])
}
