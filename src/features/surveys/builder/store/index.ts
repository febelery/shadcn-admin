import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { getEditorSectionId } from '../../core/editor-schema'
import { canUseQuestionAsRuleSource } from '../../core/logic/rule-capabilities'
import { createEmptyRule, createRuleAction } from '../../core/logic/rule-utils'
import {
  migrateSurveySchema,
  prepareSurveySchemaForSave,
} from '../../core/migrate'
import {
  createQuestionId,
  DEFAULT_SUBMISSION,
  flattenQuestions,
} from '../../core/schema-defaults'
import { getQuestionManifest } from '../../shared/question-registry'
import type { SurveySchema, SurveyElement, Rule } from '../types'
import { findSection, cloneElement, insertAt } from './helpers'
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
        if (s.schema) Object.assign(s.schema.meta, patch)
        s.isDirty = true
      }),

    updateTheme: (patch) =>
      set((s) => {
        if (s.schema?.theme) Object.assign(s.schema.theme, patch)
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
        if (el?.kind === 'question') Object.assign(el, patch)
        s.isDirty = true
      }),

    updateQuestionConfig: (sectionId, elementId, patch) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        const el = sec?.elements.find((e) => e.id === elementId)
        if (el?.kind === 'question') Object.assign(el.config, patch)
        s.isDirty = true
      }),

    updateHtmlBlock: (sectionId, elementId, patch) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        const el = sec?.elements.find((e) => e.id === elementId)
        if (el?.kind === 'html_block') Object.assign(el, patch)
        s.isDirty = true
      }),

    removeElement: (sectionId, elementId) =>
      set((s) => {
        const sec = s.schema && findSection(s.schema, sectionId)
        if (!sec) return
        sec.elements = sec.elements.filter((e) => e.id !== elementId)
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

    setBuilderMode: (mode) =>
      set((s) => {
        s.builderMode = mode
        if (mode === 'edit') {
          s.editingRuleId = null
        }
      }),

    setEditingRuleId: (ruleId) =>
      set((s) => {
        s.editingRuleId = ruleId
        if (ruleId) {
          s.selectedElementId = null
        }
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

    selectFlowRule: (ruleId) =>
      set((s) => {
        s.editingRuleId = ruleId
        s.selectedElementId = null
      }),

    startFlowNewRule: () =>
      set((s) => {
        if (!s.schema) return
        const rule = createEmptyRule(s.schema.rules.length)
        const questions = flattenQuestions(s.schema)
        const source = questions.find((q, index) => {
          return (
            canUseQuestionAsRuleSource(q) &&
            questions.some((_, targetIndex) => targetIndex > index)
          )
        })
        if (source) {
          const sourceIndex = questions.findIndex((q) => q.id === source.id)
          const target = questions[sourceIndex + 1]
          rule.when = `{q.${source.id}} = ''`
          if (target) {
            rule.name = '按条件显示题目'
            rule.actions = [createRuleAction('show', target.id)]
          } else {
            rule.name = '按条件结束问卷'
            rule.actions = [createRuleAction('end')]
          }
        }
        s.schema.rules.push(rule)
        s.editingRuleId = rule.id
        s.selectedElementId = null
        s.isDirty = true
      }),

    addRule: () => {
      const { schema } = get()
      if (!schema) return ''
      const rule = createEmptyRule(schema.rules.length)
      set((s) => {
        if (s.schema) {
          s.schema.rules.push(rule)
          s.editingRuleId = rule.id
          s.selectedElementId = null
          s.isDirty = true
        }
      })
      return rule.id
    },

    addDisplayRule: (payload) => {
      const { schema } = get()
      if (!schema) return ''
      const ruleId = createEmptyRule().id
      const action = createRuleAction(payload.action, payload.targetQuestionId)
      const rule: Rule = {
        id: ruleId,
        name: payload.name,
        enabled: true,
        priority: schema.rules.length,
        when: payload.when,
        actions: [action],
      }
      set((s) => {
        if (s.schema) {
          s.schema.rules.push(rule)
          s.editingRuleId = ruleId
          s.selectedElementId = null
          s.isDirty = true
        }
      })
      return ruleId
    },

    addSkipRule: (payload) => {
      const { schema } = get()
      if (!schema) return ''
      const ruleId = createEmptyRule().id
      const action = createRuleAction(payload.action, payload.targetQuestionId)
      const rule: Rule = {
        id: ruleId,
        name: payload.name,
        enabled: true,
        priority: schema.rules.length,
        when: payload.when,
        actions: [action],
      }
      set((s) => {
        if (s.schema) {
          s.schema.rules.push(rule)
          s.editingRuleId = ruleId
          s.selectedElementId = null
          s.isDirty = true
        }
      })
      return ruleId
    },

    updateRule: (ruleId, patch) =>
      set((s) => {
        if (!s.schema) return
        const idx = s.schema.rules.findIndex((r) => r.id === ruleId)
        if (idx !== -1) {
          Object.assign(s.schema.rules[idx], patch)
          s.isDirty = true
        }
      }),

    removeRule: (ruleId) =>
      set((s) => {
        if (!s.schema) return
        s.schema.rules = s.schema.rules.filter((r) => r.id !== ruleId)
        if (s.editingRuleId === ruleId) {
          s.editingRuleId = null
        }
        s.isDirty = true
      }),
  }))
)
