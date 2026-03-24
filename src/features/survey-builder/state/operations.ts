import { type SurveySchema, type SurveyMeta, type QuestionNode } from '../types'

export const ORDER_GAP = 10_000

export const DEFAULT_META: SurveyMeta = {
  title: '未命名问卷',
  description: '',
  coverType: 'color',
  coverColor: 'hsl(0 0% 9%)',
  cover: undefined,
  fontColor: '#ffffff',
  mode: 'scroll',
  status: 'draft',
  cardConfig: { transition: 'slide', progressType: 'dots', allowBack: true },
  submitLabel: '提交',
  endTitle: '感谢您的参与！',
  endDescription: '您的回答已成功提交。',
  submissionRules: {
    dailyLimit: { enabled: false, limit: 1, identifyBy: 'ip' },
    quota: { enabled: false, total: 1000, onExceed: 'close' },
    timeWindow: { enabled: false, onExpire: 'show_closed' },
    ipDedup: { enabled: false, limit: 1, onExceed: 'reject' },
    login: { enabled: false, method: 'system', oncePerAccount: true },
  },
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function createEmptySurvey(title = '未命名问卷'): SurveySchema {
  return {
    id: crypto.randomUUID(),
    version: '1',
    meta: {
      ...DEFAULT_META,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    nodes: [],
    flow: [],
    validations: [],
    extensions: {},
  }
}

/**
 * 克隆问题节点并重新生成 ID
 * 明确限制在 QuestionNode 类型，避免盲目替换所有 id
 */
export const cloneQuestionNode = (node: QuestionNode): QuestionNode => {
  const newNode = JSON.parse(JSON.stringify(node)) as QuestionNode
  newNode.id = crypto.randomUUID()
  if (newNode.config.options) {
    newNode.config.options.forEach((opt) => (opt.id = crypto.randomUUID()))
  }
  return newNode
}

/**
 * 计算新节点排序值
 */
export function calculateNewOrder(
  nodes: QuestionNode[],
  options?: { afterId?: string | null; atTop?: boolean }
): number {
  const sorted = [...nodes].sort((a, b) => a.order - b.order)
  const maxOrder = sorted.length > 0 ? sorted[sorted.length - 1].order : 0

  if (options?.atTop) {
    const first = sorted[0]
    return first ? first.order / 2 : ORDER_GAP
  }

  if (options?.afterId) {
    const idx = sorted.findIndex((n) => n.id === options.afterId)
    if (idx !== -1) {
      const current = sorted[idx]
      const next = sorted[idx + 1]
      return next ? (current.order + next.order) / 2 : current.order + ORDER_GAP
    }
  }

  return maxOrder + ORDER_GAP
}
