import * as React from 'react'
import type { ColumnSort, SortDirection, Table } from '@tanstack/react-table'
import {
  ArrowDownUp,
  Check,
  ChevronsUpDown,
  GripVertical,
  Plus,
  RotateCcw,
  Trash2,
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

const SORT_SHORTCUT_KEY = 's'
const REMOVE_SORT_SHORTCUTS = ['backspace', 'delete']

const SORT_ORDERS = [
  { label: 'Asc', value: 'asc' },
  { label: 'Desc', value: 'desc' },
]

interface DataGridSortMenuProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>
}

export function DataGridSortMenu<TData>({
  table,
  ...props
}: DataGridSortMenuProps<TData>) {
  const id = React.useId()
  const labelId = React.useId()
  const descriptionId = React.useId()
  const [open, setOpen] = React.useState(false)
  const addButtonRef = React.useRef<HTMLButtonElement>(null)

  // 当前已应用的排序
  const appliedSorting = table.getState().sorting

  // 待应用的排序（在弹窗中编辑的临时状态）
  const [pendingSorting, setPendingSorting] =
    React.useState<ColumnSort[]>(appliedSorting)

  // 当弹窗打开时，同步已应用的排序到待应用状态
  React.useEffect(() => {
    if (open) {
      setPendingSorting(appliedSorting)
    }
  }, [open, appliedSorting])

  const editingSorting = pendingSorting

  const { columnLabels, columns } = React.useMemo(() => {
    const labels = new Map<string, string>()
    const sortingIds = new Set(editingSorting.map((s) => s.id))
    const availableColumns: { id: string; label: string }[] = []

    for (const column of table.getAllColumns()) {
      if (!column.getCanSort()) continue

      const label = column.columnDef.meta?.label ?? column.id
      labels.set(column.id, label)

      if (!sortingIds.has(column.id)) {
        availableColumns.push({ id: column.id, label })
      }
    }

    return {
      columnLabels: labels,
      columns: availableColumns,
    }
  }, [editingSorting, table])

  const onSortAdd = React.useCallback(() => {
    const firstColumn = columns[0]
    if (!firstColumn) return

    setPendingSorting((prev) => [
      ...prev,
      { id: firstColumn.id, desc: false },
    ])
  }, [columns])

  const onSortUpdate = React.useCallback(
    (sortId: string, updates: Partial<ColumnSort>) => {
      setPendingSorting((prev) =>
        prev.map((sort) =>
          sort.id === sortId ? { ...sort, ...updates } : sort
        )
      )
    },
    []
  )

  const onSortRemove = React.useCallback((sortId: string) => {
    setPendingSorting((prev) => prev.filter((item) => item.id !== sortId))
  }, [])

  // 应用排序
  const applySorting = React.useCallback(() => {
    table.setSorting(pendingSorting)
    setOpen(false)
  }, [table, pendingSorting])

  // 重置（立即应用空排序）
  const onSortingReset = React.useCallback(() => {
    setPendingSorting([])
    table.setSorting(table.initialState.sorting)
  }, [table])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement &&
          event.target.contentEditable === 'true')
      ) {
        return
      }

      if (
        event.key.toLowerCase() === SORT_SHORTCUT_KEY &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        REMOVE_SORT_SHORTCUTS.includes(event.key.toLowerCase()) &&
        appliedSorting.length > 0
      ) {
        event.preventDefault()
        onSortingReset()
      }
    },
    [appliedSorting.length, onSortingReset]
  )

  return (
    <Sortable
      value={editingSorting}
      onValueChange={(newSorting) => setPendingSorting(newSorting)}
      getItemValue={(item) => item.id}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='font-normal'
            onKeyDown={onTriggerKeyDown}
          >
            <ArrowDownUp className='text-muted-foreground' />
            排序
            {appliedSorting.length > 0 && (
              <Badge
                variant='secondary'
                className='h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono text-[10.4px] font-normal'
              >
                {appliedSorting.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          className='flex w-full max-w-(--radix-popover-content-available-width) flex-col gap-3.5 p-4 sm:min-w-[380px]'
          side={props.side ?? 'bottom'}
          align={props.align ?? 'end'}
          onOpenAutoFocus={(e) => e.preventDefault()}
          {...props}
        >
          <div className='flex items-center justify-between gap-2'>
            <div className='flex flex-col gap-1'>
              <h4 id={labelId} className='leading-none font-medium'>
                {editingSorting.length > 0 ? '排序方式' : '未应用排序'}
              </h4>
              <p
                id={descriptionId}
                className={cn(
                  'text-muted-foreground text-sm',
                  editingSorting.length > 0 && 'sr-only'
                )}
              >
                {editingSorting.length > 0
                  ? '修改排序以组织您的行。'
                  : '添加排序以组织您的行。'}
              </p>
            </div>
            <div className='flex items-center gap-1'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-8 w-8 p-0'
                    ref={addButtonRef}
                    onClick={onSortAdd}
                    disabled={columns.length === 0}
                  >
                    <Plus className='h-4 w-4' />
                    <span className='sr-only'>添加</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='top'>添加</TooltipContent>
              </Tooltip>
              {editingSorting.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-8 w-8 p-0'
                      onClick={onSortingReset}
                    >
                      <RotateCcw className='h-4 w-4' />
                      <span className='sr-only'>重置</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>重置</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          {editingSorting.length > 0 && (
            <SortableContent asChild>
              <ul className='flex max-h-[300px] flex-col gap-2 overflow-y-auto p-1'>
                {editingSorting.map((sort) => (
                  <DataTableSortItem
                    key={sort.id}
                    sort={sort}
                    sortItemId={`${id}-sort-${sort.id}`}
                    columns={columns}
                    columnLabels={columnLabels}
                    onSortUpdate={onSortUpdate}
                    onSortRemove={onSortRemove}
                  />
                ))}
              </ul>
            </SortableContent>
          )}
          {editingSorting.length > 0 && (
            <div className='flex w-full items-center justify-end gap-2 border-t pt-3'>
              <Button size='sm' onClick={applySorting} className='rounded'>
                <Check className='mr-2 h-4 w-4' />
                应用
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 h-8 w-[180px] rounded-sm' />
          <div className='bg-primary/10 h-8 w-24 rounded-sm' />
          <div className='bg-primary/10 size-8 shrink-0 rounded-sm' />
          <div className='bg-primary/10 size-8 shrink-0 rounded-sm' />
        </div>
      </SortableOverlay>
    </Sortable>
  )
}

interface DataTableSortItemProps {
  sort: ColumnSort
  sortItemId: string
  columns: { id: string; label: string }[]
  columnLabels: Map<string, string>
  onSortUpdate: (sortId: string, updates: Partial<ColumnSort>) => void
  onSortRemove: (sortId: string) => void
}

function DataTableSortItem({
  sort,
  sortItemId,
  columns,
  columnLabels,
  onSortUpdate,
  onSortRemove,
}: DataTableSortItemProps) {
  const fieldListboxId = `${sortItemId}-field-listbox`
  const fieldTriggerId = `${sortItemId}-field-trigger`
  const directionListboxId = `${sortItemId}-direction-listbox`

  const [showFieldSelector, setShowFieldSelector] = React.useState(false)
  const [showDirectionSelector, setShowDirectionSelector] =
    React.useState(false)

  const onItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLLIElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (showFieldSelector || showDirectionSelector) {
        return
      }

      if (REMOVE_SORT_SHORTCUTS.includes(event.key.toLowerCase())) {
        event.preventDefault()
        onSortRemove(sort.id)
      }
    },
    [sort.id, showFieldSelector, showDirectionSelector, onSortRemove]
  )

  return (
    <SortableItem value={sort.id} asChild>
      <li
        id={sortItemId}
        tabIndex={-1}
        className='flex items-center gap-2'
        onKeyDown={onItemKeyDown}
      >
        <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              id={fieldTriggerId}
              aria-controls={fieldListboxId}
              variant='outline'
              size='sm'
              className='w-44 justify-between rounded font-normal'
            >
              <span className='truncate'>{columnLabels.get(sort.id)}</span>
              <ChevronsUpDown className='opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={fieldListboxId}
            className='w-(--radix-popover-trigger-width) p-0'
          >
            <Command>
              <CommandInput placeholder='搜索字段...' />
              <CommandList>
                <CommandEmpty>未找到字段。</CommandEmpty>
                <CommandGroup>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={(value) => onSortUpdate(sort.id, { id: value })}
                    >
                      <span className='truncate'>{column.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Select
          open={showDirectionSelector}
          onOpenChange={setShowDirectionSelector}
          value={sort.desc ? 'desc' : 'asc'}
          onValueChange={(value: SortDirection) =>
            onSortUpdate(sort.id, { desc: value === 'desc' })
          }
        >
          <SelectTrigger
            aria-controls={directionListboxId}
            className='h-8 w-24 rounded data-size:h-8'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            id={directionListboxId}
            className='min-w-(--radix-select-trigger-width)'
          >
            {SORT_ORDERS.map((order) => (
              <SelectItem key={order.value} value={order.value}>
                {order.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          aria-controls={sortItemId}
          variant='outline'
          size='icon'
          className='size-8 shrink-0 rounded'
          onClick={() => onSortRemove(sort.id)}
        >
          <Trash2 />
        </Button>
        <SortableItemHandle asChild>
          <Button
            variant='outline'
            size='icon'
            className='size-8 shrink-0 rounded'
          >
            <GripVertical />
          </Button>
        </SortableItemHandle>
      </li>
    </SortableItem>
  )
}