import React from 'react'
import { CommandMenu } from '@/components/command-menu'

interface SearchContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchContext = React.createContext<SearchContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export function SearchProvider({ children }: Props) {
  const [open, setOpen] = React.useState(false)

  // 添加key确保热更新时完全重新渲染
  const memoizedValue = React.useMemo(() => ({ open, setOpen }), [open])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  if (!children) {
    return null
  }

  return (
    <SearchContext.Provider value={memoizedValue}>
      {children}
      <CommandMenu />
    </SearchContext.Provider>
  )
}

// 修改useSearch hook使其在热更新时更稳定
export const useSearch = () => {
  const searchContext = React.useContext(SearchContext)

  if (!searchContext) {
    // 开发环境下提供警告而非错误
    if (process.env.NODE_ENV === 'development') {
      console.warn('useSearch在SearchContext.Provider外部使用，返回默认值')
      return { open: false, setOpen: () => {} }
    }
    throw new Error('useSearch has to be used within <SearchContext.Provider>')
  }

  return searchContext
}
