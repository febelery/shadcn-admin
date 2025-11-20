import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { cn, getPageNumbers } from '@/lib/utils'
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
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div
      className={cn(
        'flex items-center justify-between overflow-clip px-2',
        '@max-2xl/content:flex-col-reverse @max-2xl/content:gap-4',
        className
      )}
      style={{ overflowClipMargin: 1 }}
    >
      <div className='flex w-full items-center justify-between'>
        <div className='flex min-w-[120px] items-center justify-center text-sm font-medium @2xl/content:hidden'>
          <span className='whitespace-nowrap'>
            第 {currentPage} / {totalPages} 页
          </span>
        </div>
        <div className='flex items-center gap-2 @max-2xl/content:flex-row-reverse'>
          <span className='text-muted-foreground whitespace-nowrap'>每页</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-muted-foreground whitespace-nowrap'>条</span>
        </div>
      </div>

      <div className='flex items-center sm:space-x-6 lg:space-x-8'>
        <div className='flex min-w-18 items-center justify-center text-sm font-medium @max-3xl/content:hidden'>
          <span className='whitespace-nowrap'>
            第 {currentPage} / {totalPages} 页
          </span>
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            className='size-8 shrink-0 p-0 @max-md/content:hidden'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title='首页'
          >
            <span className='sr-only'>转到第一页</span>
            <DoubleArrowLeftIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='size-8 shrink-0 p-0'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title='上一页'
          >
            <span className='sr-only'>转到上一页</span>
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>

          {/* 页码按钮 */}
          <div className='flex items-center space-x-1'>
            {pageNumbers.map((pageNumber, index) => (
              <div
                key={`${pageNumber}-${index}`}
                className='flex shrink-0 items-center'
              >
                {pageNumber === '...' ? (
                  <span className='text-muted-foreground px-1 text-sm'>
                    ...
                  </span>
                ) : (
                  <Button
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    className='h-8 min-w-8 px-2'
                    onClick={() =>
                      table.setPageIndex((pageNumber as number) - 1)
                    }
                    title={`第 ${pageNumber} 页`}
                  >
                    <span className='sr-only'>转到第 {pageNumber} 页</span>
                    {pageNumber}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            variant='outline'
            className='size-8 shrink-0 p-0'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title='下一页'
          >
            <span className='sr-only'>转到下一页</span>
            <ChevronRightIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='size-8 shrink-0 p-0 @max-md/content:hidden'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title='末页'
          >
            <span className='sr-only'>转到最后一页</span>
            <DoubleArrowRightIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
