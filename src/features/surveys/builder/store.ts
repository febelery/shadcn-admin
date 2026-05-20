import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  SurveySchema,
  SurveyElement,
  QuestionElement,
  QuestionConfig,
  HtmlBlockElement,
} from '../core/types'
import { getEditorSectionId } from '../core/editor-schema'
import {
  migrateSurveySchema,
  prepareSurveySchemaForSave,
} from '../core/migrate'
import { createQuestionId, DEFAULT_SUBMISSION } from '../core/schema-defaults'
import { getQuestionManifest } from '../shared/question-registry'
import { cloneCascaderNodes } from '../shared/cascader-adapters'
import type { QuestionType } from '../core/types'

interface BuilderState {
  schema: SurveySchema | null
  selectedSectionId: string | null
  selectedElementId: string | null
  isDirty: boolean
  init: (schema: SurveySchema) => void
  setSchema: (schema: SurveySchema) => void
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
}

function findSection(schema: SurveySchema, sectionId: string) {
  return schema.sections.find((s) => s.id === sectionId)
}

function remapIds<T extends { id: string }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, id: createQuestionId() }))
}

/** 复制题目/布局块 — JSON 深拷贝（兼容 Immer draft），并换新 id */
function cloneElement(el: SurveyElement): SurveyElement {
  const cloned = JSON.parse(JSON.stringify(el)) as SurveyElement
  cloned.id = createQuestionId()

  if (cloned.kind === 'question') {
    const cfg = cloned.config
    if (cfg.options) cfg.options = remapIds(cfg.options)
    if (cfg.rows) cfg.rows = remapIds(cfg.rows)
    if (cfg.columns) cfg.columns = remapIds(cfg.columns)
    if (cfg.statements) cfg.statements = remapIds(cfg.statements)
    if (cfg.cascaderOptions) cfg.cascaderOptions = cloneCascaderNodes(cfg.cascaderOptions)
    if (cfg.templateElements) {
      cfg.templateElements = cfg.templateElements.map(cloneElement)
    }
  }

  if (cloned.kind === 'panel') {
    cloned.elements = cloned.elements.map(cloneElement)
  }

  return cloned
}

function insertAt<T>(arr: T[], item: T, index?: number) {
  if (index === undefined || index < 0 || index > arr.length) {
    arr.push(item)
  } else {
    arr.splice(index, 0, item)
  }
}

export const useBuilderStore = create<BuilderState>()(
  immer((set, get) => ({
    schema: null,
    selectedSectionId: null,
    selectedElementId: null,
    isDirty: false,

    init: (schema) => {
      const next = migrateSurveySchema(schema, 'load')
      set({
        schema: next,
        selectedSectionId: getEditorSectionId(next),
        selectedElementId: null,
        isDirty: false,
      })
    },

    setSchema: (schema) =>
      set({
        schema: migrateSurveySchema(schema, 'load'),
        isDirty: true,
      }),

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
  }))
)
