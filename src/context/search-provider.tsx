import { createContext, use, useEffect, useState, Suspense } from 'react'
import { CommandMenu } from '@/components/command-menu'
import { ErrorBoundary } from '@/components/error-boundary'

type SearchContextType = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchContext = createContext<SearchContextType | null>(null)

type SearchProviderProps = {
  children: React.ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <SearchContext value={{ open, setOpen }}>
      {children}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <CommandMenu />
        </Suspense>
      </ErrorBoundary>
    </SearchContext>
  )
}

export const useSearch = () => {
  const searchContext = use(SearchContext)

  if (!searchContext) {
    throw new Error('useSearch has to be used within SearchProvider')
  }

  return searchContext
}
