import { useCallback, useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RuleEditorPanel } from '../../edit/logic/rule-editor'
import { useBuilderStore } from '../../store'
import type { StaticIssue, RuleActionType } from '../../types'
import { useFlowContext, type RuleCategory } from '../context'
import { RuleValidation } from './rule-validation'

function actionTypesForCategory(category: RuleCategory): RuleActionType[] {
  switch (category) {
    case 'visibility':
      return ['show', 'hide']
    case 'jump':
      return ['jump_to_question']
    case 'end':
      return ['end']
    default:
      return ['show', 'hide', 'jump_to_question', 'end']
  }
}

type Props = {
  ruleIssues: StaticIssue[]
}

/** 流程右栏 · 规则编辑：校验常驻顶部，类型 Tab 切换动作 */
export function RuleEditorSection({ ruleIssues }: Props) {
  const { getRuleCategory, createRuleAction, flattenQuestions } =
    useFlowContext()
  const schema = useBuilderStore((s) => s.schema)
  const editingRuleId = useBuilderStore((s) => s.editingRuleId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const updateRule = useBuilderStore((s) => s.updateRule)

  const rule = schema?.rules.find((r) => r.id === editingRuleId)
  const ruleCategory = rule ? getRuleCategory(rule) : 'other'

  const [typeTab, setTypeTab] = useState<RuleCategory>('visibility')

  useEffect(() => {
    if (!editingRuleId) return
    setTypeTab(ruleCategory === 'other' ? 'visibility' : ruleCategory)
  }, [editingRuleId, ruleCategory])

  const applyCategory = useCallback(
    (category: RuleCategory) => {
      if (!rule || !schema) return
      const questions = flattenQuestions(schema)
      const firstId = questions[0]?.id
      const source = selectedElementId ?? firstId
      const sourceIdx = source
        ? questions.findIndex((q: any) => q.id === source)
        : -1
      const nextId =
        sourceIdx >= 0 ? questions[sourceIdx + 1]?.id : questions[1]?.id

      if (category === 'visibility') {
        updateRule(rule.id, {
          actions: [
            createRuleAction('show', rule.actions[0]?.target ?? firstId),
          ],
          name: rule.name === '新规则' ? '显示题目' : rule.name,
        })
        return
      }

      if (category === 'jump') {
        updateRule(rule.id, {
          actions: [
            createRuleAction(
              'jump_to_question',
              rule.actions[0]?.target ?? nextId ?? firstId
            ),
          ],
          name: rule.name === '新规则' ? '跳转到题目' : rule.name,
        })
        return
      }

      updateRule(rule.id, {
        actions: [createRuleAction('end')],
        name: rule.name === '新规则' ? '结束问卷' : rule.name,
      })
    },
    [
      rule,
      schema,
      selectedElementId,
      updateRule,
      flattenQuestions,
      createRuleAction,
    ]
  )

  const handleTypeChange = (value: string) => {
    const next = value as RuleCategory
    setTypeTab(next)
    applyCategory(next)
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <RuleValidation issues={ruleIssues} compact />
      <Tabs
        value={typeTab}
        onValueChange={handleTypeChange}
        className='shrink-0 px-4 pt-2'
      >
        <TabsList className='grid h-8 w-full grid-cols-3'>
          {(
            [
              { value: 'visibility', label: '显隐' },
              { value: 'jump', label: '跳题' },
              { value: 'end', label: '结束' },
            ] as const
          ).map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className='text-xs leading-none'
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <RuleEditorPanel
        className='min-h-0 flex-1'
        hideHeader
        allowedActionTypes={actionTypesForCategory(typeTab)}
        hideFooterNote
      />
    </div>
  )
}
