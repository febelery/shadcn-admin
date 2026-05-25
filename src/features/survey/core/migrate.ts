import { sanitizeRulesForSchema } from './logic/rule-utils'
import { createSection } from './schema-defaults'
import type { SurveySchema } from './types'

/** 编辑器持久化契约版本（与填写端协商） */
const EDITOR_SCHEMA_VERSION = '4'

/** 编辑器仅支持单页：合并多 section 题目到首 section */
function mergeSectionsForEditor(schema: SurveySchema): void {
  if (schema.sections.length === 0) {
    schema.sections = [createSection()]
    return
  }
  if (schema.sections.length > 1) {
    const first = schema.sections[0]
    first.elements = schema.sections.flatMap((s) => s.elements)
    schema.sections = [first]
  }
}

/** 问卷 Schema 迁移：合并 section、写入编辑器契约版本并净化规则 */
export function migrateSurveySchema(schema: SurveySchema): SurveySchema {
  const next = JSON.parse(JSON.stringify(schema)) as SurveySchema

  mergeSectionsForEditor(next)
  next.presentation = { type: 'scroll' }
  next.rules = sanitizeRulesForSchema(next)
  next.version = EDITOR_SCHEMA_VERSION

  return next
}

/** 保存/发布前迁移（与载入同一套逻辑） */
export function prepareSurveySchemaForSave(schema: SurveySchema): SurveySchema {
  return migrateSurveySchema(schema)
}
