import React, { createContext, useContext, useMemo } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  DEFAULT_OTHER_LABEL,
  DEFAULT_OTHER_PLACEHOLDER,
  isOtherOption,
  partitionChoiceOptions,
  syncOtherChoiceOption,
} from '../core/choice-other-option'
import { getEditorSection } from '../core/editor-schema'
import {
  serializeCondition,
  serializeConditionGroup,
  tryParseSimpleCondition,
  extractQuestionRefsFromWhen,
} from '../core/logic/condition-serializer'
import {
  getOperatorsForQuestionType,
  supportsVisualCondition,
} from '../core/logic/operators'
import {
  getRulesForQuestion,
  ruleReferencesQuestionAsSource,
  summarizeRuleAction,
  createRuleAction,
} from '../core/logic/rule-utils'
import {
  isChoiceQuestionType,
  isMatrixQuestionType,
  isTextInputQuestionType,
  hasInspectorConfigSection,
  getInspectorSectionTitle,
  inspectorSectionDefaultOpen,
} from '../core/question-capabilities'
import {
  createQuestionId,
  flattenQuestions,
  DEFAULT_META,
  DEFAULT_SUBMISSION,
} from '../core/schema-defaults'
import {
  cascaderNodesToOptions,
  createCascaderNode,
  addCascaderChild,
  removeCascaderNode,
  updateCascaderNode,
} from '../shared/cascader-adapters'
import {
  questionNumberColumn,
  questionBlockContentCol,
  questionBlockGrid,
  questionBlockGridRequiredOnly,
  questionBlockStack,
  questionOptionsWrap,
  questionHeaderLineHeight,
  questionPrefixCluster,
  questionTitleText,
} from '../shared/question-layout'
import {
  buildQuestionDisplayOrdinalMap,
  buildQuestionOrdinalMap,
  getQuestionNumberingMode,
  getSurveyDefaultNumberingStyle,
  getQuestionReferenceLabel,
  SURVEY_NUMBERING_OPTIONS,
  SURVEY_NUMBERING_MODE_OPTIONS,
  isSurveyNumberingEnabled,
  isQuestionNumberVisible,
  getQuestionNumberLabel,
  getQuestionNumberTextClass,
} from '../shared/question-numbering'
import {
  getQuestionTypeLabel,
  getQuestionManifest,
  LAYOUT_MANIFESTS,
  QUESTION_CATEGORIES,
  QUESTION_MANIFESTS,
} from '../shared/question-registry'
import { QuestionRequiredMark } from '../shared/question-required-mark'
import {
  getQuestionTypeHint,
  hasQuestionTypePreview,
  matchesPaletteSearch,
} from '../shared/question-type-hints'
import { QuestionTypePreview } from '../shared/question-type-preview'
import { SurveyCoverHeader } from '../shared/survey-cover-header'
import { useBuilderStore } from './store'
import type {
  SurveySchema,
  SurveyElement,
  QuestionElement,
  QuestionConfig,
  HtmlBlockElement,
  QuestionType,
  Rule,
  Section,
  ChoiceOption,
  SurveyDefaultNumberingStyle,
  QuestionNumberingMode,
  CascaderNode,
  RuleAction,
  RuleActionType,
  ConditionGroup,
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

  // 核心逻辑与辅助函数 (重定向自 core / shared)
  createQuestionId: () => string
  DEFAULT_OTHER_LABEL: string
  isOtherOption: (option: ChoiceOption) => boolean
  partitionChoiceOptions: (options: ChoiceOption[]) => {
    regular: ChoiceOption[]
    other: ChoiceOption | undefined
  }
  syncOtherChoiceOption: (
    options: ChoiceOption[],
    allowOther: boolean,
    otherLabel?: string
  ) => ChoiceOption[]
  flattenQuestions: (schema: SurveySchema) => QuestionElement[]
  getQuestionReferenceLabel: (
    question: QuestionElement,
    schema: SurveySchema
  ) => string
  getEditorSection: (schema: SurveySchema) => Section | undefined
  isChoiceQuestionType: (type: QuestionType) => boolean
  isMatrixQuestionType: (type: QuestionType) => boolean
  isTextInputQuestionType: (type: QuestionType) => boolean
  hasInspectorConfigSection: (type: QuestionType) => boolean
  getInspectorSectionTitle: (type: QuestionType) => string
  inspectorSectionDefaultOpen: (type: QuestionType) => boolean
  getQuestionTypeLabel: (type: QuestionType) => string
  getQuestionTypeHint: (type: any) => string
  hasQuestionTypePreview: (type: any) => boolean
  matchesPaletteSearch: (
    item: { type: any; label: string; category: string },
    query: string
  ) => boolean
  cascaderNodesToOptions: (nodes: CascaderNode[]) => any[]
  createCascaderNode: (label: string) => CascaderNode
  addCascaderChild: (
    nodes: CascaderNode[],
    id: string,
    child: CascaderNode
  ) => CascaderNode[]
  removeCascaderNode: (nodes: CascaderNode[], id: string) => CascaderNode[]
  updateCascaderNode: (
    nodes: CascaderNode[],
    id: string,
    patch: Partial<Pick<CascaderNode, 'label'>>
  ) => CascaderNode[]
  DEFAULT_OTHER_PLACEHOLDER: string
  DEFAULT_META: SurveySchema['meta']
  DEFAULT_SUBMISSION: SurveySchema['submission']
  questionNumberColumn: string
  SURVEY_NUMBERING_OPTIONS: Array<{
    value: string
    label: string
    sample: string
  }>
  SURVEY_NUMBERING_MODE_OPTIONS: Array<{
    value: QuestionNumberingMode
    label: string
    hint: string
  }>
  isSurveyNumberingEnabled: (style: SurveyDefaultNumberingStyle) => boolean
  isQuestionNumberVisible: (
    question: QuestionElement,
    style: SurveyDefaultNumberingStyle
  ) => boolean
  getQuestionNumberLabel: (
    ordinal: number,
    style: SurveyDefaultNumberingStyle
  ) => string | null
  getQuestionNumberTextClass: (style: SurveyDefaultNumberingStyle) => string
  layout: {
    questionBlockContentCol: string
    questionBlockGrid: string
    questionBlockGridRequiredOnly: string
    questionBlockStack: string
    questionNumberColumn: string
    questionOptionsWrap: string
    questionHeaderLineHeight: string
    questionPrefixCluster: string
    questionTitleText: string
  }

  // UI 代理组件 (重定向自 surveys/shared/)
  QuestionRequiredMark: ComponentType<{
    required: boolean
    mode?: 'builder' | 'fill'
    onToggle?: () => void
  }>
  QuestionTypePreview: ComponentType<{ type: any }>
  SurveyCoverHeader: ComponentType<{
    meta: any
    theme: any
    className?: string
    titleSlot?: React.ReactNode
    descriptionSlot?: React.ReactNode
  }>

  // 逻辑与规则 (重定向自 core/logic)
  setBuilderMode: (mode: BuilderMode) => void
  getRulesForQuestion: (rules: Rule[], questionId: string) => Rule[]
  ruleReferencesQuestionAsSource: (rule: Rule, questionId: string) => boolean
  summarizeRuleAction: (action: RuleAction, targetLabel?: string) => string
  createRuleAction: (
    type: RuleActionType,
    targetQuestionId?: string
  ) => RuleAction
  serializeCondition: (cond: any) => string
  serializeConditionGroup: (group: ConditionGroup) => string
  tryParseSimpleCondition: (str: string) => ConditionGroup | null
  getOperatorsForQuestionType: (type: any) => any[]
  supportsVisualCondition: (type: any) => boolean
  extractQuestionRefsFromWhen: (when: string) => string[]
  getQuestionManifest: (type: QuestionType) => any
  QUESTION_CATEGORIES: readonly string[]
  QUESTION_MANIFESTS: any[]
  LAYOUT_MANIFESTS: any[]
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
    addDisplayRule,
    addSkipRule,
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
      addDisplayRule: s.addDisplayRule,
      addSkipRule: s.addSkipRule,
      updateRule: s.updateRule,
      removeRule: s.removeRule,
      setBuilderMode: s.setBuilderMode,
    }))
  )

  const section = useMemo(
    () => (schema ? getEditorSection(schema) : undefined),
    [schema]
  )
  const elements = section?.elements ?? []
  const sectionId = section?.id ?? selectedSectionId

  // 计算一个结构骨架字符串，只有结构、类型、单个显隐设置以及全局题号配置变更时，骨架字符串才变
  const skeleton = useBuilderStore((s) => {
    if (!s.schema) return ''
    const elementsStr = s.schema.sections
      .map((sec) =>
        sec.elements
          .map((el) => {
            if (el.kind === 'question') {
              return `${el.id}-${el.type}-${el.numbering?.show ?? 'true'}`
            }
            return `${el.id}-${el.kind}`
          })
          .join(',')
      )
      .join(';')
    const defaultNumbering = s.schema.meta.defaultQuestionNumbering ?? 'decimal'
    const numberingMode = s.schema.meta.questionNumberingMode ?? 'global'
    return `${elementsStr}|${defaultNumbering}|${numberingMode}`
  })

  // 仅在结构骨架变化时重算 numbering 映射表
  const numbering = useMemo(() => {
    const currentSchema = useBuilderStore.getState().schema
    if (!currentSchema) return null
    return {
      globalOrdinalMap: buildQuestionOrdinalMap(currentSchema),
      displayOrdinalMap: buildQuestionDisplayOrdinalMap(currentSchema),
      surveyDefaultNumbering: getSurveyDefaultNumberingStyle(currentSchema),
      numberingMode: getQuestionNumberingMode(currentSchema),
    }
  }, [skeleton])

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
      addDisplayRule,
      addSkipRule,
      updateRule,
      removeRule,
      setBuilderMode,

      // core / shared helpers
      createQuestionId,
      DEFAULT_OTHER_LABEL,
      isOtherOption,
      partitionChoiceOptions,
      syncOtherChoiceOption,
      flattenQuestions,
      getQuestionReferenceLabel,
      getEditorSection,
      isChoiceQuestionType,
      isMatrixQuestionType,
      isTextInputQuestionType,
      hasInspectorConfigSection,
      getInspectorSectionTitle,
      inspectorSectionDefaultOpen,
      getQuestionTypeLabel,
      getQuestionTypeHint,
      hasQuestionTypePreview,
      matchesPaletteSearch,
      cascaderNodesToOptions,
      createCascaderNode,
      addCascaderChild,
      removeCascaderNode,
      updateCascaderNode,
      DEFAULT_OTHER_PLACEHOLDER,
      DEFAULT_META,
      DEFAULT_SUBMISSION,
      questionNumberColumn,
      SURVEY_NUMBERING_OPTIONS,
      SURVEY_NUMBERING_MODE_OPTIONS,

      isSurveyNumberingEnabled,
      isQuestionNumberVisible,
      getQuestionNumberLabel,
      getQuestionNumberTextClass,
      layout: {
        questionBlockContentCol,
        questionBlockGrid,
        questionBlockGridRequiredOnly,
        questionBlockStack,
        questionNumberColumn,
        questionOptionsWrap,
        questionHeaderLineHeight,
        questionPrefixCluster,
        questionTitleText,
      },

      // UI Components
      QuestionRequiredMark,
      QuestionTypePreview,
      SurveyCoverHeader,

      // logic helpers
      getRulesForQuestion,
      ruleReferencesQuestionAsSource,
      summarizeRuleAction,
      createRuleAction,
      serializeCondition,
      serializeConditionGroup,
      tryParseSimpleCondition,
      getOperatorsForQuestionType,
      supportsVisualCondition,
      extractQuestionRefsFromWhen,
      getQuestionManifest,
      QUESTION_CATEGORIES,
      QUESTION_MANIFESTS,
      LAYOUT_MANIFESTS,
    }
  }, [
    // Zustand actions 引用天然稳定，可放入依赖数组
    select, updateQuestion, updateQuestionConfig, updateHtmlBlock,
    removeElement, duplicateElement, addQuestion, addLayout,
    updateMeta, updateTheme, updateSubmission,
    setInspectorTab, setEditingRuleId,
    addRule, addDisplayRule, addSkipRule, updateRule, removeRule,
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

  return React.createElement(
    BuilderStaticContext.Provider,
    { value: staticContextValue },
    React.createElement(
      BuilderStructureContext.Provider,
      { value: structureContextValue },
      React.createElement(
        BuilderActiveStateContext.Provider,
        { value: activeStateContextValue },
        children
      )
    )
  )
}
