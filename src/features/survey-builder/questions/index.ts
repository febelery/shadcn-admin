import type React from 'react'
import type { QuestionNode, NodeValidation } from '../types'
import { dateType } from './date'
import { dateRangeType } from './date-range'
import { dividerType } from './divider'
import { dropdownType } from './dropdown'
import { fileUploadType } from './file-upload'
import { fillInType } from './fill-in'
import { imageChoiceType } from './image-choice'
import { matrixMultipleType } from './matrix-multiple'
import { matrixSingleType } from './matrix-single'
import { multipleChoiceType } from './multiple-choice'
import { npsType } from './nps'
import { numberType } from './number'
import { rankingType } from './ranking'
import { ratingType } from './rating'
import { type NodeType } from './registry-keys'
import { richTextType } from './rich-text'
import { signatureType } from './signature'
import { singleChoiceType } from './single-choice'
import { textType } from './text'
import { textareaType } from './textarea'

/**
 * 题型组件通用 Props
 */
export type QuestionComponentProps = {
  node: QuestionNode
  onConfigChange: (patch: Partial<QuestionNode['config']>) => void
  onNodeChange: (patch: Partial<QuestionNode>) => void
}

/**
 * 最小题型定义 (持续进化版)
 */
export type QuestionTypeDefinition = {
  type: string

  meta: {
    label: string
    description?: string
    icon: any
    category: string
  }

  // 扩展能力控制 (逻辑收敛点)
  features: {
    hasTitle: boolean // 是否展示标题块
    hasRequired: boolean // 是否支持必填项设置
    hasValidation: boolean // 是否支持校验规则
  }

  // 标题渲染模式
  titleMode: 'input' | 'display'

  // 支持的校验规则
  validationTypes: NodeValidation['type'][]

  create: () => any
  configPanel: React.ComponentType<QuestionComponentProps>
  preview: React.ComponentType<{ node: QuestionNode }>
  editor?: React.ComponentType<QuestionComponentProps>

  capabilities?: {
    valueType: 'string' | 'number' | 'array' | 'date' | 'none'
    operators: Array<
      | 'eq'
      | 'neq'
      | 'contains'
      | 'not_contains'
      | 'gt'
      | 'lt'
      | 'gte'
      | 'lte'
      | 'is_empty'
      | 'is_not_empty'
      | 'regex'
    >
  }
}

/**
 * 助手：快速定义题型 (提供默认值)
 */
export function defineQuestion(
  def: Partial<QuestionTypeDefinition> &
    Pick<
      QuestionTypeDefinition,
      'type' | 'meta' | 'create' | 'configPanel' | 'preview'
    >
): QuestionTypeDefinition {
  return {
    ...def,
    features: {
      hasTitle: true,
      hasRequired: true,
      hasValidation: true,
      ...def.features,
    },
    titleMode: def.titleMode ?? 'input',
    validationTypes: def.validationTypes ?? [],
  } as QuestionTypeDefinition
}

/**
 * 全量题型注册表
 */
const QUESTION_REGISTRY = {
  // 核心
  text: textType,
  single_choice: singleChoiceType,
  multiple_choice: multipleChoiceType,
  dropdown: dropdownType,
  ranking: rankingType,
  image_choice: imageChoiceType,
  matrix_single: matrixSingleType,
  matrix_multiple: matrixMultipleType,
  rating: ratingType,
  nps: npsType,
  textarea: textareaType,
  number: numberType,
  fill_in: fillInType,
  date: dateType,
  date_range: dateRangeType,

  // 布局
  divider: dividerType,
  rich_text: richTextType,
  file_upload: fileUploadType,
  signature: signatureType,
} as const satisfies Record<NodeType, QuestionTypeDefinition>

/**
 * 获取题型定义
 */
export function getQuestion(type: string) {
  return (
    (QUESTION_REGISTRY as Record<string, QuestionTypeDefinition>)[type] || null
  )
}

/**
 * 获取所有题型定义
 */
export function getAllQuestions() {
  return Object.values(QUESTION_REGISTRY)
}
