import type { Section, SurveySchema } from './types'

/** 当前文档契约只允许一个编辑页面。 */
export function getEditorSection(schema: SurveySchema): Section {
  return schema.sections[0]
}

export function getEditorSectionId(schema: SurveySchema): string {
  return schema.sections[0].id
}
