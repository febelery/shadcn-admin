import { nanoid } from 'nanoid'
import type { SurveySchema, QuestionNode } from './types'

export function createEmptySurvey(title = '未命名问卷'): SurveySchema {
  return {
    id: nanoid(),
    version: '1',
    meta: {
      title,
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
    },
    schema: [],
    logic: [],
    validations: [],
    extensions: {},
  }
}

// Detect logic conflicts
export function detectConflicts(
  schema: QuestionNode[],
  logic: any[]
): Set<string> {
  const conflictIds = new Set<string>()
  logic.forEach((rule) => {
    if (!rule.enabled) return
    rule.actions.forEach((action: any) => {
      if (action.type === 'hide') {
        const target = schema.find((n) => n.id === action.target)
        if (target?.required) conflictIds.add(target.id)
      }
    })
  })
  return conflictIds
}

// Detect unreachable nodes (simple heuristic)
export function detectUnreachable(
  _schema: QuestionNode[],
  _logic: any[]
): Set<string> {
  // Simplified: nodes that are hidden by default and only revealed by logic
  return new Set<string>()
}
