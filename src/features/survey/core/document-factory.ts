import { SURVEY_DOCUMENT_SCHEMA_VERSION } from './document-version'
import type { SurveyDocument } from './types'

const DEFAULT_THEME = {
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

export function createEmptySurvey(title = '未命名问卷'): SurveyDocument {
  return {
    id: crypto.randomUUID(),
    schemaVersion: SURVEY_DOCUMENT_SCHEMA_VERSION,
    revision: 0,
    status: 'draft',
    meta: { ...DEFAULT_META, title },
    theme: { ...DEFAULT_THEME },
    elements: [],
    rules: [],
    submissionPolicy: {},
  }
}
