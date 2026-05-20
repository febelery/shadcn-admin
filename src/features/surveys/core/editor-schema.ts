import type { Section, SurveySchema } from './types'

/**
 * 编辑器单页模型：当前 Builder 仅编辑 sections[0]。
 * 多 section 在 migrate(load) 时已合并；勿在 UI 中遍历 schema.sections。
 */
export function getEditorSection(schema: SurveySchema): Section | undefined {
  return schema.sections[0]
}

export function getEditorSectionId(schema: SurveySchema): string | null {
  return schema.sections[0]?.id ?? null
}
