import { useMemo, useCallback } from 'react'
import { GitBranch, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { analyseSurvey } from '@/features/survey/core/expression/analyzer'
import { ruleMatchesSearch } from '@/features/survey/core/logic/rule-meta'
import { flattenQuestions } from '@/features/survey/core/schema-defaults'
import { getQuestionReferenceLabel } from '@/features/survey/shared/question-numbering'
import { BuilderPanelHeader } from '../shared/panel-header'
import { useBuilderStore } from '../store'
import { groupIssuesByRule } from './issues/issue-utils'
import { RulesList } from './rule-list'

type Props = {
  className?: string
  /** 点击新建时回调（移动端打开右侧 Sheet） */
  onNewRule?: () => void
}

/** 流程模式 · 左栏：纯规则索引（搜索 / 筛选 / 列表） */
export function LeftPanel({ className, onNewRule }: Props) {
  const schema = useBuilderStore((s) => s.schema)
  const searchQuery = useBuilderStore((s) => s.flowRuleSearchQuery)
  const setFlowSearchQuery = useBuilderStore((s) => s.setFlowRuleSearchQuery)
  const startFlowNewRule = useBuilderStore((s) => s.startFlowNewRule)
  const rules = useBuilderStore((s) => s.schema?.rules ?? [])

  const issuesByRule = useMemo(() => {
    if (!schema) return new Map()
    return groupIssuesByRule(analyseSurvey(schema))
  }, [schema])

  const questionTitles = useMemo(() => {
    const map = new Map<string, string>()
    if (!schema) return map
    flattenQuestions(schema).forEach((q) => {
      map.set(q.id, getQuestionReferenceLabel(q, schema))
    })
    return map
  }, [schema])

  const questions = useMemo(
    () => (schema ? flattenQuestions(schema) : []),
    [schema]
  )

  const filteredRules = useMemo(
    () =>
      [...rules]
        .sort((a, b) => a.priority - b.priority)
        .filter((r) => ruleMatchesSearch(r, searchQuery, questionTitles)),
    [rules, searchQuery, questionTitles]
  )

  const createDraftRule = useCallback(() => {
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
          <InputGroup className='h-8 flex-1'>
            <InputGroupAddon align='inline-start'>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder='搜索规则…'
              value={searchQuery}
              className='text-xs leading-none'
              onChange={(e) => setFlowSearchQuery(e.target.value)}
            />
          </InputGroup>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-8 shrink-0'
            onClick={createDraftRule}
            disabled={questions.length < 1}
            aria-label='新建规则'
          >
            <Plus className='size-4' />
          </Button>
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
