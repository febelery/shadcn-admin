import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'

export interface ChatThinkingIndicatorProps {
  startTime?: number
}

/**
 * 正在思考动态指示器
 *
 * 独立叶子组件：内部定时器自驱秒数递增，完全隔离父层重渲染，
 * 采用等宽数字（tabular-nums）与优雅的中置点（·）分隔。
 */
export function ChatThinkingIndicator({
  startTime,
}: ChatThinkingIndicatorProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!startTime) return
    const update = () => {
      const secs = Math.max(
        0,
        Math.floor((performance.now() - startTime) / 1000)
      )
      setElapsedSeconds(secs)
    }
    update()
    const timer = setInterval(update, 500)
    return () => clearInterval(timer)
  }, [startTime])

  return (
    <Marker role='status' className='mx-1 w-fit py-2 select-none'>
      <MarkerIcon>
        <Sparkles className='text-primary/70 size-3.5 animate-pulse' />
      </MarkerIcon>
      <MarkerContent className='shimmer inline-flex items-center gap-2 text-xs'>
        <span className='text-muted-foreground font-medium'>思考中</span>
        <span className='text-muted-foreground/30 font-bold'>·</span>
        <span className='text-muted-foreground/80 font-mono font-medium tabular-nums'>
          {elapsedSeconds}s
        </span>
      </MarkerContent>
    </Marker>
  )
}
