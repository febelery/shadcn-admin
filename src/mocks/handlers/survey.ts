import {
  createAllTypesDemoSurvey,
  DEMO_SURVEY_ID,
} from '@/mocks/fixtures/survey-all-types-demo'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import * as XLSX from 'xlsx'
import {
  matchFilterValue,
  parseQueryFilterParam,
} from '@/lib/data-grid-filters'
import { sleep } from '@/lib/utils'
import {
  countQuestions,
  createEmptySurvey,
  flattenQuestions,
} from '@/features/survey/core/schema-defaults'
import type {
  QuestionElement,
  SurveyListItem,
  SurveyRecordItem,
  SurveySchema,
} from '@/features/survey/core/types'

faker.seed(42)

const detailMap = new Map<string, SurveySchema>()
const listItems: SurveyListItem[] = []
const recordMap = new Map<string, SurveyRecordItem[]>()
const pinnedSurveyIds = new Set<string>([DEMO_SURVEY_ID])

function compareSurveyListItems(a: SurveyListItem, b: SurveyListItem) {
  const aPinned = pinnedSurveyIds.has(a.id)
  const bPinned = pinnedSurveyIds.has(b.id)
  if (aPinned !== bPinned) return aPinned ? -1 : 1

  const aArchived = a.status === 'archived'
  const bArchived = b.status === 'archived'
  if (aArchived !== bArchived) return aArchived ? 1 : -1

  const updatedDiff = Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  if (updatedDiff !== 0) return updatedDiff

  return Date.parse(b.createdAt) - Date.parse(a.createdAt)
}

function syncListFromDetail(schema: SurveySchema) {
  const idx = listItems.findIndex((s) => s.id === schema.id)
  const item: SurveyListItem = {
    id: schema.id,
    title: schema.meta.title,
    description: schema.meta.description,
    status: schema.status,
    questionCount: countQuestions(schema),
    recordCount:
      recordMap.get(schema.id)?.length ??
      faker.number.int({ min: 0, max: 200 }),
    createdAt: listItems[idx]?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slug: schema.slug,
  }
  if (idx >= 0) listItems[idx] = item
  else listItems.unshift(item)
}

function seedRecord(surveyId: string, schema: SurveySchema) {
  if (recordMap.has(surveyId)) return
  const questions = flattenQuestions(schema)
  const recordCount = surveyId === DEMO_SURVEY_ID ? 225 : 25
  const rows: SurveyRecordItem[] = Array.from(
    { length: recordCount },
    (_, index) => {
      const answers: Record<string, unknown> = {}
      for (const question of questions) {
        answers[question.id] = buildSampleAnswer(question, index)
      }
      const completed = new Date(Date.now() - index * 24 * 60 * 60 * 1000)
      const durationMs = faker.number.int({ min: 90, max: 720 }) * 1000
      const started = new Date(completed.getTime() - durationMs)
      return {
        id: faker.string.uuid(),
        surveyId,
        respondent: faker.person.fullName(),
        status: index % 8 === 7 ? ('partial' as const) : ('complete' as const),
        answers,
        startedAt: started.toISOString(),
        completedAt: index % 8 === 7 ? undefined : completed.toISOString(),
        durationMs: index % 8 === 7 ? undefined : durationMs,
      }
    }
  )
  recordMap.set(surveyId, rows)
}

function buildSampleAnswer(question: QuestionElement, seed: number): unknown {
  const options = question.config.options ?? []
  const rows = question.config.rows ?? []
  const columns = question.config.columns ?? []
  const statements = question.config.statements ?? []
  const pseudoAge = 18 + (seed % 48)

  switch (question.type) {
    case 'single_choice':
    case 'dropdown':
      return (
        options[(seed + question.title.length) % options.length]?.label ??
        '已选择'
      )
    case 'multiple_choice':
      return options
        .filter((_, index) => (seed + index) % 2 === 0)
        .slice(0, Math.min(3, options.length))
        .map((option) => option.label)
    case 'ranking':
      return [...options]
        .sort((a, b) =>
          seed % 2 === 0
            ? a.label.localeCompare(b.label)
            : b.label.localeCompare(a.label)
        )
        .map((option) => option.label)
    case 'matrix_single':
      return Object.fromEntries(
        rows.map((row, rowIndex) => [
          row.label,
          columns[(seed + rowIndex) % columns.length]?.label ?? '选项',
        ])
      )
    case 'matrix_multiple':
      return Object.fromEntries(
        rows.map((row, rowIndex) => {
          const first =
            columns[(seed + rowIndex) % columns.length]?.label ?? '选项 A'
          const second =
            columns[(seed + rowIndex + 1) % columns.length]?.label ?? '选项 B'
          return [row.label, [first, second]]
        })
      )
    case 'cascader':
      return ['中国大陆', '浙江', '杭州']
    case 'text':
      return `样本回答 ${seed + 1}`
    case 'textarea':
      return '这是一段较长的反馈，用来观察填写记录列表里的文本截断和换行。'
    case 'number':
      if (question.title.includes('年龄')) {
        return pseudoAge
      }
      if (question.title.includes('连住')) {
        return 1 + (seed % 6)
      }
      return 1 + (seed % 20)
    case 'email':
      return `guest${seed + 1}@example.com`
    case 'phone':
      return `1380000${String(100 + seed).slice(-4)}`
    case 'url':
      return 'https://example.com/review'
    case 'date':
      return new Date(Date.now() - seed * 86400000).toISOString().slice(0, 10)
    case 'date_range':
      return {
        start: '2026-05-01',
        end: '2026-05-03',
      }
    case 'fill_in':
      return '房号 1206，楼层 12'
    case 'rating':
      return 3 + ((seed + (pseudoAge > 35 ? 1 : 0)) % 3)
    case 'slider':
      return pseudoAge > 35 ? 60 + (seed % 20) : 30 + (seed % 20)
    case 'nps':
      return pseudoAge > 35 ? 7 + (seed % 4) : 4 + (seed % 4)
    case 'likert':
      return Object.fromEntries(
        statements.map((statement, statementIndex) => [
          statement.label,
          3 + ((seed + statementIndex) % 3),
        ])
      )
    case 'dynamic_panel':
      return Array.from({ length: 2 }, (_, itemIndex) =>
        Object.fromEntries(
          (question.config.templateElements ?? [])
            .filter(
              (element): element is QuestionElement =>
                element.kind === 'question'
            )
            .map((nestedQuestion, nestedIndex) => [
              nestedQuestion.title,
              buildSampleAnswer(
                nestedQuestion,
                seed + itemIndex + nestedIndex + 1
              ),
            ])
        )
      )
    case 'file_upload':
      return ['营业执照.pdf', '开票资料.png']
    case 'signature':
      return true
    default:
      return '示例回答'
  }
}

// 置顶全题型演示问卷，便于从列表进入编辑页测试
const demoSurvey = createAllTypesDemoSurvey()
detailMap.set(DEMO_SURVEY_ID, demoSurvey)
seedRecord(demoSurvey.id, demoSurvey)
syncListFromDetail(demoSurvey)

// seed list
for (let i = 0; i < 20; i++) {
  const schema = createEmptySurvey(faker.lorem.words(3))
  schema.status = faker.helpers.arrayElement(['draft', 'published', 'archived'])
  if (schema.status === 'published') {
    schema.slug = faker.lorem.slug()
    schema.publishedAt = faker.date.recent().toISOString()
  }
  detailMap.set(schema.id, schema)
  seedRecord(schema.id, schema)
  syncListFromDetail(schema)
}

function sortRecords(
  records: SurveyRecordItem[],
  sortBy: string,
  sortOrder: string
) {
  return [...records].sort((a, b) => {
    const aVal = a[sortBy as keyof SurveyRecordItem]
    const bVal = b[sortBy as keyof SurveyRecordItem]
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return sortOrder === 'asc' ? -1 : 1
    if (bVal == null) return sortOrder === 'asc' ? 1 : -1
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
}

export const surveyHandlers = [
  http.get('/api/survey', async ({ request }) => {
    await sleep(200)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('pageSize') || 10)
    const sortBy = url.searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const titleFilter = parseQueryFilterParam(url.searchParams.get('title'))
    const statusFilter = parseQueryFilterParam(url.searchParams.get('status'))

    let filtered = [...listItems]
    if (titleFilter) {
      filtered = filtered.filter(
        (s) =>
          matchFilterValue(s.title, titleFilter) ||
          matchFilterValue(s.id, titleFilter)
      )
    }
    if (statusFilter) {
      filtered = filtered.filter((s) =>
        matchFilterValue(s.status, statusFilter)
      )
    }

    if (sortBy === 'updatedAt' && sortOrder === 'desc') {
      filtered.sort(compareSurveyListItems)
    } else {
      filtered.sort((a, b) => {
        const aVal = a[sortBy as keyof SurveyListItem]
        const bVal = b[sortBy as keyof SurveyListItem]
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sortOrder === 'asc' ? -1 : 1
        if (bVal == null) return sortOrder === 'asc' ? 1 : -1
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const data = filtered.slice(start, start + pageSize)
    return HttpResponse.json({
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  }),

  http.post('/api/survey', async ({ request }) => {
    await sleep(150)
    const body = (await request.json()) as { title?: string }
    const schema = createEmptySurvey(body.title || '未命名问卷')
    detailMap.set(schema.id, schema)
    recordMap.set(schema.id, [])
    syncListFromDetail(schema)
    return HttpResponse.json({ id: schema.id })
  }),

  http.get('/api/survey/:id', async ({ params }) => {
    await sleep(150)
    const id = params.id as string
    let schema = detailMap.get(id)
    if (!schema) {
      // 未知 ID：返回全题型演示副本，便于直接打开编辑 URL 测试
      schema = createAllTypesDemoSurvey()
      schema.id = id
      detailMap.set(id, schema)
      syncListFromDetail(schema)
      seedRecord(id, schema)
    }
    return HttpResponse.json(schema)
  }),

  http.put('/api/survey/:id', async ({ params, request }) => {
    await sleep(200)
    const id = params.id as string
    const data = (await request.json()) as SurveySchema
    data.id = id
    detailMap.set(id, data)
    syncListFromDetail(data)
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/api/survey/:id', async ({ params }) => {
    const id = params.id as string
    detailMap.delete(id)
    recordMap.delete(id)
    const idx = listItems.findIndex((s) => s.id === id)
    if (idx >= 0) listItems.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('/api/survey/:id/status', async ({ params, request }) => {
    const id = params.id as string
    const { status } = (await request.json()) as {
      status: SurveySchema['status']
    }
    const schema = detailMap.get(id)
    if (schema) {
      schema.status = status
      syncListFromDetail(schema)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/survey/:id/publish', async ({ params }) => {
    const id = params.id as string
    const schema = detailMap.get(id)
    if (!schema) return new HttpResponse(null, { status: 404 })
    schema.status = 'published'
    schema.version = String(Number(schema.version) + 1)
    schema.slug = schema.slug || faker.lorem.slug()
    schema.publishedAt = new Date().toISOString()
    syncListFromDetail(schema)
    return HttpResponse.json({
      slug: schema.slug,
      version: schema.version,
      publishedAt: schema.publishedAt,
    })
  }),

  http.get('/api/survey/:id/record', async ({ params, request }) => {
    await sleep(150)
    const id = params.id as string
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('pageSize') || 10)
    const sortBy = url.searchParams.get('sortBy') || 'startedAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'
    const all = sortRecords(recordMap.get(id) ?? [], sortBy, sortOrder)
    const start = (page - 1) * pageSize
    const data = all.slice(start, start + pageSize)
    return HttpResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total: all.length,
        totalPages: Math.ceil(all.length / pageSize),
      },
    })
  }),

  http.get('/api/survey/:id/record/export', async ({ params }) => {
    const id = params.id as string
    const schema = detailMap.get(id)
    const records = recordMap.get(id) ?? []
    const questions = schema ? flattenQuestions(schema) : []
    const headers = [
      'record_id',
      'status',
      'started_at',
      ...questions.map((q) => q.title),
    ]
    const rows = records.map((r) => [
      r.id,
      r.status,
      r.startedAt,
      ...questions.map((q) => {
        const v = r.answers[q.id]
        if (v == null) return ''
        return typeof v === 'object' ? JSON.stringify(v) : String(v)
      }),
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Records')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    return new HttpResponse(buf, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="survey-${id}.xlsx"`,
      },
    })
  }),
]
