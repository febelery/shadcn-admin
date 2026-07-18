import type { Section, SurveyDocument } from './types'

/** 当前文档契约只允许一个编辑页面。 */
export function getEditorSection(document: SurveyDocument): Section {
  return document.sections[0]
}

export function getEditorSectionId(document: SurveyDocument): string {
  return document.sections[0].id
}
