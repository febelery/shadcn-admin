import type { ConditionOperator } from './operators'
import { OPERATOR_TO_EXPR } from './operators'

export type ConditionSource = 'q' | 'var'

export interface Condition {
  source: ConditionSource
  ref: string
  operator: ConditionOperator
  value?: string
}

export interface ConditionGroup {
  logic: 'and' | 'or'
  items: Condition[]
}

function escapeStringValue(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function refToken(source: ConditionSource, ref: string): string {
  return `{${source}.${ref}}`
}

/** 单条条件 → DSL 片段 */
export function serializeCondition(c: Condition): string {
  const token = refToken(c.source, c.ref)
  const op = OPERATOR_TO_EXPR[c.operator]
  if (c.operator === 'empty' || c.operator === 'not_empty') {
    return `${token} ${op}`
  }
  const raw = c.value ?? ''
  const isNumeric = /^-?\d+(\.\d+)?$/.test(raw.trim())
  const rhs = isNumeric ? raw.trim() : escapeStringValue(raw)
  return `${token} ${op} ${rhs}`
}

/** 条件组 → when 表达式 */
export function serializeConditionGroup(group: ConditionGroup): string {
  if (group.items.length === 0) return ''
  const joiner = group.logic === 'and' ? ' and ' : ' or '
  const parts = group.items.map(serializeCondition)
  if (parts.length === 1) return parts[0]
  return `(${parts.join(joiner)})`
}

const REF_RE = /\{([a-zA-Z_][\w.]*)\}/

/** 从 when 字符串提取引用的题目 ID */
export function extractQuestionRefsFromWhen(when: string): string[] {
  const refs: string[] = []
  const re = /\{q\.([^}]+)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(when)) !== null) {
    refs.push(m[1])
  }
  return refs
}

/** 尝试解析简单单条件表达式（可视化编辑回显） */
export function tryParseSimpleCondition(when: string): ConditionGroup | null {
  const trimmed = when.trim()
  if (!trimmed) return { logic: 'and', items: [] }

  // 单条件：{q.id} op value
  const singleRe =
    /^\{q\.([^}]+)\}\s*(=|!=|>=|<=|>|<|contains|not contains|empty|notEmpty)(?:\s+('(?:\\'|[^'])*'|"[^"]*"|[^\s)]+))?$/
  const m = trimmed.match(singleRe)
  if (m) {
    const [, ref, opRaw, valRaw] = m
    const operator = exprOpToCondition(opRaw)
    if (!operator) return null
    let value: string | undefined
    if (valRaw) {
      value = valRaw.replace(/^['"]|['"]$/g, '').replace(/\\'/g, "'")
    }
    return {
      logic: 'and',
      items: [{ source: 'q', ref, operator, value }],
    }
  }

  return null
}

function exprOpToCondition(op: string): ConditionOperator | null {
  switch (op) {
    case '=':
      return 'eq'
    case '!=':
      return 'neq'
    case '>':
      return 'gt'
    case '>=':
      return 'gte'
    case '<':
      return 'lt'
    case '<=':
      return 'lte'
    case 'contains':
      return 'contains'
    case 'not contains':
      return 'not_contains'
    case 'empty':
      return 'empty'
    case 'notEmpty':
      return 'not_empty'
    default:
      return null
  }
}

/** 解析表达式中的第一个引用（用于 UI 摘要） */
export function firstRefInWhen(when: string): string | null {
  const m = when.match(REF_RE)
  return m ? m[1] : null
}
