import { useCallback, useRef } from 'react'
import { Moon, Sun } from 'lucide-react'
import { flushSync } from 'react-dom'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'

interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<'button'> {
  duration?: number
  showLabel?: boolean
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  showLabel = false,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isDark = resolvedTheme === 'dark'

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    // 切换逻辑：根据当前主题决定下一个主题
    // system -> 根据系统偏好切换到对应的 light/dark
    // light -> dark
    // dark -> light
    let nextTheme: 'light' | 'dark' | 'system'
    if (theme === 'system') {
      // 如果当前是 system，根据系统偏好切换到相反的主题
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      nextTheme = systemPrefersDark ? 'light' : 'dark'
    } else if (theme === 'light') {
      nextTheme = 'dark'
    } else {
      // theme === 'dark'
      nextTheme = 'light'
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  }, [theme, setTheme, duration])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isDark ? <Moon size={16} className='size-4 shrink-0' /> : <Sun size={16} className='size-4 shrink-0' />}
      {showLabel && <span className='font-normal text-sm'>切换主题</span>}
      <span className='sr-only'>Toggle theme</span>
    </button>
  )
}
