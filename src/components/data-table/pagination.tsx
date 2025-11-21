import { type Table } from '@tanstack/react-table'
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  className?: string
}

export function DataTablePagination<TData>({
  table,
  className,
}: DataTablePaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const pageSize = table.getState().pagination.pageSize

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4 overflow-clip px-2 md:justify-between',
        className
      )}
      style={{ overflowClipMargin: 1 }}
    >
      {/* 每页条数选择器 - 移动端隐藏 */}
      <div className='hidden items-center gap-2 md:flex'>
        <span className='text-muted-foreground text-sm whitespace-nowrap'>
          每页
        </span>
        <Select
          value={`${pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value))
          }}
        >
          <SelectTrigger className='h-8 w-[70px]'>
            <SelectValue placeholder={String(pageSize)} />
          </SelectTrigger>
          <SelectContent side='top'>
            {[10, 20, 30, 40, 50, 100].map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-muted-foreground text-sm whitespace-nowrap'>
          条
        </span>
      </div>

      {/* 分页控件 */}
      <div className='flex items-center gap-1 @max-sm/content:gap-0.5'>
        {/* 首页按钮 */}
        <Button
          variant='outline'
          className='size-8 shrink-0 p-0'
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label='前往第一页'
          title='首页'
        >
          <span className='sr-only'>前往第一页</span>
          <ChevronFirstIcon className='size-4' />
        </Button>

        {/* 上一页按钮 */}
        <Button
          variant='outline'
          className='size-8 shrink-0 p-0'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label='前往上一页'
          title='上一页'
        >
          <span className='sr-only'>前往上一页</span>
          <ChevronLeftIcon className='size-4' />
        </Button>

        {/* 页码选择器 */}
        <Select
          value={`${currentPage}`}
          onValueChange={(value) => {
            table.setPageIndex(Number(value) - 1)
          }}
          aria-label='选择页码'
        >
          <SelectTrigger
            id='select-page'
            className='w-fit min-w-[80px] whitespace-nowrap @max-sm/content:min-w-[70px] [&>span[data-slot=select-value]]:hidden'
            aria-label='选择页码'
          >
            <SelectValue placeholder='选择页码' />
            <span className='text-sm'>
              {currentPage} / {totalPages}
            </span>
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <SelectItem key={page} value={String(page)}>
                {page}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 下一页按钮 */}
        <Button
          variant='outline'
          className='size-8 shrink-0 p-0'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label='前往下一页'
          title='下一页'
        >
          <span className='sr-only'>前往下一页</span>
          <ChevronRightIcon className='size-4' />
        </Button>

        {/* 末页按钮 */}
        <Button
          variant='outline'
          className='size-8 shrink-0 p-0'
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          aria-label='前往最后一页'
          title='末页'
        >
          <span className='sr-only'>前往最后一页</span>
          <ChevronLastIcon className='size-4' />
        </Button>
      </div>
    </div>
  )
}
