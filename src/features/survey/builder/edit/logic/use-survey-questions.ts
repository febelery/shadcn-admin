import { useMemo } from 'react'
import { flattenQuestions } from '@/features/survey/core/document-elements'
import { getQuestionReferenceLabel } from '@/features/survey/core/question-numbering'
import type { QuestionElement } from '../../../core/types'
import { useBuilderStore } from '../../store'

type SurveyQuestionCatalog = {
  questionsById: Map<string, QuestionElement>
  selectOptions: { id: string; label: string }[]
}

/** 规则编辑器使用的题目目录：一次订阅提供查找索引与选择器文案。 */
export function useSurveyQuestionCatalog(filterIds?: string[]) {
  const document = useBuilderStore((s) => s.document)

  return useMemo<SurveyQuestionCatalog>(() => {
    const questions = flattenQuestions(document)
    const questionsById = new Map(
      questions.map((question) => [question.id, question])
    )
    const list = filterIds?.length
      ? questions.filter((q) => filterIds.includes(q.id))
      : questions

    return {
      questionsById,
      selectOptions: list.map((question) => ({
        id: question.id,
        label: getQuestionReferenceLabel(question, document),
      })),
    }
  }, [document, filterIds])
}
