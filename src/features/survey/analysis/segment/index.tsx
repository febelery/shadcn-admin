import React from 'react'
import { Filter, Plus, Search, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type {
  SegmentCondition,
  SegmentConditionOperator,
  SegmentDefinition,
} from '@/features/survey/core/analysis-types'
import type {
  SurveyDocument,
  QuestionElement,
} from '@/features/survey/core/types'
import { useSurveySegmentAnalysis } from '../../query/hooks'
import { SegmentResults } from './results'
import { SegmentRow } from './row'
import {
  createCondition,
  createSegment,
  isSupportedQuestion,
  areSegmentsEqual,
  normalizeSegmentsForQuery,
  getSegmentConditionCount,
  getDefaultOperator,
  getDefaultValue,
  getQuestionLabel,
} from './utils'
import { getConditionIssues, type ValidationIssue } from './validator'

export interface SegmentAnalysisProps {
  surveyId: string
  document: SurveyDocument
  questions: QuestionElement[]
}

export function SegmentAnalysis({
  surveyId,
  document,
  questions,
}: SegmentAnalysisProps) {
  const supportedQuestions = React.useMemo(
    () => questions.filter(isSupportedQuestion),
    [questions]
  )

  const questionMap = React.useMemo(
    () =>
      new Map<string, QuestionElement>(
        supportedQuestions.map((question) => [question.id, question])
      ),
    [supportedQuestions]
  )

  const questionOptions = React.useMemo(() => {
    return supportedQuestions.map((question) => ({
      id: question.id,
      label: getQuestionLabel(question, document, questions),
    }))
  }, [supportedQuestions, document, questions])

  const [draftSegments, setDraftSegments] = React.useState<SegmentDefinition[]>(
    () => [createSegment(1)]
  )
  const [appliedSegments, setAppliedSegments] = React.useState<
    SegmentDefinition[]
  >([])

  const validation = React.useMemo(() => {
    const issues = getConditionIssues(draftSegments, questionMap)
    const issuesBySegment = new Map<string, ValidationIssue[]>()
    for (const issue of issues) {
      const list = issuesBySegment.get(issue.segmentId) ?? []
      list.push(issue)
      issuesBySegment.set(issue.segmentId, list)
    }

    const normalized = normalizeSegmentsForQuery(draftSegments, questionMap)
    return {
      issues,
      issuesBySegment,
      hasErrors: issues.some((issue) => issue.severity === 'error'),
      normalized,
    }
  }, [draftSegments, questionMap])

  const hasPendingChanges = React.useMemo(
    () => !areSegmentsEqual(validation.normalized, appliedSegments),
    [appliedSegments, validation.normalized]
  )

  const queryParams = React.useMemo(
    () =>
      appliedSegments.length > 0
        ? { segments: JSON.stringify(appliedSegments), metric: 'count' }
        : undefined,
    [appliedSegments]
  )

  const { data, isLoading, isError, refetch, isFetching } =
    useSurveySegmentAnalysis(surveyId, queryParams, {
      enabled: appliedSegments.length > 0,
    })

  const addSegment = React.useCallback(() => {
    setDraftSegments((prev) => [...prev, createSegment(prev.length + 1)])
  }, [])

  const removeSegment = React.useCallback((segmentId: string) => {
    setDraftSegments((prev) => {
      const next = prev.filter((segment) => segment.id !== segmentId)
      return next.length > 0 ? next : [createSegment(1)]
    })
  }, [])

  const updateSegment = React.useCallback(
    (segmentId: string, patch: Partial<SegmentDefinition>) => {
      setDraftSegments((prev) =>
        prev.map((segment) =>
          segment.id === segmentId ? { ...segment, ...patch } : segment
        )
      )
    },
    []
  )

  const addCondition = React.useCallback((segmentId: string) => {
    setDraftSegments((prev) =>
      prev.map((segment) =>
        segment.id === segmentId
          ? {
              ...segment,
              conditions: [...segment.conditions, createCondition()],
            }
          : segment
      )
    )
  }, [])

  const removeCondition = React.useCallback(
    (segmentId: string, conditionIndex: number) => {
      setDraftSegments((prev) =>
        prev.map((segment) => {
          if (segment.id !== segmentId) return segment
          const nextConditions = segment.conditions.filter(
            (_, index) => index !== conditionIndex
          )
          return {
            ...segment,
            conditions:
              nextConditions.length > 0 ? nextConditions : [createCondition()],
          }
        })
      )
    },
    []
  )

  const handleQuestionChange = React.useCallback(
    (segmentId: string, conditionIndex: number, question: QuestionElement) => {
      const operator = getDefaultOperator(question)
      setDraftSegments((prev) =>
        prev.map((segment) => {
          if (segment.id !== segmentId) return segment
          return {
            ...segment,
            conditions: segment.conditions.map((condition, index) =>
              index === conditionIndex
                ? {
                    questionId: question.id,
                    operator,
                    value: getDefaultValue(question, operator),
                    value2: undefined,
                  }
                : condition
            ),
          }
        })
      )
    },
    []
  )

  const handleOperatorChange = React.useCallback(
    (
      segmentId: string,
      conditionIndex: number,
      question: QuestionElement,
      operator: SegmentConditionOperator
    ) => {
      setDraftSegments((prev) =>
        prev.map((segment) => {
          if (segment.id !== segmentId) return segment
          return {
            ...segment,
            conditions: segment.conditions.map((condition, index) =>
              index === conditionIndex
                ? {
                    ...condition,
                    operator,
                    value: getDefaultValue(question, operator),
                    value2: undefined,
                  }
                : condition
            ),
          }
        })
      )
    },
    []
  )

  const handleValueChange = React.useCallback(
    (
      segmentId: string,
      conditionIndex: number,
      patch: Partial<SegmentCondition>
    ) => {
      setDraftSegments((prev) =>
        prev.map((segment) => {
          if (segment.id !== segmentId) return segment
          return {
            ...segment,
            conditions: segment.conditions.map((condition, index) =>
              index === conditionIndex ? { ...condition, ...patch } : condition
            ),
          }
        })
      )
    },
    []
  )

  const applyFilters = React.useCallback(() => {
    if (validation.hasErrors || validation.normalized.length === 0) return
    setAppliedSegments(validation.normalized)
  }, [validation.hasErrors, validation.normalized])

  const clearDraft = React.useCallback(() => {
    setDraftSegments([createSegment(1)])
    setAppliedSegments([])
  }, [])

  const [showClearConfirm, setShowClearConfirm] = React.useState(false)
  const clearTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleClearClick = React.useCallback(() => {
    if (showClearConfirm) {
      clearDraft()
      setShowClearConfirm(false)
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
    } else {
      setShowClearConfirm(true)
      clearTimerRef.current = setTimeout(() => {
        setShowClearConfirm(false)
      }, 3000)
    }
  }, [showClearConfirm, clearDraft])

  React.useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
    }
  }, [])

  const draftConditionCount = React.useMemo(
    () => getSegmentConditionCount(draftSegments),
    [draftSegments]
  )
  const appliedConditionCount = React.useMemo(
    () => getSegmentConditionCount(appliedSegments),
    [appliedSegments]
  )

  const canApply = !validation.hasErrors && validation.normalized.length > 0

  return (
    <div className='space-y-5'>
      {/* 1. 对比条件配置卡片（操作区域） */}
      <div className='border-muted bg-background overflow-hidden rounded-xl border shadow-sm'>
        {/* 顶部操作栏 */}
        <div className='border-muted bg-muted/10 flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-none'>
              <Filter className='h-3.5 w-3.5' />
            </div>
            <div className='min-w-0'>
              <h3 className='text-foreground text-xs font-semibold'>
                群体对比条件配置
              </h3>
              <p className='text-muted-foreground mt-0.5 hidden truncate text-[11px] sm:block'>
                配置各对比组的筛选条件。组内条件为“且”逻辑，各对比组之间为独立并列对比关系。
              </p>
              <div className='text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] sm:hidden'>
                <span>{draftSegments.length} 个对比组</span>
                <span className='bg-muted-foreground/30 h-1 w-1 rounded-full' />
                <span>{draftConditionCount} 条条件</span>
              </div>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
            {/* 操作按钮 */}
            <Button
              variant='outline'
              size='sm'
              className={cn(
                'border-muted/80 h-8 shrink-0 px-2.5 text-xs shadow-none transition-all duration-200',
                showClearConfirm
                  ? 'bg-destructive/10 text-destructive border-destructive/35 hover:bg-destructive/20 hover:text-destructive'
                  : 'text-muted-foreground'
              )}
              onClick={handleClearClick}
            >
              <RotateCcw className='mr-1.5 h-3.5 w-3.5' />
              {showClearConfirm ? '确认清空？' : '清空'}
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='border-muted/80 bg-background/50 hover:bg-background h-8 shrink-0 text-xs shadow-none'
              onClick={addSegment}
            >
              <Plus className='mr-1.5 h-3.5 w-3.5' />
              对比组
            </Button>

            <Button
              variant='default'
              size='sm'
              className={cn(
                'h-8 shrink-0 text-xs shadow-sm transition-all duration-300',
                canApply &&
                  hasPendingChanges &&
                  'ring-primary/20 bg-primary hover:bg-primary/95 shadow-md ring-2'
              )}
              onClick={applyFilters}
              disabled={!canApply || !hasPendingChanges}
            >
              <Search className='mr-1.5 h-3.5 w-3.5' />
              筛选
            </Button>
          </div>
        </div>

        <div className='space-y-4 p-4'>
          {draftSegments.map((segment, segmentIndex) => {
            const segmentIssues =
              validation.issuesBySegment.get(segment.id) ?? []

            return (
              <React.Fragment key={segment.id}>
                <section className='bg-background border-border overflow-hidden rounded-lg border shadow-none'>
                  {/* 对比组头部栏 */}
                  <div className='border-muted/50 bg-muted/5 flex items-center justify-between border-b px-3 py-2'>
                    <div className='flex min-w-0 flex-1 items-center gap-2.5'>
                      <Badge
                        variant='secondary'
                        className='border-muted bg-muted/50 text-foreground/80 flex h-5 w-5 shrink-0 items-center justify-center rounded border p-0 text-[10px] font-bold'
                      >
                        {segmentIndex + 1}
                      </Badge>
                      <span className='text-muted-foreground shrink-0 text-[11px] font-medium'>
                        对比组名称:
                      </span>
                      <Input
                        value={segment.label}
                        onChange={(event) =>
                          updateSegment(segment.id, {
                            label: event.target.value,
                          })
                        }
                        className='focus-visible:ring-ring hover:bg-muted/15 focus:bg-background text-foreground/80 h-7 max-w-[180px] rounded border-0 bg-transparent px-2 py-0.5 text-xs font-semibold shadow-none transition-all focus-visible:ring-1'
                        placeholder={`对比组 ${segmentIndex + 1}`}
                      />
                    </div>

                    {/* 对比组头部控制按钮 */}
                    <div className='flex items-center gap-1.5'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='hover:bg-muted/80 text-muted-foreground hover:text-foreground h-7 rounded px-2 text-xs'
                        onClick={() => addCondition(segment.id)}
                      >
                        <Plus className='mr-1 h-3.5 w-3.5' />
                        添加条件
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground hover:text-destructive hover:bg-muted/80 h-7 w-7 rounded'
                        onClick={() => removeSegment(segment.id)}
                        disabled={draftSegments.length === 1}
                        title='删除整个对比组'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </div>

                  {/* 条件行列表 */}
                  <div className='divide-muted/40 divide-y'>
                    {segment.conditions.map((condition, conditionIndex) => {
                      const issue = segmentIssues.find(
                        (item) => item.conditionIndex === conditionIndex
                      )
                      return (
                        <SegmentRow
                          key={segment.id + '-' + conditionIndex}
                          segmentId={segment.id}
                          condition={condition}
                          conditionIndex={conditionIndex}
                          questions={supportedQuestions}
                          questionOptions={questionOptions}
                          issue={issue}
                          onQuestionChange={handleQuestionChange}
                          onOperatorChange={handleOperatorChange}
                          onValueChange={handleValueChange}
                          onRemove={removeCondition}
                        />
                      )
                    })}
                  </div>
                </section>

                {/* VS 连接线 */}
                {segmentIndex < draftSegments.length - 1 && (
                  <div className='relative my-4 flex items-center justify-center'>
                    <div className='border-muted absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed' />
                    <span className='bg-background text-muted-foreground/45 border-muted/80 relative flex h-6 w-11 items-center justify-center rounded-full border font-mono text-[9px] font-extrabold tracking-widest uppercase shadow-sm'>
                      VS
                    </span>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* 2. 统计结果展示卡片（结果区域） */}
      <SegmentResults
        data={data}
        isLoading={isLoading}
        isError={isError}
        appliedSegments={appliedSegments}
        appliedConditionCount={appliedConditionCount}
        hasPendingChanges={hasPendingChanges}
        questionMap={questionMap}
        document={document}
        questions={questions}
        isFetching={isFetching}
        refetch={refetch}
      />
    </div>
  )
}
