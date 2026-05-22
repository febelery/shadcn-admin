import type { ColumnDef } from '@tanstack/react-table'
import { getFilterFn } from '@/lib/data-grid-filters'
import type { QuestionElement, SurveyRecordItem } from '../core/types'

export type SurveyRecordGridRow = SurveyRecordItem

const statusOptions = [
  { label: '已完成', value: 'complete' },
  { label: '填写中', value: 'partial' },
]

export function createRecordGridColumns(
  questions: QuestionElement[]
): ColumnDef<SurveyRecordGridRow>[] {
  const filterFn = getFilterFn<SurveyRecordGridRow>()

  return [
    {
      id: 'respondent',
      accessorKey: 'respondent',
      header: '填写人',
      filterFn,
      enableHiding: false,
      meta: {
        label: '填写人',
        cell: {
          variant: 'short-text',
        },
      },
      minSize: 160,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: '状态',
      filterFn,
      meta: {
        label: '状态',
        cell: {
          variant: 'select',
          options: statusOptions,
        },
      },
      minSize: 110,
    },
    {
      id: 'startedAt',
      accessorFn: (row) => formatDateTime(row.startedAt),
      header: '开始时间',
      filterFn,
      meta: {
        label: '开始时间',
        cell: {
          variant: 'short-text',
        },
      },
      minSize: 180,
    },
    {
      id: 'completedAt',
      accessorFn: (row) =>
        row.completedAt ? formatDateTime(row.completedAt) : '',
      header: '提交时间',
      filterFn,
      meta: {
        label: '提交时间',
        cell: {
          variant: 'short-text',
        },
      },
      minSize: 180,
    },
    {
      id: 'durationMs',
      accessorFn: (row) =>
        row.durationMs ? Math.round(row.durationMs / 1000) : undefined,
      header: '耗时(秒)',
      filterFn,
      meta: {
        label: '耗时(秒)',
        cell: {
          variant: 'number',
          min: 0,
        },
      },
      minSize: 110,
    },
    ...questions.map(
      (question, index): ColumnDef<SurveyRecordGridRow> => ({
        id: `answer_${question.id}`,
        accessorFn: (row) =>
          formatAnswerForGrid(question, row.answers[question.id]),
        header: `${index + 1}. ${question.title}`,
        filterFn,
        meta: {
          label: `${index + 1}. ${question.title}`,
          cell: getQuestionCellMeta(question),
        },
        enableSorting: false,
        minSize: getQuestionColumnSize(question),
      })
    ),
  ]
}

function getQuestionCellMeta(question: QuestionElement) {
  switch (question.type) {
    case 'single_choice':
    case 'dropdown':
      return {
        variant: 'select' as const,
        options: getChoiceOptions(question),
      }
    case 'multiple_choice':
    case 'cascader':
    case 'file_upload':
      return {
        variant: 'multi-select' as const,
        options: getChoiceOptions(question),
      }
    case 'number':
    case 'rating':
    case 'slider':
    case 'nps':
      return {
        variant: 'number' as const,
      }
    case 'url':
      return {
        variant: 'url' as const,
      }
    case 'date':
      return {
        variant: 'date' as const,
      }
    case 'signature':
      return {
        variant: 'checkbox' as const,
      }
    case 'textarea':
    case 'fill_in':
    case 'matrix_single':
    case 'matrix_multiple':
    case 'likert':
    case 'dynamic_panel':
    case 'ranking':
    case 'date_range':
      return {
        variant: 'long-text' as const,
      }
    default:
      return {
        variant: 'short-text' as const,
      }
  }
}

function getQuestionColumnSize(question: QuestionElement) {
  if (
    question.type === 'matrix_single' ||
    question.type === 'matrix_multiple' ||
    question.type === 'likert' ||
    question.type === 'dynamic_panel' ||
    question.type === 'textarea'
  ) {
    return 300
  }

  if (
    question.type === 'multiple_choice' ||
    question.type === 'ranking' ||
    question.type === 'cascader' ||
    question.type === 'file_upload'
  ) {
    return 220
  }

  return 180
}

function getChoiceOptions(question: QuestionElement) {
  const options = question.config.options ?? []
  if (options.length > 0) {
    return options.map((option) => ({
      label: option.label,
      value: option.label,
    }))
  }

  if (question.type === 'cascader') {
    return ['中国大陆', '浙江', '杭州'].map((value) => ({
      label: value,
      value,
    }))
  }

  if (question.type === 'file_upload') {
    return ['营业执照.pdf', '开票资料.png'].map((value) => ({
      label: value,
      value,
    }))
  }

  return []
}

function formatAnswerForGrid(
  question: QuestionElement,
  answer: unknown
): string | string[] | number | boolean {
  if (answer == null) return ''

  if (
    question.type === 'number' ||
    question.type === 'rating' ||
    question.type === 'slider' ||
    question.type === 'nps'
  ) {
    return Number(answer)
  }

  if (question.type === 'signature') {
    return Boolean(answer)
  }

  if (
    question.type === 'multiple_choice' ||
    question.type === 'cascader' ||
    question.type === 'file_upload'
  ) {
    return toStringArray(answer)
  }

  if (question.type === 'ranking') {
    return toStringArray(answer)
      .map((value, index) => `${index + 1}. ${value}`)
      .join(' / ')
  }

  if (question.type === 'date_range' && isRecord(answer)) {
    return `${String(answer.start ?? '')} - ${String(answer.end ?? '')}`
  }

  if (
    question.type === 'matrix_single' ||
    question.type === 'matrix_multiple' ||
    question.type === 'likert'
  ) {
    return Object.entries(answer as Record<string, unknown>)
      .map(([row, value]) => `${row}: ${formatInlineValue(value)}`)
      .join(' | ')
  }

  if (question.type === 'dynamic_panel' && Array.isArray(answer)) {
    return answer
      .map((row, index) => `${index + 1}. ${formatInlineValue(row)}`)
      .join(' | ')
  }

  return formatInlineValue(answer)
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (value == null || value === '') return []
  return [String(value)]
}

function formatInlineValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatInlineValue).join(', ')
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${key}: ${formatInlineValue(nestedValue)}`)
      .join('; ')
  }
  return String(value ?? '')
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
