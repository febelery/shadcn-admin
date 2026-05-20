import type { RuleCategory } from '../../core/logic/rule-meta'
import type {
  SurveySchema,
  QuestionElement,
  QuestionConfig,
  HtmlBlockElement,
  QuestionType,
  BuilderMode,
  Rule,
} from '../types'

export interface BuilderState {
  schema: SurveySchema | null
  selectedSectionId: string | null
  selectedElementId: string | null
  isDirty: boolean

  // 流程与逻辑规则状态
  builderMode: BuilderMode
  editingRuleId: string | null
  flowRuleSearchQuery: string
  flowCanvasSearchQuery: string
  flowRuleFilter: RuleCategory | 'all'
  flowShowJumpEdges: boolean
  flowShowVisibilityEdges: boolean
  inspectorTab: 'element' | 'settings'

  init: (schema: SurveySchema) => void
  updateMeta: (patch: Partial<SurveySchema['meta']>) => void
  updateTheme: (patch: Partial<SurveySchema['theme']>) => void
  updateSubmission: (patch: Partial<SurveySchema['submission']>) => void
  addQuestion: (sectionId: string, type: QuestionType, index?: number) => void
  addLayout: (
    sectionId: string,
    kind: 'divider' | 'html_block',
    index?: number
  ) => void
  reorderElements: (sectionId: string, activeId: string, overId: string) => void
  duplicateElement: (sectionId: string, elementId: string) => void
  updateQuestion: (
    sectionId: string,
    elementId: string,
    patch: Partial<QuestionElement>
  ) => void
  updateQuestionConfig: (
    sectionId: string,
    elementId: string,
    patch: Partial<QuestionConfig>
  ) => void
  updateHtmlBlock: (
    sectionId: string,
    elementId: string,
    patch: Partial<HtmlBlockElement>
  ) => void
  removeElement: (sectionId: string, elementId: string) => void
  select: (sectionId: string | null, elementId?: string | null) => void
  markSaved: () => void
  /** 保存/发布用的已迁移 schema */
  getSchemaForSave: () => SurveySchema | null

  // 流程与规则相关操作
  setBuilderMode: (mode: BuilderMode) => void
  setEditingRuleId: (ruleId: string | null) => void
  setInspectorTab: (tab: 'element' | 'settings') => void
  setFlowRuleSearchQuery: (query: string) => void
  setFlowCanvasSearchQuery: (query: string) => void
  setFlowRuleFilter: (filter: RuleCategory | 'all') => void
  setFlowShowJumpEdges: (show: boolean) => void
  setFlowShowVisibilityEdges: (show: boolean) => void
  selectFlowRule: (ruleId: string | null) => void
  selectFlowQuestion: (questionId: string) => void
  startFlowNewRule: () => void
  addRule: () => string
  addDisplayRule: (payload: {
    targetQuestionId: string
    when: string
    action: 'show' | 'hide'
    name: string
  }) => string
  addSkipRule: (payload: {
    sourceQuestionId: string
    when: string
    action: 'jump_to_question' | 'end'
    targetQuestionId?: string
    name: string
  }) => string
  updateRule: (ruleId: string, patch: Partial<Rule>) => void
  removeRule: (ruleId: string) => void
}
