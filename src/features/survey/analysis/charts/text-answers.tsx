import React from 'react'
import type { QueryParams } from '@/types/api'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type {
  TextAnalysis,
  TextAnswerItem,
} from '@/features/survey/core/analysis-types'
import { useSurveyQuestionAnalysis } from '../../query/hooks'

interface TextAnswersProps {
  analysis: TextAnalysis
  surveyId: string
  params?: QueryParams
}

/**
 * 格式化并友好展示文本回答数据，支持日期范围、多选项 JSON 转换等逻辑
 */
function formatTextAnswer(text: string): string {
  if (!text) return ''
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object') {
        if ('start' in parsed && 'end' in parsed) {
          return `${parsed.start} 至 ${parsed.end}`
        }
        if ('name' in parsed && 'url' in parsed) {
          return parsed.name || parsed.url
        }
        return Object.entries(parsed)
          .map(([key, val]) => `${key}: ${String(val)}`)
          .join(', ')
      }
    } catch {
      // 忽略解析错误，返回原文本
    }
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            typeof item === 'object'
              ? formatTextAnswer(JSON.stringify(item))
              : String(item)
          )
          .join(', ')
      }
    } catch {
      // 忽略解析错误
    }
  }
  return text
}

export function TextAnswers({ analysis, surveyId, params }: TextAnswersProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const pageSize = 5
  const pageScope = JSON.stringify([params ?? null, debouncedSearch])
  const [pagination, setPagination] = React.useState({
    scope: pageScope,
    page: 1,
  })
  const currentPage = pagination.scope === pageScope ? pagination.page : 1
  const commitSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
  }, 300)
  const goToPage = (page: number) => {
    setPagination({ scope: pageScope, page })
  }

  const { data: pagedAnalysis, isFetching } = useSurveyQuestionAnalysis(
    surveyId,
    analysis.questionId,
    {
      ...params,
      page: currentPage,
      pageSize,
      search: debouncedSearch,
    }
  )

  // 4. 确定当前应该渲染的数据源
  const currentAnswers = React.useMemo(() => {
    return pagedAnalysis && 'answers' in pagedAnalysis
      ? pagedAnalysis.answers
      : analysis.answers
  }, [analysis.answers, pagedAnalysis])

  const totalCount = currentAnswers?.meta?.total ?? 0
  const totalPages = currentAnswers?.meta?.totalPages ?? 1
  const displayAnswers = currentAnswers?.data ?? []

  return (
    <div className='relative space-y-4'>
      {/* 搜索控制栏 */}
      <div className='flex items-center justify-end gap-3'>
        <div className='relative w-full sm:w-72'>
          <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
          <Input
            placeholder='输入关键字搜索回答...'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              commitSearch(e.target.value)
            }}
            className='h-9 pl-9 text-xs'
          />
        </div>
      </div>

      {/* 回答列表区域，加载时展示局部的磨砂遮罩 */}
      <div className='bg-muted/5 relative min-h-[120px] divide-y overflow-hidden rounded-lg border'>
        {isFetching && (
          <div className='bg-background/60 absolute inset-0 z-10 flex animate-pulse items-center justify-center backdrop-blur-[1px]'>
            <span className='text-muted-foreground text-xs font-medium'>
              正在加载数据...
            </span>
          </div>
        )}

        {displayAnswers.length === 0 ? (
          <div className='text-muted-foreground p-6 text-center text-xs'>
            {searchTerm ? '无匹配的搜索结果' : '暂无回答数据'}
          </div>
        ) : (
          displayAnswers.map((item: TextAnswerItem, idx: number) => {
            const globalIdx = (currentPage - 1) * pageSize + idx + 1
            return (
              <div
                key={item.id || idx}
                className='hover:bg-muted/10 flex items-start justify-between gap-4 p-3 text-xs transition-colors'
              >
                {/* 左侧：序号与回答文本内容 */}
                <div className='flex min-w-0 flex-1 items-start gap-2.5'>
                  <span className='text-muted-foreground/60 bg-muted/80 mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] leading-none'>
                    #{globalIdx}
                  </span>
                  <p className='text-foreground flex-1 text-xs leading-relaxed font-medium break-all whitespace-pre-wrap'>
                    {formatTextAnswer(item.text)}
                  </p>
                </div>

                {/* 右侧：答卷人与提交时间 */}
                <div className='text-muted-foreground mt-0.5 flex shrink-0 items-center gap-2 text-right text-xs'>
                  {item.respondent && (
                    <span className='text-foreground/70 bg-muted/30 max-w-[120px] truncate rounded px-1.5 py-0.5 text-[11px] font-medium'>
                      {item.respondent}
                    </span>
                  )}
                  {item.completedAt && (
                    <span className='shrink-0 font-mono text-[10px] opacity-75'>
                      {new Date(item.completedAt).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底部精致分页控制栏 */}
      {totalCount > 0 && (
        <div className='flex items-center justify-between gap-4 pt-2 text-xs'>
          <div className='text-muted-foreground'>
            共{' '}
            <span className='text-foreground font-mono font-semibold'>
              {totalCount}
            </span>{' '}
            条记录，当前第{' '}
            <span className='text-foreground font-mono font-semibold'>
              {currentPage}
            </span>{' '}
            / {totalPages} 页
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 px-2.5 text-xs'
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isFetching}
            >
              <ChevronLeft className='mr-1 h-3.5 w-3.5 shrink-0' />
              上一页
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-8 px-2.5 text-xs'
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isFetching}
            >
              下一页
              <ChevronRight className='ml-1 h-3.5 w-3.5 shrink-0' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
