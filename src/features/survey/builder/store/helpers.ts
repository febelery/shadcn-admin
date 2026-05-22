import { createQuestionId } from '../../core/schema-defaults'
import { cloneCascaderNodes } from '../../shared/cascader-adapters'
import type { SurveySchema, SurveyElement } from '../types'

export function findSection(schema: SurveySchema, sectionId: string) {
  return schema.sections.find((s) => s.id === sectionId)
}

export function remapIds<T extends { id: string }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, id: createQuestionId() }))
}

/** 复制题目/布局块 — JSON 深拷贝（兼容 Immer draft），并换新 id */
export function cloneElement(el: SurveyElement): SurveyElement {
  const cloned = JSON.parse(JSON.stringify(el)) as SurveyElement
  cloned.id = createQuestionId()

  if (cloned.kind === 'question') {
    const cfg = cloned.config
    if (cfg.options) cfg.options = remapIds(cfg.options)
    if (cfg.rows) cfg.rows = remapIds(cfg.rows)
    if (cfg.columns) cfg.columns = remapIds(cfg.columns)
    if (cfg.statements) cfg.statements = remapIds(cfg.statements)
    if (cfg.cascaderOptions)
      cfg.cascaderOptions = cloneCascaderNodes(cfg.cascaderOptions)
    if (cfg.templateElements) {
      cfg.templateElements = cfg.templateElements.map(cloneElement)
    }
  }

  if (cloned.kind === 'panel') {
    cloned.elements = cloned.elements.map(cloneElement)
  }

  return cloned
}

export function collectQuestionIdsFromElement(el: SurveyElement): string[] {
  if (el.kind === 'question') {
    const nested = el.config.templateElements?.flatMap((item) =>
      collectQuestionIdsFromElement(item)
    )
    return [el.id, ...(nested ?? [])]
  }
  if (el.kind === 'panel') {
    return el.elements.flatMap((item) => collectQuestionIdsFromElement(item))
  }
  return []
}

export function insertAt<T>(arr: T[], item: T, index?: number) {
  if (index === undefined || index < 0 || index > arr.length) {
    arr.push(item)
  } else {
    arr.splice(index, 0, item)
  }
}
