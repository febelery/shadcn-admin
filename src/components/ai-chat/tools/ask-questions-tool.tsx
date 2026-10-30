import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire'
import type { ChatPart, ToolPartContext } from './types'

const QUESTIONNAIRE_ITEMS = [
  {
    name: 'direction',
    required: true,
    choices: [
      { value: 'delegation', label: '任务委派 (Delegation)' },
      { value: 'questions', label: '提问引导 (Question prompts)' },
      { value: 'both', label: '两者结合 (Both together)' },
    ],
  },
  {
    name: 'detail',
    required: false,
    choices: [
      { value: 'focused', label: '核心聚焦 (Focused)' },
      { value: 'complete', label: '完整流程 (Complete flow)' },
    ],
  },
] as const

/**
 * 需求问卷交互工具 (askQuestions)
 * 仅在 state 为 input-available 时展示交互式卡片
 */
export function renderAskQuestionsTool(
  part: ChatPart,
  context: ToolPartContext
) {
  if (part.type !== 'tool-askQuestions' || part.state !== 'input-available') {
    return null
  }

  return <AskQuestionsCard part={part} context={context} />
}

function AskQuestionsCard({
  part,
  context,
}: {
  part: Extract<ChatPart, { type: 'tool-askQuestions' }>
  context: ToolPartContext
}) {
  const [step, setStep] = useState(0)
  const total = QUESTIONNAIRE_ITEMS.length
  const percent = Math.round(((step + 1) / total) * 100)

  return (
    <div className='bg-card w-full max-w-xl rounded-xl border p-5'>
      <div className='mb-4 flex items-center gap-3'>
        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          {step + 1} / {total}
        </span>
        <Progress
          value={percent}
          aria-label='问卷进度'
          className='bg-primary/15 h-1'
        />
      </div>
      <Questionnaire
        items={QUESTIONNAIRE_ITEMS}
        shortcuts='letters'
        onItemChange={(item) => {
          const index = QUESTIONNAIRE_ITEMS.findIndex((q) => q.name === item)
          if (index >= 0) setStep(index)
        }}
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          context.addToolOutput({
            tool: 'askQuestions',
            toolCallId: part.toolCallId,
            output: {
              answers: {
                direction: String(
                  data.get('direction') ?? data.get('direction-input') ?? ''
                ),
                detail: String(data.get('detail') ?? ''),
              },
            },
          })
        }}
      >
        <QuestionnaireItem name='direction' required className='gap-3'>
          <div>
            <QuestionnaireTitle className='text-base font-medium'>
              接下来我们应该制作什么原型？
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              选择一个最贴近您需求的方向，或在下方输入自定义内容。
            </QuestionnaireDescription>
          </div>
          <QuestionnaireChoices className='gap-2'>
            {QUESTIONNAIRE_ITEMS[0].choices.map((choice) => (
              <QuestionnaireChoice key={choice.value} value={choice.value}>
                {choice.label}
              </QuestionnaireChoice>
            ))}
            <QuestionnaireInput
              aria-label='其他回答'
              placeholder='输入其他自定义方向…'
            />
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem name='detail' className='gap-3'>
          <div>
            <QuestionnaireTitle className='text-base font-medium'>
              需要包含多少细节？
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              定义原型的颗粒度与流程覆盖面，非必填。
            </QuestionnaireDescription>
          </div>
          <QuestionnaireChoices className='gap-2'>
            {QUESTIONNAIRE_ITEMS[1].choices.map((choice) => (
              <QuestionnaireChoice key={choice.value} value={choice.value}>
                {choice.label}
              </QuestionnaireChoice>
            ))}
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireActions className='mt-5'>
          <div className='flex items-center gap-2'>
            <QuestionnairePrevious>上一步</QuestionnairePrevious>
            <QuestionnaireSkip>跳过此题</QuestionnaireSkip>
          </div>
          <div className='flex items-center gap-2'>
            <QuestionnaireNext>下一步</QuestionnaireNext>
            <QuestionnaireSubmit>完成并提交</QuestionnaireSubmit>
          </div>
        </QuestionnaireActions>
      </Questionnaire>
    </div>
  )
}
