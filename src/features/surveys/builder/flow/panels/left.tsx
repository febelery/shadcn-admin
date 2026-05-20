import { useMemo, useCallback } from 'react'
import { GitBranch, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BuilderPanelHeader } from '../../shared/panel-header'
import { useBuilderStore } from '../../store'
import { useFlowContext, type RuleCategory } from '../context'
import { groupIssuesByRule } from '../issues/issue-utils'
import { RulesList } from '../rules/rule-list'

type Props = {
  className?: string
  /** 点击新建时回调（移动端打开右侧 Sheet） */
  onNewRule?: () => void
}

/** 流程模式 · 左栏：纯规则索引（搜索 / 筛选 / 列表） */
export function LeftPanel({ className, onNewRule }: Props) {
  const {
    analyseSurvey,
    ruleMatchesSearch,
    getRuleCategory,
    flattenQuestions,
    getQuestionReferenceLabel,
  } = useFlowContext()

  const schema = useBuilderStore((s) => s.schema)
  const searchQuery = useBuilderStore((s) => s.flowRuleSearchQuery)
  const setFlowSearchQuery = useBuilderStore((s) => s.setFlowRuleSearchQuery)
  const startFlowNewRule = useBuilderStore((s) => s.startFlowNewRule)
  const filter = useBuilderStore((s) => s.flowRuleFilter)
  const setFlowRuleFilter = useBuilderStore((s) => s.setFlowRuleFilter)
  const rules = useBuilderStore((s) => s.schema?.rules ?? [])

  const issuesByRule = useMemo(() => {
    if (!schema) return new Map()
    return groupIssuesByRule(analyseSurvey(schema))
  }, [schema, analyseSurvey])

  const questionTitles = useMemo(() => {
    const map = new Map<string, string>()
    if (!schema) return map
    flattenQuestions(schema).forEach((q) => {
      map.set(q.id, getQuestionReferenceLabel(q, schema))
    })
    return map
  }, [schema, flattenQuestions, getQuestionReferenceLabel])

  const filteredRules = useMemo(
    () =>
      [...rules]
        .sort((a, b) => a.priority - b.priority)
        .filter((r) => filter === 'all' || getRuleCategory(r) === filter)
        .filter((r) => ruleMatchesSearch(r, searchQuery, questionTitles)),
    [
      rules,
      filter,
      searchQuery,
      questionTitles,
      getRuleCategory,
      ruleMatchesSearch,
    ]
  )

  const handleNewRule = useCallback(() => {
    startFlowNewRule()
    onNewRule?.()
  }, [startFlowNewRule, onNewRule])

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <BuilderPanelHeader icon={GitBranch} title='规则' density='compact' />
      <div className='bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col'>
        <div className='border-border flex h-12 shrink-0 items-center gap-2 border-b px-3'>
          <div className='relative min-w-0 flex-1'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
            <Input
              className={cn(
                'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-8 pe-9 text-xs leading-none shadow-xs focus-visible:ring-2',
                'h-8 ps-8'
              )}
              placeholder='搜索规则…'
              value={searchQuery}
              onChange={(e) => setFlowSearchQuery(e.target.value)}
            />
          </div>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-8 shrink-0'
            onClick={handleNewRule}
            aria-label='新建规则'
          >
            <Plus className='size-4' />
          </Button>
        </div>

        <div className='border-border border-b px-3 py-2'>
          <Tabs
            value={filter}
            onValueChange={(v) => setFlowRuleFilter(v as RuleCategory | 'all')}
          >
            <TabsList className='grid h-8 w-full grid-cols-4'>
              {(
                [
                  { value: 'all', label: '全部' },
                  { value: 'visibility', label: '显隐' },
                  { value: 'jump', label: '跳题' },
                  { value: 'end', label: '结束' },
                ] as const
              ).map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className='text-xs leading-none'
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className='min-h-0 flex-1'>
          <div
            className={cn(
              'flex max-w-full min-w-0 flex-col gap-4 overflow-x-hidden',
              'p-3 pt-2'
            )}
          >
            <RulesList rules={filteredRules} issuesByRule={issuesByRule} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
