import { MessageCircleDashedIcon } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export const DEFAULT_SUGGESTIONS = [
  '你好，请介绍一下你能做什么',
  '帮我分析当前项目的架构',
  '请告诉我如何更高效地使用这个系统',
  '我需要一些帮助',
]

export function ChatEmpty() {
  return (
    <Empty className='h-full w-full'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <MessageCircleDashedIcon />
        </EmptyMedia>
        <EmptyTitle>今天有什么我可以帮你的？</EmptyTitle>
        <EmptyDescription>
          支持深度思考推理、交互式问卷引导、来源引用与敏感操作人工审批。
          发送上方任意建议开始。
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
