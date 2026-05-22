import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import {
  AlignVerticalSpaceAroundIcon,
  ChevronsDownUpIcon,
  EqualIcon,
  MinusIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const rowHeights = [
  {
    label: '短',
    value: 'short' as const,
    icon: MinusIcon,
  },
  {
    label: '中',
    value: 'medium' as const,
    icon: EqualIcon,
  },
  {
    label: '高',
    value: 'tall' as const,
    icon: AlignVerticalSpaceAroundIcon,
  },
  {
    label: '超高',
    value: 'extra-tall' as const,
    icon: ChevronsDownUpIcon,
  },
] as const

interface DataGridRowHeightMenuProps<TData> extends React.ComponentProps<
  typeof SelectContent
> {
  table: Table<TData>
}

export function DataGridRowHeightMenu<TData>({
  table,
  className,
  ...props
}: DataGridRowHeightMenuProps<TData>) {
  const rowHeight = table.options.meta?.rowHeight
  const onRowHeightChange = table.options.meta?.onRowHeightChange

  const selectedRowHeight = React.useMemo(() => {
    return (
      rowHeights.find((opt) => opt.value === rowHeight) ?? {
        label: '短',
        value: 'short' as const,
        icon: MinusIcon,
      }
    )
  }, [rowHeight])

  return (
    <Select value={rowHeight} onValueChange={onRowHeightChange}>
      <SelectTrigger
        size='sm'
        className='h-8 w-[58px] shrink-0 justify-center gap-0 px-0 [&_[data-slot=select-value]]:flex-none [&_svg:nth-child(2)]:hidden'
      >
        <SelectValue placeholder='行高'>
          <span className='flex items-center justify-center gap-1.5'>
            <selectedRowHeight.icon className='size-4' />
            <span>{selectedRowHeight.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className={cn('w-[96px] min-w-[96px]', className)}
        {...props}
      >
        {rowHeights.map((option) => {
          const OptionIcon = option.icon
          return (
            <SelectItem
              key={option.value}
              value={option.value}
              className='[&_span:last-child]:flex [&_span:last-child]:items-center [&_span:last-child]:gap-2'
            >
              <OptionIcon className='size-4' />
              {option.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
