import type { RuleCategory } from '../../core/logic/rule-meta'
import type { RichTextContent } from '../../core/rich-text'
import type {
  SurveyDocument,
  QuestionContentPatch,
  QuestionConfigPatch,
  QuestionType,
  BuilderMode,
} from '../../core/types'
import type { BuilderNavigationIntent, LogicMobilePanel } from './navigation'
import type {
  BeginRuleDraftResult,
  RuleDraft,
  RuleDraftChange,
  RuleDraftRequest,
} from './rule-draft'

export interface BuilderState {
  document: SurveyDocument
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
  updateSubmissionPolicy: (
    change: Partial<SurveyDocument['submissionPolicy']>
  ) => void
  addQuestion: (type: QuestionType, index?: number) => void
  addLayout: (kind: 'divider' | 'rich_text', index?: number) => void
  reorderElements: (activeId: string, overId: string) => void
  duplicateElement: (elementId: string) => void
  updateQuestion: (elementId: string, patch: QuestionContentPatch) => void
  updateQuestionConfig: (elementId: string, patch: QuestionConfigPatch) => void
  updateRichTextContent: (elementId: string, content: RichTextContent) => void
  removeElement: (elementId: string) => void
  selectElement: (elementId: string | null) => void
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
