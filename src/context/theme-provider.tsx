import { createContext, use, useCallback, useEffect, useState } from 'react'
import { THEME_COOKIE_NAME, COOKIE_MAX_AGE } from '@/constants'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

const FALLBACK_THEME = 'system' satisfies Theme

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  defaultTheme: Theme
  setTheme: (theme: Theme) => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyThemeToDocument(resolved: ResolvedTheme) {
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
}

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = FALLBACK_THEME,
  storageKey = THEME_COOKIE_NAME,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (getCookie(storageKey) as Theme) ?? defaultTheme
  )

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(theme)
  )

  useEffect(() => {
    applyThemeToDocument(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (theme !== 'system') {
      setResolvedTheme(theme)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemChange = () => setResolvedTheme(getSystemTheme())

    setResolvedTheme(getSystemTheme())
    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [theme])

  const setTheme = useCallback(
    (next: Theme) => {
      setCookie(storageKey, next, COOKIE_MAX_AGE)
      setThemeState(next)
    },
    [storageKey]
  )

  const resetTheme = useCallback(() => {
    removeCookie(storageKey)
    setThemeState(FALLBACK_THEME)
  }, [storageKey])

  return (
    <ThemeContext
      value={{ theme, resolvedTheme, defaultTheme, setTheme, resetTheme }}
    >
      {children}
    </ThemeContext>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>')
  return ctx
}
