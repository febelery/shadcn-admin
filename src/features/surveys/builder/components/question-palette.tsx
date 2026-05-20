import { useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, LayoutGrid } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  LAYOUT_MANIFESTS,
  QUESTION_CATEGORIES,
  QUESTION_MANIFESTS,
  type QuestionManifest,
} from '../../shared/question-registry'
import { getQuestionTypeHint } from '../../shared/question-type-hints'
import {
  PaletteItemRow,
  type PaletteRowItem,
} from './palette-item-row'
import {
  builderPanelPalette,
  builderPanelScroll,
  builderPaletteGrid,
} from '../ui'
import { useBuilderStore } from '../store'
import { BuilderPanelHeader } from './builder-panel-header'
import type { QuestionType } from '../../core/types'

type PaletteItem = QuestionManifest | (typeof LAYOUT_MANIFESTS)[number]

function toRowItem(item: PaletteItem): PaletteRowItem {
  return {
    type: item.type,
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
    <Collapsible open={open} onOpenChange={setOpen} className='group/collapsible'>
      <CollapsibleTrigger
        className={cn(
          'text-muted-foreground flex h-7 w-full items-center gap-1 rounded-md px-2 text-xs font-medium',
          'hover:bg-muted/50 hover:text-foreground transition-colors'
        )}
      >
        <ChevronRight className='size-3.5 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90' />
        <span className='truncate'>{title}</span>
        <span className='ms-auto tabular-nums opacity-60'>{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className={builderPaletteGrid}>
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (item: PaletteItem) => {
      if (!q) return true
      const hint = getQuestionTypeHint(item.type)
      return (
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        hint.toLowerCase().includes(q)
      )
    }

    const byCategory = (cat: string) =>
      QUESTION_MANIFESTS.filter((m) => m.category === cat && match(m))

    const layout = LAYOUT_MANIFESTS.filter(match)

    return {
      categories: QUESTION_CATEGORIES.filter((c) => c !== '布局').map(
        (cat) => ({ cat, items: byCategory(cat) })
      ),
      layout,
      flat: [...QUESTION_MANIFESTS.filter(match), ...layout] as PaletteItem[],
      total: QUESTION_MANIFESTS.filter(match).length + layout.length,
      searching: Boolean(q),
    }
  }, [query])

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
    <aside className={cn(builderPanelPalette, className)}>
      <BuilderPanelHeader icon={LayoutGrid} title='题型库' />

      <Command
        shouldFilter={false}
        className='bg-transparent flex min-h-0 flex-1 flex-col rounded-none'
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder='搜索题型…'
          className='h-8 border-0 bg-transparent shadow-none focus-visible:ring-0'
        />

        <ScrollArea className={builderPanelScroll}>
          <CommandList className='max-h-none px-0 py-2'>
            {disabled ? (
              <div className='px-2 pb-2'>
                <Alert className='py-2'>
                  <AlertDescription className='text-muted-foreground text-[11px] leading-snug'>
                    请先在画布选中页面，再添加题型
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            {filtered.total === 0 ? (
              <CommandEmpty className='text-muted-foreground text-xs'>
                无匹配题型
              </CommandEmpty>
            ) : filtered.searching ? (
              <>
                {filtered.categories
                  .filter(({ items }) => items.length > 0)
                  .map(({ cat, items }) => (
                    <CommandGroup key={cat} heading={cat} className='px-0'>
                      <div className={builderPaletteGrid}>
                        {items.map(renderRow)}
                      </div>
                    </CommandGroup>
                  ))}
                {filtered.layout.length > 0 ? (
                  <CommandGroup heading='布局' className='px-0'>
                    <div className={builderPaletteGrid}>
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
                  <PaletteCategory title='布局' count={filtered.layout.length}>
                    {filtered.layout.map(renderRow)}
                  </PaletteCategory>
                ) : null}
              </div>
            )}
          </CommandList>
        </ScrollArea>
      </Command>
    </aside>
  )
}
