import React from 'react'
import type { TextAnalysis, TextAnswerItem } from '@/features/survey/core/analysis-types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSurveyQuestionAnalysis } from '../../query/hooks'

interface TextAnswersProps {
  analysis: TextAnalysis
  surveyId: string
  params?: any
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
            typeof item === 'object' ? formatTextAnswer(JSON.stringify(item)) : String(item)
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
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 5 // 设置默认每页展示的回答条数

  // 1. 延迟防抖的搜索词，防止输入框每敲一个字都向后端发请求
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1) // 搜索词变动时，重置为第一页
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // 2. 当外部全局筛选条件变化时，重置本地翻页到第一页
  React.useEffect(() => {
    setCurrentPage(1)
  }, [params])

  // 3. 当非初始状态时，启用局部翻页或搜索的网络请求
  const isLocalFetchEnabled = currentPage > 1 || debouncedSearch.trim() !== ''

  const { data: pagedAnalysis, isFetching } = useSurveyQuestionAnalysis(
    surveyId,
    analysis.questionId,
    {
      ...params,
      page: currentPage,
      pageSize,
      search: debouncedSearch,
    },
    {
      enabled: isLocalFetchEnabled,
    }
  )

  // 4. 确定当前应该渲染的数据源
  const currentAnswers = React.useMemo(() => {
    if (!isLocalFetchEnabled) {
      return analysis.answers
    }
    return (pagedAnalysis as TextAnalysis)?.answers
  }, [isLocalFetchEnabled, analysis.answers, pagedAnalysis])

  const totalCount = currentAnswers?.meta?.total ?? 0
  const totalPages = currentAnswers?.meta?.totalPages ?? 1
  const displayAnswers = currentAnswers?.data ?? []

  return (
    <div className='space-y-4 relative'>
      {/* 搜索控制栏 */}
      <div className='flex items-center justify-end gap-3'>
        <div className='relative w-full sm:w-72'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='输入关键字搜索回答...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-9 h-9 text-xs'
          />
        </div>
      </div>

      {/* 回答列表区域，加载时展示局部的磨砂遮罩 */}
      <div className='relative min-h-[120px] border rounded-lg bg-muted/5 divide-y overflow-hidden'>
        {isFetching && (
          <div className='absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10 animate-pulse'>
            <span className='text-xs text-muted-foreground font-medium'>正在加载数据...</span>
          </div>
        )}

        {displayAnswers.length === 0 ? (
          <div className='p-6 text-center text-xs text-muted-foreground'>
            {searchTerm ? '无匹配的搜索结果' : '暂无回答数据'}
          </div>
        ) : (
          displayAnswers.map((item: TextAnswerItem, idx: number) => {
            const globalIdx = (currentPage - 1) * pageSize + idx + 1
            return (
              <div key={item.id || idx} className='p-3 text-xs hover:bg-muted/10 transition-colors'>
                <div className='flex items-start justify-between gap-4 mb-1.5'>
                  <span className='font-mono text-muted-foreground shrink-0'>#{globalIdx}</span>
                  <span className='text-muted-foreground shrink-0 flex items-center gap-1.5'>
                    {item.respondent && (
                      <span className='max-w-[100px] truncate font-medium text-foreground/80'>
                        {item.respondent}
                      </span>
                    )}
                    {item.completedAt && (
                      <span className='text-[10px] opacity-75'>
                        {new Date(item.completedAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </span>
                </div>
                <p className='text-foreground font-medium break-all whitespace-pre-wrap leading-relaxed pl-5'>
                  {formatTextAnswer(item.text)}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* 底部精致分页控制栏 */}
      {totalCount > 0 && (
        <div className='flex items-center justify-between gap-4 pt-2 text-xs'>
          <div className='text-muted-foreground'>
            共 <span className='font-semibold text-foreground font-mono'>{totalCount}</span> 条记录，当前第{' '}
            <span className='font-semibold text-foreground font-mono'>{currentPage}</span> / {totalPages} 页
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 px-2.5 text-xs'
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isFetching}
            >
              <ChevronLeft className='h-3.5 w-3.5 mr-1 shrink-0' />
              上一页
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-8 px-2.5 text-xs'
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isFetching}
            >
              下一页
              <ChevronRight className='h-3.5 w-3.5 ml-1 shrink-0' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
