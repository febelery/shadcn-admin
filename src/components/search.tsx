import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-context'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Button } from './ui/button'

interface Props {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({ className = '', placeholder = '搜索' }: Props) {
  const { setOpen } = useSearch()

  return (
    <div className={cn('relative w-full', className)}>
      <div className='group-data-[state=expanded]:hidden'>
        <Button
          variant='ghost'
          size='icon'
          className='flex h-8 w-8 items-center justify-center rounded-md'
          onClick={() => setOpen(true)}
        >
          <SearchIcon size={18} className='text-muted-foreground' />
          <span className='sr-only'>{placeholder}</span>
        </Button>
        <Separator />
      </div>
      <div className='group-data-[state=collapsed]:hidden'>
        <Label htmlFor='search' className='sr-only'>
          搜索
        </Label>
        <Button
          variant='outline'
          id='search'
          className={cn(
            'bg-background text-muted-foreground hover:bg-accent/50 relative h-9 w-full justify-start rounded-md border pr-3 pl-9 text-sm font-normal',
            className
          )}
          onClick={() => setOpen(true)}
        >
          <SearchIcon
            size={18}
            aria-hidden='true'
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 select-none'
          />
          <span className='truncate'>{placeholder}</span>
          <kbd className='bg-muted pointer-events-none absolute top-1/2 right-1.5 flex h-5 -translate-y-1/2 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none'>
            <span className='text-xs'>⌘</span>K
          </kbd>
        </Button>
      </div>
    </div>
  )
}
