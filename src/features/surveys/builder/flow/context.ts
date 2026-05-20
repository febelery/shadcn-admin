import { createContext, useContext } from 'react'
import type {
  SurveySchema,
  QuestionElement,
  Rule,
  QuestionType,
} from '../types'

export type RuleCategory = 'visibility' | 'jump' | 'end' | 'other'

export const RULE_CATEGORY_LABEL: Record<RuleCategory, string> = {
  visibility: '显隐',
  jump: '跳题',
  end: '结束',
  other: '其他',
}

export interface FlowContextType {
  analyseSurvey: (schema: SurveySchema) => any[]

  buildFlowGraph: (schema: SurveySchema) => any
  flowNodeDimensions: (node: any, compact: boolean) => { w: number; h: number }
  layoutFlowGraphWithMeta: (graph: any) => any
  START_ID: string

  ruleMatchesSearch: (
    rule: Rule,
    query: string,
    questionTitles: Map<string, string>
  ) => boolean
  getRuleCategory: (rule: Rule) => RuleCategory

  getRulesForQuestion: (rules: Rule[], questionId: string) => Rule[]
  ruleReferencesQuestionAsSource: (rule: Rule, questionId: string) => boolean
  summarizeRuleAction: (action: any, targetLabel?: string) => string
  createRuleAction: (type: any, targetQuestionId?: string) => any

  flattenQuestions: (schema: SurveySchema) => QuestionElement[]

  getQuestionReferenceLabel: (
    question: QuestionElement,
    schema: SurveySchema
  ) => string
  getQuestionNumberPrefix: (
    question: QuestionElement,
    schema: SurveySchema
  ) => string | null
  buildQuestionOrdinalMap: (schema: SurveySchema) => any
  getQuestionNumberLabel: (ordinal: number, style: any) => string | null
  getSurveyDefaultNumberingStyle: (schema: SurveySchema) => any

  getQuestionManifest: (type: QuestionType) => any
  getQuestionTypeLabel: (type: QuestionType) => string

  layout: {
    questionNumberColumn: string
    questionPrefixCluster: string
    questionTitleText: string
  }
}

export const FlowContext = createContext<FlowContextType | null>(null)

export function useFlowContext() {
  const flowContext = useContext(FlowContext)
  if (!flowContext) {
    throw new Error('useFlowContext 必须在 FlowContextProvider 内使用')
  }
  // 直接返回 flowContext，不合并 builderContext
  // 避免 builderContext 每次渲染生成新对象导致流程图全量重渲染
  return flowContext
}
