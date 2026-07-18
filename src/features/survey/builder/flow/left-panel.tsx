import { useMemo } from 'react'
import { GitBranch, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ruleMatchesSearch } from '@/features/survey/core/logic/rule-meta'
import { useBuilderStore } from '../builder-session'
import { useRuleAuthoring } from '../session/rule-authoring'
import { BuilderPanelHeader } from '../shared/panel-header'
import type { FlowProjection } from './projection'
import { RulesList } from './rule-list'

const EMPTY_RULES: FlowProjection['rules'] = []
const EMPTY_QUESTIONS: FlowProjection['questions'] = []
const EMPTY_QUESTION_TITLES: FlowProjection['questionTitles'] = new Map()

type Props = {
  projection: FlowProjection | null
  className?: string
}

/** 流程模式 · 左栏：纯规则索引（搜索 / 筛选 / 列表） */
export function LeftPanel({ projection, className }: Props) {
  const searchQuery = useBuilderStore((s) => s.flowRuleSearchQuery)
  const setFlowSearchQuery = useBuilderStore((s) => s.setFlowRuleSearchQuery)
  const { openNewRule } = useRuleAuthoring()
  const rules = projection?.rules ?? EMPTY_RULES
  const questions = projection?.questions ?? EMPTY_QUESTIONS
  const questionTitles = projection?.questionTitles ?? EMPTY_QUESTION_TITLES

  const filteredRules = useMemo(
    () =>
      rules.filter((rule) =>
        ruleMatchesSearch(rule, searchQuery, questionTitles)
      ),
    [rules, searchQuery, questionTitles]
  )

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
            onClick={openNewRule}
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
            <RulesList
              rules={filteredRules}
              questionTitles={questionTitles}
              issuesByRule={projection?.issuesByRule}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
