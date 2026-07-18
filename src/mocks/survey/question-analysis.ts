import type { SurveyRecordItem } from '@/features/survey/core/admin-data-schema'
import type {
  QuestionAnalysis,
  TextAnswerItem,
} from '@/features/survey/core/analysis-schema'
import { isAnswerEmpty } from '@/features/survey/core/answer-validation'
import type {
  CascaderNode,
  QuestionElement,
} from '@/features/survey/core/types'

function getCascaderPathLabels(
  nodes: CascaderNode[],
  pathIds: string[]
): string[] {
  const labels: string[] = []
  let level = nodes
  for (const id of pathIds) {
    const node = level.find((item) => item.id === id)
    if (!node) return pathIds
    labels.push(node.label)
    level = node.children ?? []
  }
  return labels
}

/**
 * 核心统计计算逻辑：根据指定问题的类型及其对应的配置，针对筛选后的答卷数据进行单题层面的指标统计
 */
export function createQuestionAnalysis(
  question: QuestionElement,
  filteredRecords: SurveyRecordItem[],
  queryParams?: { page?: number; pageSize?: number; search?: string }
): QuestionAnalysis {
  const validAnswers = filteredRecords
    .map((record) => record.answers[question.id])
    .filter((answer) => !isAnswerEmpty(answer))

  const answerCount = validAnswers.length

  if (question.type === 'single_choice' || question.type === 'dropdown') {
    const options = question.config.options ?? []
    const countMap = new Map<string, number>()
    for (const opt of options) {
      countMap.set(opt.id, 0)
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

    const optionAnalyses = options.map((opt) => {
      const count = countMap.get(opt.id) ?? 0
      const percentage =
        answerCount > 0 ? Number((count / answerCount).toFixed(4)) : 0
      return { optionId: opt.id, label: opt.label, count, percentage }
    })

    if (otherCount > 0) {
      optionAnalyses.push({
        optionId: '__unknown__',
        label: '未识别选项',
        count: otherCount,
        percentage:
          answerCount > 0 ? Number((otherCount / answerCount).toFixed(4)) : 0,
      })
    }

    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      options: optionAnalyses,
    }
  } else if (question.type === 'multiple_choice') {
    const options = question.config.options ?? []
    const countMap = new Map<string, number>()
    for (const opt of options) {
      countMap.set(opt.id, 0)
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

    const optionAnalyses = options.map((opt) => {
      const count = countMap.get(opt.id) ?? 0
      const percentage =
        answerCount > 0 ? Number((count / answerCount).toFixed(4)) : 0
      return { optionId: opt.id, label: opt.label, count, percentage }
    })

    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      options: optionAnalyses,
    }
  } else if (question.type === 'ranking') {
    const options = question.config.options ?? []
    const firstChoiceCountMap = new Map<string, number>()
    const rankSumMap = new Map<string, number>()
    const rankCountMap = new Map<string, number>()
    for (const opt of options) {
      firstChoiceCountMap.set(opt.id, 0)
      rankSumMap.set(opt.id, 0)
      rankCountMap.set(opt.id, 0)
    }

    for (const val of validAnswers) {
      if (Array.isArray(val)) {
        val.forEach((item, idx) => {
          const itemStr = String(item)
          if (rankSumMap.has(itemStr)) {
            rankSumMap.set(itemStr, (rankSumMap.get(itemStr) ?? 0) + (idx + 1))
            rankCountMap.set(itemStr, (rankCountMap.get(itemStr) ?? 0) + 1)
          }
          if (idx === 0 && firstChoiceCountMap.has(itemStr)) {
            firstChoiceCountMap.set(
              itemStr,
              (firstChoiceCountMap.get(itemStr) ?? 0) + 1
            )
          }
        })
      }
    }

    const optionAnalyses = options.map((opt) => {
      const firstChoiceCount = firstChoiceCountMap.get(opt.id) ?? 0
      const rankSum = rankSumMap.get(opt.id) ?? 0
      const rankCount = rankCountMap.get(opt.id) ?? 0
      return {
        optionId: opt.id,
        label: opt.label,
        firstChoiceCount,
        firstChoicePercentage:
          answerCount > 0
            ? Number((firstChoiceCount / answerCount).toFixed(4))
            : 0,
        averageRank:
          rankCount > 0 ? Number((rankSum / rankCount).toFixed(2)) : null,
      }
    })

    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      options: optionAnalyses,
    }
  } else if (question.type === 'cascader') {
    const pathCounts = new Map<
      string,
      { pathIds: string[]; label: string; count: number }
    >()
    for (const val of validAnswers) {
      if (Array.isArray(val) && val.length > 0) {
        const pathIds = val.map(String)
        const pathKey = JSON.stringify(pathIds)
        const label = getCascaderPathLabels(
          question.config.cascaderOptions ?? [],
          pathIds
        )
          .filter(Boolean)
          .join(' / ')
        if (label) {
          const current = pathCounts.get(pathKey)
          pathCounts.set(pathKey, {
            pathIds,
            label,
            count: (current?.count ?? 0) + 1,
          })
        }
      }
    }

    const paths = Array.from(pathCounts.values())
      .map((path) => ({
        pathIds: path.pathIds,
        label: path.label,
        count: path.count,
        percentage:
          answerCount > 0 ? Number((path.count / answerCount).toFixed(4)) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      paths,
    }
  } else if (
    question.type === 'rating' ||
    question.type === 'nps' ||
    question.type === 'slider' ||
    question.type === 'number'
  ) {
    const scores = validAnswers.filter(
      (answer): answer is number =>
        typeof answer === 'number' && Number.isFinite(answer)
    )
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

    const distMap = new Map<number, number>()
    if (question.type === 'rating') {
      const maxStars = question.config.starCount || 5
      for (let i = 1; i <= maxStars; i++) distMap.set(i, 0)
    } else if (question.type === 'nps') {
      for (let i = 0; i <= 10; i++) distMap.set(i, 0)
    }

    for (const score of scores) {
      distMap.set(score, (distMap.get(score) ?? 0) + 1)
    }

    const distribution = Array.from(distMap.entries())
      .sort(([left], [right]) => left - right)
      .map(([score, count]) => ({
        score,
        count,
        percentage:
          scores.length > 0 ? Number((count / scores.length).toFixed(4)) : 0,
      }))

    const result = {
      questionId: question.id,
      title: question.title,
      avgScore,
      medianScore,
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      sumScore: sum,
      distribution,
    }

    if (question.type === 'nps') {
      const promoters = scores.filter((s) => s >= 9).length
      const passives = scores.filter((s) => s >= 7 && s <= 8).length
      const detractors = scores.filter((s) => s <= 6).length
      const pctPromoters = scores.length > 0 ? promoters / scores.length : 0
      const pctDetractors = scores.length > 0 ? detractors / scores.length : 0
      const npsScore = Math.round((pctPromoters - pctDetractors) * 100)

      return {
        ...result,
        type: question.type,
        npsScore,
        promoters,
        passives,
        detractors,
      }
    }

    return {
      ...result,
      type: question.type,
    }
  } else if (
    question.type === 'matrix_single' ||
    question.type === 'matrix_multiple'
  ) {
    const rows = question.config.rows ?? []
    const columns = question.config.columns ?? []

    const rowAnalyses = rows.map((row) => {
      const colCounts = new Map<string, number>()
      for (const col of columns) {
        colCounts.set(col.id, 0)
      }

      let rowAnswerCount = 0
      for (const val of validAnswers) {
        if (val && typeof val === 'object') {
          const rowVal = (val as Record<string, unknown>)[row.id]
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

      const colAnalyses = columns.map((col) => {
        const count = colCounts.get(col.id) ?? 0
        const percentage =
          rowAnswerCount > 0 ? Number((count / rowAnswerCount).toFixed(4)) : 0
        return { columnId: col.id, columnLabel: col.label, count, percentage }
      })

      return {
        rowId: row.id,
        rowLabel: row.label,
        columns: colAnalyses,
      }
    })

    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      rows: rowAnalyses,
    }
  } else if (question.type === 'likert') {
    const statements = question.config.statements ?? []
    const scaleMin = question.config.scaleMin ?? 1
    const scaleMax = question.config.scaleMax ?? 5

    const statementAnalyses = statements.map((stmt) => {
      const scoreCounts = new Map<number, number>()
      for (let i = scaleMin; i <= scaleMax; i++) {
        scoreCounts.set(i, 0)
      }

      let stmtAnswerCount = 0
      for (const val of validAnswers) {
        if (val && typeof val === 'object') {
          const scoreVal = (val as Record<string, unknown>)[stmt.id]
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
        statementId: stmt.id,
        statementLabel: stmt.label,
        distribution,
      }
    })

    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      statements: statementAnalyses,
    }
  } else {
    const page = queryParams?.page ?? 1
    const pageSize = queryParams?.pageSize ?? 5
    const search = queryParams?.search || ''

    const textAnswers: TextAnswerItem[] = []
    for (const record of filteredRecords) {
      const val = record.answers[question.id]
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
      questionId: question.id,
      title: question.title,
      type: question.type,
      answers: {
        data: pagedData,
        meta: {
          page,
          pageSize,
          total: textAnswers.length,
          totalPages: Math.ceil(textAnswers.length / pageSize),
        },
      },
    }
  }
}
