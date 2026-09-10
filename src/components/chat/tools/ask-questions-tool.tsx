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
  QuestionnaireProgress,
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

  return (
    <div className='bg-card my-2 w-full max-w-xl rounded-2xl border p-5 shadow-xs transition-all'>
      <Questionnaire
        items={QUESTIONNAIRE_ITEMS}
        shortcuts='letters'
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
        <div className='mb-4 flex items-center justify-between border-b pb-3'>
          <div className='flex items-center gap-2'>
            <span className='bg-primary size-2 rounded-full' />
            <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              原型需求问卷
            </span>
          </div>
          <QuestionnaireProgress className='text-muted-foreground font-mono text-xs font-medium' />
        </div>

        <QuestionnaireItem name='direction' required className='space-y-3.5'>
          <div>
            <QuestionnaireTitle className='text-foreground text-base font-semibold tracking-tight'>
              接下来我们应该制作什么原型？
            </QuestionnaireTitle>
            <QuestionnaireDescription className='text-muted-foreground mt-1 text-xs'>
              选择一个最贴近您需求的方向，或在下方输入自定义内容。
            </QuestionnaireDescription>
          </div>
          <QuestionnaireChoices className='flex flex-col gap-2.5 pt-1'>
            {QUESTIONNAIRE_ITEMS[0].choices.map((choice) => (
              <QuestionnaireChoice key={choice.value} value={choice.value}>
                {choice.label}
              </QuestionnaireChoice>
            ))}
            <QuestionnaireInput
              aria-label='其他回答'
              placeholder='输入其他自定义方向…'
              className='mt-1'
            />
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem name='detail' className='space-y-3.5'>
          <div>
            <QuestionnaireTitle className='text-foreground text-base font-semibold tracking-tight'>
              需要包含多少细节？
            </QuestionnaireTitle>
            <QuestionnaireDescription className='text-muted-foreground mt-1 text-xs'>
              定义原型的颗粒度与流程覆盖面，非必填。
            </QuestionnaireDescription>
          </div>
          <QuestionnaireChoices className='flex flex-col gap-2.5 pt-1'>
            {QUESTIONNAIRE_ITEMS[1].choices.map((choice) => (
              <QuestionnaireChoice key={choice.value} value={choice.value}>
                {choice.label}
              </QuestionnaireChoice>
            ))}
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireActions className='mt-6 border-t pt-4'>
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
