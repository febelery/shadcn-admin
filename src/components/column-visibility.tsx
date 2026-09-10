import * as React from 'react'
import { cn } from 'cn'
import { Check, Settings2 } from 'lucide-react'
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

export interface ColumnVisibilityColumn {
  id: string
  accessorFn?: unknown
  getCanHide: () => boolean
  getIsVisible: () => boolean
  toggleVisibility: (updater?: boolean) => void
  columnDef: {
    meta?: {
      label?: string
    }
  }
}

export interface ColumnVisibilityTable {
  getAllColumns: () => ColumnVisibilityColumn[]
}

interface ColumnVisibilityProps extends React.ComponentProps<
  typeof PopoverContent
> {
  table: ColumnVisibilityTable
  /**
   * 按钮文本，默认为 "视图"
   */
  buttonLabel?: string
  /**
   * 是否显示按钮，默认为 true
   */
  showButton?: boolean
  /**
   * 自定义触发按钮，如果提供则使用自定义按钮
   */
  trigger?: React.ReactNode
}

/**
 * 列可见性切换组件
 * 提供搜索和切换表格列显示/隐藏的功能
 */
export function ColumnVisibility({
  table,
  buttonLabel = '视图',
  showButton = true,
  trigger,
  ...props
}: ColumnVisibilityProps) {
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== 'undefined' && column.getCanHide()
        ),
    [table]
  )

  const defaultTrigger = (
    <Button
      aria-label='Toggle columns'
      role='combobox'
      variant='outline'
      size='sm'
      className='hidden h-8 font-normal lg:flex'
    >
      <Settings2 className='text-muted-foreground' />
      {buttonLabel}
    </Button>
  )

  return (
    <Popover>
      <PopoverTrigger
        render={
          trigger
            ? (trigger as React.ReactElement)
            : showButton
              ? defaultTrigger
              : undefined
        }
      />
      <PopoverContent className='w-44 p-0' align='end' {...props}>
        <Command>
          <CommandInput placeholder='搜索列...' />
          <CommandList>
            <CommandEmpty>未找到列。</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  onSelect={() =>
                    column.toggleVisibility(!column.getIsVisible())
                  }
                >
                  <span className='truncate'>
                    {column.columnDef.meta?.label ?? column.id}
                  </span>
                  <Check
                    className={cn(
                      'ml-auto size-4 shrink-0',
                      column.getIsVisible() ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
