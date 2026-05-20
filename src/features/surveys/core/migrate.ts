import { createSection } from './schema-defaults'
import type {
  CascaderNode,
  ChoiceOption,
  QuestionElement,
  QuestionNumbering,
  Section,
  SurveyElement,
  SurveySchema,
} from './types'

/** 编辑器持久化契约版本（与填写端协商） */
export const EDITOR_SCHEMA_VERSION = '3'

export type MigrateMode = 'load' | 'save'

/** 载入时 API 可能仍带旧字段，迁移后不再出现在类型中 */
type LegacyChoiceOption = ChoiceOption & {
  value?: string
  image?: string | null
  mediaUrl?: string | null
  mediaKind?: string
}

type LegacyCascaderNode = CascaderNode & {
  value?: string
}

type LegacyQuestionNumbering = QuestionNumbering & {
  style?: string
  customLabel?: string
  separator?: string
}

/** 已废弃题型：载入时降级为单选题并剥离媒体字段 */
const LEGACY_MEDIA_CHOICE_TYPES = new Set(['image_choice', 'media_choice'])

function cloneSchema(schema: SurveySchema): SurveySchema {
  return JSON.parse(JSON.stringify(schema)) as SurveySchema
}

function stripLegacyChoiceOptionFields(opt: LegacyChoiceOption): void {
  delete opt.value
  delete opt.image
  delete opt.mediaUrl
  delete opt.mediaKind
}

function stripLegacyCascaderNodeFields(node: LegacyCascaderNode): void {
  delete node.value
  for (const child of node.children ?? []) {
    stripLegacyCascaderNodeFields(child as LegacyCascaderNode)
  }
}

function migrateCascaderOptions(nodes: CascaderNode[] | undefined): void {
  for (const node of nodes ?? []) {
    stripLegacyCascaderNodeFields(node as LegacyCascaderNode)
  }
}

function migrateQuestionOptions(options: ChoiceOption[] | undefined): void {
  for (const opt of options ?? []) {
    stripLegacyChoiceOptionFields(opt as LegacyChoiceOption)
  }
}

function migrateQuestion(el: QuestionElement): void {
  if (LEGACY_MEDIA_CHOICE_TYPES.has(el.type as string)) {
    el.type = 'single_choice'
    delete (el.config as { mediaChoiceMultiple?: boolean }).mediaChoiceMultiple
  }

  migrateQuestionOptions(el.config.options)
  migrateCascaderOptions(el.config.cascaderOptions)

  if (el.type === 'dynamic_panel' && el.config.templateElements?.length) {
    walkElements(el.config.templateElements)
  }

  stripQuestionNumbering(el.numbering)
}

function stripQuestionNumbering(numbering?: LegacyQuestionNumbering): void {
  if (!numbering) return
  if (numbering.style === 'none') {
    numbering.show = false
  }
  delete numbering.style
  delete numbering.customLabel
  delete numbering.separator
}

function walkElements(elements: SurveyElement[]): void {
  for (const el of elements) {
    if (el.kind === 'question') {
      migrateQuestion(el)
    } else if (el.kind === 'panel') {
      walkElements(el.elements)
    }
  }
}

/** 编辑器仅支持单页：合并多 section 题目到首 section */
function mergeSectionsForEditor(sections: Section[]): Section[] {
  if (sections.length === 0) {
    return [createSection()]
  }
  if (sections.length === 1) {
    return sections
  }
  const first = sections[0]
  first.elements = sections.flatMap((s) => s.elements)
  return [first]
}

/**
 * 问卷 Schema 迁移（唯一入口）
 * - load：载入编辑器，合并 section、迁移 legacy 字段
 * - save：在 load 基础上剥离 legacy 字段
 */
export function migrateSurveySchema(
  schema: SurveySchema,
  _mode: MigrateMode = 'load'
): SurveySchema {
  const next = cloneSchema(schema)

  next.sections = mergeSectionsForEditor(next.sections)
  next.presentation = { type: 'scroll' }

  for (const section of next.sections) {
    walkElements(section.elements)
  }

  next.version = EDITOR_SCHEMA_VERSION
  return next
}

/** 保存/发布前：剥离 legacy 字段并写入编辑器契约版本 */
export function prepareSurveySchemaForSave(schema: SurveySchema): SurveySchema {
  return migrateSurveySchema(schema, 'save')
}
