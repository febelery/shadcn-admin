import { createStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { DEFAULT_SUBMISSION } from '../../core/document-factory'
import { getEditorSectionId } from '../../core/editor-section'
import {
  normalizeRulePriorities,
  removeRulesReferencingQuestions,
} from '../../core/logic/rule-utils'
import { applyQuestionConfigPatch } from '../../core/question-config'
import { createQuestion } from '../../core/question-factory'
import { EMPTY_RICH_TEXT, parseRichTextContent } from '../../core/rich-text'
import type { SurveyDocument, SurveyElement } from '../../core/types'
import {
  findSection,
  cloneElement,
  collectQuestionIdsFromElement,
  insertAt,
} from './element-operations'
import { resolveBuilderNavigation } from './navigation'
import {
  applyRuleDraft,
  beginRuleDraft,
  changeRuleDraft,
  getRuleDraftIssues,
  hasRuleDraftChanges,
} from './rule-draft'
import type { BuilderState } from './state'

export function createBuilderStore(initialDocument: SurveyDocument) {
  const document = structuredClone(initialDocument)
  return createStore<BuilderState>()(
    immer((set, get) => ({
      document,
      selectedSectionId: getEditorSectionId(document),
      selectedElementId: null,
      isDirty: false,

      // 流程与逻辑规则默认状态
      builderMode: 'edit',
      editingRuleId: null,
      logicMobilePanel: 'closed',
      ruleDraft: null,
      flowRuleSearchQuery: '',
      flowCanvasSearchQuery: '',
      flowRuleFilter: 'all',
      flowShowJumpEdges: true,
      flowShowVisibilityEdges: true,
      inspectorTab: 'element',

      updateMeta: (patch) =>
        set((s) => {
          Object.assign(s.document.meta, patch)
          s.isDirty = true
        }),

      updateTheme: (patch) =>
        set((s) => {
          Object.assign(s.document.theme, patch)
          s.isDirty = true
        }),

      updateSubmission: (patch) =>
        set((s) => {
          const sub = s.document.submission
          if (patch.timeWindow) {
            sub.timeWindow = {
              ...DEFAULT_SUBMISSION.timeWindow,
              ...sub.timeWindow,
              ...patch.timeWindow,
            }
          }
          if (patch.quota) {
            sub.quota = {
              ...DEFAULT_SUBMISSION.quota,
              ...sub.quota,
              ...patch.quota,
            }
          }
          if (patch.rateLimit) {
            sub.rateLimit = {
              ...DEFAULT_SUBMISSION.rateLimit,
              ...sub.rateLimit,
              ...patch.rateLimit,
            }
          }
          const { timeWindow, quota, rateLimit, ...rest } = patch
          Object.assign(sub, rest)
          s.isDirty = true
        }),

      addQuestion: (sectionId, type, index) =>
        set((s) => {
          const sec = findSection(s.document, sectionId)
          if (!sec) return
          const el = createQuestion(type)
          insertAt(sec.elements, el, index)
          s.selectedSectionId = sectionId
          s.selectedElementId = el.id
          s.isDirty = true
        }),

      addLayout: (sectionId, kind, index) =>
        set((s) => {
          const sec = findSection(s.document, sectionId)
          if (!sec) return
          const el: SurveyElement =
            kind === 'divider'
              ? { kind: 'divider', id: crypto.randomUUID() }
              : {
                  kind: 'rich_text',
                  id: crypto.randomUUID(),
                  content: structuredClone(EMPTY_RICH_TEXT),
                }
          insertAt(sec.elements, el, index)
          s.selectedSectionId = sectionId
          s.selectedElementId = el.id
          s.isDirty = true
        }),

      reorderElements: (sectionId, activeId, overId) =>
        set((s) => {
          const sec = findSection(s.document, sectionId)
          if (!sec || activeId === overId) return
          const oldIndex = sec.elements.findIndex((e) => e.id === activeId)
          const newIndex = sec.elements.findIndex((e) => e.id === overId)
          if (oldIndex === -1 || newIndex === -1) return
          const [moved] = sec.elements.splice(oldIndex, 1)
          sec.elements.splice(newIndex, 0, moved)
          s.isDirty = true
        }),

      duplicateElement: (sectionId, elementId) => {
        const sourceSection = findSection(get().document, sectionId)
        const source = sourceSection?.elements.find(
          (element) => element.id === elementId
        )
        if (!source) return
        const copy = cloneElement(source)

        set((s) => {
          const section = findSection(s.document, sectionId)
          if (!section) return
          const sourceIndex = section.elements.findIndex(
            (element) => element.id === elementId
          )
          if (sourceIndex === -1) return
          section.elements.splice(sourceIndex + 1, 0, copy)
          s.selectedElementId = copy.id
          s.isDirty = true
        })
      },

      updateQuestion: (sectionId, elementId, patch) =>
        set((s) => {
          const sec = findSection(s.document, sectionId)
          const el = sec?.elements.find((e) => e.id === elementId)
          if (el?.kind !== 'question') return
          Object.assign(el, patch)
          s.isDirty = true
        }),

      updateQuestionConfig: (sectionId, elementId, patch) =>
        set((s) => {
          const sec = findSection(s.document, sectionId)
          const el = sec?.elements.find((e) => e.id === elementId)
          if (el?.kind !== 'question') return
          el.config = applyQuestionConfigPatch(el, patch)
          s.isDirty = true
        }),

      updateRichTextContent: (sectionId, elementId, content) =>
        set((s) => {
          const sec = findSection(s.document, sectionId)
          const el = sec?.elements.find((e) => e.id === elementId)
          if (el?.kind !== 'rich_text') return
          el.content = parseRichTextContent(content)
          s.isDirty = true
        }),

      removeElement: (sectionId, elementId) =>
        set((s) => {
          const document = s.document
          const sec = findSection(document, sectionId)
          if (!sec) return
          const removed = sec.elements.find((e) => e.id === elementId)
          if (!removed) return
          const removedQuestionIds = collectQuestionIdsFromElement(removed)
          sec.elements = sec.elements.filter((e) => e.id !== elementId)
          document.rules = removeRulesReferencingQuestions(
            document.rules,
            removedQuestionIds
          )
          if (s.selectedElementId === elementId) s.selectedElementId = null
          s.isDirty = true
        }),

      select: (sectionId, elementId = null) =>
        set({ selectedSectionId: sectionId, selectedElementId: elementId }),

      adoptDocument: (document) =>
        set((s) => {
          const activeRuleId = s.ruleDraft?.value.id
          s.document = structuredClone(document)
          s.ruleDraft = activeRuleId
            ? beginRuleDraft(document, {
                type: 'existing',
                ruleId: activeRuleId,
              })
            : null
          s.isDirty = false
        }),

      getDocumentSnapshot: () => structuredClone(get().document),

      navigate: (intent) =>
        set((s) => {
          Object.assign(s, resolveBuilderNavigation(s, intent))
        }),

      setInspectorTab: (tab) =>
        set((s) => {
          s.inspectorTab = tab
        }),

      setFlowRuleSearchQuery: (query) =>
        set((s) => {
          s.flowRuleSearchQuery = query
        }),

      setFlowCanvasSearchQuery: (query) =>
        set((s) => {
          s.flowCanvasSearchQuery = query
        }),

      setFlowRuleFilter: (filter) =>
        set((s) => {
          s.flowRuleFilter = filter
        }),

      setFlowShowJumpEdges: (show) =>
        set((s) => {
          s.flowShowJumpEdges = show
        }),

      setFlowShowVisibilityEdges: (show) =>
        set((s) => {
          s.flowShowVisibilityEdges = show
        }),

      beginRuleDraft: (request, options) => {
        const state = get()
        if (
          state.ruleDraft &&
          request.type === 'existing' &&
          state.ruleDraft.value.id === request.ruleId
        ) {
          set((s) => {
            Object.assign(
              s,
              resolveBuilderNavigation(s, {
                type: 'show-rule-editor',
                ruleId: request.ruleId,
              })
            )
          })
          return 'started'
        }
        if (hasRuleDraftChanges(state.ruleDraft) && !options?.discardChanges) {
          return 'confirmation-required'
        }

        const draft = beginRuleDraft(state.document, request)
        if (!draft) return 'not-found'
        set((s) => {
          s.ruleDraft = draft
          Object.assign(
            s,
            resolveBuilderNavigation(s, {
              type: 'show-rule-editor',
              ruleId: draft.value.id,
            })
          )
        })
        return 'started'
      },

      changeRuleDraft: (change) => {
        const { document, ruleDraft } = get()
        if (!ruleDraft) return
        set({ ruleDraft: changeRuleDraft(document, ruleDraft, change) })
      },

      applyRuleDraft: () => {
        const { document, ruleDraft } = get()
        if (!ruleDraft) return false
        if (
          getRuleDraftIssues(document, ruleDraft).some(
            (issue) => issue.severity === 'error'
          )
        ) {
          return false
        }

        const rules = applyRuleDraft(document.rules, ruleDraft)
        const committedDocument = { ...document, rules }
        const cleanDraft = beginRuleDraft(committedDocument, {
          type: 'existing',
          ruleId: ruleDraft.value.id,
        })
        set((s) => {
          if (!cleanDraft) return
          s.document.rules = rules
          s.ruleDraft = cleanDraft
          s.isDirty = true
        })
        return true
      },

      discardRuleDraft: () =>
        set((s) => {
          s.ruleDraft = null
          Object.assign(
            s,
            resolveBuilderNavigation(s, { type: 'clear-rule-focus' })
          )
        }),

      removeRule: (ruleId) =>
        set((s) => {
          const nextRules = s.document.rules.filter((r) => r.id !== ruleId)
          if (nextRules.length === s.document.rules.length) return
          s.document.rules = normalizeRulePriorities(nextRules)
          if (s.ruleDraft?.value.id === ruleId) {
            s.ruleDraft = null
          }
          if (s.editingRuleId === ruleId) {
            Object.assign(
              s,
              resolveBuilderNavigation(s, { type: 'clear-rule-focus' })
            )
          }
          s.isDirty = true
        }),
    }))
  )
}

export type BuilderStore = ReturnType<typeof createBuilderStore>
