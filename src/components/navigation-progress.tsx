import { useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { cn } from 'cn'

type State = 'idle' | 'running' | 'finishing' | 'fading' | 'done'

export function NavigationProgress() {
  const isPending = useRouterState({ select: (s) => s.status === 'pending' })
  const [state, setState] = useState<State>('idle')
  const [progress, setProgress] = useState(0)

  const stateRef = useRef<State>('idle')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const updateState = (nextState: State) => {
    stateRef.current = nextState
    setState(nextState)
  }

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (isPending) {
      clearTimer()
      setProgress(0)
      updateState('running')

      timerRef.current = setInterval(() => {
        setProgress((prev) => prev + (90 - prev) * 0.1)
      }, 200)
    } else if (stateRef.current === 'running') {
      clearTimer()
      setProgress(100)
      updateState('finishing')
    }

    return clearTimer
  }, [isPending])

  // 第一个 onTransitionEnd：progress 跑到 100% 后触发 fade-out
  const handleBarTransitionEnd = () => {
    if (state === 'finishing') {
      updateState('fading')
    }
  }

  // 第二个 onTransitionEnd：fade-out 结束后彻底卸载
  const handleWrapperTransitionEnd = () => {
    if (state === 'fading') {
      updateState('done')
      setProgress(0)
    }
  }

  if (state === 'done' || state === 'idle') return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-[2px]',
        'pointer-events-none transition-opacity duration-300',
        state === 'fading' ? 'opacity-0' : 'opacity-100'
      )}
      onTransitionEnd={handleWrapperTransitionEnd}
    >
      <div
        className='bg-primary/40 h-full origin-left transition-transform duration-300 ease-out'
        style={{ transform: `scaleX(${progress / 100})` }}
        onTransitionEnd={handleBarTransitionEnd}
      />
    </div>
  )
}
