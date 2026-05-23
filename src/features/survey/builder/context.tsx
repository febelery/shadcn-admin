/* eslint-disable react-refresh/only-export-components  */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getEditorSection } from '../core/editor-schema'
import {
  buildQuestionDisplayOrdinalMap,
  buildQuestionOrdinalMap,
  getQuestionNumberingMode,
  getSurveyDefaultNumberingStyle,
} from '../shared/question-numbering'
import { useBuilderStore } from './store'
import type {
  SurveySchema,
  SurveyElement,
  QuestionElement,
  QuestionConfig,
  HtmlBlockElement,
  QuestionType,
  Rule,
  SurveyDefaultNumberingStyle,
  QuestionNumberingMode,
  BuilderMode,
} from './types'

export interface BuilderStaticContextType {
  // Store 动作 (Actions)
  select: (sectionId: string | null, elementId?: string | null) => void
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
  duplicateElement: (sectionId: string, elementId: string) => void
  addQuestion: (sectionId: string, type: QuestionType, index?: number) => void
  addLayout: (
    sectionId: string,
    kind: 'divider' | 'html_block',
    index?: number
  ) => void
  updateMeta: (patch: Partial<SurveySchema['meta']>) => void
  updateTheme: (patch: Partial<SurveySchema['theme']>) => void
  updateSubmission: (patch: Partial<SurveySchema['submission']>) => void
  setInspectorTab: (tab: 'element' | 'settings') => void
  setEditingRuleId: (ruleId: string | null) => void

  // 逻辑规则管理动作
  addRule: () => string
  addVisibilityRule: (payload: {
    targetQuestionId: string
    when: string
    action: 'show' | 'hide'
    name: string
  }) => string
  addNavigationRule: (payload: {
    when: string
    action: 'jump_to_question' | 'end'
    targetQuestionId?: string
    name: string
  }) => string
  updateRule: (ruleId: string, patch: Partial<Rule>) => void
  removeRule: (ruleId: string) => void
  setBuilderMode: (mode: BuilderMode) => void
}

export interface BuilderStructureContextType {
  schema: SurveySchema | null
  elements: SurveyElement[]
  sectionId: string | null
  numbering: {
    globalOrdinalMap: Map<string, number>
    displayOrdinalMap: Map<string, number | null>
    surveyDefaultNumbering: SurveyDefaultNumberingStyle
    numberingMode: QuestionNumberingMode
  } | null
}

export interface BuilderActiveStateContextType {
  selectedElementId: string | null
  inspectorTab: 'element' | 'settings'
  editingRuleId: string | null
}

export const BuilderStaticContext =
  createContext<BuilderStaticContextType | null>(null)
export const BuilderStructureContext =
  createContext<BuilderStructureContextType | null>(null)
export const BuilderActiveStateContext =
  createContext<BuilderActiveStateContextType | null>(null)

export function useBuilderStatic() {
  const context = useContext(BuilderStaticContext)
  if (!context) {
    throw new Error('useBuilderStatic 必须在 BuilderContextProvider 内使用')
  }
  return context
}

export function useBuilderStructure() {
  const context = useContext(BuilderStructureContext)
  if (!context) {
    throw new Error('useBuilderStructure 必须在 BuilderContextProvider 内使用')
  }
  return context
}

export function useBuilderActiveState() {
  const context = useContext(BuilderActiveStateContext)
  if (!context) {
    throw new Error(
      'useBuilderActiveState 必须在 BuilderContextProvider 内使用'
    )
  }
  return context
}

export function BuilderContextProvider({ children }: { children: ReactNode }) {
  const {
    schema,
    selectedSectionId,
    selectedElementId,
    inspectorTab,
    editingRuleId,
    // Actions
    select,
    updateQuestion,
    updateQuestionConfig,
    updateHtmlBlock,
    removeElement,
    duplicateElement,
    addQuestion,
    addLayout,
    updateMeta,
    updateTheme,
    updateSubmission,
    setInspectorTab,
    setEditingRuleId,
    addRule,
    addVisibilityRule,
    addNavigationRule,
    updateRule,
    removeRule,
    setBuilderMode,
  } = useBuilderStore(
    useShallow((s) => ({
      schema: s.schema,
      selectedSectionId: s.selectedSectionId,
      selectedElementId: s.selectedElementId,
      inspectorTab: s.inspectorTab,
      editingRuleId: s.editingRuleId,
      select: s.select,
      updateQuestion: s.updateQuestion,
      updateQuestionConfig: s.updateQuestionConfig,
      updateHtmlBlock: s.updateHtmlBlock,
      removeElement: s.removeElement,
      duplicateElement: s.duplicateElement,
      addQuestion: s.addQuestion,
      addLayout: s.addLayout,
      updateMeta: s.updateMeta,
      updateTheme: s.updateTheme,
      updateSubmission: s.updateSubmission,
      setInspectorTab: s.setInspectorTab,
      setEditingRuleId: s.setEditingRuleId,
      addRule: s.addRule,
      addVisibilityRule: s.addVisibilityRule,
      addNavigationRule: s.addNavigationRule,
      updateRule: s.updateRule,
      removeRule: s.removeRule,
      setBuilderMode: s.setBuilderMode,
    }))
  )

  const section = useMemo(
    () => (schema ? getEditorSection(schema) : undefined),
    [schema]
  )
  const elements = useMemo(() => section?.elements ?? [], [section])
  const sectionId = section?.id ?? selectedSectionId

  const numbering = useMemo(() => {
    if (!schema) return null
    return {
      globalOrdinalMap: buildQuestionOrdinalMap(schema),
      displayOrdinalMap: buildQuestionDisplayOrdinalMap(schema),
      surveyDefaultNumbering: getSurveyDefaultNumberingStyle(schema),
      numberingMode: getQuestionNumberingMode(schema),
    }
  }, [schema])

  const staticContextValue = useMemo<BuilderStaticContextType>(() => {
    return {
      select,
      updateQuestion,
      updateQuestionConfig,
      updateHtmlBlock,
      removeElement,
      duplicateElement,
      addQuestion,
      addLayout,
      updateMeta,
      updateTheme,
      updateSubmission,
      setInspectorTab,
      setEditingRuleId,
      addRule,
      addVisibilityRule,
      addNavigationRule,
      updateRule,
      removeRule,
      setBuilderMode,
    }
  }, [
    // Zustand actions 引用天然稳定，可放入依赖数组
    select,
    updateQuestion,
    updateQuestionConfig,
    updateHtmlBlock,
    removeElement,
    duplicateElement,
    addQuestion,
    addLayout,
    updateMeta,
    updateTheme,
    updateSubmission,
    setInspectorTab,
    setEditingRuleId,
    addRule,
    addVisibilityRule,
    addNavigationRule,
    updateRule,
    removeRule,
    setBuilderMode,
  ]) // actions 稳定引用，实际上不会触发重算；显式声明防止未来添加非稳定值时的闭包 bug

  const structureContextValue = useMemo<BuilderStructureContextType>(() => {
    return {
      schema,
      elements,
      sectionId,
      numbering,
    }
  }, [schema, elements, sectionId, numbering])

  const activeStateContextValue = useMemo<BuilderActiveStateContextType>(() => {
    return {
      selectedElementId,
      inspectorTab,
      editingRuleId,
    }
  }, [selectedElementId, inspectorTab, editingRuleId])

  return (
    <BuilderStaticContext value={staticContextValue}>
      <BuilderStructureContext value={structureContextValue}>
        <BuilderActiveStateContext value={activeStateContextValue}>
          {children}
        </BuilderActiveStateContext>
      </BuilderStructureContext>
    </BuilderStaticContext>
  )
}
