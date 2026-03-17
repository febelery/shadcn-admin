import * as React from 'react'
import type { ColumnFilter, ColumnFiltersState } from '@tanstack/react-table'
import type { FilterOperator, FilterValue } from '@/types/data-grid'
import {
  Filter,
  RotateCcw,
  Plus,
  Check as CheckIcon,
  ChevronsUpDown,
  Trash2,
  GripVertical,
} from 'lucide-react'
import {
  getOperatorsForVariant,
  getDefaultOperator,
} from '@/lib/data-grid-filters'
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
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from '@/components/ui/sortable'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FilterInput } from './filter-inputs'
import { useFilterContext, TEXT, NO_VALUE_OPERATORS } from './index'

export function FilterPopoverContent({
  labelId,
  editingFilters,
  isPending,
  canAddMore,
  onAdd,
  onReset,
  onApply,
}: {
  labelId: string
  editingFilters: ColumnFiltersState
  isPending: boolean
  canAddMore: boolean
  onAdd: () => void
  onReset: () => void
  onApply: () => void
}) {
  return (
    <>
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <div className='flex items-center gap-2'>
          <Filter className='text-muted-foreground h-3.5 w-3.5' />
          <h4 id={labelId} className='text-sm font-medium'>
            {TEXT.FILTER_TITLE}
          </h4>
          {editingFilters.length > 0 && (
            <Badge
              variant='secondary'
              className='h-[18px] rounded px-1.5 font-mono text-[10px] tabular-nums'
            >
              {editingFilters.length}
            </Badge>
          )}
        </div>
        {editingFilters.length > 0 && (
          <Button
            size='sm'
            variant='ghost'
            className='text-muted-foreground hover:text-destructive h-7 gap-1 px-2 text-xs'
            onClick={onReset}
            disabled={isPending}
          >
            <RotateCcw className='h-3 w-3' />
            {TEXT.RESET_FILTER}
          </Button>
        )}
      </div>

      <SortableContent asChild>
        <ul className='flex max-h-[360px] flex-col overflow-y-auto px-3 py-2'>
          {editingFilters.map((filter, index) => (
            <FilterItem
              key={filter.id}
              filter={filter}
              index={index}
              totalCount={editingFilters.length}
            />
          ))}
        </ul>
      </SortableContent>

      <div className='bg-muted/30 flex items-center justify-between border-t px-3 py-2.5'>
        <Button
          size='sm'
          variant='ghost'
          className='text-muted-foreground h-7 gap-1.5 px-2 text-xs'
          onClick={onAdd}
          disabled={!canAddMore}
        >
          <Plus className='h-3.5 w-3.5' />
          {TEXT.ADD_FILTER}
        </Button>
        <Button
          size='sm'
          onClick={onApply}
          disabled={isPending}
          className='h-7 gap-1.5 px-3 text-xs'
        >
          <CheckIcon className='h-3.5 w-3.5' />
          {isPending ? TEXT.APPLYING : TEXT.APPLY_FILTER}
        </Button>
      </div>
    </>
  )
}

function FilterItem<TData>({
  filter,
  index,
  totalCount,
}: {
  filter: ColumnFilter
  index: number
  totalCount: number
}) {
  const {
    allFilterableColumns,
    editingFilterIds,
    columnLabels,
    columnVariants,
    allowedOperatorsMap,
    updateFilter,
    removeFilter,
    changeFilterField,
  } = useFilterContext<TData>()
  const [showFieldSelector, setShowFieldSelector] = React.useState(false)

  const variant = columnVariants.get(filter.id) ?? 'short-text'
  const filterValue = filter.value as FilterValue | undefined
  const operator = filterValue?.operator ?? getDefaultOperator(variant)

  const operators = React.useMemo(() => {
    const all = getOperatorsForVariant(variant)
    const allowed = allowedOperatorsMap.get(filter.id)
    return allowed ? all.filter((op) => allowed.includes(op.value)) : all
  }, [variant, allowedOperatorsMap, filter.id])

  React.useEffect(() => {
    const allowed = allowedOperatorsMap.get(filter.id)
    if (allowed?.length && !allowed.includes(operator)) {
      updateFilter(filter.id, {
        value: { ...filterValue, operator: allowed[0] },
      })
    }
  }, [allowedOperatorsMap, filter.id, operator, filterValue, updateFilter])

  const fieldSelectorColumns = React.useMemo(
    () =>
      allFilterableColumns.filter(
        (col) => col.value === filter.id || !editingFilterIds.has(col.value)
      ),
    [allFilterableColumns, editingFilterIds, filter.id]
  )
  const needsValue = !NO_VALUE_OPERATORS.has(operator)
  const needsSecondValue = operator === 'between'

  return (
    <SortableItem value={filter.id} asChild>
      <li className='group flex items-start gap-2 py-1'>
        <div className='mt-1.5 flex w-10 shrink-0 justify-center'>
          {index === 0 ? (
            <span className='text-muted-foreground text-[11px] font-medium'>
              {TEXT.CONNECTOR_FIRST}
            </span>
          ) : (
            <span className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase'>
              {TEXT.CONNECTOR_REST}
            </span>
          )}
        </div>

        <div className='flex min-w-0 flex-1 flex-wrap items-center gap-1.5'>
          <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-8 w-28 justify-between gap-1 rounded-md px-2.5 font-normal'
              >
                <span className='truncate text-xs'>
                  {columnLabels.get(filter.id) ?? filter.id}
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
                        key={col.value}
                        value={col.value}
                        className='text-xs'
                        onSelect={(val) => {
                          changeFilterField(filter.id, val)
                          setShowFieldSelector(false)
                        }}
                      >
                        <span className='truncate'>{col.label}</span>
                        {col.value === filter.id && (
                          <CheckIcon className='ml-auto h-3.5 w-3.5' />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Select
            value={operator}
            onValueChange={(val: FilterOperator) =>
              updateFilter(filter.id, {
                value: { ...filterValue, operator: val },
              })
            }
          >
            <SelectTrigger
              size='sm'
              className='h-8 w-28 rounded-md px-2.5 text-xs font-normal lowercase'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem
                  key={op.value}
                  value={op.value}
                  className='text-xs lowercase'
                >
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {needsValue ? (
            <div className='flex min-w-[120px] flex-1 flex-col gap-1'>
              <FilterInput
                filterId={filter.id}
                variant={variant}
                operator={operator}
                value={filterValue?.value}
                onChange={(val) =>
                  updateFilter(filter.id, {
                    value: { ...filterValue, operator, value: val },
                  })
                }
              />
              {needsSecondValue && (
                <FilterInput
                  filterId={filter.id}
                  variant={variant}
                  operator={operator}
                  value={filterValue?.value2}
                  placeholder={TEXT.END_VALUE_PLACEHOLDER}
                  onChange={(val) =>
                    updateFilter(filter.id, {
                      value: {
                        ...filterValue,
                        operator,
                        value2: val as string | number,
                      },
                    })
                  }
                />
              )}
            </div>
          ) : (
            <div className='bg-muted/30 h-8 min-w-[80px] flex-1 rounded-md border border-dashed' />
          )}
        </div>

        <div className='mt-0.5 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-destructive h-8 w-7'
                onClick={() => removeFilter(filter.id)}
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
