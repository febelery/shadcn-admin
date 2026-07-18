import type { SurveyElement } from '../../core/types'
import { cloneCascaderNodes } from '../../shared/cascader-adapters'

export function remapIds<T extends { id: string }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, id: crypto.randomUUID() }))
}

/** 复制题目或布局块，并为其中所有文档实体分配新 ID。 */
export function cloneElement(element: SurveyElement): SurveyElement {
  const cloned = structuredClone(element)
  cloned.id = crypto.randomUUID()

  if (cloned.kind === 'question') {
    const cfg = cloned.config
    if (cfg.options) cfg.options = remapIds(cfg.options)
    if (cfg.rows) cfg.rows = remapIds(cfg.rows)
    if (cfg.columns) cfg.columns = remapIds(cfg.columns)
    if (cfg.statements) cfg.statements = remapIds(cfg.statements)
    if (cfg.cascaderOptions)
      cfg.cascaderOptions = cloneCascaderNodes(cfg.cascaderOptions)
  }

  return cloned
}

export function collectQuestionIdsFromElement(
  element: SurveyElement
): string[] {
  return element.kind === 'question' ? [element.id] : []
}

export function insertAt<T>(items: T[], item: T, index?: number) {
  if (index === undefined || index < 0 || index > items.length) {
    items.push(item)
  } else {
    items.splice(index, 0, item)
  }
}
