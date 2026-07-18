import { useMemo } from 'react'
import { flattenQuestions } from '@/features/survey/core/schema-defaults'
import { getQuestionReferenceLabel } from '@/features/survey/shared/question-numbering'
import { useBuilderStore } from '../../store'
import type { QuestionElement } from '../../types'

type SurveyQuestionCatalog = {
  questionsById: Map<string, QuestionElement>
  selectOptions: { id: string; label: string }[]
}

/** 规则编辑器使用的题目目录：一次订阅提供查找索引与选择器文案。 */
export function useSurveyQuestionCatalog(filterIds?: string[]) {
  const schema = useBuilderStore((s) => s.schema)

  return useMemo<SurveyQuestionCatalog>(() => {
    if (!schema) {
      return {
        questionsById: new Map(),
        selectOptions: [],
      }
    }

    const questions = flattenQuestions(schema)
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
        label: getQuestionReferenceLabel(question, schema),
      })),
    }
  }, [schema, filterIds])
}
