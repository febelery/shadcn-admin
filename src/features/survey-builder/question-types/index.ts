import type React from 'react'
import type { QuestionNode } from '../types'
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
import { richTextType } from './rich-text'
import { signatureType } from './signature'
import { singleChoiceType } from './single-choice'
import { textType } from './text'
import { textareaType } from './textarea'

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
  features?: {
    hasTitle?: boolean // 是否展示标题块
    hasRequired?: boolean // 是否支持必填项设置
    hasValidation?: boolean // 是否支持校验规则
  }

  create: () => any
  configPanel: any
  preview: any
  editor?: React.ComponentType<{ node: QuestionNode }>

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
 * 全量题型注册表
 */
const QUESTION_REGISTRY: Record<string, QuestionTypeDefinition> = {
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

  // 布局 (布局类题型逐步纳入)
  divider: {
    ...dividerType,
    features: { hasTitle: false, hasRequired: false, hasValidation: false },
  },
  rich_text: {
    ...richTextType,
    features: { hasTitle: true, hasRequired: false, hasValidation: false },
  },
  file_upload: fileUploadType,
  signature: signatureType,
}

/**
 * 获取题型定义
 */
export function getQuestion(type: string) {
  return QUESTION_REGISTRY[type] || null
}

/**
 * 获取所有题型定义
 */
export function getAllQuestions() {
  return Object.values(QUESTION_REGISTRY)
}
