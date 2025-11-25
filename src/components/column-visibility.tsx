import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import { Check, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
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

interface ColumnVisibilityProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>
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
export function ColumnVisibility<TData>({
  table,
  buttonLabel = '视图',
  showButton = true,
  trigger,
  ...props
}: ColumnVisibilityProps<TData>) {
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
      <PopoverTrigger asChild>
        {trigger ?? (showButton ? defaultTrigger : <></>)}
      </PopoverTrigger>
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
