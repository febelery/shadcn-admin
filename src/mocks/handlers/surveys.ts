import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { sleep } from '@/lib/utils'
import { createEmptySurvey } from '@/features/survey-builder/state/operations'

// 保存问卷详情的内存缓存
const surveyDetailsTable = new Map<string, any>()

faker.seed(20260320)

export const surveys = Array.from({ length: 45 }, () => {
  const statuses = ['draft', 'published', 'archived'] as const
  const modes = ['scroll', 'card'] as const

  return {
    id: `SURVEY-${faker.string.alphanumeric(8).toUpperCase()}`,
    title: faker.lorem.words({ min: 2, max: 5 }),
    description: faker.lorem.paragraph({ min: 1, max: 2 }),
    status: faker.helpers.arrayElement(statuses),
    mode: faker.helpers.arrayElement(modes),
    questionCount: faker.number.int({ min: 2, max: 25 }),
    responseCount: faker.number.int({ min: 0, max: 500 }),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    startTime: faker.helpers.maybe(() => faker.date.recent().toISOString(), {
      probability: 0.8,
    }),
    endTime: faker.helpers.maybe(() => faker.date.future().toISOString(), {
      probability: 0.6,
    }),
  }
})

export const surveysHandlers = [
  http.get('/api/surveys', async ({ request }) => {
    await sleep(300)

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const sortBy = url.searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const mode = url.searchParams.get('mode') || ''

    // Filter
    let filteredSurveys = [...surveys]

    if (search) {
      filteredSurveys = filteredSurveys.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.id.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status) {
      const statusList = status.split(',')
      filteredSurveys = filteredSurveys.filter((s) =>
        statusList.includes(s.status)
      )
    }

    if (mode) {
      const modeList = mode.split(',')
      filteredSurveys = filteredSurveys.filter((s) => modeList.includes(s.mode))
    }

    // Sort
    filteredSurveys.sort((a: any, b: any) => {
      const aValue = a[sortBy] ?? ''
      const bValue = b[sortBy] ?? ''

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Paginate
    const total = filteredSurveys.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedSurveys = filteredSurveys.slice(start, end)

    return HttpResponse.json({
      data: paginatedSurveys,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    })
  }),

  http.post('/api/surveys', async ({ request }) => {
    const data = (await request.json()) as { title: string }
    const id = `SURVEY-${faker.string.alphanumeric(8).toUpperCase()}`
    const newSurvey = {
      id,
      title: data.title,
      description: '',
      status: 'draft',
      mode: 'scroll',
      questionCount: 0,
      responseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startTime: null,
      endTime: null,
    }
    surveys.unshift(newSurvey as any)
    return HttpResponse.json({ id })
  }),

  http.delete('/api/surveys/:id', async ({ params }) => {
    const { id } = params
    const index = surveys.findIndex((s) => s.id === id)
    if (index !== -1) {
      surveys.splice(index, 1)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('/api/surveys/:id/status', async ({ params, request }) => {
    const { id } = params
    const { status } = (await request.json()) as { status: string }
    const survey = surveys.find((s) => s.id === id)
    if (survey) {
      ;(survey as any).status = status
      survey.updatedAt = new Date().toISOString()

      // 同步更新详情缓存
      const detail = surveyDetailsTable.get(id as string)
      if (detail) {
        detail.meta.status = status
        detail.meta.updatedAt = survey.updatedAt
      }
    }
    return new HttpResponse(null, { status: 204 })
  }),

  /**
   * 获取问卷详情 (SurveyBuilder 使用)
   */
  http.get('/api/surveys/:id', async ({ params }) => {
    await sleep(200)
    const { id } = params as { id: string }

    // 优先从详情缓存取
    if (surveyDetailsTable.has(id)) {
      return HttpResponse.json(surveyDetailsTable.get(id))
    }

    // 找不到则从列表找基础信息，并生成一个空 Schema
    const base = surveys.find((s) => s.id === id)
    const newDetail = createEmptySurvey(base?.title || '未命名问卷')
    newDetail.id = id
    if (base) {
      newDetail.meta.status = base.status as any
      newDetail.meta.description = base.description
    }

    surveyDetailsTable.set(id, newDetail)
    return HttpResponse.json(newDetail)
  }),

  /**
   * 更新问卷 Schema
   */
  http.put('/api/surveys/:id', async ({ params, request }) => {
    await sleep(300)
    const { id } = params as { id: string }
    const data = (await request.json()) as any

    surveyDetailsTable.set(id, data)

    // 同步更新列表中的基础信息
    const index = surveys.findIndex((s) => s.id === id)
    if (index !== -1) {
      surveys[index].title = data.meta.title
      surveys[index].description = data.meta.description
      surveys[index].status = data.meta.status
      surveys[index].updatedAt = new Date().toISOString()
    }

    return new HttpResponse(null, { status: 204 })
  }),
]
