import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useBuilderStore } from '../builder-session'

type Props = {
  className?: string
}

export function Toolbar({ className }: Props) {
  const showJump = useBuilderStore((s) => s.flowShowJumpEdges)
  const showVisibility = useBuilderStore((s) => s.flowShowVisibilityEdges)
  const setShowJump = useBuilderStore((s) => s.setFlowShowJumpEdges)
  const setShowVisibility = useBuilderStore((s) => s.setFlowShowVisibilityEdges)
  const searchQuery = useBuilderStore((s) => s.flowCanvasSearchQuery)
  const setSearchQuery = useBuilderStore((s) => s.setFlowCanvasSearchQuery)

  return (
    <div
      className={cn(
        'border-border flex h-12 min-w-0 shrink-0 items-center gap-2 overflow-x-auto border-b px-3',
        'gap-3',
        className
      )}
    >
      <div className={cn('relative', 'w-[min(100%,12rem)] shrink-0 sm:w-44')}>
        <Search className='text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2' />
        <Input
          className='border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-8 pe-9 text-xs leading-none shadow-xs focus-visible:ring-2'
          placeholder='搜索题目…'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className='flex shrink-0 items-center gap-3'>
        <div className='flex items-center gap-1.5'>
          <Switch
            id='flow-jump-edges'
            checked={showJump}
            onCheckedChange={setShowJump}
          />
          <Label
            htmlFor='flow-jump-edges'
            className={cn('text-xs leading-none', 'whitespace-nowrap')}
          >
            跳题连线
          </Label>
        </div>
        <div className='flex items-center gap-1.5'>
          <Switch
            id='flow-vis-edges'
            checked={showVisibility}
            onCheckedChange={setShowVisibility}
          />
          <Label
            htmlFor='flow-vis-edges'
            className={cn('text-xs leading-none', 'whitespace-nowrap')}
          >
            显隐连线
          </Label>
        </div>
      </div>

      <span
        className={cn(
          'text-xs leading-none',
          'text-muted-foreground hidden shrink-0 whitespace-nowrap xl:inline'
        )}
      >
        滚轮缩放 · 拖拽平移 · 全览查看整图
      </span>
    </div>
  )
}
