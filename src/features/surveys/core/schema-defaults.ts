import type {
  SubmissionConfig,
  SurveySchema,
  QuestionElement,
  Section,
} from './types'

/** 填写端主题默认值 — 色值为 #hex，与 ColorPicker 一致 */
export const DEFAULT_THEME = {
  primaryColor: '#000000',
  backgroundColor: '#ffffff',
  borderRadius: '0.625rem',
}

export const DEFAULT_META = {
  title: '未命名问卷',
  description: '',
  coverType: 'color' as const,
  coverColor: '#000000',
  cover: '',
  submitLabel: '提交',
  endTitle: '感谢参与',
  endDescription: '您的回答已记录，感谢您的宝贵时间。',
  defaultQuestionNumbering: 'decimal' as const,
  questionNumberingMode: 'global' as const,
}

export const DEFAULT_SUBMISSION: SubmissionConfig = {
  timeWindow: { enabled: false },
  quota: { enabled: false, total: 1000 },
  rateLimit: { enabled: false },
}

export function createQuestionId() {
  return crypto.randomUUID()
}

export function createSection(overrides?: Partial<Section>): Section {
  return {
    id: createQuestionId(),
    title: '',
    elements: [],
    ...overrides,
  }
}

export function createEmptySurvey(title = '未命名问卷'): SurveySchema {
  return {
    id: createQuestionId(),
    version: '1',
    status: 'draft',
    meta: { ...DEFAULT_META, title },
    presentation: { type: 'scroll' },
    theme: { ...DEFAULT_THEME },
    variables: [],
    sections: [createSection()],
    rules: [],
    validators: [],
    submission: structuredClone(DEFAULT_SUBMISSION),
    extensions: {},
  }
}

function walkSurveyElements(
  elements: SurveySchema['sections'][0]['elements'],
  visitQuestion: (q: QuestionElement) => void
): void {
  for (const el of elements) {
    if (el.kind === 'question') {
      visitQuestion(el)
      if (el.type === 'dynamic_panel' && el.config.templateElements?.length) {
        walkSurveyElements(el.config.templateElements, visitQuestion)
      }
    } else if (el.kind === 'panel') {
      walkSurveyElements(el.elements, visitQuestion)
    }
  }
}

export function countQuestions(schema: SurveySchema): number {
  let n = 0
  for (const s of schema.sections) {
    walkSurveyElements(s.elements, () => {
      n++
    })
  }
  return n
}

export function flattenQuestions(schema: SurveySchema): QuestionElement[] {
  const out: QuestionElement[] = []
  for (const s of schema.sections) {
    walkSurveyElements(s.elements, (q) => out.push(q))
  }
  return out
}
