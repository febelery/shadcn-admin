import {
  createAllTypesDemoSurvey,
  DEMO_SURVEY_ID,
} from '@/mocks/fixtures/survey-all-types-demo'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import ExcelJS from 'exceljs'
import {
  matchFilterValue,
  parseQueryFilterParam,
} from '@/lib/data-grid-filters'
import { sleep } from '@/lib/utils'
import type {
  SurveyAnalysisResult,
  QuestionAnalysis,
  RatingAnalysis,
  TextAnswerItem,
  TextAnalysis,
  ChoiceAnalysis,
  SurveySegmentAnalysisResult,
  SegmentDefinition,
} from '@/features/survey/core/analysis-types'
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
import { evaluateCondition } from '@/features/survey/core/logic/eval'

/**
 * 核心统计计算逻辑：根据指定问题的类型及其对应的配置，针对筛选后的答卷数据进行单题层面的指标统计
 */
function computeSingleQuestionAnalysis(
  q: any,
  filteredRecords: any[],
  _totalRecords: number,
  queryParams?: { page?: number; pageSize?: number; search?: string }
): QuestionAnalysis {
  const validAnswers = filteredRecords
    .map((r) => r.answers[q.id])
    .filter((val) => val !== undefined && val !== null && val !== '')

  const answerCount = validAnswers.length

  if (q.type === 'single_choice' || q.type === 'dropdown') {
    const options = q.config.options ?? []
    const countMap = new Map<string, number>()
    for (const opt of options) {
      countMap.set(opt.label, 0)
    }
    let otherCount = 0
    for (const val of validAnswers) {
      const valStr = String(val)
      if (countMap.has(valStr)) {
        countMap.set(valStr, (countMap.get(valStr) ?? 0) + 1)
      } else {
        otherCount++
      }
    }

    const optionAnalyses = options.map((opt: any) => {
      const count = countMap.get(opt.label) ?? 0
      const percentage =
        answerCount > 0 ? Number((count / answerCount).toFixed(4)) : 0
      return { label: opt.label, count, percentage }
    })

    if (otherCount > 0 || q.config.allowOther) {
      optionAnalyses.push({
        label: q.config.otherLabel || '其他',
        count: otherCount,
        percentage:
          answerCount > 0 ? Number((otherCount / answerCount).toFixed(4)) : 0,
      })
    }

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      options: optionAnalyses,
    } as ChoiceAnalysis
  } else if (q.type === 'multiple_choice') {
    const options = q.config.options ?? []
    const countMap = new Map<string, number>()
    for (const opt of options) {
      countMap.set(opt.label, 0)
    }
    for (const val of validAnswers) {
      if (Array.isArray(val)) {
        for (const item of val) {
          const itemStr = String(item)
          if (countMap.has(itemStr)) {
            countMap.set(itemStr, (countMap.get(itemStr) ?? 0) + 1)
          }
        }
      }
    }

    const optionAnalyses = options.map((opt: any) => {
      const count = countMap.get(opt.label) ?? 0
      const percentage =
        answerCount > 0 ? Number((count / answerCount).toFixed(4)) : 0
      return { label: opt.label, count, percentage }
    })

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      options: optionAnalyses,
    } as ChoiceAnalysis
  } else if (q.type === 'ranking') {
    const options = q.config.options ?? []
    const countMap = new Map<string, number>()
    const rankSumMap = new Map<string, number>()
    for (const opt of options) {
      countMap.set(opt.label, 0)
      rankSumMap.set(opt.label, 0)
    }

    for (const val of validAnswers) {
      if (Array.isArray(val)) {
        val.forEach((item, idx) => {
          const itemStr = String(item)
          if (rankSumMap.has(itemStr)) {
            rankSumMap.set(itemStr, (rankSumMap.get(itemStr) ?? 0) + (idx + 1))
          }
          if (idx === 0 && countMap.has(itemStr)) {
            countMap.set(itemStr, (countMap.get(itemStr) ?? 0) + 1)
          }
        })
      }
    }

    const optionAnalyses = options.map((opt: any) => {
      const count = countMap.get(opt.label) ?? 0
      const rankSum = rankSumMap.get(opt.label) ?? 0
      const avgRank =
        answerCount > 0 ? Number((rankSum / answerCount).toFixed(2)) : 0
      const percentage =
        answerCount > 0 ? Number((count / answerCount).toFixed(4)) : 0
      return {
        label: `${opt.label} (平均排名: ${avgRank || '-'})`,
        count,
        percentage,
      }
    })

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      options: optionAnalyses,
    } as ChoiceAnalysis
  } else if (q.type === 'cascader') {
    const pathCounts = new Map<string, number>()
    for (const val of validAnswers) {
      let pathStr = ''
      if (Array.isArray(val) && val.length > 0) {
        pathStr = val.map(String).filter(Boolean).join(' / ')
      } else if (val) {
        pathStr = String(val)
      }
      if (pathStr) {
        pathCounts.set(pathStr, (pathCounts.get(pathStr) ?? 0) + 1)
      }
    }

    let sortedAnalyses = Array.from(pathCounts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage:
          answerCount > 0 ? Number((count / answerCount).toFixed(4)) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const limitCount = 10

    if (sortedAnalyses.length > limitCount) {
      const top10 = sortedAnalyses.slice(0, limitCount)
      const others = sortedAnalyses.slice(limitCount)
      const otherCount = others.reduce((sum, item) => sum + item.count, 0)
      const otherPercentage =
        answerCount > 0 ? Number((otherCount / answerCount).toFixed(4)) : 0

      top10.push({
        label: q.config.otherLabel || '其他',
        count: otherCount,
        percentage: otherPercentage,
      })
      sortedAnalyses = top10
    }

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      options: sortedAnalyses,
    } as ChoiceAnalysis
  } else if (
    q.type === 'rating' ||
    q.type === 'nps' ||
    q.type === 'slider' ||
    q.type === 'number'
  ) {
    const scores = validAnswers.map(Number).filter((s) => !Number.isNaN(s))
    const sum = scores.reduce((a, b) => a + b, 0)
    const avgScore =
      scores.length > 0 ? Number((sum / scores.length).toFixed(2)) : 0

    const sorted = [...scores].sort((a, b) => a - b)
    let medianScore = 0
    if (sorted.length > 0) {
      const mid = Math.floor(sorted.length / 2)
      medianScore =
        sorted.length % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2
    }

    const distMap = new Map<number | string, number>()
    if (q.type === 'rating') {
      const maxStars = q.config.starCount || 5
      for (let i = 1; i <= maxStars; i++) distMap.set(i, 0)
    } else if (q.type === 'nps') {
      for (let i = 0; i <= 10; i++) distMap.set(i, 0)
    }

    if (q.type === 'slider' || q.type === 'number') {
      if (scores.length > 0) {
        const minVal = Math.min(...scores)
        const maxVal = Math.max(...scores)
        const uniqueVals = Array.from(new Set(scores)).sort((a, b) => a - b)

        if (uniqueVals.length <= 10 || maxVal - minVal <= 10) {
          const start = Math.floor(minVal)
          const end = Math.ceil(maxVal)
          for (let i = start; i <= end; i++) {
            distMap.set(i, 0)
          }
          for (const val of uniqueVals) {
            distMap.set(val, 0)
          }
          for (const s of scores) {
            distMap.set(s, (distMap.get(s) ?? 0) + 1)
          }
        } else {
          const range = maxVal - minVal
          const rawStep = range / 5
          const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
          const ratio = rawStep / magnitude

          let chunkSize = magnitude
          if (ratio > 5) {
            chunkSize = 5 * magnitude
          } else if (ratio > 2) {
            chunkSize = 2 * magnitude
          }
          chunkSize = Math.max(1, chunkSize)

          const startLimit = Math.floor(minVal / chunkSize) * chunkSize
          const intervals: { start: number; end: number; label: string }[] = []

          let currentStart = startLimit
          while (currentStart <= maxVal) {
            const currentEnd = currentStart + chunkSize - 1
            intervals.push({
              start: currentStart,
              end: currentEnd,
              label: `${currentStart}-${currentEnd}`,
            })
            currentStart += chunkSize
          }

          for (const interval of intervals) {
            distMap.set(interval.label, 0)
          }

          for (const s of scores) {
            const matched = intervals.find(
              (item) => s >= item.start && s <= item.end
            )
            if (matched) {
              distMap.set(matched.label, (distMap.get(matched.label) ?? 0) + 1)
            } else {
              if (s < startLimit) {
                const firstLabel = intervals[0].label
                distMap.set(firstLabel, (distMap.get(firstLabel) ?? 0) + 1)
              } else {
                const lastLabel = intervals[intervals.length - 1].label
                distMap.set(lastLabel, (distMap.get(lastLabel) ?? 0) + 1)
              }
            }
          }
        }
      } else {
        distMap.set('0-100', 0)
      }
    } else {
      for (const s of scores) {
        distMap.set(s, (distMap.get(s) ?? 0) + 1)
      }
    }

    const distribution = Array.from(distMap.entries()).map(
      ([score, count]) => ({
        score,
        count,
        percentage:
          scores.length > 0 ? Number((count / scores.length).toFixed(4)) : 0,
      })
    )

    let npsProps = {}
    if (q.type === 'nps') {
      const promoters = scores.filter((s) => s >= 9).length
      const passives = scores.filter((s) => s >= 7 && s <= 8).length
      const detractors = scores.filter((s) => s <= 6).length
      const pctPromoters = scores.length > 0 ? promoters / scores.length : 0
      const pctDetractors = scores.length > 0 ? detractors / scores.length : 0
      const npsScore = Math.round((pctPromoters - pctDetractors) * 100)

      npsProps = {
        npsScore,
        promoters,
        passives,
        detractors,
      }
    }

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      avgScore,
      medianScore,
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      sumScore: sum,
      distribution,
      ...npsProps,
    } as RatingAnalysis
  } else if (q.type === 'matrix_single' || q.type === 'matrix_multiple') {
    const rows = q.config.rows ?? []
    const columns = q.config.columns ?? []

    const rowAnalyses = rows.map((row: any) => {
      const colCounts = new Map<string, number>()
      for (const col of columns) {
        colCounts.set(col.label, 0)
      }

      let rowAnswerCount = 0
      for (const val of validAnswers) {
        if (val && typeof val === 'object') {
          const rowVal = (val as Record<string, unknown>)[row.label]
          if (rowVal !== undefined && rowVal !== null) {
            rowAnswerCount++
            if (Array.isArray(rowVal)) {
              for (const subItem of rowVal) {
                const subStr = String(subItem)
                if (colCounts.has(subStr)) {
                  colCounts.set(subStr, (colCounts.get(subStr) ?? 0) + 1)
                }
              }
            } else {
              const valStr = String(rowVal)
              if (colCounts.has(valStr)) {
                colCounts.set(valStr, (colCounts.get(valStr) ?? 0) + 1)
              }
            }
          }
        }
      }

      const colAnalyses = columns.map((col: any) => {
        const count = colCounts.get(col.label) ?? 0
        const percentage =
          rowAnswerCount > 0 ? Number((count / rowAnswerCount).toFixed(4)) : 0
        return { columnLabel: col.label, count, percentage }
      })

      return {
        rowLabel: row.label,
        columns: colAnalyses,
      }
    })

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      rows: rowAnalyses,
    } as any
  } else if (q.type === 'likert') {
    const statements = q.config.statements ?? []
    const scaleMin = q.config.scaleMin ?? 1
    const scaleMax = q.config.scaleMax ?? 5

    const statementAnalyses = statements.map((stmt: any) => {
      const scoreCounts = new Map<number, number>()
      for (let i = scaleMin; i <= scaleMax; i++) {
        scoreCounts.set(i, 0)
      }

      let stmtAnswerCount = 0
      for (const val of validAnswers) {
        if (val && typeof val === 'object') {
          const scoreVal = (val as Record<string, unknown>)[stmt.label]
          if (scoreVal !== undefined && scoreVal !== null) {
            const s = Number(scoreVal)
            if (!Number.isNaN(s)) {
              stmtAnswerCount++
              scoreCounts.set(s, (scoreCounts.get(s) ?? 0) + 1)
            }
          }
        }
      }

      const distribution = Array.from(scoreCounts.entries()).map(
        ([score, count]) => ({
          score,
          count,
          percentage:
            stmtAnswerCount > 0
              ? Number((count / stmtAnswerCount).toFixed(4))
              : 0,
        })
      )

      return {
        statementLabel: stmt.label,
        distribution,
      }
    })

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      statements: statementAnalyses,
    } as any
  } else {
    const page = queryParams?.page ?? 1
    const pageSize = queryParams?.pageSize ?? 5
    const search = queryParams?.search || ''

    const textAnswers: TextAnswerItem[] = []
    for (const record of filteredRecords) {
      const val = record.answers[q.id]
      if (val !== undefined && val !== null && val !== '') {
        const textRep = Array.isArray(val)
          ? val.join(', ')
          : typeof val === 'object' && val !== null
            ? JSON.stringify(val)
            : String(val)

        // 支持关键字模糊匹配
        if (search && !textRep.toLowerCase().includes(search.toLowerCase())) {
          continue
        }

        textAnswers.push({
          id: record.id,
          text: textRep,
          respondent: record.respondent,
          completedAt: record.completedAt || record.startedAt,
        })
      }
    }

    const start = (page - 1) * pageSize
    const pagedData = textAnswers.slice(start, start + pageSize)

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      answers: {
        data: pagedData,
        meta: {
          page,
          pageSize,
          total: textAnswers.length,
          totalPages: Math.ceil(textAnswers.length / pageSize),
        },
      },
    } as TextAnalysis
  }
}

function parseSegmentDefinitions(value: string | null): SegmentDefinition[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function recordMatchesSegment(
  record: SurveyRecordItem,
  segment: SegmentDefinition,
  questionMap: Map<string, QuestionElement>
) {
  if (segment.conditions.length === 0) return false
  return segment.conditions.every((condition) => {
    const question = questionMap.get(condition.questionId)
    if (!question) return false
    return evaluateCondition(
      record.answers[condition.questionId],
      question,
      condition.operator,
      condition.value,
      condition.value2
    )
  })
}

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
        answers[question.id] = buildSampleAnswer(question, index)
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
          return options[i].label
        }
      }
      return options[options.length - 1].label
    }

    case 'multiple_choice': {
      if (options.length === 0) return []

      // 决定每个选项的固有选中概率在 0.05 到 0.8 之间
      const probabilities = options.map((_, idx) => {
        const attr = pseudoRandom(idx, question.id)
        return 0.05 + Math.pow(attr, 1.8) * 0.75
      })

      const chosenLabels: string[] = []
      options.forEach((opt, idx) => {
        // 每个样本根据固有概率进行随机决策
        const optRand = pseudoRandom(seed + idx * 17, question.id + '_multi')
        if (optRand < probabilities[idx]) {
          chosenLabels.push(opt.label)
        }
      })

      // 保底选中，如果一个都没选，选中固有概率最高的那个
      if (chosenLabels.length === 0) {
        const maxIdx = probabilities.indexOf(Math.max(...probabilities))
        return [options[maxIdx]?.label ?? '选项']
      }
      return chosenLabels
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
        return { label: opt.label, score: baseScore + noise }
      })

      return scores.sort((a, b) => b.score - a.score).map((item) => item.label)
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
          return [
            row.label,
            columns[colIdx]?.label ?? columns[columns.length - 1].label,
          ]
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
              chosenCols.push(col.label)
            }
          })

          // 保底策略：如果一个都没选中，随机选一个
          if (chosenCols.length === 0 && columns.length > 0) {
            const fallbackIdx = Math.floor(
              pseudoRandom(seed + rowIndex, question.id + '_matrix_multi_fb') *
                columns.length
            )
            chosenCols.push(columns[fallbackIdx].label)
          }
          return [row.label, chosenCols]
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
          return ['中国大陆', city]
        } else if (rand < 0.85) {
          const subRand = pseudoRandom(seed + 1, question.id)
          const cities = ['香港', '澳门', '台北']
          const city = cities[Math.floor(subRand * cities.length)]
          return ['港澳台', city]
        } else {
          const subRand = pseudoRandom(seed + 1, question.id)
          const cities = ['新加坡', '东京', '其他']
          const city = cities[Math.floor(subRand * cities.length)]
          return ['海外', city]
        }
      }
      return ['中国大陆', '浙江', '杭州']
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

    case 'fill_in':
      return '房号 1206，楼层 12'

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
          return [stmt.label, val]
        })
      )
    }

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

  http.get('/api/survey/:id/analysis', async ({ params, request }) => {
    await sleep(200)
    const id = params.id as string
    const url = new URL(request.url)
    const schema = detailMap.get(id)
    if (!schema) return new HttpResponse(null, { status: 404 })

    const records = recordMap.get(id) ?? []
    const questions = flattenQuestions(schema)

    // 1. 解析筛选条件
    const activeFilters: { key: string; filter: any }[] = []
    const statusFilter = parseQueryFilterParam(url.searchParams.get('status'))
    if (statusFilter)
      activeFilters.push({ key: 'status', filter: statusFilter })

    const completedAtFilter = parseQueryFilterParam(
      url.searchParams.get('completedAt')
    )
    if (completedAtFilter)
      activeFilters.push({ key: 'completedAt', filter: completedAtFilter })

    for (const q of questions) {
      const rawFilter = url.searchParams.get(q.id)
      const parsed = parseQueryFilterParam(rawFilter)
      if (parsed) {
        activeFilters.push({ key: q.id, filter: parsed })
      }
    }

    // 2. 应用筛选
    let filteredRecords = [...records]
    if (activeFilters.length > 0) {
      filteredRecords = filteredRecords.filter((record) => {
        return activeFilters.every(({ key, filter }) => {
          let cellValue: unknown
          if (key === 'status') {
            cellValue = record.status
          } else if (key === 'completedAt') {
            cellValue = record.completedAt
          } else {
            cellValue = record.answers[key]
          }
          return matchFilterValue(cellValue, filter)
        })
      })
    }

    // 3. 计算整体概况
    const totalRecords = filteredRecords.length
    const completeRecords = filteredRecords.filter(
      (r) => r.status === 'complete'
    ).length
    const partialRecords = totalRecords - completeRecords

    // 平均答题时长
    let sumDuration = 0
    let durationCount = 0
    for (const r of filteredRecords) {
      if (r.durationMs != null) {
        sumDuration += r.durationMs
        durationCount++
      }
    }
    const avgDurationMs =
      durationCount > 0 ? Math.round(sumDuration / durationCount) : 0

    // 近30天逐日趋势
    const trendMap = new Map<string, number>()
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().slice(0, 10)
      trendMap.set(dateStr, 0)
    }

    for (const r of filteredRecords) {
      const dateStr = (r.completedAt || r.startedAt).slice(0, 10)
      if (trendMap.has(dateStr)) {
        trendMap.set(dateStr, (trendMap.get(dateStr) ?? 0) + 1)
      } else {
        trendMap.set(dateStr, 1)
      }
    }

    const dailyTrend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const result: SurveyAnalysisResult = {
      surveyId: id,
      overview: {
        totalRecords,
        completeRecords,
        partialRecords,
        avgDurationMs,
        dailyTrend,
      },
    }

    return HttpResponse.json(result)
  }),

  // 新增接口：单独按题目 ID 获取单题的数据统计分析
  http.get(
    '/api/survey/:id/analysis/question/:questionId',
    async ({ params, request }) => {
      await sleep(150)
      const id = params.id as string
      const questionId = params.questionId as string
      const url = new URL(request.url)
      const schema = detailMap.get(id)
      if (!schema) return new HttpResponse(null, { status: 404 })

      const records = recordMap.get(id) ?? []
      const questions = flattenQuestions(schema)
      const q = questions.find((item) => item.id === questionId)
      if (!q) return new HttpResponse(null, { status: 404 })

      // 1. 解析筛选条件
      const activeFilters: { key: string; filter: any }[] = []
      const statusFilter = parseQueryFilterParam(url.searchParams.get('status'))
      if (statusFilter)
        activeFilters.push({ key: 'status', filter: statusFilter })

      const completedAtFilter = parseQueryFilterParam(
        url.searchParams.get('completedAt')
      )
      if (completedAtFilter)
        activeFilters.push({ key: 'completedAt', filter: completedAtFilter })

      for (const item of questions) {
        const rawFilter = url.searchParams.get(item.id)
        const parsed = parseQueryFilterParam(rawFilter)
        if (parsed) {
          activeFilters.push({ key: item.id, filter: parsed })
        }
      }

      // 2. 应用筛选
      let filteredRecords = [...records]
      if (activeFilters.length > 0) {
        filteredRecords = filteredRecords.filter((record) => {
          return activeFilters.every(({ key, filter }) => {
            let cellValue: unknown
            if (key === 'status') {
              cellValue = record.status
            } else if (key === 'completedAt') {
              cellValue = record.completedAt
            } else {
              cellValue = record.answers[key]
            }
            return matchFilterValue(cellValue, filter)
          })
        })
      }

      const page = Number(url.searchParams.get('page') || 1)
      const pageSize = Number(url.searchParams.get('pageSize') || 5)
      const search = url.searchParams.get('search') || ''

      // 3. 计算单题的统计分析
      const analysis = computeSingleQuestionAnalysis(
        q,
        filteredRecords,
        filteredRecords.length,
        {
          page,
          pageSize,
          search,
        }
      )
      return HttpResponse.json(analysis)
    }
  ),

  http.get('/api/survey/:id/analysis/segment', async ({ params, request }) => {
    await sleep(180)
    const id = params.id as string
    const url = new URL(request.url)
    const schema = detailMap.get(id)
    if (!schema) return new HttpResponse(null, { status: 404 })

    const records = recordMap.get(id) ?? []
    const questions = flattenQuestions(schema)
    const questionMap = new Map(questions.map((item) => [item.id, item]))
    const segments = parseSegmentDefinitions(url.searchParams.get('segments'))

    const result: SurveySegmentAnalysisResult = {
      surveyId: id,
      metric: 'count',
      metricLabel: '计数',
      total: records.length,
      segments: segments.map((segment) => {
        const count = records.filter((record) =>
          recordMatchesSegment(record, segment, questionMap)
        ).length
        return {
          id: segment.id,
          label: segment.label,
          count,
          percentage: records.length > 0 ? count / records.length : 0,
          conditions: segment.conditions,
        }
      }),
    }

    return HttpResponse.json(result)
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
