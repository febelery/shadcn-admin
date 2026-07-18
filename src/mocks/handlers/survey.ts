import {
  createAllTypesDemoSurvey,
  DEMO_SURVEY_ID,
} from '@/mocks/fixtures/survey-all-types-demo'
import {
  createSurveyAnalysis,
  createSurveySegmentAnalysis,
  decodeSegmentDefinitions,
  filterSurveyRecords,
} from '@/mocks/survey/analysis'
import { createQuestionAnalysis } from '@/mocks/survey/question-analysis'
import { faker } from '@faker-js/faker'
import ExcelJS from 'exceljs'
import { http, HttpResponse } from 'msw'
import {
  matchFilterValue,
  parseQueryFilterParam,
} from '@/lib/data-grid-filters'
import { sleep } from '@/lib/utils'
import type {
  SurveyListItem,
  SurveyRecordItem,
} from '@/features/survey/core/admin-data-schema'
import { validateQuestionAnswer } from '@/features/survey/core/answer-validation'
import {
  countQuestions,
  flattenQuestions,
} from '@/features/survey/core/document-elements'
import { createEmptySurvey } from '@/features/survey/core/document-factory'
import { parseSurveyDocument } from '@/features/survey/core/document-schema'
import type {
  QuestionElement,
  SurveyDocument,
} from '@/features/survey/core/types'

faker.seed(42)

const detailMap = new Map<string, SurveyDocument>()
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

function updateListItemFromDocument(document: SurveyDocument) {
  const idx = listItems.findIndex((s) => s.id === document.id)
  const item: SurveyListItem = {
    id: document.id,
    title: document.meta.title,
    description: document.meta.description,
    status: document.status,
    questionCount: countQuestions(document),
    recordCount:
      recordMap.get(document.id)?.length ??
      faker.number.int({ min: 0, max: 200 }),
    createdAt: listItems[idx]?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slug: document.slug,
  }
  if (idx >= 0) listItems[idx] = item
  else listItems.unshift(item)
}

function seedSurveyRecords(surveyId: string, document: SurveyDocument) {
  if (recordMap.has(surveyId)) return
  const questions = flattenQuestions(document)
  const recordCount = surveyId === DEMO_SURVEY_ID ? 225 : 25

  // 生成 30 天内的权重分布，模拟周期性的回收活动与波峰波谷
  const weights = Array.from({ length: 30 }, (_, d) => {
    // 基础正弦波动 + 随机噪声
    const base = 15 + 12 * Math.sin(d / 2.2) + 6 * Math.cos(d / 4.5)
    const noise = faker.number.float({ min: 0, max: 8 })
    return Math.max(1, base + noise)
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  // 使用轮盘赌算法为每个记录分配一个 30 天内的偏移天数
  const dayOffsets: number[] = []
  for (let i = 0; i < recordCount; i++) {
    const rand = faker.number.float({ min: 0, max: totalWeight })
    let sum = 0
    let selectedDay = 29
    for (let d = 0; d < 30; d++) {
      sum += weights[d]
      if (rand <= sum) {
        selectedDay = d
        break
      }
    }
    dayOffsets.push(selectedDay)
  }

  // 升序排列，使得 index 较小的记录（即列表靠前的记录）时间较新，且整体时间流顺序平滑
  dayOffsets.sort((a, b) => a - b)

  const rows: SurveyRecordItem[] = Array.from(
    { length: recordCount },
    (_, index) => {
      const answers: Record<string, unknown> = {}
      for (const question of questions) {
        const answer = buildSampleAnswer(question, index)
        const validation = validateQuestionAnswer(question, answer, {
          visible: true,
        })
        if (!validation.valid) {
          throw new Error(
            `Mock answer violates ${question.type} contract: ${JSON.stringify(validation.issues)}`
          )
        }
        answers[question.id] = answer
      }
      const dayOffset = dayOffsets[index]
      const completed = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000)
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

// 简易的伪随机数生成器（根据种子和字符串生成 0-1 之间的确定性浮点数）
function pseudoRandom(seed: number, idStr: string): number {
  let hash = 0
  const combined = idStr + String(seed)
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash)
  }
  const x = Math.sin(hash) * 10000
  return x - Math.floor(x)
}

function findCascaderPathIds(
  nodes: QuestionElement['config']['cascaderOptions'],
  labels: string[]
): string[] {
  const ids: string[] = []
  let level = nodes ?? []
  for (const label of labels) {
    const node = level.find((item) => item.label === label)
    if (!node) return []
    ids.push(node.id)
    level = node.children ?? []
  }
  return ids
}

// 优化后的数据生成器，基于问题唯一 ID 确定固有概率分布与吸引力指数，并附加合理的样本波动噪声
function buildSampleAnswer(question: QuestionElement, seed: number): unknown {
  const options = question.config.options ?? []
  const rows = question.config.rows ?? []
  const columns = question.config.columns ?? []
  const statements = question.config.statements ?? []
  const pseudoAge = 18 + (seed % 48)

  switch (question.type) {
    case 'single_choice':
    case 'dropdown': {
      if (options.length === 0) return '已选择'

      // 为当前问题的每个选项计算一个基于问题 ID 的固有吸引力权重 (0.05 ~ 1.0)
      const weights = options.map((_, idx) => {
        const attr = 0.05 + pseudoRandom(idx, question.id) * 0.95
        // 采用 2.2 次方拉开选项之间的差距，形成明显的“热门选项”和“冷门选项”
        return Math.pow(attr, 2.2)
      })

      const rand = pseudoRandom(seed, question.id + '_single')
      const totalWeight = weights.reduce((sum, w) => sum + w, 0)
      let target = rand * totalWeight

      for (let i = 0; i < options.length; i++) {
        target -= weights[i]
        if (target <= 0) {
          return options[i].id
        }
      }
      return options[options.length - 1].id
    }

    case 'multiple_choice': {
      if (options.length === 0) return []

      // 决定每个选项的固有选中概率在 0.05 到 0.8 之间
      const probabilities = options.map((_, idx) => {
        const attr = pseudoRandom(idx, question.id)
        return 0.05 + Math.pow(attr, 1.8) * 0.75
      })

      const chosenOptionIds: string[] = []
      options.forEach((opt, idx) => {
        // 每个样本根据固有概率进行随机决策
        const optRand = pseudoRandom(seed + idx * 17, question.id + '_multi')
        if (optRand < probabilities[idx]) {
          chosenOptionIds.push(opt.id)
        }
      })

      // 保底选中，如果一个都没选，选中固有概率最高的那个
      if (chosenOptionIds.length === 0) {
        const maxIdx = probabilities.indexOf(Math.max(...probabilities))
        return options[maxIdx] ? [options[maxIdx].id] : []
      }
      return chosenOptionIds
    }

    case 'ranking': {
      if (options.length === 0) return []

      // 给每个选项生成固有吸引力评分加上样本随机噪声，从而决定最终排序
      const scores = options.map((opt, idx) => {
        // 固有底分 10 ~ 100 分
        const baseScore = 10 + pseudoRandom(idx, question.id) * 90
        // 样本带来的随机噪声 (-25 ~ +25 分)
        const noise =
          (pseudoRandom(seed + idx * 13, question.id + '_rank') - 0.5) * 50
        return { optionId: opt.id, score: baseScore + noise }
      })

      return scores
        .sort((a, b) => b.score - a.score)
        .map((item) => item.optionId)
    }

    case 'matrix_single':
      return Object.fromEntries(
        rows.map((row, rowIndex) => {
          // 每行均有一个独立的满意度中心，通常偏向于满意 (0.6 ~ 0.95)
          const baseCenter = 0.6 + pseudoRandom(rowIndex, question.id) * 0.35
          // 每个回答者带来的满意度噪声波动 (-0.2 ~ 0.2)
          const noise =
            (pseudoRandom(seed + rowIndex * 7, question.id + '_matrix_single') -
              0.5) *
            0.4

          let score = baseCenter + noise
          if (score < 0) score = 0
          if (score > 0.99) score = 0.99

          const colIdx = Math.floor(score * columns.length)
          return [row.id, columns[colIdx]?.id ?? columns[columns.length - 1].id]
        })
      )

    case 'matrix_multiple':
      return Object.fromEntries(
        rows.map((row, rowIndex) => {
          const chosenCols: string[] = []
          columns.forEach((col, colIndex) => {
            // 计算行列交叉处的固有使用率概率 (0.05 ~ 0.75)
            const attr = pseudoRandom(
              rowIndex * 11 + colIndex * 3,
              question.id + '_matrix_multi'
            )
            const prob = 0.05 + Math.pow(attr, 1.8) * 0.7

            const randVal = pseudoRandom(
              seed + rowIndex * 29 + colIndex * 19,
              question.id + '_matrix_multi_opt'
            )
            if (randVal < prob) {
              chosenCols.push(col.id)
            }
          })

          // 保底策略：如果一个都没选中，随机选一个
          if (chosenCols.length === 0 && columns.length > 0) {
            const fallbackIdx = Math.floor(
              pseudoRandom(seed + rowIndex, question.id + '_matrix_multi_fb') *
                columns.length
            )
            chosenCols.push(columns[fallbackIdx].id)
          }
          return [row.id, chosenCols]
        })
      )

    case 'cascader': {
      // 对常住地级联选择做出更真实的地理分布（中国大陆约占 65%，港澳台 20%，海外 15%）
      if (question.title.includes('常住地')) {
        const rand = pseudoRandom(seed, question.id)
        if (rand < 0.65) {
          const subRand = pseudoRandom(seed + 1, question.id)
          const cities = ['上海', '北京', '深圳', '成都']
          const city = cities[Math.floor(subRand * cities.length)]
          return findCascaderPathIds(question.config.cascaderOptions, [
            '中国大陆',
            city,
          ])
        } else if (rand < 0.85) {
          const subRand = pseudoRandom(seed + 1, question.id)
          const cities = ['香港', '澳门', '台北']
          const city = cities[Math.floor(subRand * cities.length)]
          return findCascaderPathIds(question.config.cascaderOptions, [
            '港澳台',
            city,
          ])
        } else {
          const subRand = pseudoRandom(seed + 1, question.id)
          const cities = ['新加坡', '东京', '其他']
          const city = cities[Math.floor(subRand * cities.length)]
          return findCascaderPathIds(question.config.cascaderOptions, [
            '海外',
            city,
          ])
        }
      }
      return findCascaderPathIds(question.config.cascaderOptions, [
        '中国大陆',
        '浙江',
        '杭州',
      ])
    }

    case 'text':
      return `样本回答 ${seed + 1}`

    case 'textarea':
      return '这是一段较长的反馈，用来观察填写记录列表里的文本截断和换行。'

    case 'number':
      if (question.title.includes('年龄')) {
        return pseudoAge
      }
      if (question.title.includes('连住')) {
        const rand = pseudoRandom(seed, question.id)
        // 真实偏向：1晚 (55%)，2晚 (27%)，3晚 (11%)，4晚及以上 (7%)
        if (rand < 0.55) return 1
        if (rand < 0.82) return 2
        if (rand < 0.93) return 3
        return 4 + Math.floor(rand * 5)
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

    case 'rating': {
      const maxStars = question.config.starCount || 5
      // 每个评分题有自己的基准满意度中心 (0.55 ~ 0.95)
      const baseCenter = 0.55 + pseudoRandom(0, question.id) * 0.4
      // 样本随机波动噪声
      const noise = (pseudoRandom(seed, question.id + '_rating') - 0.5) * 0.35

      let ratingVal = Math.round((baseCenter + noise) * maxStars)
      if (ratingVal < 1) ratingVal = 1
      if (ratingVal > maxStars) ratingVal = maxStars
      return ratingVal
    }

    case 'slider': {
      const min = question.config.minValue ?? 0
      const max = question.config.maxValue ?? 100
      // 固有偏好中心点 (0.2 ~ 0.8)
      const baseCenter = 0.2 + pseudoRandom(0, question.id) * 0.6
      // 样本波动 (-0.25 到 0.25)
      const noise = (pseudoRandom(seed, question.id + '_slider') - 0.5) * 0.5

      let pct = baseCenter + noise
      if (pct < 0) pct = 0
      if (pct > 1) pct = 1

      const step = question.config.step ?? 1
      const val = min + pct * (max - min)
      return Math.round(val / step) * step
    }

    case 'nps': {
      // 固有推荐指数中心点 (0.4 ~ 0.95)
      const baseCenter = 0.4 + pseudoRandom(0, question.id) * 0.55
      // 样本波动
      const noise = (pseudoRandom(seed, question.id + '_nps') - 0.5) * 0.35
      let score = baseCenter + noise
      if (score < 0) score = 0
      if (score > 1) score = 1

      // 非线性映射，模拟 NPS 的高分偏好特征
      if (score > 0.82) return 10
      if (score > 0.68) return 9
      if (score > 0.52) return 8
      if (score > 0.4) return 7
      if (score > 0.3) return 6
      return Math.floor(score * 10)
    }

    case 'likert': {
      const scaleMin = question.config.scaleMin ?? 1
      const scaleMax = question.config.scaleMax ?? 5
      const range = scaleMax - scaleMin
      return Object.fromEntries(
        statements.map((stmt, stmtIdx) => {
          // 每个陈述声明一个基准满意中心点
          const baseCenter = 0.55 + pseudoRandom(stmtIdx, question.id) * 0.4
          const noise =
            (pseudoRandom(seed + stmtIdx, question.id + '_likert') - 0.5) * 0.35
          let val = Math.round(scaleMin + (baseCenter + noise) * range)
          if (val < scaleMin) val = scaleMin
          if (val > scaleMax) val = scaleMax
          return [stmt.id, val]
        })
      )
    }

    default:
      return '示例回答'
  }
}

// 置顶全题型演示问卷，便于从列表进入编辑页测试
const demoSurvey = createAllTypesDemoSurvey()
detailMap.set(DEMO_SURVEY_ID, demoSurvey)
seedSurveyRecords(demoSurvey.id, demoSurvey)
updateListItemFromDocument(demoSurvey)

// seed list
for (let i = 0; i < 20; i++) {
  const document = createEmptySurvey(faker.lorem.words(3))
  document.status = faker.helpers.arrayElement([
    'draft',
    'published',
    'archived',
  ])
  if (document.status === 'published') {
    document.slug = faker.lorem.slug()
    document.publishedAt = faker.date.recent().toISOString()
  }
  detailMap.set(document.id, document)
  seedSurveyRecords(document.id, document)
  updateListItemFromDocument(document)
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
    const document = parseSurveyDocument(await request.json())
    document.id = crypto.randomUUID()
    detailMap.set(document.id, document)
    recordMap.set(document.id, [])
    updateListItemFromDocument(document)
    return HttpResponse.json(document)
  }),

  http.get('/api/survey/:id', async ({ params }) => {
    await sleep(150)
    const id = params.id as string
    let document = detailMap.get(id)
    if (!document) {
      // 未知 ID：返回全题型演示副本，便于直接打开编辑 URL 测试
      document = createAllTypesDemoSurvey()
      document.id = id
      detailMap.set(id, document)
      updateListItemFromDocument(document)
      seedSurveyRecords(id, document)
    }
    return HttpResponse.json(document)
  }),

  http.put('/api/survey/:id', async ({ params, request }) => {
    await sleep(200)
    const id = params.id as string
    const document = parseSurveyDocument(await request.json())
    document.id = id
    detailMap.set(id, document)
    updateListItemFromDocument(document)
    return HttpResponse.json(document)
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
      status: SurveyDocument['status']
    }
    const document = detailMap.get(id)
    if (document) {
      document.status = status
      updateListItemFromDocument(document)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/survey/:id/publish', async ({ params }) => {
    const id = params.id as string
    const document = detailMap.get(id)
    if (!document) return new HttpResponse(null, { status: 404 })
    document.status = 'published'
    document.revision += 1
    document.slug = document.slug || faker.lorem.slug()
    document.publishedAt = new Date().toISOString()
    updateListItemFromDocument(document)
    return HttpResponse.json(document)
  }),

  http.get('/api/survey/:id/analysis', async ({ params, request }) => {
    await sleep(200)
    const id = params.id as string
    const url = new URL(request.url)
    const document = detailMap.get(id)
    if (!document) return new HttpResponse(null, { status: 404 })

    const records = recordMap.get(id) ?? []
    const filteredRecords = filterSurveyRecords(
      document,
      records,
      url.searchParams
    )
    return HttpResponse.json(createSurveyAnalysis(id, filteredRecords))
  }),

  // 新增接口：单独按题目 ID 获取单题的数据统计分析
  http.get(
    '/api/survey/:id/analysis/question/:questionId',
    async ({ params, request }) => {
      await sleep(150)
      const id = params.id as string
      const questionId = params.questionId as string
      const url = new URL(request.url)
      const document = detailMap.get(id)
      if (!document) return new HttpResponse(null, { status: 404 })

      const records = recordMap.get(id) ?? []
      const questions = flattenQuestions(document)
      const question = questions.find((item) => item.id === questionId)
      if (!question) return new HttpResponse(null, { status: 404 })
      const filteredRecords = filterSurveyRecords(
        document,
        records,
        url.searchParams
      )

      const page = Number(url.searchParams.get('page') || 1)
      const pageSize = Number(url.searchParams.get('pageSize') || 5)
      const search = url.searchParams.get('search') || ''

      // 3. 计算单题的统计分析
      const analysis = createQuestionAnalysis(question, filteredRecords, {
        page,
        pageSize,
        search,
      })
      return HttpResponse.json(analysis)
    }
  ),

  http.get('/api/survey/:id/analysis/segment', async ({ params, request }) => {
    await sleep(180)
    const id = params.id as string
    const url = new URL(request.url)
    const document = detailMap.get(id)
    if (!document) return new HttpResponse(null, { status: 404 })

    const records = recordMap.get(id) ?? []
    try {
      const segments = decodeSegmentDefinitions(
        url.searchParams.get('segments')
      )
      return HttpResponse.json(
        createSurveySegmentAnalysis(id, document, records, segments)
      )
    } catch {
      return HttpResponse.json({ message: '分群条件格式无效' }, { status: 400 })
    }
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
    const document = detailMap.get(id)
    const records = recordMap.get(id) ?? []
    const questions = document ? flattenQuestions(document) : []
    const headers = [
      'record_id',
      'status',
      'started_at',
      ...questions.map((question) => question.title),
    ]
    const rows = records.map((r) => [
      r.id,
      r.status,
      r.startedAt,
      ...questions.map((question) => {
        const v = r.answers[question.id]
        if (v == null) return ''
        return typeof v === 'object' ? JSON.stringify(v) : String(v)
      }),
    ])

    // 使用 exceljs 重构数据表写入 Buffer 逻辑
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Records')
    worksheet.addRow(headers)
    rows.forEach((row) => worksheet.addRow(row))
    const buf = await workbook.xlsx.writeBuffer()
    return new HttpResponse(buf as ArrayBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="survey-${id}.xlsx"`,
      },
    })
  }),
]
