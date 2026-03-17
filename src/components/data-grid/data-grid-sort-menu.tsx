import * as React from 'react'
import type { ColumnSort, SortDirection, Table } from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Check,
  ChevronsUpDown,
  GripVertical,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const TEXT = {
  SORT_BUTTON: '排序',
  SORT_TITLE_ACTIVE: '排序方式',
  SORT_TITLE_EMPTY: '未应用排序',
  SORT_DESCRIPTION_ACTIVE: '修改排序以组织您的行。',
  SORT_DESCRIPTION_EMPTY: '添加排序以组织您的行。',
  ADD_SORT: '添加',
  RESET_SORT: '重置',
  APPLY_SORT: '应用',
  SEARCH_FIELD: '搜索字段…',
  NO_FIELD_FOUND: '未找到字段',
  ASC: '升序',
  DESC: '降序',
} as const

const SORT_ORDERS: { label: string; value: SortDirection }[] = [
  { label: TEXT.ASC, value: 'asc' },
  { label: TEXT.DESC, value: 'desc' },
]

const SORT_SHORTCUT_KEY = 's'
const REMOVE_SORT_SHORTCUTS = ['backspace', 'delete']

interface SortableColumn {
  id: string
  label: string
}

interface SortContextType<TData> {
  table: Table<TData>
  columnLabels: Map<string, string>
  /** 当前编辑态中尚未被选用的列（供"添加"时使用） */
  availableColumns: SortableColumn[]
  /** 当前编辑态中已选用的列 id 集合（供行项内字段列表过滤使用） */
  editingSortIds: Set<string>
  /** 所有可排序列（含已选用） */
  allSortableColumns: SortableColumn[]
  updateSort: (sortId: string, updates: Partial<ColumnSort>) => void
  removeSort: (sortId: string) => void
}

const SortContext = React.createContext<SortContextType<any> | null>(null)

function useSortContext<TData>(): SortContextType<TData> {
  const ctx = React.use(SortContext)
  if (!ctx) throw new Error('useSortContext 必须在 DataGridSortMenu 内部使用')
  return ctx as SortContextType<TData>
}

function buildColumnMeta<TData>(
  table: Table<TData>,
  editingSortIds: Set<string>
) {
  const columnLabels = new Map<string, string>()
  const allSortableColumns: SortableColumn[] = []
  const availableColumns: SortableColumn[] = []

  for (const column of table.getAllColumns()) {
    if (!column.getCanSort()) continue
    const label = column.columnDef.meta?.label ?? column.id
    columnLabels.set(column.id, label)
    allSortableColumns.push({ id: column.id, label })
    if (!editingSortIds.has(column.id)) {
      availableColumns.push({ id: column.id, label })
    }
  }

  return { columnLabels, allSortableColumns, availableColumns }
}

interface DataGridSortMenuProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>
}

export function DataGridSortMenu<TData>({
  table,
  ...props
}: DataGridSortMenuProps<TData>) {
  const labelId = React.useId()
  const descriptionId = React.useId()
  const [open, setOpen] = React.useState(false)

  const appliedSorting = table.getState().sorting
  const [editingSorting, setEditingSorting] =
    React.useState<ColumnSort[]>(appliedSorting)

  // 打开弹窗时同步已应用的排序；若尚无排序则自动插入第一行
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      if (appliedSorting.length === 0) {
        const firstCol = table.getAllColumns().find((c) => c.getCanSort())
        setEditingSorting(firstCol ? [{ id: firstCol.id, desc: false }] : [])
      } else {
        setEditingSorting(appliedSorting)
      }
    }
    setOpen(newOpen)
  }

  const editingSortIds = React.useMemo(
    () => new Set(editingSorting.map((s) => s.id)),
    [editingSorting]
  )

  const columnMeta = React.useMemo(
    () => buildColumnMeta(table, editingSortIds),
    [table, editingSortIds]
  )

  const updateSort = React.useCallback(
    (sortId: string, updates: Partial<ColumnSort>) =>
      setEditingSorting((prev) =>
        prev.map((s) => (s.id === sortId ? { ...s, ...updates } : s))
      ),
    []
  )

  const removeSort = React.useCallback(
    (sortId: string) =>
      setEditingSorting((prev) => prev.filter((s) => s.id !== sortId)),
    []
  )

  const addSort = React.useCallback(() => {
    const first = columnMeta.availableColumns[0]
    if (!first) return
    setEditingSorting((prev) => [...prev, { id: first.id, desc: false }])
  }, [columnMeta.availableColumns])

  const applySort = React.useCallback(() => {
    table.setSorting(editingSorting)
    setOpen(false)
  }, [table, editingSorting])

  const resetSort = React.useCallback(() => {
    setEditingSorting([])
    table.setSorting(table.initialState.sorting ?? [])
  }, [table])

  // 全局快捷键：Ctrl/Cmd + Shift + S 切换弹窗
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.contentEditable === 'true')
      )
        return
      if (
        e.key.toLowerCase() === SORT_SHORTCUT_KEY &&
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey
      ) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // 触发按钮 Backspace/Delete 快速清空排序
  const onTriggerKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        REMOVE_SORT_SHORTCUTS.includes(e.key.toLowerCase()) &&
        appliedSorting.length > 0
      ) {
        e.preventDefault()
        resetSort()
      }
    },
    [appliedSorting.length, resetSort]
  )

  const removeAppliedSort = React.useCallback(
    (sortId: string) => {
      const next = appliedSorting.filter((s) => s.id !== sortId)
      table.setSorting(next)
    },
    [appliedSorting, table]
  )

  const hasApplied = appliedSorting.length > 0

  const contextValue: SortContextType<TData> = React.useMemo(
    () => ({
      table,
      columnLabels: columnMeta.columnLabels,
      availableColumns: columnMeta.availableColumns,
      allSortableColumns: columnMeta.allSortableColumns,
      editingSortIds,
      updateSort,
      removeSort,
    }),
    [table, columnMeta, editingSortIds, updateSort, removeSort]
  )

  return (
    <SortContext value={contextValue}>
      <Sortable
        value={editingSorting}
        onValueChange={setEditingSorting}
        getItemValue={(item) => item.id}
      >
        <div className='flex flex-wrap items-center gap-1.5'>
          {/* 触发按钮 */}
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant={hasApplied ? 'secondary' : 'outline'}
                size='sm'
                className={cn(
                  'h-8 gap-1.5 font-normal transition-all',
                  hasApplied &&
                    'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 border border-dashed'
                )}
                onKeyDown={onTriggerKeyDown}
              >
                <ArrowDownUp className='h-3.5 w-3.5' />
                {TEXT.SORT_BUTTON}
                {hasApplied && (
                  <Badge
                    variant='secondary'
                    className='ml-0.5 h-[18px] min-w-[18px] rounded px-1 font-mono text-[10px] font-semibold tabular-nums'
                  >
                    {appliedSorting.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              align={props.align ?? 'end'}
              side={props.side ?? 'bottom'}
              className='flex w-full max-w-(--radix-popover-content-available-width) flex-col p-0 sm:min-w-[420px]'
              onOpenAutoFocus={(e) => e.preventDefault()}
              {...props}
            >
              <SortPopoverContent
                labelId={labelId}
                descriptionId={descriptionId}
                editingSorting={editingSorting}
                canAddMore={columnMeta.availableColumns.length > 0}
                onAdd={addSort}
                onReset={resetSort}
                onApply={applySort}
              />
            </PopoverContent>
          </Popover>

          {/* 已应用排序的内联气泡标签 */}
          {appliedSorting.map((sort) => (
            <ActiveSortChip
              key={sort.id}
              label={columnMeta.columnLabels.get(sort.id) ?? sort.id}
              desc={sort.desc}
              onRemove={() => removeAppliedSort(sort.id)}
              onClick={() => setOpen(true)}
            />
          ))}
        </div>

        <SortableOverlay>
          <div className='bg-background flex h-9 items-center gap-2 rounded-md border px-3 opacity-80 shadow-sm'>
            <div className='bg-muted h-2.5 w-36 rounded' />
            <div className='bg-muted h-2.5 w-20 rounded' />
            <div className='bg-muted size-5 rounded' />
            <div className='bg-muted size-5 rounded' />
          </div>
        </SortableOverlay>
      </Sortable>
    </SortContext>
  )
}

function ActiveSortChip({
  label,
  desc,
  onRemove,
  onClick,
}: {
  label: string
  desc: boolean
  onRemove: () => void
  onClick: () => void
}) {
  return (
    <div
      className={cn(
        'group flex h-8 cursor-pointer items-center overflow-hidden rounded-md border',
        'bg-background text-xs transition-colors',
        'hover:border-primary/40 hover:bg-primary/5'
      )}
    >
      <button
        type='button'
        onClick={onClick}
        className='flex h-full items-center gap-1.5 px-2.5 text-left'
      >
        {desc ? (
          <ArrowDown className='text-muted-foreground h-3 w-3 shrink-0' />
        ) : (
          <ArrowUp className='text-muted-foreground h-3 w-3 shrink-0' />
        )}
        <span className='text-foreground font-medium'>{label}</span>
        <span className='text-muted-foreground/60'>·</span>
        <span className='text-muted-foreground'>
          {desc ? TEXT.DESC : TEXT.ASC}
        </span>
      </button>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className={cn(
          'flex h-full items-center border-l px-1.5',
          'text-muted-foreground/50 transition-colors',
          'hover:bg-destructive/10 hover:text-destructive'
        )}
        aria-label={`移除「${label}」排序`}
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  )
}

function SortPopoverContent({
  labelId,
  descriptionId,
  editingSorting,
  canAddMore,
  onAdd,
  onReset,
  onApply,
}: {
  labelId: string
  descriptionId: string
  editingSorting: ColumnSort[]
  canAddMore: boolean
  onAdd: () => void
  onReset: () => void
  onApply: () => void
}) {
  const hasItems = editingSorting.length > 0

  return (
    <>
      {/* 头部 */}
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <div className='flex items-center gap-2'>
          <ArrowDownUp className='text-muted-foreground h-3.5 w-3.5' />
          <div className='flex flex-col'>
            <h4 id={labelId} className='text-sm leading-none font-medium'>
              {hasItems ? TEXT.SORT_TITLE_ACTIVE : TEXT.SORT_TITLE_EMPTY}
            </h4>
            <p
              id={descriptionId}
              className={cn(
                'text-muted-foreground text-xs',
                hasItems ? 'sr-only' : 'mt-0.5'
              )}
            >
              {hasItems
                ? TEXT.SORT_DESCRIPTION_ACTIVE
                : TEXT.SORT_DESCRIPTION_EMPTY}
            </p>
          </div>
          {hasItems && (
            <Badge
              variant='secondary'
              className='h-[18px] rounded px-1.5 font-mono text-[10px] tabular-nums'
            >
              {editingSorting.length}
            </Badge>
          )}
        </div>
        {hasItems && (
          <Button
            size='sm'
            variant='ghost'
            className='text-muted-foreground hover:text-destructive h-7 gap-1 px-2 text-xs'
            onClick={onReset}
          >
            <RotateCcw className='h-3 w-3' />
            {TEXT.RESET_SORT}
          </Button>
        )}
      </div>

      {/* 排序行列表 */}
      {hasItems && (
        <SortableContent asChild>
          <ul className='flex max-h-[360px] flex-col overflow-y-auto px-3 py-2'>
            {editingSorting.map((sort, index) => (
              <SortItem
                key={sort.id}
                sort={sort}
                index={index}
                totalCount={editingSorting.length}
              />
            ))}
          </ul>
        </SortableContent>
      )}

      {/* 底部操作栏 */}
      <div className='bg-muted/30 flex items-center justify-between border-t px-3 py-2.5'>
        <Button
          size='sm'
          variant='ghost'
          className='text-muted-foreground h-7 gap-1.5 px-2 text-xs'
          onClick={onAdd}
          disabled={!canAddMore}
        >
          <Plus className='h-3.5 w-3.5' />
          {TEXT.ADD_SORT}
        </Button>
        <Button
          size='sm'
          onClick={onApply}
          className='h-7 gap-1.5 px-3 text-xs'
        >
          <Check className='h-3.5 w-3.5' />
          {TEXT.APPLY_SORT}
        </Button>
      </div>
    </>
  )
}

function SortItem<TData>({
  sort,
  index,
  totalCount,
}: {
  sort: ColumnSort
  index: number
  totalCount: number
}) {
  const {
    columnLabels,
    allSortableColumns,
    editingSortIds,
    updateSort,
    removeSort,
  } = useSortContext<TData>()

  const [showFieldSelector, setShowFieldSelector] = React.useState(false)

  // 字段选择器的列表：当前列 + 尚未被其他行占用的列
  const fieldSelectorColumns = React.useMemo(
    () =>
      allSortableColumns.filter(
        (col) => col.id === sort.id || !editingSortIds.has(col.id)
      ),
    [allSortableColumns, editingSortIds, sort.id]
  )

  const onItemKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return
      if (showFieldSelector) return
      if (REMOVE_SORT_SHORTCUTS.includes(e.key.toLowerCase())) {
        e.preventDefault()
        removeSort(sort.id)
      }
    },
    [sort.id, showFieldSelector, removeSort]
  )

  return (
    <SortableItem value={sort.id} asChild>
      <li
        tabIndex={-1}
        className='group flex items-center gap-2 py-1'
        onKeyDown={onItemKeyDown}
      >
        {/* 连接符（与 FilterItem 保持一致的视觉语言） */}
        <div className='flex w-10 shrink-0 justify-center'>
          {index === 0 ? (
            <span className='text-muted-foreground text-[11px] font-medium'>
              按
            </span>
          ) : (
            <span className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase'>
              再
            </span>
          )}
        </div>

        {/* 字段选择器 */}
        <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-36 justify-between gap-1 rounded-md px-2.5 font-normal'
            >
              <span className='truncate text-xs'>
                {columnLabels.get(sort.id) ?? sort.id}
              </span>
              <ChevronsUpDown className='h-3 w-3 shrink-0 opacity-40' />
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-44 p-0'>
            <Command>
              <CommandInput
                placeholder={TEXT.SEARCH_FIELD}
                className='h-8 text-xs'
              />
              <CommandList>
                <CommandEmpty className='text-muted-foreground py-4 text-center text-xs'>
                  {TEXT.NO_FIELD_FOUND}
                </CommandEmpty>
                <CommandGroup>
                  {fieldSelectorColumns.map((col) => (
                    <CommandItem
                      key={col.id}
                      value={col.id}
                      className='text-xs'
                      onSelect={(val) => {
                        updateSort(sort.id, { id: val })
                        setShowFieldSelector(false)
                      }}
                    >
                      <span className='truncate'>{col.label}</span>
                      {col.id === sort.id && (
                        <Check className='ml-auto h-3.5 w-3.5' />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* 方向选择器 */}
        <Select
          value={sort.desc ? 'desc' : 'asc'}
          onValueChange={(val: SortDirection) =>
            updateSort(sort.id, { desc: val === 'desc' })
          }
        >
          <SelectTrigger
            size='sm'
            className='h-8 w-20 rounded-md px-2.5 text-xs font-normal'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_ORDERS.map((order) => (
              <SelectItem
                key={order.value}
                value={order.value}
                className='text-xs'
              >
                {order.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 行操作（悬停渐显，与 FilterItem 一致） */}
        <div className='flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-destructive h-8 w-7'
                onClick={() => removeSort(sort.id)}
              >
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='top' className='text-xs'>
              删除
            </TooltipContent>
          </Tooltip>

          {totalCount > 1 && (
            <SortableItemHandle asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground h-8 w-7 cursor-grab active:cursor-grabbing'
              >
                <GripVertical className='h-3.5 w-3.5' />
              </Button>
            </SortableItemHandle>
          )}
        </div>
      </li>
    </SortableItem>
  )
}
