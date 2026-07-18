import type { RuleCategory } from '../../core/logic/rule-meta'
import type {
  SurveyDocument,
  QuestionContentPatch,
  QuestionConfigPatch,
  RichTextContent,
  QuestionType,
  BuilderMode,
} from '../types'
import type { BuilderNavigationIntent, LogicMobilePanel } from './navigation'
import type {
  BeginRuleDraftResult,
  RuleDraft,
  RuleDraftChange,
  RuleDraftRequest,
} from './rule-authoring'

export interface BuilderState {
  document: SurveyDocument
  selectedSectionId: string | null
  selectedElementId: string | null
  isDirty: boolean

  // 流程与逻辑规则状态
  builderMode: BuilderMode
  editingRuleId: string | null
  logicMobilePanel: LogicMobilePanel
  ruleDraft: RuleDraft | null
  flowRuleSearchQuery: string
  flowCanvasSearchQuery: string
  flowRuleFilter: RuleCategory | 'all'
  flowShowJumpEdges: boolean
  flowShowVisibilityEdges: boolean
  inspectorTab: 'element' | 'settings'

  updateMeta: (patch: Partial<SurveyDocument['meta']>) => void
  updateTheme: (patch: Partial<SurveyDocument['theme']>) => void
  updateSubmission: (patch: Partial<SurveyDocument['submission']>) => void
  addQuestion: (sectionId: string, type: QuestionType, index?: number) => void
  addLayout: (
    sectionId: string,
    kind: 'divider' | 'rich_text',
    index?: number
  ) => void
  reorderElements: (sectionId: string, activeId: string, overId: string) => void
  duplicateElement: (sectionId: string, elementId: string) => void
  updateQuestion: (
    sectionId: string,
    elementId: string,
    patch: QuestionContentPatch
  ) => void
  updateQuestionConfig: (
    sectionId: string,
    elementId: string,
    patch: QuestionConfigPatch
  ) => void
  updateRichTextContent: (
    sectionId: string,
    elementId: string,
    content: RichTextContent
  ) => void
  removeElement: (sectionId: string, elementId: string) => void
  select: (sectionId: string | null, elementId?: string | null) => void
  adoptDocument: (document: SurveyDocument) => void
  getDocumentSnapshot: () => SurveyDocument

  // 流程与规则相关操作
  navigate: (intent: BuilderNavigationIntent) => void
  setInspectorTab: (tab: 'element' | 'settings') => void
  setFlowRuleSearchQuery: (query: string) => void
  setFlowCanvasSearchQuery: (query: string) => void
  setFlowRuleFilter: (filter: RuleCategory | 'all') => void
  setFlowShowJumpEdges: (show: boolean) => void
  setFlowShowVisibilityEdges: (show: boolean) => void
  beginRuleDraft: (
    request: RuleDraftRequest,
    options?: { discardChanges?: boolean }
  ) => BeginRuleDraftResult
  changeRuleDraft: (change: RuleDraftChange) => void
  applyRuleDraft: () => boolean
  discardRuleDraft: () => void
  removeRule: (ruleId: string) => void
}
