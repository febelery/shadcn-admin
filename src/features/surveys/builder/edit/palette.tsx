import { useMemo, useState, type ReactNode } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ChevronRight, LayoutGrid, Search, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from '@/components/ui/command'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBuilderStatic } from '../context'
import { PALETTE_DRAG } from '../shared/dnd-types'
import { BuilderPanelHeader } from '../shared/panel-header'
import { useBuilderStore } from '../store'
import {
  LAYOUT_MANIFESTS,
  QUESTION_CATEGORIES,
  QUESTION_MANIFESTS,
} from '../../shared/question-registry'
import type { QuestionType, QuestionManifest, PaletteTypeId } from '../types'

type PaletteItem =
  | QuestionManifest
  | { type: string; label: string; icon: LucideIcon; category: string }

type PaletteRowItem = {
  type: PaletteTypeId
  label: string
  icon: LucideIcon
  category: string
}

function isCreatableQuestion(item: QuestionManifest): boolean {
  // dynamic_panel 只有数据层/旧数据展示能力，没有模板编辑器，先从新建入口隔离。
  return item.type !== 'dynamic_panel'
}

function paletteData(item: PaletteRowItem) {
  const isLayout = item.type === 'divider' || item.type === 'html_block'
  return {
    type: PALETTE_DRAG,
    questionType: isLayout ? undefined : (item.type as QuestionType),
    layoutType: isLayout ? item.type : undefined,
  } as const
}

function PaletteItemHelpContent({
  label,
  type,
}: {
  label: string
  type: PaletteTypeId
}) {
  const { getQuestionTypeHint, hasQuestionTypePreview, QuestionTypePreview } =
    useBuilderStatic()
  const hint = getQuestionTypeHint(type)
  const showPreview = hasQuestionTypePreview(type)

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5'>
        <p className='text-sm leading-none font-semibold tracking-tight'>
          {label}
        </p>
        <p className='text-muted-foreground text-sm leading-relaxed'>{hint}</p>
      </div>
      {showPreview ? <QuestionTypePreview type={type} /> : null}
    </div>
  )
}

function PaletteItemRow({
  item,
  disabled,
  onAdd,
}: {
  item: PaletteRowItem
  disabled?: boolean
  onAdd: () => void
}) {
  const { hasQuestionTypePreview } = useBuilderStatic()
  const isLayout = item.type === 'divider' || item.type === 'html_block'
  const id = `palette-${isLayout ? 'l' : 'q'}-${item.type}`
  const Icon = item.icon

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: paletteData(item),
    disabled,
  })

  const style = isDragging ? { opacity: 0 } : undefined
  const showHelp = !isDragging && !disabled

  const typeIcon = (
    <span className='bg-muted text-foreground border-border/50 group-hover:border-border group-hover:bg-accent group-hover:text-accent-foreground flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors'>
      <Icon className='size-3.5' />
    </span>
  )

  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      ref={setNodeRef}
      style={style}
      disabled={disabled}
      onClick={onAdd}
      className='group text-foreground hover:bg-muted/60 hover:text-foreground h-9 w-full justify-start gap-2 rounded-md px-2 font-normal transition-colors duration-150'
      {...listeners}
      {...attributes}
    >
      {showHelp ? (
        <HoverCard openDelay={200} closeDelay={80}>
          <HoverCardTrigger asChild>
            <span
              className='bg-muted text-foreground border-border/50 group-hover:border-border group-hover:bg-accent group-hover:text-accent-foreground flex size-7 shrink-0 cursor-help items-center justify-center rounded-md border transition-colors'
              aria-label={`${item.label} 说明`}
            >
              <Icon className='size-3.5' />
            </span>
          </HoverCardTrigger>
          <HoverCardContent
            side='bottom'
            align='start'
            sideOffset={6}
            collisionPadding={8}
            className={cn(hasQuestionTypePreview(item.type) ? 'w-80' : 'w-72')}
          >
            <PaletteItemHelpContent label={item.label} type={item.type} />
          </HoverCardContent>
        </HoverCard>
      ) : (
        typeIcon
      )}
      <span className='min-w-0 flex-1 truncate text-left text-xs leading-none font-medium'>
        {item.label}
      </span>
    </Button>
  )
}

function toRowItem(item: PaletteItem): PaletteRowItem {
  return {
    type: item.type as PaletteTypeId,
    label: item.label,
    icon: item.icon,
    category: item.category,
  }
}

function PaletteCategory({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  if (count === 0) return null

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='group/collapsible'
    >
      <CollapsibleTrigger
        className={cn(
          'text-muted-foreground text-xs font-medium tracking-wider uppercase',
          'flex h-8 w-full items-center gap-1.5 rounded-md px-2',
          'hover:bg-muted/50 hover:text-foreground transition-colors duration-150'
        )}
      >
        <ChevronRight className='size-3.5 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90' />
        <span className='truncate'>{title}</span>
        <span className='text-muted-foreground ms-auto tabular-nums'>
          {count}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className='grid grid-cols-2 gap-1.5 px-2'>
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

type Props = {
  className?: string
  /** 移动端 Sheet 内点击添加题型后关闭 */
  onNavigate?: () => void
}

export function QuestionPalette({ className, onNavigate }: Props = {}) {
  const [query, setQuery] = useState('')
  const sectionId = useBuilderStore((s) => s.selectedSectionId)
  const disabled = !sectionId

  const { matchesPaletteSearch } = useBuilderStatic()

  const filtered = useMemo(() => {
    const questionManifests = QUESTION_MANIFESTS.filter(isCreatableQuestion)
    const match = (item: PaletteItem) => matchesPaletteSearch(item, query)

    const byCategory = (cat: string) =>
      questionManifests.filter((m) => m.category === cat && match(m))

    const layout = LAYOUT_MANIFESTS.filter(match)
    const categories = QUESTION_CATEGORIES.filter((c) => c !== '布局')
      .map((cat) => ({ cat, items: byCategory(cat) }))
      .filter(({ items }) => items.length > 0)

    return {
      categories,
      layout,
      flat: [...questionManifests.filter(match), ...layout] as PaletteItem[],
      total: questionManifests.filter(match).length + layout.length,
      searching: Boolean(query.trim()),
    }
  }, [
    query,
    matchesPaletteSearch,
  ])

  const addItem = (item: PaletteItem) => {
    if (!sectionId) return
    const isLayout = item.type === 'divider' || item.type === 'html_block'
    if (isLayout) {
      useBuilderStore
        .getState()
        .addLayout(sectionId, item.type as 'divider' | 'html_block')
    } else {
      useBuilderStore
        .getState()
        .addQuestion(sectionId, item.type as QuestionType)
    }
    onNavigate?.()
  }

  const renderRow = (item: PaletteItem) => (
    <PaletteItemRow
      key={`${item.type}-${item.label}`}
      item={toRowItem(item)}
      disabled={disabled}
      onAdd={() => addItem(item)}
    />
  )

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <BuilderPanelHeader icon={LayoutGrid} title='题型' />

      <div className='bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col'>
        <Command
          shouldFilter={false}
          className='flex min-h-0 flex-1 flex-col rounded-none bg-transparent'
        >
          <div className='border-border flex h-12 shrink-0 items-center gap-2 border-b px-3'>
            <div className='relative'>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='搜索题型'
                className='border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-8 pe-9 text-xs leading-none shadow-xs focus-visible:ring-2'
              />
              <Search
                className='text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2'
                aria-hidden
              />
            </div>
          </div>

          <ScrollArea className='min-h-0 flex-1'>
            <CommandList className='max-h-none px-0 py-2'>
              {disabled ? (
                <div className='px-2 pb-2'>
                  <Alert className='py-2.5'>
                    <AlertDescription className='text-muted-foreground text-xs leading-relaxed'>
                      请先在画布选中页面，再添加题型
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}

              {filtered.total === 0 ? (
                <CommandEmpty className='text-muted-foreground text-xs leading-relaxed'>
                  无匹配题型
                </CommandEmpty>
              ) : filtered.searching ? (
                <>
                  {filtered.categories
                    .filter(({ items }) => items.length > 0)
                    .map(({ cat, items }) => (
                      <CommandGroup key={cat} heading={cat} className='px-0'>
                        <div className='grid grid-cols-2 gap-1.5 px-2'>
                          {items.map(renderRow)}
                        </div>
                      </CommandGroup>
                    ))}
                  {filtered.layout.length > 0 ? (
                    <CommandGroup heading='布局' className='px-0'>
                      <div className='grid grid-cols-2 gap-1.5 px-2'>
                        {filtered.layout.map(renderRow)}
                      </div>
                    </CommandGroup>
                  ) : null}
                </>
              ) : (
                <div className='flex flex-col gap-2 px-1'>
                  {filtered.categories.map(({ cat, items }) => (
                    <PaletteCategory key={cat} title={cat} count={items.length}>
                      {items.map(renderRow)}
                    </PaletteCategory>
                  ))}
                  {filtered.layout.length > 0 ? (
                    <PaletteCategory
                      title='布局'
                      count={filtered.layout.length}
                    >
                      {filtered.layout.map(renderRow)}
                    </PaletteCategory>
                  ) : null}
                </div>
              )}
            </CommandList>
          </ScrollArea>
        </Command>
      </div>
    </div>
  )
}
