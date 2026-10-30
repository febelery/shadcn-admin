import { z } from 'zod'

/** 条款数量上限；闸门不是条款库 */
export const CONSENT_CLAUSE_LIMIT = 5

/** 阅读计时上限（秒） */
export const CONSENT_READ_SECONDS_LIMIT = 600

/** 开启协议时的默认计时；象征性存在，作者自行调整 */
export const CONSENT_DEFAULT_READ_SECONDS = 3

export const CONSENT_DEFAULT_CHECKBOX_LABEL = '我已阅读并同意上述条款'

/** 低于该秒数不构成实际阅读门槛，用于发布提醒 */
export const CONSENT_TOKEN_READ_SECONDS = 5

/** 中文慢读速度，用于「计时是否读得完」的估算 */
export const CONSENT_READ_CHARS_PER_SECOND = 3

/** 正文短于此长度时，滚动到底几乎不可能拦住人 */
export const CONSENT_SCROLL_MEANINGFUL_CHARS = 200

const CONSENT_CLAUSE_TITLE_LIMIT = 60
const CONSENT_CLAUSE_CONTENT_LIMIT = 20000
const CONSENT_DENY_MESSAGE_LIMIT = 200

const consentClauseSchema = z
  .object({
    id: z.string().min(1),
    title: z
      .string()
      .trim()
      .min(1, '请填写条款名称')
      .max(CONSENT_CLAUSE_TITLE_LIMIT),
    content: z.string().max(CONSENT_CLAUSE_CONTENT_LIMIT),
    optional: z.literal(true).optional(),
  })
  .strict()
  .superRefine((clause, context) => {
    if (getConsentTextLength(clause.content) === 0) {
      context.addIssue({
        code: 'custom',
        path: ['content'],
        message: '条款正文不能为空',
      })
    }
  })

export const consentPolicySchema = z
  .object({
    clauses: z
      .array(consentClauseSchema)
      .min(1, '协议至少需要一条条款')
      .max(CONSENT_CLAUSE_LIMIT),
    minReadSeconds: z
      .number()
      .int()
      .min(1)
      .max(CONSENT_READ_SECONDS_LIMIT)
      .optional(),
    requireScrollToEnd: z.literal(true).optional(),
    checkboxLabel: z
      .string()
      .trim()
      .min(1)
      .max(CONSENT_CLAUSE_TITLE_LIMIT)
      .optional(),
    denyMessage: z
      .string()
      .trim()
      .min(1)
      .max(CONSENT_DENY_MESSAGE_LIMIT)
      .optional(),
  })
  .strict()
  .superRefine((consent, context) => {
    const seen = new Set<string>()
    for (const [index, clause] of consent.clauses.entries()) {
      if (seen.has(clause.id)) {
        context.addIssue({
          code: 'custom',
          path: ['clauses', index, 'id'],
          message: '条款身份重复',
        })
      }
      seen.add(clause.id)
    }
  })

export function getConsentPolicyIssues(input: unknown) {
  const result = consentPolicySchema.safeParse(input)
  if (result.success) return []
  return result.error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }))
}

export function createConsentClause(index: number) {
  return {
    id: crypto.randomUUID(),
    title: index === 0 ? '隐私政策' : `条款 ${index + 1}`,
    content: '',
  }
}

export function createDefaultConsent() {
  return {
    clauses: [createConsentClause(0)],
    minReadSeconds: CONSENT_DEFAULT_READ_SECONDS,
  }
}

/** `optional` 字段存在即可跳过勾选；缺省必须同意 */
export function consentClauseRequiresAgreement(clause: { optional?: true }) {
  return clause.optional !== true
}

/** 与编辑器字数口径一致：剥离 HTML 标签与空白实体后计数 */
export function getConsentTextLength(content: string): number {
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim().length
}

/** 按最长的一条条款估算慢读秒数；计时逐条独立生效 */
export function estimateConsentReadSeconds(consent?: {
  clauses: Array<{ content: string }>
}): number {
  if (!consent || consent.clauses.length === 0) return 0
  const longest = Math.max(
    ...consent.clauses.map((clause) => getConsentTextLength(clause.content))
  )
  return Math.ceil(longest / CONSENT_READ_CHARS_PER_SECOND)
}

/** 全部条款都短到不需要滚动时，「滚动到底」是恒真条件 */
export function isScrollGateVacuous(consent: {
  requireScrollToEnd?: true
  clauses: Array<{ content: string }>
}): boolean {
  return (
    consent.requireScrollToEnd === true &&
    consent.clauses.every(
      (clause) =>
        getConsentTextLength(clause.content) <= CONSENT_SCROLL_MEANINGFUL_CHARS
    )
  )
}
