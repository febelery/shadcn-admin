import { useMemo, useState } from 'react'
import { flattenQuestions } from '@/features/survey/core/document-elements'
import { getQuestionReferenceLabel } from '@/features/survey/core/question-numbering'
import type { QuestionElement, SurveyDocument } from '../../core/types'
import { useBuilderStore } from '../builder-session'

type SurveyQuestionCatalog = {
  questionsById: Map<string, QuestionElement>
  selectOptions: { id: string; label: string }[]
}

function createQuestionCatalogProjector() {
  let previousElements: SurveyDocument['elements'] | null = null
  let previousNumberingStyle: SurveyDocument['meta']['defaultQuestionNumbering']
  let previousNumberingMode: SurveyDocument['meta']['questionNumberingMode']
  let previousCatalog: SurveyQuestionCatalog | null = null

  return (document: SurveyDocument): SurveyQuestionCatalog => {
    if (
      document.elements === previousElements &&
      document.meta.defaultQuestionNumbering === previousNumberingStyle &&
      document.meta.questionNumberingMode === previousNumberingMode &&
      previousCatalog
    ) {
      return previousCatalog
    }

    const questions = flattenQuestions(document)
    const catalog = {
      questionsById: new Map(
        questions.map((question) => [question.id, question])
      ),
      selectOptions: questions.map((question) => ({
        id: question.id,
        label: getQuestionReferenceLabel(question, document),
      })),
    }
    previousElements = document.elements
    previousNumberingStyle = document.meta.defaultQuestionNumbering
    previousNumberingMode = document.meta.questionNumberingMode
    previousCatalog = catalog
    return catalog
  }
}

/** 规则编辑器使用的题目目录：一次订阅提供查找索引与选择器文案。 */
export function useSurveyQuestionCatalog(filterIds?: string[]) {
  const [project] = useState(createQuestionCatalogProjector)
  const catalog = useBuilderStore((s) => project(s.document))

  return useMemo<SurveyQuestionCatalog>(() => {
    if (!filterIds?.length) return catalog
    const allowedIds = new Set(filterIds)

    return {
      questionsById: catalog.questionsById,
      selectOptions: catalog.selectOptions.filter((option) =>
        allowedIds.has(option.id)
      ),
    }
  }, [catalog, filterIds])
}
