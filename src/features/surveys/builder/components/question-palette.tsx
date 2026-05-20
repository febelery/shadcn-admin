import { useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, LayoutGrid, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { QuestionType } from '../../core/types'
import {
  LAYOUT_MANIFESTS,
  QUESTION_CATEGORIES,
  QUESTION_MANIFESTS,
  type QuestionManifest,
} from '../../shared/question-registry'
import { matchesPaletteSearch } from '../../shared/question-type-hints'
import { useBuilderStore } from '../store'
import {
  builderSidePanelBody,
  builderPaletteSearch,
  builderPaletteSearchField,
  builderPaletteSearchIcon,
  builderPaletteSearchInput,
  builderPanelPalette,
  builderPanelScroll,
  builderPaletteGrid,
  builderTypeCaption,
  builderTypeOverline,
} from '../ui'
import { BuilderPanelHeader } from './builder-panel-header'
import { PaletteItemRow, type PaletteRowItem } from './palette-item-row'

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
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='group/collapsible'
    >
      <CollapsibleTrigger
        className={cn(
          builderTypeOverline,
          'flex h-8 w-full items-center gap-1.5 rounded-md px-2',
          'hover:bg-muted/50 hover:text-foreground transition-colors duration-150'
        )}
      >
        <ChevronRight className='size-3.5 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90' />
        <span className='truncate'>{title}</span>
        <span className='text-muted-foreground ms-auto tabular-nums'>{count}</span>
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
    const match = (item: PaletteItem) => matchesPaletteSearch(item, query)

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
      searching: Boolean(query.trim()),
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

      <div className={builderSidePanelBody}>
        <Command
          shouldFilter={false}
          className='flex min-h-0 flex-1 flex-col rounded-none bg-transparent'
        >
        <div className={builderPaletteSearch}>
          <div className={builderPaletteSearchField}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='搜索题型'
              className={builderPaletteSearchInput}
            />
            <Search className={builderPaletteSearchIcon} aria-hidden />
          </div>
        </div>

        <ScrollArea className={builderPanelScroll}>
          <CommandList className='max-h-none px-0 py-2'>
            {disabled ? (
              <div className='px-2 pb-2'>
                <Alert className='py-2.5'>
                  <AlertDescription className={builderTypeCaption}>
                    请先在画布选中页面，再添加题型
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            {filtered.total === 0 ? (
              <CommandEmpty className={builderTypeCaption}>
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
      </div>
    </aside>
  )
}
