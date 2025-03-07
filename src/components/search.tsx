import { IconSearch } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-context'
import { Button } from './ui/button'
import { Label } from '@/components/ui/label'
import { useSidebar } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface Props {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({ className = '', placeholder = '搜索' }: Props) {
  const { setOpen } = useSearch()
  const { state } = useSidebar()
  
  if (state === 'collapsed') {
    return (
      <>
      <Button
        variant='ghost'
        size="icon"
        className="h-8 w-8 rounded-md flex items-center justify-center"
        onClick={() => setOpen(true)}
      >
        <IconSearch size={18} className="text-muted-foreground" />
        <span className="sr-only">搜索</span>
      </Button>
      <Separator />
      </>
    )
  }
  
  return (
    <div className={cn('relative w-full', className)}>
      <Label htmlFor="search" className="sr-only">
        搜索
      </Label>
      <Button
        variant='outline'
        id="search"
        className={cn(
          'bg-background border text-muted-foreground hover:bg-accent/50 relative h-9 w-full justify-start rounded-md text-sm font-normal pl-9 pr-3',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <IconSearch
          size={18}
          aria-hidden='true'
          className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-muted-foreground'
        />
        <span className="truncate">{placeholder}</span>
        <kbd className='bg-muted pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 h-5 flex items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
    </div>
  )
}
