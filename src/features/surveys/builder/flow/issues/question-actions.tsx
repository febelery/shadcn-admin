import { Eye, EyeOff, GitBranch, Flag, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSurveyQuestions } from '../../edit/logic/use-survey-questions'
import { useBuilderStore } from '../../store'
import { useFlowContext, RULE_CATEGORY_LABEL } from '../context'

type Props = {
  questionId: string
}

export function QuestionActions({ questionId }: Props) {
  const {
    getRuleCategory,
    getRulesForQuestion,
    flattenQuestions,
    getQuestionNumberPrefix,
    getQuestionReferenceLabel,
  } = useFlowContext()

  const schema = useBuilderStore((s) => s.schema)
  const rules = useBuilderStore((s) => s.schema?.rules ?? [])
  const selectFlowRule = useBuilderStore((s) => s.selectFlowRule)
  const addDisplayRule = useBuilderStore((s) => s.addDisplayRule)
  const addSkipRule = useBuilderStore((s) => s.addSkipRule)
  const questions = useSurveyQuestions()

  const question = questions.find((q) => q.id === questionId)
  const idx = questions.findIndex((q) => q.id === questionId)
  const nextQuestion = questions[idx + 1]
  const related = getRulesForQuestion(rules, questionId)

  if (!question || !schema) return null

  const questionRef = getQuestionReferenceLabel(question, schema)
  const numberPrefix = getQuestionNumberPrefix(question, schema)
  const refShort = numberPrefix ?? `题目 ${idx + 1}`

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div>
        <p className='text-sm leading-none font-semibold tracking-tight'>
          题目快捷逻辑
        </p>
        <p
          className={cn(
            'text-muted-foreground text-xs leading-relaxed',
            'mt-1'
          )}
        >
          {questionRef}
        </p>
      </div>

      <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
        <p className='text-xs leading-none'>从此题添加规则</p>
        <div className='grid grid-cols-2 gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-auto flex-col gap-1 py-2'
            onClick={() =>
              addDisplayRule({
                targetQuestionId: questionId,
                when: '',
                action: 'show',
                name: `显示 ${refShort}`,
              })
            }
          >
            <Eye className='size-4' />
            <span className='text-xs leading-none'>显示本题</span>
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-auto flex-col gap-1 py-2'
            onClick={() =>
              addDisplayRule({
                targetQuestionId: questionId,
                when: '',
                action: 'hide',
                name: `隐藏 ${refShort}`,
              })
            }
          >
            <EyeOff className='size-4' />
            <span className='text-xs leading-none'>隐藏本题</span>
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-auto flex-col gap-1 py-2'
            onClick={() =>
              addSkipRule({
                sourceQuestionId: questionId,
                when: '',
                action: 'jump_to_question',
                targetQuestionId: nextQuestion?.id,
                name: `从 ${refShort} 跳转`,
              })
            }
            disabled={!nextQuestion}
          >
            <GitBranch className='size-4' />
            <span className='text-xs leading-none'>跳转到下一题</span>
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-auto flex-col gap-1 py-2'
            onClick={() =>
              addSkipRule({
                sourceQuestionId: questionId,
                when: '',
                action: 'end',
                name: `从 ${refShort} 结束`,
              })
            }
          >
            <Flag className='size-4' />
            <span className='text-xs leading-none'>结束问卷</span>
          </Button>
        </div>
      </div>

      <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
        <p className='text-xs leading-none'>相关规则 ({related.length})</p>
        {related.length === 0 ? (
          <p className='text-muted-foreground text-xs leading-relaxed'>
            本题暂无关联规则
          </p>
        ) : (
          <ul className='flex flex-col gap-1'>
            {related.map((r) => (
              <li key={r.id}>
                <button
                  type='button'
                  className='hover:bg-muted/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors'
                  onClick={() => selectFlowRule(r.id)}
                >
                  <span
                    className={cn(
                      'text-xs leading-none',
                      'rounded px-1 py-0.5',
                      getRuleCategory(r) === 'visibility' &&
                        'bg-sky-500/10 text-sky-700',
                      getRuleCategory(r) === 'jump' &&
                        'bg-primary/10 text-primary',
                      getRuleCategory(r) === 'end' &&
                        'bg-destructive/10 text-destructive'
                    )}
                  >
                    {RULE_CATEGORY_LABEL[getRuleCategory(r)]}
                  </span>
                  <span
                    className={cn(
                      'text-sm leading-relaxed',
                      'min-w-0 flex-1 truncate'
                    )}
                  >
                    {r.name}
                  </span>
                  <ChevronRight className='text-muted-foreground size-3.5 shrink-0' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {schema && flattenQuestions(schema).length > 0 ? (
        <p className='text-muted-foreground text-xs leading-relaxed'>
          提示：新建规则后请在右侧完善条件表达式与动作目标。
        </p>
      ) : null}
    </div>
  )
}
