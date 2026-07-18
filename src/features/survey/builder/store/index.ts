import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { getEditorSectionId } from '../../core/editor-schema'
import {
  normalizeRulePriorities,
  removeRulesReferencingQuestions,
} from '../../core/logic/rule-utils'
import {
  migrateSurveySchema,
  prepareSurveySchemaForSave,
} from '../../core/migrate'
import {
  createQuestionId,
  DEFAULT_SUBMISSION,
} from '../../core/schema-defaults'
import { getQuestionManifest } from '../../shared/question-registry'
import type { SurveySchema, SurveyElement } from '../types'
import {
  findSection,
  cloneElement,
  collectQuestionIdsFromElement,
  insertAt,
} from './helpers'
import { resolveBuilderNavigation } from './navigation'
import {
  applyRuleDraft,
  beginRuleDraft,
  changeRuleDraft,
  getRuleDraftIssues,
  hasRuleDraftChanges,
} from './rule-authoring'
import type { BuilderState } from './types'

export const useBuilderStore = create<BuilderState>()(
  immer((set, get) => ({
    schema: null,
    selectedSectionId: null,
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

    init: (schema) => {
      const next = migrateSurveySchema(schema)
      set({
        schema: next,
        selectedSectionId: getEditorSectionId(next),
        selectedElementId: null,
        isDirty: false,
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
      })
    },

    updateMeta: (patch) =>
      set((s) => {
        if (!s.schema) return
        Object.assign(s.schema.meta, patch)
        s.isDirty = true
      }),

    updateTheme: (patch) =>
      set((s) => {
        if (!s.schema?.theme) return
        Object.assign(s.schema.theme, patch)
        s.isDirty = true
      }),

    updateSubmission: (patch) =>
      set((s) => {
        if (!s.schema) return
        const sub = s.schema.submission
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
        const sec = s.schema && findSection(s.schema, sectionId)
        const manifest = getQuestionManifest(type)
        if (!sec || !manifest) return
        const el = manifest.create()
        insertAt(sec.elements, el, index)
        s.selectedSectionId = sectionId
        s.selectedElementId = el.id
        s.isDirty = true
      }),

    addLayout: (sectionId, kind, index) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        if (!sec) return
        const el: SurveyElement =
          kind === 'divider'
            ? { kind: 'divider', id: createQuestionId() }
            : {
                kind: 'html_block',
                id: createQuestionId(),
                html: '<p>说明文字</p>',
              }
        insertAt(sec.elements, el, index)
        s.selectedSectionId = sectionId
        s.selectedElementId = el.id
        s.isDirty = true
      }),

    reorderElements: (sectionId, activeId, overId) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        if (!sec || activeId === overId) return
        const oldIndex = sec.elements.findIndex((e) => e.id === activeId)
        const newIndex = sec.elements.findIndex((e) => e.id === overId)
        if (oldIndex === -1 || newIndex === -1) return
        const [moved] = sec.elements.splice(oldIndex, 1)
        sec.elements.splice(newIndex, 0, moved)
        s.isDirty = true
      }),

    duplicateElement: (sectionId, elementId) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        if (!sec) return
        const idx = sec.elements.findIndex((e) => e.id === elementId)
        if (idx === -1) return
        const copy = cloneElement(sec.elements[idx])
        sec.elements.splice(idx + 1, 0, copy)
        s.selectedElementId = copy.id
        s.isDirty = true
      }),

    updateQuestion: (sectionId, elementId, patch) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        const el = sec?.elements.find((e) => e.id === elementId)
        if (el?.kind !== 'question') return
        Object.assign(el, patch)
        s.isDirty = true
      }),

    updateQuestionConfig: (sectionId, elementId, patch) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        const el = sec?.elements.find((e) => e.id === elementId)
        if (el?.kind !== 'question') return
        Object.assign(el.config, patch)
        s.isDirty = true
      }),

    updateHtmlBlock: (sectionId, elementId, patch) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        const el = sec?.elements.find((e) => e.id === elementId)
        if (el?.kind !== 'html_block') return
        Object.assign(el, patch)
        s.isDirty = true
      }),

    removeElement: (sectionId, elementId) =>
      set((s) => {
        const schema = s.schema
        const sec = schema && findSection(schema, sectionId)
        if (!sec) return
        const removed = sec.elements.find((e) => e.id === elementId)
        if (!removed) return
        const removedQuestionIds = collectQuestionIdsFromElement(removed)
        sec.elements = sec.elements.filter((e) => e.id !== elementId)
        schema.rules = removeRulesReferencingQuestions(
          schema.rules,
          removedQuestionIds
        )
        if (s.selectedElementId === elementId) s.selectedElementId = null
        s.isDirty = true
      }),

    select: (sectionId, elementId = null) =>
      set({ selectedSectionId: sectionId, selectedElementId: elementId }),

    markSaved: () => set({ isDirty: false }),

    getSchemaForSave: (): SurveySchema | null => {
      const { schema } = get()
      return schema ? prepareSurveySchemaForSave(schema) : null
    },

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
      if (!state.schema) return 'not-found'
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

      const draft = beginRuleDraft(state.schema, request)
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
      const { schema, ruleDraft } = get()
      if (!schema || !ruleDraft) return
      set({ ruleDraft: changeRuleDraft(schema, ruleDraft, change) })
    },

    applyRuleDraft: () => {
      const { schema, ruleDraft } = get()
      if (!schema || !ruleDraft) return false
      if (
        getRuleDraftIssues(schema, ruleDraft).some(
          (issue) => issue.severity === 'error'
        )
      ) {
        return false
      }

      const rules = applyRuleDraft(schema.rules, ruleDraft)
      const committedSchema = { ...schema, rules }
      const cleanDraft = beginRuleDraft(committedSchema, {
        type: 'existing',
        ruleId: ruleDraft.value.id,
      })
      set((s) => {
        if (!s.schema || !cleanDraft) return
        s.schema.rules = rules
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
        if (!s.schema) return
        const nextRules = s.schema.rules.filter((r) => r.id !== ruleId)
        if (nextRules.length === s.schema.rules.length) return
        s.schema.rules = normalizeRulePriorities(nextRules)
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
