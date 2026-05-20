import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import type {
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
} from '../../core/types'
import {
  buildQuestionDisplayOrdinalMap,
  buildQuestionOrdinalMap,
  getQuestionNumberingMode,
  getSurveyDefaultNumberingStyle,
} from '../../shared/question-numbering'
import { useBuilderStore } from '../store'

export type QuestionNumberingContextValue = {
  globalOrdinalMap: Map<string, number>
  displayOrdinalMap: Map<string, number | null>
  surveyDefaultNumbering: SurveyDefaultNumberingStyle
  numberingMode: QuestionNumberingMode
}

const QuestionNumberingContext =
  createContext<QuestionNumberingContextValue | null>(null)

export function QuestionNumberingProvider({ children }: { children: ReactNode }) {
  const schema = useBuilderStore((s) => s.schema)

  const value = useMemo((): QuestionNumberingContextValue | null => {
    if (!schema) return null
    const surveyDefaultNumbering = getSurveyDefaultNumberingStyle(schema)
    return {
      globalOrdinalMap: buildQuestionOrdinalMap(schema),
      displayOrdinalMap: buildQuestionDisplayOrdinalMap(schema),
      surveyDefaultNumbering,
      numberingMode: getQuestionNumberingMode(schema),
    }
  }, [schema])

  if (!value) {
    return children
  }

  return (
    <QuestionNumberingContext.Provider value={value}>
      {children}
    </QuestionNumberingContext.Provider>
  )
}

export function useQuestionNumbering(): QuestionNumberingContextValue {
  const ctx = useContext(QuestionNumberingContext)
  if (!ctx) {
    throw new Error('useQuestionNumbering 须在 QuestionNumberingProvider 内使用')
  }
  return ctx
}
